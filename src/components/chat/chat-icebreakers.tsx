"use client";

import { useMemo } from "react";
import type { TranslationPath } from "@/lib/i18n/translations";
import { useTranslation } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";

const ICEBREAKER_KEYS: TranslationPath[] = [
  "chatPage.icebreaker1",
  "chatPage.icebreaker2",
  "chatPage.icebreaker3",
  "chatPage.icebreaker4",
];

export function ChatIcebreakers({
  partnerName,
  onPick,
}: {
  partnerName?: string;
  onPick: (text: string) => void;
}) {
  const { t } = useTranslation();
  const name = partnerName?.split(" ")[0] || "";

  const prompts = useMemo(
    () =>
      ICEBREAKER_KEYS.map((key) => t(key, { name })).filter(
        (text) => typeof text === "string" && text.length > 0
      ),
    [t, name]
  );

  if (prompts.length === 0) return null;

  return (
    <div className="mt-5 w-full max-w-sm mx-auto space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t("chatPage.icebreakersTitle")}
      </p>
      <div className="flex flex-col gap-2">
        {prompts.map((text) => (
          <Button
            key={text}
            type="button"
            variant="outline"
            className="h-auto whitespace-normal rounded-2xl px-3 py-2.5 text-left text-xs leading-relaxed justify-start"
            onClick={() => onPick(text)}
          >
            {text}
          </Button>
        ))}
      </div>
    </div>
  );
}
