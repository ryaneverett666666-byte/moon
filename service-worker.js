/* Луна 2087 — Service Worker (PWA / офлайн-WebView)
   Меняйте CACHE_VERSION при каждом обновлении игры — старые кеши будут удалены. */
const CACHE_VERSION = 'luna2087-v1';
const CACHE_NAME = 'luna2087-cache-' + CACHE_VERSION;

// Файлы, кешируемые при установке (все пути относительные)
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './OutThere.mp3',
  './textures/earth_color.jpg',
  './textures/milky_way.jpg',
  './textures/moon_color.jpg',
  './vendor/three.module.js',
  './vendor/controls/OrbitControls.js'
];

// Install: кешируем основные ресурсы (cache-first при последующих запросах)
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate: удаляем старые кеши (другие версии / устаревшие записи)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch: cache-first с подкешированием всех GET-запросов (в т.ч. ./assets/*)
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(req).then(hit => {
      if (hit) return hit;
      return fetch(req).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
        }
        return res;
      }).catch(() => {
        // Офлайн-фолбэк: отдаём главную страницу
        if (req.mode === 'navigate') return caches.match('./index.html');
        return caches.match('./');
      });
    })
  );
});