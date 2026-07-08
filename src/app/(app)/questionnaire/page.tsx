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
import { QuestionnairePhaseComplete } from "@/components/questionnaire/questionnaire-phase-complete";
import { ProfileCompletionCard } from "@/components/profile/profile-completion-card";
import { PaymentGate } from "@/components/payment/payment-gate";
import { QuestionnairePhotoStep } from "@/components/questionnaire/questionnaire-photo-step";
import { STEPS, ABOUT_YOU_STEP_COUNT, PARTNER_PREFERENCES_STEP_INDEX, PHOTO_STEP_INDEX } from "@/components/questionnaire/steps";
import { hasPaidAccess, isStaffRole } from "@/lib/access";
import { useQuestionnaireI18n } from "@/lib/i18n/questionnaire-i18n";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const REVIEW_STEP_INDEX = STEPS.length;

export default function QuestionnairePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("edit") === "1";
  const profile = useQuery(api.profiles.getProfile, {}) as Profile | null | undefined;
  const isStaff = isStaffRole(profile?.role);
  const preferences = useQuery(api.profiles.getPreferences) as Preferences | null | undefined;
  const updateQuestionnaire = useMutation(api.profiles.updateQuestionnaire);
  const autoSaveProfile = useMutation(api.profiles.autoSaveProfile);
  const saveProfileEdits = useMutation(api.profiles.saveProfileEdits);
  const { stepTitle, ui } = useQuestionnaireI18n();

  const [stepOverride, setStepOverride] = useState<number | null>(
    isEditMode ? REVIEW_STEP_INDEX : null
  );
  const [phaseComplete, setPhaseComplete] = useState<"about" | null>(null);

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
          toast.success(ui("changesSaved"));
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
        setPhaseComplete(null);
        setStepOverride(nextStep);
      }
    } catch {
      toast.error(ui("saveFailedToast"));
    }
  };

  const handleBack = () => {
    setPhaseComplete(null);
    if (currentStep !== null && currentStep > 0) {
      setStepOverride(currentStep - 1);
    }
  };

  const handleEditStep = (stepIndex: number) => {
    setPhaseComplete(null);
    setStepOverride(stepIndex);
  };

  const handlePhaseContinue = () => {
    setPhaseComplete(null);
    setStepOverride(PARTNER_PREFERENCES_STEP_INDEX);
  };

  const handlePhotoContinue = async () => {
    if (!profile?.profileImageId) {
      toast.error(ui("photoRequiredContinue"));
      return;
    }

    try {
      if (!isEditMode) {
        await updateQuestionnaire({ step: STEPS.length, data: {} });
        toast.success(ui("photoSavedToast"));
      } else {
        toast.success(ui("photoUpdatedToast"));
      }
      setStepOverride(REVIEW_STEP_INDEX);
    } catch {
      toast.error(ui("saveFailedToast"));
    }
  };

  const handleComplete = () => {
    if (isEditMode) {
      router.push("/profile");
      return;
    }
    router.push("/dashboard");
  };

  useEffect(() => {
    if (isStaff) {
      router.replace("/admin");
    }
  }, [isStaff, router]);

  if (profile === undefined || isStaff) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="max-w-lg mx-auto text-center py-16">
          <p className="text-muted-foreground">{ui("profileNotFound")}</p>
          <Button className="mt-4" onClick={() => router.push("/dashboard")}>
            {ui("goToDashboard")}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (!hasPaidAccess(profile) && !isEditMode) {
    return (
      <DashboardLayout>
        <PaymentGate
          title={ui("completePaymentFirst")}
          description={ui("payToUnlock")}
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
          <h1 className="text-2xl font-bold mb-2">{ui("profileCompleteTitle")}</h1>
          <p className="text-muted-foreground mb-6">
            {ui("profileReadySub")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <a href="/matches">{ui("viewMatches")}</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/profile">{ui("myProfile")}</a>
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (currentStep === null) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  const completionPercent = calculateProfileProgress(profile, preferences);
  const currentStepConfig = !isReviewStep ? STEPS[currentStep] : null;
  const isPartnerPhase = currentStepConfig?.phase === "partner";
  const isPhotoPhase = currentStepConfig?.phase === "photo";
  const aboutStepNumber =
    !isReviewStep && currentStepConfig?.phase === "about" ? currentStep + 1 : null;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    {isEditMode ? ui("editProfileDetails") : ui("profileQuestionnaire")}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {phaseComplete === "about"
                      ? ui("part1CompleteSub")
                      : isReviewStep
                      ? isEditMode
                        ? ui("reviewUpdateSub")
                        : ui("reviewAnswersSub")
                      : isPhotoPhase
                        ? ui("finalStepPhotoSub")
                      : isPartnerPhase
                        ? ui("part2Sub")
                        : `${ui("part1AboutPrefix")} · ${stepTitle(STEPS[currentStep]?.id, STEPS[currentStep]?.title)}`}
                  </p>
                </div>
                <span className="text-sm font-medium text-primary bg-accent dark:bg-primary/20 px-3 py-1 rounded-full">
                  {isReviewStep
                    ? ui("badgeReview")
                    : isPhotoPhase
                      ? ui("badgePhoto")
                    : isPartnerPhase
                      ? ui("badgePart2")
                      : aboutStepNumber
                        ? `${ui("stepWord")} ${aboutStepNumber}/${ABOUT_YOU_STEP_COUNT}`
                        : ui("badgeQuestionnaire")}
                </span>
              </div>
              <Progress value={progress} className="h-2.5" />
              <p className="text-xs text-muted-foreground mt-2">
                {ui("profileCompleteFooter").replace("{p}", String(completionPercent))}
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
                key={phaseComplete ?? currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {phaseComplete ? (
                  <QuestionnairePhaseComplete
                    phase={phaseComplete}
                    onContinue={handlePhaseContinue}
                  />
                ) : isReviewStep ? (
                  <QuestionnaireReview
                    profile={profile}
                    preferences={preferences}
                    onEditStep={handleEditStep}
                    onComplete={handleComplete}
                    isEditMode={isEditMode}
                  />
                ) : isPhotoPhase ? (
                  <QuestionnairePhotoStep
                    profile={profile}
                    onSubmit={() => void handlePhotoContinue()}
                  />
                ) : (
                  <>
                    {isPartnerPhase && (
                      <div className="mb-4 rounded-2xl border border-primary/20 bg-accent/80 dark:bg-primary/10 px-5 py-4">
                        <p className="text-base font-bold text-accent-foreground dark:text-primary">
                          {ui("part2CalloutTitle")}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                          {ui("part2CalloutDesc")}
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
                      isLastFormStep={false}
                      isLastAboutStep={currentStep === ABOUT_YOU_STEP_COUNT - 1}
                    />
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            {currentStep > 0 && !isReviewStep && !phaseComplete && (
              <Button variant="ghost" onClick={handleBack}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                {ui("back")}
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
