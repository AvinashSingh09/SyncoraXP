const { query } = require('../utils/db');
const crypto = require('crypto');

class PhotoboothSession {
  constructor(data) {
    this._id = data._id || data.id || crypto.randomBytes(12).toString('hex');
    this.userId = data.userId || data.user_id || '';
    this.sourceImage = data.sourceImage || data.source_image || '';
    this.resultImage = data.resultImage || data.result_image || '';
    this.style = data.style || '';
    this.nickname = data.nickname || '';
    this.backstory = data.backstory || '';
    this.createdAt = data.createdAt || data.created_at || new Date();
  }

  async save() {
    const { rows } = await query('SELECT 1 FROM ve_photobooth_sessions WHERE _id = $1', [this._id]);
    if (rows.length > 0) {
      await query(
        `UPDATE ve_photobooth_sessions SET 
          user_id = $1, source_image = $2, result_image = $3, style = $4,
          nickname = $5, backstory = $6
         WHERE _id = $7`,
        [
          this.userId.toString(), this.sourceImage, this.resultImage, this.style,
          this.nickname, this.backstory, this._id
        ]
      );
    } else {
      await query(
        `INSERT INTO ve_photobooth_sessions (
          _id, user_id, source_image, result_image, style, 
          nickname, backstory, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          this._id, this.userId.toString(), this.sourceImage, this.resultImage, this.style,
          this.nickname, this.backstory, this.createdAt
        ]
      );
    }
    return this;
  }

  static find(conditions = {}) {
    let sql = 'SELECT * FROM ve_photobooth_sessions';
    const keys = Object.keys(conditions);
    const params = [];
    if (keys.length > 0) {
      sql += ' WHERE ';
      sql += keys.map((key, i) => {
        const col = key === 'userId' ? 'user_id' : key;
        params.push(conditions[key].toString());
        return `${col} = $${i + 1}`;
      }).join(' AND ');
    }
    
    const queryObj = {
      sort: function(opts) {
        if (opts.createdAt) {
          sql += ` ORDER BY created_at ${opts.createdAt === -1 ? 'DESC' : 'ASC'}`;
        }
        return this;
      },
      then: function(resolve, reject) {
        query(sql, params)
          .then(({ rows }) => resolve(rows.map(r => new PhotoboothSession(r))))
          .catch(reject);
      }
    };
    return queryObj;
  }
}

module.exports = PhotoboothSession;
