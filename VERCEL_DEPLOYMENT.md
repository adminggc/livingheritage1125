# Vercel Deployment Guide

## ✅ Configuration Complete

I've added the necessary Vercel configuration files to deploy your Node.js application properly.

## 📁 Files Added

1. **vercel.json** - Vercel configuration
   - Configures Node.js runtime
   - Routes all requests through server.js
   - Sets production environment

2. **.gitignore** - Git ignore file
   - Excludes node_modules, logs, test files
   - Keeps data/*.json files in repository

3. **.vercelignore** - Vercel ignore file
   - Excludes unnecessary files from deployment
   - Keeps data/*.json files for deployment

4. **package.json** - Updated
   - Node.js engine set to 18.x

## 🚀 Next Steps in Vercel

### 1. Redeploy in Vercel Dashboard

Go to your Vercel project: https://vercel.com/adminggc/livingheritage1125

Click **"Redeploy"** to trigger a new deployment with the updated configuration.

### 2. Environment Variables (Important!)

In Vercel dashboard, go to **Settings → Environment Variables** and add:

**For JSON Mode** (current setup):
```
USE_DATABASE=false
NODE_ENV=production
ADMIN_API_KEY=Dd1zADF8rPT2vxigpYt2l0g8sUpmuQyF9xAtnLpzZvQ=
```

**For Database Mode** (if using PostgreSQL):
```
USE_DATABASE=true
DATABASE_URL=postgresql://user:password@host:port/database
ADMIN_API_KEY=Dd1zADF8rPT2vxigpYt2l0g8sUpmuQyF9xAtnLpzZvQ=
NODE_ENV=production
```

Optional (if using Redis):
```
USE_CACHE=true
REDIS_URL=redis://host:port
```

### 3. Verify Deployment

After redeployment:
1. Visit your site: `https://livingheritage1125.vercel.app`
2. Test admin panel: `https://livingheritage1125.vercel.app/admin`
3. Check API endpoints: `https://livingheritage1125.vercel.app/api/status`

## 📝 How It Works

### Old Setup (Static):
- Vercel treated it as static HTML
- No server running
- API endpoints not working
- Admin panel couldn't load data

### New Setup (Node.js):
- Vercel runs server.js as serverless function
- All routes go through Express server
- API endpoints work properly
- Admin panel loads data from JSON files

## ⚠️ Important Notes

### Data Persistence

**JSON Mode** (Current):
- ⚠️ Changes made in admin panel are NOT persistent across deployments
- Each redeploy resets to the JSON files in GitHub
- To persist changes: Edit locally → Commit to GitHub → Redeploy

**Database Mode** (Recommended for Production):
- ✅ Changes persist in PostgreSQL database
- No data loss on redeploy
- Set `USE_DATABASE=true` and configure `DATABASE_URL`

### Workflow for JSON Mode

1. Make changes in admin panel (temporary)
2. Export JSON files using "Export" buttons
3. Commit JSON files to GitHub
4. Push to GitHub
5. Vercel auto-redeploys
6. Changes are now live

## 🔧 Troubleshooting

### If admin panel still shows 0 items:

1. **Check Environment Variables**
   - Ensure `USE_DATABASE=false` is set in Vercel

2. **Check Build Logs**
   - Look for errors in Vercel deployment logs

3. **Check API Endpoints**
   - Visit: `https://your-site.vercel.app/api/status`
   - Should return JSON with server info

4. **Check Console**
   - Open browser DevTools → Console
   - Look for API errors

### If you see CORS errors:

The server already has CORS enabled, but if needed, add to environment variables:
```
CORS_ORIGIN=https://livingheritage1125.vercel.app
```

## 📊 Recommended: Switch to Database Mode

For production, I recommend using PostgreSQL:

1. Create a PostgreSQL database (Railway, Supabase, etc.)
2. Add environment variables in Vercel:
   ```
   USE_DATABASE=true
   DATABASE_URL=your-postgres-connection-string
   ```
3. Run migration script to import JSON data
4. Changes in admin panel will persist

## 🎯 Summary

✅ **Committed to GitHub**: Vercel configuration files
✅ **Ready to Deploy**: Just redeploy in Vercel dashboard
✅ **Set Environment Variables**: Add USE_DATABASE and ADMIN_API_KEY
✅ **Test After Deploy**: Check admin panel and API endpoints

The configuration is now complete! Vercel will run your Node.js server properly after the next deployment.
