"use client";

import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  PROFILE_SECTIONS,
  calculateProfileProgress,
  getSectionStatus,
  getRemainingSections,
  type Preferences,
} from "@/lib/profile-progress";
import type { Profile } from "@/types";

interface ProfileCompletionCardProps {
  profile: Profile;
  preferences?: Preferences | null;
  showContinue?: boolean;
  compact?: boolean;
}

export function ProfileCompletionCard({
  profile,
  preferences,
  showContinue = true,
}: ProfileCompletionCardProps) {
  const progress = profile.questionnaireComplete
    ? 100
    : calculateProfileProgress(profile, preferences);
  const remaining = getRemainingSections(profile, preferences);
  const completedCount = PROFILE_SECTIONS.filter(
    (s) => getSectionStatus(s.id, profile, preferences) === "complete"
  ).length;

  if (profile.questionnaireComplete) return null;

  return (
    <Card className="border-border shadow-sm">
      <CardContent className="p-6 space-y-5">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Profile setup</p>
          <h2 className="text-xl font-semibold mt-1">Complete your profile to start matching</h2>
          <p className="text-sm text-muted-foreground mt-2">
            {completedCount} of {PROFILE_SECTIONS.length} sections done
            {remaining > 0 ? ` · ${remaining} remaining` : ""}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {showContinue && (
          <Button asChild className="w-full h-12 text-base" size="lg">
            <Link href="/questionnaire">
              Continue setup
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/** Compact row for profile page sidebar area */
export function ProfileProgressRow({
  profile,
  preferences,
}: {
  profile: Profile;
  preferences?: Preferences | null;
}) {
  const progress = calculateProfileProgress(profile, preferences);
  if (profile.questionnaireComplete) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Check className="h-4 w-4 text-primary" />
        Profile complete
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Profile progress</span>
        <span className="font-medium">{progress}%</span>
      </div>
      <Progress value={progress} className="h-1.5" />
    </div>
  );
}
