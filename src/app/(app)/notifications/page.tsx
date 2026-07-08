"use client";

import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Users,
  Megaphone,
  CheckCheck,
  ShieldCheck,
  CreditCard,
  Bell,
} from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import type { MemberReminder, Notification } from "@/types";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import { reminderCopy } from "@/lib/reminder-copy";
import { useTranslation } from "@/lib/i18n/context";

const typeIcons = {
  like: Heart,
  match: Users,
  message: MessageCircle,
  announcement: Megaphone,
  approval: ShieldCheck,
  payment: CreditCard,
};

const typeColors = {
  like: "text-primary bg-accent",
  match: "text-primary bg-accent dark:bg-primary/20",
  message: "text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400",
  announcement:
    "text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400",
  approval:
    "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400",
  payment:
    "text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400",
};

function getNotificationHref(notification: Notification): string | null {
  switch (notification.type) {
    case "message":
      return "/chat";
    case "like":
    case "match":
    case "approval":
      return "/matches";
    case "payment":
      return "/dashboard";
    case "announcement":
      return null;
    default:
      return null;
  }
}

export default function NotificationsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const notifications = useQuery(api.notifications.getNotifications) as
    | Notification[]
    | undefined;
  const reminders = useQuery(api.notifications.getMemberReminders) as
    | MemberReminder[]
    | undefined;
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  if (notifications === undefined || reminders === undefined) {
    return (
      <DashboardLayout>
        <div className="space-y-4 max-w-2xl">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">
            {t("notificationsPage.title")}
          </h1>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAllAsRead()}>
              <CheckCheck className="h-4 w-4 mr-2" />
              {t("notificationsPage.markAllRead")}
            </Button>
          )}
        </div>

        {reminders.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {t("notificationsPage.reminders")}
            </h2>
            {reminders.map((reminder) => {
              const copy = reminderCopy[reminder.id];
              return (
              <Card key={reminder.id} className="border-primary/20 bg-primary/5">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold">{t(copy.title)}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {t(copy.body)}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={reminder.href}>{t(copy.action)}</Link>
                  </Button>
                </CardContent>
              </Card>
            );
            })}
          </div>
        )}

        {notifications.length === 0 ? (
          <Card className="p-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2">
              {t("notificationsPage.emptyTitle")}
            </h3>
            <p className="text-muted-foreground text-sm">
              {t("notificationsPage.emptyDesc")}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.length > 0 && reminders.length > 0 && (
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {t("notificationsPage.activity")}
              </h2>
            )}
            {notifications.map((notification, i) => {
              const Icon = typeIcons[notification.type];
              const colorClass = typeColors[notification.type];
              const href = getNotificationHref(notification);

              return (
                <motion.div
                  key={notification._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      !notification.read
                        ? "border-primary/30 bg-accent/30"
                        : ""
                    }`}
                    onClick={() => {
                      if (!notification.read) {
                        markAsRead({ notificationId: notification._id });
                      }
                      if (href) {
                        router.push(href);
                      }
                    }}
                  >
                    <CardContent className="p-4 flex items-start gap-4">
                      {notification.relatedImageUrl ? (
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarImage
                            src={notification.relatedImageUrl}
                            alt=""
                          />
                          <AvatarFallback className="bg-muted">
                            <Icon className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colorClass}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{notification.title}</p>
                          {!notification.read && (
                            <Badge variant="success" className="text-[10px]">
                              {t("notificationsPage.new")}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {notification.body}
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
