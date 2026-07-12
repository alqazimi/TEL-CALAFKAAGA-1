import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { Inject } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.module";
import { MAIL_ADAPTER } from "../auth/auth.service";
import type { MailAdapter } from "../auth/mail.adapter";
import { AuditLogService } from "./audit-log.service";
import { maskEmail, parseLimit } from "./admin-auth.helpers";

const TOPIC_SUBJECTS: Record<string, string> = {
  photo_upload: "Can't upload profile photo",
  account: "Account help",
  payment: "Payment help",
  other: "Member support",
  contact_form: "Website contact form",
};

@Injectable()
export class SupportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly audit: AuditLogService,
    @Inject(MAIL_ADAPTER) private readonly mail: MailAdapter
  ) {}

  private async rateLimitMember(userId: string) {
    const online = await this.redis.connect();
    if (!online || !this.redis.client) {
      throw new ServiceUnavailableException(
        "Service temporarily unavailable. Try again later."
      );
    }
    const key = `rl:admin.support:user:${userId}`;
    const count = await this.redis.client.incr(key);
    if (count === 1) await this.redis.client.expire(key, 3600);
    if (count > 5) {
      throw new BadRequestException(
        "Too many messages. Please try again later or use WhatsApp."
      );
    }
  }

  private async loadThread(contactId: string, contact: {
    message: string;
    source: string;
    userId: string | null;
    contactCreatedAt: Date;
  }) {
    const rows = await this.prisma.supportMessage.findMany({
      where: { contactId },
      orderBy: { messageCreatedAt: "asc" },
    });
    if (rows.length > 0) {
      return rows.map((row) => ({
        id: row.id,
        authorRole: row.authorRole,
        authorUserId: row.authorUserId,
        body: row.body,
        createdAt: row.messageCreatedAt.toISOString(),
      }));
    }
    return [
      {
        id: `legacy:${contactId}`,
        authorRole:
          contact.source === "contact_page" ? ("visitor" as const) : ("member" as const),
        authorUserId: contact.userId,
        body: contact.message,
        createdAt: contact.contactCreatedAt.toISOString(),
      },
    ];
  }

  async sendSupportMessage(
    userId: string,
    opts: {
      topic: "photo_upload" | "account" | "payment" | "other";
      message: string;
      source: "profile" | "questionnaire" | "contact_page" | "other";
    }
  ) {
    await this.rateLimitMember(userId);
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });
    if (!profile) throw new ForbiddenException("Profile not found");
    const message = opts.message.trim();
    if (message.length < 10) {
      throw new BadRequestException(
        "Please write a bit more detail (at least 10 characters)."
      );
    }
    if (message.length > 2000) throw new BadRequestException("Message is too long.");

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const now = new Date();
    const convexId = `local_support_${randomUUID()}`;
    const contact = await this.prisma.supportContact.create({
      data: {
        convexId,
        userId,
        convexUserId: user.convexId,
        name: profile.name,
        email: user.email,
        phone: profile.phone,
        topic: opts.topic,
        subject: TOPIC_SUBJECTS[opts.topic],
        message,
        source: opts.source,
        status: "open",
        contactCreatedAt: now,
      },
    });
    await this.prisma.supportMessage.create({
      data: {
        convexId: `local_sm_${randomUUID()}`,
        contactId: contact.id,
        convexContactId: convexId,
        authorUserId: userId,
        convexAuthorUserId: user.convexId,
        authorRole: "member",
        body: message,
        messageCreatedAt: now,
      },
    });
    return { contactId: contact.id };
  }

  async replyAsMember(userId: string, contactId: string, messageRaw: string) {
    await this.rateLimitMember(userId);
    const contact = await this.prisma.supportContact.findUnique({
      where: { id: contactId },
    });
    if (!contact || contact.userId !== userId) {
      throw new NotFoundException("Contact not found");
    }
    if (contact.status === "closed") {
      throw new BadRequestException(
        "This conversation is closed. Start a new message."
      );
    }
    const message = messageRaw.trim();
    if (message.length < 2) throw new BadRequestException("Please write a message.");
    if (message.length > 2000) throw new BadRequestException("Message is too long.");

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const now = new Date();
    await this.prisma.supportMessage.create({
      data: {
        convexId: `local_sm_${randomUUID()}`,
        contactId,
        convexContactId: contact.convexId,
        authorUserId: userId,
        convexAuthorUserId: user.convexId,
        authorRole: "member",
        body: message,
        messageCreatedAt: now,
      },
    });
    await this.prisma.supportContact.update({
      where: { id: contactId },
      data: { status: "open", message },
    });
    return { ok: true };
  }

  async replyAsAdmin(adminId: string, contactId: string, messageRaw: string) {
    const contact = await this.prisma.supportContact.findUnique({
      where: { id: contactId },
    });
    if (!contact) throw new NotFoundException("Contact not found");
    if (!contact.userId) {
      throw new BadRequestException(
        "This contact has no member account — reply by email instead."
      );
    }
    const message = messageRaw.trim();
    if (message.length < 2) throw new BadRequestException("Please write a reply.");
    if (message.length > 2000) throw new BadRequestException("Message is too long.");

    const admin = await this.prisma.user.findUniqueOrThrow({ where: { id: adminId } });
    const now = new Date();
    await this.prisma.supportMessage.create({
      data: {
        convexId: `local_sm_${randomUUID()}`,
        contactId,
        convexContactId: contact.convexId,
        authorUserId: adminId,
        convexAuthorUserId: admin.convexId,
        authorRole: "admin",
        body: message,
        messageCreatedAt: now,
      },
    });

    const nextStatus =
      contact.status === "closed" ? ("reviewed" as const) : contact.status;
    await this.prisma.supportContact.update({
      where: { id: contactId },
      data: { status: nextStatus, message },
    });

    const member = await this.prisma.user.findUniqueOrThrow({
      where: { id: contact.userId },
    });
    await this.prisma.notification.create({
      data: {
        convexId: `local_notif_${randomUUID()}`,
        userId: contact.userId,
        convexUserId: member.convexId,
        type: "announcement",
        title: "Support reply",
        body: message.slice(0, 200),
        read: false,
        notificationCreatedAt: now,
      },
    });
    if (member.email) {
      await this.mail.send({
        to: member.email,
        subject: "Support reply",
        text: `${message}\n\nOpen: /profile`,
      });
    }
    await this.audit.write({
      actorUserId: adminId,
      action: "support_contact_reply",
      targetUserId: contact.userId,
      metadata: { contactId },
    });
    return { ok: true };
  }

  async listMine(userId: string) {
    const contacts = await this.prisma.supportContact.findMany({
      where: { userId },
      orderBy: { contactCreatedAt: "desc" },
      take: 10,
    });
    return Promise.all(
      contacts.map(async (c) => ({
        id: c.id,
        topic: c.topic,
        subject: c.subject,
        status: c.status,
        createdAt: c.contactCreatedAt.toISOString(),
        messages: await this.loadThread(c.id, c),
      }))
    );
  }

  async getMine(userId: string, contactId: string) {
    const contact = await this.prisma.supportContact.findUnique({
      where: { id: contactId },
    });
    if (!contact || contact.userId !== userId) {
      throw new NotFoundException("Contact not found");
    }
    return {
      ...contact,
      email: maskEmail(contact.email),
      messages: await this.loadThread(contact.id, contact),
    };
  }

  async listAdmin(opts: {
    status?: "open" | "reviewed" | "closed";
    cursor?: string;
    limit?: number;
  }) {
    const limit = parseLimit(String(opts.limit ?? 50), 50, 100);
    const rows = await this.prisma.supportContact.findMany({
      where: {
        ...(opts.status ? { status: opts.status } : {}),
        ...(opts.cursor ? { id: { lt: opts.cursor } } : {}),
      },
      orderBy: { contactCreatedAt: "desc" },
      take: limit + 1,
    });
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    return {
      items: page.map((c) => ({
        id: c.id,
        name: c.name,
        email: maskEmail(c.email),
        topic: c.topic,
        subject: c.subject,
        status: c.status,
        source: c.source,
        createdAt: c.contactCreatedAt.toISOString(),
        canReply: !!c.userId,
      })),
      nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
    };
  }

  async getAdmin(contactId: string) {
    const contact = await this.prisma.supportContact.findUnique({
      where: { id: contactId },
    });
    if (!contact) throw new NotFoundException("Contact not found");
    return {
      ...contact,
      email: maskEmail(contact.email),
      canReply: !!contact.userId,
      messages: await this.loadThread(contact.id, contact),
    };
  }

  async updateStatus(
    adminId: string,
    contactId: string,
    status: "open" | "reviewed" | "closed"
  ) {
    const contact = await this.prisma.supportContact.findUnique({
      where: { id: contactId },
    });
    if (!contact) throw new NotFoundException("Contact not found");
    await this.prisma.supportContact.update({
      where: { id: contactId },
      data: {
        status,
        reviewedAt: new Date(),
        reviewedById: adminId,
      },
    });
    await this.audit.write({
      actorUserId: adminId,
      action: `support_contact_${status}`,
      targetUserId: contact.userId,
      metadata: { contactId },
    });
    return { ok: true };
  }
}
