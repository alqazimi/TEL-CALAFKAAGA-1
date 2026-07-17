"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Headphones, Mail, Phone, Send } from "lucide-react";
import { useAdminSupportContacts } from "@/data/admin/hooks";
import {
  useAdminReplySupport,
  useAdminUpdateSupportStatus,
} from "@/data/support/hooks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { LazyImage } from "@/components/ui/lazy-image";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { getSafeUserError } from "@/lib/safe-error";

type StatusFilter = "all" | "open" | "reviewed" | "closed";

interface AdminContactsInboxProps {
  onOpenUser?: (profileId: string) => void;
}

type SupportContact = {
  _id: string;
  status: string;
  topic: string;
  source: string;
  profileId?: string | null;
  name: string;
  subject: string;
  thread: Array<{
    id: string;
    authorRole: string;
    body: string;
    createdAt: number;
  }>;
  imageUrl?: string | null;
  email?: string | null;
  phone?: string | null;
  createdAt: number;
  canReply?: boolean;
};

export function AdminContactsInbox({ onOpenUser }: AdminContactsInboxProps) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<StatusFilter>("open");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [sendingId, setSendingId] = useState<string | null>(null);
  const contacts = useAdminSupportContacts(true, {
    status: filter === "all" ? undefined : filter,
  }) as SupportContact[] | undefined;
  const updateStatus = useAdminUpdateSupportStatus();
  const replyAsAdmin = useAdminReplySupport();

  const filters: { value: StatusFilter; label: string }[] = [
    { value: "open", label: t("adminPage.contactsFilterOpen") },
    { value: "reviewed", label: t("adminPage.contactsFilterReviewed") },
    { value: "closed", label: t("adminPage.contactsFilterClosed") },
    { value: "all", label: t("adminPage.contactsFilterAll") },
  ];

  const topicLabel = useMemo(
    () =>
      ({
        photo_upload: t("adminPage.contactTopicPhoto"),
        account: t("adminPage.contactTopicAccount"),
        payment: t("adminPage.contactTopicPayment"),
        other: t("adminPage.contactTopicOther"),
        contact_form: t("adminPage.contactTopicForm"),
      }) as Record<string, string>,
    [t]
  );

  const sourceLabel = useMemo(
    () =>
      ({
        profile: t("adminPage.contactSourceProfile"),
        questionnaire: t("adminPage.contactSourceQuestionnaire"),
        contact_page: t("adminPage.contactSourcePage"),
        other: t("adminPage.contactSourceOther"),
      }) as Record<string, string>,
    [t]
  );

  const sendReply = async (contactId: string) => {
    const body = (replies[contactId] ?? "").trim();
    if (body.length < 2) {
      toast.error(t("adminPage.contactReplyTooShort"));
      return;
    }
    setSendingId(contactId);
    try {
      await replyAsAdmin({ contactId, message: body });
      toast.success(t("adminPage.contactReplySent"));
      setReplies((prev) => ({ ...prev, [contactId]: "" }));
    } catch (error) {
      toast.error(getSafeUserError(error, t("adminPage.contactReplyFailed"))
      );
    } finally {
      setSendingId(null);
    }
  };

  if (contacts === undefined) {
    return <Skeleton className="h-48 w-full rounded-2xl" />;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{t("adminPage.contactsTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("adminPage.contactsHint")}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              filter === item.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {contacts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-14 text-center">
          <Headphones className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{t("adminPage.noContacts")}</p>
        </div>
      ) : (
        contacts.map((contact) => (
          <div
            key={contact._id}
            className="space-y-3 rounded-2xl border border-border bg-card p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={contact.status === "open" ? "default" : "outline"}>
                {contact.status === "open"
                  ? t("adminPage.reportOpen")
                  : contact.status === "reviewed"
                    ? t("adminPage.reportReviewed")
                    : t("adminPage.contactsClosed")}
              </Badge>
              <Badge variant="outline">{topicLabel[contact.topic] ?? contact.topic}</Badge>
              <Badge variant="outline">{sourceLabel[contact.source] ?? contact.source}</Badge>
            </div>

            <div>
              {contact.profileId && onOpenUser ? (
                <button
                  type="button"
                  className="text-base font-semibold underline-offset-2 hover:underline"
                  onClick={() => onOpenUser(contact.profileId!)}
                >
                  {contact.name}
                </button>
              ) : (
                <p className="text-base font-semibold">{contact.name}</p>
              )}
              <p className="mt-0.5 text-sm font-medium text-foreground/90">
                {contact.subject}
              </p>
            </div>

            <div className="space-y-2 rounded-xl bg-muted/40 p-3">
              {contact.thread.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "rounded-xl px-3 py-2 text-sm",
                    msg.authorRole === "admin"
                      ? "ml-4 bg-primary/10 text-foreground"
                      : "mr-4 bg-background border border-border"
                  )}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                    {msg.authorRole === "admin"
                      ? t("adminPage.contactRoleAdmin")
                      : msg.authorRole === "visitor"
                        ? t("adminPage.contactRoleVisitor")
                        : t("adminPage.contactRoleMember")}
                  </p>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {new Date(msg.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            {contact.imageUrl && (
              <div className="h-28 w-28 overflow-hidden rounded-xl border border-border">
                <LazyImage
                  src={contact.imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="inline-flex items-center gap-1 hover:text-primary"
                >
                  <Mail className="h-3.5 w-3.5" />
                  {contact.email}
                </a>
              )}
              {contact.phone && (
                <a
                  href={`tel:${contact.phone}`}
                  className="inline-flex items-center gap-1 hover:text-primary"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {contact.phone}
                </a>
              )}
              <span>{new Date(contact.createdAt).toLocaleString()}</span>
            </div>

            {contact.canReply && contact.status !== "closed" && (
              <div className="space-y-2">
                <Textarea
                  className="rounded-xl text-sm"
                  rows={3}
                  placeholder={t("adminPage.contactReplyPh")}
                  value={replies[contact._id] ?? ""}
                  onChange={(e) =>
                    setReplies((prev) => ({ ...prev, [contact._id]: e.target.value }))
                  }
                />
                <Button
                  size="sm"
                  className="rounded-lg"
                  disabled={sendingId === contact._id}
                  onClick={() => void sendReply(contact._id)}
                >
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  {sendingId === contact._id
                    ? t("adminPage.contactReplySending")
                    : t("adminPage.contactReplySend")}
                </Button>
              </div>
            )}

            {!contact.canReply && (
              <p className="text-xs text-muted-foreground">{t("adminPage.contactReplyEmailOnly")}</p>
            )}

            <div className="flex flex-wrap gap-2 border-t border-border/70 pt-3">
              <Textarea
                className="rounded-xl text-sm"
                rows={2}
                placeholder={t("adminPage.adminNotesPh")}
                value={notes[contact._id] ?? ""}
                onChange={(e) =>
                  setNotes((prev) => ({
                    ...prev,
                    [contact._id]: e.target.value,
                  }))
                }
              />
              {contact.status === "open" && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg"
                    onClick={() =>
                      void updateStatus({
                        contactId: contact._id,
                        status: "reviewed",
                        adminNotes: notes[contact._id],
                      }).then(() => toast.success(t("adminPage.contactUpdated")))
                    }
                  >
                    {t("adminPage.markReviewed")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-lg"
                    onClick={() =>
                      void updateStatus({
                        contactId: contact._id,
                        status: "closed",
                        adminNotes: notes[contact._id],
                      }).then(() => toast.success(t("adminPage.contactUpdated")))
                    }
                  >
                    {t("adminPage.contactsMarkClosed")}
                  </Button>
                </>
              )}
              {contact.status !== "open" && contact.status !== "closed" && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-lg"
                  onClick={() =>
                    void updateStatus({
                      contactId: contact._id,
                      status: "closed",
                      adminNotes: notes[contact._id],
                    }).then(() => toast.success(t("adminPage.contactUpdated")))
                  }
                >
                  {t("adminPage.contactsMarkClosed")}
                </Button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
