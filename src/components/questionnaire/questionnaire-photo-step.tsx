"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { Camera, ChevronRight, Loader2, User } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Profile } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
    <Card className="shadow-lg shadow-primary/5">
      <CardHeader className="border-b border-border bg-gradient-to-r from-accent/50 to-transparent">
        <CardTitle className="text-xl sm:text-2xl font-bold">{ui("photoTitle")}</CardTitle>
        <CardDescription className="text-sm sm:text-base mt-1">
          {ui("photoStepDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8 py-8">
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <Avatar className="h-36 w-36 sm:h-44 sm:w-44 border-4 border-background shadow-xl">
              <AvatarImage src={previewUrl ?? undefined} alt={profile.name} />
              <AvatarFallback className="text-4xl bg-muted">
                <User className="h-16 w-16 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
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

          <p className="mt-6 text-base font-bold text-foreground">
            {ui("uploadYourPhoto")}
          </p>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm leading-relaxed">
            {ui("photoHelp")}
          </p>

          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? ui("uploading") : hasPhoto ? ui("changePhoto") : ui("choosePhoto")}
          </Button>
        </div>

        <Button
          onClick={handleContinue}
          className="w-full sm:w-auto text-base font-semibold"
          size="lg"
          disabled={uploading}
        >
          {ui("submitAndReview")}
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
