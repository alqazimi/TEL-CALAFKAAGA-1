"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiClient } from "@/data/api-client";
import { isApiProvider } from "@/data/provider";
import { cn } from "@/lib/utils";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function asMediaId(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null;
  return UUID_RE.test(value) ? value : null;
}

type AdminUserAvatarProps = {
  name: string;
  imageUrl?: string | null;
  profileImageMediaId?: string | null;
  profileImageId?: string | null;
  className?: string;
};

/**
 * Prefer signed imageUrl (already working in admin). Proxy /media only as backup.
 */
export function AdminUserAvatar({
  name,
  imageUrl,
  profileImageMediaId,
  profileImageId,
  className,
}: AdminUserAvatarProps) {
  const [src, setSrc] = useState<string | undefined>(imageUrl ?? undefined);
  const mediaId =
    asMediaId(profileImageMediaId) ?? asMediaId(profileImageId);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    setSrc(imageUrl ?? undefined);

    async function load() {
      if (imageUrl) return;
      if (!isApiProvider() || !mediaId) return;
      try {
        const blob = await apiClient.getBlob(`/media/${mediaId}`, {
          timeoutMs: 12_000,
        });
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      } catch {
        if (!cancelled) setSrc(undefined);
      }
    }

    void load();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [imageUrl, mediaId]);

  return (
    <Avatar className={cn("h-11 w-11 border border-border", className)}>
      <AvatarImage src={src} alt="" />
      <AvatarFallback className="bg-muted font-semibold">
        {(name || "?").charAt(0)}
      </AvatarFallback>
    </Avatar>
  );
}
