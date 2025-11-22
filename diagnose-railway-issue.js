#!/usr/bin/env node

/**
 * Diagnostic Script - Railway Database Connection Issue
 * Checks if Railway app can connect to the correct PostgreSQL database
 */

const { Pool } = require('pg');

console.log('🔍 LIVING HERITAGE - RAILWAY DIAGNOSIS\n');
console.log('='.repeat(60));

// Check what's currently configured locally
console.log('\n📋 LOCAL ENVIRONMENT VARIABLES:');
console.log(`  DATABASE_URL: ${process.env.DATABASE_URL || 'NOT SET'}`);
console.log(`  DB_HOST: ${process.env.DB_HOST || 'localhost'}`);
console.log(`  DB_PORT: ${process.env.DB_PORT || '5439'}`);
console.log(`  DB_NAME: ${process.env.DB_NAME || 'livingheritage'}`);
console.log(`  DB_USER: ${process.env.DB_USER || 'postgres'}`);
console.log(`  USE_DATABASE: ${process.env.USE_DATABASE || 'NOT SET'}`);

console.log('\n='.repeat(60));
console.log('\n🚨 THE PROBLEM:');
console.log('  Railway app is configured with LOCAL PostgreSQL credentials:');
console.log('    ❌ DB_HOST=localhost (doesn\'t exist on Railway!)');
console.log('    ❌ DB_PORT=5439 (Railway PostgreSQL is on 40428)');
console.log('    ❌ DB_NAME=livingheritage (Railway uses "railway")');
console.log('\n  When the Railway app starts, it tries to connect to:');
console.log('    → postgresql://postgres:devpassword@localhost:5439/livingheritage');
console.log('  This fails because localhost:5439 doesn\'t exist on Railway!');

console.log('\n='.repeat(60));
console.log('\n✅ THE SOLUTION:');
console.log('\n1️⃣  Set Railway Environment Variables (in Railway Dashboard):');
console.log('   Go to: https://railway.app/ → Select your project → Variables\n');
console.log('   Variable Name              | Value');
console.log('   ─────────────────────────────────────────────────────────');
console.log('   DATABASE_URL              | postgresql://postgres:mdsgwaFoNurneYjUiCewDZVFTmhwtNss@ballast.proxy.rlwy.net:40428/railway');
console.log('   DB_HOST                   | ballast.proxy.rlwy.net');
console.log('   DB_PORT                   | 40428');
console.log('   DB_NAME                   | railway');
console.log('   DB_USER                   | postgres');
console.log('   DB_PASSWORD               | mdsgwaFoNurneYjUiCewDZVFTmhwtNss');
console.log('   USE_DATABASE              | true');
console.log('   NODE_ENV                  | production');

console.log('\n2️⃣  Test Connection (wait for Railway to restart):');
console.log('   Check: https://livingheritage1125-production-84a4.up.railway.app/api/admin/figures');
console.log('   Expected: Array of 16 heritage figures');

console.log('\n='.repeat(60));
console.log('\n🧪 TESTING LOCAL CONNECTION TO RAILWAY DATABASE:\n');

async function testConnection() {
  const railwayConnectionString = 'postgresql://postgres:mdsgwaFoNurneYjUiCewDZVFTmhwtNss@ballast.proxy.rlwy.net:40428/railway';

  try {
    const pool = new Pool({
      host: 'ballast.proxy.rlwy.net',
      port: 40428,
      database: 'railway',
      user: 'postgres',
      password: 'mdsgwaFoNurneYjUiCewDZVFTmhwtNss',
      ssl: { rejectUnauthorized: false }
    });

    const client = await pool.connect();
    console.log('✅ Successfully connected to Railway PostgreSQL!\n');

    // Test querying the data
    const result = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM heritage_figures) as figures,
        (SELECT COUNT(*) FROM news_articles) as news,
        (SELECT COUNT(*) FROM wellness_tips) as tips,
        (SELECT COUNT(*) FROM podcasts) as podcasts
    `);

    const counts = result.rows[0];
    console.log('📊 DATA IN RAILWAY DATABASE:');
    console.log(`   • Heritage Figures: ${counts.figures}`);
    console.log(`   • News Articles: ${counts.news}`);
    console.log(`   • Wellness Tips: ${counts.tips}`);
    console.log(`   • Podcasts: ${counts.podcasts}`);

    if (counts.figures > 0) {
      console.log('\n✅ DATA IS IN THE DATABASE! Migration was successful.');
      console.log('   The admin panel should display this data once Railway');
      console.log('   environment variables are updated and app is restarted.');
    } else {
      console.log('\n⚠️  No data found. Migration may not have completed.');
    }

    client.release();
    await pool.end();

  } catch (error) {
    console.log(`❌ Failed to connect: ${error.message}`);
    console.log('\n   This might indicate Railway database connection issues.');
  }
}

testConnection().then(() => {
  console.log('\n' + '='.repeat(60));
  console.log('\n📖 NEXT STEPS:\n');
  console.log('1. Go to Railway dashboard and set the DATABASE_URL variable');
  console.log('2. This will trigger automatic redeployment of your app');
  console.log('3. Wait 2-3 minutes for deployment to complete');
  console.log('4. Refresh admin panel at:');
  console.log('   https://livingheritage1125-production-84a4.up.railway.app/admin/');
  console.log('5. You should now see all your migrated data!\n');
  console.log('='.repeat(60) + '\n');
});
