#!/usr/bin/env node
/**
 * Extract data from HTML files and populate JSON data files
 * Scans directory for HTML files with article content
 */

const fs = require('fs');
const path = require('path');

console.log('⚠ Using regex parsing for HTML extraction');

const getArticlesFromHtml = (dir, filePattern) => {
  const articles = [];
  const files = fs.readdirSync(dir);

  let id = 1;
  files.forEach((file) => {
    if (file.endsWith('.html') && file !== 'index.html' && !file.includes('nhan-vat-di-san') && !file.includes('podcast')) {
      const filePath = path.join(dir, file);
      const content = fs.readFileSync(filePath, 'utf8');

      // Extract title from filename or HTML
      let title = file.replace(/\.html$/, '').replace(/-/g, ' ');
      const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/);
      if (titleMatch) {
        title = titleMatch[1].replace(/ \| .*/, '').trim();
      }

      // Extract first paragraph or description
      const descMatch = content.match(/<p[^>]*>([^<]{50,300})<\/p>/);
      const description = descMatch ? descMatch[1].trim() : title;

      // Extract featured image if available
      const imgMatch = content.match(/<img[^>]*src=["']([^"']*\.(?:jpg|png|webp))["'][^>]*>/i);
      const imageUrl = imgMatch ? imgMatch[1] : 'assets/media/shared/news/default.jpg';

      articles.push({
        id: id++,
        urlSlug: file,
        title: title,
        summary: description,
        content: 'Article content from HTML',
        imageUrl: imageUrl,
        published: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  });

  return articles;
};

// Main execution
console.log('\n=== Extracting Data from HTML Files ===\n');

// Extract news articles
console.log('Scanning for news articles...');
const newsArticles = getArticlesFromHtml(__dirname, '.html');
console.log(`✓ Found ${newsArticles.length} articles`);

// Filter articles (example: articles with specific keywords)
const newsData = {
  news: newsArticles.filter(a =>
    !a.urlSlug.includes('wellness') &&
    !a.urlSlug.includes('tips') &&
    !a.urlSlug.includes('heritage-')
  ).slice(0, 20) // Limit to 20 for demo
};

const tipsData = {
  wellnessTips: newsArticles.filter(a =>
    a.urlSlug.includes('wellness') ||
    a.urlSlug.includes('tips')
  ).slice(0, 20)
};

// If no tips found by pattern, use all articles as potential tips
if (tipsData.wellnessTips.length === 0) {
  tipsData.wellnessTips = newsArticles.slice(20, 40);
}

// Write to JSON files
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

try {
  fs.writeFileSync(
    path.join(dataDir, 'news.json'),
    JSON.stringify(newsData, null, 2),
    'utf8'
  );
  console.log(`✓ Written ${newsData.news.length} news articles to data/news.json`);
} catch (e) {
  console.error('✗ Error writing news.json:', e.message);
}

try {
  fs.writeFileSync(
    path.join(dataDir, 'wellness-tips.json'),
    JSON.stringify(tipsData, null, 2),
    'utf8'
  );
  console.log(`✓ Written ${tipsData.wellnessTips.length} wellness tips to data/wellness-tips.json`);
} catch (e) {
  console.error('✗ Error writing wellness-tips.json:', e.message);
}

// English versions (empty for now)
fs.writeFileSync(
  path.join(dataDir, 'news-en.json'),
  JSON.stringify({ news: [] }, null, 2),
  'utf8'
);
fs.writeFileSync(
  path.join(dataDir, 'wellness-tips-en.json'),
  JSON.stringify({ wellnessTips: [] }, null, 2),
  'utf8'
);

console.log('\n✅ Data extraction complete!\n');
