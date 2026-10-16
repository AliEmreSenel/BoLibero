// BoLibero service worker: network-first pages/assets (offline fallback to
// the shell), cache-first immutable /_next/static assets, JSON API responses
// served from network with the last-known payload cached for offline reading.
const SHELL_CACHE = "bolibero-shell-v1";
const API_CACHE = "bolibero-api-v1";
const STATIC_CACHE = "bolibero-static-v1";
const SHELL_URLS = ["/", "/calendar", "/schedule", "/exams"];
const API_CACHE_MAX = 50;

function pruneCache(cache) {
  return cache.keys().then((keys) => {
    const excess = keys.length - API_CACHE_MAX;
    if (excess > 0) {
      return Promise.all(keys.slice(0, excess).map((key) => cache.delete(key)));
    }
  });
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) =>
        Promise.allSettled(SHELL_URLS.map((url) => cache.add(url)))
      )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key !== SHELL_CACHE && key !== API_CACHE && key !== STATIC_CACHE
            )
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches
              .open(API_CACHE)
              .then((cache) =>
                cache.put(request, copy).then(() => pruneCache(cache))
              );
          }
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then(
              (cached) =>
                cached ||
                new Response(JSON.stringify({ events: [], classes: [] }), {
                  headers: { "Content-Type": "application/json" },
                })
            )
        )
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches
                .open(STATIC_CACHE)
                .then((cache) => cache.put(request, copy));
            }
            return response;
          })
      )
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match("/"))
        )
    );
  }
});
