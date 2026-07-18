import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnvFile } from "node:process";
import pg from "pg";

const environmentPath = resolve(import.meta.dirname, "../../../.env");
if (existsSync(environmentPath)) loadEnvFile(environmentPath);

const pool = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL ??
    "postgres://postgres:postgres@localhost:5432/voice_meetings",
});

try {
  if (process.argv.includes("--retry-stalled")) {
    const retried = await pool.query(`
      UPDATE meeting_translation_runs run
      SET status = 'queued',
          worker_instance_id = NULL,
          lease_expires_at = NULL,
          last_heartbeat_at = NULL,
          ended_at = NULL,
          error_code = NULL,
          error_detail = NULL,
          updated_at = now()
      FROM meeting_translation_settings settings
      WHERE settings.meeting_id = run.meeting_id
        AND settings.enabled = true
        AND (
          run.status = 'failed'
          OR (
            run.status IN ('starting', 'active', 'reconnecting')
            AND run.lease_expires_at IS NOT NULL
            AND run.lease_expires_at < now()
          )
          OR (
            run.status = 'stopping'
            AND (
              run.worker_instance_id IS NULL
              OR run.lease_expires_at IS NULL
              OR run.lease_expires_at < now()
            )
          )
        )
        AND NOT EXISTS (
          SELECT 1
          FROM meeting_translation_runs active_run
          WHERE active_run.meeting_id = run.meeting_id
            AND active_run.id <> run.id
            AND active_run.status IN ('queued', 'starting', 'active', 'reconnecting', 'stopping')
        )
      RETURNING run.id
    `);
    console.log(`Requeued ${retried.rowCount ?? 0} stalled translation run(s).`);
  }

  const result = await pool.query(`
    SELECT
      run.id,
      run.meeting_id,
      run.status,
      run.worker_instance_id,
      run.last_heartbeat_at,
      run.error_code,
      run.error_detail,
      settings.enabled
    FROM meeting_translation_runs run
    JOIN meeting_translation_settings settings
      ON settings.meeting_id = run.meeting_id
    ORDER BY run.created_at DESC
    LIMIT 10
  `);

  if (result.rows.length === 0) {
    console.log("No translation runs have been queued.");
  } else {
    console.table(result.rows);
  }
} finally {
  await pool.end();
}
