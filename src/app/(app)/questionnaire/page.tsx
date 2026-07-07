"use client";

import { useState, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ChevronLeft, Check } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import type { Profile } from "@/types";
import type { Preferences } from "@/lib/profile-progress";
import {
  calculateProfileProgress,
  getResumeStepIndex,
} from "@/lib/profile-progress";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { QuestionnaireStep } from "@/components/questionnaire/questionnaire-step";
import { QuestionnaireReview } from "@/components/questionnaire/questionnaire-review";
import { ProfileCompletionCard } from "@/components/profile/profile-completion-card";
import { PaymentGate } from "@/components/payment/payment-gate";
import { STEPS, ABOUT_YOU_STEP_COUNT, PARTNER_PREFERENCES_STEP_INDEX } from "@/components/questionnaire/steps";
import { hasPaidAccess } from "@/lib/access";

const REVIEW_STEP_INDEX = STEPS.length;

export default function QuestionnairePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("edit") === "1";
  const profile = useQuery(api.profiles.getProfile, {}) as Profile | null | undefined;
  const preferences = useQuery(api.profiles.getPreferences) as Preferences | null | undefined;
  const updateQuestionnaire = useMutation(api.profiles.updateQuestionnaire);
  const autoSaveProfile = useMutation(api.profiles.autoSaveProfile);
  const saveProfileEdits = useMutation(api.profiles.saveProfileEdits);

  const [stepOverride, setStepOverride] = useState<number | null>(
    isEditMode ? REVIEW_STEP_INDEX : null
  );

  const autoStep = useMemo(() => {
    if (!profile) return null;
    if (isEditMode) return REVIEW_STEP_INDEX;
    if (profile.questionnaireComplete) return null;
    const resume = getResumeStepIndex(profile, preferences);
    return resume >= REVIEW_STEP_INDEX ? REVIEW_STEP_INDEX : resume;
  }, [profile, preferences, isEditMode]);

  const currentStep = stepOverride ?? autoStep;

  const totalSteps = STEPS.length + 1;
  const isReviewStep = currentStep === REVIEW_STEP_INDEX;
  const progress =
    currentStep !== null
      ? ((currentStep + 1) / totalSteps) * 100
      : 0;

  const handleAutoSave = async (data: Record<string, unknown>) => {
    if (currentStep === null || isReviewStep) return;
    if (isEditMode) {
      await saveProfileEdits({ data });
      return;
    }
    await autoSaveProfile({
      step: currentStep + 1,
      data,
    });
  };

  const handleNext = async (stepData: Record<string, unknown>) => {
    if (currentStep === null) return;

    try {
      if (!isReviewStep) {
        if (isEditMode) {
          await saveProfileEdits({ data: stepData });
          toast.success("Changes saved");
          setStepOverride(REVIEW_STEP_INDEX);
          return;
        }
        await updateQuestionnaire({
          step: currentStep + 1,
          data: stepData,
        });
      }

      if (currentStep < REVIEW_STEP_INDEX) {
        const nextStep = currentStep + 1;
        if (nextStep === PARTNER_PREFERENCES_STEP_INDEX) {
          toast.success("Great! Now tell us what you're looking for in a partner.");
        }
        setStepOverride(nextStep);
      }
    } catch {
      toast.error("Failed to save. Please try again.");
    }
  };

  const handleBack = () => {
    if (currentStep !== null && currentStep > 0) {
      setStepOverride(currentStep - 1);
    }
  };

  const handleEditStep = (stepIndex: number) => {
    setStepOverride(stepIndex);
  };

  const handleComplete = () => {
    if (isEditMode) {
      router.push("/profile");
      return;
    }
    router.push("/dashboard");
  };

  if (profile === undefined) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto animate-pulse space-y-4">
          <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded" />
          <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="max-w-lg mx-auto text-center py-16">
          <p className="text-gray-500">Profile not found. Please try refreshing.</p>
          <Button className="mt-4" onClick={() => router.push("/dashboard")}>
            Go to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (!hasPaidAccess(profile) && !isEditMode) {
    return (
      <DashboardLayout>
        <PaymentGate
          title="Complete payment first"
          description="Pay the registration fee to unlock your profile questionnaire."
        />
      </DashboardLayout>
    );
  }

  if (profile.questionnaireComplete && !isEditMode) {
    return (
      <DashboardLayout>
        <div className="max-w-lg mx-auto text-center py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-primary mx-auto mb-4">
            <Check className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Profile Complete</h1>
          <p className="text-muted-foreground mb-6">
            Your profile is ready. Start browsing your matches!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <a href="/matches">View Matches</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/profile">My Profile</a>
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (currentStep === null) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto animate-pulse space-y-4">
          <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded" />
          <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  const completionPercent = calculateProfileProgress(profile, preferences);
  const currentStepConfig = !isReviewStep ? STEPS[currentStep] : null;
  const isPartnerPhase = currentStepConfig?.phase === "partner";
  const aboutStepNumber = !isReviewStep && !isPartnerPhase ? currentStep + 1 : null;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    {isEditMode ? "Edit Profile Details" : "Profile Questionnaire"}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {isReviewStep
                      ? isEditMode
                        ? "Review and update your profile"
                        : "Review your answers before submitting"
                      : isPartnerPhase
                        ? "Part 2 — What you're looking for in a spouse"
                        : `Part 1 — About you · ${STEPS[currentStep]?.title}`}
                  </p>
                </div>
                <span className="text-sm font-medium text-primary bg-accent dark:bg-primary/20 px-3 py-1 rounded-full">
                  {isReviewStep
                    ? "Review"
                    : isPartnerPhase
                      ? "Part 2"
                      : `Step ${aboutStepNumber}/${ABOUT_YOU_STEP_COUNT}`}
                </span>
              </div>
              <Progress value={progress} className="h-2.5" />
              <p className="text-xs text-muted-foreground mt-2">
                {completionPercent}% profile complete · Auto-saves as you go
              </p>
            </div>

            <div className="lg:hidden">
              <ProfileCompletionCard
                profile={profile}
                preferences={preferences}
                showContinue={false}
                compact
              />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {isReviewStep ? (
                  <QuestionnaireReview
                    profile={profile}
                    preferences={preferences}
                    onEditStep={handleEditStep}
                    onComplete={handleComplete}
                    isEditMode={isEditMode}
                  />
                ) : (
                  <>
                    {isPartnerPhase && (
                      <div className="mb-4 rounded-2xl border border-primary/20 bg-accent/80 dark:bg-primary/10 px-4 py-3">
                        <p className="text-sm font-medium text-accent-foreground dark:text-primary">
                          Part 2: Partner preferences
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          You finished your own details. Now answer what you want in a spouse.
                        </p>
                      </div>
                    )}
                    <QuestionnaireStep
                      key={`step-${currentStep}-${profile._id}`}
                      step={STEPS[currentStep]}
                      profile={profile}
                      preferences={preferences}
                      onSubmit={handleNext}
                      onAutoSave={handleAutoSave}
                      isLastFormStep={currentStep === STEPS.length - 1}
                      isLastAboutStep={currentStep === ABOUT_YOU_STEP_COUNT - 1}
                    />
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            {currentStep > 0 && !isReviewStep && (
              <Button variant="ghost" onClick={handleBack}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
          </div>

          <div className="hidden lg:block">
            <div className="sticky top-24">
              <ProfileCompletionCard
                profile={profile}
                preferences={preferences}
                showContinue={false}
              />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
