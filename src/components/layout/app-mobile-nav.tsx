"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Heart,
  MessageCircle,
  ClipboardList,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAppNavLinks } from "@/lib/i18n/hooks";
import { isStaffRole } from "@/lib/access";
import { cn } from "@/lib/utils";

const iconMap = {
  LayoutDashboard,
  Heart,
  MessageCircle,
  ClipboardList,
};

type TabIcon = keyof typeof iconMap;

export function AppMobileNav() {
  const pathname = usePathname();
  const user = useQuery(api.users.currentUser);
  const profileComplete = user?.profile?.questionnaireComplete ?? false;
  const appNavLinks = useAppNavLinks().filter((l) => l.tab);

  // Admins and owners don't use the member bottom navigation.
  if (isStaffRole(user?.profile?.role)) return null;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-stretch justify-around px-1">
        {appNavLinks.map((link) => {
          const Icon = iconMap[link.icon as TabIcon];
          const isActive = pathname === link.href;
          const isLocked = "locked" in link && link.locked && !profileComplete;
          const href =
            isLocked && !profileComplete ? "/questionnaire" : link.href;

          return (
            <Link
              key={link.href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-2.5 min-h-[3.25rem] transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
              <span className="text-[11px] font-medium leading-none">
                {"mobileLabel" in link && link.mobileLabel
                  ? link.mobileLabel
                  : link.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
