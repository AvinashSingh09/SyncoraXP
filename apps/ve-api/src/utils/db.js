const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/voice_meetings';

const pool = new Pool({
  connectionString,
});

const query = (text, params) => pool.query(text, params);

const initDb = async () => {
  try {
    console.log('Initializing PostgreSQL database for Virtual Events...');
    const sqlPath = path.resolve(__dirname, '../../../../database/migrations/004_create_virtual_events_tables.sql');
    
    if (fs.existsSync(sqlPath)) {
      const sql = fs.readFileSync(sqlPath, 'utf8');
      await pool.query(sql);
      console.log('PostgreSQL tables for Virtual Events initialized/verified.');
    } else {
      console.warn('Migration SQL file not found at:', sqlPath);
    }
  } catch (error) {
    console.error('Failed to initialize PostgreSQL tables for Virtual Events:', error);
    throw error;
  }
};

module.exports = {
  pool,
  query,
  initDb
};
