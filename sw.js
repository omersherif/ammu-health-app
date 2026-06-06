/**
 * sw.js — Service Worker for Ammu's Health App
 * Handles caching so the app works offline.
 * Strategy: Cache First for static assets, Network First for data.
 */

const CACHE_NAME = 'ammu-health-v11';

// Static assets to cache on install — the app shell
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Fredoka+One&display=swap',
  'https://cdn.tailwindcss.com',
];

// ── INSTALL ──────────────────────────────────────────────────────────────────
// Fired once when the service worker is first registered.
// Pre-caches all static assets so the app loads offline immediately.
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching static assets');
        // Use addAll for atomic caching — if any file fails, none are cached
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Install complete');
        // Force this SW to become active immediately without waiting
        return self.skipWaiting();
      })
      .catch(err => {
        // Log but don't block install if CDN assets fail (e.g. offline at install time)
        console.warn('[SW] Some assets failed to cache during install:', err);
      })
  );
});

// ── ACTIVATE ─────────────────────────────────────────────────────────────────
// Fired when this SW takes control. Clean up old caches here.
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME) // delete any old cache versions
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[SW] Now controlling all clients');
      // Take control of all open tabs immediately
      return self.clients.claim();
    })
  );
});

// ── FETCH ────────────────────────────────────────────────────────────────────
// Intercepts every network request from the app.
// Strategy depends on the request type.
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1. Google Apps Script requests — always go to network (data must be fresh)
  //    Never cache these as they contain form submissions and live data.
  if (url.hostname.includes('script.google.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 2. Google Fonts — cache first (fonts rarely change)
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        return cached || fetch(event.request).then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        });
      })
    );
    return;
  }

  // 3. All other requests — Cache First, fallback to network
  //    This makes the app work fully offline once loaded.
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        // Serve from cache immediately
        return cached;
      }
      // Not in cache — try network and cache the response
      return fetch(event.request)
        .then(response => {
          // Only cache valid responses
          if (!response || response.status !== 200 || response.type === 'opaque') {
            return response;
          }
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => {
          // Network failed and not in cache — return offline fallback
          // For HTML requests, return the cached index.html
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
    })
  );
});
