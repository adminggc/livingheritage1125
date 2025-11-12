// Living Heritage Main JavaScriptdocument.addEventListener('DOMContentLoaded', function () {
  // Initialize carousel functionality
  initCarousels();  // Initialize smooth scrolling
  initSmoothScrolling();  // Initialize animations
  initAnimations();
});// Carousel functionality
function initCarousels() {
  const carousels = document.querySelectorAll('.carousel-container');  carousels.forEach(carousel => {
    const items = carousel.querySelectorAll('.carousel-item');
    const dots = carousel.querySelectorAll('.carousel-dot');
    let currentIndex = 0;    // Show initial item
    showItem(carousel, currentIndex);    // Add click events to dots
    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        currentIndex = index;
        showItem(carousel, currentIndex);
      });
    });    // Auto-rotate carousel
    setInterval(() => {
      currentIndex = (currentIndex + 1) % items.length;
      showItem(carousel, currentIndex);
    }, 5000);
  });
}function showItem(carousel, index) {
  const items = carousel.querySelectorAll('.carousel-item');
  const dots = carousel.querySelectorAll('.carousel-dot');  // Hide all items
  items.forEach(item => {
    item.style.display = 'none';
  });  // Remove active class from all dots
  dots.forEach(dot => {
    dot.classList.remove('active');
  });  // Show current item
  if (items[index]) {
    items[index].style.display = 'block';
  }  // Add active class to current dot
  if (dots[index]) {
    dots[index].classList.add('active');
  }
}// Smooth scrolling for navigation links
function initSmoothScrolling() {
  const navLinks = document.querySelectorAll('a[href^="#"]');  navLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}// Initialize animations on scroll
function initAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      }
    });
  }, observerOptions);  // Observe elements for animation
  const animateElements = document.querySelectorAll('.content-card, .person-card, .tip-card, .news-card');
  animateElements.forEach(el => {
    observer.observe(el);
  });
}// Play button functionality
document.addEventListener('click', function (e) {
  if (e.target.closest('.play-button')) {
    e.preventDefault();
    // Add your video/audio play functionality here
    console.log('Play button clicked');
  }
});// Mobile menu toggle
function toggleMobileMenu() {
  const navbarCollapse = document.getElementById('navbarNav');
  if (navbarCollapse) {
    navbarCollapse.classList.toggle('show');
  }
}