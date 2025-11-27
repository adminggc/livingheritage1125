// Partial Loader Script
class PartialLoader {
  constructor() {
    this.partials = new Map();
  }  async loadPartial(path, elementId) {
    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`Failed to load partial: ${path}`);
      }
      const content = await response.text();      const element = document.getElementById(elementId);
      if (element) {
        element.innerHTML = content;
        this.partials.set(elementId, content);
      }      return content;
    } catch (error) {
      console.error(`Error loading partial ${path}:`, error);
      return null;
    }
  }  async loadAllPartials(language = 'vi') {
    const partials = [
      { path: 'partials/shared/head.html', elementId: 'head-content' },
      { path: `partials/${language}/header.html`, elementId: 'header-content' },
      { path: `partials/${language}/footer.html`, elementId: 'footer-content' }
    ];    const promises = partials.map(partial =>
      this.loadPartial(partial.path, partial.elementId)
    );    await Promise.all(promises);
  }  // Method to update page title after head is loaded
  updatePageTitle(title) {
    document.title = title;
  }  // Method to add custom CSS or JS after head is loaded
  addCustomHead(content) {
    const headElement = document.getElementById('head-content');
    if (headElement) {
      headElement.innerHTML += content;
    }
  }
}// Initialize partial loader
const partialLoader = new PartialLoader();// Auto-load partials when DOM is ready
document.addEventListener('DOMContentLoaded', async function () {
  // Detect language from HTML lang attribute or URL
  const htmlLang = document.documentElement.lang || 'vi';
  const language = htmlLang === 'en' ? 'en' : 'vi';  await partialLoader.loadAllPartials(language);  // Initialize other scripts after partials are loaded
  if (typeof initCarousels === 'function') {
    initCarousels();
  }
  if (typeof initSmoothScrolling === 'function') {
    initSmoothScrolling();
  }
  if (typeof initAnimations === 'function') {
    initAnimations();
  }
});// Export for use in other scripts
window.PartialLoader = PartialLoader;
window.partialLoader = partialLoader;
