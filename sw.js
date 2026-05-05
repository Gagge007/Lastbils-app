const CACHE_NAME = 'lastbil-app-cache-v2026-05-05-queue-button-1';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './lastbil-icon-192.png',
  './lastbil-icon-512.png',
  './apple-touch-icon.png',
  './favicon.png',
  './splash-bg.jpg'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.all(CORE_ASSETS.map(async asset => {
        try {
          const response = await fetch(asset, { cache: 'reload' });
          if (response && response.ok) {
            await cache.put(asset, response);
          }
        } catch (error) {
          // Hoppa över filer som saknas. Appen kan ändå fungera med index.html.
        }
      }));
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key.startsWith('lastbil-app-cache-') && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { cache: 'reload' }).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy));
        return response;
      }).catch(() => {
        return caches.match('./index.html') || caches.match('./') || caches.match(request);
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      const networkFetch = fetch(request).then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      }).catch(() => cached);
      return cached || networkFetch;
    })
  );
});
