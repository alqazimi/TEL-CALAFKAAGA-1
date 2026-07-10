"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import {
  Send,
  Image as ImageIcon,
  Smile,
  Lock,
  MessageCircle,
  Heart,
  ArrowLeft,
  Check,
  CheckCheck,
} from "lucide-react";
import { LazyEmojiPicker, type EmojiClickData } from "@/components/chat/lazy-emoji-picker";
import { api } from "../../../../convex/_generated/api";
import { ProfileLockedGate } from "@/components/profile/profile-locked-gate";
import { PaymentGate } from "@/components/payment/payment-gate";
import type { Conversation, ChatMessage, Profile } from "@/types";
import type { Preferences } from "@/lib/profile-progress";
import { hasPaidAccess } from "@/lib/access";
import { useStaffRedirect } from "@/hooks/use-staff-redirect";
import { isMemberProfileReady, isProfileQueriesLoading } from "@/lib/profile-progress";
import { isInTrialPeriod, isTrialExpired } from "@/lib/trial";
import { TrialBanner } from "@/components/payment/trial-banner";
import { REGISTRATION_PRICE, PERSONAL_SUPPORT_PRICE } from "@/lib/constants";
import { Id } from "../../../../convex/_generated/dataModel";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { MemberDataLoading } from "@/components/auth/member-data-loading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTime } from "@/lib/utils";
import { LazyImage } from "@/components/ui/lazy-image";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";
import { useMarkNotificationsRead } from "@/hooks/use-mark-notifications-read";
import { ReportBlockMenu } from "@/components/safety/report-block-menu";
import { ChatSafetyBanner } from "@/components/chat/chat-safety-banner";
import { TrustBadges } from "@/components/profile/trust-badges";

function MessagesEmptyState() {
  const { t } = useTranslation();

  return (
    <Card className="border-border">
      <CardContent className="py-16 px-6 text-center max-w-md mx-auto">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-accent-foreground mx-auto mb-5">
          <MessageCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold mb-2">{t("chatPage.noMessages")}</h2>
        <p className="text-muted-foreground text-sm leading-relaxed mb-6">
          {t("chatPage.noMessagesDesc")}
        </p>
        <Button asChild>
          <Link href="/matches">
            <Heart className="h-4 w-4 mr-2" />
            {t("chatPage.browseMatches")}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function ChatShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-4 -mt-6 sm:mx-0 sm:mt-0 flex flex-col h-[calc(100dvh-var(--app-header)-var(--app-tabbar)-2.5rem)] lg:h-[min(calc(100dvh-10rem),42rem)]">
      {children}
    </div>
  );
}

export default function ChatPage() {
  const { t } = useTranslation();
  const { isStaff, isLoading: staffLoading } = useStaffRedirect();
  const [activeConversation, setActiveConversation] = useState<Id<"conversations"> | null>(null);
  const [message, setMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentUser = useQuery(api.users.currentUser);
  const profile = useQuery(
    api.profiles.getProfile,
    !staffLoading && !isStaff ? {} : "skip"
  ) as Profile | null | undefined;
  const preferences = useQuery(
    api.profiles.getPreferences,
    !staffLoading && !isStaff ? {} : "skip"
  ) as Preferences | null | undefined;
  const queriesLoading =
    !isStaff && isProfileQueriesLoading(profile, preferences);
  const profileReady =
    !!profile &&
    !queriesLoading &&
    (profile.questionnaireComplete || isMemberProfileReady(profile, preferences));

  const conversations = useQuery(
    api.messages.getConversations,
    profileReady ? undefined : "skip"
  ) as Conversation[] | undefined;

  const messages = useQuery(
    api.messages.getMessages,
    activeConversation ? { conversationId: activeConversation } : "skip"
  ) as ChatMessage[] | undefined;

  const isTyping = useQuery(
    api.messages.getTypingStatus,
    activeConversation ? { conversationId: activeConversation } : "skip"
  );

  const sendMessage = useMutation(api.messages.sendMessage);
  const markAsRead = useMutation(api.messages.markAsRead);
  const setTyping = useMutation(api.messages.setTyping);
  const generateUploadUrl = useMutation(api.profiles.generateUploadUrl);
  const registerUpload = useMutation(api.profiles.registerUpload);

  const activeConv = conversations?.find((c) => c.conversationId === activeConversation);
  const myUserId = currentUser?.userId;
  const showMobileChat = activeConversation && activeConv;

  useMarkNotificationsRead(
    ["message"],
    profileReady,
    activeConv?.profile?.userId
  );

  useEffect(() => {
    if (activeConversation) {
      markAsRead({ conversationId: activeConversation });
    }
  }, [activeConversation, messages?.length, markAsRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || !activeConversation) return;
    try {
      await sendMessage({ conversationId: activeConversation, message: message.trim() });
      setMessage("");
      setShowEmoji(false);
    } catch (error) {
      if (error instanceof Error && error.message.includes("payment")) {
        toast.error(t("chatPage.paymentRequired", { price: REGISTRATION_PRICE }));
      } else {
        toast.error(t("chatPage.sendFailed"));
      }
    }
  };

  const handleTyping = (value: string) => {
    setMessage(value);
    if (!activeConversation) return;
    setTyping({ conversationId: activeConversation, isTyping: true });
    clearTimeout(typingTimeoutRef.current ?? undefined);
    typingTimeoutRef.current = setTimeout(() => {
      setTyping({ conversationId: activeConversation, isTyping: false });
    }, 2000);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConversation) return;
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();
      await registerUpload({ storageId });
      await sendMessage({
        conversationId: activeConversation,
        message: t("chatPage.imageMessage"),
        imageId: storageId,
      });
    } catch {
      toast.error(t("chatPage.uploadFailed"));
    }
  };

  const openConversation = (conv: Conversation) => {
    if (conv.conversationId) {
      setActiveConversation(conv.conversationId);
    }
  };

  if (staffLoading || isStaff) {
    return (
      <DashboardLayout>
        <ChatShell>
          <div className="flex flex-1 flex-col gap-4" role="status" aria-busy>
            <Skeleton className="flex-1 w-full rounded-none sm:rounded-2xl" aria-hidden />
          </div>
        </ChatShell>
      </DashboardLayout>
    );
  }

  if (queriesLoading) {
    return (
      <DashboardLayout>
        <ChatShell>
          <MemberDataLoading pending />
        </ChatShell>
      </DashboardLayout>
    );
  }

  if (profile && !profileReady) {
    return (
      <DashboardLayout>
        <ProfileLockedGate
          profile={profile}
          preferences={preferences}
          title={t("chatPage.completeProfileTitle")}
          description={t("chatPage.completeProfileDesc")}
        />
      </DashboardLayout>
    );
  }

  if (profile && !hasPaidAccess(profile)) {
    return (
      <DashboardLayout>
        <PaymentGate
          title={
            isTrialExpired(profile)
              ? t("payment.trialEndedTitle")
              : t("payment.profileReadyTitle")
          }
          description={
            isTrialExpired(profile)
              ? t("payment.trialEndedDesc", {
                  basic: REGISTRATION_PRICE,
                  premium: PERSONAL_SUPPORT_PRICE,
                })
              : t("payment.profileReadyDesc", {
                  basic: REGISTRATION_PRICE,
                  premium: PERSONAL_SUPPORT_PRICE,
                })
          }
        />
      </DashboardLayout>
    );
  }

  if (conversations === undefined) {
    return (
      <DashboardLayout>
        <ChatShell>
          <Skeleton className="flex-1 w-full rounded-none sm:rounded-2xl" />
        </ChatShell>
      </DashboardLayout>
    );
  }

  if (conversations.length === 0) {
    return (
      <DashboardLayout>
        <MessagesEmptyState />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <ChatShell>
        <div className="flex flex-1 min-h-0 rounded-none sm:rounded-2xl border-y sm:border border-border overflow-hidden bg-card shadow-sm">
          {/* Conversation list */}
          <div
            className={cn(
              "w-full sm:w-80 lg:w-96 border-r border-border flex flex-col bg-card",
              showMobileChat ? "hidden sm:flex" : "flex"
            )}
          >
            <div className="px-4 py-3.5 border-b border-border">
              <h2 className="text-sm font-bold">{t("chatPage.messages")}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {conversations.length}{" "}
                {conversations.length === 1
                  ? t("chatPage.conversation")
                  : t("chatPage.conversations")}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {conversations.map((conv) => {
                const isActive = activeConversation === conv.conversationId;
                return (
                  <button
                    key={conv.matchId}
                    type="button"
                    onClick={() => openConversation(conv)}
                    disabled={!conv.conversationId}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    <Avatar className="h-11 w-11 shrink-0">
                      <AvatarImage src={conv.profile?.imageUrl ?? undefined} />
                      <AvatarFallback className="bg-muted text-foreground font-medium">
                        {conv.profile?.name?.charAt(0) ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold truncate text-sm">
                          {conv.profile?.name ?? t("chatPage.match")}
                        </p>
                        {conv.unreadCount > 0 && (
                          <Badge className="text-[10px] h-5 min-w-5 px-1.5 shrink-0">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {conv.lastMessage ?? t("chatPage.sayHello")}
                      </p>
                    </div>
                    {!conv.chatUnlocked && (
                      <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat panel */}
          <div
            className={cn(
              "flex-1 flex flex-col min-w-0 bg-background",
              showMobileChat ? "flex" : "hidden sm:flex"
            )}
          >
            {activeConversation && activeConv ? (
              <>
                <div className="px-4 py-3 border-b border-border flex items-center gap-3 bg-card/95 backdrop-blur-sm">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="sm:hidden shrink-0 rounded-xl h-9 w-9"
                    onClick={() => setActiveConversation(null)}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={activeConv.profile?.imageUrl ?? undefined} />
                    <AvatarFallback className="bg-muted font-medium">
                      {activeConv.profile?.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm truncate">
                      {activeConv.profile?.name}
                    </p>
                    {activeConv.profile && (
                      <TrustBadges profile={activeConv.profile} size="sm" className="mt-1" />
                    )}
                    {!activeConv.chatUnlocked ? (
                      <p className="text-xs text-muted-foreground mt-1">{t("chatPage.locked")}</p>
                    ) : isTyping ? (
                      <p className="text-xs text-primary mt-1">{t("chatPage.typing")}</p>
                    ) : null}
                  </div>
                  {activeConv.profile?.userId && (
                    <ReportBlockMenu
                      compact
                      userId={activeConv.profile.userId}
                      userName={activeConv.profile.name}
                      reportContext={t("safety.reportFromChat", {
                        name: activeConv.profile.name,
                      })}
                      onDone={() => setActiveConversation(null)}
                    />
                  )}
                </div>

                {!activeConv.chatUnlocked ? (
                  <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center max-w-xs">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground mx-auto mb-4">
                        <Lock className="h-7 w-7" />
                      </div>
                      <h3 className="text-lg font-bold mb-2">{t("chatPage.unlockChat")}</h3>
                      <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                        {t("chatPage.unlockChatDesc", {
                          price: REGISTRATION_PRICE,
                          name: activeConv.profile?.name?.split(" ")[0] ?? t("chatPage.match"),
                        })}
                      </p>
                      <Button asChild>
                        <Link href="/payment">
                          {t("chatPage.pay", { price: REGISTRATION_PRICE })}
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <ChatSafetyBanner />
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                      {messages?.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted mb-3">
                            <MessageCircle className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <p className="text-sm font-medium">{t("chatPage.startConversation")}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {t("chatPage.sayHelloTo", {
                              name: activeConv.profile?.name?.split(" ")[0] ?? "",
                            })}
                          </p>
                          <p className="text-xs text-muted-foreground mt-4 max-w-xs leading-relaxed">
                            {t("chatPage.safetyReminder")}
                          </p>
                        </div>
                      )}
                      {messages?.map((msg) => {
                        const isMine = msg.senderId === myUserId;
                        return (
                          <div
                            key={msg._id}
                            className={cn("flex", isMine ? "justify-end" : "justify-start")}
                          >
                            <div
                              className={cn(
                                "max-w-[80%] rounded-2xl px-3.5 py-2 shadow-sm",
                                isMine
                                  ? "bg-primary text-primary-foreground rounded-br-md"
                                  : "bg-card border border-border rounded-bl-md"
                              )}
                            >
                              {msg.imageUrl && (
                                <LazyImage
                                  src={msg.imageUrl}
                                  alt={t("chatPage.sharedImage")}
                                  className="rounded-xl max-w-full mb-1.5"
                                />
                              )}
                              <p className="text-sm leading-relaxed">{msg.message}</p>
                              <div className="flex items-center justify-end gap-1 mt-1">
                                <p
                                  className={cn(
                                    "text-[10px]",
                                    isMine ? "text-primary-foreground/70" : "text-muted-foreground"
                                  )}
                                >
                                  {formatTime(msg.createdAt)}
                                </p>
                                {isMine && (
                                  <span className="inline-flex" title={msg.read ? t("chatPage.read") : t("chatPage.sent")}>
                                    {msg.read ? (
                                      <CheckCheck className="h-3.5 w-3.5 text-primary-foreground/85" />
                                    ) : (
                                      <Check className="h-3.5 w-3.5 text-primary-foreground/60" />
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>

                    <div className="p-3 sm:p-4 border-t border-border bg-card">
                      {showEmoji && (
                        <div className="mb-3 overflow-hidden rounded-xl border border-border">
                          <LazyEmojiPicker
                            onEmojiClick={(emoji: EmojiClickData) =>
                              setMessage((prev) => prev + emoji.emoji)
                            }
                            width="100%"
                            height={260}
                          />
                        </div>
                      )}
                      <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted/40 p-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          onClick={() => setShowEmoji(!showEmoji)}
                          className="shrink-0 rounded-xl h-9 w-9 text-muted-foreground"
                        >
                          <Smile className="h-5 w-5" />
                        </Button>
                        <label className="cursor-pointer shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="rounded-xl h-9 w-9 text-muted-foreground"
                          >
                            <span>
                              <ImageIcon className="h-5 w-5" />
                            </span>
                          </Button>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                          />
                        </label>
                        <Input
                          value={message}
                          onChange={(e) => handleTyping(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                          placeholder={t("chatPage.typeMessage")}
                          className="flex-1 h-10 border-0 bg-transparent shadow-none focus-visible:ring-0 px-2"
                        />
                        <Button
                          size="icon"
                          type="button"
                          onClick={handleSend}
                          disabled={!message.trim()}
                          className="shrink-0 rounded-xl h-9 w-9"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center max-w-xs">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground mx-auto mb-4">
                    <MessageCircle className="h-7 w-7" />
                  </div>
                  <p className="font-bold mb-1">{t("chatPage.selectConversation")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("chatPage.selectConversationDesc")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </ChatShell>
    </DashboardLayout>
  );
}
