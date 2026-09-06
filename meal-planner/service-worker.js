// Service worker for the Meal Planner PWA.
// Strategy: precache the app shell on install, then cache-first for
// everything else (including the Tailwind/Google Fonts CDN assets) so the
// app keeps working with no network at all after the first successful load.

const CACHE_VERSION = 'meal-planner-v2';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './css/tailwind.css',
  './css/styles.css',
  './js/app.js',
  './js/recipes.js',
  './js/storage.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png',
  './icons/favicon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  // Navigations: try network first for freshness, fall back to the cached
  // shell so the app still opens with no connection.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Everything else: cache-first, then network, caching the result for
  // next time (covers same-origin assets and CDN scripts/fonts alike).
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response && (response.ok || response.type === 'opaque')) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
    })
  );
});
