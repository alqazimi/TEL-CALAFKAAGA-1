"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvex } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { getAuthenticatedHomeRoute } from "@/lib/routes";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Mail, Lock, User, Phone } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { GuestGate } from "@/components/auth/guest-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, InputIconWrapper } from "@/components/ui/form-field";
import { OptionPills } from "@/components/ui/option-pills";
import { APP_NAME } from "@/lib/constants";
import { getAuthErrorMessage } from "@/lib/auth-errors";

const registerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  gender: z.enum(["male", "female"], { message: "Please select your gender" }),
  phone: z.string().optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

function profileHasExistingProgress(profile: {
  age?: number;
  country?: string;
  questionnaireStep?: number;
  questionnaireComplete?: boolean;
}): boolean {
  return (
    profile.questionnaireComplete === true ||
    (profile.age ?? 0) > 0 ||
    !!profile.country ||
    (profile.questionnaireStep ?? 1) > 1
  );
}

export default function RegisterPage() {
  const { signIn } = useAuthActions();
  const convex = useConvex();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [gender, setGender] = useState<"male" | "female">("male");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { gender: "male" },
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      await signIn("password", {
        email: data.email,
        password: data.password,
        name: data.name,
        gender: data.gender,
        ...(data.phone ? { phone: data.phone } : {}),
        flow: "signUp",
      });
      const user = await convex.query(api.users.currentUser, {});
      const profile = user?.profile;

      if (profile && profileHasExistingProgress(profile)) {
        toast.info("You already have an account. Signed you in.");
        router.push(getAuthenticatedHomeRoute(profile));
        return;
      }

      toast.success("Welcome! Let's complete your profile to find your best matches.");
      router.push("/questionnaire");
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
      description="Create your account to begin your journey"
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormField label="Full Name" htmlFor="name" error={errors.name?.message} required>
          <InputIconWrapper icon={<User className="h-4 w-4" />}>
            <Input
              id="name"
              className="pl-11"
              {...register("name")}
              placeholder="Your full name"
              autoComplete="name"
            />
          </InputIconWrapper>
        </FormField>

        <FormField label="Gender" error={errors.gender?.message} required>
          <OptionPills
            value={gender}
            onChange={(v) => {
              const g = v as "male" | "female";
              setGender(g);
              setValue("gender", g, { shouldValidate: true });
            }}
            options={[
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
            ]}
          />
        </FormField>

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

        <FormField label="Phone" htmlFor="phone" hint="Optional — for account recovery">
          <InputIconWrapper icon={<Phone className="h-4 w-4" />}>
            <Input
              id="phone"
              type="tel"
              className="pl-11"
              {...register("phone")}
              placeholder="+1 234 567 8900"
              autoComplete="tel"
            />
          </InputIconWrapper>
        </FormField>

        <FormField label="Password" htmlFor="password" error={errors.password?.message} required>
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

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Creating account..." : "Create Account"}
        </Button>
      </form>
    </AuthShell>
    </GuestGate>
  );
}
