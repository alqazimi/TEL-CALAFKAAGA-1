"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "convex/react";
import { useSafeQuery } from "@/lib/use-safe-query";
import { toast } from "sonner";
import {
  CheckCircle2,
  CreditCard,
  Flag,
  Heart,
  Mail,
  Megaphone,
  MessageCircle,
  Phone,
  ScrollText,
  Settings,
  TrendingUp,
  Users,
  Wallet,
  LayoutDashboard,
  Clock,
} from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import type {
  AdminAnalytics,
  AdminPayment,
  AdminStats,
  CurrentUser,
  Profile as AdminUser,
} from "@/types";
import { AdminBootstrapPanel } from "@/components/admin/admin-bootstrap-panel";
import { AdminMembersPanel } from "@/components/admin/admin-members-panel";
import { AdminStaffInvitesPanel } from "@/components/admin/admin-staff-invites-panel";
import { AdminUserDetailPanel } from "@/components/admin/admin-user-detail-panel";
import { LoadingRecovery } from "@/components/auth/loading-recovery";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useLoadingTimeout } from "@/hooks/use-loading-timeout";
import { isStaffRole } from "@/lib/access";
import { getAuthenticatedHomeRoute } from "@/lib/routes";
import { useTranslation } from "@/lib/i18n/context";
import type { TranslationPath } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";
import {
  PERSONAL_SUPPORT_PRICE,
  REGISTRATION_PRICE,
  SUPPORT_EMAIL,
  TRIAL_DAYS,
  WHATSAPP_DISPLAY,
  WHATSAPP_URL,
} from "@/lib/constants";

type RoleFilter = "all" | "user" | "admin" | "owner";
type PaymentFilter = "all" | "unpaid" | "paid" | "basic" | "premium";
type ReviewFilter =
  | "all"
  | "needs_action"
  | "pending_review"
  | "approved"
  | "incomplete"
  | "rejected"
  | "suspended";

const ADMIN_TABS = [
  "dashboard",
  "users",
  "messages",
  "reports",
  "payments",
  "announcements",
  "analytics",
  "audit",
  "settings",
] as const;
type AdminTab = (typeof ADMIN_TABS)[number];

function formatPaymentLabel(
  payment: AdminPayment,
  t: (key: TranslationPath, params?: Record<string, string | number>) => string
) {
  if (payment.registrationTier === "premium" || payment.paymentType === "registration_premium") {
    return t("adminPage.paymentRegistrationPremium");
  }
  if (payment.paymentType === "premium_upgrade") {
    return t("adminPage.paymentPremiumUpgrade");
  }
  if (payment.registrationTier === "basic" || payment.paymentType === "registration") {
    return t("adminPage.paymentRegistrationBasic");
  }
  if (payment.paymentType === "chat") return t("adminPage.paymentChatUnlock");
  return `$${(payment.amount / 100).toFixed(0)}`;
}

export default function AdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  const tabParam = searchParams.get("tab");
  const activeTab: AdminTab = ADMIN_TABS.includes(tabParam as AdminTab)
    ? (tabParam as AdminTab)
    : "dashboard";

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("needs_action");
  const [announcement, setAnnouncement] = useState({
    title: "",
    body: "",
    audience: "all" as "all" | "paid" | "trial" | "unpaid",
    scheduledForLocal: "",
  });
  const [selectedProfileId, setSelectedProfileId] = useState<Id<"profiles"> | null>(null);
  const [reportNotes, setReportNotes] = useState<Record<string, string>>({});

  const currentUser = useSafeQuery(api.users.currentUser) as CurrentUser | null | undefined;
  const userTimedOut = useLoadingTimeout(currentUser === undefined, 8_000);
  const isStaff = isStaffRole(currentUser?.profile?.role);
  const bootstrapStatus = useSafeQuery(
    api.admin.getBootstrapStatus,
    currentUser !== undefined && !isStaff ? {} : "skip"
  );
  const stats = useSafeQuery(
    api.admin.getStats,
    currentUser !== undefined && isStaff ? {} : "skip"
  ) as AdminStats | null | undefined;
  const users = useSafeQuery(
    api.admin.getAllUsers,
    isStaff && activeTab === "users"
      ? {
          search: search || undefined,
          role: roleFilter,
          payment: paymentFilter,
          review: reviewFilter,
          limit: 100,
        }
      : "skip"
  ) as AdminUser[] | undefined;
  const analytics = useSafeQuery(
    api.admin.getAnalytics,
    isStaff && activeTab === "analytics" ? {} : "skip"
  ) as AdminAnalytics | undefined;
  const payments = useSafeQuery(
    api.admin.getAllPayments,
    isStaff && activeTab === "payments" ? {} : "skip"
  ) as AdminPayment[] | undefined;
  const reports = useSafeQuery(
    api.moderation.listReports,
    isStaff && (activeTab === "reports" || activeTab === "dashboard") ? {} : "skip"
  );
  const recentMessages = useSafeQuery(
    api.admin.getRecentMessages,
    isStaff && activeTab === "messages" ? { limit: 80 } : "skip"
  );
  const auditLogs = useSafeQuery(
    api.admin.getAuditLogs,
    isStaff && activeTab === "audit" ? { limit: 80 } : "skip"
  );
  const banUser = useMutation(api.admin.banUser);
  const createAnnouncement = useMutation(api.admin.createAnnouncement);
  const updateReportStatus = useMutation(api.moderation.updateReportStatus);

  useEffect(() => {
    if (currentUser === undefined) return;
    if (isStaffRole(currentUser?.profile?.role)) return;
    // First-time setup: stay on /admin to claim owner.
    if (bootstrapStatus === undefined) return;
    if (!bootstrapStatus.hasAdmins) return;
    router.replace(getAuthenticatedHomeRoute(currentUser?.profile));
  }, [bootstrapStatus, currentUser, router]);

  const setTab = (tab: AdminTab) => {
    router.replace(`/admin?tab=${tab}`, { scroll: false });
  };

  const handleAnnouncement = async () => {
    if (!announcement.title || !announcement.body) return;
    try {
      const scheduledFor = announcement.scheduledForLocal
        ? new Date(announcement.scheduledForLocal).getTime()
        : undefined;
      if (
        announcement.scheduledForLocal &&
        (scheduledFor === undefined || Number.isNaN(scheduledFor))
      ) {
        toast.error(t("adminPage.scheduleInvalid"));
        return;
      }
      const result = await createAnnouncement({
        title: announcement.title,
        body: announcement.body,
        audience: announcement.audience,
        scheduledFor,
      });
      toast.success(
        result?.scheduled
          ? t("adminPage.announcementScheduled")
          : t("adminPage.announcementSent")
      );
      setAnnouncement({
        title: "",
        body: "",
        audience: "all",
        scheduledForLocal: "",
      });
    } catch {
      toast.error(t("adminPage.announcementFailed"));
    }
  };

  if (currentUser === undefined) {
    return (
      <DashboardLayout>
        <LoadingRecovery stuck={userTimedOut} />
      </DashboardLayout>
    );
  }

  if (!isStaff) {
    if (bootstrapStatus === undefined) {
      return (
        <DashboardLayout>
          <Skeleton className="h-72 w-full rounded-2xl" />
        </DashboardLayout>
      );
    }
    return (
      <DashboardLayout>
        <div className="py-16">
          <AdminBootstrapPanel />
        </div>
      </DashboardLayout>
    );
  }

  const canManageRoles = currentUser.profile?.role === "owner" || stats?.isOwner === true;
  const pendingReviewCount = stats?.pendingApproval ?? 0;
  const openReports = reports?.filter((r) => r.status === "open").length ?? 0;

  const TAB_META: Record<
    AdminTab,
    { title: TranslationPath; desc: TranslationPath; icon: typeof Users }
  > = {
    dashboard: {
      title: "adminPage.dashboard",
      desc: "adminPage.dashboardDesc",
      icon: LayoutDashboard,
    },
    users: { title: "adminPage.users", desc: "adminPage.usersDesc", icon: Users },
    messages: {
      title: "adminPage.messagesTab",
      desc: "adminPage.messagesTabDesc",
      icon: MessageCircle,
    },
    payments: { title: "adminPage.payments", desc: "adminPage.paymentsDesc", icon: CreditCard },
    analytics: { title: "adminPage.analytics", desc: "adminPage.analyticsDesc", icon: TrendingUp },
    reports: { title: "adminPage.reports", desc: "adminPage.reportsDesc", icon: Flag },
    announcements: {
      title: "adminPage.announcements",
      desc: "adminPage.announcementsDesc",
      icon: Megaphone,
    },
    audit: { title: "adminPage.auditLogs", desc: "adminPage.auditLogsDesc", icon: ScrollText },
    settings: { title: "adminPage.settings", desc: "adminPage.settingsDesc", icon: Settings },
  };

  const isOwner = canManageRoles;
  const overviewStats = [
    {
      label: t("adminPage.totalUsers"),
      value: stats?.totalUsers ?? "—",
      hint: t("adminPage.statMembersHint"),
      icon: Users,
    },
    {
      label: t("adminPage.approvedMen"),
      value: stats?.approvedMale ?? "—",
      hint: t("adminPage.statApprovedMenHint"),
      icon: Users,
    },
    {
      label: t("adminPage.approvedWomen"),
      value: stats?.approvedFemale ?? "—",
      hint: t("adminPage.statApprovedWomenHint"),
      icon: Users,
    },
    {
      label: t("adminPage.approvedTotal"),
      value: stats?.approvedTotal ?? "—",
      hint: t("adminPage.statApprovedTotalHint"),
      icon: CheckCircle2,
    },
    {
      label: t("adminPage.paidPremium"),
      value:
        stats != null
          ? (stats.paidBasicCount ?? 0) + (stats.paidPremiumCount ?? 0)
          : "—",
      hint: t("adminPage.statPaidHint"),
      icon: CreditCard,
    },
    {
      label: t("adminPage.trialMembers"),
      value: stats?.trialCount ?? "—",
      hint: t("adminPage.statTrialHint"),
      icon: Clock,
    },
    {
      label: t("adminPage.revenue"),
      value: stats ? `$${(stats.revenue / 100).toFixed(0)}` : "—",
      hint: t("adminPage.statRevenueHint"),
      icon: Wallet,
    },
    {
      label: t("adminPage.pendingReview"),
      value: stats?.pendingApproval ?? "—",
      hint: t("adminPage.statPendingHint"),
      icon: Flag,
    },
    {
      label: t("adminPage.activeMatches"),
      value: stats?.totalMatches ?? "—",
      hint: t("adminPage.statMatchesHint"),
      icon: Heart,
    },
    {
      label: t("adminPage.messages"),
      value: stats?.totalMessages ?? "—",
      hint: t("adminPage.statMessagesHint"),
      icon: MessageCircle,
    },
    {
      label: t("adminPage.openReports"),
      value: openReports,
      hint: t("adminPage.statReportsHint"),
      icon: Flag,
    },
  ];

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {isOwner ? t("adminPage.ownerConsole") : t("adminPage.adminConsole")}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("adminPage.title")}
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {isOwner ? t("adminPage.ownerDesc") : t("adminPage.adminDesc")}
          </p>
        </header>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {(activeTab === "dashboard" ? overviewStats : overviewStats.slice(0, 4)).map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-sm)]"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-foreground">
                <stat.icon className="h-[18px] w-[18px]" />
              </div>
              <p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
              <p className="mt-0.5 text-sm font-medium text-foreground">{stat.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p>
            </div>
          ))}
        </section>

        {(pendingReviewCount > 0 || openReports > 0 || (stats?.unpaidCount ?? 0) > 0) &&
          (activeTab === "dashboard" || activeTab === "users") && (
          <section className="rounded-2xl border border-border bg-muted/30 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("adminPage.needsAttention")}
            </p>
            <div className="flex flex-wrap gap-2">
              {pendingReviewCount > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => {
                    setRoleFilter("user");
                    setPaymentFilter("all");
                    setReviewFilter("needs_action");
                    setTab("users");
                  }}
                >
                  {t("adminPage.attentionPending", { count: pendingReviewCount })}
                </Button>
              )}
              {(stats?.unpaidCount ?? 0) > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => {
                    setRoleFilter("user");
                    setPaymentFilter("unpaid");
                    setReviewFilter("all");
                    setTab("users");
                  }}
                >
                  {t("adminPage.attentionUnpaid", { count: stats!.unpaidCount })}
                </Button>
              )}
              {openReports > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => setTab("reports")}
                >
                  {t("adminPage.attentionReports", { count: openReports })}
                </Button>
              )}
            </div>
          </section>
        )}

        <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-border bg-card p-1.5 lg:hidden">
          {ADMIN_TABS.map((tab) => {
            const meta = TAB_META[tab];
            const Icon = meta.icon;
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setTab(tab)}
                className={cn(
                  "inline-flex min-w-fit flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{t(meta.title)}</span>
              </button>
            );
          })}
        </nav>

        {activeTab !== "dashboard" && (
          <section className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight">{t(TAB_META[activeTab].title)}</h2>
            <p className="text-sm text-muted-foreground">{t(TAB_META[activeTab].desc)}</p>
          </section>
        )}

        {activeTab === "dashboard" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-border shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t("adminPage.quickActions")}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setTab("users")}>
                  {t("adminPage.users")}
                </Button>
                <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setTab("reports")}>
                  {t("adminPage.reports")}
                </Button>
                <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setTab("payments")}>
                  {t("adminPage.payments")}
                </Button>
                <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setTab("audit")}>
                  {t("adminPage.auditLogs")}
                </Button>
              </CardContent>
            </Card>
            <Card className="border-border shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t("adminPage.reviewQueue")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tabular-nums">{pendingReviewCount}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("adminPage.pendingReview")}
                </p>
                <Button
                  size="sm"
                  className="mt-4 rounded-xl"
                  onClick={() => {
                    setRoleFilter("user");
                    setPaymentFilter("all");
                    setReviewFilter("pending_review");
                    setTab("users");
                  }}
                >
                  {t("adminPage.reviewProfiles")}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "users" && (
          <div className="space-y-5">
            {canManageRoles && <AdminStaffInvitesPanel />}
            <AdminMembersPanel
              users={users}
              search={search}
              onSearchChange={setSearch}
              roleFilter={roleFilter}
              onRoleFilterChange={setRoleFilter}
              paymentFilter={paymentFilter}
              onPaymentFilterChange={setPaymentFilter}
              reviewFilter={reviewFilter}
              onReviewFilterChange={setReviewFilter}
              approvedMale={stats?.approvedMale}
              approvedFemale={stats?.approvedFemale}
              approvedTotal={stats?.approvedTotal}
              currentProfileId={currentUser?.profile?._id}
              canManageRoles={canManageRoles}
              onOpenUser={setSelectedProfileId}
            />
          </div>
        )}

        {activeTab === "payments" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{t("adminPage.paymentsShowingCompleted")}</p>
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              {payments?.length === 0 ? (
                <div className="px-4 py-14 text-center">
                  <CreditCard className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">{t("adminPage.noPayments")}</p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {payments?.map((payment) => (
                    <li
                      key={payment._id}
                      className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{payment.userName}</p>
                          <Badge variant="outline" className="text-xs">
                            {formatPaymentLabel(payment, t)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(payment.createdAt).toLocaleString()}
                        </p>
                        {payment.userEmail && (
                          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{payment.userEmail}</span>
                          </p>
                        )}
                        {payment.userPhone && (
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3 shrink-0" />
                            {payment.userPhone}
                          </p>
                        )}
                      </div>
                      <p className="text-xl font-semibold tabular-nums">
                        ${(payment.amount / 100).toFixed(0)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-border shadow-none">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">{t("adminPage.matchRate")}</p>
                <p className="mt-2 text-4xl font-semibold tracking-tight">
                  {analytics?.matchRate ?? 0}%
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("adminPage.matchRateHint")}
                </p>
              </CardContent>
            </Card>
            <Card className="border-border shadow-none">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">{t("adminPage.conversionRate")}</p>
                <p className="mt-2 text-4xl font-semibold tracking-tight">
                  {analytics?.conversionRate ?? 0}%
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("adminPage.conversionRateHint")}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t("adminPage.genderSplit")}</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const gender = analytics?.genderBreakdown ?? {
                    male: 0,
                    female: 0,
                    unknown: 0,
                  };
                  const entries = [
                    { key: "male", label: t("adminPage.genderMale"), count: gender.male },
                    { key: "female", label: t("adminPage.genderFemale"), count: gender.female },
                    {
                      key: "unknown",
                      label: t("adminPage.genderUnknown"),
                      count: gender.unknown,
                    },
                  ].filter((e) => e.count > 0);
                  const max = Math.max(...entries.map((e) => e.count), 1);
                  if (entries.length === 0) {
                    return (
                      <p className="text-sm text-muted-foreground">{t("adminPage.noAnalytics")}</p>
                    );
                  }
                  return (
                    <div className="space-y-3">
                      {entries.map((entry) => (
                        <div key={entry.key} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{entry.label}</span>
                            <span className="text-muted-foreground">{entry.count}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary/80"
                              style={{ width: `${(entry.count / max) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            <Card className="border-border shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t("adminPage.reviewSplit")}</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const review = analytics?.reviewBreakdown ?? {};
                  const labels: Record<string, TranslationPath> = {
                    incomplete: "adminPage.statusIncomplete",
                    pending_review: "adminPage.statusPendingReview",
                    approved: "adminPage.reviewApproved",
                    rejected: "adminPage.statusRejected",
                    suspended: "adminPage.statusBanned",
                  };
                  const displayLabel = (key: string) =>
                    t(labels[key] ?? "adminPage.noAnalytics");
                  const entries = Object.entries(review)
                    .filter(([, count]) => count > 0)
                    .sort(([, a], [, b]) => b - a);
                  const max = Math.max(...entries.map(([, c]) => c), 1);
                  if (entries.length === 0) {
                    return (
                      <p className="text-sm text-muted-foreground">{t("adminPage.noAnalytics")}</p>
                    );
                  }
                  return (
                    <div className="space-y-3">
                      {entries.map(([key, count]) => (
                        <div key={key} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{displayLabel(key)}</span>
                            <span className="text-muted-foreground">{count}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-foreground/70"
                              style={{ width: `${(count / max) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            <Card className="border-border shadow-none sm:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t("adminPage.monthlySignups")}</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const entries = Object.entries(analytics?.monthlySignups ?? {})
                    .sort(([a], [b]) => a.localeCompare(b))
                    .slice(-12);
                  const max = Math.max(...entries.map(([, c]) => c), 1);
                  if (entries.length === 0) {
                    return (
                      <p className="text-sm text-muted-foreground">{t("adminPage.noAnalytics")}</p>
                    );
                  }
                  return (
                    <div className="flex items-end gap-2 h-40">
                      {entries.map(([month, count]) => (
                        <div
                          key={month}
                          className="flex flex-1 flex-col items-center justify-end gap-1 min-w-0 h-full"
                        >
                          <span className="text-[10px] text-muted-foreground tabular-nums">
                            {count}
                          </span>
                          <div
                            className="w-full max-w-10 rounded-t-md bg-primary/75"
                            style={{ height: `${Math.max(8, (count / max) * 100)}%` }}
                            title={`${month}: ${count}`}
                          />
                          <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                            {month.slice(5)}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            <Card className="border-border shadow-none sm:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t("adminPage.usersByCountry")}</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(analytics?.countryBreakdown ?? {}).length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("adminPage.noAnalytics")}</p>
                ) : (
                  (() => {
                    const entries = Object.entries(analytics?.countryBreakdown ?? {})
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 10);
                    const max = Math.max(...entries.map(([, c]) => c), 1);
                    return (
                      <div className="space-y-3">
                        {entries.map(([country, count]) => (
                          <div key={country} className="space-y-1.5">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">{country}</span>
                              <span className="text-muted-foreground">{count}</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-foreground/80"
                                style={{ width: `${(count / max) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "announcements" && (
          <Card className="border-border shadow-none">
            <CardHeader>
              <CardTitle className="text-base">{t("adminPage.sendAnnouncement")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("adminPage.announcementTitle")}</Label>
                <Input
                  className="rounded-xl"
                  value={announcement.title}
                  onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
                  placeholder={t("adminPage.announcementTitlePh")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("adminPage.announcementBody")}</Label>
                <Textarea
                  className="rounded-xl"
                  value={announcement.body}
                  onChange={(e) => setAnnouncement({ ...announcement, body: e.target.value })}
                  placeholder={t("adminPage.announcementBodyPh")}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("adminPage.announcementAudience")}</Label>
                <div className="flex flex-wrap gap-2">
                  {(["all", "paid", "trial", "unpaid"] as const).map((audience) => (
                    <Button
                      key={audience}
                      type="button"
                      size="sm"
                      variant={announcement.audience === audience ? "default" : "outline"}
                      className="rounded-full"
                      onClick={() => setAnnouncement({ ...announcement, audience })}
                    >
                      {t(`adminPage.audience_${audience}` as TranslationPath)}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("adminPage.announcementSchedule")}</Label>
                <Input
                  type="datetime-local"
                  className="rounded-xl"
                  value={announcement.scheduledForLocal}
                  onChange={(e) =>
                    setAnnouncement({
                      ...announcement,
                      scheduledForLocal: e.target.value,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {t("adminPage.announcementScheduleHint")}
                </p>
              </div>
              <Button className="rounded-xl" onClick={() => void handleAnnouncement()}>
                {announcement.scheduledForLocal
                  ? t("adminPage.scheduleSend")
                  : t("adminPage.sendToAll")}
              </Button>
            </CardContent>
          </Card>
        )}

        {activeTab === "messages" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{t("adminPage.messagesTabHint")}</p>
            {recentMessages === undefined ? (
              <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
            ) : recentMessages === null || recentMessages.length === 0 ? (
              <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
                {t("adminPage.noPlatformMessages")}
              </p>
            ) : (
              <ul className="space-y-2">
                {recentMessages.map((msg) => (
                  <li
                    key={msg.id}
                    className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-sm)]"
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
                      <button
                        type="button"
                        className="font-semibold hover:underline"
                        disabled={!msg.senderProfileId}
                        onClick={() => {
                          if (msg.senderProfileId) setSelectedProfileId(msg.senderProfileId);
                        }}
                      >
                        {msg.senderName}
                      </button>
                      <span className="text-muted-foreground">→</span>
                      <button
                        type="button"
                        className="font-medium hover:underline"
                        disabled={!msg.peerProfileId}
                        onClick={() => {
                          if (msg.peerProfileId) setSelectedProfileId(msg.peerProfileId);
                        }}
                      >
                        {msg.peerName}
                      </button>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="break-words text-sm text-foreground/90">
                      {msg.hasImage && !msg.body ? t("adminDetail.imageMessage") : msg.body}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === "reports" && (
          <div className="space-y-3">
            {reports === undefined ? (
              <Skeleton className="h-40 w-full rounded-2xl" />
            ) : reports.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border py-14 text-center">
                <Flag className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">{t("adminPage.noReports")}</p>
              </div>
            ) : (
              reports.map((report) => (
                <div
                  key={report._id}
                  className="space-y-3 rounded-2xl border border-border bg-card p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={report.status === "open" ? "default" : "outline"}>
                      {report.status === "open"
                        ? t("adminPage.reportOpen")
                        : report.status === "reviewed"
                          ? t("adminPage.reportReviewed")
                          : t("adminPage.reportDismissed")}
                    </Badge>
                    <Badge variant="outline">{report.reason.replaceAll("_", " ")}</Badge>
                  </div>
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <p>
                      <span className="text-muted-foreground">{t("adminPage.reportedUser")}: </span>
                      <button
                        type="button"
                        className="font-semibold underline-offset-2 hover:underline"
                        onClick={() => {
                          if (report.reportedProfileId) {
                            setSelectedProfileId(report.reportedProfileId);
                          }
                        }}
                      >
                        {report.reportedName}
                      </button>
                    </p>
                    <p>
                      <span className="text-muted-foreground">{t("adminPage.reporter")}: </span>
                      <span className="font-medium">{report.reporterName}</span>
                    </p>
                  </div>
                  {report.details && (
                    <p className="text-sm text-muted-foreground">{report.details}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(report.createdAt).toLocaleString()}
                    {" · "}
                    {t("adminPage.priority")}: {report.priority ?? "medium"}
                  </p>
                  {report.status === "open" && (
                    <div className="space-y-3">
                      <Textarea
                        className="rounded-xl text-sm"
                        rows={2}
                        placeholder={t("adminPage.adminNotesPh")}
                        value={reportNotes[report._id] ?? ""}
                        onChange={(e) =>
                          setReportNotes((prev) => ({
                            ...prev,
                            [report._id]: e.target.value,
                          }))
                        }
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg"
                          onClick={() =>
                            void updateReportStatus({
                              reportId: report._id,
                              status: "reviewed",
                              priority: "high",
                              adminNotes: reportNotes[report._id],
                              resolution: "reviewed",
                            }).then(() => toast.success(t("adminPage.reportUpdated")))
                          }
                        >
                          {t("adminPage.markReviewed")}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="rounded-lg"
                          onClick={() =>
                            void updateReportStatus({
                              reportId: report._id,
                              status: "dismissed",
                              priority: "low",
                              adminNotes: reportNotes[report._id],
                              resolution: "dismissed",
                            }).then(() => toast.success(t("adminPage.reportUpdated")))
                          }
                        >
                          {t("adminPage.dismiss")}
                        </Button>
                        {report.reportedProfileId && !report.reportedBanned && (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="rounded-lg"
                            onClick={() =>
                              void banUser({
                                profileId: report.reportedProfileId!,
                                banned: true,
                              }).then(() => toast.success(t("adminPage.userBanned")))
                            }
                          >
                            {t("adminPage.banUser")}
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                  {report.adminNotes && report.status !== "open" && (
                    <p className="text-xs text-muted-foreground border-t border-border pt-2">
                      {t("adminPage.adminNotes")}: {report.adminNotes}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "audit" && (
          <div className="space-y-3">
            {auditLogs === undefined ? (
              <Skeleton className="h-40 w-full rounded-2xl" />
            ) : auditLogs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border py-14 text-center">
                <ScrollText className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">{t("adminPage.noAuditLogs")}</p>
              </div>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log._id}
                  className="rounded-2xl border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">
                      {log.actorName}{" "}
                      <span className="font-normal text-muted-foreground">· {log.action}</span>
                    </p>
                    {log.targetName && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {t("adminPage.auditTarget")}: {log.targetName}
                      </p>
                    )}
                    {log.metadata && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">{log.metadata}</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground shrink-0">
                    {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "settings" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-border shadow-none">
              <CardHeader>
                <CardTitle className="text-base">{t("adminPage.settingsPricing")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">{t("adminPage.basicPlan")}: </span>
                  <span className="font-semibold">${REGISTRATION_PRICE}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">{t("adminPage.premiumPlan")}: </span>
                  <span className="font-semibold">${PERSONAL_SUPPORT_PRICE}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">{t("adminPage.trialLength")}: </span>
                  <span className="font-semibold">
                    {TRIAL_DAYS} {t("adminPage.days")}
                  </span>
                </p>
              </CardContent>
            </Card>
            <Card className="border-border shadow-none">
              <CardHeader>
                <CardTitle className="text-base">{t("adminPage.settingsSupport")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {SUPPORT_EMAIL}
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    {WHATSAPP_DISPLAY}
                  </a>
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {selectedProfileId && (
          <AdminUserDetailPanel
            profileId={selectedProfileId}
            onClose={() => setSelectedProfileId(null)}
            onOpenUser={setSelectedProfileId}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
