"use client";

import { motion } from "framer-motion";
import { X, Heart, MapPin, GraduationCap, Briefcase, Bookmark, CalendarHeart, Baby } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LazyImage } from "@/components/ui/lazy-image";
import { ReportBlockMenu } from "@/components/safety/report-block-menu";
import { TrustBadges } from "@/components/profile/trust-badges";
import type { TrustBadgeProfile } from "@/components/profile/trust-badges";
import { Id } from "../../../convex/_generated/dataModel";
import { useTranslation } from "@/lib/i18n/context";

interface MatchProfileModalProps {
  match: {
    userId: Id<"users">;
    name: string;
    age: number;
    country: string;
    city?: string;
    height?: number;
    education: string;
    occupation: string;
    religiousLevel: string;
    prayerFrequency?: string;
    bio?: string;
    maritalStatus?: string;
    marriageTimeline?: string;
    wantChildren?: string;
    imageUrl: string | null;
    score: number;
    shortlisted?: boolean;
    liked?: boolean;
  } & TrustBadgeProfile;
  onClose: () => void;
  onLike: (action: "like" | "pass" | "shortlist") => void;
}

export function MatchProfileModal({ match, onClose, onLike }: MatchProfileModalProps) {
  const { t } = useTranslation();
  const location = [match.city, match.country].filter(Boolean).join(", ");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card text-card-foreground rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-border"
      >
        <div className="relative h-56 bg-gradient-to-br from-accent to-accent/50 dark:from-primary/20 dark:to-primary/10">
          {match.imageUrl ? (
            <LazyImage src={match.imageUrl} alt={match.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-4xl">{match.name.charAt(0)}</AvatarFallback>
              </Avatar>
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="absolute bottom-4 right-4">
            <Badge className="text-lg font-bold bg-primary text-primary-foreground border-0 px-3 py-1">
              {t("matchesPage.matchPercent", { score: match.score })}
            </Badge>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <h2 className="text-2xl font-bold">{match.name}, {match.age}</h2>
            <p className="text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="h-4 w-4" />
              {location}
            </p>
            <TrustBadges profile={match} className="mt-3" />
          </div>

          {match.bio && (
            <div className="rounded-2xl bg-muted/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                {t("matchesPage.about")}
              </p>
              <p className="text-sm leading-relaxed">{match.bio}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            {match.religiousLevel && (
              <div className="rounded-xl bg-muted p-3">
                <p className="text-muted-foreground text-xs font-medium">{t("matchesPage.religion")}</p>
                <p className="font-semibold mt-0.5">{match.religiousLevel}</p>
              </div>
            )}
            {match.maritalStatus && (
              <div className="rounded-xl bg-muted p-3">
                <p className="text-muted-foreground text-xs font-medium">{t("matchesPage.maritalStatus")}</p>
                <p className="font-semibold mt-0.5">{match.maritalStatus}</p>
              </div>
            )}
            {match.marriageTimeline && (
              <div className="rounded-xl bg-muted p-3">
                <p className="text-muted-foreground text-xs font-medium flex items-center gap-1">
                  <CalendarHeart className="h-3.5 w-3.5" />
                  {t("matchesPage.marriageTimeline")}
                </p>
                <p className="font-semibold mt-0.5">{match.marriageTimeline}</p>
              </div>
            )}
            {match.wantChildren && (
              <div className="rounded-xl bg-muted p-3">
                <p className="text-muted-foreground text-xs font-medium flex items-center gap-1">
                  <Baby className="h-3.5 w-3.5" />
                  {t("matchesPage.wantChildren")}
                </p>
                <p className="font-semibold mt-0.5">{match.wantChildren}</p>
              </div>
            )}
            <div className="rounded-xl bg-muted p-3">
              <p className="text-muted-foreground text-xs font-medium">{t("matchesPage.education")}</p>
              <p className="font-semibold flex items-center gap-1 mt-0.5">
                <GraduationCap className="h-3.5 w-3.5" />
                {match.education}
              </p>
            </div>
            <div className="rounded-xl bg-muted p-3">
              <p className="text-muted-foreground text-xs font-medium">{t("matchesPage.occupation")}</p>
              <p className="font-semibold flex items-center gap-1 mt-0.5">
                <Briefcase className="h-3.5 w-3.5" />
                {match.occupation}
              </p>
            </div>
            {match.height && (
              <div className="rounded-xl bg-muted p-3">
                <p className="text-muted-foreground text-xs font-medium">{t("matchesPage.height")}</p>
                <p className="font-semibold mt-0.5">{match.height} cm</p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="font-semibold"
              onClick={() => onLike("shortlist")}
              disabled={match.shortlisted}
            >
              <Bookmark className="h-4 w-4 mr-2" />
              {match.shortlisted ? t("matchesPage.shortlisted") : t("matchesPage.shortlist")}
            </Button>
            <Button className="flex-1 font-semibold" onClick={() => onLike("like")} disabled={match.liked}>
              <Heart className="h-4 w-4 mr-2" />
              {match.liked ? t("matchesPage.liked") : t("matchesPage.like")}
            </Button>
            <Button variant="outline" className="flex-1 font-semibold" onClick={() => onLike("pass")}>
              {t("matchesPage.pass")}
            </Button>
          </div>

          <div className="pt-1">
            <ReportBlockMenu
              userId={match.userId}
              userName={match.name}
              reportContext={t("safety.reportFromMatches", { name: match.name })}
              onDone={onClose}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
