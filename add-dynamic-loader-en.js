const fs = require('fs');
const path = require('path');

const skipFiles = [
  'index.html',
  'wellness-tips.html',
  'podcast.html',
  'nhan-vat-di-san.html',
  'heritage-art-culture.html',
  'heritage-science.html',
  'heritage-social-business.html'
];

const enDir = path.join(__dirname, 'en');
const files = fs.readdirSync(enDir).filter(f =>
  f.endsWith('.html') && !skipFiles.includes(f)
);

console.log(`Found ${files.length} English detail pages\n`);

let updated = 0;
let skipped = 0;

files.forEach((filename, index) => {
  const filePath = path.join(enDir, filename);
  let content = fs.readFileSync(filePath, 'utf8');

  // Check if script tag already exists
  if (content.includes('dynamic-detail-loader.js')) {
    console.log(`⊘ [${index + 1}/${files.length}] ${filename} (already has script)`);
    skipped++;
    return;
  }

  // Add script before closing body tag
  const loaderScript = '<script src="/assets/js/dynamic-detail-loader.js"></script>';
  const newContent = content.replace('</body>', `${loaderScript}\n</body>`);

  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`✓ [${index + 1}/${files.length}] ${filename}`);
    updated++;
  } else {
    console.log(`✗ [${index + 1}/${files.length}] ${filename} (failed to add script)`);
    skipped++;
  }
});

console.log(`\n✅ Updated: ${updated}`);
console.log(`⊘ Skipped: ${skipped}`);
console.log(`Total: ${files.length}`);
