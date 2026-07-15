"use client";

import { useMutation } from "convex/react";
import type { FunctionReference } from "convex/server";
import { isApiProvider } from "@/data/provider";

/**
 * Like Convex `useMutation`, but safe under ApiTree (no ConvexProvider).
 * API-mode callers must branch to Nest adapters before invoking the result.
 */
export function useSafeMutation<Mutation extends FunctionReference<"mutation">>(
  mutation: Mutation
): (args: Mutation["_args"]) => Promise<Mutation["_returnType"]> {
  if (isApiProvider()) {
    return (async () => {
      throw new Error(
        "Convex mutation invoked in API mode — use the Nest adapter path"
      );
    }) as (args: Mutation["_args"]) => Promise<Mutation["_returnType"]>;
  }
  // Provider is fixed per deploy; hook order stays stable within each mode.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useMutation(mutation);
}
