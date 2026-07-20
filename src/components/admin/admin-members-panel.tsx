"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Ban,
  CheckCircle,
  Eye,
  ImagePlus,
  Mail,
  MessageCircle,
  Phone,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import type { Profile as AdminUser } from "@/types";
import {
  useAdminApproveUser,
  useAdminBanUser,
  useAdminDeleteUser,
  useAdminRejectUser,
  useAdminRequestPhoto,
  useAdminSetRole,
} from "@/data/admin/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AdminUserAvatar } from "@/components/admin/admin-user-avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isOwnerRole, isStaffRole } from "@/lib/access";
import { WHATSAPP_URL } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n/context";
import type { TranslationPath } from "@/lib/i18n/translations";
import { resolveReviewStatus, requiresAdminProfileApproval } from "@/lib/review-status";
import { cn } from "@/lib/utils";
import { ConfirmDialog, type ConfirmDialogTone } from "@/components/ui/confirm-dialog";
import { getSafeUserError } from "@/lib/safe-error";

type RoleFilter = "all" | "user" | "admin" | "owner";
type PaymentFilter = "all" | "unpaid" | "paid" | "basic" | "premium";
export type ReviewFilter =
  | "all"
  | "needs_action"
  | "pending_review"
  | "approved"
  | "incomplete"
  | "rejected"
  | "suspended";

const REVIEW_FILTERS: { value: ReviewFilter; labelKey: TranslationPath }[] = [
  { value: "needs_action", labelKey: "adminPage.filterNeedsAction" },
  { value: "pending_review", labelKey: "adminPage.filterPendingReview" },
  { value: "approved", labelKey: "adminPage.filterApproved" },
  { value: "incomplete", labelKey: "adminPage.filterIncomplete" },
  { value: "rejected", labelKey: "adminPage.filterRejected" },
  { value: "suspended", labelKey: "adminPage.filterSuspended" },
  { value: "all", labelKey: "adminPage.filterAllStatuses" },
];

type PendingConfirm = {
  type: "reject" | "delete" | "ban" | "unban";
  user: AdminUser;
};

function isPremiumUser(user: AdminUser) {
  return user.hasPersonalSupport === true || (user.paidCents ?? 0) >= 2000;
}

function memberStatus(user: AdminUser): {
  labelKey: TranslationPath;
  className: string;
} {
  if (user.banned) {
    return {
      labelKey: "adminPage.statusBanned",
      className: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
    };
  }
  if (isStaffRole(user.role)) {
    return {
      labelKey: user.role === "owner" ? "adminPage.statusOwner" : "adminPage.statusAdmin",
      className: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200",
    };
  }
  const review = resolveReviewStatus(user);
  if (review === "incomplete") {
    return {
      labelKey: "adminPage.statusIncomplete",
      className: "bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-200",
    };
  }
  if (review === "rejected") {
    return {
      labelKey: "adminPage.statusRejected",
      className: "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300",
    };
  }
  if (review === "pending_review") {
    return {
      labelKey: "adminPage.statusPendingReview",
      className: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200",
    };
  }
  if (review === "suspended") {
    return {
      labelKey: "adminPage.statusBanned",
      className: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
    };
  }
  if (review === "approved") {
    return {
      labelKey: "adminPage.statusApproved",
      className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
    };
  }
  if (!user.hasPaid) {
    return {
      labelKey: "adminPage.statusUnpaid",
      className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    };
  }
  if (isPremiumUser(user)) {
    return {
      labelKey: "adminPage.statusPremium",
      className: "bg-primary/10 text-primary",
    };
  }
  return {
    labelKey: "adminPage.statusPaid",
    className: "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300",
  };
}

interface AdminMembersPanelProps {
  users: AdminUser[] | undefined;
  search: string;
  onSearchChange: (value: string) => void;
  roleFilter: RoleFilter;
  onRoleFilterChange: (value: RoleFilter) => void;
  paymentFilter: PaymentFilter;
  onPaymentFilterChange: (value: PaymentFilter) => void;
  reviewFilter: ReviewFilter;
  onReviewFilterChange: (value: ReviewFilter) => void;
  approvedMale?: number;
  approvedFemale?: number;
  approvedTotal?: number;
  currentProfileId?: string;
  canManageRoles: boolean;
  onOpenUser: (profileId: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  onActionComplete?: () => void;
}

export function AdminMembersPanel({
  users,
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  paymentFilter,
  onPaymentFilterChange,
  reviewFilter,
  onReviewFilterChange,
  approvedMale,
  approvedFemale,
  approvedTotal,
  currentProfileId,
  canManageRoles,
  onOpenUser,
  onLoadMore,
  hasMore,
  loadingMore,
  onActionComplete,
}: AdminMembersPanelProps) {
  const { t } = useTranslation();
  const approveUser = useAdminApproveUser();
  const rejectUser = useAdminRejectUser();
  const requestProfilePhoto = useAdminRequestPhoto();
  const banUser = useAdminBanUser();
  const deleteUser = useAdminDeleteUser();
  const setUserRole = useAdminSetRole();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);

  const canApproveMember = (user: AdminUser) => {
    if (isStaffRole(user.role) || !requiresAdminProfileApproval(user)) return false;
    const review = resolveReviewStatus(user);
    if (review === "approved" || review === "suspended") return false;
    // Rejected members can always be re-approved after they fix their photo.
    if (review === "rejected") return true;
    return !!user.profileImageId && !!user.phone?.trim();
  };

  const canRejectMember = (user: AdminUser) => {
    const review = resolveReviewStatus(user);
    return (
      !isStaffRole(user.role) &&
      requiresAdminProfileApproval(user) &&
      (review === "pending_review" || review === "approved" || review === "rejected")
    );
  };

  const runAction = async (
    profileId: string,
    action: () => Promise<unknown>,
    successMessage: string
  ) => {
    setBusyId(profileId);
    try {
      await action();
      toast.success(successMessage);
      setPendingConfirm(null);
      onActionComplete?.();
    } catch (error) {
      toast.error(getSafeUserError(error, t("adminPage.actionFailed")));
    } finally {
      setBusyId(null);
    }
  };

  const confirmCopy = (pending: PendingConfirm) => {
    const { type, user } = pending;
    if (type === "reject") {
      return {
        title: t("adminPage.rejectConfirmTitle"),
        description: t("adminPage.rejectConfirm", { name: user.name }),
        confirmLabel: t("adminPage.rejectShort"),
        tone: "warning" as ConfirmDialogTone,
      };
    }
    if (type === "delete") {
      return {
        title: t("adminPage.deleteConfirmTitle"),
        description: t("adminPage.deleteConfirm", { name: user.name }),
        confirmLabel: t("adminPage.deleteShort"),
        tone: "danger" as ConfirmDialogTone,
      };
    }
    if (type === "unban") {
      return {
        title: t("adminPage.unbanConfirmTitle"),
        description: t("adminPage.unbanConfirm", { name: user.name }),
        confirmLabel: t("adminPage.unbanShort"),
        tone: "warning" as ConfirmDialogTone,
      };
    }
    return {
      title: t("adminPage.banConfirmTitle"),
      description: t("adminPage.banConfirm", { name: user.name }),
      confirmLabel: t("adminPage.banShort"),
      tone: "danger" as ConfirmDialogTone,
    };
  };

  const handleConfirmAction = () => {
    if (!pendingConfirm) return;
    const { type, user } = pendingConfirm;
    if (type === "reject") {
      void runAction(
        user._id,
        () => rejectUser(user._id),
        t("adminPage.rejectSuccess")
      );
      return;
    }
    if (type === "delete") {
      void runAction(
        user._id,
        () => deleteUser(user._id),
        t("adminPage.deleteSuccess")
      );
      return;
    }
    void runAction(
      user._id,
      () => banUser(user._id, type === "ban"),
      type === "ban" ? t("adminPage.banSuccess") : t("adminPage.unbanSuccess")
    );
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-11 rounded-xl border-border/80 bg-background pl-10"
            placeholder={t("adminPage.searchPlaceholder")}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            {t("adminPage.filterByReview")}
          </p>
          <div className="flex flex-wrap gap-2">
            {REVIEW_FILTERS.map((item) => {
              const active = reviewFilter === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => onReviewFilterChange(item.value)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {t(item.labelKey)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-xl border border-emerald-200/70 bg-emerald-50/80 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/30">
          <div className="text-center">
            <p className="text-lg font-semibold tabular-nums text-foreground">
              {approvedMale ?? "—"}
            </p>
            <p className="text-[11px] font-medium text-muted-foreground">
              {t("adminPage.approvedMen")}
            </p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold tabular-nums text-foreground">
              {approvedFemale ?? "—"}
            </p>
            <p className="text-[11px] font-medium text-muted-foreground">
              {t("adminPage.approvedWomen")}
            </p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold tabular-nums text-foreground">
              {approvedTotal ?? "—"}
            </p>
            <p className="text-[11px] font-medium text-muted-foreground">
              {t("adminPage.approvedTotal")}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">{t("adminPage.filterByRole")}</p>
            <Select
              value={roleFilter}
              onValueChange={(value) => onRoleFilterChange(value as RoleFilter)}
            >
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("adminPage.filterAllRoles")}</SelectItem>
                <SelectItem value="user">{t("adminPage.filterMembers")}</SelectItem>
                <SelectItem value="admin">{t("adminPage.filterAdmins")}</SelectItem>
                <SelectItem value="owner">{t("adminPage.filterOwner")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">{t("adminPage.filterByPayment")}</p>
            <Select
              value={paymentFilter}
              onValueChange={(value) => onPaymentFilterChange(value as PaymentFilter)}
            >
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("adminPage.filterAllPayments")}</SelectItem>
                <SelectItem value="unpaid">{t("adminPage.unpaid")}</SelectItem>
                <SelectItem value="basic">{t("adminPage.paidBasic")}</SelectItem>
                <SelectItem value="premium">{t("adminPage.paidPremium")}</SelectItem>
                <SelectItem value="paid">{t("adminPage.filterAnyPaid")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">{t("adminPage.clickHint")}</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="hidden grid-cols-[minmax(0,1.4fr)_110px_100px_minmax(0,1fr)] gap-3 border-b border-border bg-muted/40 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:grid">
          <span>{t("adminPage.colMember")}</span>
          <span>{t("adminPage.colStatus")}</span>
          <span>{t("adminPage.colPayment")}</span>
          <span className="text-right">{t("adminPage.colActions")}</span>
        </div>

        {users === undefined ? (
          <div className="space-y-3 p-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="px-4 py-14 text-center">
            <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">{t("adminPage.noUsers")}</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {users.map((user) => {
              const status = memberStatus(user);
              const busy = busyId === user._id;
              const paymentLabel = isStaffRole(user.role)
                ? t("adminPage.badgeStaff")
                : user.hasPaid
                  ? isPremiumUser(user)
                    ? t("adminPage.paidPremium")
                    : t("adminPage.paidBasic")
                  : t("adminPage.unpaid");

              return (
                <li
                  key={user._id}
                  className={cn(
                    "grid gap-3 px-4 py-4 transition-colors hover:bg-muted/30 lg:grid-cols-[minmax(0,1.4fr)_110px_100px_minmax(0,1fr)] lg:items-center",
                  )}
                >
                  <button
                    type="button"
                    className="flex min-w-0 items-start gap-3 text-left"
                    onClick={() => onOpenUser(user._id)}
                  >
                    <AdminUserAvatar
                      name={user.name}
                      imageUrl={user.imageUrl}
                      profileImageMediaId={
                        (user as { profileImageMediaId?: string | null })
                          .profileImageMediaId
                      }
                      profileImageId={user.profileImageId as string | undefined}
                    />
                    <span className="min-w-0 space-y-0.5">
                      <span className="block truncate font-semibold text-foreground">
                        {user.name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground capitalize">
                        {user.gender}
                        {[user.city, user.country].filter(Boolean).length > 0
                          ? ` · ${[user.city, user.country].filter(Boolean).join(", ")}`
                          : ""}
                      </span>
                      {user.email && (
                        <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                          <Mail className="h-3 w-3 shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </span>
                      )}
                      {user.phone && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3 shrink-0" />
                          {user.phone}
                        </span>
                      )}
                    </span>
                  </button>

                  <div className="flex items-center gap-2 lg:block">
                    <span className="text-xs font-medium text-muted-foreground lg:hidden">
                      {t("adminPage.colStatus")}
                    </span>
                    <Badge className={cn("border-0 text-xs font-medium", status.className)}>
                      {t(status.labelKey)}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 lg:block">
                    <span className="text-xs font-medium text-muted-foreground lg:hidden">
                      {t("adminPage.colPayment")}
                    </span>
                    <p className="text-sm font-medium text-foreground">{paymentLabel}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 rounded-lg"
                      onClick={() => onOpenUser(user._id)}
                    >
                      <Eye className="mr-1.5 h-3.5 w-3.5" />
                      {t("adminPage.viewProfile")}
                    </Button>

                    {isPremiumUser(user) && !isStaffRole(user.role) && (
                      <Button size="sm" variant="outline" className="h-9 rounded-lg" asChild>
                        <a
                          href={`${WHATSAPP_URL}?text=${encodeURIComponent(
                            `Hi, I'm contacting you about Hel Calafkaaga — ${user.name}.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MessageCircle className="mr-1.5 h-3.5 w-3.5 text-[#25D366]" />
                          WhatsApp
                        </a>
                      </Button>
                    )}

                    {requiresAdminProfileApproval(user) &&
                      resolveReviewStatus(user) !== "approved" &&
                      !isStaffRole(user.role) && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 rounded-lg"
                        disabled={busy || !canApproveMember(user)}
                        title={
                          canApproveMember(user)
                            ? t("adminPage.approveUser")
                            : t("adminPage.approveIncomplete")
                        }
                        onClick={() =>
                          void runAction(
                            user._id,
                            () => approveUser(user._id),
                            t("adminPage.approveSuccess")
                          )
                        }
                      >
                        <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                        {t("adminPage.approveShort")}
                      </Button>
                    )}

                    {canRejectMember(user) && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 rounded-lg"
                        disabled={busy}
                        title={t("adminPage.rejectUser")}
                        onClick={() => setPendingConfirm({ type: "reject", user })}
                      >
                        {t("adminPage.rejectShort")}
                      </Button>
                    )}

                    {!isStaffRole(user.role) && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 rounded-lg"
                        disabled={busy}
                        title={t("adminPage.requestPhotoTitle")}
                        onClick={() =>
                          void runAction(
                            user._id,
                            () => requestProfilePhoto(user._id),
                            t("adminPage.requestPhotoSuccess")
                          )
                        }
                      >
                        <ImagePlus className="mr-1.5 h-3.5 w-3.5" />
                        {t("adminPage.requestPhotoShort")}
                      </Button>
                    )}

                    {canManageRoles && user.role === "admin" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 rounded-lg"
                        disabled={busy}
                        onClick={() =>
                          void runAction(
                            user._id,
                            () => setUserRole(user._id, "user"),
                            t("adminPage.demoted")
                          )
                        }
                      >
                        {t("adminPage.removeAdmin")}
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 rounded-lg"
                      disabled={busy || isOwnerRole(user.role)}
                      onClick={() =>
                        setPendingConfirm({
                          type: user.banned ? "unban" : "ban",
                          user,
                        })
                      }
                    >
                      <Ban className="mr-1.5 h-3.5 w-3.5" />
                      {user.banned ? t("adminPage.unbanShort") : t("adminPage.banShort")}
                    </Button>

                    {!isStaffRole(user.role) && user._id !== currentProfileId && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-9 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={busy}
                        onClick={() => setPendingConfirm({ type: "delete", user })}
                      >
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                        {t("adminPage.deleteShort")}
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {hasMore && (
          <div className="flex justify-center pt-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={loadingMore}
              onClick={() => onLoadMore?.()}
            >
              {loadingMore ? t("common.loading") : t("adminPage.loadMoreMembers")}
            </Button>
          </div>
        )}
        {users && users.length > 0 && (
          <p className="text-center text-xs text-muted-foreground">
            {t("adminPage.showingMembers", { count: users.length })}
          </p>
        )}
      </div>

      {pendingConfirm && (
        <ConfirmDialog
          open
          {...confirmCopy(pendingConfirm)}
          cancelLabel={t("common.cancel")}
          busy={busyId === pendingConfirm.user._id}
          onCancel={() => {
            if (busyId === pendingConfirm.user._id) return;
            setPendingConfirm(null);
          }}
          onConfirm={handleConfirmAction}
        />
      )}
    </div>
  );
}
