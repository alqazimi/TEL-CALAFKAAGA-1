"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  User,
  ClipboardList,
  Heart,
  MessageCircle,
  Bell,
  Shield,
  LogOut,
  Users,
  CreditCard,
  TrendingUp,
  Megaphone,
  Flag,
} from "lucide-react";
import type { TranslationPath } from "@/lib/i18n/translations";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { CurrentUser } from "@/types";
import type { AppNavIcon } from "@/lib/constants";
import { useAppNavLinks } from "@/lib/i18n/hooks";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/layout/brand-logo";
import { isStaffRole } from "@/lib/access";
import { calculateProfileProgress } from "@/lib/profile-progress";

const iconMap = {
  LayoutDashboard,
  User,
  ClipboardList,
  Heart,
  MessageCircle,
  Bell,
};

const STAFF_NAV: {
  tab: string;
  labelKey: TranslationPath;
  icon: typeof Users;
}[] = [
  { tab: "users", labelKey: "adminPage.users", icon: Users },
  { tab: "payments", labelKey: "adminPage.payments", icon: CreditCard },
  { tab: "analytics", labelKey: "adminPage.analytics", icon: TrendingUp },
  { tab: "reports", labelKey: "adminPage.reports", icon: Flag },
  { tab: "announcements", labelKey: "adminPage.announcements", icon: Megaphone },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { signOut } = useAuthActions();
  const user = useQuery(api.users.currentUser) as CurrentUser | null | undefined;
  const preferences = useQuery(api.profiles.getPreferences);
  const unreadCount = useQuery(api.notifications.getUnreadCount);

  const isStaff = isStaffRole(user?.profile?.role);
  const profileComplete = user?.profile?.questionnaireComplete ?? false;
  const progress = user?.profile
    ? calculateProfileProgress(user.profile, preferences ?? undefined)
    : 0;
  const appNavLinks = useAppNavLinks();
  const { t } = useTranslation();

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:top-16 lg:bottom-0 lg:left-0 lg:z-40 lg:border-r lg:border-border lg:bg-card/95 lg:backdrop-blur-xl">
      <div className="flex flex-col flex-1 px-4 py-6 overflow-y-auto">
        <BrandLogo href={isStaff ? "/admin" : "/dashboard"} className="px-2 mb-6" />

        {!isStaff && user?.profile && !profileComplete && (
          <div className="mb-4 rounded-xl bg-accent p-3 space-y-1.5">
            <p className="text-xs font-medium text-accent-foreground">
              Profile {progress}% {t("app.profileSetup").toLowerCase()}
            </p>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <nav className="flex-1 space-y-1">
          {!isStaff &&
            appNavLinks.map((link) => {
              const Icon = iconMap[link.icon as AppNavIcon];
              const isActive = pathname === link.href;
              const isLocked = "locked" in link && link.locked && !profileComplete;
              const href = isLocked ? "/questionnaire" : link.href;

              return (
                <Link
                  key={link.href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    isLocked && "opacity-80"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {link.label}
                  {link.href === "/notifications" && unreadCount ? (
                    <Badge className="ml-auto">{unreadCount}</Badge>
                  ) : null}
                </Link>
              );
            })}

          {isStaff && (
            <>
              <div className="flex items-center gap-2 px-4 pb-2 pt-1">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("app.admin")}
                </span>
              </div>
              {STAFF_NAV.map((item) => {
                const Icon = item.icon;
                const onAdmin = pathname.startsWith("/admin");
                const currentTab = searchParams.get("tab") ?? "users";
                const isActive = onAdmin && currentTab === item.tab;
                return (
                  <Link
                    key={item.tab}
                    href={`/admin?tab=${item.tab}`}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {t(item.labelKey)}
                  </Link>
                );
              })}
              <Link
                href="/profile"
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all mt-1",
                  pathname === "/profile"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <User className="h-5 w-5 shrink-0" />
                {t("app.myProfile")}
              </Link>
            </>
          )}
        </nav>

        <div className="mt-4 border-t border-border pt-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 rounded-xl text-muted-foreground"
            onClick={() => void signOut()}
          >
            <LogOut className="h-5 w-5" />
            {t("app.logOut")}
          </Button>
        </div>
      </div>
    </aside>
  );
}
