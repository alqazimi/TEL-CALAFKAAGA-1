"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Heart,
  MapPin,
  GraduationCap,
  Briefcase,
  Bookmark,
  CalendarHeart,
  Baby,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LazyImage } from "@/components/ui/lazy-image";
import { MatchViewErrorBoundary } from "@/components/matches/match-view-error-boundary";
import { useTranslation } from "@/lib/i18n/context";

type MatchLike = {
  userId: string;
  name?: string | null;
  age?: number | null;
  country?: string | null;
  city?: string | null;
  height?: number | null;
  education?: string | null;
  occupation?: string | null;
  religiousLevel?: string | null;
  bio?: string | null;
  maritalStatus?: string | null;
  marriageTimeline?: string | null;
  wantChildren?: string | null;
  imageUrl?: string | null;
  photoHidden?: boolean;
  score?: number | null;
  shortlisted?: boolean;
  liked?: boolean;
};

interface MatchProfileModalProps {
  match: MatchLike;
  isPremium: boolean;
  onClose: () => void;
  onLike: (action: "like" | "pass" | "shortlist") => void;
}

function text(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (value == null) return fallback;
  return String(value);
}

/**
 * Minimal, crash-resistant profile view.
 * Intentionally avoids CompatibilityBreakdown / ReportBlock / wali hooks
 * that previously took down the matches page on open.
 */
export function MatchProfileModal({
  match,
  onClose,
  onLike,
}: MatchProfileModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return createPortal(
    <MatchViewErrorBoundary onClose={onClose} title="Could not open this profile">
      <MatchProfileModalBody match={match} onClose={onClose} onLike={onLike} />
    </MatchViewErrorBoundary>,
    document.body
  );
}

function MatchProfileModalBody({
  match,
  onClose,
  onLike,
}: Omit<MatchProfileModalProps, "isPremium">) {
  const { t } = useTranslation();
  const name = text(match.name, "Member");
  const age = typeof match.age === "number" ? match.age : null;
  const score = typeof match.score === "number" ? match.score : 0;
  const location = [text(match.city), text(match.country)].filter(Boolean).join(", ");
  const imageUrl =
    typeof match.imageUrl === "string" && match.imageUrl.length > 0
      ? match.imageUrl
      : null;
  const education = text(match.education);
  const occupation = text(match.occupation);
  const religiousLevel = text(match.religiousLevel);
  const maritalStatus = text(match.maritalStatus);
  const marriageTimeline = text(match.marriageTimeline);
  const wantChildren = text(match.wantChildren);
  const bio = text(match.bio);

  return (
    <div
      data-view-modal="minimal-v15"
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={name}
    >
      <div className="bg-card text-card-foreground rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-border">
        <div className="relative h-72 sm:h-80 bg-gradient-to-br from-accent to-accent/50">
          {imageUrl ? (
            <LazyImage
              src={imageUrl}
              alt={name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-4xl">
                  {name.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              {match.photoHidden ? (
                <p className="text-xs text-muted-foreground px-6 text-center">
                  {t("matchesPage.photoPrivate")}
                </p>
              ) : null}
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50"
            aria-label={t("common.a11yClose")}
          >
            <X className="h-4 w-4" />
          </button>
          <div className="absolute bottom-4 right-4">
            <Badge className="text-lg font-bold bg-primary text-primary-foreground border-0 px-3 py-1">
              {t("matchesPage.matchPercent", { score })}
            </Badge>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <h2 className="text-2xl font-bold">
              {name}
              {age != null ? `, ${age}` : ""}
            </h2>
            {location ? (
              <p className="text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-4 w-4" />
                {location}
              </p>
            ) : null}
          </div>

          {bio ? (
            <div className="rounded-2xl bg-muted/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                {t("matchesPage.about")}
              </p>
              <p className="text-sm leading-relaxed">{bio}</p>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3 text-sm">
            {religiousLevel ? (
              <Fact label={t("matchesPage.religion")} value={religiousLevel} />
            ) : null}
            {maritalStatus ? (
              <Fact
                label={t("matchesPage.maritalStatus")}
                value={maritalStatus}
              />
            ) : null}
            {marriageTimeline ? (
              <Fact
                label={t("matchesPage.marriageTimeline")}
                value={marriageTimeline}
                icon={<CalendarHeart className="h-3.5 w-3.5" />}
              />
            ) : null}
            {wantChildren ? (
              <Fact
                label={t("matchesPage.wantChildren")}
                value={wantChildren}
                icon={<Baby className="h-3.5 w-3.5" />}
              />
            ) : null}
            {education ? (
              <Fact
                label={t("matchesPage.education")}
                value={education}
                icon={<GraduationCap className="h-3.5 w-3.5" />}
              />
            ) : null}
            {occupation ? (
              <Fact
                label={t("matchesPage.occupation")}
                value={occupation}
                icon={<Briefcase className="h-3.5 w-3.5" />}
              />
            ) : null}
            {typeof match.height === "number" && match.height > 0 ? (
              <Fact
                label={t("matchesPage.height")}
                value={`${match.height} cm`}
              />
            ) : null}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="font-semibold"
              onClick={() => onLike("shortlist")}
              disabled={!!match.shortlisted}
            >
              <Bookmark className="h-4 w-4 mr-2" />
              {match.shortlisted
                ? t("matchesPage.shortlisted")
                : t("matchesPage.shortlist")}
            </Button>
            <Button
              type="button"
              className="flex-1 font-semibold"
              onClick={() => onLike("like")}
              disabled={!!match.liked}
            >
              <Heart className="h-4 w-4 mr-2" />
              {match.liked ? t("matchesPage.liked") : t("matchesPage.like")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 font-semibold"
              onClick={() => onLike("pass")}
            >
              {t("matchesPage.pass")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Fact({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-xl bg-muted p-3">
      <p className="text-muted-foreground text-xs font-medium flex items-center gap-1">
        {icon}
        {label}
      </p>
      <p className="font-semibold mt-0.5 flex items-center gap-1">{value}</p>
    </div>
  );
}
