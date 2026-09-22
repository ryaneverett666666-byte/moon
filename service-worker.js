/* Луна 2087 — Service Worker (PWA / офлайн-WebView)
   Меняйте CACHE_VERSION при каждом обновлении игры — старые кеши будут удалены. */
const CACHE_VERSION = 'luna2087-v3';
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
  './vendor/controls/OrbitControls.js',
  './vendor/GLTFLoader.js',
  './vendor/DRACOLoader.js',
  './vendor/utils/BufferGeometryUtils.js'
];

// Install: кешируем основные ресурсы
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

// Fetch:
//  - HTML/навигация: network-first (всегда свежая игра, кеш — только офлайн-фолбэк),
//    чтобы обновления index.html сразу попадали в браузер;
//  - остальные ресурсы: cache-first с подкешированием (в т.ч. ./models/* и ./assets/*).
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;
  const isNav = req.mode === 'navigate' || req.url.endsWith('/index.html') || req.url.endsWith('/');

  if (isNav) {
    event.respondWith(
      fetch(req)
        .then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
    );
    return;
  }

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
        if (req.mode === 'navigate') return caches.match('./index.html');
        return caches.match('./');
      });
    })
  );
});