# Living Heritage - Production Deployment Guide

## 📦 Latest Production Build

**Repository:** https://github.com/adminggc/livingheritage1125
**Latest Commit:** `e964944` - Add admin GET endpoints to resolve missing content in admin panel
**Build Date:** November 21, 2025
**Status:** ✅ TESTED & VERIFIED

---

## 🎯 What's New in This Release

### Admin Panel Enhancement
- ✅ Added 6 new admin GET endpoints for accessing all content (including unpublished drafts)
- ✅ Fixed admin panel integration with database
- ✅ Heritage Figures, News, and Wellness Tips now fully accessible in admin panel
- ✅ All 7 e2e tests PASSED with 117ms execution time

### Endpoints Added
```
GET /api/admin/figures     - All Vietnamese heritage figures
GET /api/admin/figures-en  - All English heritage figures
GET /api/admin/news        - All Vietnamese news articles
GET /api/admin/news-en     - All English news articles
GET /api/admin/tips        - All Vietnamese wellness tips
GET /api/admin/tips-en     - All English wellness tips
```

---

## 🚀 Deployment Steps

### 1. Clone the Repository
```bash
git clone https://github.com/adminggc/livingheritage1125.git
cd livingheritage1125
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create `.env` file with required variables:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=livingheritage

# Server Configuration
PORT=3000
NODE_ENV=production

# Cache Configuration
USE_CACHE=true
USE_DATABASE=true

# Redis (if using cache)
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 4. Database Setup
```bash
# Initialize PostgreSQL database
psql -U postgres -d livingheritage -f database/schema.sql

# Or run migrations if available
npm run migrate
```

### 5. Start the Server
```bash
# Development
npm start

# Production (with PM2)
pm2 start server.js --name "living-heritage" --env production
```

### 6. Verify Server is Running
```bash
curl http://localhost:3000/api/status
```

---

## 📋 File Structure

### Core Files
- `server.js` - Express server with all API endpoints
- `.env` - Environment configuration (create locally)
- `package.json` - Node.js dependencies

### Frontend
- `admin/` - Admin panel interface
- `index.html` - Public homepage
- `assets/` - CSS, JavaScript, images, media

### Backend
- `src/` - Source code
  - `db/` - Database connection
  - `repositories/` - Data access layer
  - `cache/` - Redis caching service
- `database/` - Database schema and migrations

### Configuration
- `docker-compose.yml` - Docker setup
- `Dockerfile` - Container definition
- `nginx/` - Nginx configuration for reverse proxy

---

## ✅ Quality Assurance

### Tests Executed
- ✅ Admin Figures Endpoint
- ✅ Admin News Endpoint
- ✅ Admin Tips Endpoint
- ✅ API Response Field Transformation
- ✅ Admin Panel Heritage Figures Load
- ✅ Admin Panel News Load
- ✅ Admin Panel Tips Load

### Test Results
```
Status: PASS
Tests Executed: 7
Tests Passed: 7
Tests Failed: 0
Execution Time: 117ms
```

---

## 🔒 Security Checklist

- [ ] Update `.env` with strong database password
- [ ] Set `NODE_ENV=production`
- [ ] Configure HTTPS/SSL certificate
- [ ] Set up firewall rules
- [ ] Configure CORS if needed
- [ ] Enable rate limiting
- [ ] Set up backup strategy for database
- [ ] Configure monitoring and logging

---

## 🛠️ Docker Deployment (Optional)

### Build Docker Image
```bash
docker build -t living-heritage:latest .
```

### Run with Docker Compose
```bash
docker-compose up -d
```

### Check Container Status
```bash
docker-compose ps
```

---

## 📊 Database Schema

### Tables
- `heritage_figures` - Heritage figure profiles
- `news_articles` - News and article content
- `wellness_tips` - Wellness tips and advice
- `podcasts` - Podcast/video content
- `banners` - Website banners

### Key Fields
- `published` - Boolean flag for content visibility
- `language` - Language code (vi, en)
- `created_at`, `updated_at` - Timestamps

---

## 🔄 API Endpoints Reference

### Public Endpoints (Published Content Only)
```
GET /api/figures       - Vietnamese heritage figures
GET /api/figures-en    - English heritage figures
GET /api/news          - Vietnamese news
GET /api/news-en       - English news
GET /api/tips          - Vietnamese wellness tips
GET /api/tips-en       - English wellness tips
```

### Admin Endpoints (All Content Including Drafts)
```
GET /api/admin/figures      - All figures (VI)
GET /api/admin/figures-en   - All figures (EN)
GET /api/admin/news         - All news (VI)
GET /api/admin/news-en      - All news (EN)
GET /api/admin/tips         - All tips (VI)
GET /api/admin/tips-en      - All tips (EN)

POST /api/admin/figures     - Create figure
PUT /api/admin/figures/:id  - Update figure
DELETE /api/admin/figures/:id - Delete figure
```

---

## 🐛 Troubleshooting

### Connection Refused
- Check database is running: `psql -U postgres`
- Verify DB_HOST and DB_PORT in .env

### Admin Panel Shows No Data
- Verify server is running: `curl http://localhost:3000/api/admin/figures`
- Check database has content: `SELECT COUNT(*) FROM heritage_figures;`
- Ensure USE_DATABASE=true in .env

### Static Files Not Loading
- Check `assets/` directory exists
- Verify server.js is serving static files
- Check browser console for 404 errors

---

## 📞 Support

For issues or questions:
1. Check the logs: `docker-compose logs app`
2. Review this deployment guide
3. Check GitHub issues: https://github.com/adminggc/livingheritage1125/issues

---

## 📝 Commit History

Latest commits pushed to production:
1. `e964944` - Add admin GET endpoints to resolve missing content in admin panel ✅
2. `545591d` - Fix URL slug generation to handle Vietnamese diacritical marks
3. `97bd82c` - Update Header Letter field to accept full words instead of single characters
4. `7c156bd` - Fix broken images in English heritage figure detail pages
5. `ae5baaa` - Fix Wellness Tips edit form field IDs to match HTML form elements

---

**Deployment Date:** November 21, 2025
**Status:** Production Ready ✅
**Last Updated:** 2025-11-21T15:30:00Z
