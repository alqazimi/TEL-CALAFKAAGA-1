"use client";

import { useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useMutation } from "convex/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Camera,
  ChevronDown,
  Crown,
  Mail,
  Pencil,
  Save,
  Shield,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import type { CurrentUser, Profile } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneNumberInput } from "@/components/ui/phone-number-input";
import { FormField } from "@/components/ui/form-field";
import { Badge } from "@/components/ui/badge";
import { LazyImage } from "@/components/ui/lazy-image";
import { PhotoGalleryLightbox } from "@/components/ui/photo-gallery-lightbox";
import { TrustBadges } from "@/components/profile/trust-badges";
import { ChangePasswordCard } from "@/components/profile/change-password-card";
import { BlockedUsersCard } from "@/components/safety/blocked-users-card";
import { PremiumSupportCard } from "@/components/premium/premium-support-card";
import { PremiumWaliCard } from "@/components/premium/premium-wali-card";
import { PremiumUpgradeButton } from "@/components/premium/premium-upgrade-button";
import { isOwnerRole, isPremiumMember } from "@/lib/access";
import { MAX_PROFILE_PHOTOS } from "@/lib/constants";
import { isValidContactPhone } from "@/lib/phone";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

const profileSchema = z.object({
  name: z.string().min(2),
  phone: z
    .string()
    .optional()
    .refine((value) => !value || isValidContactPhone(value), "invalid"),
});

type ProfileForm = z.infer<typeof profileSchema>;

function ProfileSection({
  id,
  title,
  description,
  defaultOpen = true,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="border-b border-border last:border-0">
      <button
        type="button"
        id={id}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-muted/40 transition-colors"
        aria-expanded={open}
      >
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && <div className="px-5 pb-5 pt-0 space-y-4">{children}</div>}
    </section>
  );
}

interface ProfileEditScreenProps {
  profile: Profile & { imageUrl?: string | null; additionalImageUrls?: string[] };
  currentUser: CurrentUser;
  isStaff: boolean;
  roleLabel: string;
}

export function ProfileEditScreen({
  profile,
  currentUser,
  isStaff,
  roleLabel,
}: ProfileEditScreenProps) {
  const { t } = useTranslation();
  const updateProfile = useMutation(api.profiles.updateProfile);
  const generateUploadUrl = useMutation(api.profiles.generateUploadUrl);
  const registerUpload = useMutation(api.profiles.registerUpload);
  const addAdditionalPhoto = useMutation(api.profiles.addAdditionalPhoto);
  const removeAdditionalPhoto = useMutation(api.profiles.removeAdditionalPhoto);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const extraInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const isPremium = isPremiumMember(profile);
  const extraUrls = profile.additionalImageUrls ?? [];
  const extraIds = profile.additionalImageIds ?? [];
  const allPhotoUrls = [profile.imageUrl, ...extraUrls].filter(
    (url): url is string => !!url
  );
  const totalPhotos = (profile.profileImageId ? 1 : 0) + extraIds.length;
  const canAddMore = totalPhotos < MAX_PROFILE_PHOTOS;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: { name: profile.name, phone: profile.phone ?? "" },
  });
  const phoneValue = watch("phone") ?? "";

  const openGallery = (index: number) => {
    if (!allPhotoUrls.length) return;
    setGalleryIndex(index);
    setGalleryOpen(true);
  };

  const handlePrimaryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleExtraUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      await addAdditionalPhoto({ storageId: storageId as Id<"_storage"> });
      toast.success(t("premium.photoAdded"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("profilePage.photoFailed"));
    } finally {
      setUploading(false);
      if (extraInputRef.current) extraInputRef.current.value = "";
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

  return (
    <>
      <Card className="overflow-hidden">
        <div className="relative bg-gradient-to-br from-primary/10 via-accent/30 to-transparent px-5 pt-8 pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => openGallery(0)}
                disabled={!profile.imageUrl}
                className="block h-28 w-28 rounded-2xl overflow-hidden ring-4 ring-card shadow-lg disabled:cursor-default"
              >
                {profile.imageUrl ? (
                  <LazyImage
                    src={profile.imageUrl}
                    alt={profile.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-muted flex items-center justify-center text-3xl font-semibold">
                    {profile.name.charAt(0)}
                  </div>
                )}
              </button>
              {!isStaff && (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => void handlePrimaryUpload(e)}
                  />
                </>
              )}
            </div>
            <div className="text-center sm:text-left flex-1 min-w-0">
              <h1 className="text-2xl font-semibold truncate">{profile.name}</h1>
              {isStaff ? (
                <div className="mt-2 space-y-1">
                  {currentUser.email && (
                    <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      {currentUser.email}
                    </p>
                  )}
                  <Badge
                    className={
                      isOwnerRole(profile.role)
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
                        : "bg-primary/10 text-primary"
                    }
                  >
                    {isOwnerRole(profile.role) ? (
                      <Crown className="h-3 w-3 mr-1" />
                    ) : (
                      <Shield className="h-3 w-3 mr-1" />
                    )}
                    {roleLabel}
                  </Badge>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                    <p className="text-muted-foreground capitalize">{profile.gender}</p>
                    <Link
                      href="/register/details?editGender=1"
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      {t("common.edit")}
                    </Link>
                  </div>
                  <TrustBadges profile={profile} className="mt-2 justify-center sm:justify-start" />
                </>
              )}
            </div>
          </div>
          {allPhotoUrls.length > 1 && (
            <div className="flex gap-2 mt-5 overflow-x-auto pb-1">
              {allPhotoUrls.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => openGallery(i)}
                  className="h-14 w-14 shrink-0 rounded-xl overflow-hidden ring-2 ring-border hover:ring-primary/50"
                >
                  <LazyImage src={url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <CardContent className="p-0">
          <ProfileSection
            id="account"
            title={t("profilePage.editProfile")}
            description={t("profilePage.accountSectionDesc")}
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <FormField label={t("profilePage.name")} htmlFor="name" error={errors.name?.message} required>
                <Input id="name" {...register("name")} />
              </FormField>
              <FormField
                label={t("profilePage.phone")}
                htmlFor="phone"
                hint={t("profilePage.phoneHint")}
                error={errors.phone ? t("validation.phoneInvalid") : undefined}
              >
                <PhoneNumberInput
                  value={phoneValue}
                  profileCountry={profile.country}
                  placeholder={t("profilePage.phonePlaceholder")}
                  large={false}
                  onChange={(value) =>
                    setValue("phone", value, { shouldDirty: true, shouldValidate: true })
                  }
                />
              </FormField>
              <Button type="submit" disabled={isSubmitting} size="sm">
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? t("profilePage.saving") : t("profilePage.saveChanges")}
              </Button>
            </form>
          </ProfileSection>

          {!isStaff && profile.questionnaireComplete && (
            <>
              <ProfileSection
                id="photos"
                title={t("premium.photosTitle")}
                description={
                  isPremium
                    ? t("premium.photosDesc", { max: MAX_PROFILE_PHOTOS })
                    : t("premium.photosLockedDesc")
                }
              >
                {isPremium ? (
                  <>
                    <div className="grid grid-cols-4 gap-2">
                      {extraUrls.map((url, index) => (
                        <div key={url} className="relative aspect-square rounded-xl overflow-hidden">
                          <button
                            type="button"
                            className="h-full w-full"
                            onClick={() => openGallery(index + 1)}
                          >
                            <LazyImage src={url} alt="" className="h-full w-full object-cover" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              void removeAdditionalPhoto({ storageId: extraIds[index] }).then(() =>
                                toast.success(t("premium.photoRemoved"))
                              )
                            }
                            className="absolute top-1 right-1 text-[10px] px-1.5 py-0.5 rounded bg-black/50 text-white"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {canAddMore && (
                        <button
                          type="button"
                          onClick={() => extraInputRef.current?.click()}
                          disabled={uploading}
                          className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:border-primary/40 hover:text-primary text-[10px] gap-1"
                        >
                          <Camera className="h-4 w-4" />
                          {t("premium.addPhoto")}
                        </button>
                      )}
                    </div>
                    <input
                      ref={extraInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => void handleExtraUpload(e)}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("premium.photosCount", { count: totalPhotos, max: MAX_PROFILE_PHOTOS })}
                    </p>
                  </>
                ) : (
                  <PremiumUpgradeButton variant="outline" className="w-full" />
                )}
              </ProfileSection>

              <ProfileSection id="premium" title={t("premium.activeTitle")} defaultOpen={!isPremium}>
                <PremiumSupportCard
                  isPremium={isPremium}
                  hasPaid={!!profile.hasPaid}
                  advisorReviewed={profile.advisorReviewed}
                />
              </ProfileSection>

              <ProfileSection id="wali" title={t("premium.waliTitle")} defaultOpen={false}>
                <PremiumWaliCard profile={profile} />
              </ProfileSection>

              <ProfileSection
                id="details"
                title={t("profilePage.profileDetails")}
                description={t("profilePage.detailsSectionDesc")}
                defaultOpen={false}
              >
                <div className="flex justify-end mb-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/questionnaire?edit=1">
                      <Pencil className="h-4 w-4 mr-2" />
                      {t("profilePage.editDetails")}
                    </Link>
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">{t("profilePage.age")}</span><p className="font-medium">{profile.age}</p></div>
                  <div><span className="text-muted-foreground">{t("profilePage.height")}</span><p className="font-medium">{profile.height} cm</p></div>
                  <div><span className="text-muted-foreground">{t("profilePage.country")}</span><p className="font-medium">{profile.country}</p></div>
                  <div><span className="text-muted-foreground">{t("profilePage.city")}</span><p className="font-medium">{profile.city}</p></div>
                  <div><span className="text-muted-foreground">{t("profilePage.education")}</span><p className="font-medium">{profile.education}</p></div>
                  <div><span className="text-muted-foreground">{t("profilePage.occupation")}</span><p className="font-medium">{profile.occupation}</p></div>
                </div>
              </ProfileSection>
            </>
          )}

          <ProfileSection id="security" title={t("profilePage.securitySection")} defaultOpen={false}>
            <ChangePasswordCard embedded />
          </ProfileSection>

          {!isStaff && (
            <ProfileSection id="safety" title={t("profilePage.safetySection")} defaultOpen={false}>
              <BlockedUsersCard embedded />
            </ProfileSection>
          )}
        </CardContent>
      </Card>

      <PhotoGalleryLightbox
        images={allPhotoUrls}
        initialIndex={galleryIndex}
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        alt={profile.name}
      />
    </>
  );
}
