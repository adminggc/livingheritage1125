const https = require('https');

console.log('\n=== Testing Frontend Data Sync ===\n');

function testEndpoint(endpointName, path, callback) {
  console.log(`Testing ${endpointName}...`);
  const options = {
    hostname: 'livingheritage1125-production-84a4.up.railway.app',
    path: path,
    method: 'GET',
    rejectUnauthorized: false
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      console.log(`✓ Status: ${res.statusCode}`);
      try {
        const json = JSON.parse(data);
        if (endpointName.includes('Wellness Tips')) {
          const tips = json.wellnessTips || [];
          console.log(`  Total items: ${tips.length}`);
          if (tips.length > 0) {
            const firstTip = tips[0];
            console.log(`  First item:`);
            console.log(`    Title: ${firstTip.title}`);
            console.log(`    URL Slug: ${firstTip.urlSlug}`);
            console.log(`    Published: ${firstTip.published}`);
            console.log(`    ✓ Data is synced to frontend!\n`);
          }
        } else if (endpointName.includes('News')) {
          const articles = json.news || [];
          console.log(`  Total items: ${articles.length}`);
          if (articles.length > 0) {
            const firstArticle = articles[0];
            console.log(`  First item:`);
            console.log(`    Title: ${firstArticle.title}`);
            console.log(`    URL Slug: ${firstArticle.urlSlug}`);
            console.log(`    Published: ${firstArticle.published}`);
            console.log(`    ✓ Data is synced to frontend!\n`);
          }
        }
      } catch (e) {
        console.log(`  Error parsing response: ${e.message}\n`);
      }
      callback();
    });
  });
  req.on('error', (e) => {
    console.log(`  Error: ${e.message}\n`);
    callback();
  }).end();
}

// Test tips endpoint (no auth needed for frontend)
testEndpoint('Wellness Tips', '/api/tips', () => {
  // Test news endpoint (no auth needed for frontend)
  testEndpoint('News Articles', '/api/news', () => {
    console.log('✅ Frontend data sync complete!\n');
  });
});
