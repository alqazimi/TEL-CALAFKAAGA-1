const CACHE_NAME = "hel-calafkaaga-v2";
const PRECACHE = ["/dashboard", "/icon-192", "/icon-512", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await Promise.all(
        PRECACHE.map(async (url) => {
          try {
            await cache.add(url);
          } catch {
            // ignore offline precache failures
          }
        })
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("hel-calafkaaga-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  const isNavigate =
    event.request.mode === "navigate" ||
    event.request.destination === "document";

  if (isNavigate) {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cached = await caches.match("/dashboard");
        return cached ?? Response.error();
      })
    );
    return;
  }

  if (url.pathname.startsWith("/icon-") || url.pathname === "/manifest.webmanifest") {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        const response = await fetch(event.request);
        if (response.ok) cache.put(event.request, response.clone());
        return response;
      })
    );
    return;
  }

  event.respondWith(
    fetch(event.request).catch(async () => {
      const cached = await caches.match(event.request);
      return cached ?? Response.error();
    })
  );
});
