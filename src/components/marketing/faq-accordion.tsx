"use client";

import { motion } from "framer-motion";
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
      {items.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.05 }}
          className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden"
        >
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="flex w-full items-center justify-between p-6 text-left"
          >
            <span className="font-medium pr-4">{item.question}</span>
            <ChevronDown
              className={cn(
                "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200",
                openIndex === index && "rotate-180"
              )}
            />
          </button>
          {openIndex === index && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="px-6 pb-6"
            >
              <p className="text-muted-foreground leading-relaxed">{item.answer}</p>
            </motion.div>
          )}
        </motion.div>
      ))}
      {viewAllHref && viewAllLabel && (
        <div className="pt-4 text-center">
          <Link
            href={viewAllHref}
            className="text-sm font-medium text-primary hover:underline"
          >
            {viewAllLabel}
          </Link>
        </div>
      )}
    </div>
  );
}
