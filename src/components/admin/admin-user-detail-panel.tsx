"use client";

import { motion } from "framer-motion";
import { useMutation, useQuery } from "convex/react";
import {
  X,
  Mail,
  Phone,
  MapPin,
  Crown,
  Headphones,
  Loader2,
  UserRound,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { TrustBadges } from "@/components/profile/trust-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CITIZENSHIP_NOT_REQUIRED_COUNTRIES } from "@/lib/constants";
import { isOwnerRole, isStaffRole } from "@/lib/access";
import { useTranslation } from "@/lib/i18n/context";

interface AdminUserDetailPanelProps {
  profileId: Id<"profiles">;
  onClose: () => void;
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

export function AdminUserDetailPanel({ profileId, onClose }: AdminUserDetailPanelProps) {
  const { t } = useTranslation();
  const detail = useQuery(api.admin.getUserDetail, { profileId });
  const setAdvisorReviewed = useMutation(api.admin.setAdvisorReviewed);

  const yesNo = (value: boolean | undefined) => {
    if (value === undefined) return "—";
    return value ? t("adminDetail.yes") : t("adminDetail.no");
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
                    <Badge variant={detail.profile.questionnaireComplete ? "default" : "secondary"}>
                      {detail.profile.questionnaireComplete
                        ? t("adminDetail.profileComplete")
                        : t("adminDetail.profileIncomplete")}
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
                          void setAdvisorReviewed({
                            profileId,
                            advisorReviewed: !detail.profile.advisorReviewed,
                          })
                        }
                      >
                        {detail.profile.advisorReviewed
                          ? t("adminDetail.advisorReviewed")
                          : t("adminDetail.markAdvisorReviewed")}
                      </Button>
                    )}
                  </div>
                </div>
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
      </motion.div>
    </div>
  );
}
