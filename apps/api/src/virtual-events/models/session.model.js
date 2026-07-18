const { query } = require('../utils/db');
const crypto = require('crypto');

class Session {
  constructor(data) {
    this._id = data._id || data.id || crypto.randomBytes(12).toString('hex');
    this.topic = data.topic || '';
    this.time = data.time || '';
    this.videoUrl = data.videoUrl || data.video_url || '';
    this.createdAt = data.createdAt || data.created_at || new Date();
    this.updatedAt = data.updatedAt || data.updated_at || new Date();
  }

  async save() {
    this.updatedAt = new Date();
    const { rows } = await query('SELECT 1 FROM ve_sessions WHERE _id = $1', [this._id]);
    if (rows.length > 0) {
      await query(
        'UPDATE ve_sessions SET topic = $1, time = $2, video_url = $3, updated_at = $4 WHERE _id = $5',
        [this.topic, this.time, this.videoUrl, this.updatedAt, this._id]
      );
    } else {
      await query(
        'INSERT INTO ve_sessions (_id, topic, time, video_url, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [this._id, this.topic, this.time, this.videoUrl, this.createdAt, this.updatedAt]
      );
    }
    return this;
  }

  static find() {
    let sql = 'SELECT * FROM ve_sessions';
    const queryObj = {
      sort: function(opts) {
        if (opts.createdAt) {
          sql += ` ORDER BY created_at ${opts.createdAt === -1 ? 'DESC' : 'ASC'}`;
        }
        return this;
      },
      then: function(resolve, reject) {
        query(sql)
          .then(({ rows }) => resolve(rows.map(r => new Session(r))))
          .catch(reject);
      }
    };
    return queryObj;
  }

  static async findByIdAndDelete(id) {
    await query('DELETE FROM ve_sessions WHERE _id = $1', [id]);
  }
}

module.exports = Session;
