# Railway Quick Start - 10 Minutes to Live

**Time:** ~10 minutes
**Status:** Ready to deploy
**Support:** RAILWAY_DEPLOYMENT_GUIDE.md for detailed instructions

---

## ⚡ 1-Minute Setup Overview

```bash
1. Create Railway account → https://railway.app (2 min)
2. Connect GitHub repository → livingheritage1125 (2 min)
3. Add PostgreSQL service → Click "Add Service" (2 min)
4. Add Redis service → Click "Add Service" (1 min)
5. Set environment variables → Copy from below (2 min)
6. Watch deployment → Railway auto-deploys (1 min)
7. Test endpoints → curl your-domain/api/health (1 min)
```

---

## 🚀 Step-by-Step Commands

### Step 1: Create Railway Account
```
Go to: https://railway.app
Click: "Sign Up" (use GitHub login for fastest setup)
Authorize: Railway to access your GitHub account
```

### Step 2: Create New Project
```
Click: "New Project" button
Select: "GitHub Repo"
Choose: "livingheritage1125" repository
Wait: Railway detects Node.js environment (automatic)
```

### Step 3: Add Database Services

**Add PostgreSQL:**
```
Click: "+ Add Service" or "+ New Service"
Select: "Database"
Choose: "PostgreSQL"
Wait: 30 seconds for database to initialize
```

**Add Redis (Optional but Recommended):**
```
Click: "+ Add Service" or "+ New Service"
Select: "Database"
Choose: "Redis"
Wait: 30 seconds for Redis to initialize
```

### Step 4: Configure Environment Variables

**In Railway Dashboard - Node.js Service Variables Tab:**

Add these variables (copy/paste):

```env
# Application
PORT=3000
NODE_ENV=production

# Database (Railway auto-provides from PostgreSQL service)
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_USER=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
DB_NAME=${{Postgres.PGDATABASE}}

# Cache (Railway auto-provides from Redis service)
REDIS_HOST=${{Redis.REDIS_HOST}}
REDIS_PORT=${{Redis.REDIS_PORT}}
REDIS_PASSWORD=${{Redis.REDIS_PASSWORD}}

# Features
USE_DATABASE=true
USE_CACHE=true
ENABLE_QUERY_LOGGING=false

# Security (CHANGE THESE!)
JWT_SECRET=change_this_to_random_string
SESSION_SECRET=change_this_to_random_string
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change_this_to_strong_password

# CORS
CORS_ORIGIN=*
```

### Step 5: Deploy Application

**Automatic Deployment (Recommended):**
```
Your code is already in GitHub master branch
Railway automatically deploys when master branch updates
Just wait for deployment to complete (watch Logs tab)
```

**Manual Redeploy (if needed):**
```
Click: Node.js service
Find: "Redeploy" button
Click: To force manual deployment
```

### Step 6: Initialize Database

**Get Connection Details:**
1. Click PostgreSQL service
2. Go to "Variables" tab
3. Copy PGHOST, PGUSER, PGPASSWORD, PGDATABASE values

**Run Schema (from your local machine):**
```bash
# Replace PGUSER, PASSWORD, HOST, DATABASE with values from Railway
psql -U PGUSER -h HOST -d DATABASE -c "
  \i database/schema.sql
"
```

**Or if you have psql installed:**
```bash
# Connection string format from Railway Variables
psql "postgresql://user:password@host:5432/database" < database/schema.sql
```

---

## 🌐 Access Your Deployed App

### Get Public URL
```
In Railway Dashboard:
1. Click Node.js service
2. Look for "Domains" section or public URL
3. It looks like: https://livingheritage-prod-abc123.railway.app
```

### Test Endpoints

```bash
# Set your Railway URL
DOMAIN="https://your-railway-url"

# Test health check
curl $DOMAIN/api/health

# Test public APIs
curl $DOMAIN/api/figures
curl $DOMAIN/api/news
curl $DOMAIN/api/tips

# Test admin APIs
curl $DOMAIN/api/admin/figures
curl $DOMAIN/api/admin/news
curl $DOMAIN/api/admin/tips

# Test homepage
curl $DOMAIN/

# Test admin panel
curl $DOMAIN/admin/
```

### Expected Results

- ✅ All endpoints return HTTP 200
- ✅ JSON responses contain data
- ✅ Homepage HTML loads
- ✅ Admin panel HTML loads
- ✅ Images load correctly

---

## 🔍 Check Logs & Troubleshoot

### View Deployment Logs
```
In Railway Dashboard:
1. Click on Node.js service
2. Go to "Logs" tab
3. Should see: "Server running on port 3000"
4. Should see: "Connected to PostgreSQL"
```

### Common Issues

**Issue: "Cannot connect to database"**
- [ ] PostgreSQL service is running
- [ ] Environment variables are set correctly
- [ ] Database schema was initialized
- [ ] Check Logs tab for error details

**Issue: "No data in admin panel"**
- [ ] Test: `curl yoururl/api/admin/figures`
- [ ] Check: Database has data
- [ ] Check: Browser console for JS errors
- [ ] Clear: Browser cache (Ctrl+Shift+R)

**Issue: "Images not loading"**
- [ ] Check: Assets folder was pushed to GitHub
- [ ] Check: Image paths in database
- [ ] Check: Browser console for 404 errors

**Issue: "Slow response times"**
- [ ] Enable caching: `USE_CACHE=true`
- [ ] Check: Database indexes
- [ ] Monitor: Metrics tab in Railway

---

## 📊 Monitor Your App

### Real-time Monitoring
```
In Railway Dashboard:
1. Click on Node.js service
2. "Logs" tab - see live application logs
3. "Metrics" tab - see CPU, memory, network usage
4. "Deployments" tab - see deployment history
```

### Set Up Alerts (Optional)
```
1. Go to Project Settings
2. Enable notifications for failures
3. Set alert thresholds for CPU/memory
```

---

## 🔒 Security Checklist

Before sharing your app publicly:

- [ ] Change ADMIN_PASSWORD in environment variables
- [ ] Change JWT_SECRET to random value
- [ ] Change SESSION_SECRET to random value
- [ ] Set NODE_ENV=production (done)
- [ ] Check CORS_ORIGIN is configured properly
- [ ] Enable HTTPS (Railway does this automatically)
- [ ] Configure rate limiting in server.js if needed

---

## 🌐 Add Custom Domain (Optional)

```
1. Click Node.js service
2. Find "Domains" section
3. Click "+ Add Domain"
4. Enter your domain (e.g., livingheritage.com)
5. Railway shows DNS records to add
6. Update your domain registrar's DNS settings
7. Wait 15-30 minutes for propagation
8. Visit your domain - should see your app

SSL Certificate:
- Railway automatically provides free SSL
- HTTPS works automatically
- No manual configuration needed
```

---

## 📱 API Reference

### Public Endpoints (Published Content Only)
```
GET /api/figures           - Vietnamese heritage figures
GET /api/figures-en        - English heritage figures
GET /api/news              - Vietnamese news articles
GET /api/news-en           - English news articles
GET /api/tips              - Vietnamese wellness tips
GET /api/tips-en           - English wellness tips
GET /api/health            - Server health check
```

### Admin Endpoints (All Content + Drafts)
```
GET /api/admin/figures     - All Vietnamese figures
GET /api/admin/figures-en  - All English figures
GET /api/admin/news        - All Vietnamese news
GET /api/admin/news-en     - All English news
GET /api/admin/tips        - All Vietnamese tips
GET /api/admin/tips-en     - All English tips
```

### Frontend
```
GET /                      - Homepage
GET /admin/                - Admin panel
GET /assets/*              - Static files (CSS, JS, images)
```

---

## 💰 Cost

```
Free Tier: $5/month credit (enough for first month!)

Typical Monthly Cost:
- Node.js app:   $0-15/month
- PostgreSQL:    $5-15/month
- Redis:         $2-5/month
- Total:         ~$15-30/month

All included in initial $5 credit!
```

---

## 📚 Need More Details?

- **Detailed Guide:** See `RAILWAY_DEPLOYMENT_GUIDE.md`
- **Production Setup:** See `PRODUCTION_DEPLOYMENT.md`
- **Quick Start Local:** See `QUICK_START_PRODUCTION.md`
- **Railway Docs:** https://docs.railway.app
- **GitHub Repo:** https://github.com/adminggc/livingheritage1125

---

## ✅ Success Checklist

After completing all steps, verify:

- [ ] Railway account created
- [ ] GitHub repository connected
- [ ] PostgreSQL service running
- [ ] Redis service running (if added)
- [ ] Environment variables configured
- [ ] Database schema initialized
- [ ] Deployment succeeded (check Logs)
- [ ] Public URL accessible
- [ ] Health check endpoint responds
- [ ] Admin panel loads data
- [ ] Images display correctly
- [ ] HTTPS works (green lock icon)

**If all checkmarks are checked: YOU'RE LIVE! 🎉**

---

## 🆘 Need Help?

1. Check logs in Railway dashboard (Logs tab)
2. Read detailed guide: RAILWAY_DEPLOYMENT_GUIDE.md
3. Check GitHub issues: https://github.com/adminggc/livingheritage1125/issues
4. Contact Railway support: https://railway.app/community

---

**Time to Deploy:** 10-15 minutes
**Status:** READY ✅
**Last Updated:** November 22, 2025

Happy deploying! 🚀
