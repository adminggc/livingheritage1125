/**
 * Extract real news data from HTML files (simple regex-based parser)
 */

const fs = require('fs');
const path = require('path');

// Files to skip (landing pages, categories)
const skipFiles = [
  'index.html',
  'wellness-tips.html',
  'podcast.html',
  'nhan-vat-di-san.html',
  'heritage-art-culture.html',
  'heritage-science.html',
  'heritage-social-business.html'
];

// Wellness tip files - should NOT be in news
const wellnessTipFiles = [
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
];

// Heritage figure files - should NOT be in news
const heritageFigureFiles = [
  'bui-cong-duy.html',
  'nguyen-phuong-lam.html',
  'nguyen-tuong-bach.html',
  'nguyen-xuan-phuong.html',
  'pham-hoang-nam.html',
  'phan-toan-thang.html',
  'quoc-trung.html',
  'sir-niels-lan-doky.html'
];

const rootDir = __dirname;
const files = fs.readdirSync(rootDir).filter(f =>
  f.endsWith('.html') &&
  !skipFiles.includes(f) &&
  !wellnessTipFiles.includes(f) &&
  !heritageFigureFiles.includes(f) &&
  !f.startsWith('en-')
);

console.log(`Found ${files.length} potential news HTML files\n`);

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
      content: content.substring(0, 5000) || description, // Limit content length
      author: 'Living Heritage',
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

if (!fs.existsSync(path.join(rootDir, 'data'))) {
  fs.mkdirSync(path.join(rootDir, 'data'), { recursive: true });
}

const outputPath = path.join(rootDir, 'data', 'news-extracted.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(`\n✅ Extracted ${newsArticles.length} news articles`);
console.log(`📁 Saved to: data/news-extracted.json`);

// Also update news.json
const newsPath = path.join(rootDir, 'data', 'news.json');
fs.writeFileSync(newsPath, JSON.stringify(output, null, 2));
console.log(`✅ Updated data/news.json`);
