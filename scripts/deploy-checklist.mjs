#!/usr/bin/env node
/**
 * Print production deploy checklist for helcalfkaaga.com
 *
 * Usage: npm run deploy:checklist
 */

const steps = [
  ["1. Convex production deploy", "npx convex deploy"],
  [
    "2. Convex Auth (JWT + SITE_URL)",
    "SITE_URL=https://helcalfkaaga.com npm run setup:auth:prod",
  ],
  [
    "3. Stripe keys on Convex",
    "npm run setup:stripe:prod -- sk_live_...",
    "npx convex env set STRIPE_WEBHOOK_SECRET whsec_... --prod",
  ],
  [
    "4. Resend (password reset, signup verify, contact)",
    'AUTH_EMAIL_FROM="Calaf <hello@helcalfkaaga.com>" SUPPORT_EMAIL=hello@helcalfkaaga.com npm run setup:resend:prod -- re_...',
    "Verify helcalfkaaga.com domain in Resend dashboard",
  ],
  [
    "5. Stripe webhook",
    "npm run convex:webhook-url:prod",
    "Event: checkout.session.completed",
  ],
  [
    "6. Vercel",
    "NEXT_PUBLIC_CONVEX_URL = production Convex URL",
    "Custom domain: helcalfkaaga.com",
  ],
  [
    "7. Admin bootstrap (one-time)",
    "npm run bootstrap:admin:prod -- you@example.com",
    "Register/login with that email, open /admin, claim owner",
  ],
  [
    "8. Smoke test",
    "npm run preflight",
    "npm run preflight:prod",
    "Register → verify email → pay → questionnaire → matches",
    "Forgot password + contact form emails",
  ],
];

console.log("Calaf production deploy checklist\n");

for (const block of steps) {
  const [title, ...commands] = block;
  console.log(title);
  for (const cmd of commands) {
    console.log(`  ${cmd}`);
  }
  console.log();
}
