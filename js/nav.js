document.addEventListener('DOMContentLoaded', function () {
  const openButtons = document.querySelectorAll('[data-mobile-open]');
  const closeButtons = document.querySelectorAll('[data-mobile-close]');
  const drawer = document.querySelector('[data-mobile-drawer]');
  const overlay = document.querySelector('[data-mobile-overlay]');

  if (!drawer || !overlay) {
    return;
  }

  function openDrawer() {
    drawer.classList.add('is-open');
    overlay.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked');
  }

  function closeDrawer() {
    drawer.classList.remove('is-open');
    overlay.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-locked');
  }

  openButtons.forEach((btn) => btn.addEventListener('click', openDrawer));
  closeButtons.forEach((btn) => btn.addEventListener('click', closeDrawer));
  overlay.addEventListener('click', closeDrawer);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDrawer();
    }
  });

  // Consistent top-nav shadow across pages (home, PDPs, legal)
  try {
    const navEls = Array.from(
      document.querySelectorAll('.sticky-header, [role="navigation"]')
    );
    if (navEls.length) {
      const updateNavShadow = () => {
        const scrolled = (window.pageYOffset || document.documentElement.scrollTop) > 4;
        navEls.forEach((el) => {
          if (scrolled) el.classList.add('nav-shadow');
          else el.classList.remove('nav-shadow');
        });
      };
      updateNavShadow();
      window.addEventListener('scroll', updateNavShadow, { passive: true });
    }
  } catch (_) {}
});


