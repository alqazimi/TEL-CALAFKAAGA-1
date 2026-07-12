/**
 * Stub for @convex-dev/auth/react when BACKEND_PROVIDER=api.
 */
export function useAuthActions() {
  return {
    signIn: async () => {
      throw new Error("Convex Auth disabled when BACKEND_PROVIDER=api");
    },
    signOut: async () => {
      throw new Error("Convex Auth disabled when BACKEND_PROVIDER=api");
    },
  };
}

export function ConvexAuthProvider({
  children,
}: {
  children: React.ReactNode;
  client?: unknown;
}) {
  return children as React.ReactElement;
}
