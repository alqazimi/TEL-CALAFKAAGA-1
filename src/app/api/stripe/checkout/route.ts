import { NextResponse } from "next/server";
import { isTrustedOrigin } from "@/lib/security/app-defense";

/** Legacy route — checkout is handled by Convex Stripe actions. */
export async function POST(request: Request) {
  if (!isTrustedOrigin(request)) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  return NextResponse.json(
    { error: "Use in-app payment at /payment" },
    { status: 410 }
  );
}
