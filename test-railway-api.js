#!/usr/bin/env node
/**
 * Test Railway API endpoint
 */

const https = require('https');

const options = {
  hostname: 'livingheritage1125-production-84a4.up.railway.app',
  path: '/api/admin/figures',
  method: 'GET',
  rejectUnauthorized: false  // Ignore certificate issues
};

console.log('Testing Railway API endpoint...\n');

const req = https.request(options, (res) => {
  let data = '';

  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  console.log('');

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (data.length > 0) {
      try {
        const parsed = JSON.parse(data);
        console.log('Response (first 1000 chars):');
        console.log(JSON.stringify(parsed, null, 2).substring(0, 1000) + '...');
      } catch (e) {
        console.log('Response (not valid JSON):');
        console.log(data.substring(0, 500));
      }
    } else {
      console.log('No response data');
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error.message);
});

req.setTimeout(10000, () => {
  console.error('Request timeout');
  req.destroy();
});

req.end();
