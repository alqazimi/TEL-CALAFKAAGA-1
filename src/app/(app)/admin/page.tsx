"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import {
  Users,
  Heart,
  MessageCircle,
  DollarSign,
  Search,
  Ban,
  CheckCircle,
  Trash2,
  Megaphone,
  Shield,
  ShieldOff,
  Crown,
  Mail,
  Phone,
  Headphones,
  CreditCard,
  TrendingUp,
  UserCheck,
  Wallet,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import type {
  AdminStats,
  AdminAnalytics,
  AdminPayment,
  Profile as AdminUser,
  CurrentUser,
} from "@/types";
import { AdminBootstrapPanel } from "@/components/admin/admin-bootstrap-panel";
import { AdminUserDetailPanel } from "@/components/admin/admin-user-detail-panel";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { isOwnerRole, isStaffRole } from "@/lib/access";
import { WHATSAPP_URL } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n/context";
import type { TranslationPath } from "@/lib/i18n/translations";

type RoleFilter = "all" | "user" | "admin" | "owner";
type PaymentFilter = "all" | "unpaid" | "paid" | "basic" | "premium";

const ROLE_FILTER_KEYS = [
  { value: "all" as const, key: "adminPage.filterAllRoles" as const },
  { value: "user" as const, key: "adminPage.filterMembers" as const },
  { value: "admin" as const, key: "adminPage.filterAdmins" as const },
  { value: "owner" as const, key: "adminPage.filterOwner" as const },
];

const PAYMENT_FILTER_KEYS = [
  { value: "all" as const, key: "adminPage.filterAllPayments" as const },
  { value: "unpaid" as const, key: "adminPage.unpaid" as const },
  { value: "basic" as const, key: "adminPage.paidBasic" as const },
  { value: "premium" as const, key: "adminPage.paidPremium" as const },
  { value: "paid" as const, key: "adminPage.filterAnyPaid" as const },
];

function isPremiumUser(user: AdminUser) {
  return user.hasPersonalSupport === true || (user.paidCents ?? 0) >= 2000;
}

function formatPaymentLabel(
  payment: AdminPayment,
  t: (key: TranslationPath, params?: Record<string, string | number>) => string
) {
  if (payment.registrationTier === "premium" || payment.paymentType === "registration_premium") {
    return t("adminPage.paymentRegistrationPremium");
  }
  if (payment.registrationTier === "basic" || payment.paymentType === "registration") {
    return t("adminPage.paymentRegistrationBasic");
  }
  if (payment.paymentType === "chat") return t("adminPage.paymentChatUnlock");
  return `$${(payment.amount / 100).toFixed(0)}`;
}

export default function AdminPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [showInProgressPayments, setShowInProgressPayments] = useState(false);
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
  const analytics = useQuery(
    api.admin.getAnalytics,
    isStaff ? {} : "skip"
  ) as AdminAnalytics | undefined;
  const payments = useQuery(
    api.admin.getAllPayments,
    isStaff ? { includeInProgress: showInProgressPayments } : "skip"
  ) as AdminPayment[] | undefined;
  const reconcileCheckouts = useMutation(api.admin.reconcileAbandonedCheckouts);
  const approveUser = useMutation(api.admin.approveUser);
  const banUser = useMutation(api.admin.banUser);
  const deleteUser = useMutation(api.admin.deleteUser);
  const setUserRole = useMutation(api.admin.setUserRole);
  const createAnnouncement = useMutation(api.admin.createAnnouncement);

  useEffect(() => {
    if (currentUser !== undefined && !isStaffRole(currentUser?.profile?.role)) {
      router.replace("/dashboard");
    }
  }, [currentUser, router]);

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

  const handleRoleChange = async (profileId: Id<"profiles">, role: "user" | "admin") => {
    try {
      await setUserRole({ profileId, role });
      toast.success(role === "admin" ? t("adminPage.promoted") : t("adminPage.demoted"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("adminPage.roleFailed"));
    }
  };

  if (currentUser === undefined || bootstrapStatus === undefined || stats === undefined) {
    return (
      <DashboardLayout>
        <Skeleton className="h-96 w-full" />
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

  const currentProfileId = currentUser?.profile?._id;
  const canManageRoles = stats.isOwner;

  const statCards = [
    {
      label: t("adminPage.totalUsers"),
      value: stats.totalUsers,
      icon: Users,
      iconClass: "text-blue-600 dark:text-blue-400",
      chipClass: "bg-blue-100 dark:bg-blue-950/60",
    },
    {
      label: t("adminPage.paidBasic"),
      value: stats.paidBasicCount,
      icon: DollarSign,
      iconClass: "text-emerald-600 dark:text-emerald-400",
      chipClass: "bg-emerald-100 dark:bg-emerald-950/60",
    },
    {
      label: t("adminPage.paidPremium"),
      value: stats.paidPremiumCount,
      icon: Headphones,
      iconClass: "text-violet-600 dark:text-violet-400",
      chipClass: "bg-violet-100 dark:bg-violet-950/60",
    },
    {
      label: t("adminPage.unpaid"),
      value: stats.unpaidCount,
      icon: UserCheck,
      iconClass: "text-slate-600 dark:text-slate-400",
      chipClass: "bg-slate-100 dark:bg-slate-800/60",
    },
    {
      label: t("dashboard.matches"),
      value: stats.totalMatches,
      icon: Heart,
      iconClass: "text-primary",
      chipClass: "bg-primary/10",
    },
    {
      label: t("adminPage.revenue"),
      value: `$${(stats.revenue / 100).toFixed(0)}`,
      icon: Wallet,
      iconClass: "text-amber-600 dark:text-amber-400",
      chipClass: "bg-amber-100 dark:bg-amber-950/60",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                {stats.isOwner ? t("adminPage.ownerConsole") : t("adminPage.adminConsole")}
              </div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {t("adminPage.title")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {stats.isOwner ? t("adminPage.ownerDesc") : t("adminPage.adminDesc")}
              </p>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-border bg-card/70 px-5 py-3 backdrop-blur">
              <div className="text-center">
                <p className="text-xl font-bold leading-none">{stats.totalUsers}</p>
                <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">{t("adminPage.members")}</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="text-xl font-bold leading-none text-emerald-600 dark:text-emerald-400">
                  ${(stats.revenue / 100).toFixed(0)}
                </p>
                <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">{t("adminPage.revenue")}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {statCards.map((stat) => (
            <Card
              key={stat.label}
              className="group border-border/70 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
            >
              <CardContent className="p-4">
                <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl ${stat.chipClass}`}>
                  <stat.icon className={`h-5 w-5 ${stat.iconClass}`} />
                </div>
                <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
                <p className="mt-0.5 text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="users">
          <TabsList className="h-auto flex-wrap gap-1 rounded-2xl bg-muted/60 p-1.5">
            <TabsTrigger value="users" className="rounded-xl data-[state=active]:shadow-sm">{t("adminPage.users")}</TabsTrigger>
            <TabsTrigger value="payments" className="rounded-xl data-[state=active]:shadow-sm">{t("adminPage.payments")}</TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-xl data-[state=active]:shadow-sm">{t("adminPage.analytics")}</TabsTrigger>
            <TabsTrigger value="announcements" className="rounded-xl data-[state=active]:shadow-sm">{t("adminPage.announcements")}</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4 pt-2">
            <Card className="border-border/70">
              <CardContent className="space-y-4 p-4 sm:p-5">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="h-11 rounded-xl pl-10"
                    placeholder={t("adminPage.searchPlaceholder")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("adminPage.role")}</span>
                    {ROLE_FILTER_KEYS.map((f) => (
                      <Button
                        key={f.value}
                        size="sm"
                        variant={roleFilter === f.value ? "default" : "outline"}
                        className="h-8 rounded-full px-3.5 text-xs"
                        onClick={() => setRoleFilter(f.value)}
                      >
                        {t(f.key)}
                      </Button>
                    ))}
                  </div>
                  <div className="hidden h-6 w-px bg-border sm:block" />
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("adminPage.payment")}</span>
                    {PAYMENT_FILTER_KEYS.map((f) => (
                      <Button
                        key={f.value}
                        size="sm"
                        variant={paymentFilter === f.value ? "default" : "outline"}
                        className="h-8 rounded-full px-3.5 text-xs"
                        onClick={() => setPaymentFilter(f.value)}
                      >
                        {t(f.key)}
                      </Button>
                    ))}
                  </div>
                </div>

                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ChevronRight className="h-3.5 w-3.5" />
                  {t("adminPage.clickHint")}
                </p>
              </CardContent>
            </Card>

            <div className="space-y-2.5">
              {users?.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border py-12 text-center">
                  <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">{t("adminPage.noUsers")}</p>
                </div>
              )}
              {users?.map((user) => (
                <Card
                  key={user._id}
                  className={`group cursor-pointer border-border/70 transition-all hover:border-primary/30 hover:shadow-md ${
                    selectedProfileId === user._id ? "border-primary/50 ring-2 ring-primary/40" : ""
                  }`}
                  onClick={() => setSelectedProfileId(user._id)}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <Avatar className="h-12 w-12 border border-border">
                      <AvatarImage src={user.imageUrl ?? undefined} />
                      <AvatarFallback className="bg-muted font-semibold">{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold">{user.name}</p>
                        <Badge variant="outline" className="text-xs capitalize">{user.gender}</Badge>
                        {isOwnerRole(user.role) && (
                          <Badge className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                            <Crown className="h-3 w-3 mr-1" />
                            {t("adminPage.badgeOwner")}
                          </Badge>
                        )}
                        {user.role === "admin" && (
                          <Badge className="text-xs bg-primary/10 text-primary">{t("adminPage.badgeAdmin")}</Badge>
                        )}
                        {user.banned && <Badge className="text-xs bg-red-100 text-red-600">{t("adminPage.badgeBanned")}</Badge>}
                        {!user.approved && <Badge className="text-xs bg-amber-100 text-amber-600">{t("adminPage.badgePending")}</Badge>}
                        {isStaffRole(user.role) ? (
                          <Badge variant="outline" className="text-xs">{t("adminPage.badgeStaff")}</Badge>
                        ) : user.hasPaid ? (
                          <>
                            <Badge className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                              {user.paidCents
                                ? `Paid $${(user.paidCents / 100).toFixed(0)}`
                                : t("adminPage.badgePaid")}
                            </Badge>
                            {isPremiumUser(user) && (
                              <Badge className="text-xs bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                                <Headphones className="h-3 w-3 mr-1" />
                                {t("adminPage.badgePersonalSupport")}
                              </Badge>
                            )}
                          </>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            {t("adminPage.unpaid")}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {[user.country, user.city].filter(Boolean).join(" · ") || "—"}
                      </p>
                      <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                        {user.email && (
                          <p className="flex items-center gap-1.5 truncate">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{user.email}</span>
                          </p>
                        )}
                        {user.phone && (
                          <p className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3 shrink-0" />
                            {user.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {isPremiumUser(user) && !isStaffRole(user.role) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title={t("adminPage.contactWhatsApp")}
                          asChild
                        >
                          <a
                            href={`${WHATSAPP_URL}?text=${encodeURIComponent(
                              `Hi, I'm ${user.name} — I registered for Calaf with personal support.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <MessageCircle className="h-4 w-4 text-[#25D366]" />
                          </a>
                        </Button>
                      )}
                      {canManageRoles && !isOwnerRole(user.role) && (
                        user.role === "admin" ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            title={t("adminPage.removeAdmin")}
                            onClick={() => void handleRoleChange(user._id, "user")}
                          >
                            <ShieldOff className="h-4 w-4 text-amber-600" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            title={t("adminPage.makeAdmin")}
                            onClick={() => void handleRoleChange(user._id, "admin")}
                          >
                            <Shield className="h-4 w-4 text-primary" />
                          </Button>
                        )
                      )}
                      {!user.approved && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title={t("adminPage.approveUser")}
                          onClick={() => approveUser({ profileId: user._id })}
                        >
                          <CheckCircle className="h-4 w-4 text-primary" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        title={user.banned ? t("adminPage.unbanUser") : t("adminPage.banUser")}
                        onClick={() => banUser({ profileId: user._id, banned: !user.banned })}
                        disabled={isOwnerRole(user.role)}
                      >
                        <Ban className={`h-4 w-4 ${user.banned ? "text-primary" : "text-destructive"}`} />
                      </Button>
                      {!isStaffRole(user.role) && user._id !== currentProfileId && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title={t("adminPage.deleteUser")}
                          onClick={() => deleteUser({ profileId: user._id })}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="payments" className="space-y-2.5 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {showInProgressPayments
                  ? t("adminPage.paymentsShowingInProgress")
                  : t("adminPage.paymentsShowingCompleted")}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={showInProgressPayments ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowInProgressPayments((v) => !v)}
                >
                  {showInProgressPayments
                    ? t("adminPage.hideInProgress")
                    : t("adminPage.showInProgress")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const result = await reconcileCheckouts({});
                      toast.success(
                        t("adminPage.reconcileDone", { count: result.updated })
                      );
                    } catch (error) {
                      toast.error(
                        error instanceof Error
                          ? error.message
                          : t("adminPage.reconcileFailed")
                      );
                    }
                  }}
                >
                  {t("adminPage.reconcileCheckouts")}
                </Button>
              </div>
            </div>
            <div className="space-y-2.5">
              {payments?.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border py-12 text-center">
                  <CreditCard className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">{t("adminPage.noPayments")}</p>
                </div>
              )}
              {payments?.map((payment) => (
                <Card key={payment._id} className="border-border/70 transition-all hover:shadow-md">
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/60">
                        <CreditCard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium">{payment.userName}</p>
                          <Badge
                            variant={
                              payment.status === "completed"
                                ? "default"
                                : payment.status === "pending"
                                  ? "secondary"
                                  : "outline"
                            }
                            className={`text-xs capitalize ${
                              payment.status === "failed"
                                ? "border-destructive text-destructive"
                                : ""
                            }`}
                          >
                            {payment.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {formatPaymentLabel(payment, t)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {new Date(payment.createdAt).toLocaleString()}
                        </p>
                        {payment.userEmail && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 truncate">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{payment.userEmail}</span>
                          </p>
                        )}
                        {payment.userPhone && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3 shrink-0" />
                            {payment.userPhone}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold">${(payment.amount / 100).toFixed(0)}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="pt-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Card className="border-border/70">
                <CardContent className="p-5">
                  <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                    <Heart className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">{t("adminPage.matchRate")}</p>
                  <div className="mt-1 text-4xl font-bold tracking-tight text-primary">
                    {analytics?.matchRate ?? 0}%
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/70">
                <CardContent className="p-5">
                  <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/60">
                    <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-sm text-muted-foreground">{t("adminPage.conversionRate")}</p>
                  <div className="mt-1 text-4xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                    {analytics?.conversionRate ?? 0}%
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/70 sm:col-span-2">
                <CardHeader>
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
                            <div key={country} className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">{country}</span>
                                <span className="text-muted-foreground">{count}</span>
                              </div>
                              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                  className="h-full rounded-full bg-primary transition-all"
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
          </TabsContent>

          <TabsContent value="announcements" className="pt-2">
            <Card className="border-border/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                    <Megaphone className="h-5 w-5 text-primary" />
                  </span>
                  {t("adminPage.sendAnnouncement")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("adminPage.announcementTitle")}</Label>
                  <Input
                    value={announcement.title}
                    onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
                    placeholder={t("adminPage.announcementTitlePh")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("adminPage.announcementBody")}</Label>
                  <Textarea
                    value={announcement.body}
                    onChange={(e) => setAnnouncement({ ...announcement, body: e.target.value })}
                    placeholder={t("adminPage.announcementBodyPh")}
                    rows={4}
                  />
                </div>
                <Button onClick={handleAnnouncement}>
                  {t("adminPage.sendToAll")}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

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
