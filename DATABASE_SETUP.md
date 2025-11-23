# Living Heritage - Production Database Setup

## Problem
Currently using `USE_DATABASE=false` which means data is stored in JSON files. JSON files in Railway containers are **NOT persistent** - they get wiped on every redeploy. Admin edits are lost after each deployment.

## Solution
Use Railway's **PostgreSQL database** for persistent storage of production data.

## Setup Steps (Railway Dashboard)

### 1. Add PostgreSQL Plugin
1. Go to Railway Dashboard: https://railway.app
2. Open your Living Heritage project
3. Click "New" → "Database" → "PostgreSQL"
4. Railway will automatically create a PostgreSQL instance and set `DATABASE_URL` environment variable

### 2. Run Database Migrations
The server has migration scripts in `src/db/migrations/`:
```bash
npm run migrate
```

This creates tables:
- `heritage_figures` - Heritage figure profiles
- `news_articles` - News articles
- `wellness_tips` - Wellness tips
- `podcasts` - Podcast metadata
- And more...

### 3. Update Environment Variables (Railway)

In Railway Project Settings → Variables:

```
USE_DATABASE=true
NODE_ENV=production
AUTO_MIGRATE=true
```

**Railway will automatically set:**
- `DATABASE_URL` - PostgreSQL connection string

### 4. Load Initial Data (Optional)

To migrate from JSON files to database:

```bash
# Run once to seed database from JSON files
npm run seed:from-json
```

This script converts all data in `data/*.json` into database records.

### 5. Deploy

Push to GitHub:
```bash
git add .
git commit -m "Enable database mode for production"
git push railway-fork master
```

Railway auto-deploys. The server will:
1. Connect to PostgreSQL
2. Run migrations if needed
3. Use database for all data storage (not JSON files)

## What Changes

### Before (JSON Mode)
```
Admin Edit → Save to JSON → Lost on redeploy
```

### After (Database Mode)
```
Admin Edit → Save to PostgreSQL → Persists forever
JSON files → Only used as backup/archive (not for runtime)
```

## Rollback (If Needed)

To go back to JSON mode:
1. Set `USE_DATABASE=false` in Railway Variables
2. Redeploy
3. JSON files will still work from git repository

## Data Sync

Once running on database, JSON files in git become **reference/backup only**. Production data is in PostgreSQL.

To keep them in sync (optional):
```bash
npm run export:to-json
```
This exports database to `data/*.json` files for backup.

## Benefits

✅ **Persistent** - Data survives redeploys
✅ **Fast** - Database queries faster than file I/O
✅ **Scalable** - Supports more data than JSON files
✅ **Reliable** - Automatic backups on Railway
✅ **Concurrent** - Multiple instances can share data

## Troubleshooting

### Database connection fails
- Check `DATABASE_URL` is set in Railway Variables
- Verify PostgreSQL plugin is added to project
- Check logs: `railway logs`

### Migrations fail
- Ensure `AUTO_MIGRATE=true`
- Manual run: `npm run migrate:latest`
- Check `src/db/migrations/` folder

### Data missing after migration
- Run: `npm run seed:from-json` to import JSON data
- Database tables should be created automatically

## Current Status

✅ Server code supports both JSON and database modes
✅ Database repositories are implemented
✅ Migration system is ready
⏳ Awaiting: Enable database in Railway dashboard (5 minutes)

**Next Steps:**
1. Add PostgreSQL in Railway dashboard
2. Update `USE_DATABASE=true` in environment variables
3. Deploy
4. Done! All admin edits now persist permanently.
