const CACHE_NAME = 'voladitos-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './pasajero.html',
  './conductor.html',
  './registro_conductor.html',
  './js/index.js',
  './js/pasajero.js',
  './js/conductor.js',
  './js/registro_conductor.js',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// Instalación y almacenamiento en caché
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Guardando archivos base en caché');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activación y limpieza de cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Eliminando caché antigua:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Intercepción de peticiones (Estrategia Network First con fallback a Cache)
self.addEventListener('fetch', (event) => {
  // Ignorar peticiones de la API de Supabase para no interferir con la DB en vivo
  if (event.request.url.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
