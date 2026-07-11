"use client";

import { useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { useSafeQuery } from "@/lib/use-safe-query";
import { toast } from "sonner";
import { Headphones, Mail, Phone } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { LazyImage } from "@/components/ui/lazy-image";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "open" | "reviewed" | "closed";

interface AdminContactsInboxProps {
  onOpenUser?: (profileId: Id<"profiles">) => void;
}

export function AdminContactsInbox({ onOpenUser }: AdminContactsInboxProps) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<StatusFilter>("open");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const contacts = useSafeQuery(api.supportContacts.listSupportContacts, {
    status: filter === "all" ? undefined : filter,
  });
  const updateStatus = useMutation(api.supportContacts.updateSupportContactStatus);

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
              <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                {contact.message}
              </p>
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

            {contact.status === "open" && (
              <div className="space-y-3">
                <Textarea
                  className="rounded-xl text-sm"
                  rows={2}
                  placeholder={t("adminPage.adminNotesPh")}
                  value={notes[contact._id] ?? ""}
                  onChange={(e) =>
                    setNotes((prev) => ({ ...prev, [contact._id]: e.target.value }))
                  }
                />
                <div className="flex flex-wrap gap-2">
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
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
