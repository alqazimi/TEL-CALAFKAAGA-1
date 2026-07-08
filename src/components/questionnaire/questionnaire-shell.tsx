"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface QuestionnaireShellProps {
  children: ReactNode;
  progress: number;
  phaseLabel: string;
  onBack?: () => void;
  className?: string;
}

export function QuestionnaireShell({
  children,
  progress,
  phaseLabel,
  onBack,
  className,
}: QuestionnaireShellProps) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-background flex flex-col">
        <Skeleton className="h-1 w-full rounded-none" />
        <div className="px-5 py-6 max-w-xl mx-auto w-full space-y-6 flex-1">
          <Skeleton className="h-6 w-32 mx-auto" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <div className="h-1 w-full bg-muted shrink-0">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>

      <header className="shrink-0 border-b border-border/60 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-xl items-center gap-2 px-4">
          {onBack ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 rounded-full"
              onClick={onBack}
              aria-label="Back"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          ) : (
            <div className="w-10 shrink-0" />
          )}
          <p className="flex-1 text-center text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground truncate">
            {phaseLabel}
          </p>
          <div className="w-10 shrink-0" />
        </div>
      </header>

      <main
        className={cn(
          "flex-1 w-full max-w-xl mx-auto px-5 py-6 sm:py-8",
          className
        )}
      >
        {children}
      </main>
    </div>
  );
}
