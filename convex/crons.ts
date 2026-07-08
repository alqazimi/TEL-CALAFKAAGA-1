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

export default crons;
