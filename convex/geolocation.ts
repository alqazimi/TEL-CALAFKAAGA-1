import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { matchCountry, normalizeCity } from "./lib/locationMatch";

const NOMINATIM_USER_AGENT =
  "HelCalafkaaga/1.0 (https://helcalafkaaga.com; hello@helcalafkaaga.com)";

/** 30 lookups per authenticated user per hour */
const GEO_LIMIT = 30;
const GEO_WINDOW_MS = 60 * 60 * 1000;

async function reverseGeocodeCoords(latitude: number, longitude: number) {
  const params = new URLSearchParams({
    format: "json",
    lat: String(latitude),
    lon: String(longitude),
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
  const cityCandidate =
    address.city ??
    address.town ??
    address.village ??
    address.municipality ??
    address.city_district ??
    address.suburb ??
    address.county ??
    address.state_district ??
    address.state ??
    "";

  let city = String(cityCandidate).trim();
  // Last resort: first segment of display name (e.g. "Mogadishu, ...")
  if (!city && data.display_name) {
    city = data.display_name.split(",")[0]?.trim() ?? "";
  }

  return {
    country,
    city,
    displayName: data.display_name ?? "",
  };
}

function assertValidCoords(latitude: number, longitude: number) {
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error("Invalid coordinates");
  }
}

/** Lookup only — prefer verifyAndSaveLocation for questionnaire. */
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

    assertValidCoords(args.latitude, args.longitude);

    const rate = await ctx.runMutation(internal.rateLimit.checkAndIncrement, {
      key: `geocode:${userId}`,
      limit: GEO_LIMIT,
      windowMs: GEO_WINDOW_MS,
    });
    if (!rate.allowed) {
      throw new Error("Location lookup limit reached. Please try again later.");
    }

    return reverseGeocodeCoords(args.latitude, args.longitude);
  },
});

/**
 * Reverse-geocode GPS on the server and save country/city + coords.
 * Manual country/city is still allowed when GPS is unavailable.
 */
export const verifyAndSaveLocation = action({
  args: {
    latitude: v.number(),
    longitude: v.number(),
    accuracy: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    assertValidCoords(args.latitude, args.longitude);

    const rate = await ctx.runMutation(internal.rateLimit.checkAndIncrement, {
      key: `geocode:${userId}`,
      limit: GEO_LIMIT,
      windowMs: GEO_WINDOW_MS,
    });
    if (!rate.allowed) {
      throw new Error("Location lookup limit reached. Please try again later.");
    }

    const raw = await reverseGeocodeCoords(args.latitude, args.longitude);
    const country = matchCountry(raw.country);
    if (!country) {
      throw new Error("COUNTRY_UNSUPPORTED");
    }

    const city = normalizeCity(raw.city);
    if (!city) {
      throw new Error("CITY_MISSING");
    }

    const accuracy =
      typeof args.accuracy === "number" && Number.isFinite(args.accuracy)
        ? Math.max(0, Math.min(args.accuracy, 50_000))
        : undefined;

    await ctx.runMutation(internal.geolocation.applyVerifiedLocation, {
      userId,
      country,
      city,
      latitude: args.latitude,
      longitude: args.longitude,
      accuracy,
    });

    return {
      country,
      city,
      displayName: raw.displayName,
    };
  },
});

export const applyVerifiedLocation = internalMutation({
  args: {
    userId: v.id("users"),
    country: v.string(),
    city: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    accuracy: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
    if (!profile) {
      throw new Error("Profile not found");
    }
    if (profile.banned) {
      throw new Error("Account is banned");
    }

    await ctx.db.patch(profile._id, {
      country: args.country,
      city: args.city,
      locationLat: args.latitude,
      locationLng: args.longitude,
      locationAccuracyM: args.accuracy,
      locationVerifiedAt: Date.now(),
      lastSavedAt: Date.now(),
    });
  },
});
