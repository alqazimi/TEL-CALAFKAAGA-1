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
import { MatchFilters } from "@/components/matches/match-filters";
import { MatchProfileModal } from "@/components/matches/match-profile-modal";
import { ProfileLockedGate } from "@/components/profile/profile-locked-gate";
import { PaymentGate } from "@/components/payment/payment-gate";
import type { MatchResult, Profile } from "@/types";
import type { Preferences } from "@/lib/profile-progress";

export default function MatchesPage() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);

  const profile = useQuery(api.profiles.getProfile, {}) as Profile | null | undefined;
  const preferences = useQuery(api.profiles.getPreferences) as Preferences | null | undefined;

  const matches = useQuery(
    api.matches.getMatches,
    profile?.questionnaireComplete
      ? {
          country: filters.country || undefined,
          minAge: filters.minAge ? parseInt(filters.minAge) : undefined,
          maxAge: filters.maxAge ? parseInt(filters.maxAge) : undefined,
          minHeight: filters.minHeight ? parseInt(filters.minHeight) : undefined,
          maxHeight: filters.maxHeight ? parseInt(filters.maxHeight) : undefined,
          religiousLevel: filters.religiousLevel || undefined,
          education: filters.education || undefined,
          occupation: filters.occupation || undefined,
          children: filters.children !== undefined && filters.children !== "" ? parseInt(filters.children) : undefined,
        }
      : "skip"
  ) as MatchResult[] | undefined;

  const likeUser = useMutation(api.matches.likeUser);

  const handleLike = async (userId: Id<"users">, action: "like" | "pass") => {
    try {
      const result = await likeUser({ toUserId: userId, action });
      if (result.matched) {
        toast.success("It's a match! You can now chat.");
      } else if (action === "like") {
        toast.success("Profile liked!");
      }
    } catch {
      toast.error("Something went wrong");
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

  if (profile && !profile.hasPaid) {
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {matches.length} compatible {matches.length === 1 ? "match" : "matches"}
          </p>
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {showFilters && (
          <MatchFilters filters={filters} onChange={setFilters} />
        )}

        {matches.length === 0 ? (
          <Card className="p-12 text-center">
            <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No matches yet</h3>
            <p className="text-muted-foreground">
              No compatible matches above 70% yet. Check back soon or adjust your preferences in the questionnaire.
            </p>
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
                <Card className="overflow-hidden group hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300">
                  <div className="relative h-48 bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-950 dark:to-emerald-900">
                    {match.imageUrl ? (
                      <img
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
                      <Badge className="text-sm font-bold bg-emerald-500 text-white border-0 shadow-lg">
                        {match.score}%
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-5 space-y-3">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {match.name}, {match.age}
                      </h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {match.country}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">
                        {match.religiousLevel}
                      </Badge>
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
                        View
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleLike(match.userId, "like")}
                        disabled={match.liked}
                      >
                        <Heart className="h-4 w-4 mr-1" />
                        {match.liked ? "Liked" : "Like"}
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
