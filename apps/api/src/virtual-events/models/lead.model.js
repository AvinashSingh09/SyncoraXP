const { query } = require('../utils/db');
const crypto = require('crypto');

class Lead {
  constructor(data) {
    this._id = data._id || data.id || crypto.randomBytes(12).toString('hex');
    this.boothId = data.boothId || data.booth_id || '';
    this.productId = data.productId || data.product_id || '';
    this.productName = data.productName || data.product_name || '';
    this.user = data.user || data.user_id || '';
    this.userName = data.userName || data.user_name || '';
    this.userEmail = data.userEmail || data.user_email || '';
    this.queryText = data.queryText || data.query_text || '';
    this.createdAt = data.createdAt || data.created_at || new Date();
    this.updatedAt = data.updatedAt || data.updated_at || new Date();
  }

  async save() {
    this.updatedAt = new Date();
    const { rows } = await query('SELECT 1 FROM ve_leads WHERE _id = $1', [this._id]);
    if (rows.length > 0) {
      await query(
        `UPDATE ve_leads SET 
          booth_id = $1, product_id = $2, product_name = $3, user_id = $4,
          user_name = $5, user_email = $6, query_text = $7, updated_at = $8
         WHERE _id = $9`,
        [
          this.boothId, this.productId, this.productName, this.user,
          this.userName, this.userEmail, this.queryText, this.updatedAt,
          this._id
        ]
      );
    } else {
      await query(
        `INSERT INTO ve_leads (
          _id, booth_id, product_id, product_name, user_id, 
          user_name, user_email, query_text, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          this._id, this.boothId, this.productId, this.productName, this.user,
          this.userName, this.userEmail, this.queryText, this.createdAt, this.updatedAt
        ]
      );
    }
    return this;
  }

  static find(conditions = {}) {
    let sql = 'SELECT * FROM ve_leads';
    const keys = Object.keys(conditions);
    const params = [];
    if (keys.length > 0) {
      sql += ' WHERE ';
      sql += keys.map((key, i) => {
        const col = key === 'boothId' ? 'booth_id' : (key === 'productId' ? 'product_id' : (key === 'productName' ? 'product_name' : key));
        params.push(conditions[key]);
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
          .then(({ rows }) => resolve(rows.map(r => new Lead(r))))
          .catch(reject);
      }
    };
    return queryObj;
  }

  static async findByIdAndDelete(id) {
    const { rows } = await query('SELECT * FROM ve_leads WHERE _id = $1', [id]);
    if (rows.length === 0) return null;
    await query('DELETE FROM ve_leads WHERE _id = $1', [id]);
    return new Lead(rows[0]);
  }
}

module.exports = Lead;
