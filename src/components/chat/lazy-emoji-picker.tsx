"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

export const LazyEmojiPicker = dynamic(
  () => import("emoji-picker-react").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[260px] w-full rounded-xl" />,
  }
);

export type { EmojiClickData } from "emoji-picker-react";
