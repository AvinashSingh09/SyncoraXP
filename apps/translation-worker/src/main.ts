import { hostname } from "node:os";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { loadTranslationWorkerConfig } from "./config";
import { TranslationJobRunner } from "./jobs/translation-job-runner";
import { TranslationJobStore } from "./jobs/translation-job-store";

const config = loadTranslationWorkerConfig();
const workerInstanceId =
  config.TRANSLATION_WORKER_ID ?? `${hostname()}:${process.pid}:${randomUUID()}`;
const pool = new Pool({
  connectionString: config.DATABASE_URL,
  // The worker processes one job at a time. Keeping this pool small avoids
  // reserving unnecessary Supavisor session-mode connections.
  max: 2,
  connectionTimeoutMillis: 10_000,
  idleTimeoutMillis: 30_000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10_000,
});
const store = new TranslationJobStore(pool);
let shuttingDown = false;
let activeRunner: TranslationJobRunner | null = null;
let consecutivePollingFailures = 0;

const delay = (duration: number) => new Promise((resolve) => setTimeout(resolve, duration));
const pollingRetryDelay = () =>
  Math.min(
    config.TRANSLATION_JOB_POLL_MS * 2 ** Math.min(consecutivePollingFailures - 1, 5),
    30_000,
  );

// pg emits errors from idle clients on the Pool itself. Without a listener,
// Node treats them as unhandled EventEmitter errors and terminates the worker.
// pg removes the failed client from the pool; the next query creates a new one.
pool.on("error", (error) => {
  console.error("Translation worker database pool connection failed", error);
});

const shutdown = () => {
  if (shuttingDown) return;
  shuttingDown = true;
  activeRunner?.stop();
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log(
  config.TRANSLATION_PROVIDER === "fake"
    ? `Translation worker ${workerInstanceId} started with fake media processing`
    : `Translation worker ${workerInstanceId} started with host-selected provider routing`,
);

while (!shuttingDown) {
  try {
    const job = await store.claimNext(workerInstanceId, config.TRANSLATION_WORKER_LEASE_MS);
    consecutivePollingFailures = 0;
    if (!job) {
      await delay(config.TRANSLATION_JOB_POLL_MS);
      continue;
    }
    activeRunner = new TranslationJobRunner(job, workerInstanceId, config, store);
    try {
      await activeRunner.run();
      if (!shuttingDown) await store.complete(job.id, workerInstanceId, "completed");
    } catch (error) {
      console.error(`Translation run ${job.id} failed`, error);
      if (!shuttingDown) {
        await store.complete(job.id, workerInstanceId, "failed", {
          code: error instanceof Error ? error.name || "translation_job_failed" : "translation_job_failed",
          detail: error instanceof Error ? error.message.slice(0, 1_000) : "Unknown translation error",
        });
      }
    } finally {
      activeRunner = null;
    }
  } catch (error) {
    consecutivePollingFailures += 1;
    const retryDelay = pollingRetryDelay();
    console.error(
      `Translation worker polling failed; retrying in ${retryDelay}ms`,
      error,
    );
    await delay(retryDelay);
  }
}

await pool.end();
