"use client";

import { ReactNode, Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { AppShellHeader } from "@/components/layout/app-shell-header";
import { AppMobileNav } from "@/components/layout/app-mobile-nav";
import { TrialAccessSync } from "@/components/auth/trial-access-sync";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/lib/i18n/context";

const mobileNavFallback = (
  <div className="lg:hidden fixed bottom-0 left-0 right-0 h-[3.25rem] border-t border-border bg-card" />
);

const sidebarFallback = <div className="hidden lg:block lg:w-64 shrink-0" aria-hidden />;

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen dashboard-bg flex flex-col">
        <AppShellHeader />
        <div className="flex flex-1 flex-col lg:pl-64 lg:pt-16">
          <div className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-8 pb-[calc(var(--app-tabbar)+1rem)] lg:pb-8 space-y-4">
            <Skeleton className="h-8 w-48" aria-hidden />
            <Skeleton className="h-64 w-full max-w-3xl rounded-2xl" aria-hidden />
            <p className="text-sm text-muted-foreground" role="status">
              {t("common.loadingData")}
            </p>
          </div>
        </div>
        <Suspense fallback={mobileNavFallback}>
          <AppMobileNav />
        </Suspense>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen dashboard-bg flex flex-col">
      <TrialAccessSync />
      <AppShellHeader />
      <Suspense fallback={sidebarFallback}>
        <DashboardSidebar />
      </Suspense>
      <div className="flex flex-1 flex-col lg:pl-64 lg:pt-16">
        <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-[calc(var(--app-tabbar)+1rem)] lg:pb-8">
          {children}
        </div>
      </div>
      <Suspense fallback={mobileNavFallback}>
        <AppMobileNav />
      </Suspense>
    </div>
  );
}
