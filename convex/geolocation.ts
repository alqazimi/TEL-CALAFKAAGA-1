import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

const NOMINATIM_USER_AGENT =
  "HelCalafkaaga/1.0 (https://helcalafkaaga.com; hello@helcalafkaaga.com)";

/** 30 lookups per authenticated user per hour */
const GEO_LIMIT = 30;
const GEO_WINDOW_MS = 60 * 60 * 1000;

export const reverseGeocode = action({
  args: {
    latitude: v.number(),
    longitude: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    if (
      !Number.isFinite(args.latitude) ||
      !Number.isFinite(args.longitude) ||
      args.latitude < -90 ||
      args.latitude > 90 ||
      args.longitude < -180 ||
      args.longitude > 180
    ) {
      throw new Error("Invalid coordinates");
    }

    const rate = await ctx.runMutation(internal.rateLimit.checkAndIncrement, {
      key: `geocode:${userId}`,
      limit: GEO_LIMIT,
      windowMs: GEO_WINDOW_MS,
    });
    if (!rate.allowed) {
      throw new Error("Location lookup limit reached. Please try again later.");
    }

    const params = new URLSearchParams({
      format: "json",
      lat: String(args.latitude),
      lon: String(args.longitude),
      zoom: "10",
      addressdetails: "1",
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${params}`,
      {
        headers: {
          "User-Agent": NOMINATIM_USER_AGENT,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Location lookup failed");
    }

    const data = (await response.json()) as {
      display_name?: string;
      address?: Record<string, string | undefined>;
    };

    const address = data.address ?? {};
    const country = address.country?.trim() ?? "";
    const city =
      address.city ??
      address.town ??
      address.village ??
      address.municipality ??
      address.county ??
      address.state_district ??
      "";

    return {
      country,
      city: String(city).trim(),
      displayName: data.display_name ?? "",
    };
  },
});
