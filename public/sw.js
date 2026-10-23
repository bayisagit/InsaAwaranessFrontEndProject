/**
 * INSA CyberSafe - Progressive Web App Service Worker
 * Version: 1.0.0
 * Architecture: Next.js App Router compatible, Security-first caching strategy.
 */

const CACHE_NAME = 'cybersafe-cache-v1';
const RUNTIME_CACHE = 'cybersafe-runtime-v1';
const OFFLINE_URL = '/offline';

const PRECACHE_ASSETS = [
  OFFLINE_URL,
  '/manifest.json',
  '/logo.png',
  '/loginlogo.png',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-192x192.png',
  '/icons/icon-maskable-512x512.png',
  '/icons/apple-touch-icon.png',
];

// Install Event: Precache offline page and vital branding assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
      .catch((err) => {
        console.warn('[PWA SW] Precache error (non-fatal):', err);
      })
  );
});

// Activate Event: Clean up outdated caches and claim clients immediately
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!currentCaches.includes(cacheName)) {
              console.log('[PWA SW] Deleting legacy cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Message Listener: Support skip waiting updates when requested by UI
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch Event: Implement secure, differentiated caching
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Never intercept non-HTTP(S) protocols (chrome-extension, etc.)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // 2. Never cache mutating methods (POST, PUT, DELETE, PATCH)
  // All state changes, form submissions, and authentication must touch the server live!
  if (request.method !== 'GET') {
    return;
  }

  // 3. Security & Auth Guard: Never cache auth or sensitive endpoints
  if (
    url.pathname.includes('/api/auth/') ||
    url.pathname.includes('/api/v1/auth/') ||
    url.pathname.includes('/api/auth/me/') ||
    url.pathname.includes('/api/auth/refresh/') ||
    url.pathname.includes('/api/v1/trash/') ||
    url.pathname.includes('/api/v1/audit-logs/')
  ) {
    // Pass straight to network without caching
    return;
  }

  // 4. API Requests (/api/*): Network-First with safe offline JSON response
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If valid response and idempotent GET, optionally clone to runtime cache
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(async () => {
          // If offline, check runtime cache for a previously saved response
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Return clean offline JSON for un-cached API calls
          return new Response(
            JSON.stringify({
              offline: true,
              error: 'You are currently offline. Please reconnect to access live data.',
            }),
            {
              status: 503,
              statusText: 'Service Unavailable (Offline)',
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
    );
    return;
  }

  // 5. HTML Navigation Requests (Page Visits): Network-First with /offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only cache successful pages
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(async () => {
          // If offline, try to serve cached version of the page
          const cachedPage = await caches.match(request);
          if (cachedPage) {
            return cachedPage;
          }
          // Otherwise, serve the dedicated offline page
          const offlineFallback = await caches.match(OFFLINE_URL);
          if (offlineFallback) {
            return offlineFallback;
          }
          return new Response(
            '<html><body><h1>Offline</h1><p>Please check your connection and try again.</p></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }

  // 6. Static Assets (Next.js bundles, CSS, JS, Fonts, Images): Cache-First with Network Revalidation
  const isStaticAsset =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Revalidate in background to keep cache fresh
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(RUNTIME_CACHE).then((cache) => {
                  cache.put(request, networkResponse);
                });
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        // If not in cache, fetch and store
        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // Return empty response or fallback if asset fails
            return new Response('', { status: 408, statusText: 'Request Timed Out' });
          });
      })
    );
    return;
  }

  // Default fallback for any other requests
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
