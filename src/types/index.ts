import { Id } from "../../convex/_generated/dataModel";

export interface Profile {
  _id: Id<"profiles">;
  userId: Id<"users">;
  name: string;
  gender: "male" | "female";
  age: number;
  height: number;
  weight: number;
  country: string;
  city: string;
  education: string;
  occupation: string;
  religiousLevel: string;
  maritalStatus: string;
  children: number;
  bio: string;
  profileImageId?: Id<"_storage">;
  prayerFrequency?: string;
  spousePrayerImportance?: string;
  wearsHijab?: boolean;
  hasBeard?: boolean;
  smokes?: string;
  substanceDetails?: string;
  drinksAlcohol?: string;
  exercise?: string;
  wantChildren?: string;
  familyInvolvement?: string;
  livingSituation?: string;
  polygynyOpenness?: string;
  hasCurrentWife?: string;
  openToSecondWife?: string;
  acceptManWithWife?: string;
  acceptPreviouslyMarriedMan?: string;
  acceptFutureCoWife?: string;
  languagesSpoken?: string[];
  citizenshipStatus?: string;
  financialReadiness?: string;
  marriageWorkPreference?: string;
  marriageTimeline?: string;
  loveLanguage?: string;
  marrySomeoneWithChildren?: string;
  verified: boolean;
  role: "user" | "admin" | "owner";
  phone?: string;
  qualities: string[];
  hobbies: string[];
  questionnaireComplete: boolean;
  questionnaireStep?: number;
  lastSavedAt?: number;
  registrationComplete?: boolean;
  hasPaid: boolean;
  trialEndsAt?: number;
  isInTrial?: boolean;
  hasPersonalSupport?: boolean;
  advisorReviewed?: boolean;
  additionalImageIds?: Id<"_storage">[];
  additionalImageUrls?: string[];
  waliName?: string;
  waliPhone?: string;
  isPremium?: boolean;
  banned: boolean;
  approved: boolean;
  reviewStatus?:
    | "incomplete"
    | "pending_review"
    | "approved"
    | "rejected"
    | "suspended";
  photoVisibility?: "everyone" | "matches" | "private";
  privateImageIds?: Id<"_storage">[];
  imageUrl?: string | null;
  paidCents?: number;
  email?: string | null;
}

export interface MatchResult {
  userId: Id<"users">;
  name: string;
  age: number;
  country: string;
  city?: string;
  height?: number;
  education: string;
  occupation: string;
  religiousLevel: string;
  prayerFrequency?: string;
  imageUrl: string | null;
  additionalImageUrls?: string[];
  photoHidden?: boolean;
  photoVisibility?: "everyone" | "matches" | "private";
  score: number;
  liked?: boolean;
  shortlisted?: boolean;
  verified?: boolean;
  hasPaid?: boolean;
  hasPersonalSupport?: boolean;
  advisorReviewed?: boolean;
  questionnaireComplete?: boolean;
  bio?: string;
  maritalStatus?: string;
  marriageTimeline?: string;
  wantChildren?: string;
}

export interface Conversation {
  matchId: Id<"matches">;
  conversationId?: Id<"conversations">;
  chatUnlocked: boolean;
  status?: "active" | "archived" | "unmatched";
  isNew?: boolean;
  score?: number;
  profile: {
    name: string;
    imageUrl: string | null;
    photoHidden?: boolean;
    userId: Id<"users">;
    verified?: boolean;
    hasPaid?: boolean;
    questionnaireComplete?: boolean;
  } | null;
  lastMessage: string | null;
  lastMessageAt: number;
  unreadCount: number;
}

export interface ChatMessage {
  _id: Id<"messages">;
  conversationId: Id<"conversations">;
  senderId: Id<"users">;
  message: string;
  imageUrl?: string | null;
  read: boolean;
  createdAt: number;
}

export interface Notification {
  _id: Id<"notifications">;
  type: "like" | "match" | "message" | "announcement" | "approval" | "payment";
  title: string;
  body: string;
  read: boolean;
  relatedUserId?: Id<"users">;
  relatedImageUrl?: string | null;
  createdAt: number;
}

export type MemberReminderId =
  | "complete-profile"
  | "complete-payment"
  | "free-trial-active"
  | "pending-approval"
  | "browse-matches";

export interface MemberReminder {
  id: MemberReminderId;
  href: string;
}

export interface AdminStats {
  totalUsers: number;
  maleUsers: number;
  femaleUsers: number;
  totalMatches: number;
  totalMessages: number;
  revenue: number;
  paidBasicCount: number;
  paidPremiumCount: number;
  unpaidCount: number;
  trialCount?: number;
  pendingApproval: number;
  bannedUsers: number;
  isOwner: boolean;
}

export interface AdminPayment {
  _id: Id<"payments">;
  userId: Id<"users">;
  stripeSessionId: string;
  amount: number;
  paymentType?: "registration" | "registration_premium" | "premium_upgrade" | "chat";
  registrationTier?: "basic" | "premium";
  status: "pending" | "completed" | "failed";
  createdAt: number;
  userName: string;
  userEmail: string | null;
  userPhone?: string | null;
}

export interface AdminAnalytics {
  countryBreakdown: Record<string, number>;
  monthlySignups: Record<string, number>;
  genderBreakdown?: Record<string, number>;
  reviewBreakdown?: Record<string, number>;
  trialMembers?: number;
  paidMembers?: number;
  memberCount?: number;
  matchRate: number;
  conversionRate: number;
}

export interface CurrentUser {
  userId: Id<"users">;
  email: string | null;
  profile: Profile | null;
}

export interface MutualMatch {
  matchId: Id<"matches">;
  conversationId?: Id<"conversations">;
  score: number;
  chatUnlocked: boolean;
  status?: "active" | "archived" | "unmatched";
  isNew?: boolean;
  lastMessageAt?: number;
  profile: {
    name: string;
    age?: number;
    country?: string;
    city?: string;
    imageUrl: string | null;
    photoHidden?: boolean;
    userId: Id<"users">;
    reviewStatus?: string;
    approved?: boolean;
  } | null;
}
