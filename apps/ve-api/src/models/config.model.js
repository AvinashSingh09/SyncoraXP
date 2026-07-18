const { query } = require('../utils/db');

class Config {
  constructor(data) {
    this.key = data.key || '';
    this.value = data.value || '';
    this.createdAt = data.createdAt || data.created_at || new Date();
    this.updatedAt = data.updatedAt || data.updated_at || new Date();
  }

  static async findOne(conditions) {
    const key = conditions.key;
    const { rows } = await query('SELECT * FROM ve_configs WHERE key = $1', [key]);
    if (!rows[0]) return null;
    return new Config(rows[0]);
  }

  static async find(conditions) {
    if (conditions && conditions.key && conditions.key.$in) {
      const keys = conditions.key.$in;
      if (keys.length === 0) return [];
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(',');
      const { rows } = await query(`SELECT * FROM ve_configs WHERE key IN (${placeholders})`, keys);
      return rows.map(r => new Config(r));
    }
    const { rows } = await query('SELECT * FROM ve_configs');
    return rows.map(r => new Config(r));
  }

  static async findOneAndUpdate(conditions, update) {
    const key = conditions.key;
    const value = update.value;
    const existing = await Config.findOne({ key });
    const now = new Date();
    if (existing) {
      await query(
        'UPDATE ve_configs SET value = $1, updated_at = $2 WHERE key = $3',
        [value, now, key]
      );
      return new Config({ key, value, created_at: existing.createdAt, updated_at: now });
    } else {
      await query(
        'INSERT INTO ve_configs (key, value, created_at, updated_at) VALUES ($1, $2, $3, $4)',
        [key, value, now, now]
      );
      return new Config({ key, value, created_at: now, updated_at: now });
    }
  }
}

module.exports = Config;
