/**
 * Living Heritage - Detail Page Dynamic Loader
 * Loads heritage figure content from API and renders dynamically
 * Include this script in detail pages: <script src="assets/js/detail-page-loader.js"></script>
 */

class DetailPageLoader {
  constructor() {
    this.figuresData = [];
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
      console.log(`Loaded ${this.figuresData.length} heritage figures from API`);
      return this.figuresData;
    } catch (error) {
      console.error('Error loading figures from API:', error);
      this.figuresData = [];
      return [];
    }
  }

  /**
   * Get figure by URL slug (from current page URL)
   */
  getFigureByCurrentPage() {
    // Get the current filename from URL
    const urlPath = window.location.pathname;
    const filename = urlPath.split('/').pop();

    // Try to find figure with matching urlSlug
    const figure = this.figuresData.find(f =>
      f.urlSlug === filename ||
      f.urlSlug === filename.replace('.html', '') + '.html'
    );

    if (!figure) {
      console.warn(`Figure not found for URL: ${filename}`);
    }
    return figure;
  }

  /**
   * Render detail page content dynamically
   */
  renderDetailContent() {
    const figure = this.getFigureByCurrentPage();
    if (!figure) {
      console.error('Could not find figure data for current page');
      return false;
    }

    // Update page meta tags
    this.updateMetaTags(figure);

    // Update hero section
    this.updateHeroSection(figure);

    // Update main content
    this.updateMainContent(figure);

    // Update sidebar
    this.updateSidebar(figure);

    console.log(`Loaded detail page content for: ${figure.fullName}`);
    return true;
  }

  /**
   * Update page meta tags
   */
  updateMetaTags(figure) {
    // Update title
    document.title = `${figure.fullName} — ${figure.title}`;

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

    updateMetaTag('og:title', `${figure.fullName} — ${figure.title}`);
    updateMetaTag('og:description', figure.introduction || '');
    updateMetaTag('og:image', figure.heroImageUrl || figure.imageUrl || '');
  }

  /**
   * Update hero section
   */
  updateHeroSection(figure) {
    const heroSection = document.querySelector('.hero-section');
    if (!heroSection) return;

    const heroMedia = heroSection.querySelector('.hero-media');
    if (heroMedia) {
      heroMedia.src = figure.heroImageUrl || figure.imageUrl;
      heroMedia.alt = figure.fullName;
    }

    const heroCategory = heroSection.querySelector('.hero-category');
    if (heroCategory) {
      heroCategory.textContent = figure.category || '';
    }

    const heroTitle = heroSection.querySelector('.hero-title');
    if (heroTitle) {
      heroTitle.textContent = figure.fullName;
    }
  }

  /**
   * Update main content area
   */
  updateMainContent(figure) {
    const profileHeader = document.querySelector('.profile-header');
    if (profileHeader) {
      const titleEl = profileHeader.querySelector('.profile-title');
      if (titleEl) {
        titleEl.textContent = figure.headerLetter || '';
      }

      const summaryEl = profileHeader.querySelector('.profile-summary');
      if (summaryEl) {
        summaryEl.innerHTML = '';
        if (figure.summary && Array.isArray(figure.summary)) {
          figure.summary.forEach(paragraph => {
            const p = document.createElement('p');
            p.textContent = paragraph;
            summaryEl.appendChild(p);
          });
        }
      }
    }

    const contentBody = document.querySelector('.profile-content-body');
    if (contentBody) {
      contentBody.innerHTML = '';

      // Introduction
      if (figure.introduction) {
        const p = document.createElement('p');
        p.textContent = figure.introduction;
        contentBody.appendChild(p);
      }

      // Sections
      if (figure.sections && Array.isArray(figure.sections)) {
        figure.sections.forEach(section => {
          const titleEl = document.createElement('p');
          titleEl.innerHTML = `<strong>${section.title}</strong>`;
          contentBody.appendChild(titleEl);

          if (section.type === 'list' && section.items) {
            const ul = document.createElement('ul');
            section.items.forEach(item => {
              const li = document.createElement('li');
              li.textContent = item;
              ul.appendChild(li);
            });
            contentBody.appendChild(ul);
          } else if (section.type === 'text' && section.content) {
            const p = document.createElement('p');
            p.textContent = section.content;
            contentBody.appendChild(p);
          }
        });
      }
    }
  }

  /**
   * Update sidebar content
   */
  updateSidebar(figure) {
    const sidebar = document.querySelector('.col-lg-4');
    if (!sidebar) return;

    // Clear existing content (except the first few elements if needed)
    const highlights = sidebar.querySelectorAll('.content-highlight, .profile-content-section-quote');
    highlights.forEach(el => el.remove());

    let insertPoint = sidebar.querySelector('.line');
    if (!insertPoint) {
      insertPoint = sidebar.firstChild;
    }

    // Add quote section
    if (figure.quote) {
      const quoteDiv = document.createElement('div');
      quoteDiv.className = 'profile-content-section-quote';
      quoteDiv.innerHTML = `
        <p class="quote-title">TRÍCH DẪN</p>
        <p>${figure.quote}</p>
      `;
      sidebar.insertBefore(quoteDiv, insertPoint);

      const lineDiv = document.createElement('div');
      lineDiv.className = 'line';
      sidebar.insertBefore(lineDiv, quoteDiv.nextSibling);
      insertPoint = lineDiv.nextSibling;
    }

    // Add highlights/Q&A
    if (figure.highlights && Array.isArray(figure.highlights)) {
      figure.highlights.forEach(highlight => {
        const highlightDiv = document.createElement('div');
        highlightDiv.className = 'content-highlight';

        let answerHtml = '';
        if (Array.isArray(highlight.answer)) {
          answerHtml = highlight.answer.map(para => `<p>${para}</p>`).join('');
        } else if (highlight.answer) {
          answerHtml = `<p>${highlight.answer}</p>`;
        }

        highlightDiv.innerHTML = `
          <p class="highlight-title">${highlight.question}</p>
          <div class="highlight-detail">
            ${answerHtml}
          </div>
        `;

        sidebar.insertBefore(highlightDiv, insertPoint);
      });
    }
  }
}

/**
 * Initialize detail page loader when DOM is ready
 */
document.addEventListener('DOMContentLoaded', async () => {
  const loader = new DetailPageLoader();
  await loader.loadPromise;
  loader.renderDetailContent();
  console.log('Detail page loader initialized');
});
