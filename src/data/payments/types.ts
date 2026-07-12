export type PaymentsAdapter = {
  createRegistrationCheckout(tier: string): Promise<{ url?: string; [k: string]: unknown }>;
  createPremiumUpgradeCheckout(): Promise<{ url?: string; [k: string]: unknown }>;
  verifySession(sessionId: string): Promise<unknown>;
  getStatus(): Promise<unknown>;
  evc: {
    myLatest(): Promise<unknown>;
    submitProof(body: Record<string, unknown>): Promise<unknown>;
    signUpload(body: Record<string, unknown>): Promise<unknown>;
  };
};

export const PAYMENTS_METHOD_NAMES = [
  "createRegistrationCheckout",
  "createPremiumUpgradeCheckout",
  "verifySession",
  "getStatus",
] as const;

export const EVC_METHOD_NAMES = ["myLatest", "submitProof", "signUpload"] as const;
