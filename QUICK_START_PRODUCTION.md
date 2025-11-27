# Quick Start Guide - Living Heritage Production

## ⚡ 5-Minute Setup

### Prerequisites
- Node.js v14+
- PostgreSQL 12+
- npm or yarn

### Step 1: Clone & Install (2 min)
```bash
git clone https://github.com/adminggc/livingheritage1125.git
cd livingheritage1125
npm install
```

### Step 2: Create .env File (1 min)
```bash
cat > .env << EOF
PORT=3000
NODE_ENV=production
USE_DATABASE=true
USE_CACHE=true

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_NAME=livingheritage

# Redis (optional, for caching)
REDIS_HOST=localhost
REDIS_PORT=6379
EOF
```

### Step 3: Setup Database (1 min)
```bash
# Make sure PostgreSQL is running
psql -U postgres -c "CREATE DATABASE livingheritage;"

# Restore from backup if available
# psql -U postgres -d livingheritage < database/backup.sql
```

### Step 4: Start Server (1 min)
```bash
npm start
# Server will run on http://localhost:3000
```

### Step 5: Verify Installation
```bash
# Test public API
curl http://localhost:3000/api/figures
curl http://localhost:3000/api/news
curl http://localhost:3000/api/tips

# Test admin endpoints
curl http://localhost:3000/api/admin/figures
curl http://localhost:3000/api/admin/news
curl http://localhost:3000/api/admin/tips
```

---

## 📱 Access Points

| Component | URL | Note |
|-----------|-----|------|
| **Homepage** | http://localhost:3000/ | Public site |
| **Admin Panel** | http://localhost:3000/admin/ | Management interface |
| **Public API** | http://localhost:3000/api/ | Published content only |
| **Admin API** | http://localhost:3000/api/admin/ | All content + drafts |
| **Health Check** | http://localhost:3000/api/health | Server status |

---

## 🐳 Docker Setup (Alternative)

```bash
# Build image
docker build -t living-heritage .

# Run with compose
docker-compose up -d

# Check logs
docker-compose logs -f app

# Stop services
docker-compose down
```

---

## 🔧 Common Tasks

### View Server Logs
```bash
tail -f server.log

# Or with PM2
pm2 logs living-heritage
```

### Check Admin Panel Data
```bash
# Count records
psql -U postgres -d livingheritage -c \
  "SELECT COUNT(*) FROM heritage_figures; \
   SELECT COUNT(*) FROM news_articles; \
   SELECT COUNT(*) FROM wellness_tips;"
```

### Test Admin Endpoints
```bash
# Get all heritage figures (including drafts)
curl http://localhost:3000/api/admin/figures | jq '.heritageFigures | length'

# Get all news articles
curl http://localhost:3000/api/admin/news | jq '.news | length'

# Get all wellness tips
curl http://localhost:3000/api/admin/tips | jq '.wellnessTips | length'
```

### Update Content
Visit admin panel: `http://localhost:3000/admin/`
- Edit Heritage Figures, News, Wellness Tips
- Toggle publish/draft status
- Save changes

---

## ✅ Production Checklist

Before going live:
- [ ] Database backed up
- [ ] .env file configured with production values
- [ ] SSL/HTTPS enabled
- [ ] Monitoring set up (PM2 Plus, DataDog, etc.)
- [ ] Email notifications configured
- [ ] Admin users created
- [ ] Database indexes optimized
- [ ] Rate limiting enabled
- [ ] Backup strategy in place
- [ ] DNS configured

---

## 🚨 Troubleshooting

### Issue: Port 3000 already in use
```bash
# Find process using port
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Issue: Database connection failed
```bash
# Test PostgreSQL connection
psql -U postgres -h localhost -d livingheritage

# Check .env variables
cat .env | grep DB_
```

### Issue: Admin endpoints return empty
```bash
# Check database has content
psql -U postgres -d livingheritage
SELECT * FROM heritage_figures LIMIT 1;
SELECT * FROM news_articles LIMIT 1;
SELECT * FROM wellness_tips LIMIT 1;
```

### Issue: Admin panel styling broken
```bash
# Check static files are served
curl http://localhost:3000/assets/css/admin.css

# Clear browser cache
# Or in browser DevTools: Right-click → Hard Refresh (Ctrl+Shift+R)
```

---

## 📊 Key Features

✅ **Heritage Figures Management**
- View, create, edit, delete profiles
- Support for Vietnamese & English content
- Drag-drop image upload
- Rich text editor for descriptions

✅ **News Management**
- Publish news articles
- Schedule content
- Featured images
- Category organization

✅ **Wellness Tips**
- Educational content management
- Hero images
- SEO-friendly URLs
- Multi-language support

✅ **Admin Features**
- Draft/Publish workflow
- Bulk operations
- Search functionality
- User access control

---

## 📞 Support Resources

- **GitHub:** https://github.com/adminggc/livingheritage1125
- **Issues:** https://github.com/adminggc/livingheritage1125/issues
- **Docs:** See PRODUCTION_DEPLOYMENT.md

---

**Status:** Production Ready ✅
**Last Updated:** November 21, 2025
**Support:** Contact DevOps Team
