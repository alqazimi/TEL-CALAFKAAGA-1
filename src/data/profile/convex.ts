import { getConvexClient } from "@/lib/convex-client";
import { api } from "../../../convex/_generated/api";
import type { ProfileAdapter } from "./types";

export const convexProfile: ProfileAdapter = {
  async getProfile() {
    const client = getConvexClient();
    return client.query(api.profiles.getProfile, {});
  },
  async updateProfile(patch) {
    const client = getConvexClient();
    return client.mutation(api.profiles.updateProfile, patch as never);
  },
  async ensureProfile() {
    const client = getConvexClient();
    return client.mutation(api.profiles.ensureProfile, {});
  },
  async completeRegistrationGender(gender) {
    const client = getConvexClient();
    return client.mutation(api.profiles.completeRegistrationGender, { gender });
  },
  async getAccessState() {
    // Access flags live on profile in Convex
    const profile = await this.getProfile();
    return profile;
  },
};
