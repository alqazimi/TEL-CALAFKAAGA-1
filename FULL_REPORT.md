# Hel Calafkaaga — Full Product & Technical Report

**How the website works from registration to payments and every major feature.**

Last updated: 11 July 2026  
Product: Halal Muslim marriage matchmaking platform  
Live site: `https://www.helcalafkaaga.com`

### Redesign status (July 2026)

Shipped module-by-module while preserving auth, Stripe, Convex data, and production flows:

| Area | Status |
|------|--------|
| Safety (likes, rate limits) | Done |
| Trust (`reviewStatus`, no auto-approve) | Done — run backfill migration |
| Brand (emerald/gold, typography) | Done |
| Landing + questionnaire UX | Done |
| Member surfaces (discover, matches, chat, profile, notifications) | Done |
| Admin (dashboard, reports notes, audit log, audience + schedule) | Done |
| Photo EXIF strip on upload | Done |
| Analytics (gender, review, monthly bars) | Done |
| Branded HTML emails (Resend) | Done |

---

## 1. What this product is

Hel Calafkaaga connects Muslim men and women who want marriage (not casual dating). Members:

1. Create an account  
2. Choose gender and complete a detailed questionnaire  
3. Get a **7-day free trial**, then pay **$10** (basic) or **$20** (personal support)  
4. Discover compatible matches, like/pass, and chat when there is a mutual like  

Staff (admin / owner) manage members, payments, reports, and announcements.

---

## 2. Technology stack

| Layer | Technology |
|--------|------------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion |
| Backend | Convex (database, auth, file storage, scheduled jobs, HTTP webhooks) |
| Auth | `@convex-dev/auth` — email + password; password reset via Resend OTP |
| Payments | Stripe Checkout |
| Email | Resend |
| Languages | Somali (default on marketing) + English; signed-in app shell is English |
| Hosting | Vercel (website) + Convex Cloud (API / data) |

**Main folders**

- `src/app/` — pages and routes  
- `src/components/` — UI (marketing, auth, questionnaire, matches, admin, etc.)  
- `convex/` — backend schema, queries, mutations, Stripe, matching, crons  
- `src/lib/` — routes, access rules, i18n, constants  

There is **no Next.js middleware**. Access is enforced by:

- Client routing helpers (`src/lib/routes.ts`)  
- Convex server checks (`requireAuth`, `requireActiveProfile`, staff helpers)

---

## 3. End-to-end member journey

```
Marketing site
    → Register (email + password)
    → Choose gender (/register/details)
    → Questionnaire (10 steps + review)
    → 7-day trial starts (if unpaid)
    → Pay $10 or $20 (or use trial)
    → Discover matches (≥ 70% score)
    → Like / Pass / Shortlist
    → Mutual like → Match + conversation
    → Chat, likes, profile, notifications
```

**Where the app sends you after login** (`getAuthenticatedHomeRoute`):

1. Staff (admin/owner) → `/admin`  
2. Gender not finished → `/register/details`  
3. Questionnaire not finished → `/questionnaire`  
4. Not paid and trial expired → `/payment`  
5. Otherwise → `/matches`

---

## 4. Public / marketing website

These pages are open to everyone (navbar + footer on every page).

| URL | Purpose |
|-----|---------|
| `/` | Landing page (brand, plans, how it works, stories, FAQ teaser) |
| `/about` | About Hel Calafkaaga |
| `/how-it-works` | Step-by-step explanation |
| `/pricing` | $10 / $20 plans |
| `/faq` | Frequently asked questions |
| `/contact` | Contact form + WhatsApp |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |

SEO: sitemap, robots, Open Graph image, JSON-LD site name **Hel Calafkaaga**.

---

## 5. Registration & login

### 5.1 Register — `/register`

- Email + password (Convex Auth Password provider)  
- On first account creation, Convex creates empty `profiles` + `preferences` rows  
- Then user goes to gender step  

**File:** `src/app/(app)/register/page.tsx`

### 5.2 Gender / registration details — `/register/details`

- User selects **male** or **female**  
- Sets `registrationComplete: true`  
- Preferred partner gender is set to the opposite  
- Redirects to `/questionnaire?welcome=true`  

**File:** `src/app/(app)/register/details/page.tsx`  
**Backend:** `convex/profiles.ts` (`completeRegistrationGender`)

### 5.3 Login — `/login`

- Email + password  
- After success, redirected by `getAuthenticatedHomeRoute` (admin / questionnaire / payment / matches)

**File:** `src/app/(app)/login/page.tsx`

### 5.4 Forgot password — `/forgot-password`

1. Enter email → receive OTP code (Resend)  
2. Enter code + new password together  
3. Sign in and go to the correct home route  

**File:** `src/app/(app)/forgot-password/page.tsx`

### 5.5 Staff invite — `/admin/invite?token=…`

- Owner invites an admin by email  
- Invitee opens link, signs in/up with that email, accepts  
- Role becomes `admin` with full staff access  

**Files:** `src/app/(app)/admin/invite/page.tsx`, `convex/staffInvites.ts`

### 5.6 Sign out

Sign out clears the session and navigates to `/login` (hard redirect so the user does not stay on a protected page).

---

## 6. Questionnaire (profile completion)

**URL:** `/questionnaire`  
**UI:** `src/app/(app)/questionnaire/page.tsx`  
**Steps definition:** `src/components/questionnaire/steps.ts`  
**Backend:** `convex/profiles.ts`

### 6.1 The 10 steps

1. **Basic information** — age, country, city, height, weight, languages  
2. **Religious practice** — prayer frequency; hijab (women)  
3. **Education**  
4. **Employment / financial readiness**  
5. **Marriage & family** — marital status, children, polygyny-related questions  
6. **Lifestyle** — smoking, exercise, etc.  
7. **About you** — marriage timeline, love language, qualities, hobbies  
8. **Partner preferences** — age/height range, countries, education, children, hijab preference (for men), etc.  
9. **Contact** — full name + phone  
10. **Profile photo** — required to finish  

Then a **review** screen, then submit.

### 6.2 Autosave

Progress is saved as the user moves (`questionnaireStep`, `lastSavedAt`). Users can leave and continue later.

### 6.3 What `questionnaireComplete` means

When the user finishes and passes validation:

- `questionnaireComplete = true`  
- `reviewStatus = "pending_review"` (staff must **Approve** before Discover)  
- `approved` / `verified` are **not** auto-set on complete  
- If unpaid: `trialEndsAt = now + 7 days`  
- Matching scores are recalculated  

**Important:** Completing the questionnaire is different from Stripe payment. Complete = form done. Paid = money (or active trial / staff). Discoverable = staff-approved (`reviewStatus: "approved"`).

Backfill existing members after deploy:

```bash
npx convex run migrations:backfillReviewStatus
# production:
npx convex run migrations:backfillReviewStatus --prod
```

### 6.4 Past bug (fixed)

A strict completeness check was incorrectly **clearing** `questionnaireComplete` on every profile save if any field failed (photo, phone, preferences, etc.). Finished members looked “incomplete / pending” in admin.

**Fix:** stop auto-clearing that flag; restore migration available:

```bash
npx convex run migrations:restoreClearedQuestionnaireComplete --prod
```

---

## 7. Trial & payments (Stripe)

### 7.1 Plans

| Plan | Price | What you get |
|------|-------|----------------|
| Basic registration | **$10** one-time | Full platform access (matches, likes, chat after unlock rules) |
| Registration + personal support | **$20** one-time | Everything in basic + personal support / premium features |
| Upgrade basic → premium | **$10** | Adds personal support |

Constants live in `src/lib/constants.ts` / Convex payment helpers.

### 7.2 7-day trial

After questionnaire completion, unpaid members get **7 days** of access (`trialEndsAt`). During trial they can use the app like a paid member. Checkout is blocked while trial is still active.

### 7.3 Checkout flow

1. User opens `/payment`  
2. Chooses $10 or $20  
3. Convex action creates a **Stripe Checkout Session**  
4. User pays on Stripe  
5. Returns to `/payment/success?session_id=…`  
6. App verifies the session and updates the profile  

**Also:** Stripe webhook `POST /stripe/webhook` on Convex site URL marks payment completed if the browser return fails.

Webhook URL pattern:

```text
https://YOUR-DEPLOYMENT.convex.site/stripe/webhook
```

**Key files**

- `convex/stripeActions.ts` — create checkout  
- `convex/stripeWebhook.ts` — webhook handler  
- `convex/http.ts` — HTTP routes  
- `src/app/(app)/payment/page.tsx`  
- `src/app/(app)/payment/success/page.tsx`  

Legacy Next route `/api/stripe/checkout` is deprecated (410).

### 7.4 After payment

- `hasPaid = true`  
- For $20 / upgrade: `hasPersonalSupport = true`  
- Match chats can unlock; notifications may fire  
- Pending abandoned checkouts are cleaned by a cron (every 6 hours)

---

## 8. Matching, likes, and discover

### 8.1 Compatibility engine

**Files:** `convex/matching.ts`, `convex/matchingEngine.ts`

Scores consider religion/prayer, age, country, height, education, children, marital status, qualities, hobbies, timeline, and more. Scores are stored in `compatibilityScores`.

### 8.2 Discover — `/matches`

Shows opposite-gender candidates who:

- Completed questionnaire  
- Are not banned  
- Have a profile photo  
- Score **≥ 70%**  
- Have not already been liked/passed by you  

Actions: **Like**, **Pass**, **Shortlist**.

### 8.3 Likes — `/likes`

- Likes you sent  
- Shortlist  
- Passed  
- **“Liked you”** is a premium/trial feature  

### 8.4 Mutual like → match

When both like each other:

- A row is created in `matches`  
- A `conversations` row is created  
- Chat unlock follows payment/trial rules (`chatUnlocked` / `hasPaidAccess`)

---

## 9. Chat & messaging

**URL:** `/chat`  
**Backend:** `convex/messages.ts`

- List conversations from matches  
- Send text (and optional images via Convex storage)  
- Typing indicators, mark as read  
- Blocked users cannot message each other  
- New message can create an in-app notification (+ optional email)

Access requires being a participant and having paid access (paid, trial, or staff).

---

## 10. Profile, photos, preferences

**URL:** `/profile`  
**UI:** `src/components/profile/profile-edit-screen.tsx`  
**Backend:** `convex/profiles.ts`

Members can edit questionnaire answers, contact info, preferences, and photos.

- Main photo: `profileImageId`  
- Extra photos: `additionalImageIds` (limit enforced in code)  
- Optional **wali** (guardian) contact for serious conversations  
- Owner can invite admins from their profile (not from the admin Users tab)

**Dashboard** `/dashboard` shows next steps (finish profile, pay, etc.).

---

## 11. Notifications

**URL:** `/notifications`  
**Backend:** `convex/notifications.ts`

Types include: like, match, message, announcement, approval, payment.

Unread counts appear in the app header / nav. Opening the notifications page can mark items read.

Soft reminders also nudge incomplete or unpaid members.

---

## 12. Roles & access

| Role | Who | Access |
|------|-----|--------|
| `user` | Normal member | Onboarding → paywall → matches/chat |
| `admin` | Staff | Admin panel; skips member paywall / questionnaire |
| `owner` | Super admin | Everything admin has + invite admins + change roles + bootstrap |

**Paid access** = `hasPaid` **OR** active trial **OR** staff.

Banned accounts (`banned: true`) cannot use the app (`Account suspended`).

---

## 13. Admin / owner panel

**URL:** `/admin`  
**File:** `src/app/(app)/admin/page.tsx`

### Tabs

| Tab | What it does |
|-----|----------------|
| **Dashboard** | Overview cards, review queue, quick actions |
| **Users** | Search/filter members, open detail, approve/reject, ban, delete, set role (owner) |
| **Reports** | Case notes, review / dismiss / ban |
| **Payments** | Stripe payment history |
| **Announcements** | Broadcast now or schedule; audience all/paid/trial/unpaid |
| **Analytics** | Completion %, conversion, gender, review status, monthly signups, countries |
| **Audit** | Staff action log |
| **Settings** | Pricing / support snapshot |

### Other admin capabilities

- First owner claim via `ADMIN_BOOTSTRAP_EMAIL` + `ADMIN_BOOTSTRAP_SECRET`  
- Staff invites (owner profile)  
- Advisor reviewed flag for premium support cases  
- Profile backfill tools  
- Cron delivers scheduled announcements every 5 minutes  

**Search** on the Users tab filters the member list (name/email/etc.) — it does not change member data.

---

## 14. Safety: block & report

**Backend:** `convex/moderation.ts`

- **Block** — hides profiles both ways; blocks likes and chat  
- **Report** — creates a report for staff review  
- Staff update report status from Admin → Reports  

---

## 15. Premium / personal support

Paying **$20** (or upgrading) sets `hasPersonalSupport: true`.

Premium / trial extras include:

- Seeing who liked you  
- Richer compatibility UI  
- WhatsApp path to personal advisors (`WHATSAPP_*` constants)  

---

## 16. Database (Convex tables) — overview

| Table | Purpose |
|-------|---------|
| `users` | Auth identity (email, optional name/phone/gender) |
| `profiles` | Full member profile, role, payment, trial, questionnaire flags, photos, ban/approve |
| `preferences` | Partner preference filters |
| `compatibilityScores` | Pair match scores |
| `likes` | like / pass / shortlist |
| `matches` | Mutual matches + chat unlock flag |
| `conversations` / `messages` / `typingIndicators` | Chat |
| `notifications` | In-app alerts |
| `payments` | Stripe checkout sessions |
| `announcements` | Admin broadcasts (`audience`, `scheduledFor`, `sentAt`) |
| `staffInvites` | Admin invite tokens |
| `blocks` / `reports` | Safety (reports may include `priority`, `adminNotes`, `resolution`) |
| `auditLogs` | Staff action accountability |
| `rateLimitBuckets` | Contact / geolocation rate limits |
| `userUploads` | File ownership |
| `memberEmailLog` | Email reminder dedupe |
| Auth tables | Sessions / accounts (from Convex Auth) |

Schema file: `convex/schema.ts`

---

## 17. Important environment variables

### On Vercel (Next.js)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_CONVEX_URL` | Production Convex URL |
| `NEXT_PUBLIC_APP_URL` | Prefer `https://www.helcalafkaaga.com` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |

### On Convex (secrets)

| Variable | Purpose |
|----------|---------|
| `SITE_URL` | App URL for emails / redirects (use www) |
| `JWT_PRIVATE_KEY` / `JWKS` | Auth tokens |
| `AUTH_RESEND_KEY` / `AUTH_EMAIL_FROM` | Emails |
| `SUPPORT_EMAIL` | Contact inbox |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Payments |
| `ADMIN_BOOTSTRAP_EMAIL` / `ADMIN_BOOTSTRAP_SECRET` | Optional first-owner claim |

Convex does **not** need a custom domain DNS record. The website domain stays on Vercel/Cloudflare; Convex stays on `*.convex.cloud` / `*.convex.site`.

---

## 18. Full route map

### Marketing

- `/` `/about` `/how-it-works` `/pricing` `/faq` `/contact` `/privacy` `/terms`

### Auth & onboarding

- `/login` `/register` `/register/details` `/forgot-password`  
- `/questionnaire` `/payment` `/payment/success`

### Member app

- `/dashboard` `/matches` `/likes` `/chat` `/profile` `/notifications`

### Staff

- `/admin` `/admin/invite`

### Other

- `/robots.txt` `/sitemap.xml`  
- `/api/stripe/checkout` (deprecated)

---

## 19. Sessions & security notes

- Idle logout: **3 hours** without activity  
- Absolute session window: **7 days** (Convex Auth config)  
- JWT lifetime: **1 hour**  
- Banned users blocked on server  
- Blocks prevent interaction both ways  
- PWA / service worker install was **removed** (normal website only). A small cleanup script still unregisters old Chrome workers that caused Google → site hangs.

---

## 20. Recent important fixes (context)

| Issue | What was wrong | Fix |
|-------|----------------|-----|
| Chrome hang from Google | Old PWA service worker broke navigations | Kill/unregister SW; remove PWA |
| Login looked stuck | GuestGate hid forms behind auth loading | Show login/register immediately |
| All profiles “incomplete” | Auto-clear of `questionnaireComplete` on save | Stop demotion; restore migration |
| Sign out | Session cleared but UI stayed on app pages | Hard redirect to `/login` |

---

## 21. How to run locally (short)

```bash
npm install
npx convex dev
npm run setup:auth
cp .env.example .env.local   # fill keys
npm run dev
```

Production:

- Push to GitHub → Vercel builds the site  
- `npx convex deploy` pushes backend functions  

---

## 22. One-page summary

Hel Calafkaaga is a **halal marriage matchmaking website**: public marketing pages, email/password accounts, a long questionnaire, a short free trial, then Stripe payment ($10 or $20). Paid (or trial) members discover high-compatibility matches, like each other, and chat. Admins and the owner moderate users, payments, and reports. Everything sensitive (auth, profiles, matches, chat, Stripe) runs through **Convex**; the UI is **Next.js on Vercel**.

---

*This report describes how the codebase is designed to work. For live production data (member counts, Stripe dashboard, Convex logs), use the Vercel, Convex, and Stripe dashboards.*
