"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  href?: string;
  size?: "sm" | "md";
  showName?: boolean;
  showTagline?: boolean;
  variant?: "default" | "light";
  className?: string;
}

export function BrandLogo({
  href = "/",
  size = "md",
  showName = true,
  showTagline = false,
  variant = "default",
  className,
}: BrandLogoProps) {
  const { t } = useTranslation();
  const iconSize = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const heartSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const textSize = size === "sm" ? "text-lg" : "text-xl";
  const isLight = variant === "light";

  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5 group", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md transition-transform group-hover:scale-105",
          iconSize
        )}
      >
        <Heart className={heartSize} fill="currentColor" />
      </div>
      {showName && (
        <div className="flex flex-col leading-tight">
          <span
            className={cn(
              "font-display font-semibold tracking-tight",
              textSize,
              isLight ? "text-white" : "text-foreground"
            )}
          >
            {APP_NAME}
          </span>
          {showTagline && (
            <span
              className={cn(
                "text-[10px] font-medium uppercase tracking-wider",
                isLight ? "text-primary-foreground/80" : "text-primary"
              )}
            >
              {t("brand.tagline")}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
