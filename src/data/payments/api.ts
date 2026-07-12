import { apiClient } from "../api-client";
import { track } from "../telemetry";
import type { PaymentsAdapter } from "./types";

export const apiPayments: PaymentsAdapter = {
  async createRegistrationCheckout(tier) {
    try {
      return await apiClient.post("/payments/stripe/registration-checkout", {
        tier,
      });
    } catch (e) {
      track("checkout_failure");
      throw e;
    }
  },
  async createPremiumUpgradeCheckout() {
    try {
      return await apiClient.post(
        "/payments/stripe/premium-upgrade-checkout",
        {}
      );
    } catch (e) {
      track("checkout_failure");
      throw e;
    }
  },
  async verifySession(sessionId) {
    return apiClient.post("/payments/stripe/verify-session", { sessionId });
  },
  async getStatus() {
    return apiClient.get("/payments/status");
  },
  evc: {
    async myLatest() {
      return apiClient.get("/payments/evc/me/latest");
    },
    async submitProof(body) {
      return apiClient.post("/payments/evc/proof/submit", body);
    },
    async signUpload(body) {
      return apiClient.post("/payments/evc/proof/sign-upload", body);
    },
  },
};
