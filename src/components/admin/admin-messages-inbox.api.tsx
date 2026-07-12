"use client";

import { MessageCircle } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import { useTranslation } from "@/lib/i18n/context";

interface AdminMessagesInboxProps {
  onOpenUser: (profileId: Id<"profiles">) => void;
}

/** Nest has no admin conversation moderation inbox yet. */
export function ApiAdminMessagesInbox(_props: AdminMessagesInboxProps) {
  const { t } = useTranslation();
  return (
    <div className="rounded-2xl border border-dashed border-border py-16 text-center px-6">
      <MessageCircle className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
      <p className="text-sm font-semibold">{t("adminPage.inboxTitle")}</p>
      <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
        {t("adminPage.noPlatformMessages")}
      </p>
    </div>
  );
}
