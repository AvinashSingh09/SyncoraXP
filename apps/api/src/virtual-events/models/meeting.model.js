const { query } = require('../utils/db');
const crypto = require('crypto');

class Meeting {
  constructor(data) {
    this._id = data._id || data.id || crypto.randomBytes(12).toString('hex');
    this.code = data.code || '';
    this.zoomLink = data.zoomLink || data.zoom_link || '';
    this.isCustom = data.isCustom !== undefined ? Boolean(data.isCustom) : (data.is_custom !== undefined ? Boolean(data.is_custom) : false);
    this.topic = data.topic || '';
    this.layoutTop = data.layoutTop !== undefined ? Number(data.layoutTop) : (data.layout_top !== undefined ? Number(data.layout_top) : 10.5);
    this.layoutLeft = data.layoutLeft !== undefined ? Number(data.layoutLeft) : (data.layout_left !== undefined ? Number(data.layout_left) : 18.0);
    this.layoutWidth = data.layoutWidth !== undefined ? Number(data.layoutWidth) : (data.layout_width !== undefined ? Number(data.layout_width) : 64.0);
    this.layoutHeight = data.layoutHeight !== undefined ? Number(data.layoutHeight) : (data.layout_height !== undefined ? Number(data.layout_height) : 41.2);
    this.hoverTop = data.hoverTop !== undefined ? Number(data.hoverTop) : (data.hover_top !== undefined ? Number(data.hover_top) : 70.0);
    this.hoverLeft = data.hoverLeft !== undefined ? Number(data.hoverLeft) : (data.hover_left !== undefined ? Number(data.hover_left) : 50.0);
    this.hoverWidth = data.hoverWidth !== undefined ? Number(data.hoverWidth) : (data.hover_width !== undefined ? Number(data.hover_width) : 13.0);
    this.hoverHeight = data.hoverHeight !== undefined ? Number(data.hoverHeight) : (data.hover_height !== undefined ? Number(data.hover_height) : 6.0);
    this.hostEmail = data.hostEmail || data.host_email || '';
    this.createdAt = data.createdAt || data.created_at || new Date();
    this.updatedAt = data.updatedAt || data.updated_at || new Date();
  }

  async save() {
    this.updatedAt = new Date();
    const { rows } = await query('SELECT 1 FROM ve_meetings WHERE _id = $1', [this._id]);
    if (rows.length > 0) {
      await query(
        `UPDATE ve_meetings SET 
          code = $1, zoom_link = $2, is_custom = $3, topic = $4,
          layout_top = $5, layout_left = $6, layout_width = $7, layout_height = $8,
          hover_top = $9, hover_left = $10, hover_width = $11, hover_height = $12,
          host_email = $13, updated_at = $14
         WHERE _id = $15`,
        [
          this.code, this.zoomLink, this.isCustom, this.topic,
          this.layoutTop, this.layoutLeft, this.layoutWidth, this.layoutHeight,
          this.hoverTop, this.hoverLeft, this.hoverWidth, this.hoverHeight,
          this.hostEmail, this.updatedAt, this._id
        ]
      );
    } else {
      await query(
        `INSERT INTO ve_meetings (
          _id, code, zoom_link, is_custom, topic,
          layout_top, layout_left, layout_width, layout_height,
          hover_top, hover_left, hover_width, hover_height,
          host_email, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          this._id, this.code, this.zoomLink, this.isCustom, this.topic,
          this.layoutTop, this.layoutLeft, this.layoutWidth, this.layoutHeight,
          this.hoverTop, this.hoverLeft, this.hoverWidth, this.hoverHeight,
          this.hostEmail, this.createdAt, this.updatedAt
        ]
      );
    }
    return this;
  }

  lean() {
    return this;
  }

  static async findOne(conditions) {
    let sql = 'SELECT * FROM ve_meetings';
    const keys = Object.keys(conditions);
    const params = [];
    if (keys.length > 0) {
      sql += ' WHERE ';
      sql += keys.map((key, i) => {
        const col = key === 'hostEmail' ? 'host_email' : (key === 'zoomLink' ? 'zoom_link' : key);
        params.push(conditions[key]);
        return `${col} = $${i + 1}`;
      }).join(' AND ');
    }
    sql += ' LIMIT 1';
    
    const queryObj = {
      lean: function() {
        return this;
      },
      then: function(resolve, reject) {
        query(sql, params)
          .then(({ rows }) => resolve(rows.length > 0 ? new Meeting(rows[0]) : null))
          .catch(reject);
      }
    };
    return queryObj;
  }

  static find() {
    let sql = 'SELECT * FROM ve_meetings';
    const queryObj = {
      sort: function(opts) {
        if (opts.createdAt) {
          sql += ` ORDER BY created_at ${opts.createdAt === -1 ? 'DESC' : 'ASC'}`;
        }
        return this;
      },
      then: function(resolve, reject) {
        query(sql)
          .then(({ rows }) => resolve(rows.map(r => new Meeting(r))))
          .catch(reject);
      }
    };
    return queryObj;
  }

  static async findByIdAndDelete(id) {
    await query('DELETE FROM ve_meetings WHERE _id = $1', [id]);
  }
}

module.exports = Meeting;
