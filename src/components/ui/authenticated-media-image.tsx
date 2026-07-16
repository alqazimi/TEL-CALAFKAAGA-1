"use client";

import { LazyImage } from "@/components/ui/lazy-image";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthenticatedMediaSrc } from "@/lib/use-authenticated-media-src";
import { cn } from "@/lib/utils";

type AuthenticatedMediaImageProps = {
  imageUrl?: string | null;
  mediaId?: string | null;
  alt: string;
  className?: string;
  /** When set, show initials instead of an empty hole if the photo cannot load. */
  fallbackName?: string;
};

/** Profile/match photo — prefers signed imageUrl; /media proxy only as backup. */
export function AuthenticatedMediaImage({
  imageUrl,
  mediaId,
  alt,
  className,
  fallbackName,
}: AuthenticatedMediaImageProps) {
  const src = useAuthenticatedMediaSrc(imageUrl, mediaId);
  if (src) {
    return <LazyImage src={src} alt={alt} className={cn(className)} />;
  }
  if (fallbackName) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-muted",
          className
        )}
      >
        <Avatar className="h-24 w-24">
          <AvatarFallback className="text-3xl font-display">
            {fallbackName.charAt(0) || "?"}
          </AvatarFallback>
        </Avatar>
      </div>
    );
  }
  return null;
}
