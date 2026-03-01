/* eslint-disable no-restricted-globals */

// self.__WB_MANIFEST is required by CRA's Workbox build plugin.
// It gets replaced at build time with the list of precached assets.
const PRECACHE_MANIFEST = self.__WB_MANIFEST || [];

const CACHE_VERSION = "focus-radio-v2";
const FONT_CACHE = "focus-fonts-v1";
const GIF_CACHE = "focus-gifs-v1";

// Install precache all CRA build assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      // Cache the CRA-generated asset manifest entries
      const urls = PRECACHE_MANIFEST.map((entry) =>
        typeof entry === "string" ? entry : entry.url,
      );
      return cache.addAll([...urls, "/", "/index.html"]).catch((err) => {
        console.warn("[SW] Precache partial fail:", err);
      });
    }),
  );
  self.skipWaiting();
});

//  Activate — clean up old caches
self.addEventListener("activate", (event) => {
  const KEEP = [CACHE_VERSION, FONT_CACHE, GIF_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => !KEEP.includes(k)).map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});

// Fetch
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;
  if (url.protocol === "chrome-extension:") return;

  // Audio streams — always network only
  if (
    url.hostname.includes("somafm") ||
    url.hostname.includes("streams.") ||
    url.pathname.endsWith(".mp3") ||
    url.pathname.endsWith(".ogg") ||
    url.pathname.endsWith(".aac")
  )
    return;

  // Google Fonts — cache-first
  if (
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com"
  ) {
    event.respondWith(
      caches.open(FONT_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((res) => {
            if (res.ok) cache.put(request, res.clone());
            return res;
          });
        }),
      ),
    );
    return;
  }

  // Tenor GIFs — cache on first load
  if (
    url.hostname.includes("tenor.com") ||
    url.hostname.includes("media1.tenor")
  ) {
    event.respondWith(
      caches.open(GIF_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request)
            .then((res) => {
              if (res.ok) cache.put(request, res.clone());
              return res;
            })
            .catch(() => cached);
        }),
      ),
    );
    return;
  }

  // HTML navigation — network-first, fallback to shell
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          caches.open(CACHE_VERSION).then((c) => c.put(request, res.clone()));
          return res;
        })
        .catch(() => caches.match("/index.html")),
    );
    return;
  }

  // Everything else — cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((res) => {
        if (res.ok && url.origin === self.location.origin) {
          caches.open(CACHE_VERSION).then((c) => c.put(request, res.clone()));
        }
        return res;
      });
    }),
  );
});

//Message handler
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
