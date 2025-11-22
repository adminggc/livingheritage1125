# Railway Deployment Guide - Living Heritage

**Status:** Production Ready ✅
**Last Updated:** November 22, 2025
**Estimated Setup Time:** 15-20 minutes

---

## 📋 Prerequisites

- ✅ GitHub account (with repository at `https://github.com/adminggc/livingheritage1125`)
- ✅ Code already pushed to GitHub master branch
- ✅ Valid email address for Railway account
- ✅ Credit card for Railway account (first $5/month is free)

---

## 🚀 Step 1: Create Railway Account

### 1.1 Sign Up
1. Go to **https://railway.app**
2. Click **"Sign Up"** button (top right)
3. Choose sign-up method:
   - **GitHub Login** (Recommended - easiest)
   - Email
4. If using GitHub: Authorize Railway to access your GitHub account
5. Follow the setup wizard

### 1.2 After Sign Up
- Railway will show empty dashboard
- You should see **"New Project"** button
- This confirms account is ready

---

## 🔗 Step 2: Connect GitHub Repository

### 2.1 Create New Project
1. Click **"New Project"** button
2. Select **"GitHub Repo"** option
3. Choose your GitHub account if prompted
4. Search for `livingheritage1125` repository
5. Click on the repository to select it

### 2.2 Deploy Setup
- Railway will detect your GitHub repository
- May ask about deployment branch: **select "master"**
- May detect Node.js environment automatically
- Click **"Deploy Now"** (or "Next" to configure services first)

---

## 🗄️ Step 3: Add PostgreSQL Service

### 3.1 Add Database Service
1. In Railway dashboard, click **"+ New Service"** or **"Add Service"**
2. Select **"Database"**
3. Choose **"PostgreSQL"**
4. Railway will automatically:
   - Create PostgreSQL instance
   - Generate admin credentials
   - Set environment variables automatically

### 3.2 Verify PostgreSQL Setup
1. Click on the PostgreSQL service tile
2. You should see tabs: **"Logs"**, **"Metrics"**, **"Variables"**
3. Check **Variables** tab - should see:
   ```
   PGHOST (database hostname)
   PGUSER (default: postgres)
   PGPASSWORD (auto-generated)
   PGDATABASE (auto-generated)
   PGPORT (default: 5432)
   ```

### 3.3 Initialize Database Schema
After PostgreSQL is running:

**Option A: Using psql (Recommended)**
```bash
# Get connection details from Railway Variables tab
# Format: postgresql://PGUSER:PGPASSWORD@PGHOST:PGPORT/PGDATABASE

# Connect and run schema
psql "postgresql://postgres:PASSWORD@HOST:5432/database" < database/schema.sql
```

**Option B: Using Railway CLI**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Run migration
railway run "psql $DATABASE_URL < database/schema.sql"
```

**Option C: Using Node.js Script (if available)**
```bash
# Railway will execute this automatically
NODE_ENV=production DATABASE_URL=... npm run migrate
```

---

## ⚡ Step 4: Add Redis Service (Optional but Recommended)

### 4.1 Add Cache Service
1. Click **"+ New Service"** or **"Add Service"**
2. Select **"Database"**
3. Choose **"Redis"**
4. Railway will automatically:
   - Create Redis instance
   - Generate credentials
   - Set environment variables

### 4.2 Verify Redis Setup
1. Click on Redis service tile
2. Check **Variables** tab - should see:
   ```
   REDIS_HOST (redis hostname)
   REDIS_PORT (default: 6379)
   REDIS_PASSWORD (auto-generated)
   REDIS_URL (full connection string)
   ```

---

## 🔧 Step 5: Configure Environment Variables

### 5.1 Set Variables for Node.js App
1. Click on your **Node.js application** service
2. Go to **"Variables"** tab
3. Railway automatically provides these from PostgreSQL:
   ```
   PGHOST
   PGUSER
   PGPASSWORD
   PGDATABASE
   PGPORT
   ```
4. Railway automatically provides these from Redis:
   ```
   REDIS_HOST
   REDIS_PORT
   REDIS_PASSWORD
   REDIS_URL
   ```

### 5.2 Add Additional Variables
Click **"+ New Variable"** and add:

```env
# Application Settings
PORT=3000
NODE_ENV=production

# Database Configuration (Railway auto-provides PGHOST, PGUSER, etc.)
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_USER=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
DB_NAME=${{Postgres.PGDATABASE}}

# Redis Configuration (Railway auto-provides REDIS_*)
REDIS_HOST=${{Redis.REDIS_HOST}}
REDIS_PORT=${{Redis.REDIS_PORT}}
REDIS_PASSWORD=${{Redis.REDIS_PASSWORD}}

# Feature Flags
USE_DATABASE=true
USE_CACHE=true
ENABLE_QUERY_LOGGING=false

# Security (Update these!)
JWT_SECRET=your_jwt_secret_key_change_this
SESSION_SECRET=your_session_secret_change_this
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_strong_admin_password

# CORS
CORS_ORIGIN=https://your-domain.railway.app

# Logging
LOG_LEVEL=info
LOG_TO_FILE=false
```

### 5.3 Important Notes on Variables
- Railway uses `${{SERVICE_NAME.VARIABLE}}` syntax for cross-service variables
- Variables are automatically injected - no need to manage them in `.env` file
- Can override any `.env` setting with Railway variables
- Secrets (passwords, keys) are encrypted and secure

---

## 🚀 Step 6: Deploy Application

### 6.1 Deploy from GitHub
1. Click on your **Node.js** service
2. Should see deployment status
3. If already connected, Railway auto-deploys on `git push` to master
4. Watch **"Deployments"** tab for status

### 6.2 Manual Redeploy
If needed to force redeploy:
1. Go to service settings
2. Find **"Redeploy"** button
3. Click to manually trigger deployment

### 6.3 Check Deployment Logs
1. Click on Node.js service
2. Go to **"Logs"** tab
3. Should see:
   ```
   > node server.js
   Server running on port 3000
   Connected to PostgreSQL
   Redis cache available
   ```

---

## ✅ Step 7: Verify Deployment

### 7.1 Get Your Public URL
1. Click on Node.js service
2. Look for **"Generate Domain"** button (or similar)
3. Railway provides a public URL like: `https://livingheritage-prod-abc123.railway.app`
4. Save this URL

### 7.2 Test API Endpoints
Open your browser or use curl:

```bash
# Test health check
curl https://your-railway-domain.railway.app/api/health

# Test public endpoints
curl https://your-railway-domain.railway.app/api/figures
curl https://your-railway-domain.railway.app/api/news
curl https://your-railway-domain.railway.app/api/tips

# Test admin endpoints
curl https://your-railway-domain.railway.app/api/admin/figures
curl https://your-railway-domain.railway.app/api/admin/news
curl https://your-railway-domain.railway.app/api/admin/tips

# Test homepage
curl https://your-railway-domain.railway.app/

# Test admin panel
curl https://your-railway-domain.railway.app/admin/
```

### 7.3 Expected Responses
All should return HTTP 200 with JSON data:
- `api/figures`: Array of heritage figures
- `api/news`: Array of news articles
- `api/tips`: Array of wellness tips
- `admin/figures`: All figures (including drafts)
- `/`: HTML homepage
- `/admin/`: HTML admin panel

---

## 🌐 Step 8: Configure Custom Domain (Optional)

### 8.1 Add Custom Domain
1. Click Node.js service
2. Look for **"Domains"** section
3. Click **"+ Add Domain"**
4. Enter your domain: `www.yoursite.com` or `livingheritage.com`
5. Railway provides DNS records to configure

### 8.2 Update DNS Settings
1. Go to your domain registrar (GoDaddy, Namecheap, etc.)
2. Find DNS settings
3. Add the CNAME record Railway provides
4. Wait 15-30 minutes for DNS propagation
5. Visit your custom domain - should see your site

### 8.3 SSL Certificate
Railway automatically:
- Provides free SSL/TLS certificate
- Enables HTTPS automatically
- Handles certificate renewal

---

## 📊 Step 9: Monitor Your Deployment

### 9.1 Railway Dashboard
- **Deployments tab**: See deployment history
- **Logs tab**: Real-time application logs
- **Metrics tab**: CPU, memory, network usage
- **Variables tab**: All environment variables

### 9.2 Set Up Alerts (Optional)
1. Go to **Project Settings**
2. Enable notifications for:
   - Deployment failures
   - High CPU/memory usage
   - Service errors

### 9.3 View Metrics
1. Click service → **"Metrics"** tab
2. See real-time:
   - Memory usage
   - CPU usage
   - Network I/O
   - Container restarts

---

## 🔒 Step 10: Security Checklist

### 10.1 Before Going Live
- [ ] Change `ADMIN_PASSWORD` to strong password
- [ ] Change `JWT_SECRET` to random string
- [ ] Change `SESSION_SECRET` to random string
- [ ] Set `NODE_ENV=production` (already done)
- [ ] Set `LOG_LEVEL=warn` (reduce noise in logs)
- [ ] Enable CORS_ORIGIN for your domain only
- [ ] Configure rate limiting if needed
- [ ] Set up database backups

### 10.2 Database Security
Railway PostgreSQL:
- ✅ Encrypted in transit (SSL)
- ✅ Encrypted at rest
- ✅ Automated backups (configurable in settings)
- ✅ Network isolation

### 10.3 Regular Maintenance
- [ ] Weekly: Check logs for errors
- [ ] Monthly: Review metrics and optimize if needed
- [ ] Quarterly: Update dependencies (`npm update`)
- [ ] Annually: Review and update security settings

---

## 🐛 Troubleshooting

### Issue: Deployment Fails
**Check:**
1. Logs tab - read error message carefully
2. GitHub branch is `master`
3. `server.js` exists in root directory
4. `package.json` exists and is valid JSON
5. No sensitive data in logs

**Fix:**
```bash
# Push fix to GitHub - Railway auto-redeploys
git push origin master
```

### Issue: "Cannot connect to database"
**Check:**
1. PostgreSQL service is running (check Dashboard)
2. DB_HOST, DB_USER, DB_PASSWORD are correct
3. Database is initialized: `psql ... < database/schema.sql`

**Fix:**
```bash
# Get correct credentials from Railway Variables tab
# Update your code to use Railway auto-provided PGHOST, PGUSER, etc.
```

### Issue: Admin panel shows no data
**Check:**
1. Database is initialized and has data
2. `/api/admin/figures` endpoint returns data
3. Admin panel JavaScript is loading correctly

**Test:**
```bash
curl https://your-domain.railway.app/api/admin/figures
```

### Issue: Images not loading
**Check:**
1. Static files are in `/assets` directory
2. Server.js has `app.use(express.static('assets'))`
3. Image paths are correct in database

**Fix:**
```bash
# Check logs for 404 errors
# Verify assets folder is pushed to GitHub
git add assets/
git push origin master
```

### Issue: High memory usage
**Check:**
1. Redis caching is working (`USE_CACHE=true`)
2. No memory leaks in application code
3. Database query optimization

**Fix:**
```bash
# Upgrade Railway plan for more resources
# Or optimize code and redeploy
git push origin master
```

### Issue: Slow response times
**Check:**
1. Database queries are optimized
2. Indexes exist on frequently queried columns
3. Redis cache is working (check `/api/health`)

**Optimize:**
```bash
# Check database indexes
psql -U postgres -d livingheritage -c "\d heritage_figures"

# Add indexes if needed
psql -U postgres -d livingheritage -c "CREATE INDEX idx_published ON heritage_figures(published);"
```

---

## 📈 Performance Optimization for Railway

### Enable Caching
```env
USE_CACHE=true              # Enable Redis caching
CACHE_TTL_LISTS=300         # 5 minutes
CACHE_TTL_ITEMS=900         # 15 minutes
CACHE_TTL_SEARCH=180        # 3 minutes
```

### Database Optimization
```sql
-- Create indexes for faster queries
CREATE INDEX idx_published ON heritage_figures(published);
CREATE INDEX idx_language ON heritage_figures(language);
CREATE INDEX idx_created_at ON heritage_figures(created_at DESC);

CREATE INDEX idx_published_news ON news_articles(published);
CREATE INDEX idx_language_news ON news_articles(language);

CREATE INDEX idx_published_tips ON wellness_tips(published);
```

### Application Scaling
Railway automatically scales CPU/memory. If you need more instances:
1. Go to service settings
2. Increase resource allocation
3. Railway handles horizontal scaling automatically

---

## 📞 Support & Documentation

### Railway Resources
- **Documentation**: https://docs.railway.app
- **Community**: https://railway.app/community
- **Status Page**: https://status.railway.app

### Your Application Resources
- **GitHub**: https://github.com/adminggc/livingheritage1125
- **Issues**: https://github.com/adminggc/livingheritage1125/issues
- **Deployment Guide**: This file (RAILWAY_DEPLOYMENT_GUIDE.md)
- **Production Guide**: PRODUCTION_DEPLOYMENT.md
- **Quick Start**: QUICK_START_PRODUCTION.md

---

## 🎯 Quick Reference Checklist

### Before Deployment
- [ ] GitHub repository is public
- [ ] Code is pushed to master branch
- [ ] `package.json` has Node.js 18+ requirement
- [ ] `server.js` exists and runs without errors locally

### Railway Setup
- [ ] Railway account created
- [ ] GitHub repository connected
- [ ] PostgreSQL service added
- [ ] Redis service added (optional but recommended)
- [ ] Environment variables configured
- [ ] Database schema initialized

### Post-Deployment Verification
- [ ] Public URL is accessible
- [ ] Health check endpoint responds: `/api/health`
- [ ] All API endpoints return data
- [ ] Admin panel loads correctly
- [ ] Homepage displays properly
- [ ] Images load correctly

### Security
- [ ] Strong admin password set
- [ ] JWT secrets configured
- [ ] NODE_ENV=production
- [ ] CORS configured for your domain
- [ ] SSL certificate is active (HTTPS)
- [ ] Database backups enabled

---

## 💰 Cost Estimate on Railway

```
Free Tier: $5/month free credit

Typical Usage:
├─ Node.js App:     $0-15/month (depends on CPU/memory)
├─ PostgreSQL:      $5-15/month (managed database)
├─ Redis:           $2-5/month (caching)
└─ Total:           ~$15-30/month

All included in free $5 credit initially!
```

---

## 🚀 What's Next?

### After Successful Deployment

1. **Monitor Deployment**
   - Check logs regularly for errors
   - Monitor resource usage
   - Set up alerts

2. **Configure Domain**
   - Add custom domain if available
   - Update DNS records
   - Test HTTPS works correctly

3. **Set Up Backups**
   - Configure PostgreSQL backups
   - Test backup restore process
   - Document recovery procedure

4. **Team Access**
   - Invite team members to Railway project
   - Grant appropriate permissions
   - Document access procedures

5. **Content Updates**
   - Test admin panel functionality
   - Create admin user accounts
   - Train content managers

---

**Status:** Ready for Production Deployment ✅
**Support:** Contact Railway support or check GitHub issues
**Last Updated:** November 22, 2025

Happy deploying! 🚀
