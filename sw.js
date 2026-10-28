// Service Worker: app shell cache-first + API stale-while-revalidate.
const VERSION = "v1";
const SHELL_CACHE = `biblia-shell-${VERSION}`;
const API_CACHE = `biblia-api-${VERSION}`;
const SHELL = [
  "./", "./index.html", "./styles.css", "./manifest.webmanifest",
  "./js/app.js", "./js/api.js", "./js/lib.js", "./js/books.js",
  "./icons/icon-192.png", "./icons/icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(SHELL_CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => ![SHELL_CACHE, API_CACHE].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // API de bolls.life: responde del caché y actualiza en segundo plano (excepto versículo al azar).
  if (url.hostname === "bolls.life") {
    if (url.pathname.includes("get-random-verse")) {
      e.respondWith(fetch(req));
      return;
    }
    e.respondWith(
      caches.open(API_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        const network = fetch(req).then((res) => { if (res.ok) cache.put(req, res.clone()); return res; });
        return cached || network;
      })
    );
    return;
  }

  // Archivos propios: caché primero, red de respaldo.
  if (url.origin === location.origin) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
  }
});
