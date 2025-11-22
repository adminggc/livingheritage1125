#!/usr/bin/env node
/**
 * Extract wellness tips and news from HTML files with proper structure
 */

const fs = require('fs');
const path = require('path');

const extractContentFromHtml = (htmlContent) => {
  // Extract main paragraph content
  const contentMatch = htmlContent.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>(.*?)<\/div>/s);
  const mainContent = contentMatch ? contentMatch[1] : '';

  // Extract first two paragraphs for summary
  const paragraphs = mainContent.match(/<p[^>]*>([^<]+)<\/p>/g) || [];
  const description = paragraphs
    .slice(0, 2)
    .map(p => p.replace(/<[^>]+>/g, '').trim())
    .join(' ')
    .substring(0, 200);

  // Extract all text content
  const fullContent = htmlContent
    .replace(/<script[^>]*>.*?<\/script>/gs, '')
    .replace(/<style[^>]*>.*?<\/style>/gs, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 500);

  return { description, fullContent };
};

const generateUrlSlug = (filename) => {
  return filename.replace(/\.html$/, '').toLowerCase();
};

const extractWellnessTips = () => {
  const tipsHtmlFiles = [
    'premium-wellbeing-tips-full.html',
    'premium-wellbeing-tips-details.html',
    'wellness-tips.html',
    'wellness-care-song-chu-dong-tai-tao-va-can-bang-cung-gg-young.html',
    'tai-sao-hoc-nhac-giup-tre-phat-trien-nao-bo-hon-lap-trinh.html',
    'khi-doi-mat-biet-noi-khoa-hoc-giai-ma-bi-an-cua-giao-tiep-khong-loi.html',
    'khoa-hoc-chung-min-kiem-soat-con-gian-giup-nao-bo-manh-me-va-tot-hon.html',
    'lieu-phap-te-bao-goc-giup-giam-nguy-co-suy-tim-sau-nhoi-mau-co-tim.html',
    'y-hoc-co-truyen-trung-hoa-thuc-day-y-hoc-tai-tao-trong-lieu-phap-dua-tren-te-bao-goc.html',
    'khi-dong-y-bat-tay-cung-am-thuc-va-cau-chuyen-hoi-sinh-cua-dong-y-trung-hoa.html',
    'su-thay-doi-ky-dieu-cua-nao-bo-sau-72-gio-khong-dien-thoai.html',
    'ty-the-nguon-suc-manh-co-the-chua-lanh.html',
    'nam-2030-cuoc-dua-tai-sinh-cua-nhat-ban.html',
    'bo-nao-cua-ban-cam-nhan-duoc-dieu-gi-se-xay-ra-trong-tuong-lai.html',
    'tai-sao-chung-ta-lai-hop-ca-voi-mot-so-nguoi-khoa-hoc-than-kinh-giai-thich-su-ket-noi-ngay-tu-cai-nhin-dau-tien.html'
  ];

  const tips = [];
  let id = 1;

  tipsHtmlFiles.forEach((file) => {
    const filePath = path.join(__dirname, file);

    if (fs.existsSync(filePath)) {
      const htmlContent = fs.readFileSync(filePath, 'utf8');

      // Extract title
      const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/);
      let title = titleMatch ? titleMatch[1].replace(/ \| .*/, '').trim() : file.replace(/\.html$/, '');

      // Extract and clean up content
      const { description, fullContent } = extractContentFromHtml(htmlContent);

      // Extract featured image
      const imgMatch = htmlContent.match(/<img[^>]*src=["']([^"']*\.(?:jpg|png|webp))["'][^>]*(?:alt=["']([^"']*))?"[^>]*>/i);
      const imageUrl = imgMatch ? imgMatch[1] : 'assets/media/shared/news/default.jpg';
      const altText = imgMatch && imgMatch[2] ? imgMatch[2] : title;

      const tip = {
        id: id++,
        urlSlug: generateUrlSlug(file),
        title: title,
        description: description || `Learn about this wellness topic and improve your health.`,
        imageUrl: imageUrl,
        heroImageUrl: imageUrl,
        altText: altText,
        content: fullContent || description,
        published: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      tips.push(tip);
      console.log(`✓ Extracted: ${title}`);
    }
  });

  return tips;
};

const extractNews = () => {
  const newsHtmlFiles = [
    'cung-nhin-lai-hinh-anh-khai-truong-cac-hoat-dong-cua-gg-corporation-hanh-trinh-ruc-ro-chinh-thuc-bat-dau.html',
    'g79-auto-chinh-thuc-khai-truong-showroom-dau-tien-tai-ha-noi.html',
    'gg-corporation-nha-tai-tro-chinh-dem-nhac-khat-vong.html',
    'du-an-living-heritage-va-jazz-concert-dong-chay-am-nhac-cua-the-gioi.html',
    'dao-dien-pham-hoang-nam-niels-lan-doky-hoi-ngo-thanh-lam-se-bung-no.html',
    'hiep-si-jazz-niels-lan-doky-den-viet-nam-cuoc-gap-sau-20-nam-cho-doi.html',
    'huyen-thoai-jazz-niels-lan-doky-tro-lai-viet-nam-trong-dem-nhac-living-heritage-jazz-concert-immersed.html',
    'huyen-thoai-jazz-niels-lan-doky-tro-lai-viet-nam-voi-dem-nhac-immersed.html',
    'chim-dam-nhu-pham-hoang-nam.html',
    'di-bo-bi-quyet-danh-thuc-tri-nao-va-tinh-than-minh-man.html',
    'mot-thoi-de-nho-trong-dem-nhac-phu-quang.html',
    'phan-ung-cua-diva-thanh-lam-truoc-y-kien-ai-hat-hay-hon-ca-si.html',
    'trung-thu-sum-vay-gan-ket-dai-gia-dinh-g79-auto.html',
    'nguoi-viet-gan-nhau-hon-nho-di-san-cho-tuong-lai.html',
    'bo-suu-tap-glamour-green-tinh-yeu-ngoc-luc-bao.html'
  ];

  const news = [];
  let id = 1;

  newsHtmlFiles.forEach((file) => {
    const filePath = path.join(__dirname, file);

    if (fs.existsSync(filePath)) {
      const htmlContent = fs.readFileSync(filePath, 'utf8');

      // Extract title
      const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/);
      let title = titleMatch ? titleMatch[1].replace(/ \| .*/, '').trim() : file.replace(/\.html$/, '');

      // Extract and clean up content
      const { description, fullContent } = extractContentFromHtml(htmlContent);

      // Extract featured image
      const imgMatch = htmlContent.match(/<img[^>]*src=["']([^"']*\.(?:jpg|png|webp))["'][^>]*>/i);
      const imageUrl = imgMatch ? imgMatch[1] : 'assets/media/shared/news/default.jpg';

      const article = {
        id: id++,
        urlSlug: generateUrlSlug(file),
        title: title,
        summary: description || `Read the latest news about Living Heritage and our community.`,
        imageUrl: imageUrl,
        published: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      news.push(article);
      console.log(`✓ Extracted: ${title}`);
    }
  });

  return news;
};

// Main execution
console.log('\n=== Extracting Wellness Data from HTML Files ===\n');

console.log('Extracting wellness tips...');
const tips = extractWellnessTips();

console.log(`\nExtracting news articles...`);
const news = extractNews();

// Write to JSON files
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

try {
  fs.writeFileSync(
    path.join(dataDir, 'wellness-tips.json'),
    JSON.stringify({ wellnessTips: tips }, null, 2),
    'utf8'
  );
  console.log(`\n✓ Written ${tips.length} wellness tips to data/wellness-tips.json`);
} catch (e) {
  console.error('✗ Error writing wellness-tips.json:', e.message);
}

try {
  fs.writeFileSync(
    path.join(dataDir, 'news.json'),
    JSON.stringify({ news: news }, null, 2),
    'utf8'
  );
  console.log(`✓ Written ${news.length} news articles to data/news.json`);
} catch (e) {
  console.error('✗ Error writing news.json:', e.message);
}

console.log('\n✅ Data extraction complete!\n');
