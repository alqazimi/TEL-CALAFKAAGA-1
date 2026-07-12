import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    gender: v.optional(v.union(v.literal("male"), v.literal("female"))),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

  profiles: defineTable({
    userId: v.id("users"),
    name: v.string(),
    gender: v.union(v.literal("male"), v.literal("female")),
    age: v.number(),
    height: v.number(),
    weight: v.number(),
    country: v.string(),
    city: v.string(),
    /** Device GPS used to set country/city (anti-fake location). */
    locationLat: v.optional(v.number()),
    locationLng: v.optional(v.number()),
    locationAccuracyM: v.optional(v.number()),
    locationVerifiedAt: v.optional(v.number()),
    education: v.string(),
    occupation: v.string(),
    religiousLevel: v.string(),
    maritalStatus: v.string(),
    children: v.number(),
    bio: v.string(),
    profileImageId: v.optional(v.id("_storage")),
    verified: v.boolean(),
    role: v.union(v.literal("user"), v.literal("admin"), v.literal("owner")),
    phone: v.optional(v.string()),
    prayerFrequency: v.string(),
    spousePrayerImportance: v.optional(v.string()),
    wearsHijab: v.optional(v.boolean()),
    hasBeard: v.optional(v.boolean()),
    smokes: v.string(),
    substanceDetails: v.optional(v.string()),
    drinksAlcohol: v.string(),
    exercise: v.string(),
    wantChildren: v.string(),
    familyInvolvement: v.optional(v.string()),
    livingSituation: v.optional(v.string()),
    madhhab: v.optional(v.string()),
    polygynyOpenness: v.optional(v.string()),
    hasCurrentWife: v.optional(v.string()),
    openToSecondWife: v.optional(v.string()),
    acceptManWithWife: v.optional(v.string()),
    acceptPreviouslyMarriedMan: v.optional(v.string()),
    acceptFutureCoWife: v.optional(v.string()),
    languagesSpoken: v.optional(v.array(v.string())),
    citizenshipStatus: v.optional(v.string()),
    financialReadiness: v.optional(v.string()),
    marriageWorkPreference: v.optional(v.string()),
    marriageTimeline: v.string(),
    /** @deprecated Removed from questionnaire; kept for legacy prod documents */
    readyToRelocate: v.optional(v.string()),
    loveLanguage: v.optional(v.string()),
    marrySomeoneWithChildren: v.string(),
    qualities: v.array(v.string()),
    hobbies: v.array(v.string()),
    questionnaireComplete: v.boolean(),
    questionnaireStep: v.optional(v.number()),
    lastSavedAt: v.optional(v.number()),
    registrationComplete: v.optional(v.boolean()),
    hasPaid: v.boolean(),
    /**
     * Set on first successful payment. Blocks gender changes that would
     * bypass women vs men pricing / approval rules.
     */
    genderLocked: v.optional(v.boolean()),
    trialEndsAt: v.optional(v.number()),
    hasPersonalSupport: v.optional(v.boolean()),
    advisorReviewed: v.optional(v.boolean()),
    additionalImageIds: v.optional(v.array(v.id("_storage"))),
    waliName: v.optional(v.string()),
    waliPhone: v.optional(v.string()),
    banned: v.boolean(),
    /**
     * @deprecated Prefer `reviewStatus`. Kept for legacy documents and admin UI
     * during the widen → migrate → narrow rollout.
     */
    approved: v.boolean(),
    /**
     * Independent moderation state. Do not infer from questionnaire completion.
     * Legacy docs without this field are resolved in `lib/reviewStatus.ts`.
     */
    reviewStatus: v.optional(
      v.union(
        v.literal("incomplete"),
        v.literal("pending_review"),
        v.literal("approved"),
        v.literal("rejected"),
        v.literal("suspended")
      )
    ),
    /**
     * Main photo visibility. Additional private photos use `privateImageIds`.
     * Default when missing: visible to everyone (legacy behavior).
     */
    photoVisibility: v.optional(
      v.union(
        v.literal("everyone"),
        v.literal("matches"),
        v.literal("private")
      )
    ),
    /** Photos only shareable after an explicit request/approval (future). */
    privateImageIds: v.optional(v.array(v.id("_storage"))),
  })
    .index("by_userId", ["userId"])
    .index("by_gender", ["gender"])
    .index("by_country", ["country"])
    .index("by_approved", ["approved"])
    .index("by_reviewStatus", ["reviewStatus"])
    .index("by_role", ["role"]),

  preferences: defineTable({
    userId: v.id("users"),
    preferredGender: v.union(v.literal("male"), v.literal("female")),
    minAge: v.number(),
    maxAge: v.number(),
    minHeight: v.number(),
    maxHeight: v.number(),
    preferredCountries: v.array(v.string()),
    acceptChildren: v.string(),
    educationLevel: v.string(),
    religiousLevel: v.optional(v.string()),
    acceptDivorcee: v.string(),
    acceptWidow: v.string(),
    maxDistance: v.optional(v.string()),
    qualities: v.array(v.string()),
    hobbies: v.array(v.string()),
    partnerBeard: v.optional(v.string()),
    partnerHijabLevel: v.optional(v.string()),
    /** @deprecated Removed from questionnaire; kept for legacy prod documents */
    readyToRelocate: v.optional(v.string()),
  }).index("by_userId", ["userId"]),

  compatibilityScores: defineTable({
    userA: v.id("users"),
    userB: v.id("users"),
    score: v.number(),
  })
    .index("by_userA", ["userA"])
    .index("by_userB", ["userB"])
    .index("by_pair", ["userA", "userB"]),

  likes: defineTable({
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    action: v.union(v.literal("like"), v.literal("pass"), v.literal("shortlist")),
  })
    .index("by_from", ["fromUserId"])
    .index("by_to", ["toUserId"])
    .index("by_pair", ["fromUserId", "toUserId"]),

  matches: defineTable({
    userA: v.id("users"),
    userB: v.id("users"),
    score: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("archived"),
      v.literal("unmatched")
    ),
    chatUnlocked: v.boolean(),
    /** When each participant last opened this match (JSON map of userId → timestamp). */
    seenAtByUser: v.optional(v.record(v.string(), v.number())),
    archivedAt: v.optional(v.number()),
  })
    .index("by_userA", ["userA"])
    .index("by_userB", ["userB"]),

  conversations: defineTable({
    matchId: v.id("matches"),
    participants: v.array(v.id("users")),
    lastMessageAt: v.number(),
    /** Per-participant unread counts (userId → count). Avoids scanning all messages. */
    unreadByUser: v.optional(v.record(v.string(), v.number())),
  }).index("by_match", ["matchId"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    message: v.string(),
    imageId: v.optional(v.id("_storage")),
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_sender", ["senderId"]),

  typingIndicators: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    isTyping: v.boolean(),
  }).index("by_conversation_user", ["conversationId", "userId"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("like"),
      v.literal("match"),
      v.literal("message"),
      v.literal("announcement"),
      v.literal("approval"),
      v.literal("payment")
    ),
    title: v.string(),
    body: v.string(),
    read: v.boolean(),
    relatedUserId: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_read", ["userId", "read"]),

  payments: defineTable({
    userId: v.id("users"),
    stripeSessionId: v.string(),
    amount: v.number(),
    paymentType: v.optional(
      v.union(
        v.literal("registration"),
        v.literal("registration_premium"),
        v.literal("premium_upgrade"),
        v.literal("chat")
      )
    ),
    registrationTier: v.optional(
      v.union(v.literal("basic"), v.literal("premium"))
    ),
    matchId: v.optional(v.id("matches")),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed")
    ),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_session", ["stripeSessionId"]),

  announcements: defineTable({
    title: v.string(),
    body: v.string(),
    createdAt: v.number(),
    createdBy: v.id("users"),
    /** When set and > now (and sentAt unset), waiting for cron delivery. */
    scheduledFor: v.optional(v.number()),
    /** Set when notifications were fan-out to members. */
    sentAt: v.optional(v.number()),
    audience: v.optional(
      v.union(
        v.literal("all"),
        v.literal("paid"),
        v.literal("trial"),
        v.literal("unpaid")
      )
    ),
  }),

  userUploads: defineTable({
    userId: v.id("users"),
    storageId: v.id("_storage"),
    createdAt: v.number(),
  }).index("by_storage", ["storageId"]),

  staffInvites: defineTable({
    email: v.string(),
    token: v.string(),
    role: v.literal("admin"),
    invitedBy: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("revoked"),
      v.literal("expired")
    ),
    createdAt: v.number(),
    expiresAt: v.number(),
    acceptedAt: v.optional(v.number()),
    acceptedByUserId: v.optional(v.id("users")),
  })
    .index("by_token", ["token"])
    .index("by_email", ["email"])
    .index("by_status", ["status"]),

  blocks: defineTable({
    blockerId: v.id("users"),
    blockedId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_blocker", ["blockerId"])
    .index("by_blocked", ["blockedId"])
    .index("by_pair", ["blockerId", "blockedId"]),

  reports: defineTable({
    reporterId: v.id("users"),
    reportedUserId: v.id("users"),
    reason: v.string(),
    details: v.optional(v.string()),
    status: v.union(
      v.literal("open"),
      v.literal("reviewed"),
      v.literal("dismissed")
    ),
    priority: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high"))
    ),
    adminNotes: v.optional(v.string()),
    resolution: v.optional(v.string()),
    createdAt: v.number(),
    reviewedAt: v.optional(v.number()),
    reviewedBy: v.optional(v.id("users")),
  })
    .index("by_reporter", ["reporterId"])
    .index("by_reported", ["reportedUserId"])
    .index("by_status", ["status"])
    .index("by_pair", ["reporterId", "reportedUserId"]),

  /** Member / visitor messages to staff (photo upload help, contact form, etc.). */
  supportContacts: defineTable({
    userId: v.optional(v.id("users")),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    topic: v.union(
      v.literal("photo_upload"),
      v.literal("account"),
      v.literal("payment"),
      v.literal("other"),
      v.literal("contact_form")
    ),
    subject: v.string(),
    message: v.string(),
    imageId: v.optional(v.id("_storage")),
    source: v.union(
      v.literal("profile"),
      v.literal("questionnaire"),
      v.literal("contact_page"),
      v.literal("other")
    ),
    status: v.union(
      v.literal("open"),
      v.literal("reviewed"),
      v.literal("closed")
    ),
    adminNotes: v.optional(v.string()),
    createdAt: v.number(),
    reviewedAt: v.optional(v.number()),
    reviewedBy: v.optional(v.id("users")),
  })
    .index("by_status", ["status"])
    .index("by_user", ["userId"])
    .index("by_createdAt", ["createdAt"]),

  /** Thread replies on a support contact (member ↔ admin). */
  supportMessages: defineTable({
    contactId: v.id("supportContacts"),
    authorUserId: v.optional(v.id("users")),
    authorRole: v.union(
      v.literal("member"),
      v.literal("admin"),
      v.literal("visitor")
    ),
    body: v.string(),
    createdAt: v.number(),
  }).index("by_contact", ["contactId"]),

  memberEmailLog: defineTable({
    userId: v.id("users"),
    kind: v.union(
      v.literal("reminder_profile"),
      v.literal("reminder_payment"),
      v.literal("reminder_trial_ending"),
      v.literal("reminder_signup_incomplete"),
      v.literal("request_profile_photo")
    ),
    sentAt: v.number(),
  }).index("by_user_kind", ["userId", "kind"]),

  /** Abuse protection for public actions (contact, geolocation). */
  rateLimitBuckets: defineTable({
    key: v.string(),
    windowStart: v.number(),
    count: v.number(),
  }).index("by_key", ["key"]),

  /**
   * Singleton admin dashboard counters (key = "global").
   * Rebuilt in the background so getStats/getAnalytics never full-scan profiles.
   */
  siteMetrics: defineTable({
    key: v.literal("global"),
    totalUsers: v.number(),
    maleUsers: v.number(),
    femaleUsers: v.number(),
    approvedMale: v.number(),
    approvedFemale: v.number(),
    approvedTotal: v.number(),
    paidBasicMembers: v.number(),
    freeBasicWomen: v.number(),
    paidPremiumCount: v.number(),
    unpaidCount: v.number(),
    trialCount: v.number(),
    pendingApproval: v.number(),
    bannedUsers: v.number(),
    paidMembers: v.number(),
    memberCount: v.number(),
    completeMembers: v.number(),
    trialMembers: v.number(),
    genderBreakdown: v.object({
      male: v.number(),
      female: v.number(),
      unknown: v.number(),
    }),
    reviewBreakdown: v.object({
      incomplete: v.number(),
      pending_review: v.number(),
      approved: v.number(),
      rejected: v.number(),
      suspended: v.number(),
    }),
    countryBreakdown: v.record(v.string(), v.number()),
    monthlySignups: v.record(v.string(), v.number()),
    updatedAt: v.number(),
    rebuildScheduledAt: v.optional(v.number()),
  }).index("by_key", ["key"]),

  /** Immutable staff action history for admin accountability. */
  auditLogs: defineTable({
    actorUserId: v.id("users"),
    action: v.string(),
    targetUserId: v.optional(v.id("users")),
    targetProfileId: v.optional(v.id("profiles")),
    metadata: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_createdAt", ["createdAt"])
    .index("by_actor", ["actorUserId"])
    .index("by_targetUser", ["targetUserId"]),

  /**
   * Manual EVC / mobile-money payment proofs.
   * Member pays Axmed Xaaji, uploads screenshot; admin approves.
   */
  evcPaymentProofs: defineTable({
    userId: v.id("users"),
    profileId: v.id("profiles"),
    tier: v.union(v.literal("basic"), v.literal("premium")),
    payerFullName: v.string(),
    lastFourDigits: v.string(),
    screenshotId: v.id("_storage"),
    amountCents: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    createdAt: v.number(),
    reviewedAt: v.optional(v.number()),
    reviewedBy: v.optional(v.id("users")),
    rejectionReason: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_status_createdAt", ["status", "createdAt"]),
});
