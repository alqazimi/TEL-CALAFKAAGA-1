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
 * Mobile-safe image picker for iPhone / Android / Safari / Firefox.
 *
 * Critical rules (do not regress):
 * - Real `<input type="file">` must receive the tap (not a programmatic .click()).
 * - Do NOT put `overflow-hidden` / `hidden` / `sr-only` on the same box as the input.
 * - Clip photos on an INNER element only.
 * - `form="_hel_nofileform"` keeps the input out of any parent <form> so Firefox
 *   does not show “Leave this page?” after picking a photo.
 */
export function ImageFileHitArea({
  children,
  onChange,
  disabled = false,
  className,
  accept = "image/*,image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp,.heic,.heif",
  "aria-label": ariaLabel = "Upload photo",
}: ImageFileHitAreaProps) {
  return (
    <div
      className={cn(
        "relative cursor-pointer touch-manipulation select-none",
        disabled && "pointer-events-none opacity-60",
        className
      )}
    >
      <div className="pointer-events-none">{children}</div>
      <input
        type="file"
        accept={accept}
        disabled={disabled}
        aria-label={ariaLabel}
        // Disconnect from any surrounding form (Firefox leave-page warning).
        form="_hel_nofileform"
        className="absolute inset-0 z-[60] m-0 block h-full w-full cursor-pointer p-0 opacity-0"
        style={{
          fontSize: 16,
          WebkitTapHighlightColor: "transparent",
        }}
        onClick={(e) => {
          // Avoid bubbling into parent buttons/links.
          e.stopPropagation();
        }}
        onChange={onChange}
      />
    </div>
  );
}
