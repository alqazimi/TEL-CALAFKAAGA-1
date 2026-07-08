# Calaf — Halal Marriage Matchmaking Platform

Find your halal life partner with confidence.

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, TailwindCSS, shadcn/ui, Framer Motion
- **Backend:** Convex, Convex Auth, Convex File Storage
- **Payments:** Stripe
- **Deployment:** Vercel + Convex Cloud

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Convex

```bash
npx convex dev
```

This will prompt you to create a Convex project and generate your `.env.local` file with `NEXT_PUBLIC_CONVEX_URL`.

### 3. Configure Convex Auth (required for login/register)

```bash
npm run setup:auth
```

This generates `JWT_PRIVATE_KEY`, `JWKS`, and `SITE_URL` on your Convex deployment. If your app runs on a different port, set `SITE_URL` first:

```bash
SITE_URL=http://localhost:3000 npm run setup:auth
```

### 4. Configure remaining environment variables

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

Required variables:
- `NEXT_PUBLIC_CONVEX_URL` — from Convex dashboard
- `STRIPE_SECRET_KEY` — from Stripe dashboard
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — from Stripe dashboard
- `NEXT_PUBLIC_APP_URL` — your app URL (http://localhost:3001 for dev)

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (marketing)/        # Public pages
│   ├── dashboard/          # User dashboard
│   ├── matches/            # Match discovery
│   ├── chat/               # Real-time messaging
│   ├── questionnaire/      # Profile questionnaire
│   ├── admin/              # Admin dashboard
│   └── api/stripe/         # Stripe checkout API
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── layout/             # Navbar, footer, sidebar
│   ├── matches/            # Match cards & filters
│   ├── questionnaire/      # Multi-step form
│   └── marketing/          # Landing page sections
├── lib/                    # Utils & constants
convex/
├── schema.ts               # Database schema
├── auth.ts                 # Convex Auth setup
├── matching.ts             # Compatibility algorithm
├── matchingEngine.ts       # Score recalculation
├── profiles.ts             # Profile CRUD
├── matches.ts              # Like/match system
├── messages.ts             # Real-time chat
├── notifications.ts        # Push notifications
├── admin.ts                # Admin operations
└── payments.ts             # Stripe integration
```

## Features

- **Authentication** — Register, login, logout, forgot password
- **7-Step Questionnaire** — Comprehensive profile builder
- **Compatibility Algorithm** — 100-point scoring across 10 categories
- **Match Discovery** — Filter and browse matches above 70%
- **Like System** — Mutual likes create matches
- **Real-time Chat** — Messages, typing indicators, read receipts, images, emoji
- **Notifications** — Likes, matches, messages, announcements
- **Stripe Payments** — $15 standard or $20 with personal support (one-time)
- **Admin Dashboard** — User management, analytics, announcements
- **Dark Mode** — System-aware theme switching

## Deployment (helcalafkaaga.com)

### 1. Convex production

```bash
npx convex deploy
```

Copy the **production** URL (e.g. `https://your-project.convex.cloud`).

### 2. Vercel environment variables

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_CONVEX_URL` | Production Convex URL from step 1 |
| `NEXT_PUBLIC_APP_URL` | `https://helcalafkaaga.com` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` |

### 3. Convex production secrets

```bash
# Auth (required)
SITE_URL=https://helcalafkaaga.com npm run setup:auth:prod

# Stripe (required for payments)
npm run setup:stripe:prod -- sk_live_...
npx convex env set STRIPE_WEBHOOK_SECRET whsec_... --prod

# Password reset & contact form (Resend)
AUTH_EMAIL_FROM="Calaf <hello@helcalafkaaga.com>" SUPPORT_EMAIL=hello@helcalafkaaga.com \
  npm run setup:resend:prod -- re_...

# Admin bootstrap (one-time)
npm run bootstrap:admin:prod -- you@example.com
# Then register/login with that email and open /admin to claim owner.
```

### 4. Stripe webhook (production)

Run `npm run convex:webhook-url` (uses `NEXT_PUBLIC_CONVEX_URL` from `.env.local` or Vercel) to print the endpoint, or set it manually:

- **URL:** `https://YOUR-PROD-DEPLOYMENT.convex.site/stripe/webhook`
- **Event:** `checkout.session.completed`

### 5. Google Search Console

Domain `helcalafkaaga.com` — verification file is in `public/googleca20de5c3c61d824.html`.

### Vercel

1. Push to GitHub and import the repo in Vercel
2. Add the environment variables from step 2
3. Point your custom domain `helcalafkaaga.com` to Vercel
4. Redeploy after adding variables

### 6. Verify before launch

```bash
npm run preflight              # local .env.local
npm run preflight -- --prod    # production Convex secrets (after deploy)
npm run convex:webhook-url
```

**Important:** `npm run setup:auth` only configures your **dev** deployment. Production must use `setup:auth:prod`.

## License

Private — All rights reserved.
