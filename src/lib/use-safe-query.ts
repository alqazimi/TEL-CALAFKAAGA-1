"use client";

import { useMemo } from "react";
import { useQueries } from "convex/react";
import type { FunctionReference } from "convex/server";
import { getFunctionName } from "convex/server";
import { isApiProvider } from "@/data/provider";

let backendUnavailable = false;
const listeners = new Set<() => void>();

export function isConvexBackendUnavailable() {
  return backendUnavailable;
}

export function subscribeConvexBackendStatus(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function markBackendUnavailable(error: Error) {
  // API mode never depends on Convex availability.
  if (isApiProvider()) return;

  const message = error.message || "";
  const looksDown =
    message.includes("Server Error") ||
    message.includes("free plan limits") ||
    message.includes("deployments have been disabled") ||
    message.includes("Exceeded") ||
    message.includes("Overloaded");
  if (!looksDown || backendUnavailable) return;
  backendUnavailable = true;
  // Never notify subscribers during render — that updates other components mid-render.
  queueMicrotask(() => {
    listeners.forEach((listener) => listener());
  });
}

type Skip = "skip";

/**
 * Drop-in for Convex `useQuery` that never throws into React error boundaries.
 * When the backend is disabled (e.g. Free plan limits), returns `undefined`
 * instead of crashing the whole page with "Waxbaa khaldamay".
 */
export function useSafeQuery<Query extends FunctionReference<"query">>(
  query: Query,
  args?: Query["_args"] | Skip
): Query["_returnType"] | undefined {
  const skip = args === "skip" || isApiProvider();
  const argsObject = (skip ? {} : (args ?? {})) as Record<string, unknown>;
  const queryName = getFunctionName(query);

  const queries = useMemo(() => {
    if (skip) return {};
    return {
      query: {
        query,
        args: argsObject,
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(argsObject), queryName, skip]);

  const results = useQueries(queries as Parameters<typeof useQueries>[0]);
  const result = results["query"];

  if (skip) return undefined;

  if (result instanceof Error) {
    markBackendUnavailable(result);
    if (process.env.NODE_ENV !== "production") {
      console.error(`[convex] ${queryName}:`, result.message);
    }
    return undefined;
  }

  return result as Query["_returnType"] | undefined;
}
