/**
 * Extract HTML design from wellness tips HTML files
 * Extracts the full .tip-content content with all styling and structure
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
    const titleMatch = content.match(/<h2 class="tip-title">\s*([\s\S]*?)\s*<\/h2>/);
    const title = titleMatch ? titleMatch[1].trim() : '';

    // Extract featured image
    const imageMatch = content.match(/<img[^>]*class="tip-hero-image[^"]*"[^>]*src="([^"]+)"/);
    const imageUrl = imageMatch ? imageMatch[1].trim() : '';

    // Extract the full section-tips-content-body content (with all HTML structure)
    const contentMatch = content.match(/<div class="section-tips-content-body">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/);
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

// Get all tips HTML files - wellness tips are in root directory
const tipsFiles = fs.readdirSync(__dirname).filter(f => {
  return f.endsWith('.html') &&
    // Include wellness tip files
    [
      'bo-nao-cua-ban-cam-nhan-duoc-dieu-gi-se-xay-ra-trong-tuong-lai.html',
      'di-bo-bi-quyet-danh-thuc-tri-nao-va-tinh-than-minh-man.html',
      'khi-doi-mat-biet-noi-khoa-hoc-giai-ma-bi-an-cua-giao-tiep-khong-loi.html',
      'khi-dong-y-bat-tay-cung-am-thuc-va-cau-chuyen-hoi-sinh-cua-dong-y-trung-hoa.html',
      'khoa-hoc-chung-min-kiem-soat-con-gian-giup-nao-bo-manh-me-va-tot-hon.html',
      'lieu-phap-te-bao-goc-giup-giam-nguy-co-suy-tim-sau-nhoi-mau-co-tim.html',
      'nam-2030-cuoc-dua-tai-sinh-cua-nhat-ban.html',
      'su-thay-doi-ky-dieu-cua-nao-bo-sau-72-gio-khong-dien-thoai.html',
      'tai-sao-chung-ta-lai-hop-ca-voi-mot-so-nguoi-khoa-hoc-than-kinh-giai-thich-su-ket-noi-ngay-tu-cai-nhin-dau-tien.html',
      'tai-sao-hoc-nhac-giup-tre-phat-trien-nao-bo-hon-lap-trinh.html',
      'ty-the-nguon-suc-manh-co-the-chua-lanh.html',
      'y-hoc-co-truyen-trung-hoa-thuc-day-y-hoc-tai-tao-trong-lieu-phap-dua-tren-te-bao-goc.html'
    ].includes(f);
});

console.log(`Found ${tipsFiles.length} wellness tips HTML files to process\n`);

// Load existing JSON
const tipsJson = readJsonFile('wellness-tips.json') || { wellnessTips: [] };
let updated = 0;

// Process each HTML file
tipsFiles.forEach((filename, index) => {
  const urlSlug = filename.replace('.html', '');
  const filePath = path.join(__dirname, filename);

  // Find matching tip in JSON
  const tip = tipsJson.wellnessTips.find(t => t.urlSlug === urlSlug);
  if (!tip) {
    console.log(`⊘ [${index + 1}/${tipsFiles.length}] ${filename} (not in JSON)`);
    return;
  }

  // Extract design
  const extracted = extractHtmlDesign(filePath, urlSlug);
  if (!extracted) {
    console.log(`✗ [${index + 1}/${tipsFiles.length}] ${filename} (extraction failed)`);
    return;
  }

  // Update tip with full HTML content
  tip.htmlContent = extracted.htmlContent;

  // Verify content has HTML
  if (tip.htmlContent.includes('<p>') || tip.htmlContent.includes('<h')) {
    console.log(`✓ [${index + 1}/${tipsFiles.length}] ${filename}`);
    console.log(`   htmlContent length: ${tip.htmlContent.length} chars`);
    updated++;
  } else {
    console.log(`⚠ [${index + 1}/${tipsFiles.length}] ${filename} (minimal content)`);
  }
});

// Save updated JSON
writeJsonFile('wellness-tips.json', tipsJson);

console.log(`\n✅ Updated ${updated} wellness tips with HTML design`);
console.log(`📁 Saved to: data/wellness-tips.json`);
