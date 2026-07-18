const { query } = require('../utils/db');
const crypto = require('crypto');

class Quiz {
  constructor(data) {
    this._id = data._id || data.id || crypto.randomBytes(12).toString('hex');
    this.question = data.question || '';
    this.options = Array.isArray(data.options) ? data.options : (typeof data.options === 'string' ? JSON.parse(data.options) : (data.options || []));
    this.options.forEach(opt => {
      if (!opt._id && !opt.id) opt._id = crypto.randomBytes(12).toString('hex');
    });
    this.correctOptionIndex = data.correctOptionIndex !== undefined ? Number(data.correctOptionIndex) : (data.correct_option_index !== undefined ? Number(data.correct_option_index) : 0);
    this.isActive = data.isActive !== undefined ? Boolean(data.isActive) : (data.is_active !== undefined ? Boolean(data.is_active) : true);
    this.createdAt = data.createdAt || data.created_at || new Date();
    this.updatedAt = data.updatedAt || data.updated_at || new Date();
  }

  async save() {
    this.updatedAt = new Date();
    const { rows } = await query('SELECT 1 FROM ve_quizzes WHERE _id = $1', [this._id]);
    if (rows.length > 0) {
      await query(
        'UPDATE ve_quizzes SET question = $1, options = $2, correct_option_index = $3, is_active = $4, updated_at = $5 WHERE _id = $6',
        [this.question, JSON.stringify(this.options), this.correctOptionIndex, this.isActive, this.updatedAt, this._id]
      );
    } else {
      await query(
        'INSERT INTO ve_quizzes (_id, question, options, correct_option_index, is_active, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [this._id, this.question, JSON.stringify(this.options), this.correctOptionIndex, this.isActive, this.createdAt, this.updatedAt]
      );
    }
    return this;
  }

  static find() {
    let sql = 'SELECT * FROM ve_quizzes';
    let isPopulate = false;
    
    const queryObj = {
      populate: function(path, select) {
        if (path === 'options.votes') {
          isPopulate = true;
        }
        return this;
      },
      sort: function(opts) {
        if (opts.createdAt) {
          sql += ` ORDER BY created_at ${opts.createdAt === -1 ? 'DESC' : 'ASC'}`;
        }
        return this;
      },
      then: async function(resolve, reject) {
        try {
          const { rows } = await query(sql);
          const quizzes = rows.map(r => new Quiz(r));
          
          if (isPopulate) {
            const userIds = new Set();
            quizzes.forEach(q => {
              q.options.forEach(opt => {
                if (Array.isArray(opt.votes)) {
                  opt.votes.forEach(v => {
                    if (v && typeof v === 'string') userIds.add(v);
                  });
                }
              });
            });
            
            if (userIds.size > 0) {
              const ids = Array.from(userIds);
              const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
              const { rows: userRows } = await query(`SELECT _id, first_name, last_name, email, designation FROM ve_users WHERE _id IN (${placeholders})`, ids);
              
              const userMap = {};
              userRows.forEach(ur => {
                userMap[ur._id] = {
                  _id: ur._id,
                  firstName: ur.first_name,
                  lastName: ur.last_name,
                  email: ur.email,
                  designation: ur.designation
                };
              });
              
              quizzes.forEach(q => {
                q.options.forEach(opt => {
                  if (Array.isArray(opt.votes)) {
                    opt.votes = opt.votes.map(v => userMap[v] || v);
                  }
                });
              });
            }
          }
          resolve(quizzes);
        } catch (e) {
          reject(e);
        }
      }
    };
    return queryObj;
  }

  static async findById(id) {
    const { rows } = await query('SELECT * FROM ve_quizzes WHERE _id = $1', [id]);
    if (rows.length === 0) return null;
    return new Quiz(rows[0]);
  }

  static async deleteMany() {
    await query('DELETE FROM ve_quizzes');
  }
}

module.exports = Quiz;
