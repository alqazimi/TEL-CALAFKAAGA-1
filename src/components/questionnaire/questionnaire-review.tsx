"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { Check, Pencil, ChevronRight } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Profile } from "@/types";
import type { Preferences } from "@/lib/profile-progress";

interface QuestionnaireReviewProps {
  profile: Profile;
  preferences: Preferences | null | undefined;
  onEditStep: (stepIndex: number) => void;
  onComplete: () => void;
  isEditMode?: boolean;
}

function ReviewSection({
  title,
  stepIndex,
  items,
  onEdit,
}: {
  title: string;
  stepIndex: number;
  items: { label: string; value: string }[];
  onEdit: (stepIndex: number) => void;
}) {
  const filled = items.filter((i) => i.value && i.value !== "—");
  if (filled.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-muted/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <Button variant="outline" size="sm" onClick={() => onEdit(stepIndex)} className="h-8">
          <Pencil className="h-3.5 w-3.5 mr-1" />
          Edit
        </Button>
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm">
        {filled.map((item) => (
          <div key={item.label} className="min-w-0">
            <dt className="text-muted-foreground text-xs uppercase tracking-wide">{item.label}</dt>
            <dd className="font-medium mt-1 text-foreground break-words">{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function QuestionnaireReview({
  profile,
  preferences,
  onEditStep,
  onComplete,
  isEditMode = false,
}: QuestionnaireReviewProps) {
  const completeQuestionnaire = useMutation(api.profiles.completeQuestionnaire);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (isEditMode) {
      onComplete();
      return;
    }

    setSubmitting(true);
    try {
      await completeQuestionnaire({});
      toast.success("Profile complete! Finding your matches...");
      onComplete();
    } catch {
      toast.error("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const basicItems = [
    { label: "Age", value: profile.age ? String(profile.age) : "—" },
    { label: "Country", value: profile.country || "—" },
    { label: "City", value: profile.city || "—" },
    { label: "Height", value: profile.height ? `${profile.height} cm` : "—" },
    { label: "Weight", value: profile.weight ? `${profile.weight} kg` : "—" },
  ];

  const religiousItems = [
    { label: "Prayer Frequency", value: profile.prayerFrequency || "—" },
    ...(profile.gender === "female"
      ? [{ label: "Wears Hijab", value: profile.wearsHijab !== undefined ? (profile.wearsHijab ? "Yes" : "No") : "—" }]
      : []),
  ];

  const educationItems = [
    { label: "Education", value: profile.education || "—" },
    { label: "Occupation", value: profile.occupation || "—" },
  ];

  const marriageItems = [
    { label: "Marital Status", value: profile.maritalStatus || "—" },
    { label: "Children", value: profile.children > 0 ? "Yes" : "No" },
  ];

  const lifestyleItems = [
    { label: "Smokes", value: profile.smokes || "—" },
    { label: "Drinks Alcohol", value: profile.drinksAlcohol || "—" },
    { label: "Exercise", value: profile.exercise || "—" },
  ];

  const aboutItems = [
    { label: "Ready to Relocate", value: profile.readyToRelocate || "—" },
    { label: "Marriage Timeline", value: profile.marriageTimeline || "—" },
    { label: "Bio", value: profile.bio || "—" },
    { label: "Qualities", value: profile.qualities?.length ? profile.qualities.join(", ") : "—" },
    { label: "Hobbies", value: profile.hobbies?.length ? profile.hobbies.join(", ") : "—" },
  ];

  const prefItems = [
    { label: "Spouse Prayer Importance", value: profile.spousePrayerImportance || "—" },
    { label: "Marry Someone With Children", value: profile.marrySomeoneWithChildren || "—" },
    ...(preferences
      ? [
        { label: "Preferred Age", value: `${preferences.minAge ?? "—"} – ${preferences.maxAge ?? "—"}` },
        { label: "Preferred Height", value: `${preferences.minHeight ?? "—"} – ${preferences.maxHeight ?? "—"} cm` },
        { label: "Preferred Countries", value: preferences.preferredCountries?.length ? preferences.preferredCountries.join(", ") : "Any" },
        { label: "Preferred Education", value: preferences.educationLevel || "—" },
        { label: "Preferred Religious Level", value: preferences.religiousLevel || "—" },
        { label: "Accept Divorcee", value: preferences.acceptDivorcee || "—" },
        { label: "Accept Widow", value: preferences.acceptWidow || "—" },
        { label: "Accept Children", value: preferences.acceptChildren || "—" },
        { label: "Max Distance", value: preferences.maxDistance || "—" },
      ]
      : []),
  ];

  return (
    <Card className="border-border shadow-lg shadow-primary/5">
      <CardHeader className="border-b border-border bg-gradient-to-r from-accent/50 to-transparent dark:from-primary/10">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>{isEditMode ? "Edit Profile Details" : "Final Review"}</CardTitle>
          {!isEditMode && (
            <Badge variant="outline" className="inline-flex items-center text-primary border-primary/30">
              <Check className="h-3 w-3 mr-1" />
              Review before submitting
            </Badge>
          )}
        </div>
        <CardDescription>
          {isEditMode
            ? "Update any section below. Changes save when you finish editing a step."
            : "Review everything you've entered. You can edit any section before submitting."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ReviewSection title="Basic Information" stepIndex={0} items={basicItems} onEdit={onEditStep} />
        <ReviewSection title="Your Religious Practice" stepIndex={1} items={religiousItems} onEdit={onEditStep} />
        <ReviewSection title="Education & Work" stepIndex={2} items={educationItems} onEdit={onEditStep} />
        <ReviewSection title="Marriage & Family" stepIndex={4} items={marriageItems} onEdit={onEditStep} />
        <ReviewSection title="Lifestyle" stepIndex={5} items={lifestyleItems} onEdit={onEditStep} />
        <ReviewSection title="About You" stepIndex={6} items={aboutItems} onEdit={onEditStep} />
        <ReviewSection title="Partner Preferences" stepIndex={7} items={prefItems} onEdit={onEditStep} />

        <div className="pt-4 flex flex-col sm:flex-row gap-3">
          <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
            {isEditMode
              ? "Done"
              : submitting
                ? "Submitting..."
                : "Submit Profile"}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
