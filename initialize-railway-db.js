#!/usr/bin/env node

/**
 * Railway Database Initialization Script
 * Initializes the Living Heritage PostgreSQL database with schema and seed data
 * Usage: node initialize-railway-db.js
 */

const { Pool } = require('pg');

// Your Railway database connection details
const pool = new Pool({
  host: 'ballast.proxy.rlwy.net',
  port: 40428,
  database: 'railway',
  user: 'postgres',
  password: 'mdsgwaFoNurneYjUiCewDZVFTmhwtNss',
  ssl: { rejectUnauthorized: false }
});

const schema = `
-- Heritage Figures Table
CREATE TABLE IF NOT EXISTS heritage_figures (
    id SERIAL PRIMARY KEY,
    url_slug VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    language VARCHAR(2) NOT NULL CHECK (language IN ('vi', 'en')),
    image_url TEXT,
    small_image_url TEXT,
    hero_image_url TEXT,
    header_letter VARCHAR(50),
    category VARCHAR(100),
    summary JSONB,
    introduction TEXT,
    quote TEXT,
    sections JSONB,
    highlights JSONB,
    published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT heritage_figures_slug_lang_unique UNIQUE (url_slug, language)
);

-- News Articles Table
CREATE TABLE IF NOT EXISTS news_articles (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    content TEXT,
    language VARCHAR(2) NOT NULL CHECK (language IN ('vi', 'en')),
    category VARCHAR(100),
    keywords TEXT,
    author VARCHAR(255) DEFAULT 'Living Heritage',
    featured_image TEXT,
    images JSONB,
    published BOOLEAN DEFAULT false,
    date DATE,
    published_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT news_articles_slug_lang_unique UNIQUE (slug, language)
);

-- Wellness Tips Table
CREATE TABLE IF NOT EXISTS wellness_tips (
    id SERIAL PRIMARY KEY,
    url_slug VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    content TEXT,
    language VARCHAR(2) NOT NULL CHECK (language IN ('vi', 'en')),
    image_url TEXT,
    hero_image_url TEXT,
    alt_text VARCHAR(255),
    published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT wellness_tips_slug_lang_unique UNIQUE (url_slug, language)
);

-- Podcasts Table
CREATE TABLE IF NOT EXISTS podcasts (
    id SERIAL PRIMARY KEY,
    video_id VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    language VARCHAR(2) NOT NULL CHECK (language IN ('vi', 'en')),
    image_url TEXT,
    alt_text VARCHAR(255),
    published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT podcasts_video_id_lang_unique UNIQUE (video_id, language)
);

-- Banners Table
CREATE TABLE IF NOT EXISTS banners (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    image_url TEXT NOT NULL,
    link_url TEXT,
    display_order INTEGER DEFAULT 0,
    published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cache Metadata Table
CREATE TABLE IF NOT EXISTS cache_metadata (
    key VARCHAR(255) PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER,
    language VARCHAR(2),
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit Log Table
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id INTEGER NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    changed_by VARCHAR(255),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_heritage_figures_language ON heritage_figures(language);
CREATE INDEX IF NOT EXISTS idx_heritage_figures_published ON heritage_figures(published);
CREATE INDEX IF NOT EXISTS idx_heritage_figures_lang_pub ON heritage_figures(language, published);
CREATE INDEX IF NOT EXISTS idx_heritage_figures_created_at ON heritage_figures(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_news_articles_language ON news_articles(language);
CREATE INDEX IF NOT EXISTS idx_news_articles_published ON news_articles(published);
CREATE INDEX IF NOT EXISTS idx_news_articles_lang_pub ON news_articles(language, published);
CREATE INDEX IF NOT EXISTS idx_news_articles_date ON news_articles(date DESC);

CREATE INDEX IF NOT EXISTS idx_wellness_tips_language ON wellness_tips(language);
CREATE INDEX IF NOT EXISTS idx_wellness_tips_published ON wellness_tips(published);
CREATE INDEX IF NOT EXISTS idx_wellness_tips_lang_pub ON wellness_tips(language, published);

CREATE INDEX IF NOT EXISTS idx_podcasts_language ON podcasts(language);
CREATE INDEX IF NOT EXISTS idx_podcasts_published ON podcasts(published);

CREATE INDEX IF NOT EXISTS idx_banners_published ON banners(published);
CREATE INDEX IF NOT EXISTS idx_banners_display_order ON banners(display_order);
`;

async function initializeDatabase() {
  const client = await pool.connect();

  try {
    console.log('🔄 Connecting to Railway PostgreSQL...');
    await client.query('SELECT NOW()');
    console.log('✅ Connected to Railway database');

    console.log('\n🔄 Creating tables and indexes...');

    // Split schema by semicolon and execute each statement
    const statements = schema.split(';').filter(stmt => stmt.trim());

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement.length > 0) {
        try {
          await client.query(statement);
          console.log(`  ✓ Statement ${i + 1}/${statements.length} completed`);
        } catch (err) {
          if (err.message.includes('already exists')) {
            console.log(`  ✓ Statement ${i + 1}/${statements.length} (already exists)`);
          } else {
            console.error(`✗ Error in statement ${i + 1}:`, err.message);
            throw err;
          }
        }
      }
    }

    console.log('\n✅ Database schema created successfully!');

    // Verify tables were created
    console.log('\n🔍 Verifying tables...');
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('Tables created:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });

    console.log('\n✅ Database initialization complete!');
    console.log('\nYour admin panel should now load with correct data.');
    console.log('Refresh: ' + 'https://livingheritage1125-production.up.railway.app/admin/');

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  } finally {
    await client.end();
    await pool.end();
  }
}

// Run initialization
initializeDatabase().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
