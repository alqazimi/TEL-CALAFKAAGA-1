import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { Inject } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  isOwnerRole,
  isPremiumMember,
  isStaffRole,
} from "../common/access";
import { requiresAdminProfileApproval } from "../common/review-status";
import { assertProfileFullyComplete } from "../profile/profile-completeness";
import { ScoreQueueService } from "../queue/score-queue.service";
import { NotificationQueueService } from "../queue/notification-queue.service";
import { MAIL_ADAPTER } from "../auth/auth.service";
import type { MailAdapter } from "../auth/mail.adapter";
import { AuditLogService } from "./audit-log.service";
import { DeletionService } from "./deletion.service";
import { MetricsService } from "./metrics.service";
import {
  assertCanBanTarget,
  assertCanRejectTarget,
  maskEmail,
  parseLimit,
} from "./admin-auth.helpers";

const SOMALI_PHOTO_MSG =
  "Fadlan geli sawirkaaga saxda ah si uu kuu furmo. Mahadsanid.";

function profileRestoredReviewStatus(target: {
  questionnaireComplete: boolean;
  approved: boolean;
}) {
  if (target.approved) return "approved" as const;
  if (target.questionnaireComplete) return "pending_review" as const;
  return "incomplete" as const;
}

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
    private readonly deletion: DeletionService,
    private readonly metrics: MetricsService,
    private readonly scores: ScoreQueueService,
    private readonly notifQueue: NotificationQueueService,
    @Inject(MAIL_ADAPTER) private readonly mail: MailAdapter
  ) {}

  private async notifyApproval(opts: {
    userId: string;
    title: string;
    body: string;
    emailCta?: { label: string; path: string };
    sendEmail?: boolean;
  }) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: opts.userId },
    });
    const notification = await this.prisma.notification.create({
      data: {
        convexId: `local_notif_${randomUUID()}`,
        userId: opts.userId,
        convexUserId: user.convexId,
        type: "approval",
        title: opts.title,
        body: opts.body,
        read: false,
        notificationCreatedAt: new Date(),
      },
    });
    if (opts.sendEmail !== false && user.email) {
      await this.mail.send({
        to: user.email,
        subject: opts.title,
        text: `${opts.body}\n\n${opts.emailCta?.label ?? "Open app"}: ${opts.emailCta?.path ?? "/matches"}`,
      });
      await this.notifQueue.enqueueEmailStub({
        notificationId: notification.id,
        userId: opts.userId,
        type: "approval",
      });
    }
  }

  async listUsers(opts: {
    search?: string;
    role?: string;
    reviewStatus?: string;
    hasPaid?: boolean;
    cursor?: string;
    limit?: number;
  }) {
    const limit = parseLimit(String(opts.limit ?? 50), 50, 250);
    const where: Prisma.ProfileWhereInput = {};

    const role = opts.role?.trim();
    if (role && role !== "all") {
      where.role = role as never;
    }

    const reviewStatus = opts.reviewStatus?.trim();
    if (reviewStatus && reviewStatus !== "all") {
      if (reviewStatus === "needs_action") {
        // Convex "needs_action" = pending_review OR rejected (then approval rules).
        where.reviewStatus = { in: ["pending_review", "rejected"] };
      } else {
        where.reviewStatus = reviewStatus as never;
      }
    }

    if (opts.hasPaid !== undefined) where.hasPaid = opts.hasPaid;
    if (opts.search?.trim()) {
      const q = opts.search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        { user: { emailNormalized: { contains: q.toLowerCase() } } },
      ];
    }
    if (opts.cursor) {
      where.id = { lt: opts.cursor };
    }

    // Over-fetch for needs_action so we can apply Convex-equivalent approval rules.
    const fetchLimit =
      reviewStatus === "needs_action" ? Math.min(limit * 3, 150) : limit + 1;

    const rows = await this.prisma.profile.findMany({
      where,
      orderBy: { id: "desc" },
      take: fetchLimit,
      include: {
        user: { select: { email: true, id: true, convexId: true } },
      },
    });

    const filtered =
      reviewStatus === "needs_action"
        ? rows.filter((p) => requiresAdminProfileApproval(p))
        : rows;

    const hasMore =
      reviewStatus === "needs_action"
        ? filtered.length > limit
        : rows.length > limit;
    const page = hasMore ? filtered.slice(0, limit) : filtered.slice(0, limit);

    const items = await Promise.all(
      page.map(async (p) => {
        const paidAgg = await this.prisma.payment.aggregate({
          where: { userId: p.userId, status: "completed" },
          _sum: { amount: true },
        });
        return {
          // UI still uses Convex-shaped `_id` as the profile id.
          _id: p.id,
          id: p.id,
          userId: p.userId,
          name: p.name,
          email: maskEmail(p.user.email),
          gender: p.gender,
          role: p.role,
          hasPaid: p.hasPaid,
          hasPersonalSupport: p.hasPersonalSupport,
          approved: p.approved,
          banned: p.banned,
          reviewStatus: p.reviewStatus,
          questionnaireComplete: p.questionnaireComplete,
          profileImageId: p.profileImageMediaId ?? p.profileImageConvexId,
          paidCents: paidAgg._sum.amount ?? 0,
          country: p.country,
          city: p.city,
        };
      })
    );

    return {
      items,
      nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
    };
  }

  async getUserDetail(profileId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId },
      include: { user: { select: { email: true, id: true, convexId: true } } },
    });
    if (!profile) throw new NotFoundException("Profile not found");
    const preferences = await this.prisma.preference.findUnique({
      where: { userId: profile.userId },
    });
    const paidAgg = await this.prisma.payment.aggregate({
      where: { userId: profile.userId, status: "completed" },
      _sum: { amount: true },
    });
    return {
      profile: {
        ...profile,
        _id: profile.id,
        email: profile.user.email,
        paidCents: paidAgg._sum.amount ?? 0,
        user: undefined,
      },
      preferences,
    };
  }

  async getUserActivity(
    profileId: string,
    opts?: { messageLimit?: number; likeLimit?: number }
  ) {
    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId },
    });
    if (!profile) throw new NotFoundException("Profile not found");
    const messageLimit = Math.min(Math.max(opts?.messageLimit ?? 50, 1), 100);
    const likeLimit = Math.min(Math.max(opts?.likeLimit ?? 40, 1), 80);

    const messages = await this.prisma.message.findMany({
      where: { senderId: profile.userId },
      orderBy: { messageCreatedAt: "desc" },
      take: messageLimit,
      select: {
        id: true,
        body: true,
        imageMediaId: true,
        messageCreatedAt: true,
        conversationId: true,
      },
    });

    const likesGiven = await this.prisma.like.findMany({
      where: { fromUserId: profile.userId },
      take: likeLimit,
      orderBy: { createdAt: "desc" },
    });
    const likesReceived = await this.prisma.like.findMany({
      where: { toUserId: profile.userId },
      take: likeLimit,
      orderBy: { createdAt: "desc" },
    });

    const matches = await this.prisma.match.findMany({
      where: {
        OR: [{ userAId: profile.userId }, { userBId: profile.userId }],
        status: "active",
      },
      take: 40,
    });

    return {
      messages: messages.map((m) => ({
        id: m.id,
        direction: "sent" as const,
        body: m.body?.trim() || (m.imageMediaId ? "[Image]" : ""),
        hasImage: Boolean(m.imageMediaId),
        createdAt: m.messageCreatedAt.toISOString(),
      })),
      likesGiven: likesGiven.length,
      likesReceived: likesReceived.length,
      activeMatches: matches.length,
    };
  }

  async approveUser(actorUserId: string, profileId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId },
    });
    if (!profile) throw new NotFoundException("Profile not found");

    if (!requiresAdminProfileApproval(profile)) {
      throw new BadRequestException(
        profile.gender === "male"
          ? "Men are approved automatically when they pay. Admin approval is only for women on Basic."
          : profile.hasPaid !== true
            ? "This member must pay Basic before you can approve their profile."
            : "This member does not need admin approval."
      );
    }

    if (
      profile.reviewStatus === "approved" ||
      (profile.approved && !profile.reviewStatus)
    ) {
      if (profile.reviewStatus !== "approved") {
        await this.prisma.profile.update({
          where: { id: profileId },
          data: { reviewStatus: "approved", verified: false },
        });
      }
      return { ok: true, alreadyApproved: true };
    }

    const preferences = await this.prisma.preference.findUnique({
      where: { userId: profile.userId },
    });

    if (profile.reviewStatus === "rejected") {
      if (!profile.profileImageMediaId && !profile.profileImageConvexId) {
        throw new BadRequestException(
          "Member must upload a profile photo before you can approve."
        );
      }
      if (!profile.questionnaireComplete) {
        throw new BadRequestException(
          "Member must finish the questionnaire before you can approve."
        );
      }
    } else {
      try {
        assertProfileFullyComplete(profile, preferences);
      } catch (e) {
        throw new BadRequestException(
          e instanceof Error ? e.message : "Profile incomplete"
        );
      }
    }

    await this.prisma.profile.update({
      where: { id: profileId },
      data: {
        approved: true,
        verified: false,
        reviewStatus: "approved",
        questionnaireComplete: true,
        questionnaireStep: 11,
      },
    });

    await this.metrics.scheduleRebuild();
    await this.notifyApproval({
      userId: profile.userId,
      title: "Profile approved",
      body: "Your profile was approved. You can now browse matches and connect with members.",
      sendEmail: true,
    });
    await this.scores.enqueueUserRecalculation(profile.userId, "admin_approve");
    await this.audit.write({
      actorUserId,
      action: "approve_user",
      targetUserId: profile.userId,
      targetProfileId: profileId,
    });

    return { ok: true };
  }

  async rejectUser(
    actorUserId: string,
    profileId: string,
    reason?: string
  ) {
    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId },
    });
    if (!profile) throw new NotFoundException("Profile not found");
    assertCanRejectTarget(profile.role);

    await this.prisma.profile.update({
      where: { id: profileId },
      data: {
        approved: false,
        verified: false,
        reviewStatus: "rejected",
      },
    });

    await this.metrics.scheduleRebuild();
    const body = reason?.trim() || SOMALI_PHOTO_MSG;
    await this.notifyApproval({
      userId: profile.userId,
      title: "Sawirka profile-ka",
      body,
      emailCta: { label: "Cusboonaysii sawirka", path: "/profile" },
      sendEmail: true,
    });
    await this.audit.write({
      actorUserId,
      action: "reject_user",
      targetUserId: profile.userId,
      targetProfileId: profileId,
      metadata: reason?.trim() ? { reason: reason.trim() } : undefined,
    });
    return { ok: true };
  }

  async banUser(actorUserId: string, profileId: string, banned: boolean) {
    const target = await this.prisma.profile.findUnique({
      where: { id: profileId },
    });
    if (!target) throw new NotFoundException("Profile not found");
    assertCanBanTarget(target.role);

    await this.prisma.profile.update({
      where: { id: profileId },
      data: {
        banned,
        ...(banned
          ? { reviewStatus: "suspended" as const }
          : { reviewStatus: profileRestoredReviewStatus(target) }),
      },
    });

    await this.metrics.scheduleRebuild();
    await this.audit.write({
      actorUserId,
      action: banned ? "ban_user" : "unban_user",
      targetUserId: target.userId,
      targetProfileId: profileId,
    });
    return { ok: true, banned };
  }

  async requestProfilePhoto(
    actorUserId: string,
    profileId: string,
    message?: string
  ) {
    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId },
    });
    if (!profile) throw new NotFoundException("Profile not found");
    if (isStaffRole(profile.role)) {
      throw new ForbiddenException(
        "Cannot request a photo from a staff account"
      );
    }
    const body = message?.trim() || SOMALI_PHOTO_MSG;
    await this.notifyApproval({
      userId: profile.userId,
      title: "Sawirka profile-ka",
      body,
      emailCta: { label: "Cusboonaysii sawirka", path: "/profile" },
      sendEmail: true,
    });
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: profile.userId },
    });
    await this.prisma.memberEmailLog.create({
      data: {
        convexId: `local_mel_${randomUUID()}`,
        userId: profile.userId,
        convexUserId: user.convexId,
        kind: "request_profile_photo",
        sentAt: new Date(),
      },
    });
    await this.audit.write({
      actorUserId,
      action: "request_profile_photo",
      targetUserId: profile.userId,
      targetProfileId: profileId,
    });
    return { ok: true };
  }

  async setAdvisorReviewed(
    actorUserId: string,
    profileId: string,
    advisorReviewed: boolean
  ) {
    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId },
    });
    if (!profile) throw new NotFoundException("Profile not found");
    if (!isPremiumMember(profile)) {
      throw new BadRequestException(
        "Advisor review is only for premium members"
      );
    }
    await this.prisma.profile.update({
      where: { id: profileId },
      data: { advisorReviewed },
    });
    return { ok: true };
  }

  /** Owner-only: demote to user. Cannot promote to admin (invites only). */
  async setUserRole(
    actorUserId: string,
    profileId: string,
    role: "user" | "admin"
  ) {
    const actor = await this.prisma.profile.findUnique({
      where: { userId: actorUserId },
    });
    if (!actor || !isOwnerRole(actor.role)) {
      throw new ForbiddenException(
        "Only the owner can manage admin roles."
      );
    }

    const target = await this.prisma.profile.findUnique({
      where: { id: profileId },
    });
    if (!target) throw new NotFoundException("Profile not found.");
    if (isOwnerRole(target.role)) {
      throw new ForbiddenException("The owner role cannot be changed.");
    }
    if (role === "admin") {
      throw new BadRequestException(
        "Admins must be invited. Use Invite admin on the Users tab."
      );
    }
    if (target.userId === actorUserId) {
      throw new ForbiddenException("You cannot demote yourself.");
    }
    if (target.role === role) return { ok: true };

    await this.prisma.profile.update({
      where: { id: profileId },
      data: { role },
    });
    await this.audit.write({
      actorUserId,
      action: "set_role",
      targetUserId: target.userId,
      targetProfileId: profileId,
      metadata: { role },
    });
    return { ok: true };
  }

  async deleteUser(
    actorUserId: string,
    profileId: string,
    opts?: { dryRun?: boolean; correlationId?: string; requestId?: string }
  ) {
    if (opts?.dryRun) {
      return this.deletion.dryRun(
        actorUserId,
        profileId,
        opts.correlationId
      );
    }
    const result = await this.deletion.execute(actorUserId, profileId, {
      correlationId: opts?.correlationId,
      requestId: opts?.requestId,
    });
    await this.metrics.scheduleRebuild();
    return result;
  }
}
