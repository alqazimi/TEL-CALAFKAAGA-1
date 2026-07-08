"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  getResumeFieldIndex,
  getVisibleFields,
  initFormState,
  validateField,
  validateStepFields,
} from "@/lib/questionnaire-form";
import { toast } from "sonner";
import type { Preferences } from "@/lib/profile-progress";
import type { Profile } from "@/types";
import { CITIES, CITIZENSHIP_NOT_REQUIRED_COUNTRIES } from "@/lib/constants";
import { useQuestionnaireI18n } from "@/lib/i18n/questionnaire-i18n";
import type { QuestionnaireUiKey } from "@/lib/i18n/questionnaire-i18n";
import type { FieldConfig, StepConfig } from "./steps";

const AUTO_ADVANCE_MS = 450;
const AUTO_SAVE_MS = 1000;
const AUTO_ADVANCE_TYPES = new Set(["radio", "select", "country-search"]);

type FormState = {
  radios: Record<string, string>;
  selects: Record<string, string>;
  multiSelects: Record<string, string[]>;
  textFields: Record<string, string>;
  bio: string;
};

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

function fieldNeedsManualAdvance(field: FieldConfig, selectedCountry: string): boolean {
  if (!AUTO_ADVANCE_TYPES.has(field.type)) return true;
  if (field.type === "select" && field.name === "city" && !CITIES[selectedCountry]?.length) {
    return true;
  }
  return false;
}

interface QuestionnaireStepProps {
  step: StepConfig;
  profile: Profile | null | undefined;
  preferences?: Preferences | null;
  onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
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
}: QuestionnaireStepProps) {
  const initial = initFormState(profile, preferences);
  const [selectedCountry, setSelectedCountry] = useState(initial.selectedCountry);
  const [multiSelects, setMultiSelects] = useState(initial.multiSelects);
  const [selects, setSelects] = useState(initial.selects);
  const [radios, setRadios] = useState(initial.radios);
  const [textFields, setTextFields] = useState(initial.textFields);
  const [fieldIndex, setFieldIndex] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [isAdvancing, setIsAdvancing] = useState(false);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null);
  const skipAutoSaveRef = useRef(true);
  const fieldIndexRef = useRef(0);
  const selectedCountryRef = useRef(initial.selectedCountry);
  const { register, watch, setValue } = useForm({ defaultValues: { bio: initial.bio } });
  const bio = watch("bio", initial.bio);
  const { stepTitle, stepDescription, fieldLabel, optionLabel, ui } = useQuestionnaireI18n();

  const profileId = profile?._id ?? null;
  const stepId = step.id;
  const profileRef = useRef(profile);
  const preferencesRef = useRef(preferences);
  profileRef.current = profile;
  preferencesRef.current = preferences;

  const formState: FormState = { radios, selects, multiSelects, textFields, bio };
  const formStateRef = useRef(formState);
  formStateRef.current = formState;
  fieldIndexRef.current = fieldIndex;
  selectedCountryRef.current = selectedCountry;

  const visibleFields = useMemo(
    () => getVisibleFields(step, profile, radios, selects),
    [step, profile, radios, selects]
  );
  const visibleFieldKey = visibleFields.map((f) => f.name).join("|");

  const safeFieldIndex = Math.min(
    fieldIndex,
    Math.max(0, visibleFields.length - 1)
  );
  const currentField = visibleFields[safeFieldIndex];
  const isLastField = safeFieldIndex >= visibleFields.length - 1;
  const fieldsToRender = currentField ? [currentField] : [];

  // Load form state only when switching users or steps — not on auto-save profile updates.
  useEffect(() => {
    const state = initFormState(profileRef.current, preferencesRef.current);
    setSelectedCountry(state.selectedCountry);
    setMultiSelects(state.multiSelects);
    setSelects(state.selects);
    setRadios(state.radios);
    setTextFields(state.textFields);
    setValue("bio", state.bio);
    setFieldErrors({});
    setFieldIndex(getResumeFieldIndex(step, profileRef.current, state));
    skipAutoSaveRef.current = true;
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
  }, [profileId, stepId, setValue, step]);

  // Keep index in range when conditional questions hide/show — never jump to Q1.
  useEffect(() => {
    setFieldIndex((i) => {
      if (visibleFields.length === 0) return 0;
      return Math.min(i, visibleFields.length - 1);
    });
  }, [visibleFieldKey, visibleFields.length]);

  const flushAutoSave = useCallback(async () => {
    if (!onAutoSave) return;
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    const data = buildStepData(step, profile, formStateRef.current);
    if (Object.keys(data).length === 0) return;
    setSaveStatus("saving");
    try {
      await onAutoSave(data);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus((s) => (s === "saved" ? "idle" : s)), 2000);
    } catch {
      setSaveStatus("error");
    }
  }, [onAutoSave, step, profile]);

  const scheduleAutoSave = useCallback(() => {
    if (!onAutoSave) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void flushAutoSave();
    }, AUTO_SAVE_MS);
  }, [onAutoSave, flushAutoSave]);

  useEffect(() => {
    if (skipAutoSaveRef.current) {
      skipAutoSaveRef.current = false;
      return;
    }
    scheduleAutoSave();
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [radios, selects, multiSelects, textFields, bio, scheduleAutoSave]);

  useEffect(() => {
    return () => {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const completeCurrentStep = useCallback(async () => {
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    const state = formStateRef.current;
    const visible = getVisibleFields(step, profile, state.radios, state.selects);
    const errors = validateStepFields(step, profile, state);
    if (Object.keys(errors).length > 0) {
      const firstErrorField = visible.find((f) => errors[f.name]);
      if (firstErrorField) {
        setFieldIndex(visible.indexOf(firstErrorField));
        setFieldErrors(errors);
      }
      toast.error(ui("answerAllRequired"));
      return;
    }
    setFieldErrors({});
    setIsAdvancing(true);
    try {
      await flushAutoSave();
      const data = buildStepData(step, profile, state);
      await onSubmit(data);
    } catch {
      toast.error(ui("saveFailed"));
    } finally {
      setIsAdvancing(false);
    }
  }, [step, profile, onSubmit, flushAutoSave, ui]);

  const completeStepRef = useRef(completeCurrentStep);
  completeStepRef.current = completeCurrentStep;

  const scheduleAutoAdvance = useCallback((field: FieldConfig) => {
    if (fieldNeedsManualAdvance(field, selectedCountryRef.current)) return;
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    autoAdvanceRef.current = setTimeout(() => {
      const idx = fieldIndexRef.current;
      const count = getVisibleFields(
        step,
        profile,
        formStateRef.current.radios,
        formStateRef.current.selects
      ).length;
      if (idx >= count - 1) {
        void completeStepRef.current();
      } else {
        setFieldIndex(idx + 1);
      }
    }, AUTO_ADVANCE_MS);
  }, [step, profile]);

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
    if (isLastField) {
      void completeCurrentStep();
    } else {
      setFieldIndex((i) => i + 1);
    }
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

  const showManualNext =
    currentField && fieldNeedsManualAdvance(currentField, selectedCountry);

  const renderFieldInput = (field: FieldConfig) => (
    <>
      {field.type === "radio" && (
        <RadioGroup
          value={radios[field.name] ?? ""}
          onValueChange={(v) => {
            setRadios((prev) => {
              const next = { ...prev, [field.name]: v };
              if (field.name === "maritalStatus" && v === "Never married") {
                delete next.hasChildren;
              }
              if (field.name === "substanceUse" && v === "No") {
                setTextFields((tf) => {
                  const updated = { ...tf };
                  delete updated.substanceDetails;
                  return updated;
                });
              }
              return next;
            });
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
              if (
                CITIZENSHIP_NOT_REQUIRED_COUNTRIES.includes(
                  v as (typeof CITIZENSHIP_NOT_REQUIRED_COUNTRIES)[number]
                )
              ) {
                setRadios((prev) => {
                  const next = { ...prev };
                  delete next.citizenshipStatus;
                  return next;
                });
              }
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

      {field.type === "textarea" && field.name === "bio" && (
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

      {field.type === "textarea" && field.name !== "bio" && (
        <Textarea
          value={textFields[field.name] ?? ""}
          placeholder={ui("substanceDetailsPlaceholder")}
          rows={4}
          maxLength={500}
          onChange={(e) => {
            setTextFields((prev) => ({ ...prev, [field.name]: e.target.value }));
            clearFieldError(field.name);
          }}
        />
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
            {visibleFields.length > 0 && (
              <p className="text-xs font-semibold text-primary mt-2">
                {ui("questionOf")
                  .replace("{current}", String(safeFieldIndex + 1))
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
        {visibleFields.length > 1 && (
          <div className="flex gap-1.5 mt-4">
            {visibleFields.map((field, i) => (
              <div
                key={field.name}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors duration-300",
                  i < safeFieldIndex
                    ? "bg-primary"
                    : i === safeFieldIndex
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
              key={`${step.id}-${field.name}-${safeFieldIndex}`}
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
          {safeFieldIndex > 0 && (
            <Button
              variant="ghost"
              onClick={goToPreviousField}
              className="sm:mr-auto"
              disabled={isAdvancing}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {ui("previousQuestion")}
            </Button>
          )}

          {showManualNext && (
            <Button
              onClick={goToNextField}
              className="w-full sm:w-auto sm:ml-auto text-base font-semibold"
              size="lg"
              disabled={isAdvancing}
            >
              {isAdvancing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {ui("saving")}
                </>
              ) : (
                <>
                  {isLastField ? ui("continueFlow") : ui("nextQuestion")}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          )}

          {isAdvancing && !showManualNext && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground sm:ml-auto py-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              {ui("saving")}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
