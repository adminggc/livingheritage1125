/**
 * Living Heritage - Heritage Figures Loader
 * Loads heritage figures (people) from /api/figures endpoint
 * Used by heritage figures page to display profiles and categories
 */

class FiguresLoader {
  constructor() {
    this.figuresData = [];
    this.categoriesData = [];
    this.loadPromise = this.loadFigures();
  }

  /**
   * Load heritage figures from API endpoint
   */
  async loadFigures() {
    try {
      const response = await fetch('/api/figures');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      this.figuresData = data.heritageFigures || [];
      this.categoriesData = data.heritageCategories || [];
      console.log(`Loaded ${this.figuresData.length} heritage figures and ${this.categoriesData.length} categories from API`);
      return { figures: this.figuresData, categories: this.categoriesData };
    } catch (error) {
      console.error('Error loading figures from API:', error);
      this.figuresData = [];
      this.categoriesData = [];
      return { figures: [], categories: [] };
    }
  }

  /**
   * Get all figures
   */
  getAllFigures() {
    return this.figuresData;
  }

  /**
   * Get published figures only (sorted by displayOrder or creation date if displayOrder not available)
   */
  getPublishedFigures() {
    return this.figuresData
      .filter(figure => figure.published)
      .sort((a, b) => {
        // If figures have displayOrder, use it
        if (a.displayOrder !== undefined && b.displayOrder !== undefined) {
          return a.displayOrder - b.displayOrder;
        }
        // Otherwise, sort by creation date (newest first)
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }

  /**
   * Get all categories (sorted by displayOrder or alphabetically for strings)
   */
  getAllCategories() {
    // If categories are strings, return them as-is (already sorted by database query)
    if (this.categoriesData.length > 0 && typeof this.categoriesData[0] === 'string') {
      return this.categoriesData;
    }
    // If categories are objects, sort by displayOrder
    return this.categoriesData.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  /**
   * Get figure by ID
   */
  getFigureById(id) {
    return this.figuresData.find(figure => figure.id === id);
  }

  /**
   * Get figure by URL slug
   */
  getFigureBySlug(slug) {
    return this.figuresData.find(figure => figure.urlSlug === slug);
  }

  /**
   * Create figure card HTML
   */
  createFigureCard(figure) {
    return `
      <div class="col-lg-3 col-md-6 col-sm-6 col-12 mb-4">
        <div class="figure-card" data-id="${figure.id}">
          <a href="${figure.urlSlug}">
            <div class="figure-card-image">
              <img src="${figure.imageUrl}"
                   alt="${figure.altText || figure.fullName}"
                   class="figure-img"
                   loading="lazy"
                   onerror="this.src='assets/media/shared/people/default-person.jpg'">
            </div>
            <div class="figure-card-content">
              <h3 class="figure-name">${figure.fullName}</h3>
              <p class="figure-title">${figure.title}</p>
            </div>
          </a>
        </div>
      </div>
    `;
  }

  /**
   * Create carousel item HTML for figure
   */
  createFigureCarouselItem(figure) {
    return `
      <div class="multi-carousel-item" data-id="${figure.id}">
        <div class="figure-carousel-card">
          <a href="${figure.urlSlug}">
            <div class="figure-carousel-image">
              <img src="${figure.smallImageUrl || figure.imageUrl}"
                   alt="${figure.altText || figure.fullName}"
                   class="figure-carousel-img"
                   loading="lazy"
                   onerror="this.src='assets/media/shared/people/default-person.jpg'">
            </div>
            <div class="figure-carousel-content">
              <h3>${figure.fullName}</h3>
              <p>${figure.title}</p>
            </div>
          </a>
        </div>
      </div>
    `;
  }

  /**
   * Populate figure grid
   */
  populateGrid(containerId, figures = null) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`Container not found: ${containerId}`);
      return false;
    }

    const figuresToShow = figures || this.getPublishedFigures();
    if (figuresToShow.length === 0) {
      console.warn(`No figures to display in: ${containerId}`);
      return false;
    }

    // Clear existing content
    container.innerHTML = '';

    // Add figure cards
    figuresToShow.forEach(figure => {
      const card = document.createElement('div');
      card.innerHTML = this.createFigureCard(figure);
      container.appendChild(card.firstElementChild);
    });

    console.log(`Populated ${containerId} with ${figuresToShow.length} figures`);
    return true;
  }

  /**
   * Populate carousel with figures
   */
  populateCarousel(carouselId, figures = null) {
    const carousel = document.getElementById(carouselId);
    if (!carousel) {
      console.warn(`Carousel not found: ${carouselId}`);
      return false;
    }

    const figuresToShow = figures || this.getPublishedFigures();
    if (figuresToShow.length === 0) {
      console.warn(`No figures to populate carousel: ${carouselId}`);
      return false;
    }

    const carouselInner = carousel.querySelector('.multi-carousel-inner');
    if (!carouselInner) {
      console.warn(`Carousel inner not found in: ${carouselId}`);
      return false;
    }

    // Clear existing items
    carouselInner.innerHTML = '';

    // Add figure carousel items
    figuresToShow.forEach(figure => {
      carouselInner.innerHTML += this.createFigureCarouselItem(figure);
    });

    console.log(`Populated carousel ${carouselId} with ${figuresToShow.length} figures`);
    return true;
  }

  /**
   * Populate categories
   */
  populateCategories(containerId, categories = null) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`Container not found: ${containerId}`);
      return false;
    }

    const categoriesToShow = categories || this.getAllCategories();
    // Filter out empty categories
    const validCategories = categoriesToShow.filter(cat => {
      // Handle string categories (from API)
      if (typeof cat === 'string') {
        return cat && cat.trim().length > 0;
      }
      // Handle object categories
      return cat && cat.label;
    });

    if (validCategories.length === 0) {
      console.warn(`No valid categories to display in: ${containerId}`);
      return false;
    }

    // Clear existing content
    container.innerHTML = '';

    // Add category items
    validCategories.forEach(category => {
      // Handle both string categories (from API) and object categories
      const categoryLabel = typeof category === 'string' ? category : category.label;
      const categoryUrl = typeof category === 'string' ? '#' : (category.urlSlug || '#');
      const categoryImage = typeof category === 'string' ? 'assets/media/shared/default-category.jpg' : (category.imageUrl || 'assets/media/shared/default-category.jpg');

      const card = document.createElement('div');
      card.className = 'category-card';
      card.innerHTML = `
        <a href="${categoryUrl}">
          <div class="category-card-image">
            <img src="${categoryImage}"
                 alt="${categoryLabel}"
                 loading="lazy"
                 onerror="this.src='assets/media/shared/default-category.jpg'">
          </div>
          <div class="category-card-content">
            <h3>${categoryLabel}</h3>
          </div>
        </a>
      `;
      container.appendChild(card);
    });

    console.log(`Populated ${containerId} with ${validCategories.length} categories`);
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
   * Search figures
   */
  searchFigures(query) {
    const searchTerm = query.toLowerCase();
    return this.figuresData.filter(figure =>
      figure.fullName.toLowerCase().includes(searchTerm) ||
      figure.title.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Render heritage figure detail page content
   */
  renderDetailPage(figure) {
    if (!figure) {
      return '<div class="alert alert-danger">Figure not found</div>';
    }

    let html = '';

    // Hero Section
    html += `
      <section class="profile-banner">
        <div class="container">
          <h2 class="section-title">NHÂN VẬT & DI SẢN</h2>
          <section class="hero-section">
            <img class="hero-media" src="${figure.heroImageUrl || figure.imageUrl}" alt="${figure.fullName}">
            <div class="hero-text-wrapper">
              <p class="hero-category">${figure.category || ''}</p>
              <h1 class="hero-title">${figure.fullName}</h1>
            </div>
          </section>
        </div>
      </section>
    `;

    // Profile Content Section
    html += '<section class="profile-content-section"><div class="container"><div class="row">';

    // Main Content (Col-lg-8)
    html += '<div class="col-lg-8">';

    // Profile Header with Letter
    html += `
      <div class="profile-header">
        <h2 class="profile-title">${figure.headerLetter || ''}</h2>
        <div class="profile-summary">
    `;

    // Summary paragraphs
    if (figure.summary && Array.isArray(figure.summary)) {
      figure.summary.forEach(paragraph => {
        html += `<p>${paragraph}</p>`;
      });
    }

    html += '</div></div>';

    // Profile Content Body with Introduction and Sections
    html += '<div class="profile-content-body">';

    // Introduction
    if (figure.introduction) {
      html += `<p>${figure.introduction}</p>`;
    }

    // Sections
    if (figure.sections && Array.isArray(figure.sections)) {
      figure.sections.forEach(section => {
        html += `<p><strong>${section.title}</strong></p>`;

        if (section.type === 'list' && section.items) {
          html += '<ul>';
          section.items.forEach(item => {
            html += `<li>${item}</li>`;
          });
          html += '</ul>';
        } else if (section.type === 'text' && section.content) {
          html += `<p>${section.content}</p>`;
        }
      });
    }

    html += '</div>'; // End profile-content-body
    html += '</div>'; // End col-lg-8

    // Sidebar (Col-lg-4)
    html += '<div class="col-lg-4">';

    // Quote Section
    if (figure.quote) {
      html += `
        <div class="profile-content-section-quote">
          <p class="quote-title">TRÍCH DẪN</p>
          <p>${figure.quote}</p>
        </div>
        <div class="line"></div>
      `;
    }

    // Highlights/Q&A Section
    if (figure.highlights && Array.isArray(figure.highlights) && figure.highlights.length > 0) {
      figure.highlights.forEach(highlight => {
        html += `
          <div class="content-highlight">
            <p class="highlight-title">${highlight.question}</p>
            <div class="highlight-detail">
        `;

        if (Array.isArray(highlight.answer)) {
          highlight.answer.forEach(paragraph => {
            html += `<p>${paragraph}</p>`;
          });
        } else if (highlight.answer) {
          html += `<p>${highlight.answer}</p>`;
        }

        html += '</div></div>';
      });
    }

    html += '</div>'; // End col-lg-4
    html += '</div></div></section>'; // End row and profile-content-section

    return html;
  }

  /**
   * Populate detail page for a heritage figure
   */
  populateDetailPage(containerId, figureSlug) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`Container not found: ${containerId}`);
      return false;
    }

    const figure = this.getFigureBySlug(figureSlug);
    if (!figure) {
      console.warn(`Figure not found: ${figureSlug}`);
      container.innerHTML = '<div class="alert alert-danger">Nhân vật không tìm thấy</div>';
      return false;
    }

    const detailHtml = this.renderDetailPage(figure);
    container.innerHTML = detailHtml;

    console.log(`Populated detail page for: ${figure.fullName}`);
    return true;
  }

  /**
   * Get related figures (same category or others)
   */
  getRelatedFigures(figureId, limit = 3) {
    const figure = this.getFigureById(figureId);
    if (!figure) return [];

    // Get figures from same category, excluding current figure
    const related = this.figuresData.filter(f =>
      f.id !== figureId &&
      f.published &&
      f.category === figure.category
    ).slice(0, limit);

    // If not enough, add others from different categories
    if (related.length < limit) {
      const others = this.figuresData.filter(f =>
        f.id !== figureId &&
        f.published &&
        !related.some(r => r.id === f.id)
      ).slice(0, limit - related.length);
      related.push(...others);
    }

    return related;
  }
}

/**
 * Global figures loader instance
 * Wait for it to load before using: await window.figuresLoader.loadPromise
 */
let figuresLoader;
document.addEventListener('DOMContentLoaded', async () => {
  figuresLoader = new FiguresLoader();
  await figuresLoader.loadPromise;

  // Auto-populate grids and carousels if they exist
  figuresLoader.populateGrid('figuresContainer');
  figuresLoader.populateCarousel('figuresMultiCarousel');
  figuresLoader.populateCategories('categoriesContainer');

  // Initialize figures carousel after content is loaded
  if (typeof createCarousel === 'function') {
    setTimeout(() => {
      createCarousel({
        carouselId: "figuresMultiCarousel",
        innerCarouselId: "figuresCarouselInner",
        prevBtnId: "figuresPrevBtn",
        nextBtnId: "figuresNextBtn",
        mobileItems: 1,
        desktopItems: 4,
        mobileSlideBy: 1,
        desktopSlideBy: 4
      });
      console.log('Figures carousel initialized');
    }, 100);
  }

  console.log('Figures Loader initialized with', figuresLoader.figuresData.length, 'figures');
});
