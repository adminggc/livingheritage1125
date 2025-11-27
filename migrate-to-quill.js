/**
 * Migration Script: Transform Existing Content to Quill Format
 *
 * Quill stores content as raw HTML in the editor's root.innerHTML
 * This script ensures all existing content is compatible with Quill editor
 */

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');

// Function to decode HTML entities
function decodeHtmlEntities(text) {
  const map = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&eacute;': 'é',
    '&egrave;': 'è',
    '&ocirc;': 'ô',
    '&acirc;': 'â',
    '&agrave;': 'à',
    '&uacute;': 'ú',
    '&ecirc;': 'ê',
    '&icirc;': 'î',
    '&ucirc;': 'û',
    '&ccedil;': 'ç',
    '&Eacute;': 'É',
    '&Agrave;': 'À',
    '&Ocirc;': 'Ô',
    '&Acirc;': 'Â',
    '&Uacute;': 'Ú',
    '&#8211;': '–',
    '&ndash;': '–',
    '&mdash;': '—',
    '&ldquo;': '"',
    '&rdquo;': '"',
    '&lsquo;': "'",
    '&rsquo;': "'",
  };

  return text.replace(/&[#\w]+;/g, (entity) => map[entity] || entity);
}

// Function to clean up HTML for Quill
function cleanHtmlForQuill(html) {
  if (!html) return '';

  let cleaned = html;

  // Remove HTML line breaks and carriage returns
  cleaned = cleaned.replace(/\r\n/g, '');
  cleaned = cleaned.replace(/\n/g, '');

  // Decode HTML entities
  cleaned = decodeHtmlEntities(cleaned);

  // Remove extra attributes from img tags
  cleaned = cleaned.replace(/<img([^>]*)src="([^"]+)"([^>]*)>/g, '<img src="$2">');

  // Remove figure tags but keep img
  cleaned = cleaned.replace(/<figure[^>]*>(.*?)<\/figure>/g, '$1');

  // Clean up whitespace
  cleaned = cleaned.replace(/>\s+</g, '><');

  return cleaned;
}

// Function to migrate content files
function migrateContentFile(filename) {
  const filepath = path.join(dataDir, filename);

  if (!fs.existsSync(filepath)) {
    console.log(`⚠️  File not found: ${filename}`);
    return 0;
  }

  let data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  let updated = 0;

  // Handle both news and tips arrays
  const contentArray = data.news || data.tips || [];

  contentArray.forEach((item) => {
    // Check if content needs updating
    const htmlContent = item.htmlContent || item.content || '';
    let contentValue = htmlContent;

    // Clean the content for Quill
    const cleanedContent = cleanHtmlForQuill(htmlContent);

    // Only update if content changed
    if (cleanedContent !== htmlContent) {
      item.content = cleanedContent;
      item.htmlContent = cleanedContent;
      updated++;

      console.log(`  ✓ Updated: ${item.title.substring(0, 50)}...`);
    } else if (!item.content || item.content === '') {
      // If no content, use htmlContent
      item.content = htmlContent;
      if (!item.htmlContent) {
        item.htmlContent = htmlContent;
      }
      updated++;
      console.log(`  ✓ Synchronized: ${item.title.substring(0, 50)}...`);
    }
  });

  // Write back to file
  if (updated > 0) {
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✅ ${filename}: ${updated} items updated\n`);
  } else {
    console.log(`ℹ️  ${filename}: No changes needed\n`);
  }

  return updated;
}

// Main migration
console.log('🚀 Starting migration to Quill format...\n');

const files = [
  'news.json',
  'news-en.json',
  'wellness-tips.json',
  'wellness-tips-en.json',
];

let totalUpdated = 0;

files.forEach((file) => {
  try {
    console.log(`📝 Processing: ${file}`);
    const count = migrateContentFile(file);
    totalUpdated += count;
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error.message);
  }
});

console.log(`\n✨ Migration complete!`);
console.log(`📊 Total items updated: ${totalUpdated}`);
console.log(`\n✅ All content is now Quill-compatible!`);
console.log(`💡 Quill will render the HTML directly as rich text editor content.\n`);
