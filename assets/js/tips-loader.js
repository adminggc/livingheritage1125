/**
 * Living Heritage - Wellness Tips Loader
 * Loads wellness tips from /api/tips endpoint
 * Used by wellness tips page to display articles
 */

class TipsLoader {
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
   * Get all tips
   */
  getAllTips() {
    return this.tipsData;
  }

  /**
   * Get published tips only
   */
  getPublishedTips() {
    return this.tipsData.filter(tip => tip.published);
  }

  /**
   * Get tip by ID
   */
  getTipById(id) {
    return this.tipsData.find(tip => tip.id === id);
  }

  /**
   * Get tip by URL slug
   */
  getTipBySlug(slug) {
    return this.tipsData.find(tip => tip.urlSlug === slug);
  }

  /**
   * Create tip card HTML (for grid layout)
   */
  createTipCard(tip) {
    return `
      <div class="col-lg-3 col-md-6 col-sm-6 col-12">
        <div class="tip-card-wrapper">
          <a href="${tip.urlSlug}" class="tip-card">
            <div class="tip-card-image">
              <img src="${tip.imageUrl}?v=1"
                   alt="${tip.altText || tip.title}"
                   loading="lazy"
                   onerror="this.src='assets/media/shared/tips/default.jpg'">
            </div>
            <div class="tip-card-content">
              <h3>${tip.title}</h3>
            </div>
          </a>
        </div>
      </div>
    `;
  }

  /**
   * Populate carousel with tips (2 items per slide)
   */
  populateCarousel(carouselId, tips = null) {
    const carousel = document.getElementById(carouselId);
    if (!carousel) {
      console.warn(`Carousel not found: ${carouselId}`);
      return false;
    }

    const tipsToShow = tips || this.getPublishedTips();
    if (tipsToShow.length === 0) {
      console.warn(`No tips to populate carousel: ${carouselId}`);
      return false;
    }

    const carouselInner = carousel.querySelector('.multi-carousel-inner');
    if (!carouselInner) {
      console.warn(`Carousel inner not found in: ${carouselId}`);
      return false;
    }

    // Clear existing items
    carouselInner.innerHTML = '';

    // Group tips into pairs (2 items per carousel slide)
    for (let i = 0; i < tipsToShow.length; i += 2) {
      const slideDiv = document.createElement('div');
      slideDiv.className = 'multi-carousel-item';
      slideDiv.setAttribute('data-index', Math.floor(i / 2));

      // Add first tip
      slideDiv.innerHTML += this.createTipCard(tipsToShow[i]);

      // Add second tip if it exists
      if (i + 1 < tipsToShow.length) {
        slideDiv.innerHTML += this.createTipCard(tipsToShow[i + 1]);
      }

      carouselInner.appendChild(slideDiv);
    }

    console.log(`Populated carousel ${carouselId} with ${tipsToShow.length} tips in ${Math.ceil(tipsToShow.length / 2)} slides`);
    return true;
  }

  /**
   * Create tip grid HTML
   */
  createTipGrid(containerId, tips = null) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`Container not found: ${containerId}`);
      return false;
    }

    const tipsToShow = tips || this.getPublishedTips();
    if (tipsToShow.length === 0) {
      console.warn(`No tips to display in: ${containerId}`);
      return false;
    }

    // Clear existing content
    container.innerHTML = '';

    // Add tip cards with grid columns
    tipsToShow.forEach(tip => {
      const card = document.createElement('div');
      card.innerHTML = this.createTipCard(tip);
      container.appendChild(card.firstElementChild);
    });

    console.log(`Populated ${containerId} with ${tipsToShow.length} tips`);
    return true;
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
   * Search tips
   */
  searchTips(query) {
    const searchTerm = query.toLowerCase();
    return this.tipsData.filter(tip =>
      tip.title.toLowerCase().includes(searchTerm)
    );
  }
}

/**
 * Global tips loader instance
 * Wait for it to load before using: await window.tipsLoader.loadPromise
 */
let tipsLoader;
document.addEventListener('DOMContentLoaded', async () => {
  tipsLoader = new TipsLoader();
  await tipsLoader.loadPromise;

  // Auto-populate grid if it exists
  tipsLoader.createTipGrid('tipsGridContainer');

  console.log('Tips Loader initialized with', tipsLoader.tipsData.length, 'tips');
});
