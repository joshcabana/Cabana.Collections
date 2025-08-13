// Lightweight performance helpers used across pages
(function () {
  // Pause videos when offscreen
  const videos = document.querySelectorAll('video[data-offscreen-pause]');
  if ('IntersectionObserver' in window && videos.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const vid = entry.target;
        if (entry.isIntersecting) {
          if (vid.paused) {
            vid.play().catch(() => {});
          }
        } else {
          try {
            vid.pause();
          } catch (_) {}
        }
      });
    }, { threshold: 0.05 });
    videos.forEach((v) => io.observe(v));
  }

  // Defer heavy work until idle
  (window.requestIdleCallback || function (cb) { setTimeout(cb, 150); })(function () {
    // Preconnect commonly used origins if not already present
    const origins = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'];
    origins.forEach((href) => {
      if (!document.querySelector(`link[rel="preconnect"][href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = href;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      }
    });
  });
})();


