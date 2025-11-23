/**
 * Extract HTML design from heritage figure HTML files
 * Extracts the full .figure-bio content with all styling and structure
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

    // Extract name from h1
    const nameMatch = content.match(/<h1 class="figure-name">\s*([\s\S]*?)\s*<\/h1>/);
    const fullName = nameMatch ? nameMatch[1].trim() : '';

    // Extract hero image
    const imageMatch = content.match(/<img[^>]*class="figure-hero-image[^"]*"[^>]*src="([^"]+)"/);
    const heroImageUrl = imageMatch ? imageMatch[1].trim() : '';

    // Extract the full profile-content-body content (with all HTML structure)
    const bioMatch = content.match(/<div class="profile-content-body">([\s\S]*?)<\/div>\s*<\/div>/);
    const htmlBio = bioMatch ? bioMatch[1].trim() : '';

    // Extract introduction (usually first paragraph)
    const introMatch = content.match(/<div class="figure-introduction">\s*([\s\S]*?)\s*<\/div>/);
    const introduction = introMatch ? introMatch[1].trim() : '';

    // Extract description from meta tag
    const descMatch = content.match(/<meta name="description"\s+content="([^"]+)"/);
    const description = descMatch ? descMatch[1].trim() : '';

    return {
      fullName,
      heroImageUrl,
      description,
      introduction,
      htmlBio
    };
  } catch (error) {
    console.error(`Error extracting from ${htmlFile}:`, error.message);
    return null;
  }
}

// Heritage figure files
const figureFiles = [
  'bui-cong-duy.html',
  'nguyen-phuong-lam.html',
  'nguyen-tuong-bach.html',
  'nguyen-xuan-phuong.html',
  'pham-hoang-nam.html',
  'phan-toan-thang.html',
  'quoc-trung.html',
  'sir-niels-lan-doky.html'
];

const tipsFiles = fs.readdirSync(__dirname).filter(f => figureFiles.includes(f));

console.log(`Found ${tipsFiles.length} heritage figure HTML files to process\n`);

// Load existing JSON
const figuresJson = readJsonFile('heritage-figures.json') || { heritageFigures: [] };
let updated = 0;

// Process each HTML file
tipsFiles.forEach((filename, index) => {
  const urlSlug = filename.replace('.html', '');
  const filePath = path.join(__dirname, filename);

  // Find matching figure in JSON
  const figure = figuresJson.heritageFigures.find(f => f.urlSlug === urlSlug);
  if (!figure) {
    console.log(`⊘ [${index + 1}/${tipsFiles.length}] ${filename} (not in JSON)`);
    return;
  }

  // Extract design
  const extracted = extractHtmlDesign(filePath, urlSlug);
  if (!extracted) {
    console.log(`✗ [${index + 1}/${tipsFiles.length}] ${filename} (extraction failed)`);
    return;
  }

  // Update figure with full HTML bio
  figure.htmlBio = extracted.htmlBio;

  // Verify content has HTML
  if (figure.htmlBio.includes('<p>') || figure.htmlBio.includes('<h')) {
    console.log(`✓ [${index + 1}/${tipsFiles.length}] ${filename}`);
    console.log(`   htmlBio length: ${figure.htmlBio.length} chars`);
    updated++;
  } else {
    console.log(`⚠ [${index + 1}/${tipsFiles.length}] ${filename} (minimal content)`);
  }
});

// Save updated JSON
writeJsonFile('heritage-figures.json', figuresJson);

console.log(`\n✅ Updated ${updated} heritage figures with HTML design`);
console.log(`📁 Saved to: data/heritage-figures.json`);
