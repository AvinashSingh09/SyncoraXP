import { hostname } from "node:os";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { loadTranslationWorkerConfig } from "./config";
import { TranslationJobRunner } from "./jobs/translation-job-runner";
import { TranslationJobStore } from "./jobs/translation-job-store";

const config = loadTranslationWorkerConfig();
const workerInstanceId =
  config.TRANSLATION_WORKER_ID ?? `${hostname()}:${process.pid}:${randomUUID()}`;
const pool = new Pool({ connectionString: config.DATABASE_URL, max: 5 });
const store = new TranslationJobStore(pool);
let shuttingDown = false;
let activeRunner: TranslationJobRunner | null = null;

const delay = (duration: number) => new Promise((resolve) => setTimeout(resolve, duration));

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
    console.error("Translation worker polling failed", error);
    await delay(config.TRANSLATION_JOB_POLL_MS);
  }
}

await pool.end();
