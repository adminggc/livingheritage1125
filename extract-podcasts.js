/**
 * Extract podcast data from podcast.html
 */

const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const filePath = path.join(rootDir, 'podcast.html');
const htmlContent = fs.readFileSync(filePath, 'utf8');

const podcasts = [];

// Extract all video-thumbnail divs with data-video-id
const videoRegex = /<div class="video-thumbnail" data-video-id="([^"]+)">/g;
let match;
let videoIds = [];

while ((match = videoRegex.exec(htmlContent)) !== null) {
  videoIds.push(match[1]);
}

console.log(`Found ${videoIds.length} podcast video IDs\n`);

// Now extract titles and pair them with video IDs
// The structure is: video-thumbnail -> podcast-title
const titleRegex = /<h3 class="podcast-title">([^<]+)<\/h3>/g;
let titles = [];

while ((match = titleRegex.exec(htmlContent)) !== null) {
  titles.push(match[1].trim());
}

console.log(`Found ${titles.length} podcast titles\n`);

// Pair them up
videoIds.forEach((videoId, index) => {
  const title = titles[index] || `Podcast ${index + 1}`;

  const podcast = {
    id: podcasts.length + 1,
    title: title,
    videoId: videoId,
    imageUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    description: title,
    published: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  podcasts.push(podcast);
  console.log(`✓ [${index + 1}/${videoIds.length}] ${title}`);
  console.log(`  Video ID: ${videoId}`);
});

// Save to JSON
const output = {
  podcasts: podcasts
};

if (!fs.existsSync(path.join(rootDir, 'data'))) {
  fs.mkdirSync(path.join(rootDir, 'data'), { recursive: true });
}

const outputPath = path.join(rootDir, 'data', 'podcasts.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(`\n✅ Extracted ${podcasts.length} podcasts`);
console.log(`📁 Saved to: data/podcasts.json`);
