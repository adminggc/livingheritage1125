/**
 * Migration Script: Migrate htmlContent to content field for HTML Editor
 * This script copies the rich HTML from htmlContent field to the content field
 * so it can be edited in the new TinyMCE editor in the admin panel
 */

const fs = require('fs');
const path = require('path');

// Files to migrate
const files = [
  'data/news.json',
  'data/news-en.json',
  'data/wellness-tips.json',
  'data/wellness-tips-en.json'
];

function migrateFile(filePath) {
  console.log(`\n📄 Processing: ${filePath}`);

  try {
    // Read the file
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    let migrated = 0;
    let skipped = 0;

    // Determine the data key (news vs wellnessTips)
    const dataKey = filePath.includes('news') ? 'news' : 'wellnessTips';

    if (!data[dataKey] || !Array.isArray(data[dataKey])) {
      console.log(`  ⚠️  No ${dataKey} array found in file`);
      return;
    }

    // Process each item
    data[dataKey].forEach((item, index) => {
      if (item.htmlContent) {
        // If htmlContent exists and is longer/richer than content, migrate it
        if (!item.content || item.htmlContent.length > item.content.length) {
          console.log(`  ✓ Migrating item ${index + 1}: "${item.title?.substring(0, 50)}..."`);
          item.content = item.htmlContent;
          migrated++;
        } else {
          console.log(`  ⏭️  Skipping item ${index + 1}: content already exists and is longer`);
          skipped++;
        }
      } else {
        console.log(`  ⏭️  Skipping item ${index + 1}: no htmlContent field`);
        skipped++;
      }
    });

    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

    console.log(`  ✅ Complete: ${migrated} migrated, ${skipped} skipped`);
    console.log(`  💾 Saved to: ${filePath}`);

  } catch (error) {
    console.error(`  ❌ Error processing ${filePath}:`, error.message);
  }
}

function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  HTML Content Migration Tool                              ║');
  console.log('║  Migrating htmlContent → content for TinyMCE Editor       ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  files.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
      migrateFile(fullPath);
    } else {
      console.log(`\n⚠️  File not found: ${fullPath}`);
    }
  });

  console.log('\n✅ Migration complete!');
  console.log('📝 Note: The htmlContent field is preserved for backup purposes.\n');
}

// Run migration
main();
