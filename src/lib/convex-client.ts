import { ConvexReactClient } from "convex/react";

/** Used only when NEXT_PUBLIC_CONVEX_URL is missing during Next.js build/prerender. */
const BUILD_PLACEHOLDER_URL = "https://build-placeholder.convex.cloud";

export function isConvexConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);
}

export function getConvexUrl(): string {
  return process.env.NEXT_PUBLIC_CONVEX_URL ?? BUILD_PLACEHOLDER_URL;
}

let convexClient: ConvexReactClient | undefined;

export function getConvexClient(): ConvexReactClient {
  if (!convexClient) {
    convexClient = new ConvexReactClient(getConvexUrl());
  }
  return convexClient;
}
