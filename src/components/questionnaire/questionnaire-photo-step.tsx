"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { Camera, Loader2, User } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Profile } from "@/types";
import { Button } from "@/components/ui/button";
import { ProfilePhotoPreview } from "@/components/profile/profile-photo-preview";
import { useQuestionnaireI18n } from "@/lib/i18n/questionnaire-i18n";

interface QuestionnairePhotoStepProps {
  profile: Profile & { imageUrl?: string | null };
  onSubmit: () => void;
}

export function QuestionnairePhotoStep({ profile, onSubmit }: QuestionnairePhotoStepProps) {
  const { ui } = useQuestionnaireI18n();
  const generateUploadUrl = useMutation(api.profiles.generateUploadUrl);
  const registerUpload = useMutation(api.profiles.registerUpload);
  const updateProfile = useMutation(api.profiles.updateProfile);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(profile.imageUrl ?? null);
  const hasPhoto = !!profile.profileImageId || !!previewUrl;
  const displayUrl = previewUrl ?? profile.imageUrl ?? null;

  useEffect(() => {
    if (profile.imageUrl) {
      setPreviewUrl(profile.imageUrl);
    }
  }, [profile.imageUrl, profile.profileImageId]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(ui("chooseImageError"));
      return;
    }

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
      setPreviewUrl(URL.createObjectURL(file));
      toast.success(ui("photoUploaded"));
    } catch {
      toast.error(ui("uploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  const handleContinue = () => {
    if (!hasPhoto) {
      toast.error(ui("photoRequiredContinue"));
      return;
    }
    onSubmit();
  };

  return (
    <div className="flex flex-col items-center text-center pb-28">
      <h2 className="text-[1.625rem] sm:text-3xl font-semibold tracking-tight leading-snug mb-3 w-full text-left">
        {ui("photoTitle")}
      </h2>
      <p className="text-base text-muted-foreground mb-10 w-full text-left leading-relaxed">
        {ui("photoStepDesc")}
      </p>

      <div className="relative mb-8">
        <div className="h-40 w-40 sm:h-48 sm:w-48 rounded-full overflow-hidden border-4 border-background shadow-xl ring-2 ring-border">
          {displayUrl || profile.profileImageId ? (
            <ProfilePhotoPreview
              imageUrl={displayUrl}
              hasStoredPhoto={!!profile.profileImageId}
              alt={profile.name}
              fallbackInitial={profile.name}
              className="h-full w-full rounded-full"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <User className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute -bottom-1 -right-1 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
          aria-label={ui("uploadPhotoAria")}
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Camera className="h-5 w-5" />
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>

      <p className="text-lg font-medium text-foreground mb-2">{ui("uploadYourPhoto")}</p>
      <p className="text-base text-muted-foreground max-w-sm leading-relaxed mb-6">
        {ui("photoHelp")}
      </p>

      <Button
        type="button"
        variant="outline"
        className="rounded-2xl h-11 px-6"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? ui("uploading") : hasPhoto ? ui("changePhoto") : ui("choosePhoto")}
      </Button>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/80 bg-background/95 backdrop-blur-md px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-xl">
          <Button
            onClick={handleContinue}
            className="w-full h-14 min-h-14 rounded-2xl text-lg font-semibold"
            size="lg"
            disabled={uploading}
          >
            {ui("submitAndReview")}
          </Button>
        </div>
      </div>
    </div>
  );
}
