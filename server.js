/**
 * Living Heritage - Hybrid Server (JSON + PostgreSQL + Redis)
 * Serves the website and provides API with database support
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database and cache (only loaded if enabled)
const dbConnection = require('./src/db/connection');
const redisClient = require('./src/cache/redisClient');
const cacheService = require('./src/cache/CacheService');

// Repositories (only loaded if database enabled)
const figuresRepo = require('./src/repositories/HeritageFigureRepository');
const newsRepo = require('./src/repositories/NewsRepository');
const tipsRepo = require('./src/repositories/WellnessTipsRepository');
const podcastsRepo = require('./src/repositories/PodcastRepository');
const bannersRepo = require('./src/repositories/BannerRepository');

const app = express();
const PORT = process.env.PORT || 3000;
const USE_DATABASE = process.env.USE_DATABASE !== 'false';
const USE_CACHE = process.env.USE_CACHE !== 'false';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'dev-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Admin API Key Authentication Middleware
const authenticateAdminApiKey = (req, res, next) => {
  const providedKey = req.headers['x-api-key'];
  if (!providedKey || providedKey !== ADMIN_API_KEY) {
    return res.status(401).json({
      error: 'Unauthorized - Valid X-API-Key header required',
      message: 'Admin endpoints require authentication. Include X-API-Key header with valid API key.'
    });
  }
  next();
};

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('✓ Created data directory');
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Read JSON file (fallback mode)
 */
function readJsonFile(filename) {
  try {
    const filePath = path.join(dataDir, filename);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return null;
  }
}

/**
 * Write JSON file (fallback mode)
 */
function writeJsonFile(filename, data) {
  try {
    const filePath = path.join(dataDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

    // Auto-commit changes to git to persist them across deployments
    if (process.env.AUTO_COMMIT !== 'false') {
      const { execSync } = require('child_process');
      try {
        execSync(`git add data/${filename}`, { stdio: 'ignore' });
        execSync(`git commit -m "Auto-save: Update ${filename} via admin panel" --no-verify`, { stdio: 'ignore' });
        execSync(`git push railway-fork master --quiet`, { stdio: 'ignore', timeout: 10000 });
        console.log(`✓ Auto-committed changes to ${filename}`);
      } catch (gitError) {
        console.log(`⚠ Could not auto-commit ${filename} (git error - this is OK in development)`);
      }
    }

    return true;
  } catch (error) {
    console.error(`Error writing ${filename}:`, error);
    return false;
  }
}

/**
 * Transform DB heritage figure to JSON format
 */
function transformFigureToJson(figure) {
  return {
    id: figure.id,
    urlSlug: figure.url_slug,
    fullName: figure.full_name,
    title: figure.title,
    imageUrl: figure.image_url,
    smallImageUrl: figure.small_image_url,
    heroImageUrl: figure.hero_image_url,
    category: figure.category,
    published: figure.published,
    headerLetter: figure.header_letter,
    summary: figure.summary,
    introduction: figure.introduction,
    sections: figure.sections,
    quote: figure.quote,
    highlights: figure.highlights,
    createdAt: figure.created_at,
    updatedAt: figure.updated_at
  };
}

/**
 * Transform DB news article to JSON format
 */
function transformNewsToJson(article) {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    description: article.description,
    content: article.content,
    category: article.category,
    author: article.author,
    date: article.date,
    publishedTime: article.published_time,
    featured_image: article.featured_image,
    images: article.images,
    keywords: article.keywords,
    published: article.published,
    created: article.created_at,
    updated: article.updated_at
  };
}

/**
 * Transform DB wellness tip to JSON format
 */
function transformTipToJson(tip) {
  return {
    id: tip.id,
    urlSlug: tip.url_slug,
    title: tip.title,
    description: tip.description,
    imageUrl: tip.image_url,
    heroImageUrl: tip.hero_image_url,
    altText: tip.alt_text,
    content: tip.content,
    published: tip.published,
    createdAt: tip.created_at,
    updatedAt: tip.updated_at
  };
}

/**
 * Transform DB podcast to JSON format
 */
function transformPodcastToJson(podcast) {
  return {
    id: podcast.id,
    videoId: podcast.video_id,
    title: podcast.title,
    description: podcast.description,
    imageUrl: podcast.image_url,
    altText: podcast.alt_text,
    published: podcast.published,
    createdAt: podcast.created_at,
    updatedAt: podcast.updated_at
  };
}

/**
 * Transform DB banner to JSON format
 */
function transformBannerToJson(banner) {
  return {
    id: banner.id,
    title: banner.title,
    imageUrl: banner.image_url,
    linkUrl: banner.link_url,
    displayOrder: banner.display_order,
    published: banner.published,
    createdAt: banner.created_at,
    updatedAt: banner.updated_at
  };
}

// ========================================
// API ENDPOINTS - HERITAGE FIGURES
// ========================================

/**
 * GET /api/figures
 * Get all Vietnamese heritage figures
 */
app.get('/api/figures', async (req, res) => {
  try {
    if (USE_DATABASE) {
      // Try cache first
      let figures = USE_CACHE ? await cacheService.getFigures('vi', true) : null;

      if (!figures) {
        // Fetch from database
        figures = await figuresRepo.findPublished('vi');
        figures = figures.map(transformFigureToJson);

        // Cache result
        if (USE_CACHE) {
          await cacheService.setFigures('vi', true, figures);
        }
      }

      // Get categories
      const categories = await figuresRepo.getCategories('vi');

      res.json({
        heritageFigures: figures,
        heritageCategories: categories
      });
    } else {
      // Fallback to JSON file
      const data = readJsonFile('heritage-figures.json') || { heritageFigures: [], heritageCategories: [] };
      res.json(data);
    }
  } catch (error) {
    console.error('Error getting figures:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/figures-en
 * Get all English heritage figures
 */
app.get('/api/figures-en', async (req, res) => {
  try {
    if (USE_DATABASE) {
      let figures = USE_CACHE ? await cacheService.getFigures('en', true) : null;

      if (!figures) {
        figures = await figuresRepo.findPublished('en');
        figures = figures.map(transformFigureToJson);

        if (USE_CACHE) {
          await cacheService.setFigures('en', true, figures);
        }
      }

      const categories = await figuresRepo.getCategories('en');

      res.json({
        heritageFigures: figures,
        heritageCategories: categories
      });
    } else {
      const data = readJsonFile('heritage-figures-en.json') || { heritageFigures: [], heritageCategories: [] };
      res.json(data);
    }
  } catch (error) {
    console.error('Error getting figures-en:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/save-figures
 * Save Vietnamese heritage figures
 */
app.post('/api/save-figures', async (req, res) => {
  try {
    const { heritageFigures } = req.body;

    if (USE_DATABASE) {
      // Note: For simplicity, we still write to JSON file
      // In production, you'd update database records individually
      const success = writeJsonFile('heritage-figures.json', req.body);

      if (success && USE_CACHE) {
        await cacheService.invalidateFigures('vi');
      }

      res.json({
        success,
        message: `Saved ${heritageFigures.length} Vietnamese heritage figures`,
        count: heritageFigures.length
      });
    } else {
      const success = writeJsonFile('heritage-figures.json', req.body);
      res.json({
        success,
        message: `Saved ${heritageFigures.length} Vietnamese heritage figures`,
        count: heritageFigures.length
      });
    }
  } catch (error) {
    console.error('Error saving figures:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/save-figures-en
 * Save English heritage figures
 */
app.post('/api/save-figures-en', async (req, res) => {
  try {
    const { heritageFigures } = req.body;

    if (USE_DATABASE) {
      const success = writeJsonFile('heritage-figures-en.json', req.body);

      if (success && USE_CACHE) {
        await cacheService.invalidateFigures('en');
      }

      res.json({
        success,
        message: `Saved ${heritageFigures.length} English heritage figures`,
        count: heritageFigures.length
      });
    } else {
      const success = writeJsonFile('heritage-figures-en.json', req.body);
      res.json({
        success,
        message: `Saved ${heritageFigures.length} English heritage figures`,
        count: heritageFigures.length
      });
    }
  } catch (error) {
    console.error('Error saving figures-en:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================
// API ENDPOINTS - NEWS
// ========================================

/**
 * GET /api/news
 * Get all Vietnamese news
 */
app.get('/api/news', async (req, res) => {
  try {
    if (USE_DATABASE) {
      let news = USE_CACHE ? await cacheService.getNews('vi', true) : null;

      if (!news) {
        news = await newsRepo.findPublished('vi');
        news = news.map(transformNewsToJson);

        if (USE_CACHE) {
          await cacheService.setNews('vi', true, news);
        }
      }

      res.json({ news });
    } else {
      const data = readJsonFile('news.json') || { news: [] };
      res.json(data);
    }
  } catch (error) {
    console.error('Error getting news:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/news-en
 * Get all English news
 */
app.get('/api/news-en', async (req, res) => {
  try {
    if (USE_DATABASE) {
      let news = USE_CACHE ? await cacheService.getNews('en', true) : null;

      if (!news) {
        news = await newsRepo.findPublished('en');
        news = news.map(transformNewsToJson);

        if (USE_CACHE) {
          await cacheService.setNews('en', true, news);
        }
      }

      res.json({ news });
    } else {
      const data = readJsonFile('news-en.json') || { news: [] };
      res.json(data);
    }
  } catch (error) {
    console.error('Error getting news-en:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/save-news
 */
app.post('/api/save-news', async (req, res) => {
  try {
    const { news } = req.body;
    const success = writeJsonFile('news.json', req.body);

    if (success && USE_DATABASE && USE_CACHE) {
      await cacheService.invalidateNews('vi');
    }

    res.json({
      success,
      message: `Saved ${news.length} Vietnamese news articles`,
      count: news.length
    });
  } catch (error) {
    console.error('Error saving news:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/save-news-en
 */
app.post('/api/save-news-en', async (req, res) => {
  try {
    const { news } = req.body;
    const success = writeJsonFile('news-en.json', req.body);

    if (success && USE_DATABASE && USE_CACHE) {
      await cacheService.invalidateNews('en');
    }

    res.json({
      success,
      message: `Saved ${news.length} English news articles`,
      count: news.length
    });
  } catch (error) {
    console.error('Error saving news-en:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================
// API ENDPOINTS - WELLNESS TIPS
// ========================================

/**
 * GET /api/tips
 */
app.get('/api/tips', async (req, res) => {
  try {
    if (USE_DATABASE) {
      let tips = USE_CACHE ? await cacheService.getTips('vi', true) : null;

      if (!tips) {
        tips = await tipsRepo.findPublished('vi');
        tips = tips.map(transformTipToJson);

        if (USE_CACHE) {
          await cacheService.setTips('vi', true, tips);
        }
      }

      res.json({ wellnessTips: tips });
    } else {
      const data = readJsonFile('wellness-tips.json') || { wellnessTips: [] };
      res.json(data);
    }
  } catch (error) {
    console.error('Error getting tips:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tips-en
 */
app.get('/api/tips-en', async (req, res) => {
  try {
    if (USE_DATABASE) {
      let tips = USE_CACHE ? await cacheService.getTips('en', true) : null;

      if (!tips) {
        tips = await tipsRepo.findPublished('en');
        tips = tips.map(transformTipToJson);

        if (USE_CACHE) {
          await cacheService.setTips('en', true, tips);
        }
      }

      res.json({ wellnessTips: tips });
    } else {
      const data = readJsonFile('wellness-tips-en.json') || { wellnessTips: [] };
      res.json(data);
    }
  } catch (error) {
    console.error('Error getting tips-en:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/save-tips
 */
app.post('/api/save-tips', async (req, res) => {
  try {
    const { wellnessTips } = req.body;
    const success = writeJsonFile('wellness-tips.json', req.body);

    if (success && USE_DATABASE && USE_CACHE) {
      await cacheService.invalidateTips('vi');
    }

    res.json({
      success,
      message: `Saved ${wellnessTips.length} Vietnamese wellness tips`,
      count: wellnessTips.length
    });
  } catch (error) {
    console.error('Error saving tips:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/save-tips-en
 */
app.post('/api/save-tips-en', async (req, res) => {
  try {
    const { wellnessTips } = req.body;
    const success = writeJsonFile('wellness-tips-en.json', req.body);

    if (success && USE_DATABASE && USE_CACHE) {
      await cacheService.invalidateTips('en');
    }

    res.json({
      success,
      message: `Saved ${wellnessTips.length} English wellness tips`,
      count: wellnessTips.length
    });
  } catch (error) {
    console.error('Error saving tips-en:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================
// API ENDPOINTS - PODCASTS
// ========================================

/**
 * GET /api/podcasts
 */
app.get('/api/podcasts', async (req, res) => {
  try {
    if (USE_DATABASE) {
      let podcasts = USE_CACHE ? await cacheService.getPodcasts('vi', true) : null;

      if (!podcasts) {
        podcasts = await podcastsRepo.findPublished('vi');
        podcasts = podcasts.map(transformPodcastToJson);

        if (USE_CACHE) {
          await cacheService.setPodcasts('vi', true, podcasts);
        }
      }

      res.json({ podcasts });
    } else {
      const data = readJsonFile('podcasts.json') || { podcasts: [] };
      res.json(data);
    }
  } catch (error) {
    console.error('Error getting podcasts:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/podcasts-en
 */
app.get('/api/podcasts-en', async (req, res) => {
  try {
    if (USE_DATABASE) {
      let podcasts = USE_CACHE ? await cacheService.getPodcasts('en', true) : null;

      if (!podcasts) {
        podcasts = await podcastsRepo.findPublished('en');
        podcasts = podcasts.map(transformPodcastToJson);

        if (USE_CACHE) {
          await cacheService.setPodcasts('en', true, podcasts);
        }
      }

      res.json({ podcasts });
    } else {
      const data = readJsonFile('podcasts-en.json') || { podcasts: [] };
      res.json(data);
    }
  } catch (error) {
    console.error('Error getting podcasts-en:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/save-podcasts
 */
app.post('/api/save-podcasts', async (req, res) => {
  try {
    const { podcasts } = req.body;
    const success = writeJsonFile('podcasts.json', req.body);

    if (success && USE_DATABASE && USE_CACHE) {
      await cacheService.invalidatePodcasts('vi');
    }

    res.json({
      success,
      message: `Saved ${podcasts.length} Vietnamese podcasts`,
      count: podcasts.length
    });
  } catch (error) {
    console.error('Error saving podcasts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/save-podcasts-en
 */
app.post('/api/save-podcasts-en', async (req, res) => {
  try {
    const { podcasts } = req.body;
    const success = writeJsonFile('podcasts-en.json', req.body);

    if (success && USE_DATABASE && USE_CACHE) {
      await cacheService.invalidatePodcasts('en');
    }

    res.json({
      success,
      message: `Saved ${podcasts.length} English podcasts`,
      count: podcasts.length
    });
  } catch (error) {
    console.error('Error saving podcasts-en:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================
// API ENDPOINTS - SINGLE ITEM LOOKUPS (by slug)
// ========================================

/**
 * GET /api/news/slug/:slug
 * Get a single news article by URL slug
 */
app.get('/api/news/slug/:slug', async (req, res) => {
  try {
    const data = readJsonFile('news.json') || { news: [] };
    const article = data.news?.find(n => n.urlSlug === req.params.slug);

    if (!article) {
      return res.status(404).json({ error: 'News article not found' });
    }

    res.json(article);
  } catch (error) {
    console.error('Error fetching news by slug:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/news/slug/:slug/en
 * Get a single English news article by URL slug
 */
app.get('/api/news/slug/:slug/en', async (req, res) => {
  try {
    const data = readJsonFile('news-en.json') || { news: [] };
    const article = data.news?.find(n => n.urlSlug === req.params.slug);

    if (!article) {
      return res.status(404).json({ error: 'News article not found' });
    }

    res.json(article);
  } catch (error) {
    console.error('Error fetching English news by slug:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tips/slug/:slug
 * Get a single wellness tip by URL slug
 */
app.get('/api/tips/slug/:slug', async (req, res) => {
  try {
    const data = readJsonFile('wellness-tips.json') || { wellnessTips: [] };
    const tip = data.wellnessTips?.find(t => t.urlSlug === req.params.slug);

    if (!tip) {
      return res.status(404).json({ error: 'Wellness tip not found' });
    }

    res.json(tip);
  } catch (error) {
    console.error('Error fetching tip by slug:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tips/slug/:slug/en
 * Get a single English wellness tip by URL slug
 */
app.get('/api/tips/slug/:slug/en', async (req, res) => {
  try {
    const data = readJsonFile('wellness-tips-en.json') || { wellnessTips: [] };
    const tip = data.wellnessTips?.find(t => t.urlSlug === req.params.slug);

    if (!tip) {
      return res.status(404).json({ error: 'Wellness tip not found' });
    }

    res.json(tip);
  } catch (error) {
    console.error('Error fetching English tip by slug:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/figures/slug/:slug
 * Get a single heritage figure by URL slug
 */
app.get('/api/figures/slug/:slug', async (req, res) => {
  try {
    const data = readJsonFile('heritage-figures.json') || { heritageFigures: [] };
    const figure = data.heritageFigures?.find(f => f.urlSlug === req.params.slug);

    if (!figure) {
      return res.status(404).json({ error: 'Heritage figure not found' });
    }

    res.json(figure);
  } catch (error) {
    console.error('Error fetching figure by slug:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/figures/slug/:slug/en
 * Get a single English heritage figure by URL slug
 */
app.get('/api/figures/slug/:slug/en', async (req, res) => {
  try {
    const data = readJsonFile('heritage-figures-en.json') || { heritageFigures: [] };
    const figure = data.heritageFigures?.find(f => f.urlSlug === req.params.slug);

    if (!figure) {
      return res.status(404).json({ error: 'Heritage figure not found' });
    }

    res.json(figure);
  } catch (error) {
    console.error('Error fetching English figure by slug:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// API ENDPOINTS - BANNERS
// ========================================

/**
 * GET /api/banners
 */
app.get('/api/banners', async (req, res) => {
  try {
    if (USE_DATABASE) {
      let banners = USE_CACHE ? await cacheService.getBanners(true) : null;

      if (!banners) {
        banners = await bannersRepo.findPublished();
        banners = banners.map(transformBannerToJson);

        if (USE_CACHE) {
          await cacheService.setBanners(true, banners);
        }
      }

      res.json({ banners });
    } else {
      const data = readJsonFile('banners.json') || { banners: [] };
      res.json(data);
    }
  } catch (error) {
    console.error('Error getting banners:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/save-banners
 */
app.post('/api/save-banners', async (req, res) => {
  try {
    const { banners } = req.body;
    const success = writeJsonFile('banners.json', req.body);

    if (success && USE_DATABASE && USE_CACHE) {
      await cacheService.invalidateBanners();
    }

    res.json({
      success,
      message: `Saved ${banners.length} banners`,
      count: banners.length
    });
  } catch (error) {
    console.error('Error saving banners:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================
// API ENDPOINTS - PROFILES (alias for figures)
// ========================================

app.get('/api/profiles', (req, res) => req.app._router.handle({ ...req, url: '/api/figures' }, res));
app.post('/api/save-profiles', (req, res) => req.app._router.handle({ ...req, url: '/api/save-figures' }, res));

// ========================================
// API ENDPOINTS - SYSTEM
// ========================================

/**
 * GET /api/status
 * Get server status
 */
app.get('/api/status', async (req, res) => {
  const status = {
    server: 'Living Heritage',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    mode: USE_DATABASE ? 'PostgreSQL + Redis' : 'JSON Files',
    database: {
      enabled: USE_DATABASE,
      connected: USE_DATABASE ? dbConnection.isHealthy() : false
    },
    cache: {
      enabled: USE_CACHE,
      connected: USE_CACHE ? redisClient.isHealthy() : false
    }
  };

  if (USE_DATABASE) {
    try {
      const dbHealth = await dbConnection.healthCheck();
      const cacheHealth = USE_CACHE ? await redisClient.healthCheck() : { healthy: false };

      status.database.health = dbHealth;
      status.cache.health = cacheHealth;
    } catch (error) {
      status.error = error.message;
    }
  }

  res.json(status);
});

/**
 * GET /api/health
 * Health check endpoint (for Docker)
 */
app.get('/api/health', async (req, res) => {
  try {
    if (USE_DATABASE) {
      const dbHealth = await dbConnection.healthCheck();
      if (!dbHealth.healthy) {
        return res.status(503).json({ status: 'unhealthy', reason: 'Database not available' });
      }
    }

    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', error: error.message });
  }
});

// ========================================
// GET ENDPOINTS FOR ADMIN PANEL
// ========================================

/**
 * GET /api/admin/figures
 * Get all Vietnamese heritage figures (including unpublished) for admin
 */
app.get('/api/admin/figures', authenticateAdminApiKey, async (req, res) => {
  try {
    if (USE_DATABASE) {
      // Get all figures regardless of published status
      const figures = await figuresRepo.findAll({ language: 'vi' });
      const transformed = figures.map(transformFigureToJson);
      const categories = await figuresRepo.getCategories('vi');

      res.json({
        heritageFigures: transformed,
        heritageCategories: categories
      });
    } else {
      // Fallback to JSON file
      const data = readJsonFile('heritage-figures.json') || { heritageFigures: [], heritageCategories: [] };
      res.json(data);
    }
  } catch (error) {
    console.error('Error getting admin figures:', error);
    // If database fails, fallback to JSON
    const data = readJsonFile('heritage-figures.json') || { heritageFigures: [], heritageCategories: [] };
    res.json(data);
  }
});

/**
 * GET /api/admin/figures-en
 * Get all English heritage figures (including unpublished) for admin
 */
app.get('/api/admin/figures-en', authenticateAdminApiKey, async (req, res) => {
  try {
    // English content always uses JSON files since it's newly extracted
    const data = readJsonFile('heritage-figures-en.json') || { heritageFigures: [], heritageCategories: [] };
    res.json(data);
  } catch (error) {
    console.error('Error getting admin figures-en:', error);
    // Fallback to JSON
    const data = readJsonFile('heritage-figures-en.json') || { heritageFigures: [], heritageCategories: [] };
    res.json(data);
  }
});

/**
 * GET /api/admin/news
 * Get all Vietnamese news articles (including unpublished) for admin
 */
app.get('/api/admin/news', authenticateAdminApiKey, async (req, res) => {
  try {
    if (USE_DATABASE) {
      const news = await newsRepo.findAll({ language: 'vi' });
      const transformed = news.map(transformNewsToJson);

      res.json({
        news: transformed
      });
    } else {
      // Fallback to JSON file
      const data = readJsonFile('news.json') || { news: [] };
      res.json(data);
    }
  } catch (error) {
    console.error('Error getting admin news:', error);
    // If database fails, fallback to JSON
    const data = readJsonFile('news.json') || { news: [] };
    res.json(data);
  }
});

/**
 * GET /api/admin/news-en
 * Get all English news articles (including unpublished) for admin
 */
app.get('/api/admin/news-en', authenticateAdminApiKey, async (req, res) => {
  try {
    // English content always uses JSON files since it's newly extracted
    const data = readJsonFile('news-en.json') || { news: [] };
    res.json(data);
  } catch (error) {
    console.error('Error getting admin news-en:', error);
    // Fallback to JSON file
    const data = readJsonFile('news-en.json') || { news: [] };
    res.json(data);
  }
});

/**
 * GET /api/admin/tips
 * Get all Vietnamese wellness tips (including unpublished) for admin
 */
app.get('/api/admin/tips', authenticateAdminApiKey, async (req, res) => {
  try {
    if (USE_DATABASE) {
      const tips = await tipsRepo.findAll({ language: 'vi' });
      const transformed = tips.map(transformTipToJson);

      res.json({
        wellnessTips: transformed
      });
    } else {
      // Fallback to JSON file
      const data = readJsonFile('wellness-tips.json') || { wellnessTips: [] };
      res.json(data);
    }
  } catch (error) {
    console.error('Error getting admin tips:', error);
    // If database fails, fallback to JSON
    const data = readJsonFile('wellness-tips.json') || { wellnessTips: [] };
    res.json(data);
  }
});

/**
 * GET /api/admin/tips-en
 * Get all English wellness tips (including unpublished) for admin
 */
app.get('/api/admin/tips-en', authenticateAdminApiKey, async (req, res) => {
  try {
    // English content always uses JSON files since it's newly extracted
    const data = readJsonFile('wellness-tips-en.json') || { wellnessTips: [] };
    res.json(data);
  } catch (error) {
    console.error('Error getting admin tips-en:', error);
    // Fallback to JSON file
    const data = readJsonFile('wellness-tips-en.json') || { wellnessTips: [] };
    res.json(data);
  }
});

// ========================================
// CRUD API ENDPOINTS (Admin)
// ========================================

/**
 * POST /api/admin/figures
 * Create a new heritage figure
 */
app.post('/api/admin/figures', authenticateAdminApiKey, async (req, res) => {
  try {
    if (USE_DATABASE) {
      const figure = await figuresRepo.create(req.body);
      const transformed = transformFigureToJson(figure);

      // Invalidate cache
      if (USE_CACHE) {
        await cacheService.invalidateFigures(req.body.language);
      }

      res.status(201).json(transformed);
    } else {
      // JSON file mode - add to heritage-figures.json
      const language = req.body.language || 'vi';
      const filename = language === 'en' ? 'heritage-figures-en.json' : 'heritage-figures.json';
      const data = readJsonFile(filename) || { heritageFigures: [] };

      const newId = Math.max(...(data.heritageFigures || []).map(f => f.id || 0), 0) + 1;
      const figure = {
        id: newId,
        ...req.body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      data.heritageFigures.push(figure);
      writeJsonFile(filename, data);

      res.status(201).json({ success: true, id: newId, figure });
    }
  } catch (error) {
    console.error('Error creating figure:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/admin/figures/:id
 * Update a heritage figure
 */
app.put('/api/admin/figures/:id', authenticateAdminApiKey, async (req, res) => {
  try {
    if (USE_DATABASE) {
      const figure = await figuresRepo.update(parseInt(req.params.id), req.body);
      if (!figure) {
        return res.status(404).json({ error: 'Figure not found' });
      }

      const transformed = transformFigureToJson(figure);

      // Invalidate cache
      if (USE_CACHE) {
        await cacheService.invalidateFigures(req.body.language);
      }

      res.json(transformed);
    } else {
      // JSON file mode - update in heritage-figures.json
      const id = parseInt(req.params.id);
      const language = req.body.language || 'vi';
      const filename = language === 'en' ? 'heritage-figures-en.json' : 'heritage-figures.json';
      const data = readJsonFile(filename) || { heritageFigures: [] };

      const figureIndex = (data.heritageFigures || []).findIndex(f => f.id === id);
      if (figureIndex === -1) {
        return res.status(404).json({ error: 'Figure not found' });
      }

      data.heritageFigures[figureIndex] = {
        ...data.heritageFigures[figureIndex],
        ...req.body,
        id: id,
        updatedAt: new Date().toISOString()
      };

      writeJsonFile(filename, data);
      res.json({ success: true, figure: data.heritageFigures[figureIndex] });
    }
  } catch (error) {
    console.error('Error updating figure:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/admin/figures/:id
 * Delete a heritage figure
 */
app.delete('/api/admin/figures/:id', authenticateAdminApiKey, async (req, res) => {
  try {
    if (USE_DATABASE) {
      const success = await figuresRepo.delete(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ error: 'Figure not found' });
      }

      // Invalidate cache
      if (USE_CACHE) {
        await cacheService.invalidateFigures();
      }

      res.json({ success: true });
    } else {
      // JSON file mode - delete from both heritage-figures.json and heritage-figures-en.json
      const id = parseInt(req.params.id);
      let deleted = false;

      ['heritage-figures.json', 'heritage-figures-en.json'].forEach(filename => {
        const data = readJsonFile(filename);
        if (data && data.heritageFigures) {
          const initialLength = data.heritageFigures.length;
          data.heritageFigures = data.heritageFigures.filter(f => f.id !== id);
          if (data.heritageFigures.length < initialLength) {
            writeJsonFile(filename, data);
            deleted = true;
          }
        }
      });

      if (!deleted) {
        return res.status(404).json({ error: 'Figure not found' });
      }

      res.json({ success: true });
    }
  } catch (error) {
    console.error('Error deleting figure:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/news
 * Create a new news article
 */
app.post('/api/admin/news', authenticateAdminApiKey, async (req, res) => {
  try {
    if (USE_DATABASE) {
      try {
        // Map admin panel fields to database fields
        const dbData = {
          title: req.body.title,
          description: req.body.description,
          short_description: req.body.description?.substring(0, 160) || '',
          author: req.body.author || 'Living Heritage',
          publication_date: new Date().toISOString(),
          images: [],
          featured_image: req.body.imageUrl || '',
          content: req.body.content || '',
          category: 'News',
          slug: req.body.urlSlug || req.body.title?.toLowerCase().replace(/\s+/g, '-')
        };

        const article = await newsRepo.create(dbData);
        const transformed = transformNewsToJson(article);

        // Invalidate cache
        if (USE_CACHE) {
          await cacheService.invalidateNews(req.body.language || 'vi');
        }

        res.status(201).json(transformed);
      } catch (dbError) {
        // Database error - fall back to JSON mode
        console.warn('Database error, falling back to JSON mode:', dbError.message);

        const language = req.body.language || 'vi';
        const filename = language === 'en' ? 'news-en.json' : 'news.json';
        const data = readJsonFile(filename) || { news: [] };

        const newId = Math.max(...(data.news || []).map(n => n.id || 0), 0) + 1;
        const article = {
          id: newId,
          ...req.body,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        data.news.push(article);
        writeJsonFile(filename, data);

        res.status(201).json({ success: true, id: newId, article });
      }
    } else {
      // JSON file mode - add to news.json
      const language = req.body.language || 'vi';
      const filename = language === 'en' ? 'news-en.json' : 'news.json';
      const data = readJsonFile(filename) || { news: [] };

      const newId = Math.max(...(data.news || []).map(n => n.id || 0), 0) + 1;
      const article = {
        id: newId,
        ...req.body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      data.news.push(article);
      writeJsonFile(filename, data);

      res.status(201).json({ success: true, id: newId, article });
    }
  } catch (error) {
    console.error('Error creating news:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/admin/news/:id
 * Update a news article
 */
app.put('/api/admin/news/:id', authenticateAdminApiKey, async (req, res) => {
  try {
    if (USE_DATABASE) {
      try {
        // Map admin panel fields to database fields
        const dbData = {
          title: req.body.title,
          description: req.body.description,
          short_description: req.body.description?.substring(0, 160) || '',
          author: req.body.author || 'Living Heritage',
          publication_date: req.body.publication_date || new Date().toISOString(),
          images: req.body.images || [],
          featured_image: req.body.imageUrl || '',
          content: req.body.content || '',
          category: req.body.category || 'News',
          slug: req.body.urlSlug || req.body.title?.toLowerCase().replace(/\s+/g, '-')
        };

        const article = await newsRepo.update(parseInt(req.params.id), dbData);
        if (!article) {
          return res.status(404).json({ error: 'News article not found' });
        }

        const transformed = transformNewsToJson(article);

        // Invalidate cache
        if (USE_CACHE) {
          await cacheService.invalidateNews(req.body.language || 'vi');
        }

        res.json(transformed);
      } catch (dbError) {
        // Database error - fall back to JSON mode
        console.warn('Database error, falling back to JSON mode:', dbError.message);

        const id = parseInt(req.params.id);
        const language = req.body.language || 'vi';
        const filename = language === 'en' ? 'news-en.json' : 'news.json';
        const data = readJsonFile(filename) || { news: [] };

        const articleIndex = (data.news || []).findIndex(n => n.id === id);
        if (articleIndex === -1) {
          return res.status(404).json({ error: 'News article not found' });
        }

        data.news[articleIndex] = {
          ...data.news[articleIndex],
          ...req.body,
          id: id,
          updatedAt: new Date().toISOString()
        };

        writeJsonFile(filename, data);
        res.json({ success: true, article: data.news[articleIndex] });
      }
    } else {
      // JSON file mode - update in news.json
      const id = parseInt(req.params.id);
      const language = req.body.language || 'vi';
      const filename = language === 'en' ? 'news-en.json' : 'news.json';
      const data = readJsonFile(filename) || { news: [] };

      const articleIndex = (data.news || []).findIndex(n => n.id === id);
      if (articleIndex === -1) {
        return res.status(404).json({ error: 'News article not found' });
      }

      data.news[articleIndex] = {
        ...data.news[articleIndex],
        ...req.body,
        id: id,
        updatedAt: new Date().toISOString()
      };

      writeJsonFile(filename, data);
      res.json({ success: true, article: data.news[articleIndex] });
    }
  } catch (error) {
    console.error('Error updating news:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/admin/news/:id
 * Delete a news article
 */
app.delete('/api/admin/news/:id', authenticateAdminApiKey, async (req, res) => {
  try {
    if (USE_DATABASE) {
      const success = await newsRepo.delete(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ error: 'News article not found' });
      }

      // Invalidate cache
      if (USE_CACHE) {
        await cacheService.invalidateNews();
      }

      res.json({ success: true });
    } else {
      // JSON file mode - delete from both news.json and news-en.json
      const id = parseInt(req.params.id);
      let deleted = false;

      ['news.json', 'news-en.json'].forEach(filename => {
        const data = readJsonFile(filename);
        if (data && data.news) {
          const initialLength = data.news.length;
          data.news = data.news.filter(n => n.id !== id);
          if (data.news.length < initialLength) {
            writeJsonFile(filename, data);
            deleted = true;
          }
        }
      });

      if (!deleted) {
        return res.status(404).json({ error: 'News article not found' });
      }

      res.json({ success: true });
    }
  } catch (error) {
    console.error('Error deleting news:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/tips
 * Create a new wellness tip
 */
app.post('/api/admin/tips', authenticateAdminApiKey, async (req, res) => {
  try {
    if (USE_DATABASE) {
      const tip = await tipsRepo.create(req.body);
      const transformed = transformTipToJson(tip);

      // Invalidate cache
      if (USE_CACHE) {
        await cacheService.invalidateTips(req.body.language);
      }

      res.status(201).json(transformed);
    } else {
      // JSON file mode - add to wellness-tips.json
      const language = req.body.language || 'vi';
      const filename = language === 'en' ? 'wellness-tips-en.json' : 'wellness-tips.json';
      const data = readJsonFile(filename) || { wellnessTips: [] };

      const newId = Math.max(...(data.wellnessTips || []).map(t => t.id || 0), 0) + 1;
      const tip = {
        id: newId,
        ...req.body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      data.wellnessTips.push(tip);
      writeJsonFile(filename, data);

      res.status(201).json({ success: true, id: newId, tip });
    }
  } catch (error) {
    console.error('Error creating tip:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/admin/tips/:id
 * Update a wellness tip
 */
app.put('/api/admin/tips/:id', authenticateAdminApiKey, async (req, res) => {
  try {
    if (USE_DATABASE) {
      const tip = await tipsRepo.update(parseInt(req.params.id), req.body);
      if (!tip) {
        return res.status(404).json({ error: 'Tip not found' });
      }

      const transformed = transformTipToJson(tip);

      // Invalidate cache
      if (USE_CACHE) {
        await cacheService.invalidateTips(req.body.language);
      }

      res.json(transformed);
    } else {
      // JSON file mode - update in wellness-tips.json
      const id = parseInt(req.params.id);
      const language = req.body.language || 'vi';
      const filename = language === 'en' ? 'wellness-tips-en.json' : 'wellness-tips.json';
      const data = readJsonFile(filename) || { wellnessTips: [] };

      const tipIndex = (data.wellnessTips || []).findIndex(t => t.id === id);
      if (tipIndex === -1) {
        return res.status(404).json({ error: 'Tip not found' });
      }

      data.wellnessTips[tipIndex] = {
        ...data.wellnessTips[tipIndex],
        ...req.body,
        id: id,
        updatedAt: new Date().toISOString()
      };

      writeJsonFile(filename, data);
      res.json({ success: true, tip: data.wellnessTips[tipIndex] });
    }
  } catch (error) {
    console.error('Error updating tip:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/admin/tips/:id
 * Delete a wellness tip
 */
app.delete('/api/admin/tips/:id', authenticateAdminApiKey, async (req, res) => {
  try {
    if (USE_DATABASE) {
      const success = await tipsRepo.delete(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ error: 'Tip not found' });
      }

      // Invalidate cache
      if (USE_CACHE) {
        await cacheService.invalidateTips();
      }

      res.json({ success: true });
    } else {
      // JSON file mode - delete from both wellness-tips.json and wellness-tips-en.json
      const id = parseInt(req.params.id);
      let deleted = false;

      ['wellness-tips.json', 'wellness-tips-en.json'].forEach(filename => {
        const data = readJsonFile(filename);
        if (data && data.wellnessTips) {
          const initialLength = data.wellnessTips.length;
          data.wellnessTips = data.wellnessTips.filter(t => t.id !== id);
          if (data.wellnessTips.length < initialLength) {
            writeJsonFile(filename, data);
            deleted = true;
          }
        }
      });

      if (!deleted) {
        return res.status(404).json({ error: 'Tip not found' });
      }

      res.json({ success: true });
    }
  } catch (error) {
    console.error('Error deleting tip:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/podcasts
 * Create a new podcast
 */
app.post('/api/admin/podcasts', async (req, res) => {
  try {
    if (!USE_DATABASE) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const podcast = await podcastsRepo.create(req.body);
    const transformed = transformPodcastToJson(podcast);

    // Invalidate cache
    if (USE_CACHE) {
      await cacheService.invalidatePodcasts(req.body.language);
    }

    res.status(201).json(transformed);
  } catch (error) {
    console.error('Error creating podcast:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/admin/podcasts/:id
 * Update a podcast
 */
app.put('/api/admin/podcasts/:id', async (req, res) => {
  try {
    if (!USE_DATABASE) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const podcast = await podcastsRepo.update(parseInt(req.params.id), req.body);
    if (!podcast) {
      return res.status(404).json({ error: 'Podcast not found' });
    }

    const transformed = transformPodcastToJson(podcast);

    // Invalidate cache
    if (USE_CACHE) {
      await cacheService.invalidatePodcasts(req.body.language);
    }

    res.json(transformed);
  } catch (error) {
    console.error('Error updating podcast:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/admin/podcasts/:id
 * Delete a podcast
 */
app.delete('/api/admin/podcasts/:id', async (req, res) => {
  try {
    if (!USE_DATABASE) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const success = await podcastsRepo.delete(parseInt(req.params.id));
    if (!success) {
      return res.status(404).json({ error: 'Podcast not found' });
    }

    // Invalidate cache
    if (USE_CACHE) {
      await cacheService.invalidatePodcasts();
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting podcast:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/banners
 * Create a new banner
 */
app.post('/api/admin/banners', async (req, res) => {
  try {
    if (!USE_DATABASE) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const banner = await bannersRepo.create(req.body);
    const transformed = transformBannerToJson(banner);

    // Invalidate cache
    if (USE_CACHE) {
      await cacheService.invalidateBanners();
    }

    res.status(201).json(transformed);
  } catch (error) {
    console.error('Error creating banner:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/admin/banners/:id
 * Update a banner
 */
app.put('/api/admin/banners/:id', async (req, res) => {
  try {
    if (!USE_DATABASE) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const banner = await bannersRepo.update(parseInt(req.params.id), req.body);
    if (!banner) {
      return res.status(404).json({ error: 'Banner not found' });
    }

    const transformed = transformBannerToJson(banner);

    // Invalidate cache
    if (USE_CACHE) {
      await cacheService.invalidateBanners();
    }

    res.json(transformed);
  } catch (error) {
    console.error('Error updating banner:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/admin/banners/:id
 * Delete a banner
 */
app.delete('/api/admin/banners/:id', async (req, res) => {
  try {
    if (!USE_DATABASE) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const success = await bannersRepo.delete(parseInt(req.params.id));
    if (!success) {
      return res.status(404).json({ error: 'Banner not found' });
    }

    // Invalidate cache
    if (USE_CACHE) {
      await cacheService.invalidateBanners();
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting banner:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// STATIC FILES (served last)
// ========================================

app.use(express.static(__dirname));

// ========================================
// SERVER STARTUP
// ========================================

async function startServer() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║     Living Heritage - Node.js Server Running              ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Connect to database if enabled
  if (USE_DATABASE) {
    try {
      await dbConnection.connect();
    } catch (error) {
      console.error('❌ Failed to connect to database:', error.message);
      console.log('⚠️  Falling back to JSON file mode');
      process.env.USE_DATABASE = 'false';
    }
  }

  // Connect to Redis if enabled
  if (USE_CACHE && USE_DATABASE) {
    try {
      await redisClient.connect();

      // Warmup cache with frequently accessed data
      setTimeout(async () => {
        console.log('\n⟳ Warming up cache...');
        await cacheService.warmup({
          figures: figuresRepo,
          news: newsRepo,
          tips: tipsRepo,
          podcasts: podcastsRepo,
          banners: bannersRepo
        });
      }, 2000);
    } catch (error) {
      console.error('⚠️  Redis connection failed:', error.message);
      console.log('⚠️  Continuing without cache');
    }
  }

  // Start HTTP server
  app.listen(PORT, () => {
    console.log(`\n📍 Server: http://localhost:${PORT}`);
    console.log(`📂 Data Dir: ${dataDir}`);
    console.log(`\n✓ Mode: ${USE_DATABASE ? 'PostgreSQL + Redis' : 'JSON Files'}`);

    if (USE_DATABASE) {
      console.log('\n✓ API Endpoints Ready (with PostgreSQL):');
    } else {
      console.log('\n✓ API Endpoints Ready (JSON mode):');
    }

    console.log('  Vietnamese Content:');
    console.log('  GET  /api/news         - Get all news');
    console.log('  POST /api/save-news    - Save news articles');
    console.log('  GET  /api/tips         - Get all tips');
    console.log('  POST /api/save-tips    - Save tips');
    console.log('  GET  /api/podcasts     - Get all podcasts');
    console.log('  POST /api/save-podcasts - Save podcasts');
    console.log('  GET  /api/figures      - Get all heritage figures');
    console.log('  POST /api/save-figures - Save heritage figures');

    console.log('\n  English Content:');
    console.log('  GET  /api/news-en      - Get all English news');
    console.log('  POST /api/save-news-en - Save English news');
    console.log('  GET  /api/tips-en      - Get all English tips');
    console.log('  POST /api/save-tips-en - Save English tips');
    console.log('  GET  /api/podcasts-en  - Get all English podcasts');
    console.log('  POST /api/save-podcasts-en - Save English podcasts');
    console.log('  GET  /api/figures-en   - Get all English figures');
    console.log('  POST /api/save-figures-en - Save English figures');

    console.log('\n  Other:');
    console.log('  GET  /api/profiles     - Get all profiles');
    console.log('  POST /api/save-profiles - Save profiles');
    console.log('  GET  /api/banners      - Get all banners');
    console.log('  POST /api/save-banners - Save banners');
    console.log('  GET  /api/status       - Server status');
    console.log('  GET  /api/health       - Health check');

    console.log('\n✓ Static Files:');
    console.log('  All files in current directory are served');

    console.log('\nPress Ctrl+C to stop the server.\n');
  });
}

// Start the server
startServer().catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
