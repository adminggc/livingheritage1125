# Living Heritage - Project Summary

## Overview
Living Heritage is a Vietnamese cultural heritage platform featuring articles, wellness tips, and heritage figures. The project is a full-stack Node.js/Express application with a JSON-based content management system and admin dashboard.

**Live Site**: https://livingheritage.live
**Current Status**: Production-ready, deployed on Railway
**Last Updated**: November 2024

---

## Project Structure

```
livingheritage/
├── admin/                    # Admin dashboard HTML
│   └── index.html           # Admin panel interface
├── assets/
│   ├── css/                 # Stylesheets for all pages
│   │   ├── disan.css       # Heritage figures styling
│   │   ├── theme.css       # Main theme
│   │   ├── tips.css        # Wellness tips styling
│   │   └── admin.css       # Admin panel styling
│   ├── img/                 # All images (static assets)
│   ├── js/                  # Frontend and admin JavaScript
│   │   ├── admin-db.js     # Admin CRUD operations
│   │   ├── admin-json.js   # JSON file management
│   │   ├── dynamic-detail-loader.js  # Content loading system
│   │   ├── news-loader.js  # News article loaders
│   │   ├── tips-loader.js  # Wellness tips loaders
│   │   ├── figures-loader.js # Heritage figures loaders
│   │   └── podcast-loader.js # Podcast content loader
│   └── media/               # Videos, podcasts, and media files
├── data/                    # JSON data files (primary content storage)
│   ├── news.json           # All news articles with htmlContent
│   ├── wellness-tips.json  # All wellness tips with htmlContent
│   ├── heritage-figures.json # All heritage figures with htmlBio
│   ├── podcasts.json       # Podcast metadata
│   └── *-en.json           # English versions of above
├── en/                      # English language versions of all pages
├── scripts/                 # Utility scripts
├── server.js               # Express server (main entry point)
├── package.json            # Node dependencies
├── Dockerfile              # Docker configuration
├── .env.example            # Environment variables template
└── *.html                  # All page templates (70+ files)
```

---

## Technology Stack

- **Backend**: Node.js 18+ with Express.js
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Database**: JSON files (no external database required) or PostgreSQL optional
- **Deployment**: Railway with Docker
- **Languages**: Vietnamese (primary) and English
- **Authentication**: Token-based (admin dashboard)

---

## Key Features

### 1. Dynamic Content Loading System
- **Method**: JavaScript-based client-side loading
- **Endpoint Pattern**: `/api/{type}/slug/{slug}` and `/{slug}/en`
- **Supports**: News articles, wellness tips, heritage figures, podcasts
- **HTML Preservation**: Full HTML designs stored in `htmlContent`/`htmlBio` fields
- **Location**: `assets/js/dynamic-detail-loader.js` (lines 123-246)

### 2. Admin Dashboard
- **Access**: `/admin` (password protected)
- **Features**:
  - Create, read, update, delete (CRUD) all content types
  - Edit rich HTML content with full design preservation
  - Upload and manage images
  - Bilingual support (Vietnamese and English)
- **Location**: `assets/js/admin-db.js`

### 3. HTML Design Preservation
Ensures rich formatting and embedded media are maintained:
- **News Articles**: Extracts from `.news-text` container
- **Wellness Tips**: Extracts from `.section-tips-content-body`
- **Heritage Figures**: Extracts from `.profile-content-body`
- **Extraction Scripts**:
  - `extract-html-design.js` (15 news articles)
  - `extract-html-design-tips.js` (12 wellness tips)
  - `extract-html-design-figures.js` (8 heritage figures)

### 4. Content Types

#### News Articles (15 articles)
- Stored in: `data/news.json` and `data/news-en.json`
- Fields: title, slug, description, imageUrl, htmlContent, createdAt
- Frontend: Dynamic loading on detail pages
- Admin: Full CRUD with HTML editing

#### Wellness Tips (12 tips)
- Stored in: `data/wellness-tips.json` and `data/wellness-tips-en.json`
- Fields: title, slug, description, imageUrl, htmlContent, summary, published
- Frontend: Dynamic loading with rich formatting
- Admin: Full CRUD with HTML editing

#### Heritage Figures (8 figures)
- Stored in: `data/heritage-figures.json` and `data/heritage-figures-en.json`
- Fields: fullName, title, position, heroImageUrl, htmlBio, introduction
- Frontend: Dynamic loading with biography
- Admin: View-only (typically managed via HTML files)

#### Podcasts (Metadata only)
- Stored in: `data/podcasts.json`
- Contains podcast links and metadata
- Players: YouTube/Spotify embeds on frontend

### 5. Bilingual Support
- **Vietnamese**: Default language, all pages in root
- **English**: `/en/` directory with English versions
- **API**: Separate endpoints for each language
- **Pattern**: Same URL structure with `/en/` prefix for English

---

## API Endpoints

### News
- `GET /api/news/slug/{slug}` - Get single news article
- `GET /api/news/slug/{slug}/en` - Get English version
- `GET /api/admin/news` - List all (admin only)
- `POST /api/admin/news` - Create (admin only)
- `PUT /api/admin/news/{id}` - Update (admin only)
- `DELETE /api/admin/news/{id}` - Delete (admin only)

### Wellness Tips
- `GET /api/tips/slug/{slug}` - Get single tip
- `GET /api/tips/slug/{slug}/en` - Get English version
- `GET /api/admin/tips` - List all (admin only)
- `POST /api/admin/tips` - Create (admin only)
- `PUT /api/admin/tips/{id}` - Update (admin only)
- `DELETE /api/admin/tips/{id}` - Delete (admin only)

### Heritage Figures
- `GET /api/figures/slug/{slug}` - Get single figure
- `GET /api/figures/slug/{slug}/en` - Get English version
- `GET /api/admin/figures` - List all (admin only)
- `POST /api/admin/figures` - Create (admin only)
- `PUT /api/admin/figures/{id}` - Update (admin only)
- `DELETE /api/admin/figures/{id}` - Delete (admin only)

---

## Admin Dashboard Guide

### Login
1. Go to `/admin`
2. Enter password (set in admin panel)
3. Password stored in browser local storage (secure for internal use)

### Manage News Articles
1. Dashboard → News Articles
2. Click "Edit" to modify existing or "Add New" to create
3. Fields:
   - Title, description, content (full HTML supported)
   - Hero image URL, featured image
   - Language selection (VI/EN)
4. Click "Save" to update JSON and database
5. Changes appear on frontend within seconds

### Manage Wellness Tips
1. Dashboard → Wellness Tips
2. Same editing interface as news
3. Full HTML content with formatting supported
4. Summary field for key points (optional)

### Manage Heritage Figures
1. Dashboard → Heritage Figures
2. Edit profile information and biography
3. Rich HTML biography with formatting

### Manage Podcasts
1. Dashboard → Podcasts
2. Add podcast metadata and links
3. Supports YouTube and Spotify embeds

---

## Deployment

### Current Deployment: Railway
- **URL**: https://livingheritage.live
- **GitHub**: https://github.com/adming79-pixel/livingheritage1125
- **Automatic**: Deploys on push to `railway-fork` master branch
- **Environment**: `USE_DATABASE=false` (JSON-based storage)

### Environment Variables
Create `.env` file:
```
PORT=3000
NODE_ENV=production
DATABASE_URL=<optional PostgreSQL>
ADMIN_PASSWORD=your_secure_password
```

### Docker Deployment
```bash
# Build
docker build -t livingheritage .

# Run
docker run -p 3000:3000 \
  -e PORT=3000 \
  -e USE_DATABASE=false \
  livingheritage
```

### Local Development
```bash
npm install
npm start
# Server runs on http://localhost:3000
```

---

## Data Management

### JSON File Structure
All content is stored in `/data/` directory as JSON files.

#### News Article Example
```json
{
  "id": 1,
  "urlSlug": "article-slug",
  "title": "Article Title",
  "description": "Short description",
  "imageUrl": "/assets/media/shared/news/image.jpg",
  "htmlContent": "<p>Full HTML content...</p>",
  "content": "Plain text fallback",
  "createdAt": "2024-11-23T00:00:00Z"
}
```

#### Wellness Tip Example
```json
{
  "id": 1,
  "urlSlug": "tip-slug",
  "title": "Tip Title",
  "description": "Description",
  "imageUrl": "/assets/media/tips/image.jpg",
  "heroImageUrl": "/assets/media/tips/hero.jpg",
  "htmlContent": "<p>Full HTML content with formatting...</p>",
  "summary": ["Point 1", "Point 2"],
  "published": true
}
```

#### Heritage Figure Example
```json
{
  "id": 1,
  "urlSlug": "figure-slug",
  "fullName": "Person Name",
  "title": "Position/Title",
  "position": "Detailed position",
  "introduction": "Brief intro",
  "heroImageUrl": "/assets/media/figures/hero.jpg",
  "htmlBio": "<p>Full biography HTML...</p>",
  "bio": "Plain text fallback"
}
```

### Adding New Content

**Via Admin Dashboard**:
1. Go to `/admin`
2. Select content type
3. Click "Add New"
4. Fill in fields (HTML editor available)
5. Save → JSON file updated automatically

**Manually via JSON**:
1. Edit `/data/{type}.json` directly
2. Follow the structure above
3. Save file
4. Restart server or refresh admin

---

## Common Tasks

### Edit News Article
1. `/admin` → News Articles
2. Find article by title
3. Click "Edit"
4. Modify content (use HTML editor for formatting)
5. Save

### Change Article Title or URL
1. Edit in admin dashboard
2. System auto-generates URL slug from title
3. Save → URL updates automatically
4. Links to article still work (via slug)

### Add Rich Media to Content
1. Upload image to `/assets/media/shared/{type}/`
2. In admin content editor, add:
```html
<figure class="article-figure">
  <img src="/assets/media/shared/news/image.jpg" alt="Description">
</figure>
```

3. For YouTube videos:
```html
<div class="ytb-embed-video">
  <iframe src="https://www.youtube.com/embed/VIDEO_ID"
    loading="lazy" allow="accelerometer; autoplay; clipboard-write;
    encrypted-media; gyroscope; picture-in-picture; web-share"
    allowfullscreen></iframe>
</div>
```

### Restore from HTML Files
If JSON becomes corrupted, re-extract from original HTML files:
```bash
# For news articles
node extract-html-design.js

# For wellness tips
node extract-html-design-tips.js

# For heritage figures
node extract-html-design-figures.js
```

---

## Troubleshooting

### Content Not Updating on Frontend
1. Hard refresh: `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
2. Check browser DevTools → Network → API response includes htmlContent
3. Verify JSON file saved: `data/{type}.json`
4. Check server logs for errors

### Images Not Showing
1. Verify image exists: `/assets/media/{path}/image.jpg`
2. Use absolute paths: `/assets/media/...` (not relative)
3. Check file permissions
4. Clear browser cache

### Admin Login Not Working
1. Check `.env` file has `ADMIN_PASSWORD` set
2. Verify password in browser local storage
3. Try clearing localStorage and re-login
4. Check server logs for authentication errors

### Database Connection Issues
If using PostgreSQL:
1. Verify `DATABASE_URL` in `.env`
2. Check database is running
3. Set `USE_DATABASE=true` in `.env`
4. Run migrations if needed

---

## Git Workflow

### Current Repository
- **GitHub**: https://github.com/adming79-pixel/livingheritage1125
- **Branch**: master (default)
- **Remote**: railway-fork (connects to Railway)

### Making Changes
```bash
# Create feature branch
git checkout -b feature/description

# Make changes
# ... edit files ...

# Commit
git add .
git commit -m "Description of changes"

# Push to railway-fork for deployment
git push railway-fork master
```

### Typical Commits
- Fix URL slug generation
- Add missing quote in profile
- Extract HTML designs for new content
- Update admin forms for tips
- Implement HTML design preservation

---

## Performance Notes

### Caching
- Static assets cached by browser (CSS, JS, images)
- JSON files loaded fresh on each request
- No server-side caching currently

### Content Loading
- Dynamic loaders wait for page to load before fetching API
- Average response time: <100ms for JSON files
- No database query overhead (JSON-based)

### Image Optimization
- Images stored in `/assets/media/`
- Consider WebP format for new images
- Compress images before uploading to reduce bandwidth

---

## Security Considerations

### Admin Access
- Password stored in browser localStorage (for internal use only)
- No HTTPS-only flag (Railway provides HTTPS)
- Consider adding token-based auth for production

### Content Validation
- HTML content is displayed as-is (no sanitization currently)
- User input in admin dashboard should be trusted
- Consider adding DOMPurify for user-generated content

### API Security
- No rate limiting currently implemented
- Consider adding IP whitelist for admin endpoints
- All endpoints accessible publicly (read-only)

---

## Future Enhancements

### Planned Features
- [ ] Database migration (PostgreSQL full integration)
- [ ] User comments/feedback system
- [ ] Search functionality
- [ ] Category/tag system for articles
- [ ] Scheduled content publishing
- [ ] Content versioning/history
- [ ] Advanced analytics

### Potential Improvements
- [ ] Image optimization and lazy loading
- [ ] Service worker for offline support
- [ ] GraphQL API alongside REST
- [ ] Real-time content updates (WebSocket)
- [ ] Multi-user admin with permissions
- [ ] Content workflow/approval system

---

## Contact & Support

For questions about this project:
1. Check existing `.md` documentation
2. Review code comments in `server.js` and `admin-db.js`
3. Check git commit messages for recent changes
4. Verify data structure in `/data/*.json` files

---

## Project History

### Phase 1: Initial Build
- Created HTML pages for all content
- Built Express server with JSON-based storage
- Implemented admin dashboard

### Phase 2: Dynamic Content Loading
- Implemented client-side content loaders
- Added bilingual support (Vietnamese/English)
- Fixed image handling and media embedding

### Phase 3: HTML Design Preservation
- Created extraction scripts to capture original HTML designs
- Updated dynamic loaders to use `htmlContent`/`htmlBio` fields
- Enhanced admin forms to display and preserve full HTML

### Phase 4: Production Deployment
- Deployed to Railway with Docker
- Configured environment variables
- Set up continuous deployment from GitHub

---

## Quick Reference

| Task | Location | Notes |
|------|----------|-------|
| Edit content | `/admin` | Password required |
| View API | `/api/{type}/slug/{slug}` | Returns JSON |
| Server code | `server.js` | Express setup |
| Admin logic | `assets/js/admin-db.js` | CRUD operations |
| Page loaders | `assets/js/dynamic-detail-loader.js` | Content injection |
| Content data | `data/*.json` | JSON files with all content |
| Stylesheets | `assets/css/` | All page styling |
| Images | `assets/img/` & `assets/media/` | Static assets |

---

**Last Updated**: November 23, 2024
**Version**: 1.0 - Production Ready
**Maintained By**: GGC Heritage Team
