// Service Worker for Elite Productivity OS (Supports PWA offline caching & reliable background Push Notifications)

const CACHE_NAME = 'drive-os-cache-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/icon-192.png',
  '/icon-512.png',
  '/icon.svg',
  '/manifest.json'
];

// 1. Install Event: Cache critical shell resources
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            console.log('[Service Worker] Intelligent Pre-Caching initiated...');
            return cache.addAll(ASSETS_TO_CACHE);
        }).then(() => {
            console.log('[Service Worker] Active PWA assets pre-cached successfully.');
            return self.skipWaiting();
        }).catch(err => {
            console.error('[Service Worker] Pre-caching failed:', err);
        })
    );
});

// 2. Activate Event: Clean old legacy caches
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Purging legacy cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[Service Worker] Live update activated.');
            return self.clients.claim();
        })
    );
});

// 3. Fetch Event Interceptor: Network-First Offline Fallback (Dynamic Asset Harvesting)
self.addEventListener('fetch', function(event) {
    const request = event.request;
    
    // Bypassing Rules: Never cache state adjustments, auth, firestore, or backend operations
    if (
        request.method !== 'GET' ||
        request.url.includes('/api/') ||
        request.url.includes('firestore.googleapis.com') ||
        request.url.includes('firebaseinstallations') ||
        request.url.includes('identitytoolkit') ||
        !request.url.startsWith(self.location.origin)
    ) {
        return; // Relay direct to browser
    }

    event.respondWith(
        fetch(request)
            .then(networkResponse => {
                // Harvesting Rule: Save successfully completed static assets dynamically
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, responseToCache);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                // Offline Recovery Rule
                return caches.match(request).then(cachedResponse => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // For document navigation request (like direct page URL refresh), fallback to /index.html (SPA shell)
                    if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
                        return caches.match('/index.html').then(htmlRes => {
                            return htmlRes || caches.match('/');
                        });
                    }
                });
            })
    );
});

// --- Existing Push Notifications Dispatch Engine ---
self.addEventListener('push', function(event) {
    let data = { title: 'Drive OS Reminder', body: 'Goal or task schedule triggered' };
    try {
        if (event.data) {
            data = event.data.json();
        }
    } catch (e) {
        data = { title: 'Drive OS Reminder', body: event.data ? event.data.text() : 'Goal or task schedule triggered' };
    }
    
    const options = {
        body: data.body,
        icon: '/icon.svg',
        badge: '/icon.svg',
        vibrate: [200, 100, 200, 100, 200],
        data: data.data || {}
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(windowClients => {
            if (windowClients.length > 0) {
                windowClients[0].focus();
                windowClients[0].postMessage({ type: 'NAVIGATE_VIEW', view: 'vault' });
            } else {
                clients.openWindow('/?view=vault');
            }
        })
    );
});
