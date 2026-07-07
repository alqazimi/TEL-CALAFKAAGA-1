"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Cloud, CloudOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CountryCombobox } from "@/components/ui/country-combobox";
import { CountryMultiCombobox } from "@/components/ui/country-multi-combobox";
import { cn } from "@/lib/utils";
import {
  buildStepData,
  initFormState,
  isFieldVisible,
  validateField,
  validateStepFields,
} from "@/lib/questionnaire-form";
import { toast } from "sonner";
import type { Preferences } from "@/lib/profile-progress";
import type { Profile } from "@/types";
import { CITIES } from "@/lib/constants";
import { useQuestionnaireI18n } from "@/lib/i18n/questionnaire-i18n";
import type { QuestionnaireUiKey } from "@/lib/i18n/questionnaire-i18n";
import type { FieldConfig, StepConfig } from "./steps";

const AUTO_ADVANCE_MS = 450;
const AUTO_ADVANCE_TYPES = new Set(["radio", "select", "country-search"]);

/** Maps English validation strings from validateStepFields to translatable UI keys. */
const ERROR_KEY_MAP: Record<string, QuestionnaireUiKey> = {
  "Please select an option": "selectOption",
  "This field is required": "requiredField",
  "Please select at least one option": "selectAtLeastOne",
};

function translateError(
  error: string,
  ui: (key: QuestionnaireUiKey) => string
): string {
  const key = ERROR_KEY_MAP[error];
  return key ? ui(key) : error;
}

interface QuestionnaireStepProps {
  step: StepConfig;
  profile: Profile | null | undefined;
  preferences?: Preferences | null;
  onSubmit: (data: Record<string, unknown>) => void;
  onAutoSave?: (data: Record<string, unknown>) => Promise<void>;
  isLastFormStep?: boolean;
  isLastAboutStep?: boolean;
}

export function QuestionnaireStep({
  step,
  profile,
  preferences,
  onSubmit,
  onAutoSave,
  isLastFormStep = false,
  isLastAboutStep = false,
}: QuestionnaireStepProps) {
  const initial = initFormState(profile, preferences);
  const [selectedCountry, setSelectedCountry] = useState(initial.selectedCountry);
  const [multiSelects, setMultiSelects] = useState(initial.multiSelects);
  const [selects, setSelects] = useState(initial.selects);
  const [radios, setRadios] = useState(initial.radios);
  const [fieldIndex, setFieldIndex] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null);
  const skipAutoSaveRef = useRef(true);
  const { register, watch, setValue } = useForm({ defaultValues: { bio: initial.bio } });
  const bio = watch("bio", initial.bio);
  const { stepTitle, stepDescription, fieldLabel, optionLabel, ui } = useQuestionnaireI18n();

  const profileId = profile?._id ?? null;

  useEffect(() => {
    const state = initFormState(profile, preferences);
    setSelectedCountry(state.selectedCountry);
    setMultiSelects(state.multiSelects);
    setSelects(state.selects);
    setRadios(state.radios);
    setValue("bio", state.bio);
    setFieldErrors({});
    setFieldIndex(0);
    skipAutoSaveRef.current = true;
  }, [profileId, preferences, step.id, setValue]);

  const formState = { radios, selects, multiSelects, bio };

  const visibleFields = step.fields.filter((field) =>
    isFieldVisible(field, profile, radios)
  );
  const focusMode = visibleFields.length > 1;
  const currentField = visibleFields[fieldIndex] ?? visibleFields[0];
  const isLastField = fieldIndex >= visibleFields.length - 1;
  const isPartnerStep = step.phase === "partner";
  const fieldsToRender = focusMode && currentField ? [currentField] : visibleFields;

  const triggerAutoSave = useCallback(() => {
    if (!onAutoSave) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const data = buildStepData(step, profile, formState);
      if (Object.keys(data).length === 0) return;
      setSaveStatus("saving");
      try {
        await onAutoSave(data);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch {
        setSaveStatus("error");
      }
    }, 800);
  }, [onAutoSave, step, profile, radios, selects, multiSelects, bio]);

  useEffect(() => {
    if (skipAutoSaveRef.current) {
      skipAutoSaveRef.current = false;
      return;
    }
    triggerAutoSave();
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [triggerAutoSave]);

  useEffect(() => {
    return () => {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    };
  }, []);

  const scheduleAutoAdvance = (field: FieldConfig) => {
    if (!focusMode || isLastField || !AUTO_ADVANCE_TYPES.has(field.type)) return;
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    autoAdvanceRef.current = setTimeout(() => {
      setFieldIndex((i) => Math.min(i + 1, visibleFields.length - 1));
    }, AUTO_ADVANCE_MS);
  };

  const goToPreviousField = () => {
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    setFieldIndex((i) => Math.max(0, i - 1));
    setFieldErrors({});
  };

  const goToNextField = () => {
    if (!currentField) return;
    const error = validateField(currentField, profile, formState);
    if (error) {
      setFieldErrors({ [currentField.name]: error });
      return;
    }
    setFieldErrors({});
    setFieldIndex((i) => Math.min(i + 1, visibleFields.length - 1));
  };

  const handleFormSubmit = () => {
    const errors = validateStepFields(step, profile, formState);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstErrorField = visibleFields.find((f) => errors[f.name]);
      if (firstErrorField && focusMode) {
        setFieldIndex(visibleFields.indexOf(firstErrorField));
      }
      toast.error(ui("answerAllRequired"));
      return;
    }
    setFieldErrors({});
    const data = buildStepData(step, profile, formState);
    onSubmit(data);
  };

  const toggleMultiSelect = (fieldName: string, value: string, maxSelect?: number) => {
    setMultiSelects((prev) => {
      const current = prev[fieldName] ?? [];
      if (current.includes(value)) {
        return { ...prev, [fieldName]: current.filter((v) => v !== value) };
      }
      if (maxSelect && current.length >= maxSelect) return prev;
      return { ...prev, [fieldName]: [...current, value] };
    });
  };

  const clearFieldError = (fieldName: string) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  };

  const renderFieldInput = (field: FieldConfig) => (
    <>
      {field.type === "radio" && (
        <RadioGroup
          value={radios[field.name] ?? ""}
          onValueChange={(v) => {
            setRadios((prev) => ({ ...prev, [field.name]: v }));
            clearFieldError(field.name);
            scheduleAutoAdvance(field);
          }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          {field.options?.map((option) => (
            <label
              key={String(option)}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-all duration-200 active:scale-[0.98]",
                radios[field.name] === String(option)
                  ? "border-primary bg-accent text-accent-foreground shadow-sm ring-1 ring-primary/30"
                  : "border-border bg-input hover:border-primary/40 hover:bg-muted/50 hover:shadow-sm"
              )}
            >
              <RadioGroupItem value={String(option)} />
              <span className="text-sm font-semibold">{optionLabel(String(option))}</span>
            </label>
          ))}
        </RadioGroup>
      )}

      {field.type === "country-search" && (
        <CountryCombobox
          value={selects[field.name] ?? ""}
          onChange={(v) => {
            setSelects((prev) => ({ ...prev, [field.name]: v }));
            if (field.name === "country") {
              setSelectedCountry(v);
              setSelects((prev) => ({ ...prev, city: "" }));
            }
            clearFieldError(field.name);
            clearFieldError("city");
            scheduleAutoAdvance(field);
          }}
        />
      )}

      {field.type === "country-multi" && (
        <CountryMultiCombobox
          value={multiSelects[field.name] ?? []}
          onChange={(v) => {
            setMultiSelects((prev) => ({ ...prev, [field.name]: v }));
            clearFieldError(field.name);
          }}
        />
      )}

      {field.type === "select" && field.name === "city" && (
        CITIES[selectedCountry]?.length ? (
          <Select
            value={selects[field.name] ?? ""}
            onValueChange={(v) => {
              setSelects((prev) => ({ ...prev, [field.name]: v }));
              clearFieldError(field.name);
              scheduleAutoAdvance(field);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={ui("selectCity")} />
            </SelectTrigger>
            <SelectContent>
              {CITIES[selectedCountry].map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            value={selects[field.name] ?? ""}
            onChange={(e) => {
              setSelects((prev) => ({ ...prev, [field.name]: e.target.value }));
              clearFieldError(field.name);
            }}
            placeholder={ui("enterCity")}
          />
        )
      )}

      {field.type === "select" && field.name !== "city" && (
        <Select
          value={selects[field.name] ?? ""}
          onValueChange={(v) => {
            setSelects((prev) => ({ ...prev, [field.name]: v }));
            if (field.name === "country") setSelectedCountry(v);
            clearFieldError(field.name);
            scheduleAutoAdvance(field);
          }}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={`${ui("selectPlaceholder")} ${fieldLabel(field.name, field.label).toLowerCase()}`}
            />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((option) => (
              <SelectItem key={String(option)} value={String(option)}>
                {optionLabel(String(option))}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {field.type === "textarea" && (
        <div>
          <Textarea
            {...register("bio")}
            placeholder={ui("bioPlaceholder")}
            rows={4}
            maxLength={500}
            onChange={(e) => {
              setValue("bio", e.target.value);
              clearFieldError("bio");
            }}
          />
          <p className="text-xs text-muted-foreground mt-1 text-right">
            {(bio?.length ?? 0)}/500
          </p>
        </div>
      )}

      {field.type === "multi-select" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {field.options?.map((option) => {
            const selected = (multiSelects[field.name] ?? []).includes(String(option));
            return (
              <label
                key={String(option)}
                className={cn(
                  "flex items-center gap-2 rounded-xl border p-3 cursor-pointer transition-all duration-200 text-sm font-semibold active:scale-[0.98]",
                  selected
                    ? "border-primary bg-accent text-accent-foreground shadow-sm ring-1 ring-primary/30"
                    : "border-border bg-input hover:border-primary/40 hover:bg-muted/50 hover:shadow-sm"
                )}
              >
                <Checkbox
                  checked={selected}
                  onCheckedChange={() => {
                    toggleMultiSelect(field.name, String(option), field.maxSelect);
                    clearFieldError(field.name);
                  }}
                />
                {optionLabel(String(option))}
              </label>
            );
          })}
        </div>
      )}
    </>
  );

  return (
    <Card className="shadow-lg shadow-primary/5 overflow-hidden">
      <CardHeader className="border-b border-border bg-gradient-to-r from-accent/50 to-transparent">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <CardTitle className="text-xl sm:text-2xl font-bold">
              {stepTitle(step.id, step.title)}
            </CardTitle>
            <CardDescription className="text-sm sm:text-base mt-1">
              {stepDescription(step.id, step.description)}
            </CardDescription>
            {focusMode && (
              <p className="text-xs font-semibold text-primary mt-2">
                {ui("questionOf")
                  .replace("{current}", String(fieldIndex + 1))
                  .replace("{total}", String(visibleFields.length))}
              </p>
            )}
          </div>
          {onAutoSave && saveStatus !== "idle" && (
            <div className="flex items-center gap-1.5 text-xs shrink-0 rounded-full bg-card px-2.5 py-1 border border-border">
              {saveStatus === "saving" && (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  <span className="text-muted-foreground">{ui("saving")}</span>
                </>
              )}
              {saveStatus === "saved" && (
                <>
                  <Cloud className="h-3.5 w-3.5 text-primary" />
                  <span className="text-primary">{ui("saved")}</span>
                </>
              )}
              {saveStatus === "error" && (
                <>
                  <CloudOff className="h-3.5 w-3.5 text-destructive" />
                  <span className="text-destructive">{ui("saveFailed")}</span>
                </>
              )}
            </div>
          )}
        </div>
        {focusMode && (
          <div className="flex gap-1.5 mt-4">
            {visibleFields.map((field, i) => (
              <div
                key={field.name}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors duration-300",
                  i < fieldIndex
                    ? "bg-primary"
                    : i === fieldIndex
                      ? "bg-primary/60"
                      : "bg-muted"
                )}
              />
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-8 pt-8">
        <AnimatePresence mode="wait">
          {fieldsToRender.map((field) => (
            <motion.div
              key={`${step.id}-${field.name}-${fieldIndex}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="space-y-4"
            >
              <Label className="text-lg sm:text-xl font-bold text-foreground leading-snug block">
                {fieldLabel(field.name, field.label)}
                {field.required && <span className="text-destructive ml-0.5">*</span>}
              </Label>
              {fieldErrors[field.name] && (
                <p className="text-sm text-destructive font-medium">
                  {translateError(fieldErrors[field.name], ui)}
                </p>
              )}
              {renderFieldInput(field)}
            </motion.div>
          ))}
        </AnimatePresence>

        <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 pt-2">
          {focusMode && fieldIndex > 0 && (
            <Button variant="ghost" onClick={goToPreviousField} className="sm:mr-auto">
              <ChevronLeft className="h-4 w-4 mr-1" />
              {ui("previousQuestion")}
            </Button>
          )}

          {focusMode && !isLastField ? (
            <Button onClick={goToNextField} className="w-full sm:w-auto text-base font-semibold" size="lg">
              {ui("nextQuestion")}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleFormSubmit}
              className="w-full sm:w-auto sm:ml-auto text-base font-semibold"
              size="lg"
            >
              {isLastFormStep
                ? ui("submitAndReview")
                : isLastAboutStep
                  ? ui("submitAndContinue")
                  : isPartnerStep
                    ? ui("saveAndContinueToPhoto")
                    : ui("saveAndContinue")}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
