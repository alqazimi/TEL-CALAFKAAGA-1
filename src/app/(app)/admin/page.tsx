"use client";

import { useState } from "react";
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

type RoleFilter = "all" | "user" | "admin" | "owner";
type PaymentFilter = "all" | "unpaid" | "paid" | "basic" | "premium";

const ROLE_FILTERS: { value: RoleFilter; label: string }[] = [
  { value: "all", label: "All roles" },
  { value: "user", label: "Members" },
  { value: "admin", label: "Admins" },
  { value: "owner", label: "Owner" },
];

const PAYMENT_FILTERS: { value: PaymentFilter; label: string }[] = [
  { value: "all", label: "All payments" },
  { value: "unpaid", label: "Unpaid" },
  { value: "basic", label: "Paid $15" },
  { value: "premium", label: "Paid $20" },
  { value: "paid", label: "Any paid" },
];

function isPremiumUser(user: AdminUser) {
  return user.hasPersonalSupport === true || (user.paidCents ?? 0) >= 2000;
}

function formatPaymentLabel(payment: AdminPayment) {
  if (payment.registrationTier === "premium" || payment.paymentType === "registration_premium") {
    return "Registration + Support ($20)";
  }
  if (payment.registrationTier === "basic" || payment.paymentType === "registration") {
    return "Registration ($15)";
  }
  if (payment.paymentType === "chat") return "Chat unlock";
  return `$${(payment.amount / 100).toFixed(0)}`;
}

export default function AdminPage() {
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
  const analytics = useQuery(
    api.admin.getAnalytics,
    isStaff ? {} : "skip"
  ) as AdminAnalytics | undefined;
  const payments = useQuery(
    api.admin.getAllPayments,
    isStaff ? {} : "skip"
  ) as AdminPayment[] | undefined;
  const approveUser = useMutation(api.admin.approveUser);
  const banUser = useMutation(api.admin.banUser);
  const deleteUser = useMutation(api.admin.deleteUser);
  const setUserRole = useMutation(api.admin.setUserRole);
  const createAnnouncement = useMutation(api.admin.createAnnouncement);

  const handleAnnouncement = async () => {
    if (!announcement.title || !announcement.body) return;
    try {
      await createAnnouncement(announcement);
      toast.success("Announcement sent to all users!");
      setAnnouncement({ title: "", body: "" });
    } catch {
      toast.error("Failed to send announcement");
    }
  };

  const handleRoleChange = async (profileId: Id<"profiles">, role: "user" | "admin") => {
    try {
      await setUserRole({ profileId, role });
      toast.success(role === "admin" ? "User promoted to admin." : "Admin access removed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update role.");
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
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-500" },
    { label: "Paid $15", value: stats.paidBasicCount, icon: DollarSign, color: "text-emerald-500" },
    { label: "Paid $20", value: stats.paidPremiumCount, icon: Headphones, color: "text-violet-500" },
    { label: "Unpaid", value: stats.unpaidCount, icon: Users, color: "text-gray-500" },
    { label: "Matches", value: stats.totalMatches, icon: Heart, color: "text-primary" },
    { label: "Revenue", value: `$${(stats.revenue / 100).toFixed(0)}`, icon: DollarSign, color: "text-amber-500" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          {stats.isOwner && (
            <p className="text-sm text-muted-foreground mt-1">
              You are the owner — you can promote users to admin.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {statCards.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <stat.icon className={`h-5 w-5 ${stat.color} mb-2`} />
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                className="pl-10"
                placeholder="Search by name, email, phone, or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Click any user to view their full profile and questionnaire answers.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground mr-1">Role</span>
                {ROLE_FILTERS.map((f) => (
                  <Button
                    key={f.value}
                    size="sm"
                    variant={roleFilter === f.value ? "default" : "outline"}
                    className="h-8 rounded-full px-3 text-xs"
                    onClick={() => setRoleFilter(f.value)}
                  >
                    {f.label}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground mr-1">Payment</span>
                {PAYMENT_FILTERS.map((f) => (
                  <Button
                    key={f.value}
                    size="sm"
                    variant={paymentFilter === f.value ? "default" : "outline"}
                    className="h-8 rounded-full px-3 text-xs"
                    onClick={() => setPaymentFilter(f.value)}
                  >
                    {f.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {users?.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No users match these filters.
                </p>
              )}
              {users?.map((user) => (
                <Card
                  key={user._id}
                  className={`cursor-pointer transition-colors hover:bg-muted/40 ${
                    selectedProfileId === user._id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedProfileId(user._id)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={user.imageUrl ?? undefined} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{user.name}</p>
                        <Badge variant="outline" className="text-xs capitalize">{user.gender}</Badge>
                        {isOwnerRole(user.role) && (
                          <Badge className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                            <Crown className="h-3 w-3 mr-1" />
                            Owner
                          </Badge>
                        )}
                        {user.role === "admin" && (
                          <Badge className="text-xs bg-primary/10 text-primary">Admin</Badge>
                        )}
                        {user.banned && <Badge className="text-xs bg-red-100 text-red-600">Banned</Badge>}
                        {!user.approved && <Badge className="text-xs bg-amber-100 text-amber-600">Pending</Badge>}
                        {isStaffRole(user.role) ? (
                          <Badge variant="outline" className="text-xs">Staff access</Badge>
                        ) : user.hasPaid ? (
                          <>
                            <Badge className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                              {user.paidCents
                                ? `Paid $${(user.paidCents / 100).toFixed(0)}`
                                : "Paid"}
                            </Badge>
                            {isPremiumUser(user) && (
                              <Badge className="text-xs bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                                <Headphones className="h-3 w-3 mr-1" />
                                Personal Support
                              </Badge>
                            )}
                          </>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            Unpaid
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{user.country} · {user.city}</p>
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
                          title="Contact on WhatsApp"
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
                            title="Remove admin"
                            onClick={() => void handleRoleChange(user._id, "user")}
                          >
                            <ShieldOff className="h-4 w-4 text-amber-600" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Make admin"
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
                          title="Approve user"
                          onClick={() => approveUser({ profileId: user._id })}
                        >
                          <CheckCircle className="h-4 w-4 text-primary" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        title={user.banned ? "Unban user" : "Ban user"}
                        onClick={() => banUser({ profileId: user._id, banned: !user.banned })}
                        disabled={isOwnerRole(user.role)}
                      >
                        <Ban className={`h-4 w-4 ${user.banned ? "text-primary" : "text-destructive"}`} />
                      </Button>
                      {!isStaffRole(user.role) && user._id !== currentProfileId && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Delete user"
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

          <TabsContent value="payments" className="space-y-4">
            <div className="space-y-3">
              {payments?.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No payments recorded yet.
                </p>
              )}
              {payments?.map((payment) => (
                <Card key={payment._id}>
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
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
                            {formatPaymentLabel(payment)}
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

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Match Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-primary">
                    {analytics?.matchRate ?? 0}%
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Conversion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-primary">
                    {analytics?.conversionRate ?? 0}%
                  </div>
                </CardContent>
              </Card>
              <Card className="sm:col-span-2">
                <CardHeader>
                  <CardTitle>Users by Country</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(analytics?.countryBreakdown ?? {})
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 10)
                      .map(([country, count]) => (
                        <div key={country} className="flex items-center justify-between">
                          <span className="text-sm">{country}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="announcements">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5" />
                  Send Announcement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={announcement.title}
                    onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
                    placeholder="Announcement title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    value={announcement.body}
                    onChange={(e) => setAnnouncement({ ...announcement, body: e.target.value })}
                    placeholder="Announcement message..."
                    rows={4}
                  />
                </div>
                <Button onClick={handleAnnouncement}>
                  Send to All Users
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
