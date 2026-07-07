"use client";

import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Users,
  Megaphone,
  CheckCheck,
} from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import type { Notification } from "@/types";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";

const typeIcons = {
  like: Heart,
  match: Users,
  message: MessageCircle,
  announcement: Megaphone,
};

const typeColors = {
  like: "text-pink-500 bg-pink-50 dark:bg-pink-950/30",
  match: "text-primary bg-accent dark:bg-primary/20",
  message: "text-blue-500 bg-blue-50 dark:bg-blue-950/30",
  announcement: "text-purple-500 bg-purple-50 dark:bg-purple-950/30",
};

export default function NotificationsPage() {
  const notifications = useQuery(api.notifications.getNotifications) as Notification[] | undefined;
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  if (notifications === undefined) {
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
        {unreadCount > 0 && (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => markAllAsRead()}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
          </div>
        )}

        {notifications.length === 0 ? (
          <Card className="p-12 text-center">
            <Megaphone className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No notifications</h3>
            <p className="text-gray-500 text-sm">
              You&apos;ll be notified about likes, matches, and messages here.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification, i) => {
              const Icon = typeIcons[notification.type];
              const colorClass = typeColors[notification.type];
              return (
                <motion.div
                  key={notification._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      !notification.read ? "border-primary/30" : ""
                    }`}
                    onClick={() => {
                      if (!notification.read) {
                        markAsRead({ notificationId: notification._id });
                      }
                    }}
                  >
                    <CardContent className="p-4 flex items-start gap-4">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colorClass}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{notification.title}</p>
                          {!notification.read && (
                            <Badge variant="success" className="text-[10px]">New</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">{notification.body}</p>
                        <p className="text-xs text-gray-400 mt-1">
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
