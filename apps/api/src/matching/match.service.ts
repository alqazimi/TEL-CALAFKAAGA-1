import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { LikeAction, MatchStatus, Profile } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import { hasPaidAccess, isStaffRole } from "../common/access";
import { isDiscoverable } from "../common/review-status";
import { canViewerSeePhotos } from "../profile/photo-rules";
import { MediaAccessService } from "../media/media-access.service";
import {
  resolveProfileMainImageUrl,
  resolveProfileMainMediaId,
} from "../media/profile-image-url";
import {
  MATCH_DISCOVER_LIMIT,
  MATCH_LIST_LIMIT,
  MIN_COMPATIBILITY_SCORE,
  makePairKey,
} from "./constants";
import { MatchFilterArgs, profilePassesMatchFilters } from "./filters";
import { ScoreService } from "./score.service";

type AccessCtx = { userId: string; profile: Profile };

@Injectable()
export class MatchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scores: ScoreService,
    private readonly media: MediaAccessService
  ) {}

  private async requireMatchAccess(userId: string): Promise<AccessCtx> {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new ForbiddenException("Profile required");
    if (profile.banned) throw new ForbiddenException("Account suspended");
    if (!profile.questionnaireComplete) {
      throw new ForbiddenException("Complete your questionnaire first");
    }
    if (!hasPaidAccess(profile)) {
      throw new ForbiddenException("Complete payment to like profiles");
    }
    if (!isDiscoverable(profile)) {
      throw new ForbiddenException("Your profile is pending review");
    }
    return { userId, profile };
  }

  private async getBlockedIds(userId: string): Promise<Set<string>> {
    const rows = await this.prisma.block.findMany({
      where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
      select: { blockerId: true, blockedId: true },
    });
    const set = new Set<string>();
    for (const r of rows) {
      set.add(r.blockerId === userId ? r.blockedId : r.blockerId);
    }
    return set;
  }

  private async isEitherBlocked(a: string, b: string): Promise<boolean> {
    const row = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: a, blockedId: b },
          { blockerId: b, blockedId: a },
        ],
      },
      select: { id: true },
    });
    return !!row;
  }

  private hasPhoto(p: Profile): boolean {
    return !!(p.profileImageMediaId || p.profileImageConvexId);
  }

  async discover(
    userId: string,
    filters: MatchFilterArgs,
    opts?: { cursor?: string; limit?: number }
  ) {
    const access = await this.requireMatchAccess(userId);
    const limit = Math.min(
      opts?.limit ?? MATCH_DISCOVER_LIMIT,
      MATCH_DISCOVER_LIMIT
    );

    const myLikes = await this.prisma.like.findMany({
      where: { fromUserId: userId },
      select: { toUserId: true, action: true },
    });
    const interacted = new Set(myLikes.map((l) => l.toUserId));
    const blocked = await this.getBlockedIds(userId);

    const scores = await this.prisma.compatibilityScore.findMany({
      where: {
        userAId: userId,
        score: { gte: MIN_COMPATIBILITY_SCORE },
      },
      orderBy: [{ score: "desc" }, { userBId: "asc" }],
      take: MATCH_DISCOVER_LIMIT * 3,
    });

    let candidates = scores
      .filter((s) => !interacted.has(s.userBId) && !blocked.has(s.userBId))
      .map((s) => ({ userId: s.userBId, score: s.score }));

    if (opts?.cursor) {
      const idx = candidates.findIndex((c) => c.userId === opts.cursor);
      if (idx >= 0) candidates = candidates.slice(idx + 1);
    }

    const page = candidates.slice(0, limit);
    const results = [];
    for (const c of page) {
      const card = await this.buildCard(
        access,
        c.userId,
        c.score,
        myLikes.find((l) => l.toUserId === c.userId)?.action ?? null,
        filters,
        true
      );
      if (card) results.push(card);
    }

    const nextCursor =
      page.length === limit ? page[page.length - 1]?.userId ?? null : null;

    return {
      items: results,
      nextCursor,
      minScore: MIN_COMPATIBILITY_SCORE,
      limit,
    };
  }

  async lists(userId: string, filters: MatchFilterArgs = {}) {
    const access = await this.requireMatchAccess(userId);
    const myLikes = await this.prisma.like.findMany({
      where: { fromUserId: userId },
    });
    const activePartners = await this.activePartnerIds(userId);
    const blocked = await this.getBlockedIds(userId);
    const scoreMap = await this.scoreMap(userId);

    const load = async (ids: string[]) => {
      const out = [];
      for (const id of ids.slice(0, MATCH_LIST_LIMIT)) {
        if (blocked.has(id)) continue;
        const card = await this.buildCard(
          access,
          id,
          scoreMap.get(id) ?? 0,
          myLikes.find((l) => l.toUserId === id)?.action ?? null,
          filters,
          true
        );
        if (card) out.push(card);
      }
      return out;
    };

    const shortlist = await load(
      myLikes.filter((l) => l.action === "shortlist").map((l) => l.toUserId)
    );
    const liked = await load(
      myLikes
        .filter((l) => l.action === "like" && !activePartners.has(l.toUserId))
        .map((l) => l.toUserId)
    );
    const passed = await load(
      myLikes.filter((l) => l.action === "pass").map((l) => l.toUserId)
    );

    let likedYou: Awaited<ReturnType<typeof load>> = [];
    if (hasPaidAccess(access.profile)) {
      const incoming = await this.prisma.like.findMany({
        where: { toUserId: userId, action: "like" },
        take: MATCH_LIST_LIMIT,
      });
      likedYou = await load(
        incoming
          .filter((l) => !activePartners.has(l.fromUserId))
          .map((l) => l.fromUserId)
      );
    }

    return { shortlist, liked, passed, likedYou };
  }

  async mutual(
    userId: string,
    list: "active" | "new" | "archived" = "active"
  ) {
    await this.requireMatchAccess(userId).catch(() => null);
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new ForbiddenException("Profile required");

    const matches = await this.prisma.match.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
        ...(list === "archived"
          ? { status: "archived" as MatchStatus }
          : { status: "active" as MatchStatus }),
      },
      include: { conversation: true },
      orderBy: { updatedAt: "desc" },
      take: MATCH_LIST_LIMIT,
    });

    const blocked = await this.getBlockedIds(userId);
    const items = [];
    for (const m of matches) {
      const otherId = m.userAId === userId ? m.userBId : m.userAId;
      if (blocked.has(otherId)) continue;
      const seenMap = (m.seenAtByUser as Record<string, number> | null) ?? {};
      const isNew = m.status === "active" && seenMap[userId] === undefined;
      if (list === "new" && !isNew) continue;

      const other = await this.prisma.profile.findUnique({
        where: { userId: otherId },
      });
      const photo = other
        ? await this.photoMeta(userId, other, profile.role, true)
        : { imageUrl: null, photoHidden: false, mediaId: null };

      items.push({
        matchId: m.id,
        conversationId: m.conversation?.id ?? null,
        score: m.score,
        chatUnlocked: m.chatUnlocked,
        status: m.status,
        isNew,
        pairKey: m.pairKey,
        lastMessageAt:
          m.conversation?.lastMessageAt?.toISOString() ??
          m.createdAt.toISOString(),
        profile: other
          ? {
              userId: otherId,
              name: other.name,
              age: other.age,
              country: other.country,
              city: other.city,
              imageUrl: photo.imageUrl,
              photoHidden: photo.photoHidden,
              photoMediaId: photo.mediaId,
              reviewStatus: other.reviewStatus,
              approved: other.approved,
            }
          : null,
      });
    }
    return { items };
  }

  async act(
    userId: string,
    targetUserId: string,
    action: LikeAction
  ): Promise<{
    matched: boolean;
    matchId?: string;
    conversationId?: string;
    reactivated?: boolean;
  }> {
    const access = await this.requireMatchAccess(userId);
    if (targetUserId === userId) {
      throw new BadRequestException("You cannot interact with your own profile");
    }
    if (await this.isEitherBlocked(userId, targetUserId)) {
      throw new ForbiddenException("You cannot interact with this user");
    }
    const target = await this.prisma.profile.findUnique({
      where: { userId: targetUserId },
    });
    if (!target || !isDiscoverable(target)) {
      throw new NotFoundException("This profile is not available");
    }

    const targetUser = await this.prisma.user.findUniqueOrThrow({
      where: { id: targetUserId },
    });
    const meUser = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    await this.prisma.like.upsert({
      where: {
        fromUserId_toUserId: { fromUserId: userId, toUserId: targetUserId },
      },
      create: {
        convexId: `local_like_${randomUUID()}`,
        fromUserId: userId,
        toUserId: targetUserId,
        convexFromUserId: meUser.convexId,
        convexToUserId: targetUser.convexId,
        action,
      },
      update: { action },
    });

    if (action === "pass" || action === "shortlist") {
      return { matched: false };
    }

    // Notification stub (Phase 7+)
    await this.prisma.profileAuditEvent.create({
      data: {
        userId,
        profileId: access.profile.id,
        action: "score_recalc_stub",
        metadata: {
          event: "like_notification_stub",
          toUserId: targetUserId,
        },
      },
    });

    const reverse = await this.prisma.like.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId: targetUserId,
          toUserId: userId,
        },
      },
    });

    if (reverse?.action !== "like") {
      return { matched: false };
    }

    return this.createOrReactivateMatch(userId, targetUserId, meUser.convexId, targetUser.convexId);
  }

  private async createOrReactivateMatch(
    likerId: string,
    targetId: string,
    likerConvexId: string,
    targetConvexId: string
  ) {
    const pairKey = makePairKey(likerId, targetId);
    const scoreRow = await this.prisma.compatibilityScore.findUnique({
      where: {
        userAId_userBId: { userAId: likerId, userBId: targetId },
      },
    });
    const matchScore = scoreRow?.score ?? 0;

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.match.findUnique({ where: { pairKey } });
      if (existing) {
        const wasInactive = existing.status !== "active";
        if (wasInactive) {
          await tx.match.update({
            where: { id: existing.id },
            data: {
              status: "active",
              score: matchScore,
              chatUnlocked: false,
              archivedAt: null,
            },
          });
        }
        let conversation = await tx.conversation.findUnique({
          where: { matchId: existing.id },
        });
        if (!conversation) {
          conversation = await tx.conversation.create({
            data: {
              convexId: `local_conv_${randomUUID()}`,
              matchId: existing.id,
              convexMatchId: existing.convexId,
              participantConvexIds: [likerConvexId, targetConvexId],
              participantUserIds: [likerId, targetId],
              lastMessageAt: new Date(),
              unreadByUser: { [likerId]: 0, [targetId]: 0 },
            },
          });
        } else if (
          !conversation.participantUserIds?.length ||
          conversation.participantUserIds.length < 2
        ) {
          conversation = await tx.conversation.update({
            where: { id: conversation.id },
            data: {
              participantUserIds: [existing.userAId, existing.userBId],
            },
          });
        }
        return {
          matched: true as const,
          matchId: existing.id,
          conversationId: conversation.id,
          reactivated: wasInactive,
        };
      }

      try {
        const match = await tx.match.create({
          data: {
            convexId: `local_match_${randomUUID()}`,
            pairKey,
            // Preserve Convex semantics: liker = userA
            userAId: likerId,
            userBId: targetId,
            convexUserA: likerConvexId,
            convexUserB: targetConvexId,
            score: matchScore,
            status: "active",
            chatUnlocked: false,
          },
        });
        const conversation = await tx.conversation.create({
          data: {
            convexId: `local_conv_${randomUUID()}`,
            matchId: match.id,
            convexMatchId: match.convexId,
            participantConvexIds: [likerConvexId, targetConvexId],
            participantUserIds: [likerId, targetId],
            lastMessageAt: new Date(),
            unreadByUser: { [likerId]: 0, [targetId]: 0 },
          },
        });
        return {
          matched: true as const,
          matchId: match.id,
          conversationId: conversation.id,
        };
      } catch (err: unknown) {
        const code =
          err && typeof err === "object" && "code" in err
            ? (err as { code?: string }).code
            : undefined;
        if (code === "P2002") {
          const again = await tx.match.findUnique({ where: { pairKey } });
          if (again) {
            const conversation = await tx.conversation.findUnique({
              where: { matchId: again.id },
            });
            return {
              matched: true as const,
              matchId: again.id,
              conversationId: conversation?.id,
            };
          }
        }
        throw err;
      }
    });
  }

  async markSeen(userId: string, matchId: string) {
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new NotFoundException("Match not found");
    if (match.userAId !== userId && match.userBId !== userId) {
      throw new ForbiddenException("Not authorized");
    }
    const seen = {
      ...((match.seenAtByUser as Record<string, number> | null) ?? {}),
      [userId]: Date.now(),
    };
    await this.prisma.match.update({
      where: { id: matchId },
      data: { seenAtByUser: seen },
    });
    return { ok: true };
  }

  async archive(userId: string, matchId: string, archived: boolean) {
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new NotFoundException("Match not found");
    if (match.userAId !== userId && match.userBId !== userId) {
      throw new ForbiddenException("Not authorized");
    }
    if (match.status === "unmatched") {
      throw new BadRequestException("This match is no longer available");
    }
    await this.prisma.match.update({
      where: { id: matchId },
      data: archived
        ? { status: "archived", archivedAt: new Date() }
        : { status: "active", archivedAt: null },
    });
    return { ok: true };
  }

  async breakdown(viewerId: string, targetUserId: string) {
    const access = await this.requireMatchAccess(viewerId);
    if (await this.isEitherBlocked(viewerId, targetUserId)) {
      throw new ForbiddenException("You cannot interact with this user");
    }
    const target = await this.prisma.profile.findUnique({
      where: { userId: targetUserId },
    });
    if (!target) throw new NotFoundException("Profile not found");
    const prefs = await this.prisma.preference.findUnique({
      where: { userId: viewerId },
    });
    const targetPrefs = await this.prisma.preference.findUnique({
      where: { userId: targetUserId },
    });
    if (!prefs || !targetPrefs) {
      throw new BadRequestException("Preferences required");
    }
    const breakdown = this.scores.calculateBreakdown(
      access.profile,
      prefs,
      target,
      targetPrefs
    );
    const stored = await this.prisma.compatibilityScore.findUnique({
      where: {
        userAId_userBId: { userAId: viewerId, userBId: targetUserId },
      },
    });
    return {
      total: breakdown.total,
      categories: breakdown.categories,
      storedScore: stored?.score ?? null,
      scoreVersion: stored?.scoreVersion ?? null,
      lastCalculatedAt: stored?.lastCalculatedAt?.toISOString() ?? null,
    };
  }

  async getWali(viewerId: string, matchId: string) {
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new NotFoundException("Match not found");
    if (match.userAId !== viewerId && match.userBId !== viewerId) {
      throw new ForbiddenException("Not authorized");
    }
    if (match.status !== "active") {
      return { waliName: null, waliPhone: null };
    }
    const otherId =
      match.userAId === viewerId ? match.userBId : match.userAId;
    if (await this.isEitherBlocked(viewerId, otherId)) {
      throw new ForbiddenException("Access denied");
    }
    const other = await this.prisma.profile.findUnique({
      where: { userId: otherId },
    });
    if (!other?.waliName && !other?.waliPhone) {
      return { waliName: null, waliPhone: null };
    }
    return {
      waliName: other?.waliName ?? null,
      waliPhone: other?.waliPhone ?? null,
    };
  }

  private async activePartnerIds(userId: string): Promise<Set<string>> {
    const matches = await this.prisma.match.findMany({
      where: {
        status: "active",
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      select: { userAId: true, userBId: true },
    });
    const set = new Set<string>();
    for (const m of matches) {
      set.add(m.userAId === userId ? m.userBId : m.userAId);
    }
    return set;
  }

  private async scoreMap(userId: string): Promise<Map<string, number>> {
    const rows = await this.prisma.compatibilityScore.findMany({
      where: { userAId: userId },
      select: { userBId: true, score: true },
    });
    return new Map(rows.map((r) => [r.userBId, r.score]));
  }

  private async buildCard(
    access: AccessCtx,
    targetUserId: string,
    score: number,
    action: LikeAction | null,
    filters: MatchFilterArgs,
    listPreview: boolean
  ) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId: targetUserId },
    });
    if (!profile || profile.banned || !isDiscoverable(profile)) return null;
    if (!this.hasPhoto(profile)) return null;
    if (!profilePassesMatchFilters(profile, filters)) return null;

    const activePartners = await this.activePartnerIds(access.userId);
    const mutual = activePartners.has(targetUserId);
    const photo = await this.photoMeta(
      access.userId,
      profile,
      access.profile.role,
      mutual
    );

    return {
      userId: targetUserId,
      name: profile.name ?? "Member",
      age: profile.age,
      country: profile.country ?? "",
      city: profile.city ?? undefined,
      height: profile.height ?? undefined,
      education: profile.education ?? "",
      occupation: profile.occupation ?? "",
      religiousLevel: profile.religiousLevel ?? "",
      prayerFrequency: profile.prayerFrequency ?? undefined,
      bio: profile.bio || undefined,
      maritalStatus: profile.maritalStatus ?? undefined,
      marriageTimeline: profile.marriageTimeline ?? undefined,
      wantChildren: profile.wantChildren ?? undefined,
      score,
      action,
      liked: action === "like",
      shortlisted: action === "shortlist",
      mutualMatch: mutual,
      imageUrl: photo.imageUrl,
      photoHidden: photo.photoHidden,
      photoMediaId: photo.mediaId,
      additionalImageUrls: listPreview ? [] : photo.additionalUrls,
      reviewStatus: profile.reviewStatus,
      approved: profile.approved,
      hasPaid: profile.hasPaid,
      hasPersonalSupport: !!profile.hasPersonalSupport,
      questionnaireComplete: profile.questionnaireComplete,
    };
  }

  private async photoMeta(
    viewerId: string,
    profile: Profile,
    viewerRole: Profile["role"],
    hasActiveMatch = false
  ) {
    const allowed = canViewerSeePhotos({
      viewerUserId: viewerId,
      profileOwnerUserId: profile.userId,
      photoVisibility: profile.photoVisibility,
      isStaff: isStaffRole(viewerRole),
      hasActiveMatch,
    });
    const mediaId = await resolveProfileMainMediaId(this.prisma, profile);
    if (!allowed) {
      return {
        imageUrl: null as string | null,
        photoHidden: !!(mediaId || profile.profileImageConvexId),
        mediaId: null as string | null,
        additionalUrls: [] as string[],
      };
    }
    const imageUrl = mediaId
      ? await resolveProfileMainImageUrl(this.prisma, this.media, profile, {
          userId: viewerId,
          roles: [viewerRole],
        })
      : null;
    return {
      imageUrl,
      photoHidden: false,
      mediaId,
      additionalUrls: [] as string[],
    };
  }
}
