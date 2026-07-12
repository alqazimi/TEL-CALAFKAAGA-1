import { apiClient } from "../api-client";
import type { PreferencesAdapter } from "./types";

export const apiPreferences: PreferencesAdapter = {
  async getPreferences() {
    return apiClient.get("/preferences/me");
  },
  async updatePreferences(patch) {
    return apiClient.patch("/preferences/me", patch);
  },
};
