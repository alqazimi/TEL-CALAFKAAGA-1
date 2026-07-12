import { getConvexClient } from "@/lib/convex-client";
import { api } from "../../../convex/_generated/api";
import type { QuestionnaireAdapter } from "./types";

export const convexQuestionnaire: QuestionnaireAdapter = {
  async updateQuestionnaire(step, data) {
    const client = getConvexClient();
    return client.mutation(api.profiles.updateQuestionnaire, {
      step,
      data,
    } as never);
  },
  async autoSave(step, data) {
    const client = getConvexClient();
    return client.mutation(api.profiles.autoSaveProfile, {
      step,
      data,
    } as never);
  },
  async completeQuestionnaire(data) {
    const client = getConvexClient();
    return client.mutation(api.profiles.completeQuestionnaire, (data ?? {}) as never);
  },
  async saveProfileEdits(data) {
    const client = getConvexClient();
    return client.mutation(api.profiles.saveProfileEdits, { data } as never);
  },
};
