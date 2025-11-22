/**
 * Living Heritage - Admin Panel JavaScript (JSON Version)
 * Handles authentication, CRUD operations with JSON file storage
 * Saves content to data/news.json, data/profiles.json, etc.
 */

class AdminPanel {
  constructor() {
    this.currentUser = null;
    this.currentEditId = null;
    this.currentType = null;
    this.dataPath = 'data'; // Path to JSON files
    this.setupEventListeners();
    this.checkAuth();
  }

  // ===== INITIALIZATION =====
  async initializeData() {
    // Load data from JSON files on startup
    try {
      // Load Vietnamese data
      await this.loadNewsFromFile();
      await this.loadTipsFromFile();
      await this.loadFiguresFromFile();
      await this.loadBannersFromFile();

      // Load English data
      await this.loadNewsFromFileEn();
      await this.loadTipsFromFileEn();
      await this.loadFiguresFromFileEn();

      this.updateStats();
    } catch (error) {
      console.log('Initializing with new data', error);
    }
  }

  setupEventListeners() {
    // Login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }

    // Logout
    const logoutBtns = document.querySelectorAll('#logoutBtn, #logoutBtn2');
    logoutBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.logout();
      });
    });

    // Navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = link.getAttribute('data-tab');
        this.switchTab(tab);
      });
    });

    // Sidebar toggle on mobile
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', () => {
        document.getElementById('adminSidebar').classList.toggle('open');
      });
    }

    // Close sidebar when clicking a link on mobile
    if (window.innerWidth <= 768) {
      navLinks.forEach(link => {
        link.addEventListener('click', () => {
          document.getElementById('adminSidebar').classList.remove('open');
        });
      });
    }

    // Add buttons - Vietnamese
    document.getElementById('addNewsBtn').addEventListener('click', () => this.openNewsModal());
    document.getElementById('addProfileBtn').addEventListener('click', () => this.openProfileModal());
    document.getElementById('addTipBtn').addEventListener('click', () => this.openTipModal());
    document.getElementById('addBannerBtn').addEventListener('click', () => this.openBannerModal());

    // Add buttons - English
    document.getElementById('addNewsBtnEn').addEventListener('click', () => this.openNewsModalEn());
    document.getElementById('addProfileBtnEn').addEventListener('click', () => this.openProfileModalEn());
    document.getElementById('addTipBtnEn').addEventListener('click', () => this.openTipModalEn());

    // Search - Vietnamese
    document.getElementById('newsSearch').addEventListener('input', (e) => this.filterTable('news', e.target.value));
    document.getElementById('profilesSearch').addEventListener('input', (e) => this.filterTable('profiles', e.target.value));
    document.getElementById('tipsSearch').addEventListener('input', (e) => this.filterTable('tips', e.target.value));
    document.getElementById('bannersSearch').addEventListener('input', (e) => this.filterTable('banners', e.target.value));

    // Search - English
    document.getElementById('newsSearchEn').addEventListener('input', (e) => this.filterTable('newsEn', e.target.value));
    document.getElementById('profilesSearchEn').addEventListener('input', (e) => this.filterTable('profilesEn', e.target.value));
    document.getElementById('tipsSearchEn').addEventListener('input', (e) => this.filterTable('tipsEn', e.target.value));

    // Form submissions - Vietnamese
    document.getElementById('newsForm').addEventListener('submit', (e) => this.saveNews(e));
    document.getElementById('profilesForm').addEventListener('submit', (e) => this.saveProfile(e));
    document.getElementById('tipsForm').addEventListener('submit', (e) => this.saveTip(e));
    document.getElementById('bannersForm').addEventListener('submit', (e) => this.saveBanner(e));

    // Form submissions - English
    document.getElementById('newsFormEn').addEventListener('submit', (e) => this.saveNewsEn(e));
    document.getElementById('profilesFormEn').addEventListener('submit', (e) => this.saveProfileEn(e));
    document.getElementById('tipsFormEn').addEventListener('submit', (e) => this.saveTipEn(e));

    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modalId = btn.getAttribute('data-modal');
        this.closeModal(modalId);
      });
    });

    // Close modal when clicking outside
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal(modal.id);
        }
      });
    });

    // Alert close buttons
    document.querySelectorAll('.alert-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.target.closest('.alert').classList.remove('show');
      });
    });

    // Settings buttons
    document.getElementById('exportDataBtn').addEventListener('click', () => this.exportAllData());
    document.getElementById('importDataBtn').addEventListener('click', () => {
      document.getElementById('importFile').click();
    });
    document.getElementById('importFile').addEventListener('change', (e) => this.importAllData(e));
    document.getElementById('clearDataBtn').addEventListener('click', () => this.clearAllData());
    document.getElementById('resetDataBtn').addEventListener('click', () => this.resetToDefault());
  }

  // ===== FILE OPERATIONS =====
  async loadNewsFromFile() {
    try {
      // Use API endpoint instead of direct file fetch
      const response = await fetch('/api/news');
      if (!response.ok) throw new Error('Failed to load news from API');
      const data = await response.json();
      window.newsData = data.news || [];
      console.log(`✓ Loaded ${window.newsData.length} news articles from API`);
      return data.news;
    } catch (error) {
      console.error('Error loading news from API:', error);
      window.newsData = [];
      return [];
    }
  }

  async saveNewsToFile(newsArray) {
    /**
     * NOTE: Direct file writing from browser is NOT possible due to security restrictions.
     * This function demonstrates the logic.
     *
     * For production, you need:
     * 1. A backend API endpoint that accepts POST requests
     * 2. Server-side handling to write to JSON files
     *
     * Example backend endpoint (Node.js Express):
     *
     * app.post('/api/save-news', (req, res) => {
     *   const data = { news: req.body };
     *   fs.writeFileSync('data/news.json', JSON.stringify(data, null, 2));
     *   res.json({ success: true });
     * });
     */
    try {
      // For browser environment: send to backend
      const response = await fetch('/api/save-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ news: newsArray })
      });

      if (!response.ok) {
        throw new Error('Failed to save news');
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error saving news:', error);
      // Fallback to showing download option
      this.showError('Auto-save failed. Using download backup.');
      this.downloadNewsAsJSON(newsArray);
      return false;
    }
  }

  downloadNewsAsJSON(newsArray) {
    const data = { news: newsArray };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `news-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // ===== TIPS DATA LOADING =====
  async loadTipsFromFile() {
    try {
      const response = await fetch('/api/tips');
      if (!response.ok) throw new Error('Failed to load tips from API');
      const data = await response.json();
      window.tipsData = data.wellnessTips || [];
      console.log(`✓ Loaded ${window.tipsData.length} wellness tips from API`);
      return data.wellnessTips;
    } catch (error) {
      console.error('Error loading tips from API:', error);
      window.tipsData = [];
      return [];
    }
  }

  async saveTipsToFile(tipsArray) {
    try {
      const response = await fetch('/api/save-tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wellnessTips: tipsArray })
      });

      if (!response.ok) {
        throw new Error('Failed to save tips');
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error saving tips:', error);
      this.showError('Auto-save tips failed. Using download backup.');
      this.downloadTipsAsJSON(tipsArray);
      return false;
    }
  }

  downloadTipsAsJSON(tipsArray) {
    const data = { wellnessTips: tipsArray };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tips-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // ===== HERITAGE FIGURES DATA LOADING =====
  async loadFiguresFromFile() {
    try {
      const response = await fetch('/api/figures');
      if (!response.ok) throw new Error('Failed to load figures from API');
      const data = await response.json();
      window.figuresData = data.heritageFigures || [];
      console.log(`✓ Loaded ${window.figuresData.length} heritage figures from API`);
      return data.heritageFigures;
    } catch (error) {
      console.error('Error loading figures from API:', error);
      window.figuresData = [];
      return [];
    }
  }

  async saveFiguresToFile(figuresArray) {
    try {
      const response = await fetch('/api/save-figures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ heritageFigures: figuresArray })
      });

      if (!response.ok) {
        throw new Error('Failed to save figures');
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error saving figures:', error);
      this.showError('Auto-save figures failed. Using download backup.');
      this.downloadFiguresAsJSON(figuresArray);
      return false;
    }
  }

  downloadFiguresAsJSON(figuresArray) {
    const data = { heritageFigures: figuresArray };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `figures-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // ===== BANNERS DATA LOADING =====
  async loadBannersFromFile() {
    try {
      const response = await fetch('/api/banners');
      if (!response.ok) throw new Error('Failed to load banners from API');
      const data = await response.json();
      window.bannersData = data.banners || [];
      console.log(`✓ Loaded ${window.bannersData.length} banners from API`);
      return data.banners;
    } catch (error) {
      console.error('Error loading banners from API:', error);
      window.bannersData = [];
      return [];
    }
  }

  async saveBannersToFile(bannersArray) {
    try {
      const response = await fetch('/api/save-banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banners: bannersArray })
      });

      if (!response.ok) {
        throw new Error('Failed to save banners');
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error saving banners:', error);
      this.showError('Auto-save banners failed. Using download backup.');
      this.downloadBannersAsJSON(bannersArray);
      return false;
    }
  }

  downloadBannersAsJSON(bannersArray) {
    const data = { banners: bannersArray };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `banners-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // ===== AUTHENTICATION =====
  checkAuth() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    if (isLoggedIn === 'true') {
      this.showAdminPanel();
    } else {
      this.showLoginPage();
    }
  }

  handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Simple demo authentication
    const validUsers = {
      'admin': 'admin123',
      'user': 'user123'
    };

    if (validUsers[username] === password) {
      this.currentUser = username;
      sessionStorage.setItem('isLoggedIn', 'true');
      sessionStorage.setItem('currentUser', username);
      this.showAdminPanel();
    } else {
      this.showError('Invalid username or password. Try admin/admin123');
      document.getElementById('username').value = '';
      document.getElementById('password').value = '';
    }
  }

  logout() {
    if (confirm('Are you sure you want to logout?')) {
      sessionStorage.removeItem('isLoggedIn');
      sessionStorage.removeItem('currentUser');
      document.getElementById('loginPage').style.display = 'flex';
      document.getElementById('adminPage').style.display = 'none';
      document.getElementById('loginForm').reset();
    }
  }

  showLoginPage() {
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('adminPage').style.display = 'none';
  }

  showAdminPanel() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('adminPage').style.display = 'flex';
    this.initializeData();

    // Show sidebar toggle on mobile
    if (window.innerWidth <= 768) {
      document.getElementById('sidebarToggle').style.display = 'block';
    }
  }

  // ===== NAVIGATION & TABS =====
  switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.admin-tab-content').forEach(tab => {
      tab.classList.remove('active');
    });

    // Remove active class from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });

    // Show selected tab
    const tabElement = document.getElementById(tabName);
    if (tabElement) {
      tabElement.classList.add('active');
    }

    // Mark nav link as active
    const activeLink = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeLink) {
      activeLink.classList.add('active');
    }

    // Update page title
    const titles = {
      'dashboard': 'Dashboard',
      'news': 'News & Blog',
      'profiles': 'Heritage Figures',
      'tips': 'Wellness Tips',
      'banners': 'Banners & Carousel',
      'settings': 'Settings'
    };
    document.getElementById('pageTitle').textContent = titles[tabName] || 'Dashboard';

    // Reload data for current tab
    if (tabName === 'news') this.loadNews();
    if (tabName === 'profiles') this.loadProfiles();
    if (tabName === 'tips') this.loadTips();
    if (tabName === 'banners') this.loadBanners();
  }

  // ===== NEWS CRUD =====
  openNewsModal(id = null) {
    const form = document.getElementById('newsForm');
    form.reset();
    this.currentEditId = id;

    if (id) {
      document.getElementById('newsModalTitle').textContent = 'Edit Article';
      const article = window.newsData.find(a => a.id === id);
      if (article) {
        document.getElementById('newsTitle').value = article.title || '';
        document.getElementById('newsCategory').value = article.category || '';
        document.getElementById('newsDate').value = article.date || '';
        document.getElementById('newsImage').value = article.featured_image || '';
        document.getElementById('newsDescription').value = article.description || '';
        document.getElementById('newsContent').value = article.content || '';
        document.getElementById('newsAuthor').value = article.author || '';
        document.getElementById('newsPublished').checked = article.published !== false;
      }
    } else {
      document.getElementById('newsModalTitle').textContent = 'Add Article';
      document.getElementById('newsDate').valueAsDate = new Date();
    }

    this.openModal('newsModal');
  }

  async saveNews(e) {
    e.preventDefault();

    const title = document.getElementById('newsTitle').value.trim();
    const category = document.getElementById('newsCategory').value.trim();
    const date = document.getElementById('newsDate').value.trim();
    const featured_image = document.getElementById('newsImage').value.trim();
    const description = document.getElementById('newsDescription').value.trim();
    const content = document.getElementById('newsContent').value.trim();
    const author = document.getElementById('newsAuthor').value.trim();
    const published = document.getElementById('newsPublished').checked;

    if (!title) {
      this.showError('Title is required');
      return;
    }

    const formData = {
      id: this.currentEditId || Date.now(),
      slug: this.generateSlug(title),
      title: title,
      description: description || title.substring(0, 100),
      category: category,
      date: date || new Date().toISOString().split('T')[0],
      publishedTime: new Date().toISOString(),
      featured_image: featured_image,
      images: featured_image ? [featured_image] : [],
      content: content,
      author: author || 'Living Heritage',
      keywords: category,
      published: published,
      created: this.currentEditId ? (window.newsData.find(a => a.id === this.currentEditId)?.created || new Date().toISOString()) : new Date().toISOString(),
      updated: new Date().toISOString()
    };

    if (this.currentEditId) {
      window.newsData = window.newsData.map(a => a.id === this.currentEditId ? formData : a);
      this.showSuccess('Article updated successfully');
    } else {
      window.newsData.push(formData);
      this.showSuccess('Article created successfully');
    }

    // Save to file
    await this.saveNewsToFile(window.newsData);

    this.closeModal('newsModal');
    this.loadNews();
    this.updateStats();
  }

  loadNews() {
    const tbody = document.getElementById('newsTableBody');

    if (!window.newsData || window.newsData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px; color: #999;"><i class="fas fa-inbox" style="font-size: 32px; margin-bottom: 10px; display: block;"></i>No articles yet.</td></tr>';
      return;
    }

    // Sort by date (newest first)
    const sortedNews = [...window.newsData].sort((a, b) => new Date(b.date) - new Date(a.date));

    tbody.innerHTML = sortedNews.map(article => `
      <tr>
        <td>${article.title}</td>
        <td>${article.category || '-'}</td>
        <td>${new Date(article.date).toLocaleDateString()}</td>
        <td><span class="badge" style="background: ${article.published ? '#28a745' : '#dc3545'}; color: white; padding: 4px 8px; border-radius: 3px; font-size: 11px;">${article.published ? 'Published' : 'Draft'}</span></td>
        <td class="admin-table-actions">
          <button class="btn btn-small btn-secondary" onclick="admin.openNewsModal(${article.id})"><i class="fas fa-edit"></i> Edit</button>
          <button class="btn btn-small btn-danger" onclick="admin.deleteNews(${article.id})"><i class="fas fa-trash"></i> Delete</button>
        </td>
      </tr>
    `).join('');
  }

  async deleteNews(id) {
    if (confirm('Are you sure you want to delete this article?')) {
      window.newsData = window.newsData.filter(a => a.id !== id);
      await this.saveNewsToFile(window.newsData);
      this.showSuccess('Article deleted');
      this.loadNews();
      this.updateStats();
    }
  }

  // ===== PROFILES CRUD =====
  openProfileModal(id = null) {
    const form = document.getElementById('profilesForm');
    form.reset();
    this.currentEditId = id;

    // Clear dynamic containers
    document.getElementById('sectionsContainer').innerHTML = '';
    document.getElementById('highlightsContainer').innerHTML = '';

    if (id) {
      document.getElementById('profilesModalTitle').textContent = 'Edit Profile';
      const figure = window.figuresData.find(f => f.id === id);
      if (figure) {
        // Basic info
        document.getElementById('profileName').value = figure.fullName || '';
        document.getElementById('profileTitle').value = figure.title || '';
        document.getElementById('profileCategory').value = figure.category || '';
        document.getElementById('profileHeaderLetter').value = figure.headerLetter || '';

        // Images
        document.getElementById('profileImage').value = figure.imageUrl || '';
        document.getElementById('profileSmallImage').value = figure.smallImageUrl || '';
        document.getElementById('profileHeroImage').value = figure.heroImageUrl || '';

        // Summary & Introduction
        if (figure.summary && Array.isArray(figure.summary)) {
          document.getElementById('profileSummary').value = figure.summary.join('\n');
        }
        document.getElementById('profileIntroduction').value = figure.introduction || '';

        // Quote
        document.getElementById('profileQuote').value = figure.quote || '';

        // Sections
        if (figure.sections && Array.isArray(figure.sections)) {
          figure.sections.forEach(section => {
            this.addSectionField(section.title, section.type, section.content || section.items?.join('\n') || '');
          });
        }

        // Highlights
        if (figure.highlights && Array.isArray(figure.highlights)) {
          figure.highlights.forEach(highlight => {
            const answerText = Array.isArray(highlight.answer) ? highlight.answer.join('\n') : highlight.answer;
            this.addHighlightField(highlight.question, answerText);
          });
        }

        document.getElementById('profilePublished').checked = figure.published !== false;
      }
    } else {
      document.getElementById('profilesModalTitle').textContent = 'Add Profile';
    }

    // Setup event listeners for dynamic buttons
    document.getElementById('addSectionBtn').onclick = (e) => {
      e.preventDefault();
      this.addSectionField('', 'text', '');
    };

    document.getElementById('addHighlightBtn').onclick = (e) => {
      e.preventDefault();
      this.addHighlightField('', '');
    };

    this.openModal('profilesModal');
  }

  addSectionField(title = '', type = 'text', content = '') {
    const container = document.getElementById('sectionsContainer');
    const index = container.children.length;
    const sectionHtml = `
      <div class="form-group section-field" style="border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 4px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <label style="font-weight: bold; margin: 0;">Section ${index + 1}</label>
          <button type="button" class="btn btn-small btn-danger" onclick="this.closest('.section-field').remove()">
            <i class="fas fa-times"></i> Remove
          </button>
        </div>
        <div class="form-group">
          <label>Section Title</label>
          <input type="text" class="section-title" placeholder="e.g., Education, Career" value="${title}">
        </div>
        <div class="form-group">
          <label>Content Type</label>
          <select class="section-type">
            <option value="text" ${type === 'text' ? 'selected' : ''}>Text Paragraphs</option>
            <option value="list" ${type === 'list' ? 'selected' : ''}>Bullet List</option>
          </select>
        </div>
        <div class="form-group">
          <label>Content (one per line for lists)</label>
          <textarea class="section-content" placeholder="Enter content..." style="min-height: 80px;">${content}</textarea>
        </div>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', sectionHtml);
  }

  addHighlightField(question = '', answer = '') {
    const container = document.getElementById('highlightsContainer');
    const index = container.children.length;
    const highlightHtml = `
      <div class="form-group highlight-field" style="border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 4px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <label style="font-weight: bold; margin: 0;">Q&A ${index + 1}</label>
          <button type="button" class="btn btn-small btn-danger" onclick="this.closest('.highlight-field').remove()">
            <i class="fas fa-times"></i> Remove
          </button>
        </div>
        <div class="form-group">
          <label>Question</label>
          <input type="text" class="highlight-question" placeholder="What is your question?" value="${question}">
        </div>
        <div class="form-group">
          <label>Answer (one paragraph per line)</label>
          <textarea class="highlight-answer" placeholder="Enter answer paragraphs..." style="min-height: 80px;">${answer}</textarea>
        </div>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', highlightHtml);
  }

  async saveProfile(e) {
    e.preventDefault();

    const name = document.getElementById('profileName').value.trim();
    const title = document.getElementById('profileTitle').value.trim();
    const category = document.getElementById('profileCategory').value.trim();
    const headerLetter = document.getElementById('profileHeaderLetter').value.trim();
    const image = document.getElementById('profileImage').value.trim();
    const smallImage = document.getElementById('profileSmallImage').value.trim();
    const heroImage = document.getElementById('profileHeroImage').value.trim();
    const published = document.getElementById('profilePublished').checked;

    // Summary (split by lines)
    const summaryText = document.getElementById('profileSummary').value.trim();
    const summary = summaryText ? summaryText.split('\n').map(s => s.trim()).filter(s => s) : [];

    // Introduction
    const introduction = document.getElementById('profileIntroduction').value.trim();

    // Quote
    const quote = document.getElementById('profileQuote').value.trim();

    // Sections
    const sections = [];
    document.querySelectorAll('.section-field').forEach(field => {
      const sectionTitle = field.querySelector('.section-title').value.trim();
      const sectionType = field.querySelector('.section-type').value;
      const sectionContent = field.querySelector('.section-content').value.trim();

      if (sectionTitle && sectionContent) {
        if (sectionType === 'list') {
          sections.push({
            title: sectionTitle,
            type: 'list',
            items: sectionContent.split('\n').map(s => s.trim()).filter(s => s)
          });
        } else {
          sections.push({
            title: sectionTitle,
            type: 'text',
            content: sectionContent
          });
        }
      }
    });

    // Highlights
    const highlights = [];
    document.querySelectorAll('.highlight-field').forEach(field => {
      const question = field.querySelector('.highlight-question').value.trim();
      const answerText = field.querySelector('.highlight-answer').value.trim();

      if (question && answerText) {
        highlights.push({
          question: question,
          answer: answerText.split('\n').map(s => s.trim()).filter(s => s)
        });
      }
    });

    if (!name || !title) {
      this.showError('Name and Title are required');
      return;
    }

    if (this.currentEditId) {
      // Edit existing figure
      const figure = window.figuresData.find(f => f.id === this.currentEditId);
      if (figure) {
        figure.fullName = name;
        figure.title = title;
        figure.category = category;
        figure.headerLetter = headerLetter;
        figure.imageUrl = image;
        figure.smallImageUrl = smallImage;
        figure.heroImageUrl = heroImage;
        figure.summary = summary;
        figure.introduction = introduction;
        figure.sections = sections;
        figure.quote = quote;
        figure.highlights = highlights;
        figure.published = published;
        figure.updatedAt = new Date().toISOString();
      }
      this.showSuccess('Profile updated successfully');
    } else {
      // Add new figure
      const newId = Math.max(0, ...window.figuresData.map(f => f.id)) + 1;
      const newFigure = {
        id: newId,
        fullName: name,
        title: title,
        category: category,
        headerLetter: headerLetter,
        imageUrl: image,
        smallImageUrl: smallImage,
        heroImageUrl: heroImage,
        summary: summary,
        introduction: introduction,
        sections: sections,
        quote: quote,
        highlights: highlights,
        published: published,
        urlSlug: this.generateSlug(name),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      window.figuresData.push(newFigure);
      this.showSuccess('Profile created successfully');
    }

    // Save to file
    await this.saveFiguresToFile(window.figuresData);
    this.closeModal('profilesModal');
    this.loadProfiles();
    this.updateStats();
  }

  loadProfiles() {
    const tbody = document.getElementById('profilesTableBody');

    if (!window.figuresData || window.figuresData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px; color: #999;"><i class="fas fa-inbox" style="font-size: 32px; margin-bottom: 10px; display: block;"></i>No profiles yet.</td></tr>';
      return;
    }

    tbody.innerHTML = window.figuresData.map(figure => `
      <tr>
        <td>${figure.fullName}</td>
        <td>${figure.title}</td>
        <td>${figure.urlSlug || '-'}</td>
        <td><span class="badge badge-success" style="background-color: #28a745; color: white; padding: 4px 8px; border-radius: 3px;">${figure.published ? 'Published' : 'Draft'}</span></td>
        <td class="admin-table-actions">
          <button class="btn btn-small btn-secondary" onclick="admin.openProfileModal(${figure.id})"><i class="fas fa-edit"></i> Edit</button>
          <button class="btn btn-small btn-danger" onclick="admin.deleteProfile(${figure.id})"><i class="fas fa-trash"></i> Delete</button>
        </td>
      </tr>
    `).join('');
  }

  async deleteProfile(id) {
    if (confirm('Are you sure you want to delete this heritage figure?')) {
      window.figuresData = window.figuresData.filter(f => f.id !== id);
      await this.saveFiguresToFile(window.figuresData);
      this.showSuccess('Heritage figure deleted');
      this.loadProfiles();
      this.updateStats();
    }
  }

  // ===== TIPS CRUD =====
  openTipModal(id = null) {
    if (id) {
      const tip = window.tipsData.find(t => t.id === id);
      if (tip) {
        document.getElementById('tipsModalTitle').textContent = 'Edit Wellness Tip';
        document.getElementById('tipTitle').value = tip.title || '';
        document.getElementById('tipCategory').value = tip.category || '';
        document.getElementById('tipImage').value = tip.imageUrl || '';
        document.getElementById('tipContent').value = tip.content || '';
        document.getElementById('tipPublished').checked = tip.published !== false;
        this.currentEditId = id;
      }
    } else {
      document.getElementById('tipsModalTitle').textContent = 'Add Wellness Tip';
      document.getElementById('tipTitle').value = '';
      document.getElementById('tipCategory').value = '';
      document.getElementById('tipImage').value = '';
      document.getElementById('tipContent').value = '';
      document.getElementById('tipPublished').checked = true;
      this.currentEditId = null;
    }
    this.openModal('tipsModal');
  }

  saveTip(e) {
    e.preventDefault();
    const title = document.getElementById('tipTitle').value.trim();
    const category = document.getElementById('tipCategory').value.trim();
    const imageUrl = document.getElementById('tipImage').value.trim();
    const content = document.getElementById('tipContent').value.trim();
    const published = document.getElementById('tipPublished').checked;

    if (!title) {
      this.showError('Title is required');
      return;
    }

    const formData = {
      id: this.currentEditId || Date.now(),
      title: title,
      category: category,
      imageUrl: imageUrl,
      content: content,
      urlSlug: this.generateSlug(title),
      published: published,
      created: this.currentEditId ? (window.tipsData.find(t => t.id === this.currentEditId)?.created || new Date().toISOString()) : new Date().toISOString(),
      updated: new Date().toISOString()
    };

    if (this.currentEditId) {
      // Update existing tip
      const index = window.tipsData.findIndex(t => t.id === this.currentEditId);
      if (index !== -1) {
        window.tipsData[index] = formData;
      }
    } else {
      // Add new tip
      window.tipsData.push(formData);
    }

    this.saveTipsToFile(window.tipsData);
    this.showSuccess('Tip saved successfully');
    this.closeModal('tipsModal');
    this.loadTips();
    this.updateStats();
  }

  loadTips() {
    const tbody = document.getElementById('tipsTableBody');

    if (!window.tipsData || window.tipsData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px; color: #999;"><i class="fas fa-inbox" style="font-size: 32px; margin-bottom: 10px; display: block;"></i>No tips yet.</td></tr>';
      return;
    }

    tbody.innerHTML = window.tipsData.map(tip => `
      <tr>
        <td>${tip.title}</td>
        <td>${tip.urlSlug || '-'}</td>
        <td><span class="badge" style="background: ${tip.published ? '#28a745' : '#dc3545'}; color: white; padding: 4px 8px; border-radius: 3px; font-size: 11px;">${tip.published ? 'Published' : 'Draft'}</span></td>
        <td class="admin-table-actions">
          <button class="btn btn-small btn-secondary" onclick="admin.openTipModal(${tip.id})"><i class="fas fa-edit"></i> Edit</button>
          <button class="btn btn-small btn-danger" onclick="admin.deleteTip(${tip.id})"><i class="fas fa-trash"></i> Delete</button>
        </td>
      </tr>
    `).join('');
  }

  async deleteTip(id) {
    if (confirm('Are you sure you want to delete this tip?')) {
      window.tipsData = window.tipsData.filter(t => t.id !== id);
      await this.saveTipsToFile(window.tipsData);
      this.showSuccess('Tip deleted');
      this.loadTips();
      this.updateStats();
    }
  }

  // ===== BANNERS CRUD =====
  openBannerModal(id = null) {
    this.openModal('bannersModal');
  }

  saveBanner(e) {
    e.preventDefault();
    this.showSuccess('Banner saved');
    this.closeModal('bannersModal');
  }

  loadBanners() {
    const tbody = document.getElementById('bannersTableBody');

    if (!window.bannersData || window.bannersData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px; color: #999;"><i class="fas fa-inbox" style="font-size: 32px; margin-bottom: 10px; display: block;"></i>No banners yet.</td></tr>';
      return;
    }

    tbody.innerHTML = window.bannersData.map(banner => `
      <tr>
        <td>${banner.title || banner.name || '-'}</td>
        <td>${banner.urlSlug || '-'}</td>
        <td><span class="badge badge-success" style="background-color: #28a745; color: white; padding: 4px 8px; border-radius: 3px;">${banner.published ? 'Published' : 'Draft'}</span></td>
        <td>${banner.displayOrder || 0}</td>
        <td class="admin-table-actions">
          <button class="btn btn-small btn-secondary" onclick="admin.openBannerModal(${banner.id})"><i class="fas fa-edit"></i> Edit</button>
          <button class="btn btn-small btn-danger" onclick="admin.deleteBanner(${banner.id})"><i class="fas fa-trash"></i> Delete</button>
        </td>
      </tr>
    `).join('');
  }

  async deleteBanner(id) {
    if (confirm('Are you sure you want to delete this banner?')) {
      window.bannersData = window.bannersData.filter(b => b.id !== id);
      await this.saveBannersToFile(window.bannersData);
      this.showSuccess('Banner deleted');
      this.loadBanners();
      this.updateStats();
    }
  }

  // ===== UTILITY METHODS =====
  generateSlug(title) {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  openModal(modalId) {
    document.getElementById(modalId).classList.add('show');
  }

  closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
  }

  updateStats() {
    document.getElementById('statNews').textContent = (window.newsData || []).length;
    document.getElementById('statProfiles').textContent = (window.figuresData || []).length;
    document.getElementById('statTips').textContent = (window.tipsData || []).length;
    document.getElementById('statBanners').textContent = (window.bannersData || []).length;
  }

  filterTable(type, searchTerm) {
    const rows = document.querySelectorAll(`#${type}TableBody tr`);
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(searchTerm.toLowerCase()) ? '' : 'none';
    });
  }

  showSuccess(message) {
    const alert = document.getElementById('successAlert');
    document.getElementById('successMsg').textContent = message;
    alert.classList.add('show');
    setTimeout(() => alert.classList.remove('show'), 3000);
  }

  showError(message) {
    const alert = document.getElementById('errorAlert');
    document.getElementById('errorMsg').textContent = message;
    alert.classList.add('show');
    setTimeout(() => alert.classList.remove('show'), 3000);
  }

  // ===== DATA EXPORT/IMPORT =====
  exportAllData() {
    const allData = {
      news: window.newsData || [],
      profiles: [],
      tips: [],
      banners: []
    };
    const json = JSON.stringify(allData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `living-heritage-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    this.showSuccess('Data exported successfully');
  }

  importAllData(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.news) {
          window.newsData = data.news;
          this.saveNewsToFile(window.newsData);
          this.loadNews();
          this.updateStats();
          this.showSuccess('Data imported successfully');
        }
      } catch (error) {
        this.showError('Error reading file: ' + error.message);
      }
    };
    reader.readAsText(file);
  }

  clearAllData() {
    if (confirm('Are you sure? This will delete all content.')) {
      if (confirm('This action cannot be undone. Are you absolutely sure?')) {
        window.newsData = [];
        this.saveNewsToFile([]);
        this.loadNews();
        this.updateStats();
        this.showSuccess('All data cleared');
      }
    }
  }

  resetToDefault() {
    if (confirm('Reset all data to demo content? This will replace existing data.')) {
      this.loadNewsFromFile();
      this.loadNews();
      this.updateStats();
      this.showSuccess('Demo data loaded');
    }
  }

  // ===== ENGLISH CONTENT MANAGEMENT =====

  // ===== ENGLISH NEWS DATA LOADING =====
  async loadNewsFromFileEn() {
    try {
      const response = await fetch('/api/news-en');
      if (!response.ok) throw new Error('Failed to load English news from API');
      const data = await response.json();
      window.newsDataEn = data.news || [];
      console.log(`✓ Loaded ${window.newsDataEn.length} English news articles from API`);
      this.loadNewsEn();
      return data.news;
    } catch (error) {
      console.error('Error loading English news from API:', error);
      window.newsDataEn = [];
      return [];
    }
  }

  async saveNewsToFileEn(newsArray) {
    try {
      const response = await fetch('/api/save-news-en', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ news: newsArray })
      });

      if (!response.ok) {
        throw new Error('Failed to save English news');
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error saving English news:', error);
      this.showError('Auto-save English news failed. Using download backup.');
      this.downloadNewsAsJSONEn(newsArray);
      return false;
    }
  }

  downloadNewsAsJSONEn(newsArray) {
    const data = { news: newsArray };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `news-en-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // ===== ENGLISH TIPS DATA LOADING =====
  async loadTipsFromFileEn() {
    try {
      const response = await fetch('/api/tips-en');
      if (!response.ok) throw new Error('Failed to load English tips from API');
      const data = await response.json();
      window.tipsDataEn = data.wellnessTips || [];
      console.log(`✓ Loaded ${window.tipsDataEn.length} English wellness tips from API`);
      this.loadTipsEn();
      return data.wellnessTips;
    } catch (error) {
      console.error('Error loading English tips from API:', error);
      window.tipsDataEn = [];
      return [];
    }
  }

  async saveTipsToFileEn(tipsArray) {
    try {
      const response = await fetch('/api/save-tips-en', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wellnessTips: tipsArray })
      });

      if (!response.ok) {
        throw new Error('Failed to save English tips');
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error saving English tips:', error);
      this.showError('Auto-save English tips failed. Using download backup.');
      this.downloadTipsAsJSONEn(tipsArray);
      return false;
    }
  }

  downloadTipsAsJSONEn(tipsArray) {
    const data = { wellnessTips: tipsArray };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tips-en-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // ===== ENGLISH HERITAGE FIGURES DATA LOADING =====
  async loadFiguresFromFileEn() {
    try {
      const response = await fetch('/api/figures-en');
      if (!response.ok) throw new Error('Failed to load English figures from API');
      const data = await response.json();
      window.figuresDataEn = data.heritageFigures || [];
      console.log(`✓ Loaded ${window.figuresDataEn.length} English heritage figures from API`);
      this.loadProfilesEn();
      return data.heritageFigures;
    } catch (error) {
      console.error('Error loading English figures from API:', error);
      window.figuresDataEn = [];
      return [];
    }
  }

  async saveFiguresToFileEn(figuresArray) {
    try {
      const response = await fetch('/api/save-figures-en', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ heritageFigures: figuresArray })
      });

      if (!response.ok) {
        throw new Error('Failed to save English figures');
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error saving English figures:', error);
      this.showError('Auto-save English figures failed. Using download backup.');
      this.downloadFiguresAsJSONEn(figuresArray);
      return false;
    }
  }

  downloadFiguresAsJSONEn(figuresArray) {
    const data = { heritageFigures: figuresArray };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `figures-en-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // ===== ENGLISH NEWS CRUD =====
  openNewsModalEn(id = null) {
    const form = document.getElementById('newsFormEn');
    form.reset();
    this.currentEditId = id;

    if (id) {
      document.getElementById('newsModalTitleEn').textContent = 'Edit Article';
      const article = window.newsDataEn.find(a => a.id === id);
      if (article) {
        document.getElementById('newsTitleEn').value = article.title || '';
        document.getElementById('newsCategoryEn').value = article.category || '';
        document.getElementById('newsDateEn').value = article.date || '';
        document.getElementById('newsImageEn').value = article.featured_image || '';
        document.getElementById('newsDescriptionEn').value = article.description || '';
        document.getElementById('newsContentEn').value = article.content || '';
        document.getElementById('newsAuthorEn').value = article.author || '';
        document.getElementById('newsPublishedEn').checked = article.published !== false;
      }
    } else {
      document.getElementById('newsModalTitleEn').textContent = 'Add Article';
      document.getElementById('newsDateEn').valueAsDate = new Date();
    }

    this.openModal('newsModalEn');
  }

  async saveNewsEn(e) {
    e.preventDefault();

    const title = document.getElementById('newsTitleEn').value.trim();
    const category = document.getElementById('newsCategoryEn').value.trim();
    const date = document.getElementById('newsDateEn').value.trim();
    const featured_image = document.getElementById('newsImageEn').value.trim();
    const description = document.getElementById('newsDescriptionEn').value.trim();
    const content = document.getElementById('newsContentEn').value.trim();
    const author = document.getElementById('newsAuthorEn').value.trim();
    const published = document.getElementById('newsPublishedEn').checked;

    if (!title) {
      this.showError('Title is required');
      return;
    }

    const formData = {
      id: this.currentEditId || Date.now(),
      slug: this.generateSlug(title),
      title: title,
      description: description || title.substring(0, 100),
      category: category,
      date: date || new Date().toISOString().split('T')[0],
      publishedTime: new Date().toISOString(),
      featured_image: featured_image,
      images: featured_image ? [featured_image] : [],
      content: content,
      author: author || 'Living Heritage',
      keywords: category,
      published: published,
      created: this.currentEditId ? (window.newsDataEn.find(a => a.id === this.currentEditId)?.created || new Date().toISOString()) : new Date().toISOString(),
      updated: new Date().toISOString()
    };

    if (this.currentEditId) {
      window.newsDataEn = window.newsDataEn.map(a => a.id === this.currentEditId ? formData : a);
      this.showSuccess('English article updated successfully');
    } else {
      window.newsDataEn.push(formData);
      this.showSuccess('English article created successfully');
    }

    await this.saveNewsToFileEn(window.newsDataEn);
    this.closeModal('newsModalEn');
    this.loadNewsEn();
    this.updateStats();
  }

  loadNewsEn() {
    const tbody = document.getElementById('newsTableBodyEn');

    if (!window.newsDataEn || window.newsDataEn.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px; color: #999;"><i class="fas fa-inbox" style="font-size: 32px; margin-bottom: 10px; display: block;"></i>No English articles yet.</td></tr>';
      return;
    }

    const sortedNews = [...window.newsDataEn].sort((a, b) => new Date(b.date) - new Date(a.date));

    tbody.innerHTML = sortedNews.map(article => `
      <tr>
        <td>${article.title}</td>
        <td>${article.category || '-'}</td>
        <td>${new Date(article.date).toLocaleDateString()}</td>
        <td><span class="badge" style="background: ${article.published ? '#28a745' : '#dc3545'}; color: white; padding: 4px 8px; border-radius: 3px; font-size: 11px;">${article.published ? 'Published' : 'Draft'}</span></td>
        <td class="admin-table-actions">
          <button class="btn btn-small btn-secondary" onclick="admin.openNewsModalEn(${article.id})"><i class="fas fa-edit"></i> Edit</button>
          <button class="btn btn-small btn-danger" onclick="admin.deleteNewsEn(${article.id})"><i class="fas fa-trash"></i> Delete</button>
        </td>
      </tr>
    `).join('');
  }

  async deleteNewsEn(id) {
    if (confirm('Are you sure you want to delete this English article?')) {
      window.newsDataEn = window.newsDataEn.filter(a => a.id !== id);
      await this.saveNewsToFileEn(window.newsDataEn);
      this.showSuccess('English article deleted');
      this.loadNewsEn();
      this.updateStats();
    }
  }

  // ===== ENGLISH PROFILES CRUD =====
  openProfileModalEn(id = null) {
    const form = document.getElementById('profilesFormEn');
    form.reset();
    this.currentEditId = id;

    // Clear dynamic containers
    document.getElementById('sectionsContainerEn').innerHTML = '';
    document.getElementById('highlightsContainerEn').innerHTML = '';

    if (id) {
      document.getElementById('profilesModalTitleEn').textContent = 'Edit Profile';
      const figure = window.figuresDataEn.find(f => f.id === id);
      if (figure) {
        // Basic info
        document.getElementById('profileFullNameEn').value = figure.fullName || '';
        document.getElementById('profileTitleEn').value = figure.title || '';
        document.getElementById('profileCategoryEn').value = figure.category || '';
        document.getElementById('profileHeaderLetterEn').value = figure.headerLetter || '';

        // Images
        document.getElementById('profileImageEn').value = figure.imageUrl || '';
        document.getElementById('profileSmallImageEn').value = figure.smallImageUrl || '';
        document.getElementById('profileHeroImageEn').value = figure.heroImageUrl || '';

        // Summary & Introduction
        if (figure.summary && Array.isArray(figure.summary)) {
          document.getElementById('profileSummaryEn').value = figure.summary.join('\n');
        }
        document.getElementById('profileIntroductionEn').value = figure.introduction || '';

        // Quote
        document.getElementById('profileQuoteEn').value = figure.quote || '';

        // Sections
        if (figure.sections && Array.isArray(figure.sections)) {
          figure.sections.forEach(section => {
            this.addSectionFieldEn(section.title, section.type, section.content || section.items?.join('\n') || '');
          });
        }

        // Highlights
        if (figure.highlights && Array.isArray(figure.highlights)) {
          figure.highlights.forEach(highlight => {
            const answerText = Array.isArray(highlight.answer) ? highlight.answer.join('\n') : highlight.answer;
            this.addHighlightFieldEn(highlight.question, answerText);
          });
        }

        document.getElementById('profilePublishedEn').checked = figure.published !== false;
      }
    } else {
      document.getElementById('profilesModalTitleEn').textContent = 'Add Profile';
    }

    // Setup event listeners for dynamic buttons
    document.getElementById('addSectionBtnEn').onclick = (e) => {
      e.preventDefault();
      this.addSectionFieldEn('', 'text', '');
    };

    document.getElementById('addHighlightBtnEn').onclick = (e) => {
      e.preventDefault();
      this.addHighlightFieldEn('', '');
    };

    this.openModal('profilesModalEn');
  }

  async saveProfileEn(e) {
    e.preventDefault();

    const name = document.getElementById('profileFullNameEn').value.trim();
    const title = document.getElementById('profileTitleEn').value.trim();
    const category = document.getElementById('profileCategoryEn').value.trim();
    const headerLetter = document.getElementById('profileHeaderLetterEn').value.trim();
    const image = document.getElementById('profileImageEn').value.trim();
    const smallImage = document.getElementById('profileSmallImageEn').value.trim();
    const heroImage = document.getElementById('profileHeroImageEn').value.trim();
    const published = document.getElementById('profilePublishedEn').checked;

    // Summary (split by lines)
    const summaryText = document.getElementById('profileSummaryEn').value.trim();
    const summary = summaryText ? summaryText.split('\n').map(s => s.trim()).filter(s => s) : [];

    // Introduction
    const introduction = document.getElementById('profileIntroductionEn').value.trim();

    // Quote
    const quote = document.getElementById('profileQuoteEn').value.trim();

    // Sections
    const sections = [];
    document.querySelectorAll('.section-field-en').forEach(field => {
      const sectionTitle = field.querySelector('.section-title-en').value.trim();
      const sectionType = field.querySelector('.section-type-en').value;
      const sectionContent = field.querySelector('.section-content-en').value.trim();

      if (sectionTitle && sectionContent) {
        if (sectionType === 'list') {
          sections.push({
            title: sectionTitle,
            type: 'list',
            items: sectionContent.split('\n').map(s => s.trim()).filter(s => s)
          });
        } else {
          sections.push({
            title: sectionTitle,
            type: 'text',
            content: sectionContent
          });
        }
      }
    });

    // Highlights
    const highlights = [];
    document.querySelectorAll('.highlight-field-en').forEach(field => {
      const question = field.querySelector('.highlight-question-en').value.trim();
      const answerText = field.querySelector('.highlight-answer-en').value.trim();

      if (question && answerText) {
        highlights.push({
          question: question,
          answer: answerText.split('\n').map(s => s.trim()).filter(s => s)
        });
      }
    });

    if (!name || !title) {
      this.showError('Name and Title are required');
      return;
    }

    if (this.currentEditId) {
      // Edit existing figure
      const figure = window.figuresDataEn.find(f => f.id === this.currentEditId);
      if (figure) {
        figure.fullName = name;
        figure.title = title;
        figure.category = category;
        figure.headerLetter = headerLetter;
        figure.imageUrl = image;
        figure.smallImageUrl = smallImage;
        figure.heroImageUrl = heroImage;
        figure.summary = summary;
        figure.introduction = introduction;
        figure.sections = sections;
        figure.quote = quote;
        figure.highlights = highlights;
        figure.published = published;
        figure.updatedAt = new Date().toISOString();
      }
      this.showSuccess('English profile updated successfully');
    } else {
      // Add new figure
      const newId = Math.max(0, ...window.figuresDataEn.map(f => f.id)) + 1;
      const newFigure = {
        id: newId,
        fullName: name,
        title: title,
        category: category,
        headerLetter: headerLetter,
        imageUrl: image,
        smallImageUrl: smallImage,
        heroImageUrl: heroImage,
        summary: summary,
        introduction: introduction,
        sections: sections,
        quote: quote,
        highlights: highlights,
        urlSlug: this.generateSlug(name),
        published: published,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      window.figuresDataEn.push(newFigure);
      this.showSuccess('English profile created successfully');
    }

    await this.saveFiguresToFileEn(window.figuresDataEn);
    this.closeModal('profilesModalEn');
    this.loadProfilesEn();
    this.updateStats();
  }

  loadProfilesEn() {
    const tbody = document.getElementById('profilesTableBodyEn');

    if (!window.figuresDataEn || window.figuresDataEn.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px; color: #999;"><i class="fas fa-inbox" style="font-size: 32px; margin-bottom: 10px; display: block;"></i>No English profiles yet.</td></tr>';
      return;
    }

    tbody.innerHTML = window.figuresDataEn.map(figure => `
      <tr>
        <td>${figure.fullName}</td>
        <td>${figure.title}</td>
        <td>${figure.urlSlug || '-'}</td>
        <td><span class="badge" style="background: ${figure.published ? '#28a745' : '#dc3545'}; color: white; padding: 4px 8px; border-radius: 3px; font-size: 11px;">${figure.published ? 'Published' : 'Draft'}</span></td>
        <td class="admin-table-actions">
          <button class="btn btn-small btn-secondary" onclick="admin.openProfileModalEn(${figure.id})"><i class="fas fa-edit"></i> Edit</button>
          <button class="btn btn-small btn-danger" onclick="admin.deleteProfileEn(${figure.id})"><i class="fas fa-trash"></i> Delete</button>
        </td>
      </tr>
    `).join('');
  }

  async deleteProfileEn(id) {
    if (confirm('Are you sure you want to delete this English heritage figure?')) {
      window.figuresDataEn = window.figuresDataEn.filter(f => f.id !== id);
      await this.saveFiguresToFileEn(window.figuresDataEn);
      this.showSuccess('English heritage figure deleted');
      this.loadProfilesEn();
      this.updateStats();
    }
  }

  addSectionFieldEn(title = '', type = 'text', content = '') {
    const container = document.getElementById('sectionsContainerEn');
    const index = container.children.length;
    const sectionHtml = `
      <div class="form-group section-field-en" style="border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 4px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <label style="font-weight: bold; margin: 0;">Section ${index + 1}</label>
          <button type="button" class="btn btn-small btn-danger" onclick="this.closest('.section-field-en').remove()">
            <i class="fas fa-times"></i> Remove
          </button>
        </div>
        <div class="form-group">
          <label>Section Title</label>
          <input type="text" class="section-title-en" placeholder="e.g., Education, Career" value="${title}">
        </div>
        <div class="form-group">
          <label>Content Type</label>
          <select class="section-type-en">
            <option value="text" ${type === 'text' ? 'selected' : ''}>Text Paragraphs</option>
            <option value="list" ${type === 'list' ? 'selected' : ''}>Bullet List</option>
          </select>
        </div>
        <div class="form-group">
          <label>Content (one per line for lists)</label>
          <textarea class="section-content-en" placeholder="Enter content..." style="min-height: 80px;">${content}</textarea>
        </div>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', sectionHtml);
  }

  addHighlightFieldEn(question = '', answer = '') {
    const container = document.getElementById('highlightsContainerEn');
    const index = container.children.length;
    const highlightHtml = `
      <div class="form-group highlight-field-en" style="border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 4px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <label style="font-weight: bold; margin: 0;">Q&A ${index + 1}</label>
          <button type="button" class="btn btn-small btn-danger" onclick="this.closest('.highlight-field-en').remove()">
            <i class="fas fa-times"></i> Remove
          </button>
        </div>
        <div class="form-group">
          <label>Question</label>
          <input type="text" class="highlight-question-en" placeholder="What is your question?" value="${question}">
        </div>
        <div class="form-group">
          <label>Answer (one paragraph per line)</label>
          <textarea class="highlight-answer-en" placeholder="Enter answer paragraphs..." style="min-height: 80px;">${answer}</textarea>
        </div>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', highlightHtml);
  }

  // ===== ENGLISH TIPS CRUD =====
  openTipModalEn(id = null) {
    const form = document.getElementById('tipsFormEn');
    form.reset();
    this.currentEditId = id;

    if (id) {
      document.getElementById('tipsModalTitleEn').textContent = 'Edit Wellness Tip';
      const tip = window.tipsDataEn.find(t => t.id === id);
      if (tip) {
        document.getElementById('tipTitleEn').value = tip.title || '';
        document.getElementById('tipDescriptionEn').value = tip.description || '';
        document.getElementById('tipCategoryEn').value = tip.category || '';
        document.getElementById('tipImageEn').value = tip.imageUrl || '';
        document.getElementById('tipContentEn').value = tip.content || '';
        document.getElementById('tipPublishedEn').checked = tip.published !== false;
      }
    } else {
      document.getElementById('tipsModalTitleEn').textContent = 'Add Wellness Tip';
    }

    this.openModal('tipsModalEn');
  }

  async saveTipEn(e) {
    e.preventDefault();
    const title = document.getElementById('tipTitleEn').value.trim();
    const description = document.getElementById('tipDescriptionEn').value.trim();
    const category = document.getElementById('tipCategoryEn').value.trim();
    const imageUrl = document.getElementById('tipImageEn').value.trim();
    const content = document.getElementById('tipContentEn').value.trim();
    const published = document.getElementById('tipPublishedEn').checked;

    if (!title) {
      this.showError('Title is required');
      return;
    }

    const formData = {
      id: this.currentEditId || Date.now(),
      title: title,
      description: description,
      category: category,
      imageUrl: imageUrl,
      content: content,
      urlSlug: this.generateSlug(title),
      altText: title,
      published: published,
      createdAt: this.currentEditId ? (window.tipsDataEn.find(t => t.id === this.currentEditId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (this.currentEditId) {
      window.tipsDataEn = window.tipsDataEn.map(t => t.id === this.currentEditId ? formData : t);
      this.showSuccess('English tip updated successfully');
    } else {
      window.tipsDataEn.push(formData);
      this.showSuccess('English tip created successfully');
    }

    await this.saveTipsToFileEn(window.tipsDataEn);
    this.closeModal('tipsModalEn');
    this.loadTipsEn();
    this.updateStats();
  }

  loadTipsEn() {
    const tbody = document.getElementById('tipsTableBodyEn');

    if (!window.tipsDataEn || window.tipsDataEn.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 30px; color: #999;"><i class="fas fa-inbox" style="font-size: 32px; margin-bottom: 10px; display: block;"></i>No English tips yet.</td></tr>';
      return;
    }

    tbody.innerHTML = window.tipsDataEn.map(tip => `
      <tr>
        <td>${tip.title}</td>
        <td>${tip.category || '-'}</td>
        <td><span class="badge" style="background: ${tip.published ? '#28a745' : '#dc3545'}; color: white; padding: 4px 8px; border-radius: 3px; font-size: 11px;">${tip.published ? 'Published' : 'Draft'}</span></td>
        <td class="admin-table-actions">
          <button class="btn btn-small btn-secondary" onclick="admin.openTipModalEn(${tip.id})"><i class="fas fa-edit"></i> Edit</button>
          <button class="btn btn-small btn-danger" onclick="admin.deleteTipEn(${tip.id})"><i class="fas fa-trash"></i> Delete</button>
        </td>
      </tr>
    `).join('');
  }

  async deleteTipEn(id) {
    if (confirm('Are you sure you want to delete this English tip?')) {
      window.tipsDataEn = window.tipsDataEn.filter(t => t.id !== id);
      await this.saveTipsToFileEn(window.tipsDataEn);
      this.showSuccess('English tip deleted');
      this.loadTipsEn();
      this.updateStats();
    }
  }
}

// Initialize admin panel when DOM is ready
let admin;
document.addEventListener('DOMContentLoaded', async () => {
  admin = new AdminPanel();
  // Load data from API/JSON
  await admin.initializeData();
  console.log('✓ Admin panel initialized with data');
});
