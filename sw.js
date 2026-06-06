/* Ammu's Health App — Service Worker */
var CACHE_NAME = 'ammu-rebuild-v2';
var ASSETS = ['./', './index.html', './app.js', './manifest.json'];

self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then(function(c){ return c.addAll(ASSETS); }).catch(function(){}));
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(names.filter(function(n){ return n !== CACHE_NAME; }).map(function(n){ return caches.delete(n); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  // Never cache Google Apps Script calls
  if (e.request.url.indexOf('script.google.com') !== -1) return;
  e.respondWith(
    fetch(e.request).catch(function(){ return caches.match(e.request).then(function(r){ return r || caches.match('./index.html'); }); })
  );
});
