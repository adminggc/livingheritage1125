/**
 * Podcast Repository
 */

const db = require('../db/connection');

class PodcastRepository {
  async findAll() {
    const result = await db.query(
      'SELECT id, slug, title, description, image_url, audio_url, ' +
      'duration, created_at, updated_at FROM podcasts ORDER BY created_at DESC'
    );
    return result.rows;
  }

  async findById(id) {
    const result = await db.query(
      'SELECT * FROM podcasts WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async create(data) {
    const result = await db.query(
      'INSERT INTO podcasts (title, description, image_url, audio_url, duration, slug) ' +
      'VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [
        data.title,
        data.description,
        data.image_url,
        data.audio_url,
        data.duration,
        data.slug
      ]
    );
    return result.rows[0];
  }

  async update(id, data) {
    const result = await db.query(
      'UPDATE podcasts SET title = $2, description = $3, image_url = $4, ' +
      'audio_url = $5, duration = $6, slug = $7, updated_at = NOW() ' +
      'WHERE id = $1 RETURNING *',
      [
        id,
        data.title,
        data.description,
        data.image_url,
        data.audio_url,
        data.duration,
        data.slug
      ]
    );
    return result.rows[0] || null;
  }

  async delete(id) {
    await db.query('DELETE FROM podcasts WHERE id = $1', [id]);
    return true;
  }
}

module.exports = new PodcastRepository();
