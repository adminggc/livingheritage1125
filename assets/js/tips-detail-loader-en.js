/**
 * Living Heritage - English Wellness Tips Detail Page Loader
 * Dynamically loads English wellness tips from /api/tips-en endpoint
 * and populates the page content based on URL slug matching
 */

class EnglishTipsDetailLoader {
  constructor() {
    this.apiEndpoint = '/api/tips-en';
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
      const tips = await this.loadTips();
      if (tips.length === 0) {
        console.warn('No English wellness tips loaded');
        return;
      }

      const tip = this.getTipByCurrentPage(tips);
      if (tip) {
        this.renderDetailContent(tip);
      } else {
        console.warn(`No English tip found for slug: ${this.currentPage}`);
      }
    } catch (error) {
      console.error('Error loading English tips detail page:', error);
    }
  }

  async loadTips() {
    try {
      const response = await fetch(this.apiEndpoint);
      if (!response.ok) {
        throw new Error('Failed to load English tips from API');
      }
      const data = await response.json();
      return data.wellnessTips || [];
    } catch (error) {
      console.error('Error loading English tips:', error);
      return [];
    }
  }

  getTipByCurrentPage(tips) {
    return tips.find(tip => {
      // Match by urlSlug or generated slug
      const tipSlug = tip.urlSlug ? tip.urlSlug.replace('.html', '') : this.generateSlug(tip.title);
      return tipSlug === this.currentPage;
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

  renderDetailContent(tip) {
    this.updateHeroSection(tip);
    this.updateContent(tip);
    this.updateMetaTags(tip);
  }

  updateHeroSection(tip) {
    const heroSection = document.querySelector('.tips-hero-section') ||
                       document.querySelector('[class*="hero"]') ||
                       document.querySelector('header');

    if (!heroSection) return;

    // Update hero image - use heroImageUrl if available, fallback to imageUrl
    const heroImg = heroSection.querySelector('img');
    if (heroImg) {
      const heroImageUrl = tip.heroImageUrl || tip.imageUrl;
      if (heroImageUrl) {
        heroImg.src = heroImageUrl;
        heroImg.alt = tip.title;
      }
    }

    // Update hero title
    const heroTitle = heroSection.querySelector('h1') || heroSection.querySelector('.hero-title');
    if (heroTitle) {
      heroTitle.textContent = tip.title;
    }
  }

  updateContent(tip) {
    // Update main tip title
    const mainTitle = document.querySelector('h1');
    if (mainTitle) {
      mainTitle.textContent = tip.title;
    }

    // Update featured image - use heroImageUrl if available, fallback to imageUrl
    const featuredImg = document.querySelector('.tip-featured-image') ||
                       document.querySelector('img[data-featured]');
    if (featuredImg) {
      const imageUrl = tip.heroImageUrl || tip.imageUrl;
      if (imageUrl) {
        featuredImg.src = imageUrl;
        featuredImg.alt = tip.title;
      }
    }

    // Update description
    const descriptionElement = document.querySelector('[data-description]') ||
                              document.querySelector('.tip-description');
    if (descriptionElement && tip.description) {
      descriptionElement.textContent = tip.description;
    }

    // Update tip content
    const contentContainer = document.querySelector('.tip-content') ||
                            document.querySelector('[data-content]') ||
                            document.querySelector('main article');
    if (contentContainer && tip.content) {
      // Find or create content div
      let contentDiv = contentContainer.querySelector('[data-content="body"]');
      if (!contentDiv) {
        contentDiv = document.createElement('div');
        contentDiv.className = 'tip-body';
        contentContainer.appendChild(contentDiv);
      }
      contentDiv.innerHTML = tip.content;
    }
  }

  updateMetaTags(tip) {
    // Update page title
    document.title = `${tip.title} | Living Heritage`;

    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = tip.description || tip.title;

    // Update OG tags
    this.updateOGTag('og:title', tip.title);
    this.updateOGTag('og:description', tip.description || '');
    this.updateOGTag('og:image', tip.imageUrl || '');
    this.updateOGTag('og:url', window.location.href);

    // Update Twitter tags
    this.updateMetaTag('twitter:title', tip.title);
    this.updateMetaTag('twitter:description', tip.description || '');
    this.updateMetaTag('twitter:image', tip.imageUrl || '');

    // Update keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.name = 'keywords';
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.content = `${tip.title}, wellness, health, Living Heritage`;
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
  new EnglishTipsDetailLoader();
});
