/**
 * Living Heritage - English News Detail Page Loader
 * Dynamically loads English news articles from /api/news-en endpoint
 * and populates the page content based on URL slug matching
 */

class EnglishNewsDetailLoader {
  constructor() {
    this.apiEndpoint = '/api/news-en';
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
      const articles = await this.loadNews();
      if (articles.length === 0) {
        console.warn('No English news articles loaded');
        return;
      }

      const article = this.getArticleByCurrentPage(articles);
      if (article) {
        this.renderDetailContent(article);
      } else {
        console.warn(`No English article found for slug: ${this.currentPage}`);
      }
    } catch (error) {
      console.error('Error loading English news detail page:', error);
    }
  }

  async loadNews() {
    try {
      const response = await fetch(this.apiEndpoint);
      if (!response.ok) {
        throw new Error('Failed to load English news from API');
      }
      const data = await response.json();
      return data.news || [];
    } catch (error) {
      console.error('Error loading English news:', error);
      return [];
    }
  }

  getArticleByCurrentPage(articles) {
    return articles.find(article => {
      // Match by slug
      const articleSlug = article.slug || article.urlSlug || this.generateSlug(article.title);
      return articleSlug === this.currentPage;
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

  renderDetailContent(article) {
    this.updateHeroSection(article);
    this.updateContent(article);
    this.updateMetaTags(article);
  }

  updateHeroSection(article) {
    const heroSection = document.querySelector('.news-hero-section') ||
                       document.querySelector('[class*="hero"]') ||
                       document.querySelector('header');

    if (!heroSection) return;

    // Update hero image
    const heroImg = heroSection.querySelector('img');
    if (heroImg && article.featured_image) {
      heroImg.src = article.featured_image;
      heroImg.alt = article.title;
    }

    // Update hero title
    const heroTitle = heroSection.querySelector('h1') || heroSection.querySelector('.hero-title');
    if (heroTitle) {
      heroTitle.textContent = article.title;
    }
  }

  updateContent(article) {
    // Update main article title
    const mainTitle = document.querySelector('h1');
    if (mainTitle) {
      mainTitle.textContent = article.title;
    }

    // Update article date
    const dateElement = document.querySelector('[data-date]') || document.querySelector('time') ||
                       document.querySelector('.article-date');
    if (dateElement && article.date) {
      dateElement.textContent = new Date(article.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }

    // Update category
    const categoryElement = document.querySelector('[data-category]') || document.querySelector('.article-category');
    if (categoryElement && article.category) {
      categoryElement.textContent = article.category;
    }

    // Update featured image
    const featuredImg = document.querySelector('.article-featured-image') ||
                       document.querySelector('img[data-featured]');
    if (featuredImg && article.featured_image) {
      featuredImg.src = article.featured_image;
      featuredImg.alt = article.title;
    }

    // Update article content
    const contentContainer = document.querySelector('.article-content') ||
                            document.querySelector('[data-content]') ||
                            document.querySelector('main article');
    if (contentContainer && article.content) {
      // Find or create content div
      let contentDiv = contentContainer.querySelector('[data-content="body"]');
      if (!contentDiv) {
        contentDiv = document.createElement('div');
        contentDiv.className = 'article-body';
        contentContainer.appendChild(contentDiv);
      }
      contentDiv.innerHTML = article.content;
    }

    // Update author
    const authorElement = document.querySelector('[data-author]') || document.querySelector('.article-author');
    if (authorElement && article.author) {
      authorElement.textContent = article.author;
    }
  }

  updateMetaTags(article) {
    // Update page title
    document.title = `${article.title} | Living Heritage`;

    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = article.description || article.title;

    // Update OG tags
    this.updateOGTag('og:title', article.title);
    this.updateOGTag('og:description', article.description || '');
    this.updateOGTag('og:image', article.featured_image || '');
    this.updateOGTag('og:url', window.location.href);

    // Update Twitter tags
    this.updateMetaTag('twitter:title', article.title);
    this.updateMetaTag('twitter:description', article.description || '');
    this.updateMetaTag('twitter:image', article.featured_image || '');

    // Update keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.name = 'keywords';
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.content = `${article.title}, ${article.category}, Living Heritage`;
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
  new EnglishNewsDetailLoader();
});
