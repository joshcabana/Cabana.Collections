// sw.js - Service Worker for CABANA
const CACHE_NAME = 'cabana-v9';
const urlsToCache = [
  // App shell (no HTML documents to avoid stale pages)
  '/css/styles.css',
  '/js/performance-optimizer.js',
  '/assets/Images/CABANA-MODEL-BOXERS-FRONT.png',
  '/assets/Images/CABANA-WOMEN.PNG',
  '/offline.html',
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.log('Cache installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event with runtime caching for images (avoid caching heavy videos)
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1) Network-first for HTML navigations to prevent stale pages
  const isHTML =
    request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Optionally, cache a copy of the latest HTML for offline fallback
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match('/offline.html')))
    );
    return;
  }

  // 2) Cache-first for images (but never cache videos)
  const isImage =
    url.pathname.startsWith('/assets/Images/') &&
    (request.url.endsWith('.png') ||
      request.url.endsWith('.jpg') ||
      request.url.endsWith('.jpeg') ||
      request.url.endsWith('.webp') ||
      request.url.endsWith('.svg'));
  if (isImage) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then(
          (cached) =>
            cached ||
            fetch(request).then((res) => {
              cache.put(request, res.clone());
              return res;
            })
        )
      )
    );
    return;
  }

  // 3) Stale-while-revalidate for CSS/JS
  const isAsset = request.destination === 'style' || request.destination === 'script';
  if (isAsset) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then((cached) => {
          const networkFetch = fetch(request)
            .then((res) => {
              cache.put(request, res.clone());
              return res;
            })
            .catch(() => cached);
          return cached || networkFetch;
        })
      )
    );
    return;
  }

  // 4) Default: try network, fall back to cache
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});
