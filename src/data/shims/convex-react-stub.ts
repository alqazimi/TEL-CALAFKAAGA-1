/**
 * Stub used when NEXT_PUBLIC_BACKEND_PROVIDER=api.
 * Prevents Convex client hooks from executing in the API-mode bundle.
 */

/** Minimal stand-in so webpack can resolve imports from `@/lib/convex-client`. */
export class ConvexReactClient {
  constructor(_address?: string, _options?: unknown) {}
}

export function useQuery(): undefined {
  return undefined;
}

export function useMutation() {
  return async () => {
    throw new Error("Convex mutations are disabled when BACKEND_PROVIDER=api");
  };
}

export function useAction() {
  return async () => {
    throw new Error("Convex actions are disabled when BACKEND_PROVIDER=api");
  };
}

export function useConvexAuth() {
  return { isAuthenticated: false, isLoading: false };
}

export function useConvex() {
  return {
    query: async () => {
      throw new Error("Convex client disabled when BACKEND_PROVIDER=api");
    },
    mutation: async () => {
      throw new Error("Convex client disabled when BACKEND_PROVIDER=api");
    },
  };
}

export function useQueries() {
  return {};
}

export function ConvexProvider({ children }: { children: React.ReactNode }) {
  return children as React.ReactElement;
}
