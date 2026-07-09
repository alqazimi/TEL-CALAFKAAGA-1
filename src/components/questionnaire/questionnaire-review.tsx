"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { Check, Pencil, ChevronRight } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CITIZENSHIP_NOT_REQUIRED_COUNTRIES } from "@/lib/constants";
import type { Profile } from "@/types";
import type { Preferences } from "@/lib/profile-progress";
import { PHOTO_STEP_INDEX } from "@/components/questionnaire/steps";
import { useQuestionnaireI18n } from "@/lib/i18n/questionnaire-i18n";

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
  const { reviewLabel, optionLabel, ui } = useQuestionnaireI18n();
  const filled = items.filter((i) => i.value && i.value !== "—");
  if (filled.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-muted/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-xl text-foreground">{reviewLabel(title)}</h3>
        <Button variant="outline" size="sm" onClick={() => onEdit(stepIndex)} className="h-9 text-sm">
          <Pencil className="h-3.5 w-3.5 mr-1" />
          {ui("edit")}
        </Button>
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm">
        {filled.map((item) => (
          <div key={item.label} className="min-w-0">
            <dt className="text-muted-foreground text-sm font-semibold uppercase tracking-wide">{reviewLabel(item.label)}</dt>
            <dd className="font-semibold mt-1 text-foreground break-words text-lg">{optionLabel(item.value)}</dd>
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
  const { optionLabel, ui } = useQuestionnaireI18n();

  const translateList = (values: string[] | undefined) =>
    values?.length ? values.map((v) => optionLabel(v)).join(", ") : "—";

  const handleSubmit = async () => {
    if (isEditMode) {
      onComplete();
      return;
    }

    if (!profile.profileImageId) {
      toast.error(ui("photoRequired"));
      onEditStep(PHOTO_STEP_INDEX);
      return;
    }

    setSubmitting(true);
    try {
      await completeQuestionnaire({});
      toast.success(ui("profileComplete"));
      onComplete();
    } catch {
      toast.error(ui("submitFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const religiousItems = [
    { label: "Prayer Frequency", value: profile.prayerFrequency || "—" },
    ...(profile.gender === "female"
      ? [{ label: "Wears Hijab", value: profile.wearsHijab !== undefined ? (profile.wearsHijab ? "Yes" : "No") : "—" }]
      : []),
    ...(profile.gender === "male"
      ? [{ label: "Has Beard", value: profile.hasBeard !== undefined ? (profile.hasBeard ? "Yes" : "No") : "—" }]
      : []),
  ];

  const educationItems = [
    { label: "Education", value: profile.education || "—" },
    { label: "Occupation", value: profile.occupation || "—" },
    ...(profile.gender === "male"
      ? [{ label: "Financial Readiness", value: profile.financialReadiness || "—" }]
      : [
          {
            label: "Work Preference After Marriage",
            value: profile.marriageWorkPreference || profile.financialReadiness || "—",
          },
        ]),
  ];

  const marriageItems = [
    { label: "Marital Status", value: profile.maritalStatus ? optionLabel(profile.maritalStatus) : "—" },
    ...(profile.maritalStatus !== "Never married"
      ? [{ label: "Children", value: profile.children > 0 ? optionLabel("Yes") : optionLabel("No") }]
      : []),
    { label: "Want Children", value: profile.wantChildren ? optionLabel(profile.wantChildren) : "—" },
    { label: "Family Involvement", value: profile.familyInvolvement ? optionLabel(profile.familyInvolvement) : "—" },
    ...(profile.gender === "male"
      ? [
          {
            label: "Current Wife",
            value: profile.hasCurrentWife ? optionLabel(profile.hasCurrentWife) : "—",
          },
          {
            label: "Open to Second Wife",
            value: profile.openToSecondWife
              ? optionLabel(profile.openToSecondWife)
              : profile.polygynyOpenness
                ? optionLabel(profile.polygynyOpenness)
                : "—",
          },
        ]
      : [
          {
            label: "Accept Man With Wife",
            value: profile.acceptManWithWife ? optionLabel(profile.acceptManWithWife) : "—",
          },
          {
            label: "Accept Future Co-Wife",
            value: profile.acceptFutureCoWife
              ? optionLabel(profile.acceptFutureCoWife)
              : profile.polygynyOpenness
                ? optionLabel(profile.polygynyOpenness)
                : "—",
          },
        ]),
  ];

  const lifestyleItems = [
    {
      label: "Substance Use",
      value:
        profile.smokes === "Yes"
          ? `Yes${profile.substanceDetails ? ` — ${profile.substanceDetails}` : ""}`
          : profile.smokes === "No"
            ? "No"
            : profile.smokes || "—",
    },
    { label: "Exercise", value: profile.exercise || "—" },
  ];

  const aboutItems = [
    ...(profile.country &&
    !CITIZENSHIP_NOT_REQUIRED_COUNTRIES.includes(
      profile.country as (typeof CITIZENSHIP_NOT_REQUIRED_COUNTRIES)[number]
    )
      ? [{ label: "Citizenship / Visa", value: profile.citizenshipStatus || "—" }]
      : []),
    { label: "Languages", value: translateList(profile.languagesSpoken) },
    { label: "Ready to Relocate", value: profile.readyToRelocate || "—" },
    { label: "Living Situation", value: profile.livingSituation || "—" },
    { label: "Marriage Timeline", value: profile.marriageTimeline || "—" },
    { label: "Love Language", value: profile.loveLanguage ? optionLabel(profile.loveLanguage) : "—" },
    { label: "Qualities", value: translateList(profile.qualities) },
    { label: "Hobbies", value: translateList(profile.hobbies) },
  ];

  const prefItems = [
    { label: "Spouse Prayer Importance", value: profile.spousePrayerImportance || "—" },
    ...(profile.gender === "female"
      ? [{ label: "Partner Beard", value: preferences?.partnerBeard || "—" }]
      : []),
    ...(profile.gender === "male"
      ? [{ label: "Partner Hijab / Niqab", value: preferences?.partnerHijabLevel || "—" }]
      : []),
    { label: "Marry Someone With Children", value: profile.marrySomeoneWithChildren || "—" },
    ...(preferences
      ? [
        { label: "Preferred Age", value: `${preferences.minAge ?? "—"} – ${preferences.maxAge ?? "—"}` },
        { label: "Preferred Height", value: `${preferences.minHeight ?? "—"} – ${preferences.maxHeight ?? "—"} cm` },
        { label: "Preferred Countries", value: preferences.preferredCountries?.length ? preferences.preferredCountries.join(", ") : ui("anyValue") },
        { label: "Preferred Education", value: preferences.educationLevel || "—" },
        { label: "Preferred Religious Level", value: preferences.religiousLevel || "—" },
        ...(profile.maritalStatus !== "Divorced"
          ? [{ label: "Accept Divorcee", value: preferences.acceptDivorcee || "—" }]
          : []),
        ...(profile.maritalStatus !== "Widowed"
          ? [{ label: "Accept Widow", value: preferences.acceptWidow || "—" }]
          : []),
        ...(profile.marrySomeoneWithChildren !== "No"
          ? [{ label: "Accept Children", value: preferences.acceptChildren || "—" }]
          : []),
        { label: "Max Distance", value: preferences.maxDistance || "—" },
      ]
      : []),
  ];

  const basicItems = [
    { label: "Age", value: profile.age ? String(profile.age) : "—" },
    { label: "Country", value: profile.country || "—" },
    { label: "City", value: profile.city || "—" },
    { label: "Height", value: profile.height ? `${profile.height} cm` : "—" },
    { label: "Weight", value: profile.weight ? `${profile.weight} kg` : "—" },
  ];
  return (
    <>
    <Card className="border-border shadow-lg shadow-primary/5 pb-4">
      <CardHeader className="border-b border-border bg-gradient-to-r from-accent/50 to-transparent dark:from-primary/10">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-2xl sm:text-3xl font-bold">{isEditMode ? ui("editProfileDetails") : ui("finalReview")}</CardTitle>
          {!isEditMode && (
            <Badge variant="outline" className="inline-flex items-center text-primary border-primary/30">
              <Check className="h-3 w-3 mr-1" />
              {ui("reviewBeforeSubmitting")}
            </Badge>
          )}
        </div>
        <CardDescription className="text-base leading-relaxed">
          {isEditMode ? ui("editModeDesc") : ui("reviewDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pb-28">
        <ReviewSection
          title="Gender"
          stepIndex={0}
          items={[
            {
              label: "Gender",
              value: profile.gender === "female" ? "Female" : profile.gender === "male" ? "Male" : "—",
            },
          ]}
          onEdit={onEditStep}
        />
        <ReviewSection title="Basic Information" stepIndex={1} items={basicItems} onEdit={onEditStep} />
        <ReviewSection title="Your Religious Practice" stepIndex={2} items={religiousItems} onEdit={onEditStep} />
        <ReviewSection title="Education & Work" stepIndex={3} items={educationItems} onEdit={onEditStep} />
        <ReviewSection title="Marriage & Family" stepIndex={5} items={marriageItems} onEdit={onEditStep} />
        <ReviewSection title="Lifestyle" stepIndex={6} items={lifestyleItems} onEdit={onEditStep} />
        <ReviewSection title="About You" stepIndex={7} items={aboutItems} onEdit={onEditStep} />
        <ReviewSection title="Partner Preferences" stepIndex={8} items={prefItems} onEdit={onEditStep} />
        <ReviewSection
          title="Profile Photo"
          stepIndex={PHOTO_STEP_INDEX}
          items={[
            {
              label: "Photo",
              value: profile.profileImageId || profile.imageUrl ? ui("uploaded") : "—",
            },
          ]}
          onEdit={onEditStep}
        />

      </CardContent>
    </Card>

    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/80 bg-background/95 backdrop-blur-md px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-xl">
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full h-14 min-h-14 rounded-2xl text-lg font-semibold"
          size="lg"
        >
          {isEditMode
            ? ui("saveChanges")
            : submitting
              ? ui("submitting")
              : ui("submitProfile")}
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
    </>
  );
}
