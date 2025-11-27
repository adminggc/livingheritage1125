# Railway Deployment Guide

## ✅ Code Pushed to Railway Repository

**Repository**: https://github.com/adming79-pixel/livingheritage1125
**Code Pushed**: Master branch with all TinyMCE and configuration updates

## 🚀 Deploy to Railway

### Option 1: GitHub Integration (Automatic)

1. Go to your Railway project dashboard
2. Connect the GitHub repository: `adming79-pixel/livingheritage1125`
3. Railway will auto-deploy on every push to master

### Option 2: Manual Railway CLI

```bash
# Set your Railway token
export RAILWAY_TOKEN=0e6303aa-45d8-40c3-acdb-9709bf936a7c

# Deploy from current directory
railway up
```

## 🔧 Environment Variables Required

Set these in your Railway project:

```
USE_DATABASE=false
NODE_ENV=production
ADMIN_API_KEY=Dd1zADF8rPT2vxigpYt2l0g8sUpmuQyF9xAtnLpzZvQ=
PORT=3000
```

**How to Set:**
1. Go to Railway Project Dashboard
2. Click on your service (Node.js app)
3. Go to **Variables** tab
4. Add the environment variables above

## 📋 What's Included

✅ Express.js server with all routes
✅ TinyMCE HTML editor integration
✅ JSON-based content storage
✅ Admin panel (http://yourapp.railway.app/admin)
✅ API endpoints for content
✅ Vercel configuration (fallback option)
✅ vercel.json for serverless compatibility
✅ package.json with Node.js 24.x

## 📊 Project Structure

```
livingheritage1125/
├── server.js                    # Main Express server
├── admin/                       # Admin panel HTML
├── assets/                      # CSS, JS, media
├── data/                        # JSON content files
│   ├── news.json
│   ├── news-en.json
│   ├── wellness-tips.json
│   ├── wellness-tips-en.json
│   ├── heritage-figures.json
│   └── heritage-figures-en.json
├── src/                         # Backend code
│   ├── db/                      # Database connection
│   ├── repositories/            # Data access layer
│   └── cache/                   # Redis caching
├── package.json
├── vercel.json
└── .railwayrc.json

```

## 🎯 Expected Result After Deployment

- **Homepage**: https://yourapp.railway.app
- **Admin Panel**: https://yourapp.railway.app/admin
  - Login: `admin` / `admin123`
- **API Status**: https://yourapp.railway.app/api/status
- **News API**: https://yourapp.railway.app/api/news

## ⚠️ Important Notes

### JSON Mode (Current)
- Content changes are **NOT persistent** across redeploys
- Each redeploy resets to JSON files in GitHub
- To persist changes:
  1. Edit in admin panel
  2. Export JSON files
  3. Commit to GitHub
  4. Railway will auto-redeploy

### Switch to Database Mode (Recommended)
To make changes persistent:

1. Add PostgreSQL service in Railway
2. Set `USE_DATABASE=true`
3. Set `DATABASE_URL` to Railway Postgres URL
4. Changes will persist in database

## 🔗 Useful Commands

```bash
# Check Railway status
railway status

# View deployment logs
railway logs

# View environment variables
railway variables

# Open project dashboard
railway open

# SSH into the service
railway ssh
```

## 🐛 Troubleshooting

### Admin panel shows 0 items
- ✓ Check environment variables are set
- ✓ Verify `USE_DATABASE=false`
- ✓ Check deployment logs: `railway logs`

### Cannot connect to server
- ✓ Check PORT is set to 3000
- ✓ Verify Node.js version (should be 24.x)
- ✓ Check build logs for errors

### Changes not persisting
- ✓ You're in JSON mode - changes don't persist by default
- ✓ Export JSON and commit to save changes
- ✓ OR switch to Database Mode for persistent storage

## 📞 Support

- Railway Docs: https://docs.railway.app
- Project API Token: `0e6303aa-45d8-40c3-acdb-9709bf936a7c`

---

**Status**: Code pushed to Railway repository ✅
**Next Step**: Deploy via Railway dashboard or CLI
