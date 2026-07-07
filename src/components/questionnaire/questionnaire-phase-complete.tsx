"use client";

import { Check, ChevronRight, Heart, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuestionnaireI18n } from "@/lib/i18n/questionnaire-i18n";

type Phase = "about" | "partner";

interface QuestionnairePhaseCompleteProps {
  phase: Phase;
  onContinue: () => void;
}

export function QuestionnairePhaseComplete({
  phase,
  onContinue,
}: QuestionnairePhaseCompleteProps) {
  const isAbout = phase === "about";
  const { ui } = useQuestionnaireI18n();

  return (
    <Card className="shadow-lg shadow-primary/10 border-primary/20 overflow-hidden">
      <CardContent className="p-8 sm:p-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-primary mx-auto mb-5">
          <Check className="h-8 w-8" strokeWidth={2.5} />
        </div>

        <p className="text-sm font-semibold uppercase tracking-wide text-primary mb-2">
          {isAbout ? ui("part1Complete") : ui("part2Complete")}
        </p>

        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
          {isAbout ? ui("infoSaved") : ui("prefsSaved")}
        </h2>

        <p className="text-muted-foreground max-w-md mx-auto mb-8 text-base leading-relaxed">
          {isAbout ? ui("part1Desc") : ui("part2Desc")}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
          <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm font-medium">
            <User className="h-4 w-4 text-primary" />
            {ui("aboutYouChip")}
            <Check className="h-4 w-4 text-primary" />
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
          <div
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
              isAbout
                ? "border border-dashed border-primary/40 text-muted-foreground"
                : "bg-muted font-semibold"
            }`}
          >
            <Heart className={`h-4 w-4 ${isAbout ? "text-muted-foreground" : "text-primary"}`} />
            {ui("partnerPrefsChip")}
            {!isAbout && <Check className="h-4 w-4 text-primary" />}
          </div>
        </div>

        <Button size="lg" className="w-full sm:w-auto min-w-[220px] text-base font-semibold" onClick={onContinue}>
          {isAbout ? ui("continueToPartner") : ui("reviewAndSubmit")}
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </CardContent>
    </Card>
  );
}
