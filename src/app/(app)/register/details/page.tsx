"use client";

import { useEffect, useState } from "react";
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

const detailsSchema = z.object({
  name: z.string().min(2, "Full name is required"),
  gender: z.enum(["male", "female"], { message: "Please select your gender" }),
  phone: z
    .string()
    .min(8, "Phone number is required")
    .regex(/^[\d\s+\-()]+$/, "Enter a valid phone number"),
});

type DetailsForm = z.infer<typeof detailsSchema>;

export default function RegisterDetailsPage() {
  const router = useRouter();
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

  const onSubmit = async (data: DetailsForm) => {
    setLoading(true);
    try {
      await completeDetails({
        name: data.name,
        gender: data.gender,
        phone: data.phone,
      });
      toast.success("Profile saved! Complete your payment to continue.");
      router.push("/payment?welcome=true");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save details."
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
      title="Your details"
      description="Step 2 — all fields are required before you choose a payment plan"
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Wrong account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <RegisterStepIndicator step={2} />

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

        <FormField label="Phone Number" htmlFor="phone" error={errors.phone?.message} required>
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

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Saving..." : "Continue to Payment"}
        </Button>
      </form>
    </AuthShell>
  );
}
