const { query } = require('../utils/db');
const crypto = require('crypto');

class User {
  constructor(data) {
    this._id = data._id || data.id || crypto.randomBytes(12).toString('hex');
    this.firstName = data.firstName || data.first_name || '';
    this.lastName = data.lastName || data.last_name || '';
    this.designation = data.designation || '';
    this.company = data.company || '';
    this.mobileNumber = data.mobileNumber || data.mobile_number || '';
    this.country = data.country || '';
    this.state = data.state || '';
    this.city = data.city || '';
    this.utmSource = data.utmSource || data.utm_source || '';
    this.email = data.email || '';
    this.password = data.password || '';
    this.points = data.points !== undefined ? Number(data.points) : 0;
    this.boothPoints = data.boothPoints !== undefined ? Number(data.boothPoints) : 0;
    this.gamePoints = data.gamePoints !== undefined ? Number(data.gamePoints) : 0;
    this.visitedBooths = Array.isArray(data.visitedBooths) ? data.visitedBooths : (typeof data.visited_booths === 'string' ? JSON.parse(data.visited_booths) : (data.visited_booths || []));
    this.customFields = typeof data.customFields === 'object' ? data.customFields : (typeof data.custom_fields === 'string' ? JSON.parse(data.custom_fields) : (data.custom_fields || {}));
    this.createdAt = data.createdAt || data.created_at || new Date();
    this.updatedAt = data.updatedAt || data.updated_at || new Date();
  }

  toObject() {
    return {
      _id: this._id,
      firstName: this.firstName,
      lastName: this.lastName,
      designation: this.designation,
      company: this.company,
      mobileNumber: this.mobileNumber,
      country: this.country,
      state: this.state,
      city: this.city,
      utmSource: this.utmSource,
      email: this.email,
      password: this.password,
      points: this.points,
      boothPoints: this.boothPoints,
      gamePoints: this.gamePoints,
      visitedBooths: this.visitedBooths,
      customFields: this.customFields,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static fromRow(row) {
    if (!row) return null;
    return new User(row);
  }

  async save() {
    this.updatedAt = new Date();
    const existing = await User.findById(this._id);
    if (existing) {
      await query(
        `UPDATE ve_users SET 
          first_name = $1, last_name = $2, designation = $3, company = $4, mobile_number = $5,
          country = $6, state = $7, city = $8, utm_source = $9, email = $10, password = $11,
          points = $12, booth_points = $13, game_points = $14, visited_booths = $15, custom_fields = $16,
          updated_at = $17
         WHERE _id = $18`,
        [
          this.firstName, this.lastName, this.designation, this.company, this.mobileNumber,
          this.country, this.state, this.city, this.utmSource, this.email, this.password,
          this.points, this.boothPoints, this.gamePoints, JSON.stringify(this.visitedBooths), JSON.stringify(this.customFields),
          this.updatedAt, this._id
        ]
      );
    } else {
      await query(
        `INSERT INTO ve_users (
          _id, first_name, last_name, designation, company, mobile_number,
          country, state, city, utm_source, email, password,
          points, booth_points, game_points, visited_booths, custom_fields,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
        [
          this._id, this.firstName, this.lastName, this.designation, this.company, this.mobileNumber,
          this.country, this.state, this.city, this.utmSource, this.email, this.password,
          this.points, this.boothPoints, this.gamePoints, JSON.stringify(this.visitedBooths), JSON.stringify(this.customFields),
          this.createdAt, this.updatedAt
        ]
      );
    }
    return this;
  }

  static async findOne(conditions = {}) {
    let sql = 'SELECT * FROM ve_users';
    const keys = Object.keys(conditions);
    const params = [];
    if (keys.length > 0) {
      sql += ' WHERE ';
      sql += keys.map((key, i) => {
        const col = key === 'firstName' ? 'first_name' : (key === 'lastName' ? 'last_name' : key);
        params.push(conditions[key]);
        return `${col} = $${i + 1}`;
      }).join(' AND ');
    }
    sql += ' LIMIT 1';
    const { rows } = await query(sql, params);
    return User.fromRow(rows[0]);
  }

  static async findById(id) {
    if (!id) return null;
    const { rows } = await query('SELECT * FROM ve_users WHERE _id = $1', [id.toString()]);
    return User.fromRow(rows[0]);
  }

  static find(conditions = {}) {
    let sql = 'SELECT * FROM ve_users';
    const keys = Object.keys(conditions);
    const params = [];
    if (keys.length > 0) {
      sql += ' WHERE ';
      sql += keys.map((key, i) => {
        const col = key === 'firstName' ? 'first_name' : (key === 'lastName' ? 'last_name' : key);
        params.push(conditions[key]);
        return `${col} = $${i + 1}`;
      }).join(' AND ');
    }
    
    const queryObj = {
      sort: function(sortOpts) {
        if (sortOpts.createdAt) {
          sql += ` ORDER BY created_at ${sortOpts.createdAt === -1 ? 'DESC' : 'ASC'}`;
        }
        return this;
      },
      select: function(selectFields) {
        return this;
      },
      then: function(resolve, reject) {
        query(sql, params)
          .then(({ rows }) => resolve(rows.map(r => User.fromRow(r))))
          .catch(reject);
      }
    };
    return queryObj;
  }

  static async findByIdAndUpdate(id, update) {
    const user = await User.findById(id);
    if (!user) return null;
    
    const fields = update.$set || update;
    Object.keys(fields).forEach(key => {
      user[key] = fields[key];
    });
    
    if (update.$inc) {
      Object.keys(update.$inc).forEach(key => {
        user[key] = (user[key] || 0) + update.$inc[key];
      });
    }
    
    if (update.$addToSet) {
      Object.keys(update.$addToSet).forEach(key => {
        if (Array.isArray(user[key])) {
          const val = update.$addToSet[key];
          if (!user[key].includes(val)) {
            user[key].push(val);
          }
        }
      });
    }

    await user.save();
    return user;
  }
}

module.exports = User;
