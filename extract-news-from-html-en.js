/**
 * Extract real news data from English HTML files (simple regex-based parser)
 */

const fs = require('fs');
const path = require('path');

// Files to skip
const skipFiles = [
  'index.html',
  'wellness-tips.html',
  'podcast.html',
  'nhan-vat-di-san.html',
  'heritage-art-culture.html',
  'heritage-science.html',
  'heritage-social-business.html'
];

const rootDir = path.join(__dirname, 'en');
const files = fs.readdirSync(rootDir).filter(f =>
  f.endsWith('.html') &&
  !skipFiles.includes(f)
);

console.log(`Found ${files.length} potential English news HTML files\n`);

const newsArticles = [];

files.forEach((filename, index) => {
  const filePath = path.join(rootDir, filename);
  const htmlContent = fs.readFileSync(filePath, 'utf8');

  // Extract title from title tag
  let titleMatch = htmlContent.match(/<title>([^<]+)<\/title>/i);
  let title = titleMatch ? titleMatch[1].split('|')[0].trim() : '';

  // Extract description from meta
  let descMatch = htmlContent.match(/<meta name="description"\s+content="([^"]+)"/i);
  let description = descMatch ? descMatch[1].trim() : '';

  // Extract featured image - look for og:image or news-main-image
  let imageMatch = htmlContent.match(/<meta property="og:image"\s+content="([^"]+)"/i);
  let featuredImage = imageMatch ? imageMatch[1].trim() : '';

  // If no og:image, try to find the main news image
  if (!featuredImage) {
    let imgMatch = htmlContent.match(/class="news-main-image[^"]*"\s+src="([^"]+)"/);
    if (imgMatch) {
      featuredImage = imgMatch[1].trim();
    }
  }

  // Clean up image URL (remove query params)
  if (featuredImage && featuredImage.includes('?')) {
    featuredImage = featuredImage.split('?')[0];
  }

  // Extract content from news-text div
  let contentMatch = htmlContent.match(/<div class="news-text">([\s\S]*?)<\/div>\s*<\/div>/);
  let content = '';

  if (contentMatch) {
    let textContent = contentMatch[1];

    // Extract paragraphs
    const paragraphs = textContent.match(/<p>([^<]+)<\/p>/g) || [];
    paragraphs.forEach(p => {
      const text = p.replace(/<[^>]+>/g, '').trim();
      if (text) content += `<p>${text}</p>\n`;
    });

    // Extract images from figures
    const figures = textContent.match(/<figure class="article-figure">[\s\S]*?<\/figure>/g) || [];
    figures.forEach(fig => {
      const srcMatch = fig.match(/src="([^"]+)"/);
      const altMatch = fig.match(/alt="([^"]*)"/);
      if (srcMatch) {
        const imgSrc = srcMatch[1].split('?')[0];
        const imgAlt = altMatch ? altMatch[1] : 'News image';
        content += `<figure><img src="${imgSrc}" alt="${imgAlt}"></figure>\n`;
      }
    });
  }

  // Only add if we have title and content
  if (title && (content || description)) {
    const article = {
      id: newsArticles.length + 1,
      urlSlug: filename.replace('.html', ''),
      title: title,
      summary: description.substring(0, 160),
      description: description,
      imageUrl: featuredImage || 'assets/media/shared/news/default.jpg',
      content: content.substring(0, 5000) || description,
      author: 'Living Heritage',
      language: 'en',
      published: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    newsArticles.push(article);
    console.log(`✓ [${index + 1}/${files.length}] ${filename}`);
    console.log(`  Title: ${title.substring(0, 70)}`);
    if (featuredImage) console.log(`  Image: ${featuredImage.substring(0, 60)}`);
  } else {
    console.log(`✗ [${index + 1}/${files.length}] ${filename} (skipped - insufficient data)`);
  }
});

// Save to JSON
const output = {
  news: newsArticles
};

if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

const outputPath = path.join(__dirname, 'data', 'news-en.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(`\n✅ Extracted ${newsArticles.length} English news articles`);
console.log(`📁 Saved to: data/news-en.json`);
