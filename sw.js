/* Ammu's Health App — Service Worker
   NETWORK-FIRST strategy: always tries fresh files first, falls back to
   cache only when offline. Users NEVER need to clear cache manually. */

var CACHE_NAME = 'ammu-app-v10';
var ASSETS = ['./', './index.html', './app.js', './manifest.json'];

// Install — cache assets, activate immediately
self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(c) { return c.addAll(ASSETS); }).catch(function(){})
  );
});

// Activate — delete ALL old caches, take control immediately
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(names.map(function(n) {
        if (n !== CACHE_NAME) return caches.delete(n);
      }));
    }).then(function() { return self.clients.claim(); })
  );
});

// Fetch — NETWORK FIRST: always get freshest version, cache as backup
self.addEventListener('fetch', function(e) {
  // Never cache Google Apps Script calls
  if (e.request.url.indexOf('script.google.com') !== -1) return;
  // Only handle GET requests
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request).then(function(response) {
      // Got fresh version — update cache and return it
      var copy = response.clone();
      caches.open(CACHE_NAME).then(function(c) { c.put(e.request, copy); }).catch(function(){});
      return response;
    }).catch(function() {
      // Offline — serve from cache
      return caches.match(e.request).then(function(r) {
        return r || caches.match('./index.html');
      });
    })
  );
});
