// Video thumbnail -> lazy load YouTube iframe with centered play button
document.addEventListener('DOMContentLoaded', function () {
  function initVideoThumbnails() {
    const thumbs = document.querySelectorAll('.video-thumbnail');

    if (!thumbs || thumbs.length === 0) return;

    thumbs.forEach(function (thumb) {
      // make thumbnail focusable & accessible
      thumb.setAttribute('role', 'button');
      thumb.setAttribute('tabindex', '0');

      // ensure play-button exists (in case HTML changed)
      let playBtn = thumb.querySelector('.play-button');
      if (!playBtn) {
        playBtn = document.createElement('div');
        playBtn.className = 'play-button';
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        thumb.appendChild(playBtn);
      }

      // click handler to replace with iframe
      function playVideo(e) {
        // prevent double
        if (thumb.classList.contains('playing')) return;

        const videoId = thumb.dataset.videoId;
        if (!videoId) return;

        // construct iframe src with recommended params
        const src = 'https://www.youtube.com/embed/' + encodeURIComponent(videoId)
          + '?rel=0&modestbranding=1&playsinline=1&autoplay=1';

        // create responsive iframe element
        const iframe = document.createElement('iframe');
        iframe.setAttribute('src', src);
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute('title', thumb.getAttribute('aria-label') || 'YouTube video');
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = '0';
        iframe.style.display = 'block';

        // add class to mark playing
        thumb.classList.add('playing');

        // remove existing img if any and append iframe
        const existingImg = thumb.querySelector('img');
        if (existingImg) existingImg.remove();

        // append iframe (it is absolute positioned by CSS)
        thumb.appendChild(iframe);

        // optional: focus iframe for keyboard users after short delay
        setTimeout(function () {
          try { iframe.focus(); } catch (err) { /* ignore */ }
        }, 600);
      }

      // click and keyboard events
      thumb.addEventListener('click', playVideo);
      thumb.addEventListener('keypress', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          playVideo();
        }
      });
    });
  }

  initVideoThumbnails();
});
