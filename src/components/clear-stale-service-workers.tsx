import Script from "next/script";

/**
 * Unregisters leftover service workers from the removed PWA.
 * Safe no-op once none remain.
 */
export function ClearStaleServiceWorkers() {
  const script = `
(function () {
  try {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.getRegistrations().then(function (regs) {
      var had = regs && regs.length > 0;
      return Promise.all(
        (regs || []).map(function (reg) { return reg.unregister(); })
      ).then(function () { return had; });
    }).then(function (had) {
      var clearCaches = ("caches" in window)
        ? caches.keys().then(function (keys) {
            return Promise.all(
              keys.map(function (key) {
                if (String(key).indexOf("hel-calafkaaga") === 0) {
                  return caches.delete(key);
                }
              })
            );
          })
        : Promise.resolve();
      return clearCaches.then(function () {
        if (had && !sessionStorage.getItem("hel-sw-cleared")) {
          sessionStorage.setItem("hel-sw-cleared", "1");
          location.reload();
        }
      });
    });
  } catch (e) {}
})();
`;

  return (
    <Script id="hel-clear-stale-service-workers" strategy="beforeInteractive">
      {script}
    </Script>
  );
}
