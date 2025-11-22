/**
 * Heritage Figure Repository
 * Manages database operations for heritage figures
 */

const db = require('../db/connection');

class HeritageFigureRepository {
  async findAll() {
    const result = await db.query(
      'SELECT id, slug, name, header_letter, position, photo_url, short_bio, ' +
      'bio, summary, sections, highlights, created_at, updated_at ' +
      'FROM heritage_figures ORDER BY created_at DESC'
    );
    return result.rows;
  }

  async findById(id) {
    const result = await db.query(
      'SELECT id, slug, name, header_letter, position, photo_url, short_bio, ' +
      'bio, summary, sections, highlights, created_at, updated_at ' +
      'FROM heritage_figures WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async findBySlug(slug) {
    const result = await db.query(
      'SELECT id, slug, name, header_letter, position, photo_url, short_bio, ' +
      'bio, summary, sections, highlights, created_at, updated_at ' +
      'FROM heritage_figures WHERE slug = $1',
      [slug]
    );
    return result.rows[0] || null;
  }

  async findPublished(language) {
    const result = await db.query(
      'SELECT id, slug, name, header_letter, position, photo_url, short_bio, ' +
      'bio, summary, sections, highlights, created_at, updated_at ' +
      'FROM heritage_figures WHERE published = true ORDER BY created_at DESC'
    );
    return result.rows;
  }

  async create(data) {
    const result = await db.query(
      'INSERT INTO heritage_figures ' +
      '(name, header_letter, position, photo_url, short_bio, bio, summary, sections, highlights, slug) ' +
      'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ' +
      'RETURNING id, slug, name, header_letter, position, photo_url, short_bio, ' +
      'bio, summary, sections, highlights, created_at, updated_at',
      [
        data.name,
        data.header_letter,
        data.position,
        data.photo_url,
        data.short_bio,
        data.bio,
        data.summary,
        JSON.stringify(data.sections || []),
        JSON.stringify(data.highlights || []),
        data.slug
      ]
    );
    return result.rows[0];
  }

  async update(id, data) {
    const result = await db.query(
      'UPDATE heritage_figures SET ' +
      'name = $2, header_letter = $3, position = $4, photo_url = $5, ' +
      'short_bio = $6, bio = $7, summary = $8, sections = $9, highlights = $10, ' +
      'slug = $11, updated_at = NOW() ' +
      'WHERE id = $1 ' +
      'RETURNING id, slug, name, header_letter, position, photo_url, short_bio, ' +
      'bio, summary, sections, highlights, created_at, updated_at',
      [
        id,
        data.name,
        data.header_letter,
        data.position,
        data.photo_url,
        data.short_bio,
        data.bio,
        data.summary,
        JSON.stringify(data.sections || []),
        JSON.stringify(data.highlights || []),
        data.slug
      ]
    );
    return result.rows[0] || null;
  }

  async delete(id) {
    await db.query('DELETE FROM heritage_figures WHERE id = $1', [id]);
    return true;
  }
}

module.exports = new HeritageFigureRepository();
