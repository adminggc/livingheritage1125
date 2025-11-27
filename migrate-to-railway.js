#!/usr/bin/env node

/**
 * Migration Script: Local PostgreSQL → Railway PostgreSQL
 * Migrates all data from local development database to Railway production database
 */

const { Pool } = require('pg');
const fs = require('fs');

// Local Database (Development)
const localPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5439,
  database: process.env.DB_NAME || 'livingheritage',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'devpassword'
});

// Railway Database (Production)
const railwayPool = new Pool({
  host: 'ballast.proxy.rlwy.net',
  port: 40428,
  database: 'railway',
  user: 'postgres',
  password: 'mdsgwaFoNurneYjUiCewDZVFTmhwtNss',
  ssl: { rejectUnauthorized: false }
});

// Tables to migrate
const TABLES = ['heritage_figures', 'news_articles', 'wellness_tips', 'podcasts', 'banners'];

async function migrateData() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  Migrating data from Local → Railway                   ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  let localClient, railwayClient;

  try {
    // Connect to both databases
    console.log('🔄 Connecting to local PostgreSQL...');
    localClient = await localPool.connect();
    console.log('✅ Connected to local database');

    console.log('🔄 Connecting to Railway PostgreSQL...');
    railwayClient = await railwayPool.connect();
    console.log('✅ Connected to Railway database\n');

    // Migrate each table
    let totalRecords = 0;

    for (const table of TABLES) {
      console.log(`📋 Migrating table: ${table}`);

      // Get data from local database
      const result = await localClient.query(`SELECT * FROM ${table}`);
      const records = result.rows;
      const count = records.length;

      if (count === 0) {
        console.log(`   ℹ️  No data in ${table}`);
        continue;
      }

      console.log(`   📊 Found ${count} records`);

      // Clear existing data in Railway (be careful!)
      await railwayClient.query(`TRUNCATE TABLE ${table} CASCADE`);
      console.log(`   🗑️  Cleared ${table} on Railway`);

      // Insert data into Railway
      if (count > 0) {
        const columns = Object.keys(records[0]);
        const columnList = columns.join(', ');
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        const query = `INSERT INTO ${table} (${columnList}) VALUES (${placeholders})`;

        for (const record of records) {
          const values = columns.map(col => record[col]);
          await railwayClient.query(query, values);
        }

        console.log(`   ✅ Inserted ${count} records into ${table}`);
        totalRecords += count;
      }

      console.log('');
    }

    // Verify migration
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║  Migration Verification                                ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    for (const table of TABLES) {
      const localResult = await localClient.query(`SELECT COUNT(*) FROM ${table}`);
      const railwayResult = await railwayClient.query(`SELECT COUNT(*) FROM ${table}`);

      const localCount = parseInt(localResult.rows[0].count);
      const railwayCount = parseInt(railwayResult.rows[0].count);

      const status = localCount === railwayCount ? '✅' : '⚠️';
      console.log(`${status} ${table}: Local=${localCount}, Railway=${railwayCount}`);
    }

    console.log(`\n✅ Migration complete! Total records migrated: ${totalRecords}\n`);
    console.log('Your Railway admin panel now has all the data from your local database.');
    console.log('Refresh: https://livingheritage1125-production-84a4.up.railway.app/admin/');

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (localClient) await localClient.end();
    if (railwayClient) await railwayClient.end();
    await localPool.end();
    await railwayPool.end();
  }
}

// Run migration
migrateData().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
