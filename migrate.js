const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const rootDir = __dirname;
const enDir = path.join(rootDir, 'en');
const outputDir = __dirname;
const dbFilePath = path.join(outputDir, 'db.json');

const articles = {};

function extractContent(filePath, lang) {
    const html = fs.readFileSync(filePath, 'utf-8');
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    const slug = path.basename(filePath, '.html');
    const title = doc.querySelector('.section-tips-content-title h2')?.textContent.trim();
    const heroBgStyle = doc.querySelector('.hero-section')?.getAttribute('style');
    const heroImageUrl = heroBgStyle ? heroBgStyle.match(/url\('?(.*?)'?\)/)?.[1] : null;
    const contentBody = doc.querySelector('.section-tips-content-body')?.innerHTML.trim();
    const coverImage = doc.querySelector('.tips-image-wrapper img')?.getAttribute('src');

    if (!articles[slug]) {
        articles[slug] = {
            slug,
            vi: {},
            en: {}
        };
    }

    articles[slug][lang] = {
        title,
        heroImageUrl,
        contentBody,
        coverImage
    };
}

function processDirectory(dirPath, lang) {
    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
        if (path.extname(file) === '.html') {
            const filePath = path.join(dirPath, file);
            // Simple check to avoid processing layout files or other non-article files
            if (file.includes('template') || file.includes('index') || file.includes('nhan-vat') || file.includes('podcast') || file.includes('premium') || file.includes('wellness-tips')) {
                return;
            }
            try {
                extractContent(filePath, lang);
            } catch (error) {
                console.error(`Error processing file: ${filePath}`, error);
            }
        }
    });
}

processDirectory(rootDir, 'vi');
processDirectory(enDir, 'en');

fs.writeFileSync(dbFilePath, JSON.stringify({ articles: Object.values(articles) }, null, 2));

console.log('Migration complete. db.json created.');