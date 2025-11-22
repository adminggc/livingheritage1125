const http = require('http');

console.log('\n=== Testing Admin API Authentication ===\n');

// Test 1: Without API key (should fail)
console.log('Test 1: Request WITHOUT API key (should get 401)');
const options1 = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/tips',
  method: 'GET',
  rejectUnauthorized: false
};

const req1 = http.request(options1, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`✓ Status: ${res.statusCode}`);
    console.log(`  Response: ${data.substring(0, 100)}\n`);

    // Test 2: With correct API key
    console.log('Test 2: Request WITH correct API key (should get 200)');
    const options2 = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/tips',
      method: 'GET',
      headers: {
        'X-API-Key': 'dev-key-change-in-production'
      },
      rejectUnauthorized: false
    };

    const req2 = http.request(options2, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`✓ Status: ${res.statusCode}`);
        try {
          const json = JSON.parse(data);
          console.log(`  Tips count: ${json.wellnessTips?.length || 0}\n`);
        } catch (e) {
          console.log(`  (Could not parse response)\n`);
        }

        // Test 3: With wrong API key
        console.log('Test 3: Request WITH wrong API key (should get 401)');
        const options3 = {
          hostname: 'localhost',
          port: 3000,
          path: '/api/admin/tips',
          method: 'GET',
          headers: {
            'X-API-Key': 'wrong-key'
          },
          rejectUnauthorized: false
        };

        const req3 = http.request(options3, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            console.log(`✓ Status: ${res.statusCode}`);
            console.log(`  Response: ${data.substring(0, 80)}\n`);
            console.log('✅ All tests completed!\n');
          });
        });
        req3.on('error', console.error).end();
      });
    });
    req2.on('error', console.error).end();
  });
});
req1.on('error', console.error).end();
