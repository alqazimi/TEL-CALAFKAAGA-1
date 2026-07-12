#!/usr/bin/env node
/**
 * Phase 11 — classify direct Convex imports under src/.
 *
 * allowed / allowedProviderSpecific: provider bridges, shims, Convex-only trees.
 * forbidden: shared UI / pages that run in BOTH modes still importing Convex.
 *
 * Exit code 1 when --fail (or CONVEX_DEPS_FAIL=1) and forbiddenCount > 0.
 *
 * Writes:
 *   migration-reports/phase11/direct-convex-deps.json
 *   migration-reports/phase10/direct-convex-deps.json (compat copy)
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "src");
const OUT_DIR_11 = path.join(ROOT, "migration-reports", "phase11");
const OUT_DIR_10 = path.join(ROOT, "migration-reports", "phase10");
const OUT_11 = path.join(OUT_DIR_11, "direct-convex-deps.json");
const OUT_10 = path.join(OUT_DIR_10, "direct-convex-deps.json");

const FAIL =
  process.argv.includes("--fail") || process.env.CONVEX_DEPS_FAIL === "1";

const PATTERNS = [
  { id: "convex/react", re: /from\s+["']convex\/react["']/ },
  {
    id: "convex/_generated/api",
    re: /from\s+["'][^"']*convex\/_generated\/api["']/,
  },
  { id: "@convex-dev/auth", re: /from\s+["']@convex-dev\/auth[^"']*["']/ },
];

/** Paths that may keep Convex (provider-specific or infrastructure). */
const ALLOWED_PATH_RES = [
  /^src\/data\/[^/]+\/convex\.ts$/,
  /^src\/data\/[^/]+\/hooks(?:-[a-z]+)?\.ts$/,
  /^src\/data\/shims\//,
  /^src\/lib\/convex-client\.ts$/,
  /^src\/lib\/use-safe-query\.ts$/,
  /^src\/components\/providers\.tsx$/,
  /^src\/components\/auth\/convex-/,
  /^src\/components\/auth\/loading-recovery\.tsx$/,
  // Convex-only form trees (basename contains .convex.)
  /\.convex\.(ts|tsx)$/,
  // Legacy naming: *convex* under auth trees
  /^src\/hooks\/.*\.convex\.(ts|tsx)$/,
];

function isAllowed(rel) {
  return ALLOWED_PATH_RES.some((re) => re.test(rel));
}

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      walk(full, files);
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

const allowed = [];
const forbidden = [];
const byPattern = {};

for (const file of walk(SRC)) {
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  const text = fs.readFileSync(file, "utf8");
  const hits = [];
  for (const p of PATTERNS) {
    if (p.re.test(text)) {
      hits.push(p.id);
      byPattern[p.id] = (byPattern[p.id] ?? 0) + 1;
    }
  }
  if (hits.length === 0) continue;

  const entry = {
    file: rel,
    patterns: hits,
    classification: isAllowed(rel) ? "allowed" : "forbidden",
  };
  if (entry.classification === "allowed") allowed.push(entry);
  else forbidden.push(entry);
}

const report = {
  generatedAt: new Date().toISOString(),
  note:
    "allowed = provider bridges (data/*/convex.ts, data/*/hooks*.ts, shims, providers, *.convex.*). " +
    "forbidden = shared UI/pages that still import Convex directly.",
  allowedCount: allowed.length,
  forbiddenCount: forbidden.length,
  pass: forbidden.length === 0,
  byPattern,
  allowed,
  forbidden,
};

for (const dir of [OUT_DIR_11, OUT_DIR_10]) {
  fs.mkdirSync(dir, { recursive: true });
}
const payload = JSON.stringify(report, null, 2) + "\n";
fs.writeFileSync(OUT_11, payload);
fs.writeFileSync(OUT_10, payload);

console.log(`Wrote ${OUT_11}`);
console.log(`Wrote ${OUT_10} (compat)`);
console.log(
  `allowed=${report.allowedCount} forbidden=${report.forbiddenCount} pass=${report.pass}`
);

if (FAIL && report.forbiddenCount > 0) {
  console.error(
    `\nFAIL: ${report.forbiddenCount} forbidden Convex import(s) remain in shared paths.`
  );
  for (const f of forbidden.slice(0, 40)) {
    console.error(`  - ${f.file} (${f.patterns.join(", ")})`);
  }
  if (forbidden.length > 40) {
    console.error(`  … and ${forbidden.length - 40} more`);
  }
  process.exit(1);
}
