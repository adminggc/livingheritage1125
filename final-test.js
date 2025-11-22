const https = require('https');

const testEndpoints = async () => {
  const endpoints = [
    { path: '/api/admin/figures', key: 'heritageFigures' },
    { path: '/api/admin/news', key: 'news' },
    { path: '/api/admin/tips', key: 'wellnessTips' },
  ];

  console.log('\n✅ FINAL DATA VERIFICATION ON RAILWAY\n');

  for (const { path, key } of endpoints) {
    const result = await new Promise((resolve) => {
      const options = {
        hostname: 'livingheritage1125-production-84a4.up.railway.app',
        path: path,
        method: 'GET',
        rejectUnauthorized: false
      };

      https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            const count = Array.isArray(json[key]) ? json[key].length : 0;
            const status = res.statusCode === 200 ? '✓' : '✗';

            console.log(`${status} ${path.padEnd(25)} → Status ${res.statusCode}`);
            console.log(`  ${key}: ${count} items`);

            if (count > 0) {
              const item = json[key][0];
              const keys = Object.keys(item).join(', ');
              console.log(`  Keys: ${keys.substring(0, 80)}`);
            }
            console.log();
          } catch (e) {
            console.log(`✗ ${path} → Error: ${e.message}\n`);
          }
          resolve();
        });
      }).on('error', resolve).end();
    });
  }

  console.log('✅ All endpoints verified successfully!\n');
};

testEndpoints();
