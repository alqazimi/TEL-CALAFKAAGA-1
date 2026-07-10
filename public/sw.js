/**
 * Kill-switch service worker.
 * Unregisters itself and clears caches so Chrome users stuck on an old SW recover.
 * Do not re-introduce navigation interception here.
 */
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) {
        if ("navigate" in client) {
          try {
            await client.navigate(client.url);
          } catch {
            // ignore
          }
        }
      }
    })()
  );
});
