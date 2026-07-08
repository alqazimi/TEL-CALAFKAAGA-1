"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { useMutation, useQuery } from "convex/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { User, Phone } from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterStepIndicator } from "@/components/auth/register-step-indicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, InputIconWrapper } from "@/components/ui/form-field";
import { OptionPills } from "@/components/ui/option-pills";
import { Skeleton } from "@/components/ui/skeleton";
import { getAuthenticatedHomeRoute } from "@/lib/routes";
import { createDetailsSchema } from "@/lib/form-schemas";
import { useTranslation } from "@/lib/i18n/context";

type DetailsForm = z.infer<ReturnType<typeof createDetailsSchema>>;

export default function RegisterDetailsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const detailsSchema = useMemo(() => createDetailsSchema(t), [t]);
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const user = useQuery(api.users.currentUser);
  const completeDetails = useMutation(api.profiles.completeRegistrationDetails);
  const [loading, setLoading] = useState(false);
  const [gender, setGender] = useState<"male" | "female">("male");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DetailsForm>({
    resolver: zodResolver(detailsSchema),
    defaultValues: { gender: "male" },
  });

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace("/register");
      return;
    }
    if (user?.profile?.registrationComplete !== false) {
      router.replace(getAuthenticatedHomeRoute(user?.profile ?? undefined));
    }
  }, [authLoading, isAuthenticated, user?.profile, router]);

  useEffect(() => {
    const profile = user?.profile;
    if (!profile) return;

    if (profile.name && profile.name !== "User") {
      setValue("name", profile.name);
    }
    if (profile.phone) {
      setValue("phone", profile.phone);
    }
    if (profile.gender === "male" || profile.gender === "female") {
      setGender(profile.gender);
      setValue("gender", profile.gender);
    }
  }, [user?.profile, setValue]);

  const onSubmit = async (data: DetailsForm) => {
    setLoading(true);
    try {
      await completeDetails({
        name: data.name,
        gender: data.gender,
        phone: data.phone,
      });
      toast.success(t("auth.registerDetailsSuccess"));
      router.push("/questionnaire?welcome=true");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("validation.saveDetailsFailed")
      );
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || user === undefined || !isAuthenticated) {
    return (
      <div className="auth-bg flex min-h-[calc(100dvh-var(--app-header))] items-center justify-center px-4">
        <Skeleton className="h-72 w-full max-w-md rounded-2xl" />
      </div>
    );
  }

  if (user?.profile?.registrationComplete !== false) {
    return (
      <div className="auth-bg flex min-h-[calc(100dvh-var(--app-header))] items-center justify-center px-4">
        <Skeleton className="h-72 w-full max-w-md rounded-2xl" />
      </div>
    );
  }

  return (
    <AuthShell
      title={t("auth.registerStep2Title")}
      description={t("auth.registerStep2Desc")}
      footer={
        <p className="text-center text-sm text-muted-foreground">
          {t("auth.wrongAccount")}{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            {t("auth.signInLink")}
          </Link>
        </p>
      }
    >
      <RegisterStepIndicator step={2} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormField label={t("auth.fullName")} htmlFor="name" error={errors.name?.message} required>
          <InputIconWrapper icon={<User className="h-4 w-4" />}>
            <Input
              id="name"
              className="pl-11"
              {...register("name")}
              placeholder={t("auth.namePlaceholder")}
              autoComplete="name"
            />
          </InputIconWrapper>
        </FormField>

        <FormField label={t("auth.gender")} error={errors.gender?.message} required>
          <OptionPills
            value={gender}
            onChange={(v) => {
              const g = v as "male" | "female";
              setGender(g);
              setValue("gender", g, { shouldValidate: true });
            }}
            options={[
              { value: "male", label: t("auth.male") },
              { value: "female", label: t("auth.female") },
            ]}
          />
        </FormField>

        <FormField label={t("auth.phoneNumber")} htmlFor="phone" error={errors.phone?.message} required>
          <InputIconWrapper icon={<Phone className="h-4 w-4" />}>
            <Input
              id="phone"
              type="tel"
              className="pl-11"
              {...register("phone")}
              placeholder={t("auth.phonePlaceholder")}
              autoComplete="tel"
            />
          </InputIconWrapper>
        </FormField>

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? t("auth.savingDetails") : t("auth.continueToPayment")}
        </Button>
      </form>
    </AuthShell>
  );
}
