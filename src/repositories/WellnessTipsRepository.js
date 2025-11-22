/**
 * Wellness Tips Repository
 */

const db = require('../db/connection');

class WellnessTipsRepository {
  async findAll() {
    const result = await db.query(
      'SELECT id, slug, title, short_description, category, image_url, ' +
      'detailed_description, featured_image, created_at, updated_at ' +
      'FROM wellness_tips ORDER BY created_at DESC'
    );
    return result.rows;
  }

  async findById(id) {
    const result = await db.query(
      'SELECT * FROM wellness_tips WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async findPublished(language) {
    const result = await db.query(
      'SELECT id, slug, title, short_description, category, image_url, ' +
      'detailed_description, featured_image, created_at, updated_at ' +
      'FROM wellness_tips WHERE published = true ORDER BY created_at DESC'
    );
    return result.rows;
  }

  async create(data) {
    const result = await db.query(
      'INSERT INTO wellness_tips (title, short_description, category, image_url, ' +
      'detailed_description, featured_image, slug) ' +
      'VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [
        data.title,
        data.short_description,
        data.category,
        data.image_url,
        data.detailed_description,
        data.featured_image,
        data.slug
      ]
    );
    return result.rows[0];
  }

  async update(id, data) {
    const result = await db.query(
      'UPDATE wellness_tips SET title = $2, short_description = $3, ' +
      'category = $4, image_url = $5, detailed_description = $6, ' +
      'featured_image = $7, slug = $8, updated_at = NOW() ' +
      'WHERE id = $1 RETURNING *',
      [
        id,
        data.title,
        data.short_description,
        data.category,
        data.image_url,
        data.detailed_description,
        data.featured_image,
        data.slug
      ]
    );
    return result.rows[0] || null;
  }

  async delete(id) {
    await db.query('DELETE FROM wellness_tips WHERE id = $1', [id]);
    return true;
  }
}

module.exports = new WellnessTipsRepository();
