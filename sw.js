const CACHE_NAME = 'voladitos-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './pasajero.html',
  './conductor.html',
  './registro_conductor.html',
  './admin.html',
  './js/index.js',
  './js/pasajero.js',
  './js/conductor.js',
  './js/registro_conductor.js',
  './js/admin.js',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('supabase.co')) {
    return; // Ignorar peticiones de la API de Supabase para que vayan directo a la red
  }
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});
