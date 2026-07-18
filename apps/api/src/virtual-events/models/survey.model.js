const { query } = require('../utils/db');
const crypto = require('crypto');

class Survey {
  constructor(data) {
    this._id = data._id || data.id || crypto.randomBytes(12).toString('hex');
    this.user = data.user || data.user_id || '';
    this.answers = Array.isArray(data.answers) ? data.answers : (typeof data.answers === 'string' ? JSON.parse(data.answers) : (data.answers || []));
    this.createdAt = data.createdAt || data.created_at || new Date();
    this.updatedAt = data.updatedAt || data.updated_at || new Date();
  }

  async save() {
    this.updatedAt = new Date();
    const { rows } = await query('SELECT 1 FROM ve_surveys WHERE _id = $1', [this._id]);
    if (rows.length > 0) {
      await query(
        'UPDATE ve_surveys SET user_id = $1, answers = $2, updated_at = $3 WHERE _id = $4',
        [this.user.toString(), JSON.stringify(this.answers), this.updatedAt, this._id]
      );
    } else {
      await query(
        'INSERT INTO ve_surveys (_id, user_id, answers, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)',
        [this._id, this.user.toString(), JSON.stringify(this.answers), this.createdAt, this.updatedAt]
      );
    }
    return this;
  }

  static async findOne(conditions) {
    let sql = 'SELECT * FROM ve_surveys';
    const keys = Object.keys(conditions);
    const params = [];
    if (keys.length > 0) {
      sql += ' WHERE ';
      sql += keys.map((key, i) => {
        const col = key === 'user' ? 'user_id' : key;
        params.push(conditions[key]);
        return `${col} = $${i + 1}`;
      }).join(' AND ');
    }
    sql += ' LIMIT 1';
    const { rows } = await query(sql, params);
    if (rows.length === 0) return null;
    return new Survey(rows[0]);
  }

  static find() {
    let sql = 'SELECT * FROM ve_surveys';
    const queryObj = {
      then: function(resolve, reject) {
        query(sql)
          .then(({ rows }) => resolve(rows.map(r => new Survey(r))))
          .catch(reject);
      }
    };
    return queryObj;
  }
}

module.exports = Survey;
