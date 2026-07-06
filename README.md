# Calaf — Halal Marriage Matchmaking Platform

Find your halal life partner with confidence.

## Tech Stack

- **Frontend:** Next.js 15+, React 19, TypeScript, TailwindCSS, shadcn/ui, Framer Motion
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
- **Stripe Payments** — $15 one-time chat unlock
- **Admin Dashboard** — User management, analytics, announcements
- **Dark Mode** — System-aware theme switching

## Deployment

### Vercel

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

### Convex Cloud

```bash
npx convex deploy
```

## License

Private — All rights reserved.
