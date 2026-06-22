const CACHE_NAME = 'attendify-cache-v35';
const ASSETS = [
    './',
    './index.html',
    './assets/css/style.css?v=17',
    './assets/css/subjects.css',
    './assets/js/theme.js',
    './assets/js/auth.js',
    './assets/js/ui.js?v=12',
    './assets/js/history.js?v=10',
    './assets/js/firebase-config.js',
    './assets/js/export.js?v=10',
    './logo.webp',
    './logo-opt.png',
    './icon-192.png',
    './icon-512.png',
    './manifest.json',
    './manual.html',
    './about.html',
    './contact.html',
    './privacy-policy.html',
    './terms.html',
    './404.html'
];

// Install Service Worker and cache all essential static files
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        }).then(() => self.skipWaiting())
    );
});

// Activate Service Worker and clean up older caches if any
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Intercept fetch requests
self.addEventListener('fetch', (e) => {
    // Only handle local GET requests (avoids breaking Firebase Realtime Database websockets and REST requests)
    if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) {
        return;
    }

    // Check if the request is for an HTML page
    const isHtml = e.request.url.includes('.html') || 
                   e.request.url === self.location.origin + '/' || 
                   e.request.url === self.location.origin ||
                   e.request.url.endsWith('/');
    const isFreshAsset = e.request.destination === 'style' ||
                         e.request.destination === 'script';

    if (isHtml || isFreshAsset) {
        // Network-First Strategy for HTML/CSS/JS to avoid mixed old-cache + new-HTML UI.
        e.respondWith(
            fetch(e.request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseToCache));
                    }
                    return networkResponse;
                })
                .catch(() => {
                    return caches.match(e.request);
                })
        );
    } else {
        // Stale-While-Revalidate Strategy for static assets (JS, CSS, images, etc.)
        e.respondWith(
            caches.match(e.request).then((cachedResponse) => {
                if (cachedResponse) {
                    fetch(e.request).then((networkResponse) => {
                        if (networkResponse.status === 200) {
                            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, networkResponse));
                        }
                    }).catch(() => { /* Ignore background fetch network errors */ });
                    return cachedResponse;
                }

                return fetch(e.request).then((networkResponse) => {
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                        return networkResponse;
                    }
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseToCache));
                    return networkResponse;
                });
            })
        );
    }
});
