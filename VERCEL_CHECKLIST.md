# Vercel Deployment Checklist

## ✅ Step 1: Wait for Deployment (In Progress)
- Current Status: Building...
- Node.js 24.x is being used ✓
- Wait for "Deployment completed" message

## ⏳ Step 2: Add Environment Variables (Do This Next)

Once deployment completes, **immediately** add these environment variables:

### Go to Vercel Dashboard:
https://vercel.com/adminggc/livingheritage1125/settings/environment-variables

### Add These 3 Variables:

**Variable 1:**
```
Name: USE_DATABASE
Value: false
Environments: ✓ Production ✓ Preview ✓ Development
```

**Variable 2:**
```
Name: NODE_ENV
Value: production
Environments: ✓ Production ✓ Preview ✓ Development
```

**Variable 3:**
```
Name: ADMIN_API_KEY
Value: Dd1zADF8rPT2vxigpYt2l0g8sUpmuQyF9xAtnLpzZvQ=
Environments: ✓ Production ✓ Preview ✓ Development
```

Click **"Save"** after adding each variable.

## ⏳ Step 3: Redeploy with Environment Variables

After adding all 3 variables:

1. Go to **Deployments** tab
2. Find the latest deployment (top of the list)
3. Click the **⋯** (three dots) menu
4. Click **"Redeploy"**
5. Wait for redeployment (1-2 minutes)

## ✅ Step 4: Test the Deployment

Once redeployment completes, test these URLs:

### Main Site:
https://livingheritage1125.vercel.app
- Should show homepage with content

### API Status:
https://livingheritage1125.vercel.app/api/status
- Should return JSON with server info
- Check that `mode: "JSON Files"` is shown

### Admin Panel:
https://livingheritage1125.vercel.app/admin
- Should show login page
- Login: username `admin`, password `admin123`
- Dashboard should show counts for News, Tips, Figures
- Click "News/Blog" - should show all articles
- Try editing an article - TinyMCE editor should work

## 🔧 Troubleshooting

### If admin shows 0 items:
- ✓ Check environment variables are added
- ✓ Check you redeployed after adding variables
- ✓ Check browser console for errors
- ✓ Test API endpoint: `/api/news` should return data

### If you see "Cannot GET /admin":
- ✓ Wait for latest deployment to finish
- ✓ Check deployment logs for errors
- ✓ Try hard refresh (Ctrl+Shift+R)

### If API returns errors:
- ✓ Check `USE_DATABASE=false` is set
- ✓ Check deployment logs
- ✓ Verify data/*.json files are in deployment

## 📝 Important Notes

**JSON Mode Limitations:**
- Changes in admin are NOT persistent across deploys
- To save changes: Export JSON → Commit to GitHub → Redeploy

**Recommended for Production:**
- Switch to Database Mode (`USE_DATABASE=true`)
- Add PostgreSQL database
- Changes will persist permanently

## ✨ Expected Result

After completing all steps:
- ✅ Homepage loads with all content
- ✅ Admin panel shows all data
- ✅ Can edit articles with TinyMCE
- ✅ API endpoints work
- ✅ No "Cannot GET" errors

---

**Current Status:** Deployment in progress...
**Next Action:** Add environment variables when deployment completes!
