import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { MetricsService } from "./metrics.service";

@Injectable()
export class AdminStatsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly metrics: MetricsService
  ) {}

  async getStats() {
    const m = await this.metrics.getGlobal();
    const completedPayments = await this.prisma.payment.findMany({
      where: { status: "completed" },
      select: { amount: true, registrationTier: true, paymentType: true },
      take: 500,
    });
    let registrationCents = 0;
    let premiumCents = 0;
    for (const p of completedPayments) {
      if (
        p.paymentType === "premium_upgrade" ||
        p.registrationTier === "premium" ||
        p.paymentType === "registration_premium"
      ) {
        premiumCents += p.amount;
      } else {
        registrationCents += p.amount;
      }
    }

    const stale =
      !m ||
      Date.now() - m.metricsUpdatedAt.getTime() > 30 * 60 * 1000;

    return {
      metrics: m
        ? {
            totalUsers: m.totalUsers,
            maleUsers: m.maleUsers,
            femaleUsers: m.femaleUsers,
            approvedTotal: m.approvedTotal,
            paidMembers: m.paidMembers,
            memberCount: m.memberCount,
            pendingApproval: m.pendingApproval,
            bannedUsers: m.bannedUsers,
            paidBasicMembers: m.paidBasicMembers,
            freeBasicWomen: m.freeBasicWomen,
            paidPremiumCount: m.paidPremiumCount,
            unpaidCount: m.unpaidCount,
            completeMembers: m.completeMembers,
            updatedAt: m.metricsUpdatedAt.toISOString(),
          }
        : null,
      money: {
        registrationCents,
        premiumCents,
        totalCents: registrationCents + premiumCents,
      },
      metricsStale: stale,
    };
  }

  async getAnalytics() {
    const m = await this.metrics.getGlobal();
    const paidMembers = m?.paidMembers ?? 0;
    const memberCount = m?.memberCount ?? 0;
    const completeMembers = m?.completeMembers ?? 0;
    return {
      countryBreakdown: (m?.countryBreakdown as Record<string, number>) ?? {},
      monthlySignups: (m?.monthlySignups as Record<string, number>) ?? {},
      genderBreakdown: (m?.genderBreakdown as Record<string, number>) ?? {
        male: 0,
        female: 0,
        unknown: 0,
      },
      reviewBreakdown: (m?.reviewBreakdown as Record<string, number>) ?? {
        incomplete: 0,
        pending_review: 0,
        approved: 0,
        rejected: 0,
        suspended: 0,
      },
      trialMembers: 0,
      paidMembers,
      memberCount,
      matchRate:
        memberCount > 0
          ? Math.round((completeMembers / memberCount) * 100)
          : 0,
      conversionRate:
        memberCount > 0 ? Math.round((paidMembers / memberCount) * 100) : 0,
      metricsUpdatedAt: m?.metricsUpdatedAt.toISOString() ?? null,
    };
  }

  async getActivity(limit = 40) {
    const logs = await this.prisma.auditLog.findMany({
      orderBy: { loggedAt: "desc" },
      take: Math.min(limit, 100),
      include: {
        actor: { include: { profile: { select: { name: true } } } },
      },
    });
    return logs.map((l) => ({
      id: l.id,
      action: l.action,
      actorName: l.actor.profile?.name ?? "Staff",
      createdAt: l.loggedAt.toISOString(),
      metadata: l.metadata,
    }));
  }
}
