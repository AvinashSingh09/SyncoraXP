const { query } = require('../utils/db');
const crypto = require('crypto');

class SurveyQuestion {
  constructor(data) {
    this._id = data._id || data.id || crypto.randomBytes(12).toString('hex');
    this.text = data.text || '';
    this.type = data.type || '';
    this.options = Array.isArray(data.options) ? data.options : (typeof data.options === 'string' ? JSON.parse(data.options) : (data.options || []));
    this.order = data.order !== undefined ? Number(data.order) : (data.order_num !== undefined ? Number(data.order_num) : 0);
    this.createdAt = data.createdAt || data.created_at || new Date();
    this.updatedAt = data.updatedAt || data.updated_at || new Date();
  }

  async save() {
    this.updatedAt = new Date();
    const { rows } = await query('SELECT 1 FROM ve_survey_questions WHERE _id = $1', [this._id]);
    if (rows.length > 0) {
      await query(
        'UPDATE ve_survey_questions SET text = $1, type = $2, options = $3, order_num = $4, updated_at = $5 WHERE _id = $6',
        [this.text, this.type, JSON.stringify(this.options), this.order, this.updatedAt, this._id]
      );
    } else {
      await query(
        'INSERT INTO ve_survey_questions (_id, text, type, options, order_num, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [this._id, this.text, this.type, JSON.stringify(this.options), this.order, this.createdAt, this.updatedAt]
      );
    }
    return this;
  }

  static find() {
    let sql = 'SELECT * FROM ve_survey_questions';
    const queryObj = {
      sort: function(opts) {
        if (opts.order !== undefined || opts.createdAt !== undefined) {
          const clauses = [];
          if (opts.order !== undefined) clauses.push(`order_num ${opts.order === -1 ? 'DESC' : 'ASC'}`);
          if (opts.createdAt !== undefined) clauses.push(`created_at ${opts.createdAt === -1 ? 'DESC' : 'ASC'}`);
          sql += ' ORDER BY ' + clauses.join(', ');
        }
        return this;
      },
      then: function(resolve, reject) {
        query(sql)
          .then(({ rows }) => resolve(rows.map(r => new SurveyQuestion(r))))
          .catch(reject);
      }
    };
    return queryObj;
  }

  static async findById(id) {
    const { rows } = await query('SELECT * FROM ve_survey_questions WHERE _id = $1', [id]);
    if (rows.length === 0) return null;
    return new SurveyQuestion(rows[0]);
  }

  static async findByIdAndDelete(id) {
    const { rows } = await query('SELECT * FROM ve_survey_questions WHERE _id = $1', [id]);
    if (rows.length === 0) return null;
    await query('DELETE FROM ve_survey_questions WHERE _id = $1', [id]);
    return new SurveyQuestion(rows[0]);
  }

  static async countDocuments() {
    const { rows } = await query('SELECT COUNT(*) as count FROM ve_survey_questions');
    return parseInt(rows[0].count, 10);
  }

  static async insertMany(questions) {
    for (const q of questions) {
      const sq = new SurveyQuestion(q);
      await sq.save();
    }
  }
}

module.exports = SurveyQuestion;
