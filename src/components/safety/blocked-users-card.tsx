"use client";

import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { Ban, ShieldOff } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/lib/i18n/context";

export function BlockedUsersCard() {
  const { t } = useTranslation();
  const blockedUsers = useQuery(api.moderation.listMyBlocks);
  const unblockUser = useMutation(api.moderation.unblockUser);

  const handleUnblock = async (blockedUserId: Id<"users">, name: string) => {
    try {
      await unblockUser({ blockedUserId });
      toast.success(t("safety.unblockedToast", { name }));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("safety.actionFailed")
      );
    }
  };

  if (blockedUsers === undefined) {
    return <Skeleton className="h-32 w-full rounded-2xl" />;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Ban className="h-4 w-4 text-muted-foreground" />
          {t("safety.blockedUsersTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{t("safety.blockedUsersDesc")}</p>
        {blockedUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground rounded-xl border border-dashed border-border px-4 py-6 text-center">
            {t("safety.noBlockedUsers")}
          </p>
        ) : (
          <div className="space-y-2">
            {blockedUsers.map((blocked) => (
              <div
                key={blocked.blockedUserId}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{blocked.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("safety.blockedOn", {
                      date: new Date(blocked.createdAt).toLocaleDateString(),
                    })}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleUnblock(blocked.blockedUserId, blocked.name)
                  }
                >
                  <ShieldOff className="h-4 w-4 mr-1.5" />
                  {t("safety.unblock")}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
