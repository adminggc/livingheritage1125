const http = require('http');

console.log('\n=== Testing Local Endpoints ===\n');

function testEndpoint(endpointName, path, callback) {
  console.log(`Testing ${endpointName}...`);
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: path,
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      console.log(`✓ Status: ${res.statusCode}`);
      try {
        const json = JSON.parse(data);
        console.log(`  Response:`, JSON.stringify(json, null, 2).substring(0, 200));
      } catch (e) {
        console.log(`  Response: ${data.substring(0, 200)}`);
      }
      console.log();
      callback();
    });
  });
  req.on('error', (e) => {
    console.log(`  Error: ${e.message}\n`);
    callback();
  }).end();
}

testEndpoint('Wellness Tips', '/api/tips', () => {
  testEndpoint('News Articles', '/api/news', () => {
    console.log('✅ Tests complete\n');
  });
});
