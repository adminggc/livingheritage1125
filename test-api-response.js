#!/usr/bin/env node

const https = require('https');

const API_URL = 'https://livingheritage1125-production-84a4.up.railway.app/api/admin/figures';

https.get(API_URL, { timeout: 15000 }, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`\nStatus Code: ${res.statusCode}`);
    console.log(`Content-Type: ${res.headers['content-type']}`);
    console.log(`\nResponse Preview (first 2000 chars):\n`);
    console.log(data.substring(0, 2000));

    if (data.length > 2000) {
      console.log(`\n... (${data.length} total bytes)`);
    }

    console.log('\n' + '='.repeat(70));

    try {
      const parsed = JSON.parse(data);
      console.log('\n✅ Valid JSON\n');
      console.log('Top-level keys:', Object.keys(parsed).join(', '));

      if (parsed.heritageFigures) {
        console.log(`\n✅ Has heritageFigures property`);
        console.log(`Count: ${parsed.heritageFigures.length}`);

        if (parsed.heritageFigures.length > 0) {
          console.log(`\nFirst item sample:`);
          console.log(JSON.stringify(parsed.heritageFigures[0], null, 2).substring(0, 500));
        }
      } else {
        console.log('\n❌ Missing heritageFigures property');
        console.log(`\nData structure:`, JSON.stringify(parsed, null, 2).substring(0, 500));
      }
    } catch (e) {
      console.log(`\n❌ Not valid JSON: ${e.message}`);
    }
  });
}).on('error', (err) => {
  console.log(`\n❌ Error: ${err.message}`);
});
