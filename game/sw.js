// Service worker: cache toàn bộ game để chơi offline hoàn toàn
const CACHE = 'condoungtolua-v1';
const ASSETS = [
  './', './index.html', './manifest.webmanifest',
  './css/style.css',
  './vendor/three.module.min.js',
  './js/main.js', './js/world.js', './js/entities.js', './js/combat.js',
  './js/ui.js', './js/input.js', './js/data.js', './js/items.js',
  './js/quests.js', './js/job.js', './js/save.js', './js/audio.js', './js/util.js',
  './assets/icon.svg', './assets/icon-180.png', './assets/icon-192.png', './assets/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
