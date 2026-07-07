"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Mail, Lock } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { GuestGate } from "@/components/auth/guest-gate";
import { RegisterStepIndicator } from "@/components/auth/register-step-indicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, InputIconWrapper } from "@/components/ui/form-field";
import { APP_NAME } from "@/lib/constants";
import { getAuthErrorMessage } from "@/lib/auth-errors";

const accountSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type AccountForm = z.infer<typeof accountSchema>;

export default function RegisterPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AccountForm>({
    resolver: zodResolver(accountSchema),
  });

  const onSubmit = async (data: AccountForm) => {
    setLoading(true);
    try {
      await signIn("password", {
        email: data.email,
        password: data.password,
        flow: "signUp",
      });
      toast.success("Account created! Now tell us about yourself.");
      router.push("/register/details");
    } catch (error) {
      toast.error(
        getAuthErrorMessage(error, "Registration failed. Please try again.")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <GuestGate>
      <AuthShell
        title={`Join ${APP_NAME}`}
        description="Step 1 — create your login credentials"
        footer={
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        }
      >
        <RegisterStepIndicator step={1} />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <FormField label="Email" htmlFor="email" error={errors.email?.message} required>
            <InputIconWrapper icon={<Mail className="h-4 w-4" />}>
              <Input
                id="email"
                type="email"
                className="pl-11"
                {...register("email")}
                placeholder="you@email.com"
                autoComplete="email"
              />
            </InputIconWrapper>
          </FormField>

          <FormField
            label="Password"
            htmlFor="password"
            error={errors.password?.message}
            required
          >
            <InputIconWrapper icon={<Lock className="h-4 w-4" />}>
              <Input
                id="password"
                type="password"
                className="pl-11"
                {...register("password")}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
              />
            </InputIconWrapper>
          </FormField>

          <FormField
            label="Confirm Password"
            htmlFor="confirmPassword"
            error={errors.confirmPassword?.message}
            required
          >
            <InputIconWrapper icon={<Lock className="h-4 w-4" />}>
              <Input
                id="confirmPassword"
                type="password"
                className="pl-11"
                {...register("confirmPassword")}
                placeholder="Re-enter your password"
                autoComplete="new-password"
              />
            </InputIconWrapper>
          </FormField>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Creating account..." : "Continue"}
          </Button>
        </form>
      </AuthShell>
    </GuestGate>
  );
}
