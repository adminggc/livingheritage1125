# Railway Deployment Diagnostic Guide

## Current Status

**Build:** ✅ Succeeded with npm install
**App Startup:** ⚠️ Starting but database connection failing
**API Response:** ❌ Returning HTML instead of JSON (fallback mode)

The app is running but failing to connect to the PostgreSQL database, so it's serving static files instead of API responses.

## What We've Done

1. ✅ Added `nixpacks.toml` - Forces npm install during build
2. ✅ Removed `Procfile` - Stopped conflicting build config
3. ✅ Created database modules - Added src/db/connection.js and repositories
4. ✅ Pushed to Railway fork - adming79-pixel/livingheritage1125
5. ✅ Rebuild triggered - Build completed successfully

## Why Database Connection Is Failing

The app tries to connect to PostgreSQL at startup (server.js line 1337-1342):

```javascript
try {
  await dbConnection.connect();
} catch (error) {
  console.error('❌ Failed to connect to database:', error.message);
  console.log('⚠️  Falling back to JSON file mode');
  process.env.USE_DATABASE = 'false';
}
```

When it fails, it silently falls back to static file mode.

## How to Find the Real Error

### Step 1: Check Railway Logs

1. Go to: **https://railway.app/dashboard**
2. Select: **livingheritage1125** project
3. Click: **APP** service
4. Click: **LOGS** tab

### Step 2: Look for These Messages

**✅ SUCCESS SIGNS (should see):**
```
✓ PostgreSQL connected successfully
Host: ballast.proxy.rlwy.net:40428
Port: 40428
Database: railway
```

**❌ ERROR SIGNS (might see):**
```
❌ Database connection failed:
   Host unreachable: ballast.proxy.rlwy.net:40428
   Authentication failed - check DB_USER and DB_PASSWORD
   Database not found: railway
   Error: ECONNREFUSED - Connection refused
   Error: ENOTFOUND - Host not found
```

### Step 3: Common Issues & Solutions

#### Issue 1: CONNECTION REFUSED (ECONNREFUSED)
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Cause:** Trying to connect to localhost instead of external database
**Solution:** Check if DATABASE_URL env var is set correctly

#### Issue 2: AUTHENTICATION FAILED
```
Error: password authentication failed for user "postgres"
```
**Cause:** Wrong DB_PASSWORD or DB_USER
**Solution:** Go to Railway SETTINGS and verify credentials match Railway PostgreSQL

#### Issue 3: HOST NOT FOUND (ENOTFOUND)
```
Error: getaddrinfo ENOTFOUND ballast.proxy.rlwy.net
```
**Cause:** Can't resolve the hostname
**Solution:** Check if DATABASE_URL starts with `postgresql://`

#### Issue 4: DATABASE NOT FOUND
```
Error: database "railway" does not exist
```
**Cause:** Wrong DB_NAME
**Solution:** Check SETTINGS - default should be "railway"

## Environment Variables to Check

In Railway SETTINGS, verify these are set:

```
DATABASE_URL = postgresql://postgres:YOUR_PASSWORD@ballast.proxy.rlwy.net:40428/railway
DB_HOST = ballast.proxy.rlwy.net
DB_PORT = 40428
DB_NAME = railway
DB_USER = postgres
DB_PASSWORD = YOUR_PASSWORD
NODE_ENV = production
```

## File Paths Created

These files were created and should exist in the deployed app:

```
src/
├── db/
│   └── connection.js         ← PostgreSQL connection pool
├── cache/
│   ├── redisClient.js        ← Cache stub
│   └── CacheService.js       ← Cache service
└── repositories/
    ├── HeritageFigureRepository.js
    ├── NewsRepository.js
    ├── WellnessTipsRepository.js
    ├── PodcastRepository.js
    └── BannerRepository.js
```

If these files are missing, the app will fail to start.

## Quick Verification Script

To verify files were deployed, you can check if they exist in the app container (if Railway provides shell access):

```bash
# This would run in Railway terminal
test -f src/db/connection.js && echo "✅ Connection module exists" || echo "❌ Missing"
```

## Next Steps

### Option A: If Logs Show Connection Error
1. Copy the exact error message
2. Share with Claude
3. We can fix the specific issue

### Option B: If Logs Show Success ("PostgreSQL connected")
But API still returns HTML:
1. There might be an error AFTER connection
2. Check for errors related to table names or queries
3. Might need to look at error handling in repositories

### Option C: If No Recent Logs
1. App might have crashed before logging
2. Click "REDEPLOY" in DEPLOYMENTS tab
3. Check LOGS tab again immediately after redeploying

## Database Connection Code

The connection is established in `src/db/connection.js`:

```javascript
const connectionConfig = {
  connectionString: process.env.DATABASE_URL ||
    `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
};
```

This tries DATABASE_URL first, then falls back to individual env variables.

## Getting Help

Once you check the Railway logs, please share:

1. **Exact error message** from LOGS tab
2. **Status** of latest deployment (SUCCESS/FAILED/BUILDING)
3. **Environment variables** you see in SETTINGS (password redacted)
4. **When the error occurs** (on startup? after connection? on query?)

With this information, we can identify and fix the specific issue.

## Summary

The deployment infrastructure is working:
- ✅ npm install runs
- ✅ App starts
- ✅ Build completes

But the last mile is failing:
- ❌ Database connection

**The fix is likely:** Checking/correcting the DATABASE_URL or related environment variables in Railway dashboard.
