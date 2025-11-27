# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Living Heritage is a bilingual (Vietnamese/English) cultural heritage platform built with Node.js/Express. The application features a hybrid data storage architecture supporting both JSON files and PostgreSQL with Redis caching.

**Live Site**: https://livingheritage.live
**Tech Stack**: Node.js 18, Express.js, PostgreSQL, Redis, vanilla JavaScript frontend
**Deployment**: Railway with Docker

## Development Commands

### Running the Application
```bash
npm install          # Install dependencies
npm start            # Start the server (production)
npm run dev          # Start the server (development)
```

Server runs on `http://localhost:3000` (or PORT environment variable).

### Testing and Verification
```bash
# Check server status and mode (JSON vs Database)
curl http://localhost:3000/api/status

# Health check
curl http://localhost:3000/api/health
```

### Migration Scripts
Data extraction scripts are located in the root directory. These extract content from HTML files into JSON format:

```bash
node extract-html-design.js              # Extract news articles
node extract-html-design-tips.js         # Extract wellness tips
node extract-html-design-figures.js      # Extract heritage figures
node extract-wellness-tips-en.js         # Extract English wellness tips
node extract-news-from-html-en.js        # Extract English news
```

## High-Level Architecture

### Hybrid Data Storage System

The application operates in two modes controlled by the `USE_DATABASE` environment variable:

**JSON Mode** (`USE_DATABASE=false`):
- All content stored in `/data/*.json` files
- Simple file I/O operations
- Default for local development
- **Warning**: JSON files are not persistent in Railway containers

**Database Mode** (`USE_DATABASE=true`):
- Content stored in PostgreSQL
- Repositories in `src/repositories/` handle database operations
- Redis caching layer (`USE_CACHE=true`) for performance
- Required for production deployment

The server automatically falls back to JSON mode if database connection fails.

### Repository Pattern

Database operations are abstracted through repositories located in `src/repositories/`:
- `HeritageFigureRepository.js` - Heritage figures CRUD
- `NewsRepository.js` - News articles CRUD
- `WellnessTipsRepository.js` - Wellness tips CRUD
- `PodcastRepository.js` - Podcasts CRUD
- `BannerRepository.js` - Banners CRUD

Each repository provides: `create()`, `update()`, `delete()`, `findById()`, `findAll()`, `findPublished()`

Database connection pooling is handled by `src/db/connection.js` using the `pg` library.

### Caching Strategy

When `USE_CACHE=true`, Redis caches frequently accessed data:
- Cache keys: `{contentType}:{language}:{published}`
- Cache invalidation: Automatic on create/update/delete operations
- Cache warmup: Runs 2 seconds after server startup
- Handled by: `src/cache/CacheService.js` and `src/cache/redisClient.js`

### API Endpoint Patterns

**Public Endpoints** (no auth):
- `GET /api/{type}` - Get all published items (e.g., `/api/news`, `/api/tips`)
- `GET /api/{type}-en` - Get English versions
- `GET /api/{type}/slug/:slug` - Get single item by slug
- `POST /api/save-{type}` - Save bulk data (legacy, used by admin)

**Admin Endpoints** (requires `X-API-Key` header):
- `GET /api/admin/{type}` - Get all items including unpublished
- `POST /api/admin/{type}` - Create new item
- `PUT /api/admin/{type}/:id` - Update item
- `DELETE /api/admin/{type}/:id` - Delete item

Admin authentication uses the `authenticateAdminApiKey` middleware (server.js:36-45).

### Frontend Dynamic Content Loading

Content is loaded client-side via JavaScript in `/assets/js/`:
- `dynamic-detail-loader.js` - Main content loading system
- `news-loader.js` - News article loading
- `tips-loader.js` - Wellness tips loading
- `figures-loader.js` - Heritage figures loading
- `podcast-loader.js` - Podcast loading

These loaders fetch JSON from API endpoints and inject HTML into the page DOM.

### Bilingual Content Structure

Content exists in two languages with parallel structures:
- Vietnamese: Root-level HTML files and `/data/*.json`
- English: `/en/*.html` and `/data/*-en.json`

API routes handle language via separate endpoints (`/api/news` vs `/api/news-en`).

### Admin Dashboard Architecture

Admin interface at `/admin/index.html` uses:
- `assets/js/admin-db.js` - Admin CRUD operations
- `assets/js/admin-json.js` - JSON file management
- `assets/js/admin.js` - UI logic

Admin edits can update either JSON files or database depending on `USE_DATABASE` setting.

## Critical Data Transformations

The server transforms between database snake_case and API camelCase:

**Heritage Figures**: `url_slug` ↔ `urlSlug`, `full_name` ↔ `fullName`, `hero_image_url` ↔ `heroImageUrl`

**News**: `featured_image` ↔ `featured_image`, `publication_date` ↔ `publishedTime`

**Wellness Tips**: `url_slug` ↔ `urlSlug`, `hero_image_url` ↔ `heroImageUrl`, `alt_text` ↔ `altText`

Transform functions: `transformFigureToJson()`, `transformNewsToJson()`, `transformTipToJson()` (server.js:98-177)

## Environment Variables

Required for production:
```
DATABASE_URL=postgresql://user:pass@host:port/db   # PostgreSQL connection
USE_DATABASE=true                                   # Enable database mode
USE_CACHE=true                                      # Enable Redis caching
ADMIN_API_KEY=your-secret-key                      # Admin API authentication
PORT=3000                                           # Server port
NODE_ENV=production
```

Optional:
```
REDIS_URL=redis://host:port                        # Redis connection
AUTO_MIGRATE=true                                  # Auto-run migrations on startup
```

## Database Schema Notes

The database uses PostgreSQL with tables:
- `heritage_figures` - Heritage figure profiles
- `news_articles` - News articles
- `wellness_tips` - Wellness tips
- `podcasts` - Podcast metadata
- `banners` - Homepage banners

All tables include:
- `language` column (`'vi'` or `'en'`)
- `published` boolean for draft/published state
- `created_at` and `updated_at` timestamps

## Common Pitfalls

1. **JSON file persistence**: JSON files in Railway containers are wiped on redeploy. Always use database mode in production.

2. **Admin API authentication**: Admin endpoints require `X-API-Key` header. Missing header returns 401.

3. **Database fallback**: If database connection fails during admin operations (server.js:1215, 1296), the server automatically falls back to JSON mode.

4. **SSL configuration**: Database connection uses `ssl: { rejectUnauthorized: false }` for Railway's self-signed certificates (src/db/connection.js:20-22).

5. **Cache invalidation**: When updating content, ensure cache is invalidated for the correct language (`'vi'` or `'en'`).

## File Organization

Key directories:
- `/data/` - JSON data files (both Vietnamese and English with `-en.json` suffix)
- `/assets/js/` - Frontend JavaScript and admin panel logic
- `/assets/css/` - Stylesheets
- `/assets/media/` - Images, videos, podcasts
- `/src/db/` - Database connection management
- `/src/repositories/` - Database access layer
- `/src/cache/` - Redis caching layer
- `/admin/` - Admin dashboard HTML
- `/en/` - English language HTML pages

Root-level HTML files are Vietnamese pages. The application serves static files from the root directory (server.js:1695).

## Testing Admin CRUD Operations

Use curl or similar tools with the admin API:

```bash
# Get all figures (requires API key)
curl -H "X-API-Key: your-key" http://localhost:3000/api/admin/figures

# Create a new tip
curl -X POST -H "X-API-Key: your-key" -H "Content-Type: application/json" \
  -d '{"title":"New Tip","urlSlug":"new-tip","content":"Content here","language":"vi"}' \
  http://localhost:3000/api/admin/tips

# Update an article
curl -X PUT -H "X-API-Key: your-key" -H "Content-Type: application/json" \
  -d '{"title":"Updated Title"}' \
  http://localhost:3000/api/admin/news/1

# Delete a figure
curl -X DELETE -H "X-API-Key: your-key" \
  http://localhost:3000/api/admin/figures/5
```
