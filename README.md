# SafeMeds

A healthcare management platform for students and campus pharmacies. Students can request anonymous consultations, pharmacists can manage consultations and prescriptions, and admins oversee the platform.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create environment file (interactive)
npm run setup
# — or create .env.local manually (see Environment section below)

# 3. Push database schema
npm run db:push

# 4. Start the dev server
npm run dev
# → http://localhost:3000
```

---

## Environment Variables

Create `.env.local` in the project root:

```ini
# Required
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/safemeds"
NEXTAUTH_SECRET="your-random-32-char-secret"   # generate: openssl rand -hex 32
NEXTAUTH_URL="http://localhost:3000"

# Optional — Firebase services
# NEXT_PUBLIC_FIREBASE_API_KEY=""
# NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=""
# NEXT_PUBLIC_FIREBASE_PROJECT_ID=""
# NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=""
# NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=""
# NEXT_PUBLIC_FIREBASE_APP_ID=""
```

---

## Sign In — Credentials by Role

| Role | Required fields |
|------|----------------|
| **Student** (CLIENT) | Username + Password |
| **Pharmacist** (PHARMACY) | Email + License number + Password |
| **Admin** | Username + Password |

- Students and admins sign in at `/auth` using their **username**.
- Pharmacists sign in at `/auth` using their **email** and **license number** in addition to their password.
- Admins are not self-registerable — accounts must be seeded or promoted via the admin dashboard.
- New accounts are created at `/signup` (students and pharmacists only).

---

## Database (Prisma + PostgreSQL)

```bash
npm run db:generate   # Regenerate Prisma Client
npm run db:push       # Push schema changes (dev, non-destructive)
npm run db:migrate    # Create a named migration
npm run db:studio     # Open Prisma Studio (visual DB browser)
```

Schema: `prisma/schema.prisma`  
Generated client: `src/lib/prisma-client`

### Seed the database

```bash
npm run db:seed
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Prisma generate + Next.js production build |
| `npm start` | Start production server |
| `npm run lint` | ESLint |
| `npm run test` | Vitest unit tests |
| `npm run setup` | Interactive `.env.local` creation |

---

## Project Structure

```
src/
  app/               # Next.js App Router pages and API routes
    api/             # API handlers (auth, consultations, chat, delivery, …)
    auth/            # Sign-in page
    signup/          # Registration page
    admin/           # Admin dashboard
    client-dashboard/
    pharmacy-dashboard/
  components/        # Shared UI components
  context/           # React context providers (Theme, Session, Notifications, …)
  hooks/             # Custom React hooks
  lib/               # Prisma client, Firebase, services
  utils/             # Password hashing, DB helpers
prisma/
  schema.prisma      # Database schema
functions/           # Firebase Cloud Functions (optional, Node 22)
dataconnect/         # Google Data Connect config (optional)
```

---

## Authentication

Built with **NextAuth v5** (Credentials provider, JWT sessions).

- Config: `src/app/auth.ts`
- API handler: `src/app/api/auth/[...nextauth]/route.ts`
- Middleware: `src/middleware.ts` — protects all routes except `/`, `/auth`, `/signup`, `/verify`
- Session cookie: `next-auth.session-token`

### Roles

| Role | Description | Self-register |
|------|-------------|--------------|
| `CLIENT` | Student — request consultations, track orders | Yes (`/signup`) |
| `PHARMACY` | Pharmacist — manage consultations, prescriptions, inventory | Yes (`/signup`), requires license verification |
| `ADMIN` | Platform administrator — user management, analytics, oversight | No (seeded or promoted) |

---

## Key Features

- **Consultations** — Anonymous and identified consultations between students and pharmacists
- **Messaging** — Real-time chat per consultation
- **Medications & Inventory** — Medication catalog, stock tracking
- **Prescriptions & Orders** — Prescription creation, approval, dispensing, and order management
- **Delivery** — Order delivery tracking with campus drop points and OTP verification
- **Staff Management** — Shifts, schedules, and time-off requests
- **Settings** — Per-user privacy, notification, delivery, and security preferences
- **Analytics** — Platform usage analytics

---

## API Routes (summary)

| Prefix | Purpose |
|--------|---------|
| `/api/auth/*` | Sign up, sign in, session, profile |
| `/api/consultations/*` | CRUD, assign, status updates |
| `/api/chat/*` | Messages per consultation |
| `/api/medications/*` | Medication catalog |
| `/api/inventory/*` | Pharmacy inventory |
| `/api/prescriptions/*` | Create, approve, dispense |
| `/api/orders/*` | Order lifecycle |
| `/api/delivery/*` | Delivery tracking and OTP |
| `/api/staff/*` | Staff profiles, shifts, schedules |
| `/api/settings/*` | User settings |
| `/api/analytics/*` | Analytics events |
| `/api/admin/*` | Admin-only endpoints |

---

## Firebase (optional)

Cloud Functions live in `functions/` (Node 22 runtime):

```bash
cd functions
npm install
npm run serve    # local emulators
npm run deploy   # deploy to Firebase
```

Client-side Firebase helpers: `src/lib/firebase.ts`, `src/lib/remoteConfig.ts`

---

## Deployment

Recommended: **Vercel** for the Next.js app + managed PostgreSQL (Neon, Supabase, or RDS).

Set these environment variables in your hosting provider:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (your production domain)

Build command: `npm run build` (runs `prisma generate` automatically).

---

## Troubleshooting

**Prisma client missing or stale:**
```bash
rm -rf src/lib/prisma-client
npx prisma generate
```

**Auth redirect loop:**  
Ensure `NEXTAUTH_SECRET` and `NEXTAUTH_URL` are set and the database is reachable.

**Database connection error:**  
Verify `DATABASE_URL` and that PostgreSQL is running.

**Hydration warning in browser:**  
If using the Dark Reader browser extension, the warning is cosmetic — `suppressHydrationWarning` is already set on `<html>` to silence it.

---

## Prerequisites

- Node.js 20+
- PostgreSQL 13+
- npm 9+

---

## License

MIT
