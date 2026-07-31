"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAdminStatusPeriodReport } from "@/data/admin/hooks";
import { useTranslation } from "@/lib/i18n/context";

const PRESETS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last_7_days", label: "Last 7 days" },
  { value: "last_30_days", label: "Last 30 days" },
  { value: "this_week", label: "This week" },
  { value: "last_week", label: "Last week" },
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "this_year", label: "This year" },
  { value: "all_time", label: "All time" },
] as const;

type PeriodCurrent = {
  registrations?: number;
  approved?: number;
  rejected?: number;
  pendingSnapshot?: number;
  paused?: number;
  resumed?: number;
  banned?: number;
  unbanned?: number;
  suspended?: number;
  activeUsers?: number;
  messages?: number;
  reports?: number;
  appealsSubmitted?: number;
};

function Stat({
  label,
  value,
  delta,
}: {
  label: string;
  value: number | undefined;
  delta?: { diff: number; pct: number | null };
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 px-3 py-2.5">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-xl font-semibold tabular-nums mt-0.5">{value ?? "—"}</p>
      {delta ? (
        <p className="text-xs text-muted-foreground mt-0.5">
          {delta.diff >= 0 ? "+" : ""}
          {delta.diff}
          {delta.pct == null ? "" : ` (${delta.pct >= 0 ? "+" : ""}${delta.pct}%)`}
        </p>
      ) : null}
    </div>
  );
}

export function AdminStatusPeriodPanel({ enabled }: { enabled: boolean }) {
  const { t } = useTranslation();
  const {
    report,
    preset,
    setPreset,
    tz,
    setTz,
    country,
    setCountry,
    refresh,
  } = useAdminStatusPeriodReport(enabled);

  const payload = report as
    | {
        current?: PeriodCurrent;
        comparison?: {
          deltas?: Record<string, { diff: number; pct: number | null }>;
        };
        refreshedAt?: string;
        range?: { from: string; to: string; timeZone: string };
      }
    | null
    | undefined;

  const current = payload?.current;
  const deltas = payload?.comparison?.deltas ?? {};

  return (
    <Card className="border-border">
      <CardContent className="p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-semibold text-lg">
              {t("adminPage.statusPeriodTitle")}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("adminPage.statusPeriodHint")} · TZ {tz}
              {payload?.refreshedAt
                ? ` · ${new Date(payload.refreshedAt).toLocaleString()}`
                : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
              value={preset}
              onChange={(e) => setPreset(e.target.value)}
            >
              {PRESETS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <input
              className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm w-36"
              placeholder="Country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
            <input
              className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm w-40"
              value={tz}
              onChange={(e) => setTz(e.target.value)}
              aria-label="Timezone"
            />
            <Button type="button" variant="outline" size="sm" onClick={refresh}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Refresh
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (!current) return;
                const lines = [
                  "metric,value",
                  `preset,${preset}`,
                  `timezone,${tz}`,
                  `country,${country || "all"}`,
                  ...Object.entries(current).map(
                    ([k, v]) => `${k},${String(v)}`
                  ),
                ];
                const blob = new Blob([lines.join("\n")], {
                  type: "text/csv;charset=utf-8",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "status-period-report.csv";
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              CSV
            </Button>
          </div>
        </div>

        {report === undefined ? (
          <p className="text-sm text-muted-foreground">Loading period stats…</p>
        ) : report === null ? (
          <p className="text-sm text-destructive">Could not load period report.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            <Stat label="Registrations" value={current?.registrations} delta={deltas.registrations} />
            <Stat label="Approved" value={current?.approved} delta={deltas.approved} />
            <Stat label="Rejected" value={current?.rejected} delta={deltas.rejected} />
            <Stat label="Pending now" value={current?.pendingSnapshot} />
            <Stat label="Paused" value={current?.paused} delta={deltas.paused} />
            <Stat label="Resumed" value={current?.resumed} delta={deltas.resumed} />
            <Stat label="Banned" value={current?.banned} delta={deltas.banned} />
            <Stat label="Unbanned" value={current?.unbanned} delta={deltas.unbanned} />
            <Stat label="Suspended" value={current?.suspended} delta={deltas.suspended} />
            <Stat label="Active users" value={current?.activeUsers} delta={deltas.activeUsers} />
            <Stat label="Messages" value={current?.messages} delta={deltas.messages} />
            <Stat label="Reports" value={current?.reports} delta={deltas.reports} />
            <Stat label="Appeals" value={current?.appealsSubmitted} delta={deltas.appealsSubmitted} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
