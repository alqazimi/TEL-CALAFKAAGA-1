"use client";

import { useState, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import type { Profile } from "@/types";
import type { Preferences } from "@/lib/profile-progress";
import {
  getResumeStepIndex,
} from "@/lib/profile-progress";
import { Button } from "@/components/ui/button";
import { QuestionnaireStep } from "@/components/questionnaire/questionnaire-step";
import { QuestionnaireReview } from "@/components/questionnaire/questionnaire-review";
import { QuestionnairePhaseComplete } from "@/components/questionnaire/questionnaire-phase-complete";
import { QuestionnairePhotoStep } from "@/components/questionnaire/questionnaire-photo-step";
import { QuestionnaireShell } from "@/components/questionnaire/questionnaire-shell";
import { STEPS, ABOUT_YOU_STEP_COUNT, PARTNER_PREFERENCES_STEP_INDEX } from "@/components/questionnaire/steps";
import { hasPaidAccess, isStaffRole } from "@/lib/access";
import { useTranslation } from "@/lib/i18n/context";
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
  const { ui } = useQuestionnaireI18n();
  const { t } = useTranslation();
  const welcome = searchParams.get("welcome") === "true";

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
    if (profile && hasPaidAccess(profile)) {
      router.push("/dashboard");
      return;
    }
    router.push("/payment");
  };

  useEffect(() => {
    if (isStaff) {
      router.replace("/admin");
    }
  }, [isStaff, router]);

  const phaseLabel = useMemo(() => {
    if (isReviewStep) return ui("badgeReview");
    if (!currentStep && currentStep !== 0) return ui("badgeQuestionnaire");
    const stepConfig = STEPS[currentStep!];
    if (!stepConfig) return ui("badgeQuestionnaire");
    if (stepConfig.phase === "photo") return ui("badgePhoto");
    if (stepConfig.phase === "partner") return ui("badgePart2");
    return `${ui("part1AboutPrefix")} · ${ui("stepWord")} ${currentStep! + 1}/${ABOUT_YOU_STEP_COUNT}`;
  }, [currentStep, isReviewStep, ui]);

  if (profile === undefined || isStaff) {
    return (
      <QuestionnaireShell progress={0} phaseLabel={ui("badgeQuestionnaire")}>
        <Skeleton className="h-10 w-full mb-6" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </QuestionnaireShell>
    );
  }

  if (!profile) {
    return (
      <QuestionnaireShell progress={0} phaseLabel={ui("badgeQuestionnaire")}>
        <div className="text-center py-16">
          <p className="text-muted-foreground">{ui("profileNotFound")}</p>
          <Button className="mt-4" onClick={() => router.push("/dashboard")}>
            {ui("goToDashboard")}
          </Button>
        </div>
      </QuestionnaireShell>
    );
  }

  if (profile.questionnaireComplete && !isEditMode) {
    const paid = hasPaidAccess(profile);

    return (
      <QuestionnaireShell progress={100} phaseLabel={ui("profileCompleteTitle")}>
        <div className="text-center py-12 sm:py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto mb-5">
            <Check className="h-8 w-8" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
            {ui("profileCompleteTitle")}
          </h1>
          <p className="text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
            {paid ? ui("profileReadySub") : ui("profileReadyPaySub")}
          </p>
          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            {paid ? (
              <Button className="h-12 rounded-2xl" asChild>
                <a href="/matches">{ui("viewMatches")}</a>
              </Button>
            ) : (
              <Button className="h-12 rounded-2xl" asChild>
                <a href="/payment">{t("dashboard.choosePlan")}</a>
              </Button>
            )}
            <Button variant="outline" className="h-12 rounded-2xl" asChild>
              <a href="/profile">{ui("myProfile")}</a>
            </Button>
          </div>
        </div>
      </QuestionnaireShell>
    );
  }

  if (currentStep === null) {
    return (
      <QuestionnaireShell progress={0} phaseLabel={ui("badgeQuestionnaire")}>
        <Skeleton className="h-10 w-full mb-6" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </QuestionnaireShell>
    );
  }

  const currentStepConfig = !isReviewStep ? STEPS[currentStep] : null;
  const isPhotoPhase = currentStepConfig?.phase === "photo";
  const showWelcome =
    welcome && currentStep === 0 && !isReviewStep && !phaseComplete && !isEditMode;

  return (
    <QuestionnaireShell
      progress={progress}
      phaseLabel={phaseLabel}
      onBack={
        currentStep > 0 && !isReviewStep && !phaseComplete ? handleBack : undefined
      }
    >
      {showWelcome && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-2xl border border-primary/15 bg-primary/[0.04] px-5 py-4"
        >
          <p className="text-sm font-semibold text-primary">
            {ui("welcomeQuestionnaireTitle")}
          </p>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            {ui("welcomeQuestionnaireSub")}
          </p>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={phaseComplete ?? currentStep}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
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
            <QuestionnaireStep
              key={`step-${currentStep}-${profile._id}`}
              step={STEPS[currentStep]}
              profile={profile}
              preferences={preferences}
              onSubmit={handleNext}
              onAutoSave={handleAutoSave}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </QuestionnaireShell>
  );
}
