# SafeMeds – Comprehensive Documentation

### 1) Overview
SafeMeds is a modern telepharmacy platform for students and campus pharmacies. It enables secure, optionally anonymous consultations, prescription handling, delivery tracking, and staff/admin tools.

- App type: Next.js 15 (App Router)
- Primary DB: PostgreSQL via Prisma
- Auth: NextAuth (Credentials provider)
- Optional integrations: Firebase (Auth, Firestore, Functions, Remote Config), Google Data Connect

### 2) Core Features
- Authentication and Roles
  - Users: CLIENT (students), PHARMACY (pharmacists), ADMIN
  - Credentials login with middleware-protected routes (`src/middleware.ts`)
- Consultations
  - Anonymous and identified consultations with symptoms, messages, and assignments
  - Pharmacist and staff assignment flows
- Messaging
  - Real-time style chat UI for consultations
- Medications and Inventory
  - Medication catalog, stock tracking by pharmacy (`InventoryItem`)
- Prescriptions and Orders
  - Prescriptions from consultations; order management with statuses and payments
- Delivery
  - Order delivery tracking, status updates, masked packaging, campus drop points
- Settings
  - Extensive `UserSettings` model for privacy, notifications, delivery, and security preferences
- Dashboards
  - Client dashboard, pharmacy dashboard, admin area

### 3) Tech Stack
- Frontend: Next.js 15, React 19, Tailwind CSS 4
- Backend (App routes): Next.js API routes under `src/app/api/*`
- Auth: NextAuth v5 beta (credentials)
- Database: Prisma 6 with PostgreSQL
- Runtime: Node.js 20+ (22 for Firebase Functions)
- Optional: Firebase (Admin SDK for functions; Web SDK client-side)
- Tooling: TypeScript, ESLint, Turbopack, Lightning CSS

### 4) Architecture & Key Paths
- App router pages: `src/app`
  - Public routes: `/`, `/auth`, `/signup`, `/verify`
  - Protected routes: everything else (middleware-enforced)
- API routes: `src/app/api/*` (auth, consultations, chat, delivery, inventory, medications, orders, prescriptions, settings, staff, analytics)
- Libraries/services: `src/lib/*`, `src/services/*`
- Prisma
  - Schema: `prisma/schema.prisma`
  - Generated client: `src/lib/prisma-client`
- Firebase
  - Functions: `functions/` (Node 22). See `FIREBASE_README.md` and `FIREBASE_SERVICES_README.md`
- Data Connect
  - Config: `dataconnect/`
  - Generated connector: `dataconnect-generated/js/default-connector`

### 5) Data Model (Prisma)
Key models in `prisma/schema.prisma`:
- `User { id, username, email, passwordHash, role, contact fields, isVerified, ... }`
- `Consultation { id, userId?, anonymousId?, type, status, description, symptoms, medications, assignedPharmacistId, assignedStaffId, ... }`
- `Message { id, chatId, userId?, anonymousId?, content, type, isFromPharmacist, ... }`
- `Delivery { id, userId?, orderId?, status, trackingNumber, address, masked packaging, ... }`
- `Medication { id, name, dosageForm, strength, price, isPrescription, ... }`
- `InventoryItem { id, medicationId, pharmacyId, quantity, lotNumber, expirationDate, ... }`
- `Prescription { id, consultationId?, userId?, medicationId, dosage, status, ... }`
- `Order { id, prescriptionId?, userId?, orderNumber, totalAmount, paymentStatus, ... }`
- `AnonymousSession { id, sessionId, consultationId?, orderId?, deliveryId?, expiresAt }`
- `UserSettings { id, userId, privacy, delivery, notification, security, consultation settings }`
- `Staff, StaffSchedule, Shift, TimeOffRequest` with supporting enums

### 6) Authentication Flow
- Login/Signup UI: `src/app/auth/page.tsx` and `src/app/auth/enhanced-page.tsx`
- Middleware: `src/middleware.ts`
  - Allows public routes `/`, `/auth`, `/signup`, `/verify`
  - Redirects unauthenticated requests to `/auth`
- NextAuth server config: `src/app/auth.ts` and API under `src/app/api/auth/*`
- Session tokens: `next-auth.session-token` or `__Secure-next-auth.session-token`

### 7) API Endpoints (high level)
Located under `src/app/api/*` (file names elided):
- `auth/*`: sign up, sign in (credentials), session endpoints
- `consultations/*`: CRUD, assign to pharmacist/staff, list by status/user
- `chat/*`: message posting and retrieval per `chatId`
- `delivery/*`: delivery creation, tracking updates, OTP
- `inventory/*`, `medications/*`: inventory and medication queries
- `orders/*`: order creation, status updates, payment state changes
- `prescriptions/*`: create, approve/reject, dispense
- `settings/*`: get/update user settings
- `staff/*`: staff management endpoints
- `analytics/*`: analytics events

Note: Consult the corresponding files under `src/app/api/...` for request/response shapes.

### 8) Setup & Installation
- Prerequisites: Node 20+, PostgreSQL 13+
- Install deps: `npm install`
- Create environment file: `npm run setup` or create `.env.local` with
  - `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- Initialize DB: `npm run db:push`
- Dev server: `npm run dev` → `http://localhost:3000`

Scripts (`package.json`):
- `dev`: Next dev (Turbopack)
- `build`: `prisma generate --no-engine && next build`
- `start`: Next start
- `lint`: Next lint
- `setup`: Interactive `.env.local` creation
- `db:generate`, `db:push`, `db:migrate`, `db:studio`

### 9) Environment Variables
Minimum required:
- `DATABASE_URL=postgresql://USER:PASS@HOST:PORT/DB`
- `NEXTAUTH_SECRET=...`
- `NEXTAUTH_URL=http://localhost:3000`
Optional Firebase keys can be added if enabling Firebase features.

### 10) Development Workflows
- Prisma
  - Modify `prisma/schema.prisma`
  - `npm run db:generate` and `npm run db:push` (or `npm run db:migrate` during dev)
  - Use `npm run db:studio` to inspect data
- Running
  - `npm run dev` for local development
  - Check protected routes via middleware and NextAuth session
- Linting
  - `npm run lint` (build ignores lint/type errors per `next.config.ts` to keep CI non-blocking)

### 11) Firebase (Optional)
- Directory: `functions/`
- Node runtime: 22
- Commands:
  ```bash
  cd functions
  npm install
  npm run serve     # emulators
  npm run deploy    # deploy functions
  ```
- Client-side Firebase usage helpers live in `src/lib/firebase.ts` and `src/lib/remoteConfig.ts`.

### 12) Google Data Connect (Optional)
- Config: `dataconnect/`
- Generated module: `dataconnect-generated/js/default-connector`
- Imported as dependency `@firebasegen/default-connector`

### 13) Deployment
- Recommended: Vercel for Next.js app
- Ensure environment variables are set in hosting provider
- Build step uses `npm run build` which generates Prisma Client
- Database: managed PostgreSQL (Neon, Supabase, RDS, etc.)

### 14) Troubleshooting
- Prisma client issues or merge conflicts
  ```bash
  rm -rf src/lib/prisma-client
  npx prisma generate
  ```
- Validate DB and schema
  ```bash
  npx prisma validate
  ```
- Auth redirect loop: ensure `NEXTAUTH_URL` and `NEXTAUTH_SECRET` are set; check cookies
- Database connection errors: verify `DATABASE_URL` and that DB is reachable

### 15) Example Usages
- Programmatic DB access (server):
```ts
// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";
export const prisma = new PrismaClient();

// Example: fetch user by username
export async function getUserByUsername(username: string) {
  return prisma.user.findUnique({ where: { username } });
}
```

- Creating a consultation (API handler schematic):
```ts
// e.g., src/app/api/consultations/route.ts (simplified)
import { prisma } from "@/src/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const consultation = await prisma.consultation.create({ data: body });
  return new Response(JSON.stringify(consultation), { status: 201 });
}
```

- Client-side sign-in (credentials):
```ts
import { signIn } from "next-auth/react";

await signIn("credentials", {
  username: "student1",
  password: "password123",
  redirect: false,
});
```

- Protecting routes (middleware already configured):
```ts
// src/middleware.ts – public routes are '/', '/auth', '/signup', '/verify'
// All others require a NextAuth session cookie or will redirect to /auth
```

### 16) License
MIT (or project’s LICENSE file if present).

