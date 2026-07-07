import { NextResponse } from "next/server";

/** Legacy route — checkout is handled by Convex Stripe actions. */
export async function POST() {
  return NextResponse.json(
    { error: "Use in-app payment at /payment" },
    { status: 410 }
  );
}
