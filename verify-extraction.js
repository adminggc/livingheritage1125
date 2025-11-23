const fs = require('fs');

const data = JSON.parse(fs.readFileSync('data/news.json', 'utf8'));

console.log('Verifying HTML Design Extraction:\n');
console.log(`Total articles: ${data.news.length}`);

let withHtmlContent = 0;
let without = 0;

data.news.forEach((article, index) => {
  if (article.htmlContent && article.htmlContent.length > 0) {
    withHtmlContent++;
    const preview = article.htmlContent.substring(0, 80).replace(/\n/g, ' ');
    console.log(`✓ [${index + 1}] ${article.title.substring(0, 50)}`);
    console.log(`   htmlContent length: ${article.htmlContent.length} chars`);
    console.log(`   preview: ${preview}...`);
  } else {
    without++;
    console.log(`✗ [${index + 1}] ${article.title.substring(0, 50)} (NO htmlContent)`);
  }
});

console.log(`\n✅ With htmlContent: ${withHtmlContent}`);
console.log(`❌ Without htmlContent: ${without}`);
console.log(`\nNextsteps:`);
console.log(`1. Open admin panel and edit a news article`);
console.log(`2. The Content field will have full HTML design`);
console.log(`3. Make your changes and save`);
console.log(`4. Go to the frontend page and refresh`);
console.log(`5. Content will load dynamically with original design preserved!`);
