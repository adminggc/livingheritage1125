/**
 * Living Heritage Admin Panel - PostgreSQL Version
 * Connects to PostgreSQL backend via REST API
 */

class LivingHeritageAdminDB {
  constructor() {
    this.currentUser = null;
    this.currentEditId = null;
    this.API_BASE = '/api';
    this.init();
  }

  // ===== HELPER METHODS =====
  generateSlug(text) {
    if (!text) return '';
    // Vietnamese character mapping - normalize accented characters
    const vietnameseMap = {
      'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
      'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
      'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
      'đ': 'd',
      'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
      'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
      'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
      'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
      'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
      'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
      'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
      'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
      'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y'
    };

    return text
      .toLowerCase()
      .split('')
      .map(char => vietnameseMap[char] || char)
      .join('')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  addHighlight(language = 'vi') {
    const containerId = language === 'en' ? 'highlightsContainerEn' : 'highlightsContainer';
    const container = document.getElementById(containerId);
    if (!container) return;

    const highlightId = `highlight-${Date.now()}`;
    const highlightDiv = document.createElement('div');
    highlightDiv.className = 'highlight-item';
    highlightDiv.id = highlightId;
    highlightDiv.style.cssText = 'border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 4px; background: #f9f9f9;';

    highlightDiv.innerHTML = `
      <div class="form-group">
        <label>Question</label>
        <input type="text" class="highlight-question" placeholder="e.g., What is your role?" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 3px; box-sizing: border-box;">
      </div>
      <div class="form-group">
        <label>Answer</label>
        <textarea class="highlight-answer" placeholder="Enter the answer (use line breaks for multiple paragraphs)" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 3px; box-sizing: border-box; min-height: 80px; resize: vertical;"></textarea>
      </div>
      <button type="button" class="btn btn-danger btn-sm" onclick="adminPanel.removeHighlight('${highlightId}')">Remove Q&A</button>
    `;

    container.appendChild(highlightDiv);
  }

  removeHighlight(highlightId) {
    const highlightDiv = document.getElementById(highlightId);
    if (highlightDiv) {
      highlightDiv.remove();
    }
  }

  // ===== INITIALIZATION =====
  async init() {
    this.initEventListeners();
    this.checkAuth();
  }

  initEventListeners() {
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

    // Search inputs
    const newsSearch = document.getElementById('newsSearch');
    if (newsSearch) {
      newsSearch.addEventListener('input', (e) => {
        this.filterTable('news', e.target.value);
      });
    }

    const profilesSearch = document.getElementById('profilesSearch');
    if (profilesSearch) {
      profilesSearch.addEventListener('input', (e) => {
        this.filterTable('profiles', e.target.value);
      });
    }

    const tipsSearch = document.getElementById('tipsSearch');
    if (tipsSearch) {
      tipsSearch.addEventListener('input', (e) => {
        this.filterTable('tips', e.target.value);
      });
    }

    // Modal close buttons (only the close X button and Cancel buttons)
    document.querySelectorAll('.modal-overlay .modal-close, .modal-overlay .modal-footer .btn-secondary').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.closeAllModals();
      });
    });

    // Form submissions
    const profilesForm = document.getElementById('profilesForm');
    if (profilesForm) {
      profilesForm.addEventListener('submit', (e) => this.saveProfile(e));
    }

    const profilesFormEn = document.getElementById('profilesFormEn');
    if (profilesFormEn) {
      profilesFormEn.addEventListener('submit', (e) => this.saveProfile(e));
    }

    const newsForm = document.getElementById('newsForm');
    if (newsForm) {
      newsForm.addEventListener('submit', (e) => this.saveNews(e));
    }

    const newsFormEn = document.getElementById('newsFormEn');
    if (newsFormEn) {
      newsFormEn.addEventListener('submit', (e) => this.saveNews(e));
    }

    const tipsForm = document.getElementById('tipsForm');
    if (tipsForm) {
      tipsForm.addEventListener('submit', (e) => this.saveTip(e));
    }

    const tipsFormEn = document.getElementById('tipsFormEn');
    if (tipsFormEn) {
      tipsFormEn.addEventListener('submit', (e) => this.saveTip(e));
    }

    // Add Q&A buttons for Heritage Figures (VI & EN)
    const addHighlightBtn = document.getElementById('addHighlightBtn');
    if (addHighlightBtn) {
      addHighlightBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.addHighlight();
      });
    }

    const addHighlightBtnEn = document.getElementById('addHighlightBtnEn');
    if (addHighlightBtnEn) {
      addHighlightBtnEn.addEventListener('click', (e) => {
        e.preventDefault();
        this.addHighlight('en');
      });
    }
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
    this.currentUser = sessionStorage.getItem('currentUser') || 'admin';

    // Update user display elements if they exist
    const userAvatar = document.querySelector('.admin-user-avatar');
    const userName = document.querySelector('.admin-user-name');
    if (userAvatar) {
      userAvatar.textContent = this.currentUser.charAt(0).toUpperCase();
    }
    if (userName) {
      userName.textContent = this.currentUser.charAt(0).toUpperCase() + this.currentUser.slice(1);
    }

    this.switchTab('dashboard');
    this.loadAllData();
  }

  showError(message) {
    const errorDiv = document.getElementById('loginErrorMsg');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
      errorDiv.style.display = 'none';
    }, 5000);
  }

  // ===== TAB NAVIGATION =====
  switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.admin-tab-content').forEach(tab => {
      tab.style.display = 'none';
    });

    // Show selected tab
    const tabElement = document.getElementById(`${tabName}`);
    if (tabElement) {
      tabElement.style.display = 'block';
    }

    // Update nav active state
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });
    const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeTab) {
      activeTab.classList.add('active');
    }

    // Load data for the tab
    if (tabName === 'dashboard') {
      this.loadDashboard();
    } else if (tabName === 'profiles') {
      this.loadProfiles('vi');
    } else if (tabName === 'profiles-en') {
      this.loadProfiles('en');
    } else if (tabName === 'news') {
      this.loadNews('vi');
    } else if (tabName === 'news-en') {
      this.loadNews('en');
    } else if (tabName === 'tips') {
      this.loadTips('vi');
    } else if (tabName === 'tips-en') {
      this.loadTips('en');
    }
  }

  // ===== DATA LOADING =====
  async loadAllData() {
    await this.loadDashboard();
  }

  async loadDashboard() {
    try {
      const [viFigures, viNews, viTips] = await Promise.all([
        fetch(`${this.API_BASE}/admin/figures`).then(r => r.json()),
        fetch(`${this.API_BASE}/admin/news`).then(r => r.json()),
        fetch(`${this.API_BASE}/admin/tips`).then(r => r.json())
      ]);

      document.getElementById('statProfiles').textContent = viFigures.heritageFigures?.length || 0;
      document.getElementById('statNews').textContent = viNews.news?.length || 0;
      document.getElementById('statTips').textContent = viTips.wellnessTips?.length || 0;
      document.getElementById('statBanners').textContent = '0';
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  }

  // ===== HERITAGE FIGURES =====
  async loadProfiles(language = 'vi') {
    try {
      const endpoint = language === 'en' ? `${this.API_BASE}/admin/figures-en` : `${this.API_BASE}/admin/figures`;
      const response = await fetch(endpoint);
      const data = await response.json();
      const profiles = data.heritageFigures || [];

      const tbody = document.getElementById(language === 'en' ? 'profilesTableBodyEn' : 'profilesTableBody');

      if (profiles.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px; color: #999;"><i class="fas fa-inbox" style="font-size: 32px; margin-bottom: 10px; display: block;"></i>No profiles yet.</td></tr>';
        return;
      }

      tbody.innerHTML = profiles.map(profile => `
        <tr>
          <td>${profile.fullName || 'N/A'}</td>
          <td>${profile.title || 'N/A'}</td>
          <td>${profile.category || '-'}</td>
          <td><span class="badge" style="background: ${profile.published ? '#28a745' : '#dc3545'}; color: white; padding: 4px 8px; border-radius: 3px; font-size: 11px;">${profile.published ? 'Published' : 'Draft'}</span></td>
          <td class="admin-table-actions">
            <button class="btn btn-sm btn-primary" onclick="adminPanel.openProfileModal(${profile.id}, '${language}')">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-sm btn-danger" onclick="adminPanel.deleteProfile(${profile.id}, '${language}')">
              <i class="fas fa-trash"></i> Delete
            </button>
          </td>
        </tr>
      `).join('');
    } catch (error) {
      console.error(`Error loading profiles (${language}):`, error);
      this.showNotification('Failed to load heritage figures', 'error');
    }
  }

  async openProfileModal(id = null, language = 'vi') {
    const formId = language === 'en' ? 'profilesFormEn' : 'profilesForm';
    const form = document.getElementById(formId);
    form.reset();
    this.currentEditId = id;
    this.currentEditLanguage = language;

    if (id) {
      document.getElementById('profilesModalTitle').textContent = 'Edit Heritage Figure';
      try {
        const endpoint = language === 'en' ? `${this.API_BASE}/admin/figures-en` : `${this.API_BASE}/admin/figures`;
        const response = await fetch(endpoint);
        const data = await response.json();
        const profile = data.heritageFigures.find(p => p.id === id);

        if (profile) {
          const nameId = language === 'en' ? 'profileFullNameEn' : 'profileName';
          const titleId = language === 'en' ? 'profileTitleEn' : 'profileTitle';
          const categoryId = language === 'en' ? 'profileCategoryEn' : 'profileCategory';
          const headerLetterId = language === 'en' ? 'profileHeaderLetterEn' : 'profileHeaderLetter';
          const imageId = language === 'en' ? 'profileImageEn' : 'profileImage';
          const smallImageId = language === 'en' ? 'profileSmallImageEn' : 'profileSmallImage';
          const heroImageId = language === 'en' ? 'profileHeroImageEn' : 'profileHeroImage';
          const summaryId = language === 'en' ? 'profileSummaryEn' : 'profileSummary';
          const introductionId = language === 'en' ? 'profileIntroductionEn' : 'profileIntroduction';
          const quoteId = language === 'en' ? 'profileQuoteEn' : 'profileQuote';
          const publishedId = language === 'en' ? 'profilePublishedEn' : 'profilePublished';

          document.getElementById(nameId).value = profile.fullName || '';
          document.getElementById(titleId).value = profile.title || '';
          document.getElementById(categoryId).value = profile.category || '';
          document.getElementById(headerLetterId).value = profile.headerLetter || '';
          document.getElementById(imageId).value = profile.imageUrl || '';
          document.getElementById(smallImageId).value = profile.smallImageUrl || '';
          document.getElementById(heroImageId).value = profile.heroImageUrl || '';
          document.getElementById(summaryId).value = (profile.summary || []).join('\n');
          document.getElementById(introductionId).value = profile.introduction || '';
          document.getElementById(quoteId).value = profile.quote || '';
          document.getElementById(publishedId).checked = profile.published !== false;

          // Populate highlights
          const containerId = language === 'en' ? 'highlightsContainerEn' : 'highlightsContainer';
          const highlightsContainer = document.getElementById(containerId);
          if (highlightsContainer) {
            highlightsContainer.innerHTML = ''; // Clear existing highlights
            if (profile.highlights && Array.isArray(profile.highlights)) {
              profile.highlights.forEach(highlight => {
                this.addHighlight(language);
                const lastHighlight = highlightsContainer.lastElementChild;
                const questionInput = lastHighlight.querySelector('.highlight-question');
                const answerInput = lastHighlight.querySelector('.highlight-answer');
                if (questionInput) questionInput.value = highlight.question || '';
                if (answerInput) {
                  // Convert answer array to newline-separated string
                  const answerText = Array.isArray(highlight.answer)
                    ? highlight.answer.join('\n')
                    : (highlight.answer || '');
                  answerInput.value = answerText;
                }
              });
            }
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        this.showNotification('Failed to load profile data', 'error');
      }
    } else {
      document.getElementById('profilesModalTitle').textContent = 'Add New Heritage Figure';
      document.getElementById('profileLanguage').value = language;
    }

    const modalId = language === 'en' ? 'profilesModalEn' : 'profilesModal';
    document.getElementById(modalId).style.display = 'block';
  }

  async saveProfile(e) {
    e.preventDefault();

    const language = this.currentEditLanguage || 'vi';
    const nameId = language === 'en' ? 'profileFullNameEn' : 'profileName';
    const titleId = language === 'en' ? 'profileTitleEn' : 'profileTitle';
    const categoryId = language === 'en' ? 'profileCategoryEn' : 'profileCategory';
    const imageId = language === 'en' ? 'profileImageEn' : 'profileImage';
    const smallImageId = language === 'en' ? 'profileSmallImageEn' : 'profileSmallImage';
    const heroImageId = language === 'en' ? 'profileHeroImageEn' : 'profileHeroImage';
    const summaryId = language === 'en' ? 'profileSummaryEn' : 'profileSummary';
    const introductionId = language === 'en' ? 'profileIntroductionEn' : 'profileIntroduction';
    const quoteId = language === 'en' ? 'profileQuoteEn' : 'profileQuote';
    const publishedId = language === 'en' ? 'profilePublishedEn' : 'profilePublished';
    const headerLetterId = language === 'en' ? 'profileHeaderLetterEn' : 'profileHeaderLetter';

    // Collect highlights from form
    const containerId = language === 'en' ? 'highlightsContainerEn' : 'highlightsContainer';
    const highlightsContainer = document.getElementById(containerId);
    const highlights = [];
    if (highlightsContainer) {
      const highlightItems = highlightsContainer.querySelectorAll('.highlight-item');
      highlightItems.forEach(item => {
        const question = item.querySelector('.highlight-question')?.value || '';
        const answerText = item.querySelector('.highlight-answer')?.value || '';
        if (question.trim()) {
          // Split answer by newlines to create array of paragraphs
          const answer = answerText.split('\n').filter(p => p.trim());
          highlights.push({
            question: question.trim(),
            answer: answer.length > 0 ? answer : answerText.trim()
          });
        }
      });
    }

    const profileData = {
      full_name: document.getElementById(nameId).value,
      title: document.getElementById(titleId).value,
      category: document.getElementById(categoryId).value,
      url_slug: this.generateSlug(document.getElementById(nameId).value) + '.html',
      image_url: document.getElementById(imageId).value,
      small_image_url: document.getElementById(smallImageId).value,
      hero_image_url: document.getElementById(heroImageId).value,
      language: language,
      published: document.getElementById(publishedId).checked,
      introduction: document.getElementById(introductionId).value,
      quote: document.getElementById(quoteId).value,
      header_letter: document.getElementById(headerLetterId).value,
      summary: (document.getElementById(summaryId).value || '').split('\n').filter(p => p.trim()),
      sections: [],
      highlights: highlights
    };

    try {
      const url = this.currentEditId
        ? `${this.API_BASE}/admin/figures/${this.currentEditId}`
        : `${this.API_BASE}/admin/figures`;

      const method = this.currentEditId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      this.closeAllModals();
      this.showNotification(`Heritage figure ${this.currentEditId ? 'updated' : 'created'} successfully!`, 'success');
      this.loadProfiles(this.currentEditLanguage || 'vi');
      this.loadDashboard();
    } catch (error) {
      console.error('Error saving profile:', error);
      this.showNotification('Failed to save heritage figure', 'error');
    }
  }

  async deleteProfile(id, language = 'vi') {
    if (!confirm('Are you sure you want to delete this heritage figure?')) {
      return;
    }

    try {
      const response = await fetch(`${this.API_BASE}/admin/figures/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      this.showNotification('Heritage figure deleted successfully!', 'success');
      this.loadProfiles(language);
      this.loadDashboard();
    } catch (error) {
      console.error('Error deleting profile:', error);
      this.showNotification('Failed to delete heritage figure', 'error');
    }
  }

  // ===== NEWS =====
  async openNewsModal(id = null, language = 'vi') {
    const formId = language === 'en' ? 'newsFormEn' : 'newsForm';
    const form = document.getElementById(formId);
    form.reset();
    this.currentEditId = id;
    this.currentEditLanguage = language;

    if (id) {
      document.getElementById('newsModalTitle').textContent = 'Edit News Article';
      try {
        const endpoint = language === 'en' ? `${this.API_BASE}/admin/news-en` : `${this.API_BASE}/admin/news`;
        const response = await fetch(endpoint);
        const data = await response.json();
        const article = data.news.find(a => a.id === id);

        if (article) {
          const titleId = language === 'en' ? 'newsTitleEn' : 'newsTitle';
          const descId = language === 'en' ? 'newsDescriptionEn' : 'newsDescription';
          const contentId = language === 'en' ? 'newsContentEn' : 'newsContent';
          const imageId = language === 'en' ? 'newsImageEn' : 'newsImage';
          const publishedId = language === 'en' ? 'newsPublishedEn' : 'newsPublished';

          document.getElementById(titleId).value = article.title || '';
          document.getElementById(descId).value = article.description || '';
          document.getElementById(contentId).value = article.content || '';
          document.getElementById(imageId).value = article.featured_image || '';
          document.getElementById(publishedId).checked = article.published !== false;
        }
      } catch (error) {
        console.error('Error loading article:', error);
        this.showNotification('Failed to load article data', 'error');
      }
    } else {
      document.getElementById('newsModalTitle').textContent = 'Add New News Article';
    }

    const modalId = language === 'en' ? 'newsModalEn' : 'newsModal';
    document.getElementById(modalId).style.display = 'block';
  }

  async saveNews(e) {
    e.preventDefault();

    const language = this.currentEditLanguage || 'vi';
    const titleId = language === 'en' ? 'newsTitleEn' : 'newsTitle';
    const descId = language === 'en' ? 'newsDescriptionEn' : 'newsDescription';
    const contentId = language === 'en' ? 'newsContentEn' : 'newsContent';
    const imageId = language === 'en' ? 'newsImageEn' : 'newsImage';
    const publishedId = language === 'en' ? 'newsPublishedEn' : 'newsPublished';

    const newsData = {
      title: document.getElementById(titleId).value,
      description: document.getElementById(descId).value,
      content: document.getElementById(contentId).value,
      featured_image: document.getElementById(imageId).value,
      language: language,
      published: document.getElementById(publishedId).checked,
      slug: this.generateSlug(document.getElementById(titleId).value),
      author: 'Living Heritage'
    };

    try {
      const url = this.currentEditId
        ? `${this.API_BASE}/admin/news/${this.currentEditId}`
        : `${this.API_BASE}/admin/news`;

      const method = this.currentEditId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newsData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      this.closeAllModals();
      this.showNotification(`News article ${this.currentEditId ? 'updated' : 'created'} successfully!`, 'success');
      this.loadNews(this.currentEditLanguage || 'vi');
      this.loadDashboard();
    } catch (error) {
      console.error('Error saving news:', error);
      this.showNotification('Failed to save news article', 'error');
    }
  }

  async loadNews(language = 'vi') {
    try {
      const endpoint = language === 'en' ? `${this.API_BASE}/admin/news-en` : `${this.API_BASE}/admin/news`;
      const response = await fetch(endpoint);
      const data = await response.json();
      const articles = data.news || [];

      const tbody = document.getElementById(language === 'en' ? 'newsTableBodyEn' : 'newsTableBody');

      if (articles.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px; color: #999;"><i class="fas fa-inbox" style="font-size: 32px; margin-bottom: 10px; display: block;"></i>No articles yet.</td></tr>';
        return;
      }

      tbody.innerHTML = articles.map(article => `
        <tr>
          <td>${article.title || 'N/A'}</td>
          <td>${article.category || '-'}</td>
          <td>${article.author || 'Living Heritage'}</td>
          <td><span class="badge" style="background: ${article.published ? '#28a745' : '#dc3545'}; color: white; padding: 4px 8px; border-radius: 3px; font-size: 11px;">${article.published ? 'Published' : 'Draft'}</span></td>
          <td class="admin-table-actions">
            <button class="btn btn-sm btn-primary" onclick="adminPanel.openNewsModal(${article.id}, '${language}')">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-sm btn-danger" onclick="adminPanel.deleteNews(${article.id}, '${language}')">
              <i class="fas fa-trash"></i> Delete
            </button>
          </td>
        </tr>
      `).join('');
    } catch (error) {
      console.error(`Error loading news (${language}):`, error);
      this.showNotification('Failed to load news articles', 'error');
    }
  }

  async deleteNews(id, language = 'vi') {
    if (!confirm('Are you sure you want to delete this news article?')) {
      return;
    }

    try {
      const response = await fetch(`${this.API_BASE}/admin/news/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      this.showNotification('News article deleted successfully!', 'success');
      this.loadNews(language);
      this.loadDashboard();
    } catch (error) {
      console.error('Error deleting news:', error);
      this.showNotification('Failed to delete news article', 'error');
    }
  }

  // ===== WELLNESS TIPS =====
  async openTipModal(id = null, language = 'vi') {
    const formId = language === 'en' ? 'tipsFormEn' : 'tipsForm';
    const form = document.getElementById(formId);
    form.reset();
    this.currentEditId = id;
    this.currentEditLanguage = language;

    if (id) {
      document.getElementById('tipsModalTitle').textContent = 'Edit Wellness Tip';
      try {
        const endpoint = language === 'en' ? `${this.API_BASE}/admin/tips-en` : `${this.API_BASE}/admin/tips`;
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`);
        }
        const data = await response.json();
        console.log('Tips data loaded:', data);
        const tip = data.wellnessTips ? data.wellnessTips.find(t => t.id === id) : null;
        console.log('Found tip:', tip);

        if (tip) {
          const titleId = language === 'en' ? 'tipTitleEn' : 'tipTitle';
          const descId = language === 'en' ? 'tipDescriptionEn' : 'tipDescription';
          const contentId = language === 'en' ? 'tipContentEn' : 'tipContent';
          const imageId = language === 'en' ? 'tipImageEn' : 'tipImage';
          const heroImageId = language === 'en' ? 'tipHeroImageEn' : 'tipHeroImage';
          const publishedId = language === 'en' ? 'tipPublishedEn' : 'tipPublished';

          console.log('Setting form fields with IDs:', { titleId, descId, contentId, imageId, heroImageId, publishedId });

          const titleField = document.getElementById(titleId);
          const descField = document.getElementById(descId);
          const contentField = document.getElementById(contentId);
          const imageField = document.getElementById(imageId);
          const heroImageField = document.getElementById(heroImageId);
          const publishedField = document.getElementById(publishedId);

          console.log('Fields found:', {
            titleField: !!titleField,
            descField: !!descField,
            contentField: !!contentField,
            imageField: !!imageField,
            heroImageField: !!heroImageField,
            publishedField: !!publishedField
          });

          if (titleField) titleField.value = tip.title || '';
          if (descField && tip.description) descField.value = tip.description || '';
          if (contentField) contentField.value = tip.content || '';
          if (imageField) imageField.value = tip.imageUrl || '';
          if (heroImageField) heroImageField.value = tip.heroImageUrl || '';
          if (publishedField) publishedField.checked = tip.published !== false;

          console.log('Form fields populated successfully');
        } else {
          console.warn('Tip not found with id:', id);
        }
      } catch (error) {
        console.error('Error loading tip:', error);
        this.showNotification('Failed to load wellness tip data', 'error');
      }
    } else {
      document.getElementById('tipsModalTitle').textContent = 'Add New Wellness Tip';
    }

    const modalId = language === 'en' ? 'tipsModalEn' : 'tipsModal';
    document.getElementById(modalId).style.display = 'block';
  }

  async saveTip(e) {
    e.preventDefault();

    const language = this.currentEditLanguage || 'vi';
    const titleId = language === 'en' ? 'tipTitleEn' : 'tipTitle';
    const descId = language === 'en' ? 'tipDescriptionEn' : 'tipDescription';
    const contentId = language === 'en' ? 'tipContentEn' : 'tipContent';
    const imageId = language === 'en' ? 'tipImageEn' : 'tipImage';
    const heroImageId = language === 'en' ? 'tipHeroImageEn' : 'tipHeroImage';
    const publishedId = language === 'en' ? 'tipPublishedEn' : 'tipPublished';

    const descField = document.getElementById(descId);
    const tipData = {
      title: document.getElementById(titleId).value,
      description: descField ? descField.value : '',
      content: document.getElementById(contentId).value,
      image_url: document.getElementById(imageId).value,
      hero_image_url: document.getElementById(heroImageId).value,
      language: language,
      published: document.getElementById(publishedId).checked,
      url_slug: this.generateSlug(document.getElementById(titleId).value) + '.html'
    };

    try {
      const url = this.currentEditId
        ? `${this.API_BASE}/admin/tips/${this.currentEditId}`
        : `${this.API_BASE}/admin/tips`;

      const method = this.currentEditId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tipData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      this.closeAllModals();
      this.showNotification(`Wellness tip ${this.currentEditId ? 'updated' : 'created'} successfully!`, 'success');
      this.loadTips(this.currentEditLanguage || 'vi');
      this.loadDashboard();
    } catch (error) {
      console.error('Error saving tip:', error);
      this.showNotification('Failed to save wellness tip', 'error');
    }
  }

  async loadTips(language = 'vi') {
    try {
      const endpoint = language === 'en' ? `${this.API_BASE}/admin/tips-en` : `${this.API_BASE}/admin/tips`;
      const response = await fetch(endpoint);
      const data = await response.json();
      const tips = data.wellnessTips || [];

      const tbody = document.getElementById(language === 'en' ? 'tipsTableBodyEn' : 'tipsTableBody');

      if (tips.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 30px; color: #999;"><i class="fas fa-inbox" style="font-size: 32px; margin-bottom: 10px; display: block;"></i>No wellness tips yet.</td></tr>';
        return;
      }

      tbody.innerHTML = tips.map(tip => `
        <tr>
          <td>${tip.title || 'N/A'}</td>
          <td>${(tip.description || '').substring(0, 60)}...</td>
          <td><span class="badge" style="background: ${tip.published ? '#28a745' : '#dc3545'}; color: white; padding: 4px 8px; border-radius: 3px; font-size: 11px;">${tip.published ? 'Published' : 'Draft'}</span></td>
          <td class="admin-table-actions">
            <button class="btn btn-sm btn-primary" onclick="adminPanel.openTipModal(${tip.id}, '${language}')">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-sm btn-danger" onclick="adminPanel.deleteTip(${tip.id}, '${language}')">
              <i class="fas fa-trash"></i> Delete
            </button>
          </td>
        </tr>
      `).join('');
    } catch (error) {
      console.error(`Error loading tips (${language}):`, error);
      this.showNotification('Failed to load wellness tips', 'error');
    }
  }

  async deleteTip(id, language = 'vi') {
    if (!confirm('Are you sure you want to delete this wellness tip?')) {
      return;
    }

    try {
      const response = await fetch(`${this.API_BASE}/admin/tips/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      this.showNotification('Wellness tip deleted successfully!', 'success');
      this.loadTips(language);
      this.loadDashboard();
    } catch (error) {
      console.error('Error deleting tip:', error);
      this.showNotification('Failed to delete wellness tip', 'error');
    }
  }

  // ===== UTILITIES =====
  filterTable(type, searchTerm) {
    const rows = document.querySelectorAll(`#${type}TableBody tr`);
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(searchTerm.toLowerCase()) ? '' : 'none';
    });
  }

  closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.style.display = 'none';
    });
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
      color: white;
      border-radius: 5px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      z-index: 10000;
      animation: slideInRight 0.3s ease;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// Initialize admin panel when DOM is ready
let adminPanel;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    adminPanel = new LivingHeritageAdminDB();
  });
} else {
  adminPanel = new LivingHeritageAdminDB();
}
