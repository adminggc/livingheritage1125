const https = require('https');

console.log('\n=== Checking Error Details ===\n');

const options = {
  hostname: 'livingheritage1125-production-84a4.up.railway.app',
  path: '/api/tips',
  method: 'GET',
  rejectUnauthorized: false
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Response:\n${data}\n`);
  });
});
req.on('error', console.error).end();
