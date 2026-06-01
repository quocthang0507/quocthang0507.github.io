// Service Worker for Offline PWA support
const CACHE_NAME = 'utility-hub-cache-v1';
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './404.html',
  './privacy.html',
  './favicon.ico',
  './site.webmanifest',
  './assets/css/main.css',
  './assets/js/main.js',
  './assets/js/main.min.js',
  './assets/js/i18n.js',
  './assets/js/i18n.min.js',
  './assets/js/languages/vi.js',
  './assets/js/languages/en.js',
  './assets/js/languages/zh.js',
  './assets/js/languages/ko.js',
  './assets/js/languages/ja.js',
  './assets/js/languages/vi.min.js',
  './assets/js/languages/en.min.js',
  './assets/js/languages/zh.min.js',
  './assets/js/languages/ko.min.js',
  './assets/js/languages/ja.min.js'
];

// Install Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Pre-caching offline shell');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Service Worker
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating and cleaning old caches');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Interceptor
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // Skip cross-origin external API fetches like CORS proxy or google analytics
  if (requestUrl.origin !== self.location.origin) {
    // Fonts and FontAwesome CSS can be cached
    if (event.request.url.includes('cdnjs.cloudflare.com') || event.request.url.includes('fonts.gstatic.com') || event.request.url.includes('fonts.googleapis.com')) {
      event.respondWith(
        caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) return cachedResponse;
          return fetch(event.request).then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              const cacheCopy = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, cacheCopy));
            }
            return networkResponse;
          }).catch(() => null);
        })
      );
    }
    return;
  }

  // Same-origin request: Stale-While-Revalidate caching strategy
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const networkFetch = fetch(event.request).then(networkResponse => {
        // Cache success responses
        if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
          const cacheCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, cacheCopy);
          });
        }
        return networkResponse;
      }).catch(err => {
        console.warn('[Service Worker] Network fetch failed, falling back to cache:', err);
        return cachedResponse; // Fallback to cache if network fails completely (offline mode)
      });

      // Return cached immediately if found, otherwise wait for network fetch
      return cachedResponse || networkFetch;
    })
  );
});
