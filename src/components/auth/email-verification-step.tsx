"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, InputIconWrapper } from "@/components/ui/form-field";
import { createVerifyCodeSchema } from "@/lib/form-schemas";
import { useTranslation } from "@/lib/i18n/context";

type VerifyForm = z.infer<ReturnType<typeof createVerifyCodeSchema>>;

type EmailVerificationStepProps = {
  verifying: boolean;
  onSubmit: (code: string) => Promise<void>;
  onBack?: () => void;
  backLabel?: string;
  onResend?: () => Promise<void>;
  resending?: boolean;
};

export function EmailVerificationStep({
  verifying,
  onSubmit,
  onBack,
  backLabel,
  onResend,
  resending = false,
}: EmailVerificationStepProps) {
  const { t } = useTranslation();
  const verifySchema = useMemo(() => createVerifyCodeSchema(t), [t]);
  const form = useForm<VerifyForm>({
    resolver: zodResolver(verifySchema),
  });

  const handleSubmit = async (data: VerifyForm) => {
    await onSubmit(data.code);
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
      <FormField
        label={t("auth.verifyCode")}
        htmlFor="code"
        error={form.formState.errors.code?.message}
        required
      >
        <InputIconWrapper icon={<KeyRound className="h-4 w-4" />}>
          <Input
            id="code"
            type="text"
            inputMode="numeric"
            className="pl-11 tracking-widest"
            {...form.register("code")}
            placeholder={t("auth.codePlaceholder")}
            autoComplete="one-time-code"
          />
        </InputIconWrapper>
      </FormField>

      <Button type="submit" className="w-full font-semibold" size="lg" disabled={verifying}>
        {verifying ? t("auth.verifying") : t("auth.verifyAndContinue")}
      </Button>

      {onResend && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={resending || verifying}
          onClick={() => void onResend()}
        >
          {resending ? t("auth.resendingVerify") : t("auth.resendVerifyCode")}
        </Button>
      )}

      {onBack && (
        <Button type="button" variant="ghost" className="w-full" onClick={onBack}>
          {backLabel ?? t("auth.backToSignIn")}
        </Button>
      )}
    </form>
  );
}
