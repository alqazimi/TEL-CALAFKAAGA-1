"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { Copy, Mail, RefreshCw, UserPlus, XCircle } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/lib/i18n/context";
import type { TranslationPath } from "@/lib/i18n/translations";

function formatInviteStatus(status: string, t: (key: TranslationPath) => string) {
  switch (status) {
    case "pending":
      return t("adminInvites.statusPending");
    case "accepted":
      return t("adminInvites.statusAccepted");
    case "revoked":
      return t("adminInvites.statusRevoked");
    case "expired":
      return t("adminInvites.statusExpired");
    default:
      return status;
  }
}

function statusVariant(status: string): "default" | "secondary" | "outline" {
  if (status === "pending") return "default";
  if (status === "accepted") return "secondary";
  return "outline";
}

function buildInviteLink(token: string): string {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/admin/invite?token=${encodeURIComponent(token)}`;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to legacy approach
  }
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export function AdminStaffInvitesPanel() {
  const { t } = useTranslation();
  const invites = useQuery(api.staffInvites.list);
  const createInvite = useMutation(api.staffInvites.create);
  const revokeInvite = useMutation(api.staffInvites.revoke);
  const resendInvite = useMutation(api.staffInvites.resend);

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<Id<"staffInvites"> | null>(null);

  if (invites === undefined) {
    return <Skeleton className="h-40 w-full rounded-2xl" />;
  }

  if (invites === null) {
    return null;
  }

  const handleCreate = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error(t("adminInvites.emailRequired"));
      return;
    }

    setSubmitting(true);
    try {
      const result = await createInvite({ email: trimmed });
      setEmail("");
      const link = buildInviteLink(result.token);
      const copied = await copyToClipboard(link);
      toast.success(
        copied ? t("adminInvites.createdCopied") : t("adminInvites.created")
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("adminInvites.sendFailed")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyLink = async (token: string | undefined) => {
    if (!token) return;
    const copied = await copyToClipboard(buildInviteLink(token));
    if (copied) {
      toast.success(t("adminInvites.linkCopied"));
    } else {
      toast.error(t("adminInvites.linkCopyFailed"));
    }
  };

  const handleRevoke = async (inviteId: Id<"staffInvites">) => {
    setBusyId(inviteId);
    try {
      await revokeInvite({ inviteId });
      toast.success(t("adminInvites.revoked"));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("adminInvites.revokeFailed")
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleResend = async (inviteId: Id<"staffInvites">) => {
    setBusyId(inviteId);
    try {
      await resendInvite({ inviteId });
      toast.success(t("adminInvites.resent"));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("adminInvites.resendFailed")
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <UserPlus className="h-4 w-4 text-primary" />
          {t("adminInvites.title")}
        </CardTitle>
        <CardDescription>{t("adminInvites.description")}</CardDescription>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("adminInvites.noEmailHint")}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="admin-invite-email">{t("adminInvites.emailLabel")}</Label>
            <Input
              id="admin-invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("adminInvites.emailPlaceholder")}
              autoComplete="off"
            />
          </div>
          <div className="flex items-end">
            <Button
              className="w-full sm:w-auto"
              onClick={() => void handleCreate()}
              disabled={submitting}
            >
              {submitting ? t("adminInvites.sending") : t("adminInvites.sendInvite")}
            </Button>
          </div>
        </div>

        {invites.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("adminInvites.recent")}
            </p>
            <ul className="space-y-2">
              {invites.slice(0, 8).map((invite) => (
                <li
                  key={invite._id}
                  className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                      <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{invite.email}</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={statusVariant(invite.status)}>
                        {formatInviteStatus(invite.status, t)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {t("adminInvites.expires", {
                          date: new Date(invite.expiresAt).toLocaleDateString(),
                        })}
                      </span>
                    </div>
                  </div>
                  {invite.status === "pending" && (
                    <div className="flex flex-wrap gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void handleCopyLink(invite.token)}
                      >
                        <Copy className="mr-1.5 h-3.5 w-3.5" />
                        {t("adminInvites.copyLink")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === invite._id}
                        onClick={() => void handleResend(invite._id)}
                      >
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                        {t("adminInvites.resend")}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busyId === invite._id}
                        onClick={() => void handleRevoke(invite._id)}
                      >
                        <XCircle className="mr-1.5 h-3.5 w-3.5" />
                        {t("adminInvites.revoke")}
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
