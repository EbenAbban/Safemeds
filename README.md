# SafeMeds Client - Setup and Run Guide


> For full product documentation, see [DOCS.md](./DOCS.md).

### Overview
SafeMeds is a Next.js 15 application with Prisma (PostgreSQL), NextAuth for authentication, and optional Firebase Cloud Functions. Prisma Client is generated into `src/lib/prisma-client` per `prisma/schema.prisma`.

### Prerequisites
- Node.js 20+ (recommended) or 22 for Firebase Functions runtime
- npm 9+ (or pnpm/yarn/bun if preferred)
- PostgreSQL 13+
- Git

Optional (only if you plan to use emulators/functions):
- Firebase CLI (`npm i -g firebase-tools`)

### Quick Start
```bash
# 1) Install dependencies
npm install

# 2) Create .env.local interactively
npm run setup

# 3) Push database schema
npm run db:push

# 4) Start the dev server
npm run dev
# Visit http://localhost:3000
```

### Environment Configuration
The project ships with a helper script to create `.env.local`:
```bash
npm run setup
```
It asks for PostgreSQL connection info and generates:
- `DATABASE_URL`
- `NEXTAUTH_SECRET` (auto-generated if omitted)
- `NEXTAUTH_URL` (defaults to `http://localhost:3000`)

If you prefer manual setup, create `.env.local` in the repo root:
```ini
# Database
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/safemeds"

# NextAuth
NEXTAUTH_SECRET="your_random_secret"
NEXTAUTH_URL="http://localhost:3000"

# Firebase (optional)
# FIREBASE_...=values
```

### Database (Prisma)
Common commands:
```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database (non-destructive dev flow)
npm run db:push

# Create a development migration interactively
npm run db:migrate

# Open Prisma Studio (DB viewer)
npm run db:studio
```
- Schema is in `prisma/schema.prisma` (datasource: PostgreSQL).
- Prisma Client is generated to `src/lib/prisma-client`.

### Running the App
```bash
# Development
npm run dev

# Production build
npm run build

# Start production server (after build)
npm start
```
Notes:
- `npm run build` runs `prisma generate --no-engine` before Next build to ensure the client exists.
- Middleware at `src/middleware.ts` protects all non-public routes, redirecting unauthenticated users to `/auth`.

### Authentication
- NextAuth is used; session token is read by middleware from `next-auth.session-token`.
- Ensure `NEXTAUTH_SECRET` and `NEXTAUTH_URL` are set.

### Firebase Cloud Functions (optional)
Functions live in `functions/` (Node 22 runtime).
```bash
cd functions
npm install

# Local shell
npm run start

# Emulators (functions only)
npm run serve

# Deploy (requires Firebase project config)
npm run deploy
```
If you use emulators, also ensure any required Firebase environment variables are set in `.env.local` or the emulator UI.

### Google Data Connect (optional)
Generated connector lives under `dataconnect-generated/js/default-connector` and is consumed via dependency `@firebasegen/default-connector`. If you change Data Connect schema/configs under `dataconnect/`, regenerate accordingly (follow your Data Connect tooling workflow).

### Scripts (package.json)
```bash
npm run dev            # Next dev
npm run build          # Prisma generate (no engine) + Next build
npm start              # Next start
npm run lint           # Next lint
npm run setup          # Interactive .env.local setup
npm run db:generate    # prisma generate
npm run db:push        # prisma db push
npm run db:migrate     # prisma migrate dev
npm run db:studio      # prisma studio
```

### Common Issues & Fixes
- Prisma client conflicts or missing client:
  ```bash
  rm -rf src/lib/prisma-client
  npx prisma generate
  ```
- Validate schema and connection:
  ```bash
  npx prisma validate
  ```
- Build errors from types or lint during CI: This repo’s `next.config.ts` ignores build-time type and lint errors to avoid blocking builds. Fix locally with your editor/linters.

### Project Structure (high level)
- `src/app` – Next.js App Router pages and API routes
- `src/lib` – Libraries, Prisma client, services
- `prisma/` – Prisma schema and migrations
- `functions/` – Firebase Cloud Functions (optional)
- `dataconnect/` – Data Connect schema/config (optional)

### Deployment
- Vercel is recommended for the Next.js app.
- Ensure production `DATABASE_URL`, `NEXTAUTH_SECRET`, and any Firebase keys are set in your hosting provider’s environment variables.
- For Vercel builds use the default `build` script (it already generates Prisma Client).

### License
MIT (see `LICENSE` if present).
