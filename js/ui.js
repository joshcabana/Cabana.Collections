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
});


