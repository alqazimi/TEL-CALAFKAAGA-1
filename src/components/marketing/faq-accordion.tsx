"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useFaqItems } from "@/lib/i18n/hooks";
import { cn } from "@/lib/utils";

export function FAQAccordion({
  limit,
  viewAllHref,
  viewAllLabel,
}: {
  limit?: number;
  viewAllHref?: string;
  viewAllLabel?: string;
} = {}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const faqItems = useFaqItems();
  const items = limit ? faqItems.slice(0, limit) : faqItems;

  return (
    <div className="space-y-3 max-w-3xl mx-auto">
      {items.map((item, index) => {
        const open = openIndex === index;
        return (
          <div
            key={index}
            className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden motion-safe:animate-reveal"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <button
              type="button"
              onClick={() => setOpenIndex(open ? null : index)}
              className="flex w-full items-center justify-between p-6 text-left"
              aria-expanded={open}
            >
              <span className="font-bold pr-4">{item.question}</span>
              <ChevronDown
                className={cn(
                  "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200",
                  open && "rotate-180"
                )}
              />
            </button>
            {open ? (
              <div className="px-6 pb-6">
                <p className="text-muted-foreground leading-relaxed">{item.answer}</p>
              </div>
            ) : null}
          </div>
        );
      })}
      {viewAllHref && viewAllLabel ? (
        <div className="pt-4 text-center">
          <Link
            href={viewAllHref}
            className="text-sm font-medium text-primary hover:underline"
          >
            {viewAllLabel}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
