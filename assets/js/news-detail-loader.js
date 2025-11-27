/**
 * Living Heritage - News Detail Page Dynamic Loader
 * Loads news articles from API and renders dynamically
 * Include this script in news detail pages: <script src="assets/js/news-detail-loader.js"></script>
 */

class NewsDetailLoader {
  constructor() {
    this.newsData = [];
    this.loadPromise = this.loadNews();
  }

  /**
   * Load news from API endpoint
   */
  async loadNews() {
    try {
      const response = await fetch('/api/news');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      this.newsData = data.news || [];
      console.log(`Loaded ${this.newsData.length} news articles from API`);
      return this.newsData;
    } catch (error) {
      console.error('Error loading news from API:', error);
      this.newsData = [];
      return [];
    }
  }

  /**
   * Get article by URL slug (from current page URL)
   */
  getArticleByCurrentPage() {
    // Get the current filename from URL
    const urlPath = window.location.pathname;
    const filename = urlPath.split('/').pop();
    const slug = filename.replace('.html', '');

    // Try to find article with matching slug
    const article = this.newsData.find(a =>
      a.slug === slug ||
      a.slug === filename.replace('.html', '')
    );

    if (!article) {
      console.warn(`Article not found for URL: ${filename}`);
    }
    return article;
  }

  /**
   * Render news detail page content dynamically
   */
  renderDetailContent() {
    const article = this.getArticleByCurrentPage();
    if (!article) {
      console.error('Could not find article data for current page');
      return false;
    }

    // Update page meta tags
    this.updateMetaTags(article);

    // Update hero section
    this.updateHeroSection(article);

    // Update content
    this.updateContent(article);

    console.log(`Loaded news article: ${article.title}`);
    return true;
  }

  /**
   * Update page meta tags
   */
  updateMetaTags(article) {
    // Update title
    document.title = `${article.title} | Living Heritage`;

    // Update OG tags
    const updateMetaTag = (property, content) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.content = content;
    };

    updateMetaTag('og:title', article.title);
    updateMetaTag('og:description', article.description || '');
    updateMetaTag('og:image', article.featured_image || '');
    updateMetaTag('og:type', 'article');

    // Update Twitter tags
    const updateTwitterMetaTag = (name, content) => {
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', name);
        document.head.appendChild(tag);
      }
      tag.content = content;
    };

    updateTwitterMetaTag('twitter:title', article.title);
    updateTwitterMetaTag('twitter:description', article.description || '');
    updateTwitterMetaTag('twitter:image', article.featured_image || '');
  }

  /**
   * Update hero section
   */
  updateHeroSection(article) {
    // Update hero section background
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
      if (article.featured_image) {
        heroSection.style.backgroundImage = `url('${article.featured_image}')`;
      }
    }

    // Update hero title
    const titleElements = document.querySelectorAll('h1, .section-news-content-title h2');
    titleElements.forEach(el => {
      el.textContent = article.title;
    });
  }

  /**
   * Update content area
   */
  updateContent(article) {
    // Update title
    const titleEl = document.querySelector('.section-news-content-title h2');
    if (titleEl) {
      titleEl.textContent = article.title;
    }

    // Update article content
    const contentBody = document.querySelector('.section-news-content-body');
    if (contentBody && article.content) {
      contentBody.innerHTML = article.content;
    }

    // Update article metadata
    const metaElements = document.querySelectorAll('[data-article-author], [data-article-date], [data-article-category]');
    metaElements.forEach(el => {
      if (el.hasAttribute('data-article-author')) {
        el.textContent = article.author || 'Living Heritage';
      }
      if (el.hasAttribute('data-article-date')) {
        el.textContent = this.formatDate(article.date);
      }
      if (el.hasAttribute('data-article-category')) {
        el.textContent = article.category || 'News';
      }
    });

    // Update featured image
    const featuredImages = document.querySelectorAll('[data-article-image]');
    featuredImages.forEach(img => {
      img.src = article.featured_image;
      img.alt = article.title;
    });
  }

  /**
   * Format date for display
   */
  formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('vi-VN', options);
  }
}

/**
 * Initialize news detail page loader when DOM is ready
 */
document.addEventListener('DOMContentLoaded', async () => {
  const loader = new NewsDetailLoader();
  await loader.loadPromise;
  loader.renderDetailContent();
  console.log('News detail page loader initialized');
});
