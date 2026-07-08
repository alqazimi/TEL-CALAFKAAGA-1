import type { QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { effectiveReligiousLevel } from "./profileEnrichment";

export type MatchFilterArgs = {
  country?: string;
  city?: string;
  minAge?: number;
  maxAge?: number;
  minHeight?: number;
  maxHeight?: number;
  religiousLevel?: string;
  education?: string;
  occupation?: string;
  children?: number;
  maritalStatus?: string;
  marriageTimeline?: string;
};

export function profilePassesMatchFilters(
  profile: Doc<"profiles">,
  args: MatchFilterArgs
) {
  if (args.country && profile.country !== args.country) return false;
  if (args.city && !profile.city.toLowerCase().includes(args.city.toLowerCase())) {
    return false;
  }
  if (args.minAge && profile.age < args.minAge) return false;
  if (args.maxAge && profile.age > args.maxAge) return false;
  if (args.minHeight && profile.height < args.minHeight) return false;
  if (args.maxHeight && profile.height > args.maxHeight) return false;
  if (args.religiousLevel && effectiveReligiousLevel(profile) !== args.religiousLevel) {
    return false;
  }
  if (args.education && profile.education !== args.education) return false;
  if (args.occupation && profile.occupation !== args.occupation) return false;
  if (args.children !== undefined && profile.children !== args.children) return false;
  if (args.maritalStatus && profile.maritalStatus !== args.maritalStatus) return false;
  if (args.marriageTimeline && profile.marriageTimeline !== args.marriageTimeline) {
    return false;
  }
  return true;
}

async function resolveAdditionalImageUrls(
  ctx: QueryCtx,
  profile: Doc<"profiles">
) {
  const ids = profile.additionalImageIds ?? [];
  const urls = await Promise.all(
    ids.map(async (id) => (await ctx.storage.getUrl(id)) ?? null)
  );
  return urls.filter((url): url is string => url !== null);
}

export async function buildMatchResult(
  ctx: QueryCtx,
  profile: Doc<"profiles">,
  userId: Id<"users">,
  score: number,
  interaction?: Doc<"likes"> | null
) {
  let imageUrl = null;
  if (profile.profileImageId) {
    imageUrl = await ctx.storage.getUrl(profile.profileImageId);
  }

  const additionalImageUrls = await resolveAdditionalImageUrls(ctx, profile);

  return {
    userId,
    name: profile.name,
    age: profile.age,
    country: profile.country,
    city: profile.city,
    height: profile.height,
    education: profile.education,
    occupation: profile.occupation,
    religiousLevel: effectiveReligiousLevel(profile),
    prayerFrequency: profile.prayerFrequency ?? "",
    maritalStatus: profile.maritalStatus,
    marriageTimeline: profile.marriageTimeline,
    wantChildren: profile.wantChildren,
    bio: profile.bio,
    imageUrl,
    additionalImageUrls,
    score,
    liked: interaction?.action === "like",
    shortlisted: interaction?.action === "shortlist",
    verified: profile.verified,
    hasPaid: profile.hasPaid,
    hasPersonalSupport: profile.hasPersonalSupport ?? false,
    advisorReviewed: profile.advisorReviewed ?? false,
    questionnaireComplete: profile.questionnaireComplete,
  };
}

export async function hasActiveMatch(
  ctx: QueryCtx,
  userId: Id<"users">,
  otherUserId: Id<"users">
) {
  const asA = await ctx.db
    .query("matches")
    .withIndex("by_userA", (q) => q.eq("userA", userId))
    .collect();
  const asB = await ctx.db
    .query("matches")
    .withIndex("by_userB", (q) => q.eq("userB", userId))
    .collect();

  return [...asA, ...asB].some(
    (m) =>
      m.status === "active" &&
      ((m.userA === userId && m.userB === otherUserId) ||
        (m.userB === userId && m.userA === otherUserId))
  );
}
