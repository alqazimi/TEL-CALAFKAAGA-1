import Link from "next/link";
import { Heart } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  href?: string;
  size?: "sm" | "md";
  showName?: boolean;
  className?: string;
}

export function BrandLogo({
  href = "/",
  size = "md",
  showName = true,
  className,
}: BrandLogoProps) {
  const iconSize = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  const heartSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const textSize = size === "sm" ? "text-lg" : "text-xl";

  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5 group", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md transition-transform group-hover:scale-105",
          iconSize
        )}
      >
        <Heart className={heartSize} />
      </div>
      {showName && (
        <span className={cn("font-bold tracking-tight", textSize)}>{APP_NAME}</span>
      )}
    </Link>
  );
}
