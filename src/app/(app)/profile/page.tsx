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
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileCompletionCard } from "@/components/profile/profile-completion-card";
import type { Preferences } from "@/lib/profile-progress";
import { isStaffRole } from "@/lib/access";

const profileSchema = z.object({
  name: z.string().min(2),
  bio: z.string().max(500),
  phone: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfilePage() {
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
      ? { name: profile.name, bio: profile.bio, phone: profile.phone ?? "" }
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
      toast.success("Profile photo updated!");
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: ProfileForm) => {
    try {
      await updateProfile(data);
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile");
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
                <h2 className="text-xl font-semibold">{profile?.name}</h2>
                <p className="text-gray-500 capitalize">{profile?.gender}</p>
                <div className="flex gap-2 mt-2">
                  {profile?.verified && <Badge variant="success">Verified</Badge>}
                  {profile?.questionnaireComplete && (
                    <Badge variant="secondary">Profile Complete</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <FormField label="Name" htmlFor="name" error={errors.name?.message} required>
                <Input id="name" {...register("name")} />
              </FormField>
              <FormField label="Phone" htmlFor="phone" hint="Optional">
                <Input id="phone" {...register("phone")} placeholder="Your phone number" />
              </FormField>
              <FormField label="Bio" htmlFor="bio" error={errors.bio?.message} hint="Max 500 characters">
                <Textarea id="bio" {...register("bio")} rows={4} />
              </FormField>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {profile?.questionnaireComplete && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
              <CardTitle>Profile Details</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/questionnaire?edit=1">
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Details
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Age</span><p className="font-medium">{profile.age}</p></div>
              <div><span className="text-muted-foreground">Height</span><p className="font-medium">{profile.height} cm</p></div>
              <div><span className="text-muted-foreground">Weight</span><p className="font-medium">{profile.weight} kg</p></div>
              <div><span className="text-muted-foreground">Country</span><p className="font-medium">{profile.country}</p></div>
              <div><span className="text-muted-foreground">City</span><p className="font-medium">{profile.city}</p></div>
              <div><span className="text-muted-foreground">Education</span><p className="font-medium">{profile.education}</p></div>
              <div><span className="text-muted-foreground">Occupation</span><p className="font-medium">{profile.occupation}</p></div>
              <div><span className="text-muted-foreground">Marital Status</span><p className="font-medium">{profile.maritalStatus}</p></div>
              <div><span className="text-muted-foreground">Prayer Frequency</span><p className="font-medium">{profile.prayerFrequency || "—"}</p></div>
              {profile.gender === "female" && (
                <div><span className="text-muted-foreground">Wears Hijab</span><p className="font-medium">{profile.wearsHijab ? "Yes" : "No"}</p></div>
              )}
              <div className="col-span-2"><span className="text-muted-foreground">Bio</span><p className="font-medium mt-1">{profile.bio || "—"}</p></div>
              {profile.qualities?.length > 0 && (
                <div className="col-span-2"><span className="text-muted-foreground">Qualities</span><p className="font-medium mt-1">{profile.qualities.join(", ")}</p></div>
              )}
              {profile.hobbies?.length > 0 && (
                <div className="col-span-2"><span className="text-muted-foreground">Hobbies</span><p className="font-medium mt-1">{profile.hobbies.join(", ")}</p></div>
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </DashboardLayout>
  );
}
