const { query } = require('../utils/db');
const crypto = require('crypto');

class Qna {
  constructor(data) {
    this._id = data._id || data.id || crypto.randomBytes(12).toString('hex');
    this.sender = data.sender || data.sender_id || '';
    this.senderName = data.senderName || data.sender_name || '';
    this.text = data.text || '';
    this.upvotes = Array.isArray(data.upvotes) ? data.upvotes : (typeof data.upvotes === 'string' ? JSON.parse(data.upvotes) : (data.upvotes || []));
    this.createdAt = data.createdAt || data.created_at || new Date();
    this.updatedAt = data.updatedAt || data.updated_at || new Date();
  }

  async save() {
    this.updatedAt = new Date();
    const { rows } = await query('SELECT 1 FROM ve_qnas WHERE _id = $1', [this._id]);
    if (rows.length > 0) {
      await query(
        `UPDATE ve_qnas SET 
          sender_id = $1, sender_name = $2, text = $3, upvotes = $4, updated_at = $5
         WHERE _id = $6`,
        [
          this.sender.toString(), this.senderName, this.text, 
          JSON.stringify(this.upvotes), this.updatedAt, this._id
        ]
      );
    } else {
      await query(
        `INSERT INTO ve_qnas (
          _id, sender_id, sender_name, text, upvotes, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          this._id, this.sender.toString(), this.senderName, this.text,
          JSON.stringify(this.upvotes), this.createdAt, this.updatedAt
        ]
      );
    }
    return this;
  }

  static find() {
    let sql = 'SELECT * FROM ve_qnas';
    const queryObj = {
      sort: function(opts) {
        if (opts.createdAt) {
          sql += ` ORDER BY created_at ${opts.createdAt === -1 ? 'DESC' : 'ASC'}`;
        }
        return this;
      },
      then: function(resolve, reject) {
        query(sql)
          .then(({ rows }) => resolve(rows.map(r => new Qna(r))))
          .catch(reject);
      }
    };
    return queryObj;
  }

  static async findById(id) {
    const { rows } = await query('SELECT * FROM ve_qnas WHERE _id = $1', [id]);
    if (rows.length === 0) return null;
    return new Qna(rows[0]);
  }

  static async deleteMany() {
    await query('DELETE FROM ve_qnas');
  }
}

module.exports = Qna;
