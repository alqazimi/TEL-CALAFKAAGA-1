"use client";

import type { ReactNode } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";

/**
 * Isolates chrome crashes (nav/footer) so a mobile auth/query failure
 * cannot replace the whole page with the global error screen.
 */
export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <>
      <ErrorBoundary
        fallback={
          <header className="sticky top-0 z-50 border-b border-border bg-card px-4 py-4">
            <a href="/" className="font-display text-lg font-semibold text-foreground">
              Hel Calafkaaga
            </a>
          </header>
        }
      >
        <Navbar />
      </ErrorBoundary>
      <main className="flex-1">{children}</main>
      <ErrorBoundary fallback={null}>
        <Footer />
      </ErrorBoundary>
    </>
  );
}
