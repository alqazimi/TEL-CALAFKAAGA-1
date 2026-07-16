"use client";

import { LazyImage } from "@/components/ui/lazy-image";
import { useAuthenticatedMediaSrc } from "@/lib/use-authenticated-media-src";
import { cn } from "@/lib/utils";

type AuthenticatedMediaImageProps = {
  imageUrl?: string | null;
  mediaId?: string | null;
  alt: string;
  className?: string;
};

/** Profile/match photo that loads via Nest /media when available. */
export function AuthenticatedMediaImage({
  imageUrl,
  mediaId,
  alt,
  className,
}: AuthenticatedMediaImageProps) {
  const src = useAuthenticatedMediaSrc(imageUrl, mediaId);
  if (!src) return null;
  return <LazyImage src={src} alt={alt} className={cn(className)} />;
}
