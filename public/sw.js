// Fahlefi Futsal Tactical Analytics Service Worker (Offline-First Arena Support)
const CACHE_NAME = 'fahlefi-futsal-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.png',
  '/lapangan.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Hanya tangani request GET (hindari cache request API POST/PATCH)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        // Return cache first, fetch network in background to update
        fetch(event.request)
          .then((networkRes) => {
            if (networkRes.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkRes));
            }
          })
          .catch(() => {});
        return cached;
      }

      return fetch(event.request).then((networkRes) => {
        if (
          networkRes.status === 200 &&
          (event.request.url.startsWith('http://') || event.request.url.startsWith('https://')) &&
          !event.request.url.includes('/api/')
        ) {
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        }
        return networkRes;
      }).catch(() => {
        // If offline and request is HTML document, fallback to index.html
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/index.html');
        }
      });
    })
  );
});
