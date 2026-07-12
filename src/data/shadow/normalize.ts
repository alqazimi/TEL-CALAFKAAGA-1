/** Keys whose values are volatile or sensitive — stripped before compare/log. */
const DROP_KEY_RE =
  /^(password|token|secret|email|csrf|cookie|authorization|signedurl|url|latitude|longitude|coords?|message|body|content|phone|waliPhone|ip)$/i;

const DROP_SUBSTRING_RE =
  /(password|token|secret|email|signedUrl|signed_url|presign|coordinate|lat|lng|messageText|privateMessage)/i;

/**
 * Normalize a response for structural comparison.
 * Drops PII / volatile fields. Does not log raw values.
 */
export function normalizeForShadow(value: unknown, depth = 0): unknown {
  if (depth > 8) return "[max-depth]";
  if (value == null) return value;
  if (typeof value === "string") {
    if (/^https?:\/\//i.test(value)) return "[url]";
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return "[timestamp]";
    return "[string]";
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    return value.slice(0, 50).map((v) => normalizeForShadow(v, depth + 1));
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (DROP_KEY_RE.test(k) || DROP_SUBSTRING_RE.test(k)) continue;
      out[k] = normalizeForShadow(v, depth + 1);
    }
    return out;
  }
  return "[other]";
}

export type FieldDiff = { path: string; kind: "missing" | "extra" | "type" | "value" };

export function diffNormalized(
  a: unknown,
  b: unknown,
  path = "$",
  out: FieldDiff[] = [],
  max = 40
): FieldDiff[] {
  if (out.length >= max) return out;
  if (a === b) return out;
  const ta = Array.isArray(a) ? "array" : a === null ? "null" : typeof a;
  const tb = Array.isArray(b) ? "array" : b === null ? "null" : typeof b;
  if (ta !== tb) {
    out.push({ path, kind: "type" });
    return out;
  }
  if (ta !== "object" && ta !== "array") {
    if (a !== b) out.push({ path, kind: "value" });
    return out;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) out.push({ path, kind: "value" });
    const n = Math.min(a.length, b.length, 20);
    for (let i = 0; i < n; i++) diffNormalized(a[i], b[i], `${path}[${i}]`, out, max);
    return out;
  }
  const ao = (a ?? {}) as Record<string, unknown>;
  const bo = (b ?? {}) as Record<string, unknown>;
  const keys = new Set([...Object.keys(ao), ...Object.keys(bo)]);
  for (const k of keys) {
    if (out.length >= max) break;
    if (!(k in ao)) out.push({ path: `${path}.${k}`, kind: "missing" });
    else if (!(k in bo)) out.push({ path: `${path}.${k}`, kind: "extra" });
    else diffNormalized(ao[k], bo[k], `${path}.${k}`, out, max);
  }
  return out;
}
