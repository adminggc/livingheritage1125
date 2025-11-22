/**
 * Extract real wellness tips from English HTML files
 */

const fs = require('fs');
const path = require('path');

// Files that contain wellness tips (same as Vietnamese, extracted from en/ directory)
const tipFiles = [
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

const rootDir = path.join(__dirname, 'en');
const wellnessTips = [];

tipFiles.forEach((filename, index) => {
  const filePath = path.join(rootDir, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`✗ [${index + 1}/${tipFiles.length}] ${filename} (not found)`);
    return;
  }

  const htmlContent = fs.readFileSync(filePath, 'utf8');

  // Extract title
  let titleMatch = htmlContent.match(/<title>([^<]+)<\/title>/i);
  let title = titleMatch ? titleMatch[1].split('|')[0].trim() : '';

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

  // Clean up image URL
  if (featuredImage && featuredImage.includes('?')) {
    featuredImage = featuredImage.split('?')[0];
  }

  // Convert to local path
  if (featuredImage && featuredImage.includes('https://')) {
    featuredImage = featuredImage.replace('https://www.livingheritage.vn/', '').replace('https://livingheritage.vn/', '');
    if (!featuredImage.startsWith('assets')) {
      featuredImage = 'assets/' + featuredImage;
    }
  }

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
      const altMatch = fig.match(/alt="([^"]*)"/);
      if (srcMatch) {
        const imgSrc = srcMatch[1].split('?')[0];
        const imgAlt = altMatch ? altMatch[1] : 'Wellness tip image';
        content += `<figure><img src="${imgSrc}" alt="${imgAlt}"></figure>\n`;
      }
    });
  }

  if (title && (content || description)) {
    const tip = {
      id: wellnessTips.length + 1,
      urlSlug: filename.replace('.html', ''),
      title: title,
      description: description,
      imageUrl: featuredImage || 'assets/media/shared/news/default.jpg',
      heroImageUrl: featuredImage || 'assets/media/shared/news/default.jpg',
      altText: title,
      content: content.substring(0, 5000) || description,
      language: 'en',
      published: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    wellnessTips.push(tip);
    console.log(`✓ [${index + 1}/${tipFiles.length}] ${filename}`);
    console.log(`  Title: ${title.substring(0, 70)}`);
  }
});

// Save to JSON
const output = {
  wellnessTips: wellnessTips
};

if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

const outputPath = path.join(__dirname, 'data', 'wellness-tips-en.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(`\n✅ Extracted ${wellnessTips.length} English wellness tips`);
console.log(`📁 Saved to: data/wellness-tips-en.json`);
