/**
 * News Repository
 */

const db = require('../db/connection');

class NewsRepository {
  async findAll() {
    const result = await db.query(
      'SELECT id, slug, title, description, short_description, author, ' +
      'publication_date, images, featured_image, content, category, ' +
      'created_at, updated_at FROM news_articles ORDER BY publication_date DESC'
    );
    return result.rows;
  }

  async findById(id) {
    const result = await db.query(
      'SELECT * FROM news_articles WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async create(data) {
    const result = await db.query(
      'INSERT INTO news_articles (title, description, short_description, author, ' +
      'publication_date, images, featured_image, content, category, slug) ' +
      'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ' +
      'RETURNING *',
      [
        data.title,
        data.description,
        data.short_description,
        data.author,
        data.publication_date,
        JSON.stringify(data.images || []),
        data.featured_image,
        data.content,
        data.category,
        data.slug
      ]
    );
    return result.rows[0];
  }

  async update(id, data) {
    const result = await db.query(
      'UPDATE news_articles SET title = $2, description = $3, short_description = $4, ' +
      'author = $5, publication_date = $6, images = $7, featured_image = $8, ' +
      'content = $9, category = $10, slug = $11, updated_at = NOW() ' +
      'WHERE id = $1 RETURNING *',
      [
        id,
        data.title,
        data.description,
        data.short_description,
        data.author,
        data.publication_date,
        JSON.stringify(data.images || []),
        data.featured_image,
        data.content,
        data.category,
        data.slug
      ]
    );
    return result.rows[0] || null;
  }

  async delete(id) {
    await db.query('DELETE FROM news_articles WHERE id = $1', [id]);
    return true;
  }
}

module.exports = new NewsRepository();
