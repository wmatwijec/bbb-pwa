const CACHE = 'bbb-golf-v21.1';  // NEW VERSION
const FILES = [
  'index.html',
  'style.css',
  'app.js',
  'manifest.json'
  // REMOVE pin.jpg
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(FILES))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => key !== CACHE ? caches.delete(key) : null)
    ))
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => response || fetch(e.request))
  );
});