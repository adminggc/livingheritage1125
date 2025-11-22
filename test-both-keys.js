const https = require('https');

console.log('\n=== Testing Both API Keys on Railway ===\n');

function testKey(keyName, keyValue, callback) {
  console.log(`Testing ${keyName}...`);
  const options = {
    hostname: 'livingheritage1125-production-84a4.up.railway.app',
    path: '/api/admin/tips',
    method: 'GET',
    headers: {
      'X-API-Key': keyValue
    },
    rejectUnauthorized: false
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      console.log(`  Status: ${res.statusCode}`);
      try {
        const json = JSON.parse(data);
        console.log(`  Result: ${json.error ? json.error : json.wellnessTips?.length + ' tips'}\n`);
      } catch (e) {
        console.log(`  Response: ${data.substring(0, 80)}\n`);
      }
      callback();
    });
  });
  req.on('error', (e) => {
    console.log(`  Error: ${e.message}\n`);
    callback();
  }).end();
}

testKey('Old Key (dev-key-change-in-production)', 'dev-key-change-in-production', () => {
  testKey('New Key (Dd1zADF8...)', 'Dd1zADF8rPT2vxigpYt2l0g8sUpmuQyF9xAtnLpzZvQ=', () => {
    console.log('✅ Both keys tested\n');
  });
});
