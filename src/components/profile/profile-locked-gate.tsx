"use client";

import Link from "next/link";
import { Heart, Lock, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  calculateProfileProgress,
  getEncouragementMessage,
  getRemainingSections,
  type Preferences,
} from "@/lib/profile-progress";
import type { Profile } from "@/types";

interface ProfileLockedGateProps {
  profile: Profile;
  preferences?: Preferences | null;
  title?: string;
  description?: string;
}

export function ProfileLockedGate({
  profile,
  preferences,
  title = "Find Your Best Match",
  description = "Before we can recommend compatible people, please complete your profile.",
}: ProfileLockedGateProps) {
  const progress = calculateProfileProgress(profile, preferences);
  const remaining = getRemainingSections(profile, preferences);
  const message = getEncouragementMessage(profile, preferences);

  return (
    <div className="max-w-lg mx-auto py-8 px-2">
      <Card className="overflow-hidden text-center border-gray-100 dark:border-gray-800 shadow-xl shadow-emerald-500/5">
        <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500" />
        <CardContent className="p-8 space-y-6">
          <div className="relative mx-auto w-fit">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 dark:from-emerald-900/60 dark:to-emerald-950/40 dark:text-emerald-300">
              <Heart className="h-9 w-9" />
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
              <Lock className="h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground leading-relaxed">{description}</p>
          </div>

          <div className="rounded-2xl bg-gray-50 dark:bg-gray-900/50 p-4 space-y-3 text-left">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Profile Completion</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{progress}%</span>
            </div>
            <Progress value={progress} className="h-3" />
            {remaining > 0 && (
              <p className="text-xs text-muted-foreground">
                {remaining} section{remaining !== 1 ? "s" : ""} remaining
              </p>
            )}
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-4 text-left">
            <Sparkles className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-800 dark:text-emerald-200 font-medium leading-relaxed">
              {message}
            </p>
          </div>

          <Button asChild size="lg" className="w-full">
            <Link href="/questionnaire">Continue Profile</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
