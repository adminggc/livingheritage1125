/**
 * Living Heritage - Podcast Loader
 * Loads podcasts/videos from /api/podcasts endpoint
 * Used by podcast page to display YouTube videos
 */

class PodcastLoader {
  constructor() {
    this.podcastsData = [];
    this.loadPromise = this.loadPodcasts();
  }

  /**
   * Load podcasts from API endpoint
   */
  async loadPodcasts() {
    try {
      const response = await fetch('/api/podcasts');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      this.podcastsData = data.podcasts || [];
      console.log(`Loaded ${this.podcastsData.length} podcasts from API`);
      return this.podcastsData;
    } catch (error) {
      console.error('Error loading podcasts from API:', error);
      this.podcastsData = [];
      return [];
    }
  }

  /**
   * Get all podcasts
   */
  getAllPodcasts() {
    return this.podcastsData;
  }

  /**
   * Get published podcasts only (sorted by date, newest first)
   */
  getPublishedPodcasts() {
    return this.podcastsData
      .filter(podcast => podcast.published)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /**
   * Get podcast by ID
   */
  getPodcastById(id) {
    return this.podcastsData.find(podcast => podcast.id === id);
  }

  /**
   * Create podcast card HTML with YouTube embed
   * Uses video-thumbnail structure to match existing CSS styling
   */
  createPodcastCard(podcast) {
    return `
      <div class="col-md-4 mt-4" data-id="${podcast.id}">
        <div class="video-thumbnail" data-video-id="${podcast.videoId}">
          <img src="${podcast.imageUrl}"
               alt="${podcast.altText || podcast.title}"
               class="img-fluid rounded-3"
               loading="lazy"
               onerror="this.src='assets/media/shared/default-video.jpg'">
          <div class="play-button">
            <i class="fas fa-play"></i>
          </div>
        </div>
        <div class="podcast-info">
          <h3 class="podcast-title">${podcast.title}</h3>
        </div>
      </div>
    `;
  }

  /**
   * Create podcast grid HTML
   */
  createPodcastGrid(containerId, podcasts = null) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`Container not found: ${containerId}`);
      return false;
    }

    const podcastsToShow = podcasts || this.getPublishedPodcasts();
    if (podcastsToShow.length === 0) {
      console.warn(`No podcasts to display in: ${containerId}`);
      return false;
    }

    // Clear existing content
    container.innerHTML = '';

    // Add podcast cards
    podcastsToShow.forEach((podcast, index) => {
      const card = document.createElement('div');
      card.innerHTML = this.createPodcastCard(podcast);
      container.appendChild(card.firstElementChild);
    });

    console.log(`Populated ${containerId} with ${podcastsToShow.length} podcasts`);

    // Attach click handlers to video thumbnails for YouTube playback
    this.attachVideoPlayHandlers();

    return true;
  }

  /**
   * Attach click handlers to video thumbnails to play YouTube videos
   */
  attachVideoPlayHandlers() {
    const videoThumbnails = document.querySelectorAll('.video-thumbnail[data-video-id]');
    videoThumbnails.forEach(thumbnail => {
      thumbnail.addEventListener('click', (e) => {
        e.preventDefault();
        const videoId = thumbnail.getAttribute('data-video-id');
        if (videoId) {
          // Create and insert iframe
          const iframe = document.createElement('iframe');
          iframe.width = '100%';
          iframe.height = '100%';
          iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
          iframe.frameborder = '0';
          iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
          iframe.allowFullscreen = true;

          thumbnail.innerHTML = '';
          thumbnail.appendChild(iframe);
          thumbnail.classList.add('playing');
        }
      });
    });
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
   * Search podcasts
   */
  searchPodcasts(query) {
    const searchTerm = query.toLowerCase();
    return this.podcastsData.filter(podcast =>
      podcast.title.toLowerCase().includes(searchTerm) ||
      podcast.description.toLowerCase().includes(searchTerm)
    );
  }
}

/**
 * Global podcast loader instance
 * Wait for it to load before using: await window.podcastLoader.loadPromise
 */
let podcastLoader;
document.addEventListener('DOMContentLoaded', async () => {
  podcastLoader = new PodcastLoader();
  await podcastLoader.loadPromise;

  // Auto-populate podcast grid if container exists
  podcastLoader.createPodcastGrid('podcastsContainer');

  console.log('Podcast Loader initialized with', podcastLoader.podcastsData.length, 'podcasts');
});
