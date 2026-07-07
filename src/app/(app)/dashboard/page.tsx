"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { CurrentUser, MatchResult, MutualMatch } from "@/types";
import type { Preferences } from "@/lib/profile-progress";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfileCompletionCard } from "@/components/profile/profile-completion-card";
import { PERSONAL_SUPPORT_PRICE, REGISTRATION_PRICE } from "@/lib/constants";
import { hasPaidAccess, isStaffRole } from "@/lib/access";

export default function DashboardPage() {
  const router = useRouter();
  const user = useQuery(api.users.currentUser) as CurrentUser | null | undefined;
  const preferences = useQuery(api.profiles.getPreferences) as Preferences | null | undefined;
  const isStaff = isStaffRole(user?.profile?.role);
  const matches = useQuery(
    api.matches.getMatches,
    user?.profile?.questionnaireComplete && !isStaff ? {} : "skip"
  ) as MatchResult[] | undefined;
  const myMatches = useQuery(
    api.matches.getMyMatches,
    user?.profile?.questionnaireComplete && !isStaff ? undefined : "skip"
  ) as MutualMatch[] | undefined;

  useEffect(() => {
    if (isStaff) {
      router.replace("/admin");
    }
  }, [isStaff, router]);

  if (user === undefined || isStaff) {
    return (
      <DashboardLayout>
        <div className="space-y-6 max-w-2xl">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  const profile = user?.profile;
  const firstName = profile?.name?.split(" ")[0] ?? "there";
  const isComplete = profile?.questionnaireComplete ?? false;
  const hasPaid = hasPaidAccess(profile);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Hello, {firstName}
          </h1>
          <p className="text-muted-foreground mt-1">
            {!hasPaid
              ? `Choose registration ($${REGISTRATION_PRICE}) or personal support ($${PERSONAL_SUPPORT_PRICE}) to continue.`
              : isComplete
                ? "Here is a quick overview of your account."
                : "Finish your profile questionnaire to unlock matches."}
          </p>
        </div>

        {profile && !hasPaid && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="font-semibold">Step 1: Complete payment</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {`Choose standard registration ($${REGISTRATION_PRICE}) or registration with personal support ($${PERSONAL_SUPPORT_PRICE}).`}
                </p>
              </div>
              <Button className="shrink-0" asChild>
                <Link href="/payment">Choose plan</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Setup flow — paid but questionnaire incomplete */}
        {profile && hasPaid && !isComplete && (
          <ProfileCompletionCard profile={profile} preferences={preferences} />
        )}

        {/* Stats — complete only */}
        {isComplete && hasPaid && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Matches", value: matches?.length ?? 0 },
              { label: "Mutual", value: myMatches?.length ?? 0 },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-border bg-card px-4 py-4 text-center"
              >
                <p className="text-2xl font-semibold">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Top matches */}
        {isComplete && hasPaid && matches && matches.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Suggested for you</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/matches">See all</Link>
              </Button>
            </div>
            <div className="space-y-3">
              {matches.slice(0, 3).map((match) => (
                <Link key={match.userId} href="/matches">
                  <Card className="border-border hover:border-primary/30 hover:shadow-sm transition-all">
                    <CardContent className="p-4 flex items-center gap-4">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={match.imageUrl ?? undefined} alt={match.name} />
                        <AvatarFallback className="text-lg bg-muted">
                          {match.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">
                          {match.name}, {match.age}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {match.country}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-primary">{match.score}%</p>
                        <p className="text-xs text-muted-foreground">match</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty state when complete but no matches */}
        {isComplete && hasPaid && matches && matches.length === 0 && (
          <Card className="border-border border-dashed">
            <CardContent className="p-8 text-center">
              <p className="font-medium">No matches yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                We are looking for compatible profiles. Check back soon.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
