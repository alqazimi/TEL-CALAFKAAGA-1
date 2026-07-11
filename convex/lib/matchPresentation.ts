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

export type PhotoVisibility = "everyone" | "matches" | "private";

export function resolvePhotoVisibility(
  profile: Pick<Doc<"profiles">, "photoVisibility">
): PhotoVisibility {
  return profile.photoVisibility ?? "everyone";
}

/**
 * Whether the viewer may see the member's main/gallery photos.
 * Owner always sees their own photos.
 */
export async function canViewerSeePhotos(
  ctx: QueryCtx,
  viewerId: Id<"users"> | null,
  profile: Doc<"profiles">
): Promise<boolean> {
  if (viewerId && viewerId === profile.userId) return true;

  const visibility = resolvePhotoVisibility(profile);
  if (visibility === "everyone") return true;
  if (visibility === "private") return false;

  // matches-only
  if (!viewerId) return false;
  return hasActiveMatch(ctx, viewerId, profile.userId);
}

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
  if (ids.length === 0) return [];
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
  interaction?: Doc<"likes"> | null,
  options?: {
    includeGallery?: boolean;
    viewerId?: Id<"users"> | null;
  }
) {
  const viewerId = options?.viewerId ?? null;
  const photosVisible = await canViewerSeePhotos(ctx, viewerId, profile);

  let imageUrl: string | null = null;
  let additionalImageUrls: string[] = [];
  let photoHidden = false;

  if (photosVisible) {
    if (profile.profileImageId) {
      imageUrl = await ctx.storage.getUrl(profile.profileImageId);
    }
    additionalImageUrls =
      options?.includeGallery === false
        ? []
        : await resolveAdditionalImageUrls(ctx, profile);
  } else {
    photoHidden = !!profile.profileImageId;
  }

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
    photoHidden,
    photoVisibility: resolvePhotoVisibility(profile),
    score,
    liked: interaction?.action === "like",
    shortlisted: interaction?.action === "shortlist",
    verified: profile.verified,
    approved: profile.approved,
    reviewStatus: profile.reviewStatus,
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
  const partners = await getActiveMatchPartnerIds(ctx, userId);
  return partners.has(otherUserId);
}

/** All users this member has an active mutual match with (one query batch). */
export async function getActiveMatchPartnerIds(
  ctx: QueryCtx,
  userId: Id<"users">
) {
  const [asA, asB] = await Promise.all([
    ctx.db
      .query("matches")
      .withIndex("by_userA", (q) => q.eq("userA", userId))
      .collect(),
    ctx.db
      .query("matches")
      .withIndex("by_userB", (q) => q.eq("userB", userId))
      .collect(),
  ]);

  const partners = new Set<Id<"users">>();
  for (const m of asA) {
    if (m.status === "active") partners.add(m.userB);
  }
  for (const m of asB) {
    if (m.status === "active") partners.add(m.userA);
  }
  return partners;
}
