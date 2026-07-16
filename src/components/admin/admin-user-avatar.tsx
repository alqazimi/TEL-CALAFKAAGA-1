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
 * Admin avatars load through Nest `/media/:id` with the session token so
 * photos show even when direct R2 signed URLs are blocked by the browser.
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

    async function load() {
      if (isApiProvider() && mediaId) {
        try {
          const blob = await apiClient.getBlob(`/media/${mediaId}`);
          if (cancelled) return;
          objectUrl = URL.createObjectURL(blob);
          setSrc(objectUrl);
          return;
        } catch {
          // fall through to signed URL
        }
      }
      if (!cancelled) setSrc(imageUrl ?? undefined);
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
