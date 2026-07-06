import { ReactNode } from "react";

interface MarketingPageProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function MarketingPage({ title, subtitle, children }: MarketingPageProps) {
  return (
    <div className="gradient-hero">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
