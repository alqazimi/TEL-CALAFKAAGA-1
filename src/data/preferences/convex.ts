import { getConvexClient } from "@/lib/convex-client";
import { api } from "../../../convex/_generated/api";
import type { PreferencesAdapter } from "./types";

export const convexPreferences: PreferencesAdapter = {
  async getPreferences() {
    const client = getConvexClient();
    return client.query(api.profiles.getPreferences, {});
  },
  async updatePreferences(patch) {
    // Preferences are updated via profile/questionnaire mutations in Convex
    const client = getConvexClient();
    return client.mutation(api.profiles.updateProfile, patch as never);
  },
};
