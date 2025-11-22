#!/usr/bin/env node

/**
 * Final Rebuild Monitor - Watch for database module deployment
 * This monitors the API until it returns JSON with heritage figures
 */

const https = require('https');

const API_URL = 'https://livingheritage1125-production-84a4.up.railway.app/api/admin/figures';
const CHECK_INTERVAL = 15000; // 15 seconds
const MAX_ATTEMPTS = 40; // ~10 minutes total
let attempt = 0;

function testAPI() {
  return new Promise((resolve) => {
    https.get(API_URL, { timeout: 15000 }, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
        if (data.length > 100000) {
          res.socket.destroy();
        }
      });

      res.on('end', () => {
        const contentType = res.headers['content-type'] || 'unknown';

        // Check if it's JSON
        if (contentType.includes('application/json')) {
          try {
            const parsed = JSON.parse(data);
            if (parsed.heritageFigures && Array.isArray(parsed.heritageFigures)) {
              resolve({
                success: true,
                status: res.statusCode,
                count: parsed.heritageFigures.length,
                data: parsed
              });
            } else {
              resolve({
                success: false,
                status: res.statusCode,
                reason: 'JSON response but missing heritageFigures array'
              });
            }
          } catch (e) {
            resolve({
              success: false,
              status: res.statusCode,
              reason: `JSON parse failed: ${e.message}`
            });
          }
        } else {
          // HTML response (fallback mode)
          resolve({
            success: false,
            status: res.statusCode,
            reason: `Content-Type is ${contentType} (not JSON) - app still in static mode`
          });
        }
      });
    }).on('error', (err) => {
      resolve({
        success: false,
        error: err.message
      });
    });
  });
}

async function monitor() {
  console.log('\n🚀 FINAL DEPLOYMENT MONITOR\n');
  console.log('Monitoring: API should return JSON with heritage figures');
  console.log('Database modules now deployed, waiting for successful database connection\n');
  console.log('='.repeat(70) + '\n');

  while (attempt < MAX_ATTEMPTS) {
    attempt++;
    const timestamp = new Date().toLocaleTimeString();
    const progress = Math.round((attempt / MAX_ATTEMPTS) * 100);
    const progressBar = '█'.repeat(Math.floor(progress / 5)) + '░'.repeat(20 - Math.floor(progress / 5));

    process.stdout.write(`[${timestamp}] [${progressBar}] ${progress}% - Attempt ${attempt}/${MAX_ATTEMPTS}... `);

    const result = await testAPI();

    if (result.success) {
      console.log('✅ SUCCESS!\n');
      console.log('='.repeat(70));
      console.log('\n🎉 API IS RETURNING JSON DATA!\n');
      console.log(`Status: ${result.status}`);
      console.log(`Heritage Figures Found: ${result.count}`);

      if (result.count === 16) {
        console.log('\n✅ Perfect! All 16 heritage figures loaded!\n');
        console.log('NEXT STEPS:');
        console.log('1. Hard refresh admin panel (Ctrl+Shift+R)');
        console.log('2. Verify all migrated data appears:');
        console.log('   - 16 heritage figures');
        console.log('   - 30 news articles');
        console.log('   - 24 wellness tips');
        console.log('   - 16 podcasts');
        console.log('3. Test creating a new item to verify write access\n');
      } else {
        console.log(`\n⚠️  Expected 16 but found ${result.count} figures`);
        console.log('Verify migration script worked correctly\n');
      }

      return;
    }

    if (result.error) {
      console.log(`❌ Connection error: ${result.error}`);
    } else if (result.reason) {
      console.log(`⏳ ${result.reason}`);
    }

    if (attempt < MAX_ATTEMPTS) {
      await new Promise(r => setTimeout(r, CHECK_INTERVAL));
    }
  }

  console.log('\n\n' + '='.repeat(70));
  console.log('\n⏱️  TIMEOUT - Build did not complete in ~10 minutes\n');
  console.log('This could mean:');
  console.log('1. Railway build is still in progress (takes longer)');
  console.log('2. Database connection is failing');
  console.log('3. A different error occurred on startup\n');
  console.log('TROUBLESHOOTING:');
  console.log('1. Check Railway Dashboard:');
  console.log('   - https://railway.app/dashboard');
  console.log('   - Select: livingheritage1125 project');
  console.log('   - Click: APP service\n');
  console.log('2. In LOGS tab, look for:');
  console.log('   ✓ PostgreSQL connected successfully');
  console.log('   ✓ Host: ballast.proxy.rlwy.net:40428');
  console.log('   ✗ Or error messages\n');
  console.log('3. In DEPLOYMENTS tab:');
  console.log('   - Check if latest deployment is SUCCESS, BUILDING, or FAILED');
  console.log('   - If FAILED, click to see details\n');
  console.log('4. Common issues:');
  console.log('   - DATABASE_URL env var not set correctly');
  console.log('   - src/db/connection.js not found (but we just added it)');
  console.log('   - PostgreSQL host unreachable\n');
}

// Handle interruption gracefully
process.on('SIGINT', () => {
  console.log('\n\nMonitoring stopped');
  process.exit(0);
});

monitor();
