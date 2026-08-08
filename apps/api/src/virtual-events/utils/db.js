const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// This module is imported before the main TypeScript config loader runs.
// Load the repository environment file here so Virtual Events uses the same
// database as the rest of the API during local development.
const rootEnvironmentPath = path.resolve(__dirname, '../../../../../.env');
if (fs.existsSync(rootEnvironmentPath)) process.loadEnvFile(rootEnvironmentPath);

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/voice_meetings';

const isRemotePg = connectionString.includes('supabase') || connectionString.includes('neon') || connectionString.includes('sslmode=');

console.log('[ve-db] Connecting to:', connectionString.replace(/:([^:@]+)@/, ':***@'));

const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 5000,
  ...(isRemotePg ? { ssl: { rejectUnauthorized: false } } : {}),
});

// Ensure all queries run in public schema (important for Supabase pooled connections)
pool.on('connect', (client) => {
  client.query("SET search_path TO public");
});

const query = (text, params) => pool.query(text, params);

const initDb = async () => {
  try {
    console.log('Initializing PostgreSQL database for Virtual Events...');
    const candidatePaths = [
      path.resolve(__dirname, '../../../../../database/migrations/004_create_virtual_events_tables.sql'),
      path.resolve(__dirname, '../../../../database/migrations/004_create_virtual_events_tables.sql'),
      path.resolve(__dirname, '../../../database/migrations/004_create_virtual_events_tables.sql'),
      path.resolve(process.cwd(), '../../database/migrations/004_create_virtual_events_tables.sql'),
      path.resolve(process.cwd(), '../database/migrations/004_create_virtual_events_tables.sql'),
      path.resolve(process.cwd(), 'database/migrations/004_create_virtual_events_tables.sql'),
      '/app/database/migrations/004_create_virtual_events_tables.sql',
    ];
    const sqlPath = candidatePaths.find((p) => fs.existsSync(p));

    if (sqlPath) {
      const sql = fs.readFileSync(sqlPath, 'utf8');
      await pool.query(sql);
      await pool.query("ALTER TABLE ve_polls ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'auditorium'");
      await pool.query("ALTER TABLE ve_polls ADD COLUMN IF NOT EXISTS chart_type VARCHAR(50) DEFAULT 'bar'");
      await pool.query("ALTER TABLE ve_polls ADD COLUMN IF NOT EXISTS hide_results_until_closed BOOLEAN DEFAULT FALSE");
      await pool.query("ALTER TABLE ve_polls ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 0");
      await pool.query("ALTER TABLE ve_polls ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE NULL");

      await pool.query("ALTER TABLE ve_quizzes ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'auditorium'");
      await pool.query("ALTER TABLE ve_quizzes ADD COLUMN IF NOT EXISTS chart_type VARCHAR(50) DEFAULT 'bar'");
      await pool.query("ALTER TABLE ve_quizzes ADD COLUMN IF NOT EXISTS hide_results_until_closed BOOLEAN DEFAULT FALSE");
      await pool.query("ALTER TABLE ve_quizzes ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 0");
      await pool.query("ALTER TABLE ve_quizzes ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE NULL");
      console.log('PostgreSQL tables for Virtual Events initialized/verified.');
    } else {
      console.warn('Migration SQL file not found in any candidate path.');
    }
  } catch (error) {
    console.error('Failed to initialize PostgreSQL tables for Virtual Events:', error);
  }
};

module.exports = {
  pool,
  query,
  initDb
};
