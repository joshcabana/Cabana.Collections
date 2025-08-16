// Lazy Loading Images
document.addEventListener('DOMContentLoaded', function () {
  const lazyImages = document.querySelectorAll('.lazy-load');

  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.add('loaded');
          img.parentElement.classList.add('loaded');
          imageObserver.unobserve(img);
        }
      });
    });

    lazyImages.forEach((img) => imageObserver.observe(img));
  } else {
    // Fallback for browsers that don't support IntersectionObserver
    lazyImages.forEach((img) => {
      img.src = img.dataset.src;
      img.classList.add('loaded');
    });
  }
});

// Enhanced Navigation with Impact Banner
const mainNav = document.getElementById('mainNav');
const impactBanner = document.getElementById('impactBanner');
const heroSection = document.getElementById('heroSection');

let lastScroll = 0;
let ticking = false;
let bannerDismissed = localStorage.getItem('cabanaImpactBannerDismissed') === 'true';

// Initialize banner state - banner starts hidden by CSS, only show if not dismissed
if (bannerDismissed) {
  impactBanner?.classList.add('hidden');
  mainNav?.classList.remove('nav-with-banner');
  if (heroSection) heroSection.style.paddingTop = '5rem';
} else {
  mainNav?.classList.remove('nav-with-banner');
}

function updateNavigation() {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  if (!mainNav) return;
  if (scrollTop > 0) {
    mainNav.classList.add('visible');
    if (scrollTop > 50) {
      mainNav.classList.add('nav-scrolled');
    }
  } else {
    mainNav.classList.remove('visible', 'nav-scrolled');
  }
  lastScroll = scrollTop;
  ticking = false;
}

function dismissImpactBanner() {
  if (!impactBanner || !mainNav) return;
  impactBanner.classList.add('hidden');
  impactBanner.style.transform = 'translateY(-100%)';
  impactBanner.style.opacity = '0';
  mainNav.style.transform = 'translateY(0)';
  window.isImpactBannerActive = false;
  localStorage.setItem('cabanaImpactBannerDismissed', 'true');
}
window.dismissImpactBanner = dismissImpactBanner;

const heroImpactText = document.querySelector('h1 span:last-child');
let isImpactBannerActive = false;
let lastScrollY = 0;

function handleImpactBannerTransition() {
  if (bannerDismissed || !impactBanner || !mainNav || !heroSection) return;
  const currentScrollY = window.scrollY;
  const heroHeight = heroSection.offsetHeight;
  const scrollThreshold = heroHeight * 0.6;
  const scrollingDown = currentScrollY > lastScrollY;
  const shouldShowBanner = currentScrollY > scrollThreshold && scrollingDown;
  const shouldHideBanner = currentScrollY < scrollThreshold && !scrollingDown;

  if (shouldShowBanner && !isImpactBannerActive && !impactBanner.classList.contains('hidden')) {
    impactBanner.style.background = 'linear-gradient(90deg, #d4af37, #f5d061)';
    const t = impactBanner.querySelector('.impact-banner-text');
    if (t) t.textContent = '10% of every purchase supports mental-health initiatives with Beyond Blue.';
    impactBanner.style.transform = 'translateY(0)';
    impactBanner.style.opacity = '1';
    isImpactBannerActive = true;
    mainNav.style.transform = 'translateY(48px)';
  } else if (shouldHideBanner && isImpactBannerActive) {
    impactBanner.style.transform = 'translateY(-100%)';
    impactBanner.style.opacity = '0';
    isImpactBannerActive = false;
    mainNav.style.transform = 'translateY(0)';
  }

  lastScrollY = currentScrollY;
}

window.addEventListener('scroll', () => {
  if (!ticking) {
    window.requestAnimationFrame(() => {
      updateNavigation();
      handleImpactBannerTransition();
      ticking = false;
    });
    ticking = true;
  }
});

// Ensure navigation starts hidden
mainNav?.classList.remove('visible', 'nav-scrolled');

// Performance optimisations
function optimisePerformance() {
  if (navigator.hardwareConcurrency < 4) {
    const style = document.createElement('style');
    style.textContent = `*{animation-duration:.1s!important;transition-duration:.1s!important}`;
    document.head.appendChild(style);
  }
}
setTimeout(optimisePerformance, 100);

// Newsletter
function subscribeNewsletter(event) {
  event.preventDefault();
  const form = event.target;
  const email = form.email.value.trim();
  const emailInput = form.querySelector('#newsletter-email');
  const errorDiv = document.getElementById('newsletter-error');
  const successDiv = document.getElementById('newsletter-success');
  const submitButton = form.querySelector('.newsletter-submit');
  const submitText = submitButton.querySelector('.submit-text');
  const loadingText = submitButton.querySelector('.loading-text');
  const honeypot = form.querySelector('input[name="website"]');
  errorDiv.classList.add('hidden');
  successDiv.classList.add('hidden');
  if (emailInput) emailInput.removeAttribute('aria-invalid');
  if (honeypot && honeypot.value.trim() !== '') return;
  if (!email) return showNewsletterError('Please enter your email address.');
  if (!validateNewsletterEmail(email)) return showNewsletterError('Please enter a valid email address.');
  submitButton.disabled = true;
  submitText.classList.add('hidden');
  loadingText.classList.remove('hidden');
  setTimeout(() => {
    try {
      const subscribers = JSON.parse(localStorage.getItem('newsletterSubscribers') || '[]');
      if (subscribers.includes(email)) return showNewsletterError('This email is already subscribed to our newsletter.');
      subscribers.push(email);
      localStorage.setItem('newsletterSubscribers', JSON.stringify(subscribers));
      if (typeof gtag !== 'undefined') gtag('event', 'newsletter_signup');
      form.classList.add('hidden');
      successDiv.classList.remove('hidden');
    } catch (_) {
      showNewsletterError('Something went wrong. Please try again.');
    } finally {
      submitButton.disabled = false;
      submitText.classList.remove('hidden');
      loadingText.classList.add('hidden');
    }
  }, 1500);

  function showNewsletterError(message) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    submitButton.disabled = false;
    submitText.classList.remove('hidden');
    loadingText.classList.add('hidden');
    if (emailInput) {
      emailInput.setAttribute('aria-invalid', 'true');
      emailInput.focus();
    }
  }
}
window.subscribeNewsletter = subscribeNewsletter;

function validateNewsletterEmail(email) {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email.toLowerCase());
}

// Hero text carousel and video optimisation
document.addEventListener('DOMContentLoaded', function () {
  const phrases = [
    'Quiet refinement, worn every day',
    'Sustainably crafted. Designed to last',
    'Considered materials, considered impact',
    'Comfort that contributes',
  ];
  const el = document.getElementById('heroTextCarousel');
  if (el) {
    let idx = 0;
    el.textContent = phrases[idx];
    setInterval(() => {
      idx = (idx + 1) % phrases.length;
      el.style.opacity = '0';
      setTimeout(() => {
        el.textContent = phrases[idx];
        el.style.opacity = '1';
      }, 250);
    }, 3500);
  }

  const heroVideo = document.getElementById('heroBgVideo');
  const heroImage = document.getElementById('heroImageFallback');
  const saveData = navigator.connection && navigator.connection.saveData;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (heroVideo) {
    const allowMotion = !saveData && !prefersReduced;
    if (!allowMotion) {
      try { heroVideo.pause(); } catch (_) {}
      heroVideo.removeAttribute('autoplay');
      heroVideo.style.display = 'none';
      if (heroImage) heroImage.style.display = 'block';
    } else {
      heroVideo.style.display = 'block';
      heroVideo.addEventListener('playing', () => { if (heroImage) heroImage.style.display = 'none'; }, { once: true });
      if ('IntersectionObserver' in window) {
        const obs = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) { heroVideo.play().catch(() => {}); }
            else { try { heroVideo.pause(); } catch (_) {} }
          });
        }, { threshold: 0.1 });
        obs.observe(heroVideo);
      } else {
        heroVideo.play().catch(() => {});
      }
    }
  }
});


