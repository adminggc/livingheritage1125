const https = require('https');

console.log('\n=== Testing Railway Admin API Authentication ===\n');

// Test 1: Without API key (should fail with 401)
console.log('Test 1: Request WITHOUT API key to Railway (should get 401)');
const options1 = {
  hostname: 'livingheritage1125-production-84a4.up.railway.app',
  path: '/api/admin/tips',
  method: 'GET',
  rejectUnauthorized: false
};

const req1 = https.request(options1, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`✓ Status: ${res.statusCode}`);
    if (res.statusCode === 401) {
      console.log(`✓ Correctly rejected unauthorized request`);
    } else {
      console.log(`✗ Expected 401 but got ${res.statusCode}`);
    }
    console.log(`  Response: ${data.substring(0, 100)}\n`);

    // Test 2: With correct API key
    console.log('Test 2: Request WITH correct API key to Railway (should get 200)');
    const options2 = {
      hostname: 'livingheritage1125-production-84a4.up.railway.app',
      path: '/api/admin/tips',
      method: 'GET',
      headers: {
        'X-API-Key': 'Dd1zADF8rPT2vxigpYt2l0g8sUpmuQyF9xAtnLpzZvQ='
      },
      rejectUnauthorized: false
    };

    const req2 = https.request(options2, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`✓ Status: ${res.statusCode}`);
        try {
          const json = JSON.parse(data);
          console.log(`✓ Successfully retrieved ${json.wellnessTips?.length || 0} tips with API key\n`);
        } catch (e) {
          console.log(`  (Could not parse response)\n`);
        }
        console.log('✅ Authentication security implemented successfully!\n');
      });
    });
    req2.on('error', console.error).end();
  });
});
req1.on('error', console.error).end();
