"use client";

import Link from "next/link";
import { useConvexAuth } from "convex/react";
import { LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

type AuthRegisterCtaProps = {
  registerHref?: string;
  registerLabel: string;
  dashboardLabel?: string;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "secondary" | "outline" | "ghost";
};

export function AuthRegisterCta({
  registerHref = "/register",
  registerLabel,
  dashboardLabel = "Go to Dashboard",
  className,
  size = "lg",
  variant = "default",
}: AuthRegisterCtaProps) {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return (
      <Button size={size} variant={variant} className={className} disabled>
        {registerLabel}
      </Button>
    );
  }

  if (isAuthenticated) {
    return (
      <Button size={size} variant={variant} className={className} asChild>
        <Link href="/dashboard">
          <LayoutDashboard className="mr-2 h-4 w-4" />
          {dashboardLabel}
        </Link>
      </Button>
    );
  }

  return (
    <Button size={size} variant={variant} className={className} asChild>
      <Link href={registerHref}>{registerLabel}</Link>
    </Button>
  );
}
