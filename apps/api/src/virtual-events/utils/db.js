const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/voice_meetings';

const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 5000,
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
