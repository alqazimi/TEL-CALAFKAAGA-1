import { v } from "convex/values";
import { action } from "./_generated/server";

const NOMINATIM_USER_AGENT =
  "HelCalafkaaga/1.0 (https://helcalafkaaga.com; hello@helcalafkaaga.com)";

export const reverseGeocode = action({
  args: {
    latitude: v.number(),
    longitude: v.number(),
  },
  handler: async (_ctx, args) => {
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
