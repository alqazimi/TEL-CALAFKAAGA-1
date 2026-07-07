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
  prayerFrequency?: string;
  spousePrayerImportance?: string;
  wearsHijab?: boolean;
  smokes?: string;
  drinksAlcohol?: string;
  exercise?: string;
  wantChildren?: string;
  readyToRelocate?: string;
  marriageTimeline?: string;
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
  hasPersonalSupport?: boolean;
  banned: boolean;
  approved: boolean;
  imageUrl?: string | null;
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
  bio?: string;
  imageUrl: string | null;
  score: number;
  liked?: boolean;
}

export interface Conversation {
  matchId: Id<"matches">;
  conversationId?: Id<"conversations">;
  chatUnlocked: boolean;
  profile: {
    name: string;
    imageUrl: string | null;
    userId: Id<"users">;
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
  type: "like" | "match" | "message" | "announcement";
  title: string;
  body: string;
  read: boolean;
  relatedUserId?: Id<"users">;
  relatedImageUrl?: string | null;
  createdAt: number;
}

export interface AdminStats {
  totalUsers: number;
  maleUsers: number;
  femaleUsers: number;
  totalMatches: number;
  totalMessages: number;
  revenue: number;
  pendingApproval: number;
  bannedUsers: number;
  isOwner: boolean;
}

export interface AdminAnalytics {
  countryBreakdown: Record<string, number>;
  monthlySignups: Record<string, number>;
  matchRate: number;
  conversionRate: number;
}

export interface CurrentUser {
  userId: Id<"users">;
  profile: Profile | null;
}

export interface MutualMatch {
  matchId: Id<"matches">;
  conversationId?: Id<"conversations">;
  score: number;
  chatUnlocked: boolean;
  profile: (Profile & { userId: Id<"users"> }) | null;
}
