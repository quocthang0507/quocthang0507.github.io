// Service Worker for Offline PWA support
const CACHE_NAME = 'utility-hub-cache-v2.2';
const OFFLINE_FALLBACK_URL = './offline.html';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './offline.html',
  './404.html',
  './privacy/',
  './favicon.ico',
  './site.webmanifest',
  './assets/images/icon-192x192.png',
  './assets/images/icon-512x512.png',
  './assets/css/main.css',
  './assets/data/vietnam_holidays.json',
  './assets/data/vietnam_photos.json',
  './assets/js/security.min.js',
  './assets/js/consent.min.js',
  './assets/js/main.min.js',
  './assets/js/i18n.min.js',
  './assets/js/command-palette.min.js',
  './assets/js/pwa.min.js',
  './assets/js/lunar-calendar.min.js',
  './assets/js/vietnam-holidays.min.js',
  './assets/js/calendar-core.min.js',
  './assets/js/calendar-views.min.js',
  './assets/js/clock.min.js',
  './assets/js/languages/vi.min.js',
  './assets/js/languages/en.min.js',
  './assets/js/languages/zh.min.js',
  './assets/js/languages/ko.min.js',
  './assets/js/languages/ja.min.js'
];

const CACHEABLE_CDN_HOSTS = new Set([
  'cdn.jsdelivr.net',
  'cdnjs.cloudflare.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
]);

// Install Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache =>
        Promise.allSettled(
          PRECACHE_ASSETS.map(url =>
            cache.add(url).catch(err => {
              console.warn('[Service Worker] Precache skipped:', url, err);
            })
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

// Activate Service Worker and purge older caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
          return null;
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Allow clients to trigger immediate activation of an updated SW
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch Interceptor
self.addEventListener('fetch', event => {
  // Only GET requests can be cached
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);

  // Never intercept requests for the Service Worker script itself
  if (requestUrl.origin === self.location.origin && requestUrl.pathname.endsWith('/sw.js')) return;

  // Cross-origin static libraries (Bootstrap, Font Awesome, Google Fonts, Marked, MathJax, etc.)
  if (requestUrl.origin !== self.location.origin) {
    if (CACHEABLE_CDN_HOSTS.has(requestUrl.hostname)) {
      event.respondWith(
        caches.match(event.request).then(cachedResponse => {
          const networkFetch = fetch(event.request).then(networkResponse => {
            if (networkResponse && (networkResponse.ok || networkResponse.type === 'opaque')) {
              const cacheCopy = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, cacheCopy))
                .catch(() => {});
            }
            return networkResponse;
          });
          if (cachedResponse) {
            event.waitUntil(networkFetch.catch(() => {}));
            return cachedResponse;
          }
          return networkFetch.catch(() => Response.error());
        })
      );
    }
    return;
  }

  // Pages: Network-first so new deployments appear immediately, with cached page / offline.html fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.ok && networkResponse.type === 'basic') {
          const cacheCopy = networkResponse.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, cacheCopy))
            .catch(() => {});
        }
        return networkResponse;
      }).catch(() =>
        caches.match(event.request, { ignoreSearch: true })
          .then(cachedResponse => cachedResponse || caches.match(OFFLINE_FALLBACK_URL))
          .then(cachedResponse => cachedResponse || caches.match('./'))
          .then(cachedResponse => cachedResponse || Response.error())
      )
    );
    return;
  }

  // Other same-origin assets: Stale-While-Revalidate caching strategy
  const cachedResponsePromise = caches.match(event.request);
  const networkFetch = fetch(event.request).then(networkResponse => {
    if (networkResponse && networkResponse.ok && networkResponse.type === 'basic') {
      const cacheCopy = networkResponse.clone();
      return caches.open(CACHE_NAME)
        .then(cache => cache.delete(event.request, { ignoreSearch: true })
          .then(() => cache.put(event.request, cacheCopy)))
        .then(() => networkResponse);
    }
    return networkResponse;
  });

  event.waitUntil(networkFetch.catch(() => {}));

  event.respondWith(
    cachedResponsePromise.then(cachedResponse => {
      if (cachedResponse) return cachedResponse;
      return networkFetch.catch(() =>
        caches.match(event.request, { ignoreSearch: true })
          .then(fallback => fallback || Response.error())
      );
    })
  );
});
