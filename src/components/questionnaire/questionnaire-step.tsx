"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

const AUTO_ADVANCE_MS = 380;
const AUTO_SAVE_MS = 1000;
const AUTO_ADVANCE_TYPES = new Set(["radio", "select", "country-search"]);
const SCROLLABLE_SELECT_MIN = 8;

type FormState = {
  radios: Record<string, string>;
  selects: Record<string, string>;
  multiSelects: Record<string, string[]>;
  textFields: Record<string, string>;
  bio: string;
};

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

function OptionButton({
  selected,
  label,
  onClick,
  disabled,
}: {
  selected: boolean;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between gap-4 rounded-2xl border-2 px-5 py-4 text-left transition-all duration-200 active:scale-[0.99]",
        selected
          ? "border-primary bg-primary/[0.07] shadow-sm"
          : "border-border bg-card hover:border-primary/30 hover:bg-muted/40",
        disabled && "opacity-60 pointer-events-none"
      )}
    >
      <span className="text-base font-medium leading-snug">{label}</span>
      {selected && <Check className="h-5 w-5 shrink-0 text-primary" strokeWidth={2.5} />}
    </button>
  );
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
  const [isAdvancing, setIsAdvancing] = useState(false);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null);
  const skipAutoSaveRef = useRef(true);
  const fieldIndexRef = useRef(0);
  const selectedCountryRef = useRef(initial.selectedCountry);
  const { register, watch, setValue } = useForm({ defaultValues: { bio: initial.bio } });
  const bio = watch("bio", initial.bio);
  const { fieldLabel, optionLabel, ui } = useQuestionnaireI18n();

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
    try {
      await onAutoSave(data);
    } catch {
      toast.error(ui("saveFailed"));
    }
  }, [onAutoSave, step, profile, ui]);

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

  const scheduleAutoAdvance = useCallback(
    (field: FieldConfig) => {
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
    },
    [step, profile]
  );

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

  const renderSelectOptions = (
    field: FieldConfig,
    value: string,
    onSelect: (v: string) => void
  ) => {
    const options = (field.options ?? []).map(String);
    if (options.length >= SCROLLABLE_SELECT_MIN) {
      return (
        <div className="max-h-[min(22rem,50dvh)] overflow-y-auto space-y-2 pr-1 -mr-1">
          {options.map((option) => (
            <OptionButton
              key={option}
              selected={value === option}
              label={optionLabel(option)}
              onClick={() => onSelect(option)}
            />
          ))}
        </div>
      );
    }
    return (
      <div className="space-y-2.5">
        {options.map((option) => (
          <OptionButton
            key={option}
            selected={value === option}
            label={optionLabel(option)}
            onClick={() => onSelect(option)}
          />
        ))}
      </div>
    );
  };

  const renderFieldInput = (field: FieldConfig) => {
    if (field.type === "radio") {
      return (
        <div className="space-y-2.5" role="radiogroup">
          {field.options?.map((option) => {
            const value = String(option);
            const selected = radios[field.name] === value;
            return (
              <OptionButton
                key={value}
                selected={selected}
                label={optionLabel(value)}
                onClick={() => {
                  setRadios((prev) => {
                    const next = { ...prev, [field.name]: value };
                    if (field.name === "maritalStatus" && value === "Never married") {
                      delete next.hasChildren;
                    }
                    if (field.name === "substanceUse" && value === "No") {
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
              />
            );
          })}
        </div>
      );
    }

    if (field.type === "country-search") {
      return (
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
      );
    }

    if (field.type === "country-multi") {
      return (
        <CountryMultiCombobox
          value={multiSelects[field.name] ?? []}
          onChange={(v) => {
            setMultiSelects((prev) => ({ ...prev, [field.name]: v }));
            clearFieldError(field.name);
          }}
        />
      );
    }

    if (field.type === "select" && field.name === "city") {
      if (CITIES[selectedCountry]?.length) {
        return renderSelectOptions(field, selects[field.name] ?? "", (v) => {
          setSelects((prev) => ({ ...prev, [field.name]: v }));
          clearFieldError(field.name);
          scheduleAutoAdvance(field);
        });
      }
      return (
        <Input
          value={selects[field.name] ?? ""}
          onChange={(e) => {
            setSelects((prev) => ({ ...prev, [field.name]: e.target.value }));
            clearFieldError(field.name);
          }}
          placeholder={ui("enterCity")}
          className="h-14 rounded-2xl text-base px-5"
        />
      );
    }

    if (field.type === "select" && field.name !== "city") {
      return renderSelectOptions(field, selects[field.name] ?? "", (v) => {
        setSelects((prev) => ({ ...prev, [field.name]: v }));
        if (field.name === "country") setSelectedCountry(v);
        clearFieldError(field.name);
        scheduleAutoAdvance(field);
      });
    }

    if (field.type === "textarea" && field.name === "bio") {
      return (
        <div>
          <Textarea
            {...register("bio")}
            placeholder={ui("bioPlaceholder")}
            rows={6}
            maxLength={500}
            className="rounded-2xl text-base leading-relaxed resize-none min-h-[10rem]"
            onChange={(e) => {
              setValue("bio", e.target.value);
              clearFieldError("bio");
            }}
          />
          <p className="text-xs text-muted-foreground mt-2 text-right">
            {(bio?.length ?? 0)}/500
          </p>
        </div>
      );
    }

    if (field.type === "textarea" && field.name !== "bio") {
      return (
        <Textarea
          value={textFields[field.name] ?? ""}
          placeholder={ui("substanceDetailsPlaceholder")}
          rows={5}
          maxLength={500}
          className="rounded-2xl text-base leading-relaxed resize-none"
          onChange={(e) => {
            setTextFields((prev) => ({ ...prev, [field.name]: e.target.value }));
            clearFieldError(field.name);
          }}
        />
      );
    }

    if (field.type === "multi-select") {
      return (
        <div className="space-y-2.5">
          {field.options?.map((option) => {
            const value = String(option);
            const selected = (multiSelects[field.name] ?? []).includes(value);
            return (
              <OptionButton
                key={value}
                selected={selected}
                label={optionLabel(value)}
                onClick={() => {
                  toggleMultiSelect(field.name, value, field.maxSelect);
                  clearFieldError(field.name);
                }}
              />
            );
          })}
        </div>
      );
    }

    return null;
  };

  if (!currentField) return null;

  return (
    <div className="flex flex-col pb-28">
      <div className="mb-6">
        <p className="text-sm font-medium text-muted-foreground">
          {ui("questionOf")
            .replace("{current}", String(safeFieldIndex + 1))
            .replace("{total}", String(visibleFields.length))}
        </p>
      </div>

      {visibleFields.length > 1 && (
        <div className="flex gap-1 mb-8">
          {visibleFields.map((field, i) => (
            <div
              key={field.name}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors duration-300",
                i <= safeFieldIndex ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={`${step.id}-${currentField.name}-${safeFieldIndex}`}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="space-y-6"
        >
          <h2 className="text-2xl sm:text-[1.75rem] font-semibold tracking-tight leading-snug text-foreground">
            {fieldLabel(currentField.name, currentField.label)}
            {currentField.required && (
              <span className="text-destructive ml-0.5">*</span>
            )}
          </h2>

          {currentField.type === "multi-select" && currentField.maxSelect && (
            <p className="text-sm text-muted-foreground -mt-2">
              {ui("selectUpTo").replace("{count}", String(currentField.maxSelect))}
            </p>
          )}

          {fieldErrors[currentField.name] && (
            <p className="text-sm text-destructive font-medium -mt-2">
              {translateError(fieldErrors[currentField.name], ui)}
            </p>
          )}

          {renderFieldInput(currentField)}
        </motion.div>
      </AnimatePresence>

      {(showManualNext || (isAdvancing && !showManualNext)) && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/80 bg-background/95 backdrop-blur-md px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto max-w-xl">
            {showManualNext ? (
              <Button
                onClick={goToNextField}
                className="w-full h-12 rounded-2xl text-base font-semibold"
                size="lg"
                disabled={isAdvancing}
              >
                {isAdvancing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {ui("saving")}
                  </>
                ) : isLastField ? (
                  ui("continueFlow")
                ) : (
                  ui("nextQuestion")
                )}
              </Button>
            ) : (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-3">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                {ui("saving")}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
