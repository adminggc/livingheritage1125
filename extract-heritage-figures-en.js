/**
 * Extract real heritage figures from English HTML files
 */

const fs = require('fs');
const path = require('path');

// Files that contain heritage figures
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

const rootDir = path.join(__dirname, 'en');
const heritageFigures = [];

figureFiles.forEach((filename, index) => {
  const filePath = path.join(rootDir, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`✗ [${index + 1}/${figureFiles.length}] ${filename} (not found)`);
    return;
  }

  const htmlContent = fs.readFileSync(filePath, 'utf8');

  // Extract title (full name)
  let titleMatch = htmlContent.match(/<title>([^<|]+)/i);
  let title = titleMatch ? titleMatch[1].trim() : '';

  // Extract description
  let descMatch = htmlContent.match(/<meta name="description"\s+content="([^"]+)"/i);
  let description = descMatch ? descMatch[1].trim() : '';

  // Extract featured image
  let imageMatch = htmlContent.match(/<meta property="og:image"\s+content="([^"]+)"/i);
  let featuredImage = imageMatch ? imageMatch[1].trim() : '';

  if (!featuredImage) {
    let imgMatch = htmlContent.match(/class="news-main-image[^"]*"\s+src="([^"]+)"/);
    if (imgMatch) {
      featuredImage = imgMatch[1].trim();
    }
  }

  // Also try to find portrait image
  let portraitMatch = htmlContent.match(/class="people-heritage-image[^"]*"\s+src="([^"]+)"/);
  let portraitImage = portraitMatch ? portraitMatch[1].trim() : '';

  // Clean up URLs
  const cleanUrl = (url) => {
    if (!url) return '';
    if (url.includes('?')) url = url.split('?')[0];
    if (url.includes('https://')) {
      url = url.replace('https://www.livingheritage.vn/', '').replace('https://livingheritage.vn/', '');
      if (!url.startsWith('assets')) url = 'assets/' + url;
    }
    return url;
  };

  featuredImage = cleanUrl(featuredImage);
  portraitImage = cleanUrl(portraitImage);

  // Extract content
  let contentMatch = htmlContent.match(/<div class="news-text">([\s\S]*?)<\/div>\s*<\/div>/);
  let content = '';

  if (contentMatch) {
    let textContent = contentMatch[1];

    const paragraphs = textContent.match(/<p>([^<]+)<\/p>/g) || [];
    paragraphs.forEach(p => {
      const text = p.replace(/<[^>]+>/g, '').trim();
      if (text) content += `<p>${text}</p>\n`;
    });

    const figures = textContent.match(/<figure class="article-figure">[\s\S]*?<\/figure>/g) || [];
    figures.forEach(fig => {
      const srcMatch = fig.match(/src="([^"]+)"/);
      if (srcMatch) {
        const imgSrc = cleanUrl(srcMatch[1]);
        content += `<figure><img src="${imgSrc}" alt="Heritage figure image"></figure>\n`;
      }
    });
  }

  if (title && (content || description)) {
    // Extract first letter for header
    const headerLetter = title.charAt(0).toUpperCase();

    const figure = {
      id: heritageFigures.length + 1,
      urlSlug: filename.replace('.html', ''),
      fullName: title,
      headerLetter: headerLetter,
      position: description.substring(0, 100),
      photoUrl: portraitImage || featuredImage || 'assets/media/people-heritage/default.png',
      smallImageUrl: portraitImage || featuredImage || 'assets/media/people-heritage/default.png',
      heroImageUrl: featuredImage || 'assets/media/shared/default-category.jpg',
      summary: [description],
      introduction: content.substring(0, 2000) || description,
      bio: content.substring(0, 5000) || description,
      language: 'en',
      published: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    heritageFigures.push(figure);
    console.log(`✓ [${index + 1}/${figureFiles.length}] ${filename}`);
    console.log(`  Name: ${title}`);
    console.log(`  Portrait: ${portraitImage || 'N/A'}`);
  }
});

// Save to JSON
const output = {
  heritageFigures: heritageFigures
};

if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

const outputPath = path.join(__dirname, 'data', 'heritage-figures-en.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(`\n✅ Extracted ${heritageFigures.length} English heritage figures`);
console.log(`📁 Saved to: data/heritage-figures-en.json`);
