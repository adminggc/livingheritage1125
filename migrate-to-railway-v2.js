#!/usr/bin/env node

/**
 * Smart Migration Script: Local PostgreSQL → Railway PostgreSQL
 * Handles JSONB data and encoding issues
 */

const { Pool } = require('pg');

const localPool = new Pool({
  host: 'localhost',
  port: 5439,
  database: 'livingheritage',
  user: 'postgres',
  password: 'devpassword'
});

const railwayPool = new Pool({
  host: 'ballast.proxy.rlwy.net',
  port: 40428,
  database: 'railway',
  user: 'postgres',
  password: 'mdsgwaFoNurneYjUiCewDZVFTmhwtNss',
  ssl: { rejectUnauthorized: false }
});

const TABLES = ['heritage_figures', 'news_articles', 'wellness_tips', 'podcasts', 'banners'];
const JSONB_COLUMNS = {
  heritage_figures: ['summary', 'sections', 'highlights'],
  news_articles: ['images']
};

async function safeInsertRecord(client, table, record) {
  const columns = Object.keys(record);
  const columnList = columns.join(', ');
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
  const query = `INSERT INTO ${table} (${columnList}) VALUES (${placeholders})`;

  const values = columns.map(col => {
    let value = record[col];

    // Handle JSONB columns - ensure valid JSON or convert to null
    if (JSONB_COLUMNS[table] && JSONB_COLUMNS[table].includes(col)) {
      if (value === null || value === undefined) {
        return null;
      }
      if (typeof value === 'string') {
        try {
          // Try to parse to validate JSON
          JSON.parse(value);
          return value;
        } catch (e) {
          console.log(`   ⚠️  Invalid JSON in ${col}, setting to null`);
          return null;
        }
      }
      if (typeof value === 'object') {
        try {
          // Convert object to JSON string
          return JSON.stringify(value);
        } catch (e) {
          console.log(`   ⚠️  Cannot stringify ${col}, setting to null`);
          return null;
        }
      }
    }

    return value;
  });

  try {
    await client.query(query, values);
    return true;
  } catch (err) {
    console.error(`   ❌ Error inserting record:`, err.message);
    return false;
  }
}

async function migrateData() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  Smart Data Migration: Local → Railway                 ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  let localClient, railwayClient;

  try {
    console.log('🔄 Connecting to local PostgreSQL...');
    localClient = await localPool.connect();
    console.log('✅ Connected to local database');

    console.log('🔄 Connecting to Railway PostgreSQL...');
    railwayClient = await railwayPool.connect();
    console.log('✅ Connected to Railway database\n');

    let totalRecords = 0;
    let skippedRecords = 0;

    for (const table of TABLES) {
      console.log(`📋 Migrating table: ${table}`);

      try {
        // Get data from local
        const result = await localClient.query(`SELECT * FROM ${table}`);
        const records = result.rows;
        const count = records.length;

        if (count === 0) {
          console.log(`   ℹ️  No data found\n`);
          continue;
        }

        console.log(`   📊 Found ${count} records`);

        // Clear Railway table
        await railwayClient.query(`TRUNCATE TABLE ${table} CASCADE`);
        console.log(`   🗑️  Cleared existing data`);

        // Insert records one by one (slower but safer)
        let insertedCount = 0;
        for (const record of records) {
          const success = await safeInsertRecord(railwayClient, table, record);
          if (success) {
            insertedCount++;
          } else {
            skippedRecords++;
          }
        }

        console.log(`   ✅ Inserted ${insertedCount}/${count} records\n`);
        totalRecords += insertedCount;

      } catch (err) {
        console.error(`   ❌ Error migrating ${table}:`, err.message);
        console.log('');
        continue;
      }
    }

    // Verify
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║  Migration Verification                                ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    let verifyTotal = 0;
    for (const table of TABLES) {
      const railwayResult = await railwayClient.query(`SELECT COUNT(*) FROM ${table}`);
      const railwayCount = parseInt(railwayResult.rows[0].count);

      console.log(`✅ ${table}: ${railwayCount} records on Railway`);
      verifyTotal += railwayCount;
    }

    console.log(`\n✅ Migration Complete!`);
    console.log(`   Total records: ${totalRecords}`);
    if (skippedRecords > 0) {
      console.log(`   Skipped (errors): ${skippedRecords}`);
    }
    console.log(`\n🎉 Your data is now on Railway!`);
    console.log(`📍 Refresh admin: https://livingheritage1125-production-84a4.up.railway.app/admin/\n`);

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  } finally {
    if (localClient) await localClient.end();
    if (railwayClient) await railwayClient.end();
    await localPool.end();
    await railwayPool.end();
  }
}

migrateData();
