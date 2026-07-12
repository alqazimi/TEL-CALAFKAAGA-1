import { getConvexClient } from "@/lib/convex-client";
import { api } from "../../../convex/_generated/api";
import { track } from "../telemetry";
import type { PaymentsAdapter } from "./types";

export const convexPayments: PaymentsAdapter = {
  async createRegistrationCheckout(tier) {
    try {
      const client = getConvexClient();
      return await client.action(api.stripeActions.createRegistrationCheckout, {
        tier,
      } as never);
    } catch (e) {
      track("checkout_failure");
      throw e;
    }
  },
  async createPremiumUpgradeCheckout() {
    try {
      const client = getConvexClient();
      return await client.action(
        api.stripeActions.createPremiumUpgradeCheckout,
        {}
      );
    } catch (e) {
      track("checkout_failure");
      throw e;
    }
  },
  async verifySession(sessionId) {
    const client = getConvexClient();
    return client.action(api.stripeActions.verifyCheckoutSession, {
      sessionId,
    } as never);
  },
  async getStatus() {
    const client = getConvexClient();
    return client.query(api.payments.getPaymentStatus, {});
  },
  evc: {
    async myLatest() {
      const client = getConvexClient();
      return client.query(api.evcPayments.myLatestProof, {});
    },
    async submitProof(body) {
      const client = getConvexClient();
      return client.mutation(api.evcPayments.submitProof, body as never);
    },
    async signUpload() {
      const client = getConvexClient();
      const uploadUrl = await client.mutation(
        api.profiles.generateUploadUrl,
        {}
      );
      return { uploadUrl };
    },
  },
};
