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

interface MatchProfileCardProps {
  match: MatchResult;
  index?: number;
  onView: () => void;
  onAction: (action: "like" | "pass" | "shortlist") => void;
}

export function MatchProfileCard({
  match,
  index = 0,
  onView,
  onAction,
}: MatchProfileCardProps) {
  const { t } = useTranslation();
  const location = [match.city, match.country].filter(Boolean).join(", ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="overflow-hidden group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300">
        <div className="relative h-52 bg-gradient-to-br from-accent to-accent/50 dark:from-primary/20 dark:to-primary/10">
          {match.imageUrl ? (
            <LazyImage
              src={match.imageUrl}
              alt={match.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="text-3xl">
                  {match.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
          )}
          <div className="absolute top-3 right-3">
            <Badge className="text-sm font-bold bg-primary text-primary-foreground border-0 shadow-lg">
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

        <CardContent className="p-5 space-y-3">
          <div>
            <h3 className="text-lg font-bold">
              {match.name}, {match.age}
            </h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {location}
            </p>
            <TrustBadges profile={match} size="sm" className="mt-2" />
          </div>

          {match.bio && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {match.bio}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {match.religiousLevel && (
              <Badge variant="outline" className="text-xs">
                {match.religiousLevel}
              </Badge>
            )}
            {match.marriageTimeline && (
              <Badge variant="outline" className="text-xs">
                <CalendarHeart className="h-3 w-3 mr-1" />
                {match.marriageTimeline}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              <GraduationCap className="h-3 w-3 mr-1" />
              {match.education}
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Briefcase className="h-3 w-3 mr-1" />
              {match.occupation}
            </Badge>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={onView}>
              <Eye className="h-4 w-4 mr-1" />
              {t("matchesPage.view")}
            </Button>
            <Button
              size="sm"
              variant={match.shortlisted ? "secondary" : "outline"}
              onClick={() => onAction("shortlist")}
              disabled={match.shortlisted}
              aria-label={t("matchesPage.shortlist")}
            >
              <Bookmark className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={() => onAction("like")}
              disabled={match.liked}
            >
              <Heart className="h-4 w-4 mr-1" />
              {match.liked ? t("matchesPage.liked") : t("matchesPage.like")}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onAction("pass")}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
