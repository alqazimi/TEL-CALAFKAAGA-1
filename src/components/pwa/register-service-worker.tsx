"use client";

/**
 * PWA service worker registration is disabled.
 * A previous SW caused Chrome (especially from Google Search) to hang on load.
 * Install prompt / icons still work without an active worker for now.
 */
export function RegisterServiceWorker() {
  return null;
}
