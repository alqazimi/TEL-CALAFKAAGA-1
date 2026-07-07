"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { ChevronRight, Cloud, CloudOff, Loader2 } from "lucide-react";
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
  validateStepFields,
} from "@/lib/questionnaire-form";
import { toast } from "sonner";
import type { Preferences } from "@/lib/profile-progress";
import type { Profile } from "@/types";
import { CITIES } from "@/lib/constants";
import type { StepConfig } from "./steps";

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const skipAutoSaveRef = useRef(true);
  const { register, watch, setValue } = useForm({ defaultValues: { bio: initial.bio } });
  const bio = watch("bio", initial.bio);

  const profileId = profile?._id ?? null;

  // Hydrate form when profile data loads or step changes
  useEffect(() => {
    const state = initFormState(profile, preferences);
    setSelectedCountry(state.selectedCountry);
    setMultiSelects(state.multiSelects);
    setSelects(state.selects);
    setRadios(state.radios);
    setValue("bio", state.bio);
    setFieldErrors({});
    skipAutoSaveRef.current = true;
  }, [profileId, preferences, step.id, setValue]);

  const formState = { radios, selects, multiSelects, bio };

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

  const handleFormSubmit = () => {
    const errors = validateStepFields(step, profile, formState);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast.error("Please answer all required questions before continuing.");
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

  const visibleFields = step.fields.filter((field) =>
    isFieldVisible(field, profile, radios)
  );

  return (
    <Card className="shadow-lg shadow-primary/5">
      <CardHeader className="border-b border-border bg-gradient-to-r from-accent/50 to-transparent">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>{step.title}</CardTitle>
            <CardDescription>{step.description}</CardDescription>
          </div>
          {onAutoSave && (
            <div className="flex items-center gap-1.5 text-xs shrink-0 rounded-full bg-card px-2.5 py-1 border border-border">
              {saveStatus === "saving" && (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  <span className="text-muted-foreground">Saving...</span>
                </>
              )}
              {saveStatus === "saved" && (
                <>
                  <Cloud className="h-3.5 w-3.5 text-primary" />
                  <span className="text-primary">Saved</span>
                </>
              )}
              {saveStatus === "error" && (
                <>
                  <CloudOff className="h-3.5 w-3.5 text-destructive" />
                  <span className="text-destructive">Save failed</span>
                </>
              )}
              {saveStatus === "idle" && (
                <span className="text-muted-foreground">Auto-save on</span>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {visibleFields.map((field) => (
          <div key={field.name} className="space-y-3">
            <Label className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-destructive ml-0.5">*</span>}
            </Label>
            {fieldErrors[field.name] && (
              <p className="text-sm text-destructive">{fieldErrors[field.name]}</p>
            )}

            {field.type === "radio" && (
              <RadioGroup
                value={radios[field.name] ?? ""}
                onValueChange={(v) => {
                  setRadios((prev) => ({ ...prev, [field.name]: v }));
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next[field.name];
                    return next;
                  });
                }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                {field.options?.map((option) => (
                  <label
                    key={String(option)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-all duration-200",
                      radios[field.name] === String(option)
                        ? "border-primary bg-accent text-accent-foreground shadow-sm"
                        : "border-border bg-input hover:border-primary/40 hover:bg-muted/50"
                    )}
                  >
                    <RadioGroupItem value={String(option)} />
                    <span className="text-sm font-medium">{String(option)}</span>
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
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next[field.name];
                    delete next.city;
                    return next;
                  });
                }}
              />
            )}

            {field.type === "country-multi" && (
              <CountryMultiCombobox
                value={multiSelects[field.name] ?? []}
                onChange={(v) => {
                  setMultiSelects((prev) => ({ ...prev, [field.name]: v }));
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next[field.name];
                    return next;
                  });
                }}
              />
            )}

            {field.type === "select" && field.name === "city" && (
              CITIES[selectedCountry]?.length ? (
                <Select
                  value={selects[field.name] ?? ""}
                  onValueChange={(v) => {
                    setSelects((prev) => ({ ...prev, [field.name]: v }));
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next[field.name];
                      return next;
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select city" />
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
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next[field.name];
                      return next;
                    });
                  }}
                  placeholder="Enter your city"
                />
              )
            )}

            {field.type === "select" && field.name !== "city" && (
              <Select
                value={selects[field.name] ?? ""}
                onValueChange={(v) => {
                  setSelects((prev) => ({ ...prev, [field.name]: v }));
                  if (field.name === "country") setSelectedCountry(v);
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next[field.name];
                    return next;
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {(field.options ?? []).map((option) => (
                    <SelectItem key={String(option)} value={String(option)}>
                      {String(option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {field.type === "textarea" && (
              <div>
                <Textarea
                  {...register("bio")}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  maxLength={500}
                  onChange={(e) => {
                    setValue("bio", e.target.value);
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.bio;
                      return next;
                    });
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
                        "flex items-center gap-2 rounded-xl border p-3 cursor-pointer transition-all duration-200 text-sm",
                        selected
                          ? "border-primary bg-accent text-accent-foreground shadow-sm"
                          : "border-border bg-input hover:border-primary/40 hover:bg-muted/50"
                      )}
                    >
                      <Checkbox
                        checked={selected}
                        onCheckedChange={() => {
                          toggleMultiSelect(field.name, String(option), field.maxSelect);
                          setFieldErrors((prev) => {
                            const next = { ...prev };
                            delete next[field.name];
                            return next;
                          });
                        }}
                      />
                      {String(option)}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        <Button onClick={handleFormSubmit} className="w-full sm:w-auto">
          {isLastFormStep
            ? "Review Profile"
            : isLastAboutStep
              ? "Continue to Partner Preferences"
              : "Continue"}
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
