/**
 * Living Heritage - English Heritage Figures Detail Page Loader
 * Dynamically loads English heritage figures from /api/figures-en endpoint
 * and populates the page content based on URL slug matching
 */

class EnglishDetailPageLoader {
  constructor() {
    this.apiEndpoint = '/api/figures-en';
    this.currentPage = this.getCurrentPageSlug();
    this.initialize();
  }

  getCurrentPageSlug() {
    // Get the filename without extension
    const pathname = window.location.pathname;
    const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
    const slug = filename.replace('.html', '');
    return slug;
  }

  async initialize() {
    try {
      const figures = await this.loadFigures();
      if (figures.length === 0) {
        console.warn('No English heritage figures loaded');
        return;
      }

      const figure = this.getFigureByCurrentPage(figures);
      if (figure) {
        this.renderDetailContent(figure);
      } else {
        console.warn(`No English figure found for slug: ${this.currentPage}`);
      }
    } catch (error) {
      console.error('Error loading English heritage figure detail page:', error);
    }
  }

  async loadFigures() {
    try {
      const response = await fetch(this.apiEndpoint);
      if (!response.ok) {
        throw new Error('Failed to load English figures from API');
      }
      const data = await response.json();
      return data.heritageFigures || [];
    } catch (error) {
      console.error('Error loading English figures:', error);
      return [];
    }
  }

  getFigureByCurrentPage(figures) {
    return figures.find(figure => {
      // Match by urlSlug or generated slug from fullName
      const figureSlug = figure.urlSlug ? figure.urlSlug.replace('.html', '') : this.generateSlug(figure.fullName);
      return figureSlug === this.currentPage;
    });
  }

  generateSlug(text) {
    if (!text) return '';
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  ensureAbsolutePath(path) {
    if (!path) return path;
    // If path starts with / or http, it's already absolute
    if (path.startsWith('/') || path.startsWith('http')) {
      return path;
    }
    // Convert relative paths to absolute (e.g., assets/... to /assets/...)
    return '/' + path;
  }

  renderDetailContent(figure) {
    this.updateHeroSection(figure);
    this.updateMainContent(figure);
    this.updateSidebar(figure);
    this.updateMetaTags(figure);
  }

  updateHeroSection(figure) {
    const heroSection = document.querySelector('.figure-hero-section') ||
                       document.querySelector('[class*="hero"]') ||
                       document.querySelector('header');

    if (!heroSection) return;

    // Update hero image
    const heroImg = heroSection.querySelector('img');
    if (heroImg && figure.heroImageUrl) {
      heroImg.src = this.ensureAbsolutePath(figure.heroImageUrl);
      heroImg.alt = figure.fullName;
    }

    // Update hero title
    const heroTitle = heroSection.querySelector('h1') || heroSection.querySelector('.hero-title');
    if (heroTitle) {
      heroTitle.textContent = figure.fullName;
    }

    // Update hero subtitle
    const heroSubtitle = heroSection.querySelector('h2') || heroSection.querySelector('.hero-subtitle');
    if (heroSubtitle && figure.title) {
      heroSubtitle.textContent = figure.title;
    }
  }

  updateMainContent(figure) {
    // Update page title
    const pageTitle = document.querySelector('h1');
    if (pageTitle) {
      pageTitle.textContent = figure.fullName;
    }

    // Update role/title
    const roleElement = document.querySelector('[data-role]') || document.querySelector('.figure-role');
    if (roleElement && figure.title) {
      roleElement.textContent = figure.title;
    }

    // Update introduction
    const introElement = document.querySelector('[data-introduction]') || document.querySelector('.figure-introduction');
    if (introElement && figure.introduction) {
      introElement.textContent = figure.introduction;
    }

    // Update featured image
    const featuredImg = document.querySelector('.figure-featured-image') ||
                       document.querySelector('img[data-featured]');
    if (featuredImg && figure.imageUrl) {
      featuredImg.src = this.ensureAbsolutePath(figure.imageUrl);
      featuredImg.alt = figure.fullName;
    }

    // Update quote section
    const quoteElement = document.querySelector('[data-quote]') || document.querySelector('.figure-quote');
    if (quoteElement && figure.quote) {
      quoteElement.textContent = `"${figure.quote}"`;
    }

    // Update summary
    if (figure.summary && Array.isArray(figure.summary)) {
      const summaryContainer = document.querySelector('[data-summary]') || document.querySelector('.figure-summary');
      if (summaryContainer) {
        summaryContainer.innerHTML = figure.summary
          .map(paragraph => `<p>${paragraph}</p>`)
          .join('');
      }
    }

    // Update sections
    if (figure.sections && Array.isArray(figure.sections)) {
      const sectionsContainer = document.querySelector('[data-sections]') || document.querySelector('.figure-sections');
      if (sectionsContainer) {
        figure.sections.forEach(section => {
          this.addSection(sectionsContainer, section);
        });
      }
    }

    // Update highlights (Q&A)
    if (figure.highlights && Array.isArray(figure.highlights)) {
      const highlightsContainer = document.querySelector('[data-highlights]') || document.querySelector('.figure-highlights');
      if (highlightsContainer) {
        figure.highlights.forEach(highlight => {
          this.addHighlight(highlightsContainer, highlight);
        });
      }
    }
  }

  addSection(container, section) {
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'figure-section';

    if (section.title) {
      const titleElement = document.createElement('h3');
      titleElement.textContent = section.title;
      titleElement.className = 'section-title';
      sectionDiv.appendChild(titleElement);
    }

    if (section.type === 'list' && section.items) {
      const ul = document.createElement('ul');
      ul.className = 'section-list';
      section.items.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        ul.appendChild(li);
      });
      sectionDiv.appendChild(ul);
    } else if (section.content) {
      const contentDiv = document.createElement('div');
      contentDiv.className = 'section-content';
      contentDiv.innerHTML = section.content;
      sectionDiv.appendChild(contentDiv);
    }

    container.appendChild(sectionDiv);
  }

  addHighlight(container, highlight) {
    const highlightDiv = document.createElement('div');
    highlightDiv.className = 'figure-highlight qa-item';

    // Question
    const questionElement = document.createElement('h4');
    questionElement.className = 'qa-question';
    questionElement.textContent = highlight.question;
    highlightDiv.appendChild(questionElement);

    // Answer
    if (Array.isArray(highlight.answer)) {
      highlight.answer.forEach(answerText => {
        const answerParagraph = document.createElement('p');
        answerParagraph.className = 'qa-answer';
        answerParagraph.textContent = answerText;
        highlightDiv.appendChild(answerParagraph);
      });
    } else if (highlight.answer) {
      const answerDiv = document.createElement('div');
      answerDiv.className = 'qa-answer';
      answerDiv.textContent = highlight.answer;
      highlightDiv.appendChild(answerDiv);
    }

    container.appendChild(highlightDiv);
  }

  updateSidebar(figure) {
    // Update sidebar portrait image
    const sidebarImg = document.querySelector('.sidebar-image') || document.querySelector('aside img');
    if (sidebarImg && figure.imageUrl) {
      sidebarImg.src = this.ensureAbsolutePath(figure.imageUrl);
      sidebarImg.alt = figure.fullName;
    }

    // Update sidebar title
    const sidebarTitle = document.querySelector('.sidebar-title') || document.querySelector('aside .title');
    if (sidebarTitle && figure.title) {
      sidebarTitle.textContent = figure.title;
    }

    // Update sidebar category
    const sidebarCategory = document.querySelector('.sidebar-category') || document.querySelector('aside .category');
    if (sidebarCategory && figure.category) {
      sidebarCategory.textContent = figure.category;
    }
  }

  updateMetaTags(figure) {
    // Update page title
    document.title = `${figure.fullName} | Living Heritage`;

    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    const description = figure.summary && figure.summary[0] ? figure.summary[0] : figure.introduction;
    metaDescription.content = description || figure.title;

    // Update OG tags
    this.updateOGTag('og:title', figure.fullName);
    this.updateOGTag('og:description', description || '');
    this.updateOGTag('og:image', figure.heroImageUrl || figure.imageUrl || '');
    this.updateOGTag('og:url', window.location.href);

    // Update Twitter tags
    this.updateMetaTag('twitter:title', figure.fullName);
    this.updateMetaTag('twitter:description', description || '');
    this.updateMetaTag('twitter:image', figure.heroImageUrl || figure.imageUrl || '');

    // Update keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.name = 'keywords';
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.content = `${figure.fullName}, ${figure.title}, ${figure.category}, Living Heritage`;
  }

  updateOGTag(property, content) {
    let tag = document.querySelector(`meta[property="${property}"]`);
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute('property', property);
      document.head.appendChild(tag);
    }
    tag.content = content;
  }

  updateMetaTag(name, content) {
    let tag = document.querySelector(`meta[name="${name}"]`);
    if (!tag) {
      tag = document.createElement('meta');
      tag.name = name;
      document.head.appendChild(tag);
    }
    tag.content = content;
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new EnglishDetailPageLoader();
});
