import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { Pool } from "pg";
import { loadConfig } from "../config";

const config = loadConfig();
const pool = new Pool({ connectionString: config.DATABASE_URL });

try {
  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    filename text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`);
  const migrationDirectory = resolve(process.cwd(), "../../database/migrations");
  const files = (await readdir(migrationDirectory)).filter((file) => file.endsWith(".sql")).sort();

  for (const filename of files) {
    const applied = await pool.query("SELECT 1 FROM schema_migrations WHERE filename = $1", [filename]);
    if (applied.rowCount) continue;

    if (filename === "001_create_meetings.sql") {
      const existing = await pool.query("SELECT to_regclass('public.meetings') AS table_name");
      if (existing.rows[0]?.table_name) {
        await pool.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [filename]);
        console.log(`Baselined existing ${filename}`);
        continue;
      }
    }

    const migration = await readFile(resolve(migrationDirectory, filename), "utf8");
    await pool.query(migration);
    await pool.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [filename]);
    console.log(`Applied ${filename}`);
  }
} finally {
  await pool.end();
}
