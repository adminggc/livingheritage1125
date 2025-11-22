/**
 * Living Heritage - News Loader
 * Loads news articles from /api/news endpoint
 * Used by homepage carousel and news pages
 */

class NewsLoader {
  constructor() {
    this.newsData = [];
    this.loadPromise = this.loadNews();
  }

  /**
   * Load news articles from API endpoint
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
   * Get all news articles
   */
  getAllNews() {
    return this.newsData;
  }

  /**
   * Get published news only (sorted by date, newest first)
   */
  getPublishedNews() {
    return this.newsData
      .filter(article => article.published)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  /**
   * Get article by ID
   */
  getArticleById(id) {
    return this.newsData.find(article => article.id === id);
  }

  /**
   * Get article by slug
   */
  getArticleBySlug(slug) {
    return this.newsData.find(article => article.slug === slug);
  }

  /**
   * Get articles by category
   */
  getArticlesByCategory(category) {
    return this.newsData.filter(article => article.category === category && article.published);
  }

  /**
   * Get recent articles (latest X articles)
   */
  getRecentArticles(limit = 10) {
    return this.getPublishedNews()
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);
  }

  /**
   * Create article card HTML
   */
  createArticleCard(article) {
    const imageUrl = article.featured_image || 'assets/media/shared/news/default.jpg';
    return `
      <div class="multi-carousel-item" data-id="${article.id}">
        <div class="media-card">
          <a href="${article.slug}.html">
            <img src="${imageUrl}?v=1"
                 alt="${article.title}"
                 class="media-img"
                 onerror="this.src='assets/media/shared/news/default.jpg'">
            <div class="media-content">
              <h3>${article.title}</h3>
            </div>
          </a>
        </div>
      </div>
    `;
  }

  /**
   * Create article bottom card HTML (for related articles section)
   */
  createBottomCard(article) {
    const imageUrl = article.featured_image || 'assets/media/shared/news/default.jpg';
    return `
      <div class="multi-carousel-item">
        <div class="news-bottom-card">
          <a href="${article.slug}.html">
            <img src="${imageUrl}?v=1"
                 alt="${article.title}"
                 class="news-bottom-image img-fluid"
                 onerror="this.src='assets/media/shared/news/default.jpg'">
            <div class="news-bottom-content">
              <h3 class="news-bottom-title">${article.title}</h3>
            </div>
          </a>
        </div>
      </div>
    `;
  }

  /**
   * Populate carousel with news articles
   */
  populateCarousel(carouselId, articles = null) {
    const carousel = document.getElementById(carouselId);
    if (!carousel) return false;

    const articlesToShow = articles || this.getPublishedNews();
    if (articlesToShow.length === 0) {
      console.warn(`No articles to populate carousel: ${carouselId}`);
      return false;
    }

    const carouselInner = carousel.querySelector('.multi-carousel-inner');
    if (!carouselInner) return false;

    // Clear existing items
    carouselInner.innerHTML = '';

    // Add article cards
    articlesToShow.forEach(article => {
      carouselInner.innerHTML += this.createArticleCard(article);
    });

    console.log(`Populated carousel ${carouselId} with ${articlesToShow.length} articles`);
    return true;
  }

  /**
   * Populate bottom carousel with related articles
   */
  populateBottomCarousel(carouselId, currentArticleId = null, articles = null) {
    const carousel = document.getElementById(carouselId);
    if (!carousel) return false;

    const articlesToShow = articles || this.getPublishedNews();
    if (articlesToShow.length === 0) return false;

    const carouselInner = carousel.querySelector('.multi-carousel-inner');
    if (!carouselInner) return false;

    // Clear existing items
    carouselInner.innerHTML = '';

    // Filter out current article
    let itemsToShow = articlesToShow;
    if (currentArticleId) {
      itemsToShow = articlesToShow.filter(a => a.id !== currentArticleId);
    }

    // Add article cards
    itemsToShow.forEach(article => {
      carouselInner.innerHTML += this.createBottomCard(article);
    });

    console.log(`Populated bottom carousel ${carouselId} with ${itemsToShow.length} articles`);
    return true;
  }

  /**
   * Render full article page
   */
  renderArticlePage(article) {
    if (!article) return null;

    const imageUrl = article.featured_image || 'assets/media/shared/news/default.jpg';

    const headerSection = `
      <section class="news-header-section">
        <div class="container">
          <h2 class="section-title">TIN TỨC</h2>
        </div>
      </section>
    `;

    const mainSection = `
      <section class="news-main-section">
        <div class="container">
          <div class="news-main-image-wrapper">
            <img src="${imageUrl}?v=1"
                 alt="${article.title}"
                 class="news-main-image img-fluid banner-image"
                 onerror="this.src='assets/media/shared/news/default.jpg'">
          </div>
          <h2 class="news-main-title">${article.title}</h2>
          <div class="news-text-columns">
            <div class="news-text">
              ${article.content.split('\n\n').map(para => {
                // Convert section headers (bold text) to proper formatting
                if (para.startsWith('**') || para.includes('**')) {
                  return `<p><strong>${para.replace(/\*\*/g, '')}</strong></p>`;
                }
                return `<p>${para}</p>`;
              }).join('')}
            </div>
          </div>
        </div>
      </section>
    `;

    return { headerSection, mainSection };
  }

  /**
   * Get article metadata for SEO
   */
  getArticleMetadata(article) {
    return {
      title: `${article.title} | Living Heritage`,
      description: article.description,
      keywords: article.keywords,
      ogTitle: article.title,
      ogDescription: article.description,
      ogImage: article.featured_image,
      ogUrl: `https://livingheritage.vn/${article.slug}.html`,
      canonical: `https://livingheritage.vn/${article.slug}.html`,
      publishedTime: article.publishedTime,
      author: article.author
    };
  }

  /**
   * Format date for display
   */
  formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('vi-VN', options);
  }

  /**
   * Create a news list HTML
   */
  createNewsList(articles = null) {
    const articlesToShow = articles || this.getPublishedNews();

    return articlesToShow.map(article => {
      const imageUrl = article.featured_image || 'assets/media/shared/news/default.jpg';
      return `
      <article class="news-list-item">
        <div class="news-item-image">
          <img src="${imageUrl}?v=1"
               alt="${article.title}"
               onerror="this.src='assets/media/shared/news/default.jpg'">
        </div>
        <div class="news-item-content">
          <h3><a href="${article.slug}.html">${article.title}</a></h3>
          <p class="news-item-meta">
            <span class="news-item-date">${this.formatDate(article.date)}</span>
            ${article.category ? `<span class="news-item-category">${article.category}</span>` : ''}
            ${article.author ? `<span class="news-item-author">By ${article.author}</span>` : ''}
          </p>
          <p class="news-item-description">${article.description}</p>
          <a href="${article.slug}.html" class="news-item-link">Read more →</a>
        </div>
      </article>
      `;
    }).join('');
  }

  /**
   * Search articles
   */
  searchArticles(query) {
    const searchTerm = query.toLowerCase();
    return this.newsData.filter(article =>
      article.title.toLowerCase().includes(searchTerm) ||
      article.description.toLowerCase().includes(searchTerm) ||
      article.content.toLowerCase().includes(searchTerm) ||
      (article.keywords && article.keywords.toLowerCase().includes(searchTerm))
    );
  }
}

/**
 * Global news loader instance
 * Wait for it to load before using: await window.newsLoader.loadPromise
 */
let newsLoader;
document.addEventListener('DOMContentLoaded', async () => {
  newsLoader = new NewsLoader();
  await newsLoader.loadPromise;

  // Auto-populate carousels if they exist
  newsLoader.populateCarousel('newsMultiCarousel');
  newsLoader.populateBottomCarousel('newsBottomMultiCarousel');

  // Initialize news carousel after content is loaded
  // This must happen after populateCarousel to ensure items are in the DOM
  if (typeof createCarousel === 'function') {
    setTimeout(() => {
      createCarousel({
        carouselId: "newsMultiCarousel",
        innerCarouselId: "newsCarouselInner",
        prevBtnId: "newsPrevBtn",
        nextBtnId: "newsNextBtn",
        mobileItems: 1,
        desktopItems: 3,
        mobileSlideBy: 1,
        desktopSlideBy: 2
      });
      console.log('News carousel initialized');
    }, 100); // Small delay to ensure DOM is updated
  }

  console.log('News Loader initialized with', newsLoader.newsData.length, 'articles');
});
