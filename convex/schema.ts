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
    smokes: v.string(),
    drinksAlcohol: v.string(),
    exercise: v.string(),
    wantChildren: v.string(),
    readyToRelocate: v.string(),
    marriageTimeline: v.string(),
    loveLanguage: v.optional(v.string()),
    marrySomeoneWithChildren: v.string(),
    qualities: v.array(v.string()),
    hobbies: v.array(v.string()),
    questionnaireComplete: v.boolean(),
    questionnaireStep: v.optional(v.number()),
    lastSavedAt: v.optional(v.number()),
    registrationComplete: v.optional(v.boolean()),
    hasPaid: v.boolean(),
    hasPersonalSupport: v.optional(v.boolean()),
    banned: v.boolean(),
    approved: v.boolean(),
  })
    .index("by_userId", ["userId"])
    .index("by_gender", ["gender"])
    .index("by_country", ["country"])
    .index("by_approved", ["approved"]),

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
    religiousLevel: v.string(),
    acceptDivorcee: v.string(),
    acceptWidow: v.string(),
    maxDistance: v.string(),
    qualities: v.array(v.string()),
    hobbies: v.array(v.string()),
    readyToRelocate: v.string(),
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
    action: v.union(v.literal("like"), v.literal("pass")),
  })
    .index("by_from", ["fromUserId"])
    .index("by_to", ["toUserId"])
    .index("by_pair", ["fromUserId", "toUserId"]),

  matches: defineTable({
    userA: v.id("users"),
    userB: v.id("users"),
    score: v.number(),
    status: v.union(v.literal("active"), v.literal("unmatched")),
    chatUnlocked: v.boolean(),
  })
    .index("by_userA", ["userA"])
    .index("by_userB", ["userB"]),

  conversations: defineTable({
    matchId: v.id("matches"),
    participants: v.array(v.id("users")),
    lastMessageAt: v.number(),
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
      v.literal("announcement")
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
    createdAt: v.number(),
    reviewedAt: v.optional(v.number()),
    reviewedBy: v.optional(v.id("users")),
  })
    .index("by_reporter", ["reporterId"])
    .index("by_reported", ["reportedUserId"])
    .index("by_status", ["status"])
    .index("by_pair", ["reporterId", "reportedUserId"]),
});
