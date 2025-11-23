/**
 * Extract HTML design from existing pages and save to JSON
 * Extracts the full .news-text content with all styling and structure
 */

const fs = require('fs');
const path = require('path');

const readJsonFile = (filename) => {
  try {
    const data = fs.readFileSync(path.join(__dirname, 'data', filename), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
};

const writeJsonFile = (filename, data) => {
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(path.join(dataDir, filename), JSON.stringify(data, null, 2), 'utf8');
};

function extractHtmlDesign(htmlFile, urlSlug) {
  try {
    const content = fs.readFileSync(htmlFile, 'utf8');

    // Extract main title
    const titleMatch = content.match(/<h2 class="news-main-title">\s*([\s\S]*?)\s*<\/h2>/);
    const title = titleMatch ? titleMatch[1].trim() : '';

    // Extract featured image
    const imageMatch = content.match(/<img[^>]*class="news-main-image[^"]*"[^>]*src="([^"]+)"/);
    const imageUrl = imageMatch ? imageMatch[1].trim() : '';

    // Extract the full news-text content (with all HTML structure)
    const contentMatch = content.match(/<div class="news-text">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/);
    const htmlContent = contentMatch ? contentMatch[1].trim() : '';

    // Extract description from meta tag
    const descMatch = content.match(/<meta name="description"\s+content="([^"]+)"/);
    const description = descMatch ? descMatch[1].trim() : '';

    return {
      title,
      imageUrl,
      description,
      htmlContent
    };
  } catch (error) {
    console.error(`Error extracting from ${htmlFile}:`, error.message);
    return null;
  }
}

// Get all news HTML files
const newsFiles = fs.readdirSync(__dirname).filter(f =>
  f.endsWith('.html') &&
  !['index.html', 'wellness-tips.html', 'podcast.html', 'nhan-vat-di-san.html',
    'heritage-art-culture.html', 'heritage-science.html', 'heritage-social-business.html'].includes(f)
);

console.log(`Found ${newsFiles.length} news HTML files to process\n`);

// Load existing JSON
const newsJson = readJsonFile('news.json') || { news: [] };
let updated = 0;

// Process each HTML file
newsFiles.forEach((filename, index) => {
  const urlSlug = filename.replace('.html', '');
  const filePath = path.join(__dirname, filename);

  // Find matching article in JSON
  const article = newsJson.news.find(a => a.urlSlug === urlSlug);
  if (!article) {
    console.log(`⊘ [${index + 1}/${newsFiles.length}] ${filename} (not in JSON)`);
    return;
  }

  // Extract design
  const extracted = extractHtmlDesign(filePath, urlSlug);
  if (!extracted) {
    console.log(`✗ [${index + 1}/${newsFiles.length}] ${filename} (extraction failed)`);
    return;
  }

  // Update article with full HTML content
  article.htmlContent = extracted.htmlContent;

  // Verify content has HTML
  if (article.htmlContent.includes('<p>') || article.htmlContent.includes('<iframe')) {
    console.log(`✓ [${index + 1}/${newsFiles.length}] ${filename}`);
    updated++;
  } else {
    console.log(`⚠ [${index + 1}/${newsFiles.length}] ${filename} (minimal content)`);
  }
});

// Save updated JSON
writeJsonFile('news.json', newsJson);

console.log(`\n✅ Updated ${updated} articles with HTML design`);
console.log(`📁 Saved to: data/news.json`);
console.log(`\n💡 Tips for editing in admin panel:`);
console.log(`   - Use the "Content (HTML)" field to edit the full HTML design`);
console.log(`   - Include <p>, <strong>, <em>, <iframe>, <figure>, etc.`);
console.log(`   - Keep the structure consistent with original design`);
console.log(`   - Images will be loaded from the imageUrl field`);
