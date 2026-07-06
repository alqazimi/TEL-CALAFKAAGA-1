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
} from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import type { AdminStats, AdminAnalytics, Profile as AdminUser } from "@/types";
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

export default function AdminPage() {
  const [search, setSearch] = useState("");
  const [announcement, setAnnouncement] = useState({ title: "", body: "" });

  const stats = useQuery(api.admin.getStats) as AdminStats | null | undefined;
  const users = useQuery(api.admin.getAllUsers, { search: search || undefined }) as AdminUser[] | undefined;
  const analytics = useQuery(api.admin.getAnalytics) as AdminAnalytics | undefined;
  const approveUser = useMutation(api.admin.approveUser);
  const banUser = useMutation(api.admin.banUser);
  const deleteUser = useMutation(api.admin.deleteUser);
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

  if (stats === undefined) {
    return (
      <DashboardLayout>
        <Skeleton className="h-96 w-full" />
      </DashboardLayout>
    );
  }

  if (stats === null) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-gray-500 mt-2">You don&apos;t have admin privileges.</p>
        </div>
      </DashboardLayout>
    );
  }

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-500" },
    { label: "Male", value: stats.maleUsers, icon: Users, color: "text-indigo-500" },
    { label: "Female", value: stats.femaleUsers, icon: Users, color: "text-pink-500" },
    { label: "Matches", value: stats.totalMatches, icon: Heart, color: "text-emerald-500" },
    { label: "Messages", value: stats.totalMessages, icon: MessageCircle, color: "text-purple-500" },
    { label: "Revenue", value: `$${(stats.revenue / 100).toFixed(0)}`, icon: DollarSign, color: "text-amber-500" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>

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
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                className="pl-10"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              {users?.map((user) => (
                <Card key={user._id}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={user.imageUrl ?? undefined} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{user.name}</p>
                        <Badge variant="outline" className="text-xs capitalize">{user.gender}</Badge>
                        {user.banned && <Badge className="text-xs bg-red-100 text-red-600">Banned</Badge>}
                        {!user.approved && <Badge className="text-xs bg-amber-100 text-amber-600">Pending</Badge>}
                      </div>
                      <p className="text-sm text-gray-500">{user.country} · {user.city}</p>
                    </div>
                    <div className="flex gap-1">
                      {!user.approved && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => approveUser({ profileId: user._id })}
                        >
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => banUser({ profileId: user._id, banned: !user.banned })}
                      >
                        <Ban className={`h-4 w-4 ${user.banned ? "text-emerald-500" : "text-red-500"}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteUser({ profileId: user._id })}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
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
                  <div className="text-4xl font-bold text-emerald-500">
                    {analytics?.matchRate ?? 0}%
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Conversion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-emerald-500">
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
      </div>
    </DashboardLayout>
  );
}
