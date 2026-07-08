import Script from "next/script";
import {
  PWA_INSTALLABLE_EVENT,
  PWA_INSTALLED_EVENT,
} from "@/lib/pwa-install";

/** Capture beforeinstallprompt before React hydrates — avoids missing the event on Android. */
export function PwaInstallCapture() {
  const script = `
window.__PWA_DEFERRED_PROMPT = null;
window.addEventListener("beforeinstallprompt", function (e) {
  e.preventDefault();
  window.__PWA_DEFERRED_PROMPT = e;
  window.dispatchEvent(new Event("${PWA_INSTALLABLE_EVENT}"));
});
window.addEventListener("appinstalled", function () {
  window.__PWA_DEFERRED_PROMPT = null;
  window.dispatchEvent(new Event("${PWA_INSTALLED_EVENT}"));
});
`;

  return (
    <Script id="hel-pwa-install-capture" strategy="beforeInteractive">
      {script}
    </Script>
  );
}
