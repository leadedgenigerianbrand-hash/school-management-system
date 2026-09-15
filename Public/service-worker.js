"use strict";

const CACHE_NAME = "school-management-static-v1";

const STATIC_ASSETS = [
    "/",
    "/index.html",
    "/manifest.json",
    "/css/style.css",
    "/css/bootstrap-system.css",
    "/css/dashboard.css",
    "/css/responsive.css",
    "/js/api.js",
    "/js/auth.js",
    "/js/pageGuard.js",
    "/js/sidebar.js",
    "/js/app.js"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((cacheName) => cacheName !== CACHE_NAME)
                        .map((cacheName) => caches.delete(cacheName))
                );
            })
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    const request = event.request;

    if (request.method !== "GET") {
        return;
    }

    const requestUrl = new URL(request.url);

    if (requestUrl.origin !== self.location.origin) {
        return;
    }

    if (requestUrl.pathname.startsWith("/api/")) {
        return;
    }

    if (requestUrl.pathname.startsWith("/uploads/")) {
        return;
    }

    if (requestUrl.pathname.startsWith("/pages/")) {
        return;
    }

    if (requestUrl.pathname.startsWith("/reports/")) {
        return;
    }

    if (requestUrl.pathname.startsWith("/documents/")) {
        return;
    }

    if (request.destination === "document") {
        event.respondWith(
            fetch(request)
                .catch(() => {
                    return caches.match("/index.html");
                })
        );

        return;
    }

    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(request)
                    .then((networkResponse) => {
                        if (
                            !networkResponse ||
                            networkResponse.status !== 200 ||
                            networkResponse.type !== "basic"
                        ) {
                            return networkResponse;
                        }

                        const responseToCache = networkResponse.clone();

                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(request, responseToCache);
                            })
                            .catch(() => {
                                // Ignore cache failures.
                            });

                        return networkResponse;
                    });
            })
    );
});