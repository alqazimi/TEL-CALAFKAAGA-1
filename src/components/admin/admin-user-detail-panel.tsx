"use client";

import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import {
  X,
  Mail,
  Phone,
  MapPin,
  Crown,
  Headphones,
  Loader2,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { isOwnerRole, isStaffRole } from "@/lib/access";

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

function DetailGrid({ items }: { items: { label: string; value: string }[] }) {
  const filled = items.filter((i) => i.value && i.value !== "—");
  if (filled.length === 0) {
    return <p className="text-sm text-muted-foreground">Not provided yet.</p>;
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
  const detail = useQuery(api.admin.getUserDetail, { profileId });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 shrink-0">
          <p className="font-bold text-lg">User Profile</p>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="overflow-y-auto p-4 sm:p-6 space-y-5">
          {detail === undefined ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : detail === null ? (
            <p className="text-center text-muted-foreground py-16">User not found.</p>
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
                        Owner
                      </Badge>
                    )}
                    {detail.profile.role === "admin" && (
                      <Badge className="bg-primary/10 text-primary">Admin</Badge>
                    )}
                    {detail.profile.banned && (
                      <Badge className="bg-red-100 text-red-600">Banned</Badge>
                    )}
                    {!detail.profile.approved && (
                      <Badge className="bg-amber-100 text-amber-600">Pending</Badge>
                    )}
                    {detail.profile.hasPersonalSupport && (
                      <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                        <Headphones className="h-3 w-3 mr-1" />
                        Personal Support
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
                    <Badge variant={detail.profile.questionnaireComplete ? "default" : "secondary"}>
                      {detail.profile.questionnaireComplete ? "Profile complete" : "Profile incomplete"}
                    </Badge>
                    {!isStaffRole(detail.profile.role) && (
                      <Badge variant={detail.profile.hasPaid ? "default" : "outline"}>
                        {detail.profile.paidCents
                          ? `Paid $${(detail.profile.paidCents / 100).toFixed(0)}`
                          : detail.profile.hasPaid
                            ? "Paid"
                            : "Unpaid"}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <DetailSection title="Basic Information">
                <DetailGrid
                  items={[
                    { label: "Age", value: detail.profile.age ? String(detail.profile.age) : "—" },
                    { label: "Height", value: detail.profile.height ? `${detail.profile.height} cm` : "—" },
                    { label: "Weight", value: detail.profile.weight ? `${detail.profile.weight} kg` : "—" },
                    { label: "Country", value: detail.profile.country || "—" },
                    { label: "City", value: detail.profile.city || "—" },
                  ]}
                />
              </DetailSection>

              <DetailSection title="Religious Practice">
                <DetailGrid
                  items={[
                    { label: "Prayer Frequency", value: detail.profile.prayerFrequency || "—" },
                    ...(detail.profile.gender === "female"
                      ? [{
                          label: "Wears Hijab",
                          value:
                            detail.profile.wearsHijab !== undefined
                              ? detail.profile.wearsHijab
                                ? "Yes"
                                : "No"
                              : "—",
                        }]
                      : []),
                    { label: "Spouse Prayer Importance", value: detail.profile.spousePrayerImportance || "—" },
                  ]}
                />
              </DetailSection>

              <DetailSection title="Education & Work">
                <DetailGrid
                  items={[
                    { label: "Education", value: detail.profile.education || "—" },
                    { label: "Occupation", value: detail.profile.occupation || "—" },
                  ]}
                />
              </DetailSection>

              <DetailSection title="Marriage & Family">
                <DetailGrid
                  items={[
                    { label: "Marital Status", value: detail.profile.maritalStatus || "—" },
                    { label: "Children", value: detail.profile.children > 0 ? "Yes" : "No" },
                    {
                      label: "Marry Someone With Children",
                      value: detail.profile.marrySomeoneWithChildren || "—",
                    },
                  ]}
                />
              </DetailSection>

              <DetailSection title="Lifestyle">
                <DetailGrid
                  items={[
                    { label: "Smokes", value: detail.profile.smokes || "—" },
                    { label: "Exercise", value: detail.profile.exercise || "—" },
                  ]}
                />
              </DetailSection>

              <DetailSection title="About">
                <DetailGrid
                  items={[
                    { label: "Ready to Relocate", value: detail.profile.readyToRelocate || "—" },
                    { label: "Marriage Timeline", value: detail.profile.marriageTimeline || "—" },
                    { label: "Bio", value: detail.profile.bio || "—" },
                    {
                      label: "Qualities",
                      value: detail.profile.qualities?.length
                        ? detail.profile.qualities.join(", ")
                        : "—",
                    },
                    {
                      label: "Hobbies",
                      value: detail.profile.hobbies?.length
                        ? detail.profile.hobbies.join(", ")
                        : "—",
                    },
                  ]}
                />
              </DetailSection>

              {detail.preferences && (
                <DetailSection title="Partner Preferences">
                  <DetailGrid
                    items={[
                      {
                        label: "Preferred Age",
                        value: `${detail.preferences.minAge ?? "—"} – ${detail.preferences.maxAge ?? "—"}`,
                      },
                      {
                        label: "Preferred Height",
                        value: `${detail.preferences.minHeight ?? "—"} – ${detail.preferences.maxHeight ?? "—"} cm`,
                      },
                      {
                        label: "Preferred Countries",
                        value: detail.preferences.preferredCountries?.length
                          ? detail.preferences.preferredCountries.join(", ")
                          : "Any",
                      },
                      { label: "Preferred Education", value: detail.preferences.educationLevel || "—" },
                      { label: "Preferred Religious Level", value: detail.preferences.religiousLevel || "—" },
                      { label: "Accept Divorcee", value: detail.preferences.acceptDivorcee || "—" },
                      { label: "Accept Widow", value: detail.preferences.acceptWidow || "—" },
                      { label: "Accept Children", value: detail.preferences.acceptChildren || "—" },
                      { label: "Max Distance", value: detail.preferences.maxDistance || "—" },
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
