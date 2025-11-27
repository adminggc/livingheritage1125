/**
 * Living Heritage - Admin Panel JavaScript
 * Handles authentication, CRUD operations, and data management
 */

class AdminPanel {
  constructor() {
    this.currentUser = null;
    this.currentEditId = null;
    this.currentType = null;
    this.initializeData();
    this.setupEventListeners();
    this.checkAuth();
  }

  // ===== INITIALIZATION =====
  initializeData() {
    const data = localStorage.getItem('livingHeritageCMS');
    if (!data) {
      const defaultData = {
        news: [],
        profiles: [],
        tips: [],
        banners: []
      };
      localStorage.setItem('livingHeritageCMS', JSON.stringify(defaultData));
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

    // Modal footer cancel buttons
    document.querySelectorAll('[data-modal]').forEach(btn => {
      if (btn.classList.contains('btn-secondary') && btn.textContent.includes('Cancel')) {
        btn.addEventListener('click', (e) => {
          const modal = btn.closest('.modal-overlay');
          if (modal) {
            this.closeModal(modal.id);
          }
        });
      }
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
    document.getElementById('exportDataBtn').addEventListener('click', () => this.exportData());
    document.getElementById('importDataBtn').addEventListener('click', () => {
      document.getElementById('importFile').click();
    });
    document.getElementById('importFile').addEventListener('change', (e) => this.importData(e));
    document.getElementById('clearDataBtn').addEventListener('click', () => this.clearAllData());
    document.getElementById('resetDataBtn').addEventListener('click', () => this.resetToDefault());
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
    this.loadAllData();
    this.updateStats();

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

  // ===== DATA MANAGEMENT =====
  getData() {
    return JSON.parse(localStorage.getItem('livingHeritageCMS')) || {
      news: [],
      profiles: [],
      tips: [],
      banners: []
    };
  }

  saveData(data) {
    localStorage.setItem('livingHeritageCMS', JSON.stringify(data));
  }

  // ===== NEWS CRUD =====
  openNewsModal(id = null) {
    const form = document.getElementById('newsForm');
    form.reset();
    this.currentEditId = id;

    if (id) {
      document.getElementById('newsModalTitle').textContent = 'Edit Article';
      const data = this.getData();
      const article = data.news.find(a => a.id === id);
      if (article) {
        document.getElementById('newsTitle').value = article.title;
        document.getElementById('newsCategory').value = article.category;
        document.getElementById('newsDate').value = article.date;
        document.getElementById('newsImage').value = article.image;
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

  saveNews(e) {
    e.preventDefault();
    const data = this.getData();
    const formData = {
      id: this.currentEditId || Date.now(),
      title: document.getElementById('newsTitle').value,
      category: document.getElementById('newsCategory').value,
      date: document.getElementById('newsDate').value,
      image: document.getElementById('newsImage').value,
      content: document.getElementById('newsContent').value,
      author: document.getElementById('newsAuthor').value,
      published: document.getElementById('newsPublished').checked,
      created: new Date().toISOString()
    };

    if (this.currentEditId) {
      data.news = data.news.map(a => a.id === this.currentEditId ? formData : a);
      this.showSuccess('Article updated successfully');
    } else {
      data.news.push(formData);
      this.showSuccess('Article created successfully');
    }

    this.saveData(data);
    this.closeModal('newsModal');
    this.loadNews();
    this.updateStats();
  }

  loadNews() {
    const data = this.getData();
    const tbody = document.getElementById('newsTableBody');

    if (data.news.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px; color: #999;"><i class="fas fa-inbox" style="font-size: 32px; margin-bottom: 10px; display: block;"></i>No articles yet.</td></tr>';
      return;
    }

    tbody.innerHTML = data.news.map(article => `
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

  deleteNews(id) {
    if (confirm('Are you sure you want to delete this article?')) {
      const data = this.getData();
      data.news = data.news.filter(a => a.id !== id);
      this.saveData(data);
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
      const data = this.getData();
      const profile = data.profiles.find(p => p.id === id);
      if (profile) {
        document.getElementById('profileName').value = profile.name;
        document.getElementById('profileTitle').value = profile.title;
        document.getElementById('profileCategory').value = profile.category;
        document.getElementById('profileImage').value = profile.image;
        document.getElementById('profileBio').value = profile.bio;
        document.getElementById('profileAchievements').value = profile.achievements;
        document.getElementById('profilePublished').checked = profile.published;
      }
    } else {
      document.getElementById('profilesModalTitle').textContent = 'Add Profile';
    }

    this.openModal('profilesModal');
  }

  saveProfile(e) {
    e.preventDefault();
    const data = this.getData();
    const formData = {
      id: this.currentEditId || Date.now(),
      name: document.getElementById('profileName').value,
      title: document.getElementById('profileTitle').value,
      category: document.getElementById('profileCategory').value,
      image: document.getElementById('profileImage').value,
      bio: document.getElementById('profileBio').value,
      achievements: document.getElementById('profileAchievements').value,
      published: document.getElementById('profilePublished').checked,
      created: new Date().toISOString()
    };

    if (this.currentEditId) {
      data.profiles = data.profiles.map(p => p.id === this.currentEditId ? formData : p);
      this.showSuccess('Profile updated successfully');
    } else {
      data.profiles.push(formData);
      this.showSuccess('Profile created successfully');
    }

    this.saveData(data);
    this.closeModal('profilesModal');
    this.loadProfiles();
    this.updateStats();
  }

  loadProfiles() {
    const data = this.getData();
    const tbody = document.getElementById('profilesTableBody');

    if (data.profiles.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px; color: #999;"><i class="fas fa-inbox" style="font-size: 32px; margin-bottom: 10px; display: block;"></i>No profiles yet.</td></tr>';
      return;
    }

    tbody.innerHTML = data.profiles.map(profile => `
      <tr>
        <td>${profile.name}</td>
        <td>${profile.title}</td>
        <td>${profile.category || '-'}</td>
        <td><span class="badge" style="background: ${profile.published ? '#28a745' : '#dc3545'}; color: white; padding: 4px 8px; border-radius: 3px; font-size: 11px;">${profile.published ? 'Published' : 'Draft'}</span></td>
        <td class="admin-table-actions">
          <button class="btn btn-small btn-secondary" onclick="admin.openProfileModal(${profile.id})"><i class="fas fa-edit"></i> Edit</button>
          <button class="btn btn-small btn-danger" onclick="admin.deleteProfile(${profile.id})"><i class="fas fa-trash"></i> Delete</button>
        </td>
      </tr>
    `).join('');
  }

  deleteProfile(id) {
    if (confirm('Are you sure you want to delete this profile?')) {
      const data = this.getData();
      data.profiles = data.profiles.filter(p => p.id !== id);
      this.saveData(data);
      this.showSuccess('Profile deleted');
      this.loadProfiles();
      this.updateStats();
    }
  }

  // ===== TIPS CRUD =====
  openTipModal(id = null) {
    const form = document.getElementById('tipsForm');
    form.reset();
    this.currentEditId = id;

    if (id) {
      document.getElementById('tipsModalTitle').textContent = 'Edit Tip';
      const data = this.getData();
      const tip = data.tips.find(t => t.id === id);
      if (tip) {
        document.getElementById('tipTitle').value = tip.title;
        document.getElementById('tipCategory').value = tip.category;
        document.getElementById('tipImage').value = tip.image;
        document.getElementById('tipContent').value = tip.content;
        document.getElementById('tipPublished').checked = tip.published;
      }
    } else {
      document.getElementById('tipsModalTitle').textContent = 'Add Tip';
    }

    this.openModal('tipsModal');
  }

  saveTip(e) {
    e.preventDefault();
    const data = this.getData();
    const formData = {
      id: this.currentEditId || Date.now(),
      title: document.getElementById('tipTitle').value,
      category: document.getElementById('tipCategory').value,
      image: document.getElementById('tipImage').value,
      content: document.getElementById('tipContent').value,
      published: document.getElementById('tipPublished').checked,
      created: new Date().toISOString()
    };

    if (this.currentEditId) {
      data.tips = data.tips.map(t => t.id === this.currentEditId ? formData : t);
      this.showSuccess('Tip updated successfully');
    } else {
      data.tips.push(formData);
      this.showSuccess('Tip created successfully');
    }

    this.saveData(data);
    this.closeModal('tipsModal');
    this.loadTips();
    this.updateStats();
  }

  loadTips() {
    const data = this.getData();
    const tbody = document.getElementById('tipsTableBody');

    if (data.tips.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 30px; color: #999;"><i class="fas fa-inbox" style="font-size: 32px; margin-bottom: 10px; display: block;"></i>No tips yet.</td></tr>';
      return;
    }

    tbody.innerHTML = data.tips.map(tip => `
      <tr>
        <td>${tip.title}</td>
        <td>${tip.category || '-'}</td>
        <td><span class="badge" style="background: ${tip.published ? '#28a745' : '#dc3545'}; color: white; padding: 4px 8px; border-radius: 3px; font-size: 11px;">${tip.published ? 'Published' : 'Draft'}</span></td>
        <td class="admin-table-actions">
          <button class="btn btn-small btn-secondary" onclick="admin.openTipModal(${tip.id})"><i class="fas fa-edit"></i> Edit</button>
          <button class="btn btn-small btn-danger" onclick="admin.deleteTip(${tip.id})"><i class="fas fa-trash"></i> Delete</button>
        </td>
      </tr>
    `).join('');
  }

  deleteTip(id) {
    if (confirm('Are you sure you want to delete this tip?')) {
      const data = this.getData();
      data.tips = data.tips.filter(t => t.id !== id);
      this.saveData(data);
      this.showSuccess('Tip deleted');
      this.loadTips();
      this.updateStats();
    }
  }

  // ===== BANNERS CRUD =====
  openBannerModal(id = null) {
    const form = document.getElementById('bannersForm');
    form.reset();
    this.currentEditId = id;

    if (id) {
      document.getElementById('bannersModalTitle').textContent = 'Edit Banner';
      const data = this.getData();
      const banner = data.banners.find(b => b.id === id);
      if (banner) {
        document.getElementById('bannerTitle').value = banner.title;
        document.getElementById('bannerImage').value = banner.image;
        document.getElementById('bannerLink').value = banner.link;
        document.getElementById('bannerPosition').value = banner.position;
        document.getElementById('bannerText').value = banner.text;
        document.getElementById('bannerActive').checked = banner.active;
      }
    } else {
      document.getElementById('bannersModalTitle').textContent = 'Add Banner';
    }

    this.openModal('bannersModal');
  }

  saveBanner(e) {
    e.preventDefault();
    const data = this.getData();
    const formData = {
      id: this.currentEditId || Date.now(),
      title: document.getElementById('bannerTitle').value,
      image: document.getElementById('bannerImage').value,
      link: document.getElementById('bannerLink').value,
      position: parseInt(document.getElementById('bannerPosition').value),
      text: document.getElementById('bannerText').value,
      active: document.getElementById('bannerActive').checked,
      created: new Date().toISOString()
    };

    if (this.currentEditId) {
      data.banners = data.banners.map(b => b.id === this.currentEditId ? formData : b);
      this.showSuccess('Banner updated successfully');
    } else {
      data.banners.push(formData);
      this.showSuccess('Banner created successfully');
    }

    this.saveData(data);
    this.closeModal('bannersModal');
    this.loadBanners();
    this.updateStats();
  }

  loadBanners() {
    const data = this.getData();
    const tbody = document.getElementById('bannersTableBody');

    if (data.banners.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px; color: #999;"><i class="fas fa-inbox" style="font-size: 32px; margin-bottom: 10px; display: block;"></i>No banners yet.</td></tr>';
      return;
    }

    tbody.innerHTML = data.banners.map(banner => `
      <tr>
        <td>${banner.title}</td>
        <td>${banner.image ? '<i class="fas fa-check" style="color: green;"></i> Yes' : '-'}</td>
        <td>${banner.position}</td>
        <td><span class="badge" style="background: ${banner.active ? '#28a745' : '#dc3545'}; color: white; padding: 4px 8px; border-radius: 3px; font-size: 11px;">${banner.active ? 'Active' : 'Inactive'}</span></td>
        <td class="admin-table-actions">
          <button class="btn btn-small btn-secondary" onclick="admin.openBannerModal(${banner.id})"><i class="fas fa-edit"></i> Edit</button>
          <button class="btn btn-small btn-danger" onclick="admin.deleteBanner(${banner.id})"><i class="fas fa-trash"></i> Delete</button>
        </td>
      </tr>
    `).join('');
  }

  deleteBanner(id) {
    if (confirm('Are you sure you want to delete this banner?')) {
      const data = this.getData();
      data.banners = data.banners.filter(b => b.id !== id);
      this.saveData(data);
      this.showSuccess('Banner deleted');
      this.loadBanners();
      this.updateStats();
    }
  }

  // ===== UTILITY METHODS =====
  openModal(modalId) {
    document.getElementById(modalId).classList.add('show');
  }

  closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
  }

  loadAllData() {
    this.loadNews();
    this.loadProfiles();
    this.loadTips();
    this.loadBanners();
  }

  updateStats() {
    const data = this.getData();
    document.getElementById('statNews').textContent = data.news.length;
    document.getElementById('statProfiles').textContent = data.profiles.length;
    document.getElementById('statTips').textContent = data.tips.length;
    document.getElementById('statBanners').textContent = data.banners.length;
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
  exportData() {
    const data = this.getData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `living-heritage-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    this.showSuccess('Data exported successfully');
  }

  importData(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.news && data.profiles && data.tips && data.banners) {
          this.saveData(data);
          this.loadAllData();
          this.updateStats();
          this.showSuccess('Data imported successfully');
        } else {
          this.showError('Invalid data format');
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
        const emptyData = { news: [], profiles: [], tips: [], banners: [] };
        this.saveData(emptyData);
        this.loadAllData();
        this.updateStats();
        this.showSuccess('All data cleared');
      }
    }
  }

  resetToDefault() {
    if (confirm('Reset all data to demo content? This will replace existing data.')) {
      const demoData = {
        news: [
          {
            id: 1001,
            title: "Jazz Legend Returns: Niels Lan Doky Concert Review",
            category: "Jazz",
            date: new Date().toISOString().split('T')[0],
            image: "/assets/media/shared/news/default.jpg",
            content: "An inspiring evening of jazz music celebrating heritage and culture.",
            author: "Living Heritage",
            published: true,
            created: new Date().toISOString()
          }
        ],
        profiles: [
          {
            id: 2001,
            name: "Sir Niels Lan Doky",
            title: "Jazz Legend",
            category: "Music",
            image: "/assets/media/people-heritage/niels-lan-doky.jpg",
            bio: "Knight of Jazz, inspiring musician and cultural ambassador",
            achievements: "Grammy Nominations\nInternational Jazz Performer\nCultural Heritage Advocate",
            published: true,
            created: new Date().toISOString()
          }
        ],
        tips: [
          {
            id: 3001,
            title: "The Power of Mindfulness in Daily Life",
            category: "Wellness",
            image: "/assets/media/tips/mindfulness.jpg",
            content: "Discover how mindfulness can improve your mental health and well-being.",
            published: true,
            created: new Date().toISOString()
          }
        ],
        banners: [
          {
            id: 4001,
            title: "Welcome to Living Heritage",
            image: "/assets/img/shared/index/banner1.jpg",
            link: "/",
            position: 1,
            text: "Celebrating Cultural Heritage",
            active: true,
            created: new Date().toISOString()
          }
        ]
      };

      this.saveData(demoData);
      this.loadAllData();
      this.updateStats();
      this.showSuccess('Demo data loaded');
    }
  }
}

// Initialize admin panel when DOM is ready
let admin;
document.addEventListener('DOMContentLoaded', () => {
  admin = new AdminPanel();
});
