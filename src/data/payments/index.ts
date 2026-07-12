import { isApiProvider } from "../provider";
import { wrapWithShadowReads } from "../shadow";
import { apiPayments } from "./api";
import { convexPayments } from "./convex";
import type { PaymentsAdapter } from "./types";

export type { PaymentsAdapter } from "./types";
export { PAYMENTS_METHOD_NAMES, EVC_METHOD_NAMES } from "./types";

const SHADOW_READS = ["getStatus"] as const satisfies readonly (keyof PaymentsAdapter)[];

export function getPaymentsAdapter(): PaymentsAdapter {
  if (isApiProvider()) return apiPayments;
  return wrapWithShadowReads(convexPayments, apiPayments, [...SHADOW_READS]);
}

export const payments = new Proxy({} as PaymentsAdapter, {
  get(_t, prop: string) {
    const adapter = getPaymentsAdapter();
    const value = adapter[prop as keyof PaymentsAdapter];
    if (typeof value === "function") return value.bind(adapter);
    return value;
  },
});
