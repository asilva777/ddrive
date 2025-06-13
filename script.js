/* Mobile navigation toggle */
const navToggle = document.querySelector('.mobile-nav-toggle');
const navLinks = document.querySelector('.nav-links');

navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

const sections = document.querySelectorAll('.feature-section');
const observerOptions = { threshold: 0.1 };

const sectionObserver = new IntersectionObserver((entries, _) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, observerOptions);

sections.forEach(sec => {
  sec.classList.add('hidden');
  sectionObserver.observe(sec);
});

// PWA: register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('SW registered:', reg))
      .catch(err => console.error('SW registration failed:', err));
  });
}
