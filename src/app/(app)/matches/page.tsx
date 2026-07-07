"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Heart,
  X,
  Eye,
  MapPin,
  GraduationCap,
  Briefcase,
  Filter,
} from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { LazyImage } from "@/components/ui/lazy-image";
import { MatchFilters } from "@/components/matches/match-filters";
import { MatchProfileModal } from "@/components/matches/match-profile-modal";
import { ProfileLockedGate } from "@/components/profile/profile-locked-gate";
import { PendingApprovalCard } from "@/components/profile/pending-approval-card";
import { PaymentGate } from "@/components/payment/payment-gate";
import type { MatchResult, Profile } from "@/types";
import type { Preferences } from "@/lib/profile-progress";
import { hasPaidAccess } from "@/lib/access";
import { useTranslation } from "@/lib/i18n/context";

export default function MatchesPage() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);

  const profile = useQuery(api.profiles.getProfile, {}) as Profile | null | undefined;
  const preferences = useQuery(api.profiles.getPreferences) as Preferences | null | undefined;

  const matches = useQuery(
    api.matches.getMatches,
    profile?.questionnaireComplete && profile.approved
      ? {
          country: filters.country || undefined,
          minAge: filters.minAge ? parseInt(filters.minAge) : undefined,
          maxAge: filters.maxAge ? parseInt(filters.maxAge) : undefined,
          minHeight: filters.minHeight ? parseInt(filters.minHeight) : undefined,
          maxHeight: filters.maxHeight ? parseInt(filters.maxHeight) : undefined,
          religiousLevel: filters.religiousLevel || undefined,
          education: filters.education || undefined,
          occupation: filters.occupation || undefined,
          children:
            filters.children !== undefined && filters.children !== ""
              ? parseInt(filters.children)
              : undefined,
        }
      : "skip"
  ) as MatchResult[] | undefined;

  const likeUser = useMutation(api.matches.likeUser);

  const handleLike = async (userId: Id<"users">, action: "like" | "pass") => {
    try {
      const result = await likeUser({ toUserId: userId, action });
      if (result.matched) {
        toast.success(t("matchesPage.matchedToast"));
      } else if (action === "like") {
        toast.success(t("matchesPage.likedToast"));
      }
    } catch {
      toast.error(t("matchesPage.errorToast"));
    }
  };

  if (profile === undefined) {
    return (
      <DashboardLayout>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  if (profile && !hasPaidAccess(profile)) {
    return (
      <DashboardLayout>
        <PaymentGate />
      </DashboardLayout>
    );
  }

  if (profile && !profile.questionnaireComplete) {
    return (
      <DashboardLayout>
        <ProfileLockedGate profile={profile} preferences={preferences} />
      </DashboardLayout>
    );
  }

  if (profile && !profile.approved) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <PendingApprovalCard />
        </div>
      </DashboardLayout>
    );
  }

  if (matches === undefined) {
    return (
      <DashboardLayout>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  const matchLabel = matches.length === 1 ? t("matchesPage.match") : t("matchesPage.matches");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {t("matchesPage.compatible", { count: matches.length, label: matchLabel })}
          </p>
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" />
            {t("matchesPage.filters")}
          </Button>
        </div>

        {showFilters && <MatchFilters filters={filters} onChange={setFilters} />}

        {matches.length === 0 ? (
          <Card className="p-12 text-center">
            <Heart className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2">{t("matchesPage.noMatchesTitle")}</h3>
            <p className="text-muted-foreground">{t("matchesPage.noMatchesDesc")}</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((match, i) => (
              <motion.div
                key={match.userId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="overflow-hidden group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300">
                  <div className="relative h-48 bg-gradient-to-br from-accent to-accent/50 dark:from-primary/20 dark:to-primary/10">
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
                  </div>

                  <CardContent className="p-5 space-y-3">
                    <div>
                      <h3 className="text-lg font-bold">
                        {match.name}, {match.age}
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {match.country}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {match.religiousLevel && (
                        <Badge variant="outline" className="text-xs">
                          {match.religiousLevel}
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
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setSelectedMatch(match)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {t("matchesPage.view")}
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleLike(match.userId, "like")}
                        disabled={match.liked}
                      >
                        <Heart className="h-4 w-4 mr-1" />
                        {match.liked ? t("matchesPage.liked") : t("matchesPage.like")}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLike(match.userId, "pass")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {selectedMatch && (
        <MatchProfileModal
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
          onLike={(action) => {
            handleLike(selectedMatch.userId, action);
            setSelectedMatch(null);
          }}
        />
      )}
    </DashboardLayout>
  );
}
