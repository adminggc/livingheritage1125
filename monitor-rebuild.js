#!/usr/bin/env node

/**
 * Monitor Railway Rebuild - Poll API until npm install succeeds
 * Checks every 10 seconds for up to 10 minutes
 */

const https = require('https');

const API_URL = 'https://livingheritage1125-production-84a4.up.railway.app/api/admin/figures';
const CHECK_INTERVAL = 10000; // 10 seconds
const MAX_ATTEMPTS = 60; // ~10 minutes total
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
        const isJson = contentType.includes('application/json');

        try {
          if (isJson && res.statusCode === 200) {
            const parsed = JSON.parse(data);
            resolve({
              success: true,
              status: res.statusCode,
              contentType,
              count: parsed.heritageFigures ? parsed.heritageFigures.length : 0,
              hasData: parsed.heritageFigures && parsed.heritageFigures.length > 0
            });
          } else if (res.statusCode === 502) {
            resolve({
              success: false,
              status: 502,
              reason: 'App still crashed (npm install may be running)'
            });
          } else {
            resolve({
              success: false,
              status: res.statusCode,
              contentType,
              reason: `Unexpected status: ${res.statusCode}`
            });
          }
        } catch (e) {
          resolve({
            success: false,
            status: res.statusCode,
            reason: `JSON parse error: ${e.message}`
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

async function pollUntilReady() {
  console.log('\n⏳ Monitoring Railway rebuild...\n');
  console.log('After removing Procfile, Railway should now:');
  console.log('1. Detect nixpacks.toml as the build config');
  console.log('2. Run "npm install" to install 108 packages');
  console.log('3. Start the app with "node server.js"\n');
  console.log(`Testing API: ${API_URL}`);
  console.log(`Check interval: every 10 seconds for up to 10 minutes\n`);
  console.log('='.repeat(70) + '\n');

  let hasShownBuildMessage = false;

  while (attempt < MAX_ATTEMPTS) {
    attempt++;
    const timestamp = new Date().toLocaleTimeString();

    process.stdout.write(`[${timestamp}] Attempt ${attempt}/${MAX_ATTEMPTS}... `);

    const result = await testAPI();

    if (result.success && result.hasData) {
      console.log('✅ SUCCESS!\n');
      console.log('='.repeat(70));
      console.log('\n🎉 API IS WORKING!\n');
      console.log(`Status Code: ${result.status}`);
      console.log(`Heritage Figures Count: ${result.count}`);

      if (result.count === 16) {
        console.log('\n✅ Perfect! All 16 heritage figures are accessible!\n');
        console.log('NEXT STEPS:');
        console.log('1. Hard refresh the admin panel (Ctrl+Shift+R)');
        console.log('2. You should see all migrated data:');
        console.log('   - 16 heritage figures');
        console.log('   - 30 news articles');
        console.log('   - 24 wellness tips');
        console.log('   - 16 podcasts');
        console.log('3. Try logging in and creating a new item\n');
      } else {
        console.log(`\n⚠️  Expected 16 figures, found ${result.count}`);
        console.log('Check if all data was migrated correctly\n');
      }

      return;
    } else if (result.status === 502) {
      console.log('⏳ 502 App building...');
      if (!hasShownBuildMessage) {
        console.log('   (Railway is likely running npm install)');
        hasShownBuildMessage = true;
      }
    } else if (result.error) {
      console.log(`❌ ${result.error}`);
    } else {
      console.log(`❌ ${result.reason}`);
    }

    if (attempt < MAX_ATTEMPTS) {
      await new Promise(r => setTimeout(r, CHECK_INTERVAL));
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n⏱️  TIMEOUT: Build did not complete in 10 minutes\n');
  console.log('TROUBLESHOOTING:');
  console.log('1. Go to: https://railway.app/dashboard');
  console.log('2. Select: livingheritage1125 project');
  console.log('3. Click: APP service');
  console.log('4. Check these tabs:\n');
  console.log('   LOGS tab:');
  console.log('   - Should see "npm install" output');
  console.log('   - Should see packages being added');
  console.log('   - Should see server startup message\n');
  console.log('   DEPLOYMENTS tab:');
  console.log('   - Check if latest deployment is SUCCESS, BUILDING, or FAILED');
  console.log('   - If FAILED, click to see detailed error\n');
  console.log('5. If npm install didn\'t run, check if nixpacks.toml exists in git:\n');
  console.log('   git ls-files | grep nixpacks.toml\n');
  console.log('6. If missing, re-push the file:\n');
  console.log('   git add nixpacks.toml && git commit -m "..." && git push\n');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nMonitoring stopped');
  process.exit(0);
});

pollUntilReady();
