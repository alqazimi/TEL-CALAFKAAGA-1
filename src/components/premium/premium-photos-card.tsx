"use client";

import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { Camera, X } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import type { Profile } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LazyImage } from "@/components/ui/lazy-image";
import { MAX_PROFILE_PHOTOS } from "@/lib/constants";
import { isPremiumMember } from "@/lib/access";
import { useTranslation } from "@/lib/i18n/context";
import { PremiumUpgradeButton } from "@/components/premium/premium-upgrade-button";

interface PremiumPhotosCardProps {
  profile: Profile & {
    imageUrl?: string | null;
    additionalImageUrls?: string[];
  };
}

export function PremiumPhotosCard({ profile }: PremiumPhotosCardProps) {
  const { t } = useTranslation();
  const generateUploadUrl = useMutation(api.profiles.generateUploadUrl);
  const registerUpload = useMutation(api.profiles.registerUpload);
  const addAdditionalPhoto = useMutation(api.profiles.addAdditionalPhoto);
  const removeAdditionalPhoto = useMutation(api.profiles.removeAdditionalPhoto);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const isPremium = isPremiumMember(profile);
  const extraUrls = profile.additionalImageUrls ?? [];
  const extraIds = profile.additionalImageIds ?? [];
  const totalPhotos = (profile.profileImageId ? 1 : 0) + extraIds.length;
  const canAddMore = totalPhotos < MAX_PROFILE_PHOTOS;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      toast.error(
        error instanceof Error ? error.message : t("profilePage.photoFailed")
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = async (storageId: Id<"_storage">) => {
    try {
      await removeAdditionalPhoto({ storageId });
      toast.success(t("premium.photoRemoved"));
    } catch {
      toast.error(t("premium.photoRemoveFailed"));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("premium.photosTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isPremium
            ? t("premium.photosDesc", { max: MAX_PROFILE_PHOTOS })
            : t("premium.photosLockedDesc")}
        </p>

        {isPremium ? (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {extraUrls.map((url, index) => (
                <div key={url} className="relative aspect-square rounded-xl overflow-hidden bg-muted">
                  <LazyImage src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => void handleRemove(extraIds[index])}
                    className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white"
                    aria-label={t("common.a11yClose")}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {canAddMore && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                >
                  <Camera className="h-5 w-5" />
                  <span className="text-[10px] font-medium">{t("premium.addPhoto")}</span>
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void handleUpload(e)}
            />
            <p className="text-xs text-muted-foreground">
              {t("premium.photosCount", { count: totalPhotos, max: MAX_PROFILE_PHOTOS })}
            </p>
          </>
        ) : (
          <PremiumUpgradeButton variant="outline" className="w-full" />
        )}
      </CardContent>
    </Card>
  );
}
