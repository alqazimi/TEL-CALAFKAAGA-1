"use client";

import { motion } from "framer-motion";
import {
  X,
  Mail,
  Phone,
  MapPin,
  Crown,
  Headphones,
  Loader2,
  UserRound,
  ImagePlus,
  Ban,
  Heart,
  CheckCircle,
} from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import {
  useAdminAdvisorReviewed,
  useAdminApproveUser,
  useAdminBanUser,
  useAdminRejectUser,
  useAdminRequestPhoto,
  useAdminUserActivity,
  useAdminUserDetail,
} from "@/data/admin/hooks";
import { TrustBadges } from "@/components/profile/trust-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CITIZENSHIP_NOT_REQUIRED_COUNTRIES } from "@/lib/constants";
import { isOwnerRole, isStaffRole } from "@/lib/access";
import { useTranslation } from "@/lib/i18n/context";
import { resolveReviewStatus, requiresAdminProfileApproval } from "@/lib/review-status";
import { toast } from "sonner";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { getSafeUserError } from "@/lib/safe-error";

interface AdminUserDetailPanelProps {
  profileId: Id<"profiles">;
  onClose: () => void;
  onOpenUser?: (profileId: Id<"profiles">) => void;
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
      <h3 className="font-bold text-sm uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  if (!value || value === "—") return null;
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-semibold text-sm mt-0.5 break-words">{value}</dd>
    </div>
  );
}

function DetailGrid({
  items,
  emptyLabel,
}: {
  items: { label: string; value: string }[];
  emptyLabel: string;
}) {
  const filled = items.filter((i) => i.value && i.value !== "—");
  if (filled.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
      {filled.map((item) => (
        <DetailRow key={item.label} label={item.label} value={item.value} />
      ))}
    </dl>
  );
}

export function AdminUserDetailPanel({ profileId, onClose, onOpenUser }: AdminUserDetailPanelProps) {
  const { t } = useTranslation();
  const detail = useAdminUserDetail(profileId, true) as any;
  const activityRaw = useAdminUserActivity(profileId, true);
  const activity = activityRaw as any;
  const setAdvisorReviewed = useAdminAdvisorReviewed();
  const requestProfilePhoto = useAdminRequestPhoto();
  const banUser = useAdminBanUser();
  const rejectUser = useAdminRejectUser();
  const approveUser = useAdminApproveUser();
  const [photoBusy, setPhotoBusy] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [confirm, setConfirm] = useState<"ban" | "unban" | "reject" | null>(null);

  const yesNo = (value: boolean | undefined) => {
    if (value === undefined) return "—";
    return value ? t("adminDetail.yes") : t("adminDetail.no");
  };

  const review = detail?.profile ? resolveReviewStatus(detail.profile) : null;
  const canModerate =
    detail?.profile &&
    !isStaffRole(detail.profile.role) &&
    !isOwnerRole(detail.profile.role);
  const canApproveDetail =
    !!detail?.profile &&
    canModerate &&
    requiresAdminProfileApproval(detail.profile) &&
    review !== "approved" &&
    review !== "suspended";

  const runApprove = async () => {
    setActionBusy(true);
    try {
      await approveUser(profileId);
      toast.success(t("adminPage.approveSuccess"));
    } catch (error) {
      toast.error(getSafeUserError(error, t("adminPage.actionFailed")));
    } finally {
      setActionBusy(false);
    }
  };

  const runModeration = async (type: "ban" | "unban" | "reject") => {
    if (!detail?.profile) return;
    setActionBusy(true);
    try {
      if (type === "reject") {
        await rejectUser(profileId);
        toast.success(t("adminPage.rejectSuccess"));
      } else {
        await banUser(profileId, type === "ban");
        toast.success(type === "ban" ? t("adminPage.banSuccess") : t("adminPage.unbanSuccess"));
      }
      setConfirm(null);
    } catch (error) {
      toast.error(getSafeUserError(error, t("adminPage.actionFailed")));
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border bg-gradient-to-r from-primary/10 to-transparent px-5 py-4 shrink-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <UserRound className="h-4 w-4" />
            </span>
            <p className="font-bold text-lg">{t("adminDetail.title")}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label={t("common.a11yClose")} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="overflow-y-auto p-4 sm:p-6 space-y-5">
          {detail === undefined ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : detail === null ? (
            <p className="text-center text-muted-foreground py-16">{t("adminDetail.notFound")}</p>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <Avatar className="h-24 w-24 border-2 border-border shrink-0">
                  <AvatarImage src={detail.profile.imageUrl ?? undefined} />
                  <AvatarFallback className="text-2xl">
                    {detail.profile.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-2xl font-bold">{detail.profile.name}</h2>
                    <Badge variant="outline" className="capitalize">
                      {detail.profile.gender}
                    </Badge>
                    {isOwnerRole(detail.profile.role) && (
                      <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                        <Crown className="h-3 w-3 mr-1" />
                        {t("adminPage.badgeOwner")}
                      </Badge>
                    )}
                    {detail.profile.role === "admin" && (
                      <Badge className="bg-primary/10 text-primary">{t("adminPage.badgeAdmin")}</Badge>
                    )}
                    {detail.profile.banned && (
                      <Badge className="bg-red-100 text-red-600">{t("adminPage.badgeBanned")}</Badge>
                    )}
                    {!detail.profile.approved && (
                      <Badge className="bg-amber-100 text-amber-600">{t("adminPage.badgePending")}</Badge>
                    )}
                    {detail.profile.hasPersonalSupport && (
                      <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                        <Headphones className="h-3 w-3 mr-1" />
                        {t("adminPage.badgePersonalSupport")}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-4 w-4 shrink-0" />
                    {[detail.profile.city, detail.profile.country].filter(Boolean).join(", ") || "—"}
                  </p>
                  {detail.profile.email && (
                    <p className="text-sm flex items-center gap-2 truncate">
                      <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{detail.profile.email}</span>
                    </p>
                  )}
                  {detail.profile.phone && (
                    <p className="text-sm flex items-center gap-2">
                      <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                      {detail.profile.phone}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <TrustBadges profile={detail.profile} size="sm" />
                    <Badge
                      variant={
                        resolveReviewStatus(detail.profile) === "incomplete"
                          ? "secondary"
                          : "default"
                      }
                    >
                      {resolveReviewStatus(detail.profile) === "incomplete"
                        ? t("adminDetail.profileIncomplete")
                        : t("adminDetail.profileComplete")}
                    </Badge>
                    {!isStaffRole(detail.profile.role) && (
                      <Badge variant={detail.profile.hasPaid ? "default" : "outline"}>
                        {detail.profile.paidCents
                          ? `Paid $${(detail.profile.paidCents / 100).toFixed(0)}`
                          : detail.profile.hasPaid
                            ? t("adminPage.badgePaid")
                            : t("adminPage.unpaid")}
                      </Badge>
                    )}
                    {detail.profile.hasPersonalSupport && !isStaffRole(detail.profile.role) && (
                      <Button
                        type="button"
                        size="sm"
                        variant={detail.profile.advisorReviewed ? "secondary" : "outline"}
                        className="h-7 text-xs rounded-full"
                        onClick={() =>
                          void setAdvisorReviewed(
                            profileId,
                            !detail.profile.advisorReviewed
                          )
                        }
                      >
                        {detail.profile.advisorReviewed
                          ? t("adminDetail.advisorReviewed")
                          : t("adminDetail.markAdvisorReviewed")}
                      </Button>
                    )}
                    {!isStaffRole(detail.profile.role) && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs rounded-full"
                        disabled={photoBusy}
                        onClick={() => {
                          setPhotoBusy(true);
                          void requestProfilePhoto(profileId)
                            .then(() => toast.success(t("adminPage.requestPhotoSuccess")))
                            .catch((error: unknown) => {
                              toast.error(
                                error instanceof Error
                                  ? getSafeUserError(error, t("adminPage.actionFailed"))
                                  : t("adminPage.actionFailed")
                              );
                            })
                            .finally(() => setPhotoBusy(false));
                        }}
                      >
                        <ImagePlus className="mr-1 h-3.5 w-3.5" />
                        {t("adminPage.requestPhotoShort")}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {canModerate && (
                <DetailSection title={t("adminDetail.moderationTitle")}>
                  <div className="flex flex-wrap gap-2">
                    {canApproveDetail && (
                      <Button
                        size="sm"
                        className="rounded-lg"
                        disabled={actionBusy}
                        onClick={() => void runApprove()}
                      >
                        <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                        {t("adminPage.approveShort")}
                      </Button>
                    )}
                    {(review === "pending_review" ||
                      review === "approved" ||
                      review === "rejected") &&
                      requiresAdminProfileApproval(detail.profile) && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg"
                        disabled={actionBusy}
                        onClick={() => setConfirm("reject")}
                      >
                        {t("adminPage.rejectShort")}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg"
                      disabled={actionBusy}
                      onClick={() => setConfirm(detail.profile.banned ? "unban" : "ban")}
                    >
                      <Ban className="mr-1.5 h-3.5 w-3.5" />
                      {detail.profile.banned ? t("adminPage.unbanShort") : t("adminPage.banShort")}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">{t("adminDetail.moderationHint")}</p>
                </DetailSection>
              )}

              <DetailSection title={t("adminDetail.activityTitle")}>
                {!activity ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg border border-border bg-background p-2 text-center">
                      <p className="text-lg font-semibold tabular-nums">{activity.messageCount}</p>
                      <p className="text-[11px] text-muted-foreground">{t("adminDetail.messagesLabel")}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-background p-2 text-center">
                      <p className="text-lg font-semibold tabular-nums">{activity.likesGivenCount}</p>
                      <p className="text-[11px] text-muted-foreground">{t("adminDetail.likesGivenLabel")}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-background p-2 text-center">
                      <p className="text-lg font-semibold tabular-nums">{activity.likesReceivedCount}</p>
                      <p className="text-[11px] text-muted-foreground">{t("adminDetail.likesReceivedLabel")}</p>
                    </div>
                  </div>
                )}
              </DetailSection>

              <DetailSection title={t("adminDetail.recentMessages")}>
                {!activity ? (
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                ) : activity.messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("adminDetail.noMessages")}</p>
                ) : (
                  <ul className="max-h-64 space-y-2 overflow-y-auto">
                    {activity.messages.map((msg: any) => (
                      <li
                        key={msg.id}
                        className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      >
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px]",
                              msg.direction === "sent"
                                ? "border-sky-300 text-sky-700"
                                : "border-violet-300 text-violet-700"
                            )}
                          >
                            {msg.direction === "sent"
                              ? t("adminDetail.messageSent")
                              : t("adminDetail.messageReceived")}
                          </Badge>
                          <button
                            type="button"
                            className="font-medium text-foreground hover:underline"
                            disabled={!msg.peerProfileId || !onOpenUser}
                            onClick={() => {
                              if (msg.peerProfileId && onOpenUser) onOpenUser(msg.peerProfileId);
                            }}
                          >
                            {msg.peerName}
                          </button>
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(msg.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="break-words text-foreground/90">
                          {msg.hasImage && !msg.body ? t("adminDetail.imageMessage") : msg.body}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </DetailSection>

              <div className="grid gap-4 sm:grid-cols-2">
                <DetailSection title={t("adminDetail.likesGiven")}>
                  {!activity ? (
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                  ) : activity.likesGiven.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("adminDetail.noLikes")}</p>
                  ) : (
                    <ul className="max-h-48 space-y-1.5 overflow-y-auto">
                      {activity.likesGiven.map((like: any) => (
                        <li key={like.id}>
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-muted"
                            disabled={!like.peerProfileId || !onOpenUser}
                            onClick={() => {
                              if (like.peerProfileId && onOpenUser) onOpenUser(like.peerProfileId);
                            }}
                          >
                            <Heart className="h-3.5 w-3.5 text-primary" />
                            <span className="font-medium">{like.peerName}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </DetailSection>

                <DetailSection title={t("adminDetail.likesReceived")}>
                  {!activity ? (
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                  ) : activity.likesReceived.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("adminDetail.noLikes")}</p>
                  ) : (
                    <ul className="max-h-48 space-y-1.5 overflow-y-auto">
                      {activity.likesReceived.map((like: any) => (
                        <li key={like.id}>
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-muted"
                            disabled={!like.peerProfileId || !onOpenUser}
                            onClick={() => {
                              if (like.peerProfileId && onOpenUser) onOpenUser(like.peerProfileId);
                            }}
                          >
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="font-medium">{like.peerName}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </DetailSection>
              </div>

              <DetailSection title={t("adminDetail.basicInfo")}>
                <DetailGrid
                  emptyLabel={t("adminDetail.notProvided")}
                  items={[
                    { label: t("profilePage.age"), value: detail.profile.age ? String(detail.profile.age) : "—" },
                    {
                      label: t("profilePage.height"),
                      value: detail.profile.height ? `${detail.profile.height} cm` : "—",
                    },
                    {
                      label: t("profilePage.weight"),
                      value: detail.profile.weight ? `${detail.profile.weight} kg` : "—",
                    },
                    { label: t("profilePage.country"), value: detail.profile.country || "—" },
                    { label: t("profilePage.city"), value: detail.profile.city || "—" },
                  ]}
                />
              </DetailSection>

              <DetailSection title={t("adminDetail.religiousPractice")}>
                <DetailGrid
                  emptyLabel={t("adminDetail.notProvided")}
                  items={[
                    { label: t("profilePage.prayerFrequency"), value: detail.profile.prayerFrequency || "—" },
                    { label: t("adminDetail.religiousLevel"), value: detail.profile.religiousLevel || "—" },
                    ...(detail.profile.gender === "female"
                      ? [{
                          label: t("profilePage.wearsHijab"),
                          value: yesNo(detail.profile.wearsHijab),
                        }]
                      : []),
                    {
                      label: t("adminDetail.spousePrayerImportance"),
                      value: detail.profile.spousePrayerImportance || "—",
                    },
                  ]}
                />
              </DetailSection>

              <DetailSection title={t("adminDetail.educationWork")}>
                <DetailGrid
                  emptyLabel={t("adminDetail.notProvided")}
                  items={[
                    { label: t("profilePage.education"), value: detail.profile.education || "—" },
                    { label: t("profilePage.occupation"), value: detail.profile.occupation || "—" },
                  ]}
                />
              </DetailSection>

              <DetailSection title={t("adminDetail.marriageFamily")}>
                <DetailGrid
                  emptyLabel={t("adminDetail.notProvided")}
                  items={[
                    { label: t("profilePage.maritalStatus"), value: detail.profile.maritalStatus || "—" },
                    ...(detail.profile.maritalStatus !== "Never married"
                      ? [
                          {
                            label: t("adminDetail.children"),
                            value:
                              detail.profile.children > 0
                                ? t("adminDetail.yes")
                                : t("adminDetail.no"),
                          },
                        ]
                      : []),
                    { label: t("adminDetail.wantChildren"), value: detail.profile.wantChildren || "—" },
                    ...(detail.profile.gender === "male"
                      ? [
                          {
                            label: t("adminDetail.hasCurrentWife"),
                            value: detail.profile.hasCurrentWife || "—",
                          },
                          {
                            label: t("adminDetail.openToSecondWife"),
                            value:
                              detail.profile.openToSecondWife ||
                              detail.profile.polygynyOpenness ||
                              "—",
                          },
                        ]
                      : [
                          {
                            label: t("adminDetail.acceptPreviouslyMarriedMan"),
                            value: detail.profile.acceptPreviouslyMarriedMan || "—",
                          },
                          {
                            label: t("adminDetail.acceptFutureCoWife"),
                            value:
                              detail.profile.acceptFutureCoWife ||
                              detail.profile.polygynyOpenness ||
                              "—",
                          },
                        ]),
                    {
                      label: t("adminDetail.marryWithChildren"),
                      value: detail.profile.marrySomeoneWithChildren || "—",
                    },
                  ]}
                />
              </DetailSection>

              <DetailSection title={t("adminDetail.lifestyle")}>
                <DetailGrid
                  emptyLabel={t("adminDetail.notProvided")}
                  items={[
                    {
                      label: t("adminDetail.substanceUse"),
                      value:
                        detail.profile.smokes === "Yes"
                          ? detail.profile.substanceDetails
                            ? `Yes — ${detail.profile.substanceDetails}`
                            : "Yes"
                          : detail.profile.smokes === "No"
                            ? t("adminDetail.no")
                            : detail.profile.smokes || "—",
                    },
                    { label: "Exercise", value: detail.profile.exercise || "—" },
                  ]}
                />
              </DetailSection>

              <DetailSection title={t("adminDetail.about")}>
                <DetailGrid
                  emptyLabel={t("adminDetail.notProvided")}
                  items={[
                    ...(detail.profile.country &&
                    !CITIZENSHIP_NOT_REQUIRED_COUNTRIES.includes(
                      detail.profile.country as (typeof CITIZENSHIP_NOT_REQUIRED_COUNTRIES)[number]
                    )
                      ? [
                          {
                            label: t("adminDetail.citizenship"),
                            value: detail.profile.citizenshipStatus || "—",
                          },
                        ]
                      : []),
                    {
                      label: t("adminDetail.languages"),
                      value: detail.profile.languagesSpoken?.length
                        ? detail.profile.languagesSpoken.join(", ")
                        : "—",
                    },
                    ...(detail.profile.gender === "male"
                      ? [
                          {
                            label: t("adminDetail.financialReadiness"),
                            value: detail.profile.financialReadiness || "—",
                          },
                        ]
                      : [
                          {
                            label: t("adminDetail.marriageWorkPreference"),
                            value:
                              detail.profile.marriageWorkPreference ||
                              detail.profile.financialReadiness ||
                              "—",
                          },
                        ]),
                    {
                      label: t("adminDetail.livingSituation"),
                      value: detail.profile.livingSituation || "—",
                    },
                    { label: t("adminDetail.marriageTimeline"), value: detail.profile.marriageTimeline || "—" },
                    { label: t("profilePage.loveLanguage"), value: detail.profile.loveLanguage || "—" },
                    {
                      label: t("profilePage.qualities"),
                      value: detail.profile.qualities?.length
                        ? detail.profile.qualities.join(", ")
                        : "—",
                    },
                    {
                      label: t("profilePage.hobbies"),
                      value: detail.profile.hobbies?.length
                        ? detail.profile.hobbies.join(", ")
                        : "—",
                    },
                  ]}
                />
              </DetailSection>

              {detail.preferences && (
                <DetailSection title={t("adminDetail.partnerPreferences")}>
                  <DetailGrid
                    emptyLabel={t("adminDetail.notProvided")}
                    items={[
                      {
                        label: t("adminDetail.preferredAge"),
                        value: `${detail.preferences.minAge ?? "—"} – ${detail.preferences.maxAge ?? "—"}`,
                      },
                      {
                        label: t("adminDetail.preferredHeight"),
                        value: `${detail.preferences.minHeight ?? "—"} – ${detail.preferences.maxHeight ?? "—"} cm`,
                      },
                      {
                        label: t("adminDetail.preferredCountries"),
                        value: detail.preferences.preferredCountries?.length
                          ? detail.preferences.preferredCountries.join(", ")
                          : t("adminDetail.any"),
                      },
                      {
                        label: t("adminDetail.preferredEducation"),
                        value: detail.preferences.educationLevel || "—",
                      },
                      ...(detail.profile.gender === "male"
                        ? [
                            {
                              label: t("adminDetail.partnerHijabLevel"),
                              value: detail.preferences.partnerHijabLevel || "—",
                            },
                          ]
                        : []),
                      ...(detail.profile.marrySomeoneWithChildren !== "No"
                        ? [{
                            label: t("adminDetail.acceptChildren"),
                            value: detail.preferences.acceptChildren || "—",
                          }]
                        : []),
                    ]}
                  />
                </DetailSection>
              )}

            </>
          )}
        </div>

        {confirm && (
          <ConfirmDialog
            open
            title={
              confirm === "reject"
                ? t("adminPage.rejectConfirmTitle")
                : confirm === "ban"
                  ? t("adminPage.banConfirmTitle")
                  : t("adminPage.unbanConfirmTitle")
            }
            description={
              confirm === "reject"
                ? t("adminPage.rejectConfirm", { name: detail?.profile.name ?? "" })
                : confirm === "ban"
                  ? t("adminPage.banConfirm", { name: detail?.profile.name ?? "" })
                  : t("adminPage.unbanConfirm", { name: detail?.profile.name ?? "" })
            }
            confirmLabel={
              confirm === "reject"
                ? t("adminPage.rejectShort")
                : confirm === "ban"
                  ? t("adminPage.banShort")
                  : t("adminPage.unbanShort")
            }
            cancelLabel={t("common.cancel")}
            tone={confirm === "unban" ? "warning" : "danger"}
            busy={actionBusy}
            onCancel={() => {
              if (actionBusy) return;
              setConfirm(null);
            }}
            onConfirm={() => void runModeration(confirm)}
          />
        )}
      </motion.div>
    </div>
  );
}
