const https = require('https');

const testEndpoint = (path, key) => {
  return new Promise((resolve) => {
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
          console.log(`✓ /api/admin/tips: ${count} items`);
          if (count > 0) {
            json[key].slice(0, 3).forEach((item, i) => {
              console.log(`  [${i+1}] ${item.title.substring(0, 55)}`);
            });
          }
        } catch (e) {
          console.log('Error:', e.message);
        }
        resolve();
      });
    }).on('error', resolve).end();
  });
};

(async () => {
  await testEndpoint('/api/admin/tips', 'wellnessTips');
})();
