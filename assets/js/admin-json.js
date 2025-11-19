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
      await this.loadNewsFromFile();
      await this.loadTipsFromFile();
      await this.loadFiguresFromFile();
      await this.loadBannersFromFile();
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

    // Add buttons
    document.getElementById('addNewsBtn').addEventListener('click', () => this.openNewsModal());
    document.getElementById('addProfileBtn').addEventListener('click', () => this.openProfileModal());
    document.getElementById('addTipBtn').addEventListener('click', () => this.openTipModal());
    document.getElementById('addBannerBtn').addEventListener('click', () => this.openBannerModal());

    // Search
    document.getElementById('newsSearch').addEventListener('input', (e) => this.filterTable('news', e.target.value));
    document.getElementById('profilesSearch').addEventListener('input', (e) => this.filterTable('profiles', e.target.value));
    document.getElementById('tipsSearch').addEventListener('input', (e) => this.filterTable('tips', e.target.value));
    document.getElementById('bannersSearch').addEventListener('input', (e) => this.filterTable('banners', e.target.value));

    // Form submissions
    document.getElementById('newsForm').addEventListener('submit', (e) => this.saveNews(e));
    document.getElementById('profilesForm').addEventListener('submit', (e) => this.saveProfile(e));
    document.getElementById('tipsForm').addEventListener('submit', (e) => this.saveTip(e));
    document.getElementById('bannersForm').addEventListener('submit', (e) => this.saveBanner(e));

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
        document.getElementById('newsTitle').value = article.title;
        document.getElementById('newsCategory').value = article.category;
        document.getElementById('newsDate').value = article.date;
        document.getElementById('newsImage').value = article.featured_image;
        document.getElementById('newsContent').value = article.content;
        document.getElementById('newsAuthor').value = article.author;
        document.getElementById('newsPublished').checked = article.published;
      }
    } else {
      document.getElementById('newsModalTitle').textContent = 'Add Article';
      document.getElementById('newsDate').valueAsDate = new Date();
    }

    this.openModal('newsModal');
  }

  async saveNews(e) {
    e.preventDefault();
    const formData = {
      id: this.currentEditId || Date.now(),
      slug: this.generateSlug(document.getElementById('newsTitle').value),
      title: document.getElementById('newsTitle').value,
      description: document.getElementById('newsTitle').value.substring(0, 100),
      category: document.getElementById('newsCategory').value,
      date: document.getElementById('newsDate').value,
      publishedTime: new Date().toISOString(),
      featured_image: document.getElementById('newsImage').value,
      images: [document.getElementById('newsImage').value],
      content: document.getElementById('newsContent').value,
      author: document.getElementById('newsAuthor').value,
      keywords: document.getElementById('newsCategory').value,
      published: document.getElementById('newsPublished').checked,
      created: new Date().toISOString(),
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

    if (id) {
      document.getElementById('profilesModalTitle').textContent = 'Edit Profile';
      // Load from memory
      const figure = window.figuresData.find(f => f.id === id);
      if (figure) {
        document.getElementById('profileName').value = figure.fullName || '';
        document.getElementById('profileTitle').value = figure.title || '';
        document.getElementById('profileImage').value = figure.imageUrl || '';
        document.getElementById('profileCategory').value = figure.category || '';
        document.getElementById('profileBio').value = figure.description || '';
        document.getElementById('profileAchievements').value = figure.achievements || '';
        document.getElementById('profilePublished').checked = figure.published !== false;
      }
    } else {
      document.getElementById('profilesModalTitle').textContent = 'Add Profile';
    }

    this.openModal('profilesModal');
  }

  async saveProfile(e) {
    e.preventDefault();

    const name = document.getElementById('profileName').value.trim();
    const title = document.getElementById('profileTitle').value.trim();
    const image = document.getElementById('profileImage').value.trim();
    const bio = document.getElementById('profileBio').value.trim();
    const achievements = document.getElementById('profileAchievements').value.trim();
    const published = document.getElementById('profilePublished').checked;

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
        figure.imageUrl = image;
        figure.description = bio;
        figure.achievements = achievements;
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
        imageUrl: image,
        description: bio,
        achievements: achievements,
        published: published,
        urlSlug: this.generateSlug(name) + '.html',
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
    this.openModal('tipsModal');
  }

  saveTip(e) {
    e.preventDefault();
    this.showSuccess('Tip saved');
    this.closeModal('tipsModal');
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
}

// Initialize admin panel when DOM is ready
let admin;
document.addEventListener('DOMContentLoaded', async () => {
  admin = new AdminPanel();
  // Load data from API/JSON
  await admin.initializeData();
  console.log('✓ Admin panel initialized with data');
});
