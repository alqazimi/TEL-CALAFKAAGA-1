// Placeholder service worker (prevents 404 from cached browser requests)
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", () => self.clients.claim());
