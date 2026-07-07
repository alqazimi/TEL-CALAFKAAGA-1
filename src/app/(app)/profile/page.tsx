"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Camera, Save, Pencil } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import type { Profile } from "@/types";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileCompletionCard } from "@/components/profile/profile-completion-card";
import type { Preferences } from "@/lib/profile-progress";
import { isStaffRole } from "@/lib/access";
import { useTranslation } from "@/lib/i18n/context";

const profileSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { t } = useTranslation();
  const profile = useQuery(api.profiles.getProfile, {}) as (Profile & { imageUrl?: string | null }) | null | undefined;
  const preferences = useQuery(api.profiles.getPreferences) as Preferences | null | undefined;
  const updateProfile = useMutation(api.profiles.updateProfile);
  const generateUploadUrl = useMutation(api.profiles.generateUploadUrl);
  const registerUpload = useMutation(api.profiles.registerUpload);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: profile
      ? { name: profile.name, phone: profile.phone ?? "" }
      : undefined,
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();
      await registerUpload({ storageId });
      await updateProfile({ profileImageId: storageId });
      toast.success(t("profilePage.photoUpdated"));
    } catch {
      toast.error(t("profilePage.photoFailed"));
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: ProfileForm) => {
    try {
      await updateProfile(data);
      toast.success(t("profilePage.updated"));
    } catch {
      toast.error(t("profilePage.updateFailed"));
    }
  };

  if (profile === undefined) {
    return (
      <DashboardLayout>
        <Skeleton className="h-96 w-full max-w-2xl" />
      </DashboardLayout>
    );
  }

  const isStaff = isStaffRole(profile?.role);

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {profile && !profile.questionnaireComplete && !isStaff && (
          <ProfileCompletionCard profile={profile} preferences={preferences} />
        )}

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile?.imageUrl ?? undefined} />
                  <AvatarFallback className="text-2xl">
                    {profile?.name?.charAt(0) ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
                >
                  <Camera className="h-4 w-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
              <div>
                <h2 className="text-xl font-bold">{profile?.name}</h2>
                <p className="text-muted-foreground capitalize">{profile?.gender}</p>
                <div className="flex gap-2 mt-2">
                  {profile?.verified && (
                    <Badge variant="success">{t("dashboard.verified")}</Badge>
                  )}
                  {profile?.questionnaireComplete && (
                    <Badge variant="secondary">{t("dashboard.profileComplete")}</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("profilePage.editProfile")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <FormField label={t("profilePage.name")} htmlFor="name" error={errors.name?.message} required>
                <Input id="name" {...register("name")} />
              </FormField>
              <FormField label={t("profilePage.phone")} htmlFor="phone" hint={t("profilePage.phoneHint")}>
                <Input id="phone" {...register("phone")} placeholder={t("profilePage.phonePlaceholder")} />
              </FormField>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? t("profilePage.saving") : t("profilePage.saveChanges")}
              </Button>
            </form>
          </CardContent>
        </Card>

        {profile?.questionnaireComplete && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
              <CardTitle>{t("profilePage.profileDetails")}</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/questionnaire?edit=1">
                  <Pencil className="h-4 w-4 mr-2" />
                  {t("profilePage.editDetails")}
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">{t("profilePage.age")}</span><p className="font-medium">{profile.age}</p></div>
              <div><span className="text-muted-foreground">{t("profilePage.height")}</span><p className="font-medium">{profile.height} cm</p></div>
              <div><span className="text-muted-foreground">{t("profilePage.weight")}</span><p className="font-medium">{profile.weight} kg</p></div>
              <div><span className="text-muted-foreground">{t("profilePage.country")}</span><p className="font-medium">{profile.country}</p></div>
              <div><span className="text-muted-foreground">{t("profilePage.city")}</span><p className="font-medium">{profile.city}</p></div>
              <div><span className="text-muted-foreground">{t("profilePage.education")}</span><p className="font-medium">{profile.education}</p></div>
              <div><span className="text-muted-foreground">{t("profilePage.occupation")}</span><p className="font-medium">{profile.occupation}</p></div>
              <div><span className="text-muted-foreground">{t("profilePage.maritalStatus")}</span><p className="font-medium">{profile.maritalStatus}</p></div>
              <div><span className="text-muted-foreground">{t("profilePage.prayerFrequency")}</span><p className="font-medium">{profile.prayerFrequency || "—"}</p></div>
              {profile.loveLanguage && (
                <div><span className="text-muted-foreground">{t("profilePage.loveLanguage")}</span><p className="font-medium">{profile.loveLanguage}</p></div>
              )}
              {profile.gender === "female" && (
                <div><span className="text-muted-foreground">{t("profilePage.wearsHijab")}</span><p className="font-medium">{profile.wearsHijab ? "Yes" : "No"}</p></div>
              )}
              {profile.qualities?.length > 0 && (
                <div className="col-span-2"><span className="text-muted-foreground">{t("profilePage.qualities")}</span><p className="font-medium mt-1">{profile.qualities.join(", ")}</p></div>
              )}
              {profile.hobbies?.length > 0 && (
                <div className="col-span-2"><span className="text-muted-foreground">{t("profilePage.hobbies")}</span><p className="font-medium mt-1">{profile.hobbies.join(", ")}</p></div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
