document.addEventListener('DOMContentLoaded', function () {
  // Add a shadow to sticky header after scrolling
  const header = document.querySelector('.sticky-header');
  if (!header) return;

  function updateHeaderShadow() {
    if (window.scrollY > 4) {
      header.classList.add('nav-shadow');
    } else {
      header.classList.remove('nav-shadow');
    }
  }

  updateHeaderShadow();
  window.addEventListener('scroll', updateHeaderShadow, { passive: true });

  // Seasonal IWD flag: enable only in March or if window.CABANA_SHOW_IWD === true
  try {
    const now = new Date();
    const isMarch = now.getMonth() === 2; // 0=Jan, 2=Mar
    const forceFlag = typeof window !== 'undefined' && window.CABANA_SHOW_IWD === true;
    const showIWD = isMarch || forceFlag;
    const iwdEl = document.querySelector('[data-iwd-block]');
    if (iwdEl) {
      if (showIWD) {
        iwdEl.hidden = false;
      } else {
        iwdEl.remove();
      }
    }
  } catch (_) {}

  // Seasonal Mental Health Month (October) flag
  try {
    const now = new Date();
    const isOctober = now.getMonth() === 9; // 9 = October
    const forceMhm = typeof window !== 'undefined' && window.CABANA_SHOW_MHM === true;
    const showMhm = isOctober || forceMhm;
    const mhmEl = document.querySelector('[data-mhm-block]');
    if (mhmEl) {
      if (showMhm) {
        mhmEl.hidden = false;
      } else {
        mhmEl.remove();
      }
    }
  } catch (_) {}
});


