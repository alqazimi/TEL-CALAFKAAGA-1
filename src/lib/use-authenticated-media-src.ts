"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/data/api-client";
import { isApiProvider } from "@/data/provider";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function asMediaId(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null;
  return UUID_RE.test(value) ? value : null;
}

/**
 * Show signed imageUrl immediately (works like admin today).
 * Only fetch Nest /media/:id when no signed URL is available.
 */
export function useAuthenticatedMediaSrc(
  imageUrl?: string | null,
  mediaId?: string | null
): string | undefined {
  const [src, setSrc] = useState<string | undefined>(imageUrl ?? undefined);
  const id = asMediaId(mediaId);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    setSrc(imageUrl ?? undefined);

    async function loadProxy() {
      if (!isApiProvider() || !id || imageUrl) return;
      try {
        const blob = await apiClient.getBlob(`/media/${id}`, {
          timeoutMs: 12_000,
        });
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      } catch {
        if (!cancelled) setSrc(undefined);
      }
    }

    void loadProxy();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [imageUrl, id]);

  return src;
}
