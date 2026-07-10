"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import {
  CreditCard,
  Flag,
  Heart,
  Mail,
  Megaphone,
  Phone,
  TrendingUp,
  Users,
  Wallet,
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
import { AdminUserDetailPanel } from "@/components/admin/admin-user-detail-panel";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { isStaffRole } from "@/lib/access";
import { getAuthenticatedHomeRoute } from "@/lib/routes";
import { useTranslation } from "@/lib/i18n/context";
import type { TranslationPath } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";

type RoleFilter = "all" | "user" | "admin" | "owner";
type PaymentFilter = "all" | "unpaid" | "paid" | "basic" | "premium";

const ADMIN_TABS = ["users", "payments", "analytics", "reports", "announcements"] as const;
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
    : "users";

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [announcement, setAnnouncement] = useState({ title: "", body: "" });
  const [selectedProfileId, setSelectedProfileId] = useState<Id<"profiles"> | null>(null);

  const currentUser = useQuery(api.users.currentUser) as CurrentUser | null | undefined;
  const isStaff = isStaffRole(currentUser?.profile?.role);
  const bootstrapStatus = useQuery(api.admin.getBootstrapStatus);
  const stats = useQuery(api.admin.getStats) as AdminStats | null | undefined;
  const users = useQuery(
    api.admin.getAllUsers,
    isStaff
      ? { search: search || undefined, role: roleFilter, payment: paymentFilter }
      : "skip"
  ) as AdminUser[] | undefined;
  const analytics = useQuery(api.admin.getAnalytics, isStaff ? {} : "skip") as
    | AdminAnalytics
    | undefined;
  const payments = useQuery(api.admin.getAllPayments, isStaff ? {} : "skip") as
    | AdminPayment[]
    | undefined;
  const reports = useQuery(
    api.moderation.listReports,
    isStaff && activeTab === "reports" ? {} : "skip"
  );
  const banUser = useMutation(api.admin.banUser);
  const createAnnouncement = useMutation(api.admin.createAnnouncement);
  const updateReportStatus = useMutation(api.moderation.updateReportStatus);

  useEffect(() => {
    if (currentUser !== undefined && !isStaffRole(currentUser?.profile?.role)) {
      router.replace(getAuthenticatedHomeRoute(currentUser?.profile));
    }
  }, [currentUser, router]);

  const setTab = (tab: AdminTab) => {
    router.replace(`/admin?tab=${tab}`, { scroll: false });
  };

  const handleAnnouncement = async () => {
    if (!announcement.title || !announcement.body) return;
    try {
      await createAnnouncement(announcement);
      toast.success(t("adminPage.announcementSent"));
      setAnnouncement({ title: "", body: "" });
    } catch {
      toast.error(t("adminPage.announcementFailed"));
    }
  };

  if (currentUser === undefined || bootstrapStatus === undefined || stats === undefined) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (stats === null) {
    return (
      <DashboardLayout>
        <div className="py-16">
          <AdminBootstrapPanel />
        </div>
      </DashboardLayout>
    );
  }

  const canManageRoles = stats.isOwner;
  const incompleteCount =
    users?.filter((u) => !isStaffRole(u.role) && !u.questionnaireComplete).length ?? 0;
  const openReports = reports?.filter((r) => r.status === "open").length ?? 0;

  const TAB_META: Record<
    AdminTab,
    { title: TranslationPath; desc: TranslationPath; icon: typeof Users }
  > = {
    users: { title: "adminPage.users", desc: "adminPage.usersDesc", icon: Users },
    payments: { title: "adminPage.payments", desc: "adminPage.paymentsDesc", icon: CreditCard },
    analytics: { title: "adminPage.analytics", desc: "adminPage.analyticsDesc", icon: TrendingUp },
    reports: { title: "adminPage.reports", desc: "adminPage.reportsDesc", icon: Flag },
    announcements: {
      title: "adminPage.announcements",
      desc: "adminPage.announcementsDesc",
      icon: Megaphone,
    },
  };

  const overviewStats = [
    {
      label: t("adminPage.totalUsers"),
      value: stats.totalUsers,
      hint: t("adminPage.statMembersHint"),
      icon: Users,
    },
    {
      label: t("adminPage.revenue"),
      value: `$${(stats.revenue / 100).toFixed(0)}`,
      hint: t("adminPage.statRevenueHint"),
      icon: Wallet,
    },
    {
      label: t("adminPage.paidPremium"),
      value: stats.paidPremiumCount,
      hint: t("adminPage.statPremiumHint"),
      icon: Heart,
    },
    {
      label: t("adminPage.unpaid"),
      value: stats.unpaidCount,
      hint: t("adminPage.statUnpaidHint"),
      icon: CreditCard,
    },
  ];

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {stats.isOwner ? t("adminPage.ownerConsole") : t("adminPage.adminConsole")}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("adminPage.title")}
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {stats.isOwner ? t("adminPage.ownerDesc") : t("adminPage.adminDesc")}
          </p>
        </header>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {overviewStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-sm)]"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-foreground">
                <stat.icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
              </div>
              <p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
              <p className="mt-0.5 text-sm font-medium text-foreground">{stat.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p>
            </div>
          ))}
        </section>

        {(incompleteCount > 0 || openReports > 0 || stats.unpaidCount > 0) && (
          <section className="rounded-2xl border border-border bg-muted/30 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("adminPage.needsAttention")}
            </p>
            <div className="flex flex-wrap gap-2">
              {incompleteCount > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => {
                    setRoleFilter("user");
                    setPaymentFilter("all");
                    setTab("users");
                  }}
                >
                  {t("adminPage.attentionIncomplete", { count: incompleteCount })}
                </Button>
              )}
              {stats.unpaidCount > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => {
                    setRoleFilter("user");
                    setPaymentFilter("unpaid");
                    setTab("users");
                  }}
                >
                  {t("adminPage.attentionUnpaid", { count: stats.unpaidCount })}
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

        <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-border bg-card p-1.5">
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

        <section className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">{t(TAB_META[activeTab].title)}</h2>
          <p className="text-sm text-muted-foreground">{t(TAB_META[activeTab].desc)}</p>
        </section>

        {activeTab === "users" && (
          <div className="space-y-5">
            <AdminMembersPanel
              users={users}
              search={search}
              onSearchChange={setSearch}
              roleFilter={roleFilter}
              onRoleFilterChange={setRoleFilter}
              paymentFilter={paymentFilter}
              onPaymentFilterChange={setPaymentFilter}
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
              </CardContent>
            </Card>
            <Card className="border-border shadow-none">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">{t("adminPage.conversionRate")}</p>
                <p className="mt-2 text-4xl font-semibold tracking-tight">
                  {analytics?.conversionRate ?? 0}%
                </p>
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
              <Button className="rounded-xl" onClick={() => void handleAnnouncement()}>
                {t("adminPage.sendToAll")}
              </Button>
            </CardContent>
          </Card>
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
                  </p>
                  {report.status === "open" && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg"
                        onClick={() =>
                          void updateReportStatus({
                            reportId: report._id,
                            status: "reviewed",
                          })
                        }
                      >
                        {t("adminPage.markReviewed")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg"
                        onClick={() =>
                          void updateReportStatus({
                            reportId: report._id,
                            status: "dismissed",
                          })
                        }
                      >
                        {t("adminPage.dismissReport")}
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
                            })
                          }
                        >
                          {t("adminPage.banFromReport")}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {selectedProfileId && (
          <AdminUserDetailPanel
            profileId={selectedProfileId}
            onClose={() => setSelectedProfileId(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
