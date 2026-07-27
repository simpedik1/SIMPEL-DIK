const CACHE_NAME = 'simpedik-cache-v1';

self.addEventListener('install', (e) => {
  console.log('Service Worker aktif');
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});