const { query } = require('../utils/db');
const crypto = require('crypto');

const matchesQuery = (msg, queryObj) => {
  if (!queryObj) return true;
  
  if (queryObj.$or && Array.isArray(queryObj.$or)) {
    return queryObj.$or.some(q => matchesQuery(msg, q));
  }
  
  return Object.keys(queryObj).every(key => {
    if (key === '$or') return true;
    const val = queryObj[key];
    
    if (key.includes('.')) {
      const parts = key.split('.');
      if (parts[0] === 'seenBy' || parts[0] === 'deliveredTo') {
        const arr = msg[parts[0]];
        if (!Array.isArray(arr)) return val && val.$ne === undefined;
        const hasUser = arr.some(item => {
          const u = item.user || item;
          return (u._id || u).toString() === (val.$ne || val).toString();
        });
        return val && val.$ne !== undefined ? !hasUser : hasUser;
      }
    }
    
    if (val && typeof val === 'object') {
      if (val.$ne !== undefined) {
        return (msg[key] || '').toString() !== val.$ne.toString();
      }
      if (val.$regex !== undefined) {
        const regex = val.$regex instanceof RegExp ? val.$regex : new RegExp(val.$regex);
        return regex.test(msg[key] || '');
      }
      if (val.$not !== undefined) {
        return !matchesQuery(msg, { [key]: val.$not });
      }
    }
    
    return (msg[key] || '').toString() === (val || '').toString();
  });
};

class Message {
  constructor(data) {
    this._id = data._id || data.id || crypto.randomBytes(12).toString('hex');
    this.sender = data.sender || data.sender_id || '';
    this.senderName = data.senderName || data.sender_name || '';
    this.room = data.room || '';
    this.text = data.text || '';
    this.replyTo = typeof data.replyTo === 'object' ? data.replyTo : (typeof data.reply_to === 'string' ? JSON.parse(data.reply_to) : (data.reply_to || null));
    this.reactions = Array.isArray(data.reactions) ? data.reactions : (typeof data.reactions === 'string' ? JSON.parse(data.reactions) : (data.reactions || []));
    this.edited = data.edited !== undefined ? Boolean(data.edited) : false;
    this.forwarded = data.forwarded !== undefined ? Boolean(data.forwarded) : false;
    this.delivered = data.delivered !== undefined ? Boolean(data.delivered) : false;
    this.seen = data.seen !== undefined ? Boolean(data.seen) : false;
    this.deliveredAt = data.deliveredAt || data.delivered_at || null;
    this.seenAt = data.seenAt || data.seen_at || null;
    this.deliveredTo = Array.isArray(data.deliveredTo) ? data.deliveredTo : (typeof data.delivered_to === 'string' ? JSON.parse(data.delivered_to) : (data.delivered_to || []));
    this.seenBy = Array.isArray(data.seenBy) ? data.seenBy : (typeof data.seen_by === 'string' ? JSON.parse(data.seen_by) : (data.seen_by || []));
    this.createdAt = data.createdAt || data.created_at || new Date();
    this.updatedAt = data.updatedAt || data.updated_at || new Date();
  }

  toObject() {
    return {
      _id: this._id,
      sender: this.sender,
      senderName: this.senderName,
      room: this.room,
      text: this.text,
      replyTo: this.replyTo,
      reactions: this.reactions,
      edited: this.edited,
      forwarded: this.forwarded,
      delivered: this.delivered,
      seen: this.seen,
      deliveredAt: this.deliveredAt,
      seenAt: this.seenAt,
      deliveredTo: this.deliveredTo,
      seenBy: this.seenBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static fromRow(row) {
    if (!row) return null;
    return new Message(row);
  }

  async save() {
    this.updatedAt = new Date();
    const { rows } = await query('SELECT 1 FROM ve_messages WHERE _id = $1', [this._id]);
    if (rows.length > 0) {
      await query(
        `UPDATE ve_messages SET 
          sender_id = $1, sender_name = $2, room = $3, text = $4, reply_to = $5,
          reactions = $6, edited = $7, forwarded = $8, delivered = $9, seen = $10,
          delivered_at = $11, seen_at = $12, delivered_to = $13, seen_by = $14,
          updated_at = $15
         WHERE _id = $16`,
        [
          this.sender.toString(), this.senderName, this.room, this.text,
          this.replyTo ? JSON.stringify(this.replyTo) : null,
          JSON.stringify(this.reactions), this.edited, this.forwarded, this.delivered, this.seen,
          this.deliveredAt, this.seenAt, JSON.stringify(this.deliveredTo), JSON.stringify(this.seenBy),
          this.updatedAt, this._id
        ]
      );
    } else {
      await query(
        `INSERT INTO ve_messages (
          _id, sender_id, sender_name, room, text, reply_to,
          reactions, edited, forwarded, delivered, seen,
          delivered_at, seen_at, delivered_to, seen_by,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
        [
          this._id, this.sender.toString(), this.senderName, this.room, this.text,
          this.replyTo ? JSON.stringify(this.replyTo) : null,
          JSON.stringify(this.reactions), this.edited, this.forwarded, this.delivered, this.seen,
          this.deliveredAt, this.seenAt, JSON.stringify(this.deliveredTo), JSON.stringify(this.seenBy),
          this.createdAt, this.updatedAt
        ]
      );
    }
    return this;
  }

  static async findOne(conditions) {
    let sql = 'SELECT * FROM ve_messages';
    const keys = Object.keys(conditions);
    const params = [];
    if (keys.length > 0) {
      sql += ' WHERE ';
      sql += keys.map((key, i) => {
        const col = key === 'sender' ? 'sender_id' : (key === 'senderName' ? 'sender_name' : key);
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
      then: function(resolve, reject) {
        query(sql + ' LIMIT 1', params)
          .then(({ rows }) => resolve(Message.fromRow(rows[0])))
          .catch(reject);
      }
    };
    return queryObj;
  }

  static async findById(id) {
    const { rows } = await query('SELECT * FROM ve_messages WHERE _id = $1', [id]);
    return Message.fromRow(rows[0]);
  }

  static find(conditions = {}) {
    let sql = 'SELECT * FROM ve_messages';
    const keys = Object.keys(conditions);
    const params = [];
    const dbClauses = [];

    keys.forEach((key) => {
      if (['room', 'sender', '_id'].includes(key)) {
        const val = conditions[key];
        if (key === 'room') {
          if (val && typeof val === 'object' && val.$regex) {
            if (val.$regex instanceof RegExp) {
              const match = val.$regex.source.match(/[0-9a-fA-F]{24}/);
              const searchVal = match ? `%${match[0]}%` : '%';
              params.push(searchVal);
              dbClauses.push(`room LIKE $${params.length}`);
            } else {
              params.push(`%${val.$regex}%`);
              dbClauses.push(`room LIKE $${params.length}`);
            }
          } else {
            params.push(val.toString());
            dbClauses.push(`room = $${params.length}`);
          }
        } else if (key === 'sender') {
          if (val && typeof val === 'object' && val.$ne !== undefined) {
            params.push(val.$ne.toString());
            dbClauses.push(`sender_id <> $${params.length}`);
          } else {
            params.push(val.toString());
            dbClauses.push(`sender_id = $${params.length}`);
          }
        } else if (key === '_id') {
          if (val && typeof val === 'object' && val.$in) {
            const ids = val.$in;
            if (ids.length > 0) {
              const placeholders = ids.map((_, i) => `$${params.length + i + 1}`).join(',');
              params.push(...ids);
              dbClauses.push(`_id IN (${placeholders})`);
            }
          } else {
            params.push(val.toString());
            dbClauses.push(`_id = $${params.length}`);
          }
        }
      }
    });

    if (dbClauses.length > 0) {
      sql += ' WHERE ' + dbClauses.join(' AND ');
    }

    const queryObj = {
      populate: function() { return this; },
      limit: function(num) {
        sql += ` LIMIT ${num}`;
        return this;
      },
      sort: function(sortOpts) {
        if (sortOpts.createdAt) {
          sql += ` ORDER BY created_at ${sortOpts.createdAt === -1 ? 'DESC' : 'ASC'}`;
        }
        return this;
      },
      then: function(resolve, reject) {
        query(sql, params)
          .then(({ rows }) => {
            const msgs = rows.map(r => Message.fromRow(r));
            const filtered = msgs.filter(msg => matchesQuery(msg, conditions));
            resolve(filtered);
          })
          .catch(reject);
      }
    };
    return queryObj;
  }

  static async countDocuments() {
    const { rows } = await query('SELECT COUNT(*) as count FROM ve_messages');
    return parseInt(rows[0].count, 10);
  }

  static async insertMany(msgs) {
    for (const msg of msgs) {
      const m = new Message(msg);
      await m.save();
    }
  }

  static async deleteMany(conditions = {}) {
    let sql = 'DELETE FROM ve_messages';
    const keys = Object.keys(conditions);
    const params = [];
    if (keys.length > 0) {
      sql += ' WHERE ';
      sql += keys.map((key, i) => {
        params.push(conditions[key]);
        return `${key} = $${i + 1}`;
      }).join(' AND ');
    }
    await query(sql, params);
  }

  static async updateMany(conditions, update) {
    const setFields = update.$set || update;
    const setClause = [];
    const params = [];
    let paramIndex = 1;

    Object.keys(setFields).forEach(key => {
      const col = key === 'deliveredAt' ? 'delivered_at' : (key === 'seenAt' ? 'seen_at' : key);
      params.push(setFields[key]);
      setClause.push(`${col} = $${paramIndex++}`);
    });

    let whereClause = '';
    if (conditions._id && conditions._id.$in) {
      const ids = conditions._id.$in;
      const placeholders = ids.map(() => `$${paramIndex++}`).join(',');
      params.push(...ids);
      whereClause = `_id IN (${placeholders})`;
    } else {
      const keys = Object.keys(conditions);
      whereClause = keys.map(key => {
        params.push(conditions[key]);
        return `${key} = $${paramIndex++}`;
      }).join(' AND ');
    }

    const sql = `UPDATE ve_messages SET ${setClause.join(', ')} WHERE ${whereClause}`;
    await query(sql, params);
  }
}

module.exports = Message;
