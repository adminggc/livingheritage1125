/**
 * Living Heritage - Wellness Tips Detail Page Dynamic Loader
 * Loads wellness tips from API and renders dynamically
 * Include this script in tips detail pages: <script src="assets/js/tips-detail-loader.js"></script>
 */

class TipsDetailLoader {
  constructor() {
    this.tipsData = [];
    this.loadPromise = this.loadTips();
  }

  /**
   * Load wellness tips from API endpoint
   */
  async loadTips() {
    try {
      const response = await fetch('/api/tips');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      this.tipsData = data.wellnessTips || [];
      console.log(`Loaded ${this.tipsData.length} wellness tips from API`);
      return this.tipsData;
    } catch (error) {
      console.error('Error loading tips from API:', error);
      this.tipsData = [];
      return [];
    }
  }

  /**
   * Get tip by URL slug (from current page URL)
   */
  getTipByCurrentPage() {
    // Get the current filename from URL
    const urlPath = window.location.pathname;
    const filename = urlPath.split('/').pop();

    // Try to find tip with matching urlSlug
    const tip = this.tipsData.find(t =>
      t.urlSlug === filename ||
      t.urlSlug === filename.replace('.html', '') + '.html'
    );

    if (!tip) {
      console.warn(`Tip not found for URL: ${filename}`);
    }
    return tip;
  }

  /**
   * Render tips detail page content dynamically
   */
  renderDetailContent() {
    const tip = this.getTipByCurrentPage();
    if (!tip) {
      console.error('Could not find tip data for current page');
      return false;
    }

    // Update page meta tags
    this.updateMetaTags(tip);

    // Update hero section
    this.updateHeroSection(tip);

    // Update content
    this.updateContent(tip);

    console.log(`Loaded wellness tip: ${tip.title}`);
    return true;
  }

  /**
   * Update page meta tags
   */
  updateMetaTags(tip) {
    // Update title
    document.title = `${tip.title} | Living Heritage - Wellness Tips`;

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

    updateMetaTag('og:title', tip.title);
    updateMetaTag('og:description', tip.description || tip.title);
    updateMetaTag('og:image', tip.imageUrl || '');
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

    updateTwitterMetaTag('twitter:title', tip.title);
    updateTwitterMetaTag('twitter:description', tip.description || tip.title);
    updateTwitterMetaTag('twitter:image', tip.imageUrl || '');
  }

  /**
   * Update hero section
   */
  updateHeroSection(tip) {
    // Update hero section background - use heroImageUrl if available, fallback to imageUrl
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
      const heroImageUrl = tip.heroImageUrl || tip.imageUrl;
      if (heroImageUrl) {
        heroSection.style.backgroundImage = `url('${heroImageUrl}')`;
      }
    }

    // Update title
    const titleElements = document.querySelectorAll('.section-tips-content-title h2, h1');
    titleElements.forEach(el => {
      if (el.textContent.trim() !== '' && !el.classList.contains('section-title')) {
        el.textContent = tip.title;
      }
    });
  }

  /**
   * Update content area
   */
  updateContent(tip) {
    // Update title
    const titleEl = document.querySelector('.section-tips-content-title h2');
    if (titleEl) {
      titleEl.textContent = tip.title;
    }

    // Update article content
    const contentBody = document.querySelector('.section-tips-content-body');
    if (contentBody && tip.content) {
      contentBody.innerHTML = tip.content;
    }

    // Update featured image
    const tipsImage = document.querySelector('.tips-centered-image');
    if (tipsImage && tip.imageUrl) {
      tipsImage.src = tip.imageUrl;
      tipsImage.alt = tip.altText || tip.title;
    }

    // Update hero background image - use heroImageUrl if available, fallback to imageUrl
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
      const heroImageUrl = tip.heroImageUrl || tip.imageUrl;
      if (heroImageUrl) {
        heroSection.style.backgroundImage = `url('${heroImageUrl}')`;
      }
    }
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
 * Initialize tips detail page loader when DOM is ready
 */
document.addEventListener('DOMContentLoaded', async () => {
  const loader = new TipsDetailLoader();
  await loader.loadPromise;
  loader.renderDetailContent();
  console.log('Tips detail page loader initialized');
});
