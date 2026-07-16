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
 * Prefer Nest /media/:id (session token) so photos work cross-site;
 * fall back to a pre-signed imageUrl.
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

    async function load() {
      if (isApiProvider() && id) {
        try {
          const blob = await apiClient.getBlob(`/media/${id}`);
          if (cancelled) return;
          objectUrl = URL.createObjectURL(blob);
          setSrc(objectUrl);
          return;
        } catch {
          // fall through
        }
      }
      if (!cancelled) setSrc(imageUrl ?? undefined);
    }

    void load();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [imageUrl, id]);

  return src;
}
