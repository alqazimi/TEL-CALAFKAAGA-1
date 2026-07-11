"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, MessageCircle, Search, UserRound } from "lucide-react";
import { useSafeQuery } from "@/lib/use-safe-query";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";

interface AdminMessagesInboxProps {
  onOpenUser: (profileId: Id<"profiles">) => void;
}

function formatListTime(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatBubbleTime(ts: number) {
  return new Date(ts).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminMessagesInbox({ onOpenUser }: AdminMessagesInboxProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversations = useSafeQuery(api.admin.getAdminConversations, { limit: 50 });
  const [search, setSearch] = useState("");
  const chatParam = searchParams.get("chat");
  const activeId = (chatParam || null) as Id<"conversations"> | null;
  const threadEndRef = useRef<HTMLDivElement>(null);

  const thread = useSafeQuery(
    api.admin.getAdminConversationThread,
    activeId ? { conversationId: activeId, limit: 500 } : "skip"
  );

  const filtered = useMemo(() => {
    if (!conversations) return [];
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const hay = `${c.memberA.name} ${c.memberB.name} ${c.lastMessage?.body ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [conversations, search]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages.length, activeId]);

  const activeConversation =
    conversations?.find((c) => c.conversationId === activeId) ?? null;
  const showThread = Boolean(activeId);

  const openConversation = (conversationId: Id<"conversations">) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "messages");
    params.set("chat", conversationId);
    params.delete("profile");
    // push so phone/browser Back returns to the inbox list (not home).
    router.push(`/admin?${params.toString()}`, { scroll: false });
  };

  const closeConversation = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "messages");
    params.delete("chat");
    params.delete("profile");
    router.push(`/admin?${params.toString()}`, { scroll: false });
  };

  return (
    <div
      className={cn(
        "overflow-hidden bg-card shadow-[var(--shadow-sm)]",
        "rounded-none border-0 sm:rounded-2xl sm:border sm:border-border",
        "-mx-4 sm:mx-0"
      )}
    >
      <div className="flex h-[min(78dvh,720px)] min-h-[480px] flex-col sm:h-[min(72vh,720px)] sm:min-h-[420px] sm:flex-row">
        <div
          className={cn(
            "flex w-full flex-col border-border sm:w-[340px] sm:border-r lg:w-[380px]",
            showThread ? "hidden sm:flex" : "flex"
          )}
        >
          <div className="space-y-3 border-b border-border px-4 py-3.5">
            <div>
              <h3 className="text-sm font-bold tracking-tight">{t("adminPage.inboxTitle")}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {conversations === undefined
                  ? t("common.loading")
                  : t("adminPage.inboxCount", {
                      count: filtered.length,
                    })}
              </p>
            </div>
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("adminPage.inboxSearch")}
                className="h-10 w-full rounded-xl border border-border bg-muted/40 pl-9 pr-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {conversations === undefined ? (
              <div className="space-y-2 p-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-4 py-14 text-center">
                <MessageCircle className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">{t("adminPage.noPlatformMessages")}</p>
              </div>
            ) : (
              <ul className="space-y-1">
                {filtered.map((conv) => {
                  const active = conv.conversationId === activeId;
                  const lastFromA = conv.lastMessage?.senderId === conv.memberA.userId;
                  const previewName = lastFromA ? conv.memberA.name : conv.memberB.name;
                  return (
                    <li key={conv.conversationId}>
                      <button
                        type="button"
                        onClick={() => openConversation(conv.conversationId)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors",
                          active ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                        )}
                      >
                        <div className="relative h-12 w-[4.25rem] shrink-0">
                          <Avatar className="absolute left-0 top-0 h-10 w-10 border-2 border-card">
                            <AvatarImage src={conv.memberA.imageUrl ?? undefined} />
                            <AvatarFallback className="text-xs font-semibold">
                              {conv.memberA.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <Avatar className="absolute bottom-0 right-0 h-10 w-10 border-2 border-card">
                            <AvatarImage src={conv.memberB.imageUrl ?? undefined} />
                            <AvatarFallback className="text-xs font-semibold">
                              {conv.memberB.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate text-sm font-semibold">
                              {conv.memberA.name}
                              <span className="mx-1 font-normal text-muted-foreground">·</span>
                              {conv.memberB.name}
                            </p>
                            <span className="shrink-0 text-[10px] text-muted-foreground">
                              {formatListTime(conv.lastMessageAt)}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {conv.lastMessage
                              ? `${previewName.split(" ")[0]}: ${
                                  conv.lastMessage.hasImage && !conv.lastMessage.body
                                    ? t("adminDetail.imageMessage")
                                    : conv.lastMessage.body
                                }`
                              : t("adminPage.inboxNoPreview")}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col bg-background",
            showThread ? "flex" : "hidden sm:flex"
          )}
        >
          {!activeId || !activeConversation ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                <MessageCircle className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold">{t("adminPage.inboxSelectTitle")}</p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                {t("adminPage.inboxSelectHint")}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 border-b border-border bg-card/95 px-3 py-3 backdrop-blur-sm sm:px-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 rounded-xl sm:hidden"
                  onClick={closeConversation}
                  aria-label={t("common.back")}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="relative h-10 w-14 shrink-0">
                    <Avatar className="absolute left-0 top-0 h-8 w-8 border-2 border-card">
                      <AvatarImage src={activeConversation.memberA.imageUrl ?? undefined} />
                      <AvatarFallback className="text-[10px]">
                        {activeConversation.memberA.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <Avatar className="absolute bottom-0 right-0 h-8 w-8 border-2 border-card">
                      <AvatarImage src={activeConversation.memberB.imageUrl ?? undefined} />
                      <AvatarFallback className="text-[10px]">
                        {activeConversation.memberB.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">
                      {activeConversation.memberA.name} & {activeConversation.memberB.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {t("adminPage.inboxModerationView")}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  {activeConversation.memberA.profileId && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-lg px-2 text-xs"
                      onClick={() => onOpenUser(activeConversation.memberA.profileId!)}
                    >
                      <UserRound className="mr-1 h-3.5 w-3.5" />
                      {activeConversation.memberA.name.split(" ")[0]}
                    </Button>
                  )}
                  {activeConversation.memberB.profileId && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-lg px-2 text-xs"
                      onClick={() => onOpenUser(activeConversation.memberB.profileId!)}
                    >
                      <UserRound className="mr-1 h-3.5 w-3.5" />
                      {activeConversation.memberB.name.split(" ")[0]}
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto px-3 py-4 sm:px-5">
                {thread === undefined ? (
                  <div className="space-y-3 py-6">
                    <Skeleton className="ml-auto h-12 w-2/3 rounded-2xl" />
                    <Skeleton className="h-12 w-2/3 rounded-2xl" />
                    <Skeleton className="ml-auto h-10 w-1/2 rounded-2xl" />
                  </div>
                ) : thread === null || thread.messages.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    {t("adminPage.inboxEmptyThread")}
                  </p>
                ) : (
                  <>
                    {thread.truncated ? (
                      <p className="rounded-xl bg-muted/60 px-3 py-2 text-center text-xs text-muted-foreground">
                        {t("adminPage.inboxTruncated")}
                      </p>
                    ) : (
                      <p className="text-center text-[11px] text-muted-foreground">
                        {t("adminPage.inboxScrollHint")}
                      </p>
                    )}
                    {thread.messages.map((msg) => {
                    const isMemberA = msg.senderId === thread.memberA?.userId;
                    return (
                      <div
                        key={msg.id}
                        className={cn("flex gap-2", isMemberA ? "justify-start" : "justify-end")}
                      >
                        {isMemberA && (
                          <Avatar className="mt-1 h-8 w-8 shrink-0">
                            <AvatarImage src={msg.senderImageUrl ?? undefined} />
                            <AvatarFallback className="text-[10px]">
                              {msg.senderName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={cn(
                            "max-w-[78%] rounded-2xl px-3.5 py-2 shadow-sm",
                            isMemberA
                              ? "rounded-bl-md border border-border bg-card"
                              : "rounded-br-md bg-primary text-primary-foreground"
                          )}
                        >
                          <div className="mb-1 flex items-center gap-2">
                            <button
                              type="button"
                              className={cn(
                                "text-[11px] font-semibold hover:underline",
                                isMemberA ? "text-foreground" : "text-primary-foreground/90"
                              )}
                              disabled={!msg.senderProfileId}
                              onClick={() => {
                                if (msg.senderProfileId) onOpenUser(msg.senderProfileId);
                              }}
                            >
                              {msg.senderName}
                            </button>
                            <Badge
                              variant="outline"
                              className={cn(
                                "h-4 px-1.5 text-[9px]",
                                isMemberA
                                  ? "border-border text-muted-foreground"
                                  : "border-primary-foreground/30 text-primary-foreground/80"
                              )}
                            >
                              {isMemberA
                                ? thread.memberA?.gender ?? "—"
                                : thread.memberB?.gender ?? "—"}
                            </Badge>
                          </div>
                          {msg.imageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={msg.imageUrl}
                              alt={t("adminDetail.imageMessage")}
                              className="mb-1.5 max-h-56 max-w-full rounded-xl object-cover"
                            />
                          )}
                          {msg.body ? (
                            <p className="text-sm leading-relaxed break-words">{msg.body}</p>
                          ) : null}
                          <p
                            className={cn(
                              "mt-1 text-right text-[10px]",
                              isMemberA ? "text-muted-foreground" : "text-primary-foreground/70"
                            )}
                          >
                            {formatBubbleTime(msg.createdAt)}
                          </p>
                        </div>
                        {!isMemberA && (
                          <Avatar className="mt-1 h-8 w-8 shrink-0">
                            <AvatarImage src={msg.senderImageUrl ?? undefined} />
                            <AvatarFallback className="text-[10px]">
                              {msg.senderName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    );
                  })}
                  </>
                )}
                <div ref={threadEndRef} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
