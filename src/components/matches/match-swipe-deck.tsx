"use client";

import { useEffect, useMemo, useState } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "framer-motion";
import {
  Bookmark,
  Eye,
  Heart,
  MapPin,
  X,
} from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LazyImage } from "@/components/ui/lazy-image";
import { PhotoGalleryLightbox } from "@/components/ui/photo-gallery-lightbox";
import { TrustBadges } from "@/components/profile/trust-badges";
import { ReportBlockMenu } from "@/components/safety/report-block-menu";
import type { MatchResult } from "@/types";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

const SWIPE_THRESHOLD = 96;

interface MatchSwipeDeckProps {
  matches: MatchResult[];
  onView: (match: MatchResult) => void;
  onAction: (
    userId: Id<"users">,
    action: "like" | "pass" | "shortlist"
  ) => Promise<void>;
}

function SwipeCard({
  match,
  onView,
  onAction,
  onDismiss,
}: {
  match: MatchResult;
  onView: () => void;
  onAction: (action: "like" | "pass" | "shortlist") => Promise<void>;
  onDismiss: (direction: "left" | "right") => void;
}) {
  const { t } = useTranslation();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-180, 180], [-12, 12]);
  const likeOpacity = useTransform(x, [40, SWIPE_THRESHOLD], [0, 1]);
  const passOpacity = useTransform(x, [-SWIPE_THRESHOLD, -40], [1, 0]);
  const [busy, setBusy] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const location = [match.city, match.country].filter(Boolean).join(", ");
  const photos = useMemo(
    () =>
      [match.imageUrl, ...(match.additionalImageUrls ?? [])].filter(
        (url): url is string => !!url
      ),
    [match.imageUrl, match.additionalImageUrls]
  );

  const openGallery = (index = 0) => {
    if (!photos.length) return;
    setGalleryIndex(index);
    setGalleryOpen(true);
  };

  const runAction = async (
    action: "like" | "pass" | "shortlist",
    direction?: "left" | "right"
  ) => {
    if (busy || (action === "like" && match.liked)) return;
    setBusy(true);
    try {
      await onAction(action);
      if (direction) {
        onDismiss(direction);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > SWIPE_THRESHOLD) {
      void runAction("like", "right");
      return;
    }
    if (info.offset.x < -SWIPE_THRESHOLD) {
      void runAction("pass", "left");
    }
  };

  return (
    <>
      <motion.div
        className="relative w-full touch-pan-y"
        style={{ x, rotate }}
        drag={busy ? false : "x"}
        dragElastic={0.85}
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        whileTap={{ cursor: "grabbing" }}
      >
        <motion.div
          className="pointer-events-none absolute left-6 top-8 z-10 rounded-xl border-2 border-emerald-500 px-4 py-2 text-emerald-600 font-bold tracking-wide rotate-[-12deg]"
          style={{ opacity: likeOpacity }}
        >
          {t("matchesPage.swipeLike")}
        </motion.div>
        <motion.div
          className="pointer-events-none absolute right-6 top-8 z-10 rounded-xl border-2 border-rose-500 px-4 py-2 text-rose-600 font-bold tracking-wide rotate-[12deg]"
          style={{ opacity: passOpacity }}
        >
          {t("matchesPage.swipePass")}
        </motion.div>

        <Card className="overflow-hidden shadow-xl border-border/80">
          <button
            type="button"
            className="relative block w-full h-[min(52vh,28rem)] bg-gradient-to-br from-accent to-accent/50 dark:from-primary/20 dark:to-primary/10"
            onClick={() => openGallery(0)}
            disabled={!photos.length}
          >
            {match.imageUrl ? (
              <LazyImage
                src={match.imageUrl}
                alt={match.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Avatar className="h-24 w-24">
                  <AvatarFallback className="text-4xl">
                    {match.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/75 to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 text-left text-white">
              <p className="text-2xl font-semibold">
                {match.name}, {match.age}
              </p>
              <p className="text-sm text-white/90 flex items-center gap-1 mt-1">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {location}
              </p>
            </div>
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
            {photos.length > 1 && (
              <div className="absolute bottom-5 right-5 flex gap-1">
                {photos.map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1.5 rounded-full bg-white/50",
                      i === 0 ? "w-4 bg-white" : "w-1.5"
                    )}
                  />
                ))}
              </div>
            )}
          </button>

          {photos.length > 1 && (
            <div className="flex gap-2 px-4 -mt-3 relative z-10 overflow-x-auto pb-1">
              {photos.slice(1).map((url, i) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => openGallery(i + 1)}
                  className="h-14 w-14 shrink-0 rounded-xl overflow-hidden ring-2 ring-card shadow-md"
                >
                  <LazyImage src={url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <CardContent className="p-5 space-y-4">
            <TrustBadges profile={match} size="sm" />
            {match.bio && (
              <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                {match.bio}
              </p>
            )}
            <p className="text-xs text-muted-foreground text-center">
              {photos.length > 0 ? t("gallery.tapToView") : t("matchesPage.swipeHint")}
            </p>
            <div className="flex items-center justify-center gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950/30"
                disabled={busy}
                onClick={() => void runAction("pass", "left")}
                aria-label={t("matchesPage.pass")}
              >
                <X className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-full"
                disabled={busy || match.shortlisted}
                onClick={() => void runAction("shortlist")}
                aria-label={t("matchesPage.shortlist")}
              >
                <Bookmark className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-full"
                disabled={busy}
                onClick={onView}
                aria-label={t("matchesPage.view")}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                className={cn(
                  "h-12 w-12 rounded-full",
                  match.liked && "opacity-60"
                )}
                disabled={busy || match.liked}
                onClick={() => void runAction("like", "right")}
                aria-label={t("matchesPage.like")}
              >
                <Heart className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <PhotoGalleryLightbox
        images={photos}
        initialIndex={galleryIndex}
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        alt={match.name}
      />
    </>
  );
}

export function MatchSwipeDeck({
  matches,
  onView,
  onAction,
}: MatchSwipeDeckProps) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(
    null
  );

  useEffect(() => {
    setIndex(0);
    setExitDirection(null);
  }, [matches]);

  const current = matches[index];

  if (!current) {
    return (
      <Card className="p-10 text-center">
        <Heart className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="font-semibold">{t("matchesPage.swipeDoneTitle")}</p>
        <p className="text-sm text-muted-foreground mt-2">
          {t("matchesPage.swipeDoneDesc")}
        </p>
      </Card>
    );
  }

  const handleDismiss = (direction: "left" | "right") => {
    setExitDirection(direction);
    window.setTimeout(() => {
      setIndex((value) => value + 1);
      setExitDirection(null);
    }, 180);
  };

  return (
    <div className="relative min-h-[36rem] pb-2">
      <motion.div
        key={current.userId}
        initial={{ scale: 0.96, opacity: 0 }}
        animate={
          exitDirection
            ? {
                x: exitDirection === "right" ? 320 : -320,
                opacity: 0,
                rotate: exitDirection === "right" ? 12 : -12,
              }
            : { scale: 1, opacity: 1, x: 0, rotate: 0 }
        }
        transition={{ duration: 0.18 }}
      >
        <SwipeCard
          match={current}
          onView={() => onView(current)}
          onAction={(action) => onAction(current.userId, action)}
          onDismiss={handleDismiss}
        />
      </motion.div>
      <p className="text-center text-xs text-muted-foreground mt-4">
        {t("matchesPage.swipeProgress", {
          current: Math.min(index + 1, matches.length),
          total: matches.length,
        })}
      </p>
    </div>
  );
}
