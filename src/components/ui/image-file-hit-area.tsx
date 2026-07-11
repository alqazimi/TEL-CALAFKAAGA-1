"use client";

import type { ChangeEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ImageFileHitAreaProps = {
  children: ReactNode;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  className?: string;
  accept?: string;
  "aria-label"?: string;
};

/**
 * Mobile-safe image picker: the real `<input type="file">` covers the hit area.
 * Do not use `hidden` / `sr-only` + label — Safari/iOS often ignores those clicks.
 */
export function ImageFileHitArea({
  children,
  onChange,
  disabled = false,
  className,
  accept = "image/*",
  "aria-label": ariaLabel = "Upload photo",
}: ImageFileHitAreaProps) {
  return (
    <div className={cn("relative isolate", className)}>
      <div className="pointer-events-none">{children}</div>
      <input
        type="file"
        accept={accept}
        disabled={disabled}
        aria-label={ariaLabel}
        className={cn(
          "absolute inset-0 z-30 m-0 h-full w-full cursor-pointer p-0 opacity-0",
          "file:hidden disabled:cursor-not-allowed disabled:pointer-events-none"
        )}
        onChange={onChange}
      />
    </div>
  );
}
