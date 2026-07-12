/**
 * Stub for convex/_generated/api when BACKEND_PROVIDER=api.
 * Proxy so property access does not throw during module init.
 */
function leaf(): never {
  throw new Error("Convex API disabled when BACKEND_PROVIDER=api");
}

function makeProxy(): unknown {
  return new Proxy(leaf, {
    get() {
      return makeProxy();
    },
    apply() {
      return leaf();
    },
  });
}

export const api = makeProxy() as Record<string, unknown>;
