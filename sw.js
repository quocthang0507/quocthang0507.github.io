// Service Worker for Offline PWA support
const CACHE_NAME = 'utility-hub-cache-v1.7';
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './404.html',
  './privacy/',
  './favicon.ico',
  './site.webmanifest',
  './assets/css/main.css',
  './assets/js/security.min.js',
  './assets/js/main.min.js',
  './assets/js/i18n.min.js',
  './assets/js/command-palette.min.js',
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
  // Only GET requests can be cached
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);

  // Never intercept requests for the Service Worker script itself
  if (requestUrl.origin === self.location.origin && requestUrl.pathname.endsWith('/sw.js')) return;

  // Skip cross-origin external API fetches like CORS proxy or google analytics
  if (requestUrl.origin !== self.location.origin) {
    // Fonts and FontAwesome CSS can be cached
    if (requestUrl.hostname === 'cdnjs.cloudflare.com' || requestUrl.hostname === 'fonts.gstatic.com' || requestUrl.hostname === 'fonts.googleapis.com') {
      event.respondWith(
        caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) return cachedResponse;
          return fetch(event.request).then(networkResponse => {
            if (networkResponse && networkResponse.ok) {
              const cacheCopy = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, cacheCopy))
                .catch(() => {});
            }
            return networkResponse;
          });
        })
      );
    }
    return;
  }

  // Pages: Network-first so new deployments show up immediately, cache as offline fallback
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
        caches.match(event.request)
          .then(cachedResponse => cachedResponse || caches.match('./'))
          .then(cachedResponse => cachedResponse || Response.error())
      )
    );
    return;
  }

  // Other same-origin assets: Stale-While-Revalidate caching strategy
  // Register waitUntil synchronously during event dispatch so background cache updates
  // never throw InvalidStateError after respondWith resolves from cache.
  const cachedResponsePromise = caches.match(event.request);
  const networkFetch = fetch(event.request).then(networkResponse => {
    if (networkResponse && networkResponse.ok && networkResponse.type === 'basic') {
      const cacheCopy = networkResponse.clone();
      // Drop older ?v= versions of the same file before storing the new one
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
      return networkFetch.catch(err => {
        console.warn('[Service Worker] Network fetch failed, falling back to cache:', err);
        // Offline with a new ?v= token: serve any cached version of the same file
        return caches.match(event.request, { ignoreSearch: true })
          .then(fallback => fallback || Response.error());
      });
    })
  );
});
