/**
 * Dynamic Detail Page Loader
 * Fetches content from JSON API and populates the page
 * Supports news, tips, figures, and other detail pages
 */

class DetailPageLoader {
  constructor() {
    this.contentType = this.detectContentType();
    this.language = this.detectLanguage();
    this.slug = this.extractSlugFromURL();
  }

  /**
   * Detect content type from current URL
   */
  detectContentType() {
    const path = window.location.pathname;

    // Check if it's a wellness tip page
    if (path.includes('wellness-tips') || document.body.classList.contains('tips-page')) {
      return 'tips';
    }

    // Check if it's a heritage figure page
    if (path.includes('nhan-vat-di-san') || path.includes('heritage-figure') ||
        document.body.classList.contains('figures-page')) {
      return 'figures';
    }

    // Default to news
    return 'news';
  }

  /**
   * Detect language from URL or HTML
   */
  detectLanguage() {
    const path = window.location.pathname;
    if (path.startsWith('/en/')) {
      return 'en';
    }
    return 'vi';
  }

  /**
   * Extract slug from current URL or page content
   */
  extractSlugFromURL() {
    // Try to get from URL path (last segment without .html)
    const path = window.location.pathname;
    const match = path.match(/\/([^\/]+)\.html$/);
    if (match) {
      return match[1];
    }

    // Fallback: try to get from data attribute on body or main element
    const dataSlug = document.body.getAttribute('data-slug') ||
                     document.querySelector('main')?.getAttribute('data-slug');
    if (dataSlug) {
      return dataSlug;
    }

    return null;
  }

  /**
   * Build API endpoint URL
   */
  getAPIEndpoint() {
    if (!this.slug) {
      console.error('Could not determine slug for this page');
      return null;
    }

    const apiPath = `/api/${this.contentType}/slug/${this.slug}`;
    return this.language === 'en' ? `${apiPath}/en` : apiPath;
  }

  /**
   * Fetch data from API
   */
  async fetchData() {
    const endpoint = this.getAPIEndpoint();
    if (!endpoint) {
      console.error('Cannot fetch: no API endpoint');
      return null;
    }

    try {
      const response = await fetch(endpoint);
      if (!response.ok) {
        console.error(`API Error: ${response.status} - ${response.statusText}`);
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching data:', error);
      return null;
    }
  }

  /**
   * Populate news article content
   */
  populateNewsContent(article) {
    if (!article) return false;

    // Title
    const titleEl = document.querySelector('.news-main-title, .news-title, h1.article-title, .article-header h1');
    if (titleEl) titleEl.textContent = article.title || '';

    // Featured image
    const imageEl = document.querySelector('.news-main-image, .article-hero-image, img.featured-image');
    if (imageEl && article.imageUrl) {
      imageEl.src = article.imageUrl;
      imageEl.alt = article.title || 'Article image';
    }

    // Main content - use htmlContent if available, otherwise use plain content
    const contentEl = document.querySelector('.news-text, .article-content, .content-body');
    if (contentEl) {
      if (article.htmlContent) {
        contentEl.innerHTML = article.htmlContent;
      } else if (article.content) {
        contentEl.innerHTML = article.content;
      }
    }

    // Author (optional)
    const authorEl = document.querySelector('.news-author, .article-author');
    if (authorEl && article.author) {
      authorEl.textContent = `By ${article.author}`;
    }

    // Date (optional)
    const dateEl = document.querySelector('.news-date, .article-date, .published-date');
    if (dateEl && article.createdAt) {
      const date = new Date(article.createdAt).toLocaleDateString(
        this.language === 'en' ? 'en-US' : 'vi-VN'
      );
      dateEl.textContent = date;
    }

    // Meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && article.description) {
      metaDesc.setAttribute('content', article.description);
    }

    // Page title
    if (article.title) {
      document.title = article.title + ' | Living Heritage';
    }

    return true;
  }

  /**
   * Populate wellness tip content
   */
  populateTipContent(tip) {
    if (!tip) return false;

    // Title
    const titleEl = document.querySelector('.tip-title, h1.article-title, .article-header h1');
    if (titleEl) titleEl.textContent = tip.title || '';

    // Featured image
    const imageEl = document.querySelector('.tip-hero-image, .article-hero-image, img.featured-image');
    if (imageEl && tip.imageUrl) {
      imageEl.src = tip.imageUrl;
      imageEl.alt = tip.title || 'Tip image';
    }

    // Description
    const descEl = document.querySelector('.tip-description, .article-summary');
    if (descEl) descEl.textContent = tip.description || tip.summary || '';

    // Content - use htmlContent if available (has full HTML), otherwise fall back to content
    const contentEl = document.querySelector('.section-tips-content-body, .tip-content, .article-content, .content-body');
    if (contentEl) {
      if (tip.htmlContent) {
        contentEl.innerHTML = tip.htmlContent;
      } else if (tip.content) {
        contentEl.innerHTML = tip.content;
      }
    }

    // Benefits/Summary
    const summaryEls = document.querySelectorAll('.tip-benefit, .tip-summary li');
    if (Array.isArray(tip.summary) && summaryEls.length > 0) {
      tip.summary.forEach((point, index) => {
        if (summaryEls[index]) {
          summaryEls[index].textContent = point;
        }
      });
    }

    // Meta
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && tip.description) {
      metaDesc.setAttribute('content', tip.description);
    }

    if (tip.title) {
      document.title = tip.title + ' | Living Heritage';
    }

    return true;
  }

  /**
   * Populate heritage figure content
   */
  populateFigureContent(figure) {
    if (!figure) return false;

    // Name/Title
    const nameEl = document.querySelector('.figure-name, h1.article-title, .profile-name');
    if (nameEl) nameEl.textContent = figure.fullName || '';

    // Hero image
    const heroEl = document.querySelector('.figure-hero-image, .profile-hero, img.hero-image');
    if (heroEl && figure.heroImageUrl) {
      heroEl.src = figure.heroImageUrl;
      heroEl.alt = figure.fullName || 'Profile image';
    }

    // Position/Title
    const positionEl = document.querySelector('.figure-position, .profile-position, .title');
    if (positionEl) positionEl.textContent = figure.position || '';

    // Introduction
    const introEl = document.querySelector('.figure-introduction, .profile-intro, .introduction');
    if (introEl) introEl.textContent = figure.introduction || '';

    // Biography - use htmlBio if available (has full HTML), otherwise fall back to bio
    const bioEl = document.querySelector('.figure-bio, .profile-bio, .biography');
    if (bioEl) {
      if (figure.htmlBio) {
        bioEl.innerHTML = figure.htmlBio;
      } else if (figure.bio) {
        bioEl.innerHTML = typeof figure.bio === 'string' ? figure.bio : figure.bio.join('\n');
      }
    }

    // Meta
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && figure.introduction) {
      metaDesc.setAttribute('content', figure.introduction);
    }

    if (figure.fullName) {
      document.title = figure.fullName + ' | Living Heritage';
    }

    return true;
  }

  /**
   * Populate page content based on type
   */
  populateContent(data) {
    if (!data) return false;

    switch (this.contentType) {
      case 'tips':
        return this.populateTipContent(data);
      case 'figures':
        return this.populateFigureContent(data);
      case 'news':
      default:
        return this.populateNewsContent(data);
    }
  }

  /**
   * Initialize and load page
   */
  async init() {
    console.log(`Loading ${this.contentType} page (${this.language}): ${this.slug}`);

    const data = await this.fetchData();
    if (data) {
      const success = this.populateContent(data);
      if (success) {
        console.log('Content loaded successfully');
        document.body.classList.add('content-loaded');
      } else {
        console.warn('Content population returned false');
      }
    } else {
      console.error('Failed to fetch content from API');
      document.body.classList.add('content-load-failed');
    }
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  const loader = new DetailPageLoader();
  loader.init();
});
