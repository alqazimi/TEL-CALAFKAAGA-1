import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Expire stale pending checkouts and dedupe abandoned rows.
crons.interval(
  "reconcile abandoned payments",
  { hours: 6 },
  internal.payments.reconcileAbandonedPayments,
  {}
);

crons.interval(
  "member email reminders",
  { hours: 24 },
  internal.memberEmailReminders.run,
  {}
);

crons.interval(
  "deliver scheduled announcements",
  { minutes: 5 },
  internal.admin.deliverScheduledAnnouncements,
  {}
);

crons.interval(
  "rebuild site metrics",
  { minutes: 30 },
  internal.siteMetrics.rebuildCron,
  {}
);

export default crons;
