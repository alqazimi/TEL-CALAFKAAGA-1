"use client";

import { motion } from "framer-motion";
import {
  Heart,
  X,
  Eye,
  MapPin,
  GraduationCap,
  Briefcase,
  Bookmark,
  CalendarHeart,
  Moon,
  Ruler,
} from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LazyImage } from "@/components/ui/lazy-image";
import { TrustBadges } from "@/components/profile/trust-badges";
import { ReportBlockMenu } from "@/components/safety/report-block-menu";
import type { MatchResult } from "@/types";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

interface MatchProfileCardProps {
  match: MatchResult;
  index?: number;
  onView: () => void;
  onAction: (action: "like" | "pass" | "shortlist") => void;
}

function scoreTone(score: number) {
  if (score >= 85) return "bg-primary text-primary-foreground";
  if (score >= 75) return "bg-primary/90 text-primary-foreground";
  return "bg-card text-foreground border border-border";
}

export function MatchProfileCard({
  match,
  index = 0,
  onView,
  onAction,
}: MatchProfileCardProps) {
  const { t } = useTranslation();
  const location = [match.city, match.country].filter(Boolean).join(", ");
  const facts = [
    match.prayerFrequency
      ? { icon: Moon, label: match.prayerFrequency }
      : match.religiousLevel
        ? { icon: Moon, label: match.religiousLevel }
        : null,
    location ? { icon: MapPin, label: location } : null,
    match.height ? { icon: Ruler, label: `${match.height} cm` } : null,
    match.marriageTimeline
      ? { icon: CalendarHeart, label: match.marriageTimeline }
      : null,
    match.education ? { icon: GraduationCap, label: match.education } : null,
    match.occupation ? { icon: Briefcase, label: match.occupation } : null,
  ].filter((f): f is { icon: typeof MapPin; label: string } => f !== null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
    >
      <Card className="overflow-hidden group hover:shadow-xl hover:shadow-primary/8 transition-all duration-300 border-border/80">
        <div className="relative h-72 sm:h-80 lg:h-[22rem] bg-muted">
          {match.imageUrl ? (
            <LazyImage
              src={match.imageUrl}
              alt={match.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary/10 to-gold/10">
              <Avatar className="h-24 w-24 sm:h-28 sm:w-28">
                <AvatarFallback className="text-3xl font-display sm:text-4xl">
                  {(match.name || "?").charAt(0)}
                </AvatarFallback>
              </Avatar>
              {match.photoHidden && (
                <p className="text-xs text-muted-foreground px-4 text-center sm:text-sm">
                  {t("matchesPage.photoPrivate")}
                </p>
              )}
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/75 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 text-white sm:bottom-5 sm:left-5 sm:right-5">
            <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {match.name}, {match.age}
            </h3>
          </div>
          <div className="absolute top-3 right-3">
            <Badge
              className={cn(
                "text-sm font-bold border-0 shadow-lg",
                scoreTone(match.score)
              )}
            >
              {match.score}%
            </Badge>
          </div>
          <div className="absolute top-3 left-3">
            <ReportBlockMenu
              userId={match.userId as Id<"users">}
              userName={match.name}
              compact
            />
          </div>
        </div>

        <CardContent className="p-5 space-y-4 sm:p-6">
          <TrustBadges profile={match} size="sm" />

          <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
            {facts.slice(0, 6).map((fact) => (
              <div
                key={fact.label}
                className="flex items-center gap-2 rounded-xl bg-muted/60 px-2.5 py-2.5 text-xs text-muted-foreground sm:text-sm"
              >
                <fact.icon className="h-3.5 w-3.5 shrink-0 text-primary sm:h-4 sm:w-4" />
                <span className="truncate">{fact.label}</span>
              </div>
            ))}
          </div>

          {match.bio && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {match.bio}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-full shrink-0 border-rose-200 text-rose-600"
              onClick={() => onAction("pass")}
              aria-label={t("matchesPage.pass")}
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={match.shortlisted ? "secondary" : "outline"}
              className="h-11 rounded-full"
              onClick={() => onAction("shortlist")}
              disabled={match.shortlisted}
              aria-label={t("matchesPage.shortlist")}
            >
              <Bookmark className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-11 flex-1 rounded-full"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onView();
              }}
            >
              <Eye className="h-4 w-4 mr-1" />
              {t("matchesPage.view")}
            </Button>
            <Button
              size="sm"
              className="h-11 flex-1 rounded-full"
              onClick={() => onAction("like")}
              disabled={match.liked}
            >
              <Heart className="h-4 w-4 mr-1" />
              {match.liked ? t("matchesPage.liked") : t("matchesPage.like")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
