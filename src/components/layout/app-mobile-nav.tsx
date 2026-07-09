"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Heart,
  MessageCircle,
  Sparkles,
  ClipboardList,
  Users,
  CreditCard,
  TrendingUp,
  Megaphone,
  Flag,
  User,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAppNavLinks } from "@/lib/i18n/hooks";
import { useTranslation } from "@/lib/i18n/context";
import type { TranslationPath } from "@/lib/i18n/translations";
import { isStaffRole } from "@/lib/access";
import { cn } from "@/lib/utils";
import { calculateProfileProgress } from "@/lib/profile-progress";

const iconMap = {
  LayoutDashboard,
  Heart,
  MessageCircle,
  Sparkles,
  ClipboardList,
  User,
};

type TabIcon = keyof typeof iconMap;

const STAFF_TABS: { tab: string; labelKey: TranslationPath; icon: typeof Users }[] = [
  { tab: "users", labelKey: "adminPage.users", icon: Users },
  { tab: "payments", labelKey: "adminPage.payments", icon: CreditCard },
  { tab: "analytics", labelKey: "adminPage.analytics", icon: TrendingUp },
  { tab: "reports", labelKey: "adminPage.reports", icon: Flag },
  { tab: "announcements", labelKey: "adminPage.announcements", icon: Megaphone },
];

export function AppMobileNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const user = useQuery(api.users.currentUser);
  const preferences = useQuery(api.profiles.getPreferences);
  const profileComplete = user?.profile?.questionnaireComplete ?? false;
  const profileProgress = user?.profile
    ? calculateProfileProgress(user.profile, preferences ?? undefined)
    : 0;
  const appNavLinks = useAppNavLinks(profileComplete).filter((l) => l.tab);

  // Admins and owners get admin-section navigation instead of member tabs.
  if (isStaffRole(user?.profile?.role)) {
    const onAdmin = pathname.startsWith("/admin");
    const onProfile = pathname === "/profile";
    const currentTab = searchParams.get("tab") ?? "users";
    const staffItems = [
      ...STAFF_TABS,
      { tab: "profile", labelKey: "app.myProfile" as TranslationPath, icon: User, href: "/profile" },
    ];
    return (
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-stretch justify-around px-0.5">
          {staffItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              "href" in item
                ? onProfile
                : onAdmin && currentTab === item.tab;
            const href = "href" in item ? item.href : `/admin?tab=${item.tab}`;
            return (
              <Link
                key={item.tab}
                href={href}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-h-[3.25rem] px-0.5 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
                <span className="text-[10px] font-medium leading-none text-center">
                  {t(item.labelKey)}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-stretch justify-around px-1">
        {appNavLinks.map((link) => {
          const Icon = iconMap[link.icon as TabIcon];
          const isActive =
            pathname === link.href ||
            (link.href === "/likes" && pathname.startsWith("/likes")) ||
            (!profileComplete && link.href === "/questionnaire" && pathname.startsWith("/questionnaire"));
          const isLocked = "locked" in link && link.locked && !profileComplete;
          const href = link.href;
          const showProgressBadge =
            !profileComplete &&
            (link.href === "/questionnaire" || link.href === "/profile");

          return (
            <Link
              key={link.href}
              href={href}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-1 py-2.5 min-h-[3.25rem] transition-colors",
                isActive ? "text-primary" : "text-muted-foreground",
                isLocked && "opacity-90"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
              <span className="text-[11px] font-medium leading-none">
                {"mobileLabel" in link && link.mobileLabel
                  ? link.mobileLabel
                  : link.label}
              </span>
              {showProgressBadge && profileProgress > 0 && (
                <span className="absolute top-1.5 right-[calc(50%-1.35rem)] min-w-[1.35rem] rounded-full bg-primary px-1 py-0.5 text-[9px] font-bold leading-none text-primary-foreground">
                  {profileProgress}%
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
