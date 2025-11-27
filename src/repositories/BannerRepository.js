/**
 * Banner Repository
 */

const db = require('../db/connection');

class BannerRepository {
  async findAll() {
    const result = await db.query(
      'SELECT id, title, image_url, link, position, is_active, ' +
      'created_at, updated_at FROM banners ORDER BY position ASC'
    );
    return result.rows;
  }

  async findById(id) {
    const result = await db.query(
      'SELECT * FROM banners WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async create(data) {
    const result = await db.query(
      'INSERT INTO banners (title, image_url, link, position, is_active) ' +
      'VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [
        data.title,
        data.image_url,
        data.link,
        data.position || 0,
        data.is_active !== false
      ]
    );
    return result.rows[0];
  }

  async update(id, data) {
    const result = await db.query(
      'UPDATE banners SET title = $2, image_url = $3, link = $4, ' +
      'position = $5, is_active = $6, updated_at = NOW() ' +
      'WHERE id = $1 RETURNING *',
      [
        id,
        data.title,
        data.image_url,
        data.link,
        data.position || 0,
        data.is_active !== false
      ]
    );
    return result.rows[0] || null;
  }

  async delete(id) {
    await db.query('DELETE FROM banners WHERE id = $1', [id]);
    return true;
  }
}

module.exports = new BannerRepository();
