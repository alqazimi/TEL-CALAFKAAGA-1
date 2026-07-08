export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    __PWA_DEFERRED_PROMPT?: BeforeInstallPromptEvent | null;
  }
}

export const PWA_INSTALLABLE_EVENT = "hel-pwa-installable";
export const PWA_INSTALLED_EVENT = "hel-pwa-installed";

export function getDeferredInstallPrompt(): BeforeInstallPromptEvent | null {
  if (typeof window === "undefined") return null;
  return window.__PWA_DEFERRED_PROMPT ?? null;
}

export function clearDeferredInstallPrompt(): void {
  if (typeof window === "undefined") return;
  window.__PWA_DEFERRED_PROMPT = null;
}
