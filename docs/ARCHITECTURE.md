# SafeMeds — Project Documentation

**Anonymous telepharmacy for students.**
Last updated: 2026-08-10 · Reflects `main` @ `7c5eda8`

---

## Table of contents

1. [What SafeMeds is](#1-what-safemeds-is)
2. [Technology stack](#2-technology-stack)
3. [System architecture](#3-system-architecture)
4. [Data model](#4-data-model)
5. [Identity, authentication, and the anonymity model](#5-identity-authentication-and-the-anonymity-model)
6. [Routing and access control](#6-routing-and-access-control)
7. [Backend](#7-backend)
8. [Realtime subsystems](#8-realtime-subsystems)
9. [Frontend architecture](#9-frontend-architecture)
10. [UI design system](#10-ui-design-system)
11. [Animation and motion system](#11-animation-and-motion-system)
12. [The PWA layer](#12-the-pwa-layer)
13. [Testing](#13-testing)
14. [Build and deployment](#14-build-and-deployment)
15. [Known issues and technical debt](#15-known-issues-and-technical-debt)

> **Building UI?** Tokens, primitives, motion, loading and empty states, and the
> rules that govern them live in **[`DESIGN-SYSTEM.md`](DESIGN-SYSTEM.md)**.
> Sections 10 and 11 below are the architectural summary; that document is the
> working reference.

---

## 1. What SafeMeds is

SafeMeds is a telepharmacy platform built for university students, designed around a
single premise: **a student should be able to get medical advice without anyone —
including SafeMeds — being able to tie that conversation to their name.**

Everything in the architecture follows from that. Consultations can be created with
no account at all. Push notifications refuse to say what they are about. Page HTML
for consultations is deliberately excluded from the browser cache. These are not
incidental choices; they are the product.

The system serves three roles:

| Role | Who | What they do |
|---|---|---|
| `CLIENT` | Students | Request consultations (named or anonymous), chat with pharmacists, order and track prescriptions |
| `PHARMACY` | Licensed pharmacists | Answer consultations, issue prescriptions, manage inventory and staff |
| `ADMIN` | Platform operators | Verify pharmacist licenses, manage users, view analytics and logs |

Geographically, the delivery layer is built around **KNUST (Kumasi, Ghana)** — the
campus drop points in [`src/lib/dropPoints.ts`](../src/lib/dropPoints.ts) carry real
coordinates for the library, student centre, health services building, and main gate.

---

## 2. Technology stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 15.5.9**, App Router | React 19.1, Turbopack in dev |
| Language | **TypeScript 5** | `strict` via `tsconfig.json` |
| Styling | **Tailwind CSS v4** | CSS-first config in `globals.css` (see §10) |
| Database | **PostgreSQL** via **Prisma 6.16** | Client generated to `src/lib/prisma-client` |
| Auth | **NextAuth v5 (beta)** | Credentials + Google OAuth, JWT sessions |
| Realtime | **Firebase / Firestore** | WebRTC signalling + Remote Config only |
| Animation | **Framer Motion 12** | Via `components/animations` primitives (§11). No WebGL: `ogl` and `three` are **not** dependencies, despite earlier revisions of this table. |
| Icons | **lucide-react** | Tree-shaken via `optimizePackageImports` |
| Push | **web-push** (VAPID) | Node runtime only |
| Validation | **Zod 4** | Used on newer API routes |
| Testing | **Vitest 4** | Node environment, 100 tests |
| Hosting | **Vercel** | `bun install`, 30 s function ceiling |

**Two databases, deliberately.** Postgres is the system of record for everything.
Firebase is used *only* for WebRTC signalling and Remote Config — it holds no
medical data. This split is explained in [`webrtcSignaling.ts`](../src/lib/webrtcSignaling.ts):
there is no standalone WebSocket server, and Firestore's realtime listeners are
sufficient to exchange SDP offers and ICE candidates.

---

## 3. System architecture

```mermaid
graph TB
    subgraph Client["Browser / Installed PWA"]
        UI[React 19 App Router UI]
        SW[Service Worker<br/>public/sw.js]
        Gate[InstallGate]
    end

    subgraph Edge["Next.js Middleware"]
        MW[middleware.ts<br/>session-cookie route guard]
    end

    subgraph Server["Next.js Server — Vercel Functions"]
        RSC[Server Components<br/>+ root layout]
        API[/API Routes/]
        SVC[Service layer<br/>src/services/*]
        AUTH[NextAuth v5<br/>JWT sessions]
    end

    subgraph Data["Persistence"]
        PG[(PostgreSQL<br/>via Prisma)]
    end

    subgraph External["External services"]
        FS[(Firestore<br/>WebRTC signalling)]
        PUSH[Browser Push Services<br/>FCM / APNs / Mozilla]
        OSM[OpenStreetMap embed]
    end

    UI --> MW --> RSC
    UI --> API
    API --> AUTH
    API --> SVC --> PG
    AUTH --> PG
    SW -.push events.-> PUSH
    SVC -.web-push.-> PUSH
    UI -.peer signalling.-> FS
    UI -.map tiles.-> OSM
    Gate -.reads UA from.-> RSC
```

### Request lifecycle

1. **Middleware** ([`src/middleware.ts`](../src/middleware.ts)) runs first. It checks
   the path against a public-route allowlist; anything else requires an
   `authjs.session-token` cookie or gets a 302 to `/auth`. It only checks for the
   cookie's *presence* — real validation happens in the NextAuth routes.
2. **Root layout** ([`src/app/layout.tsx`](../src/app/layout.tsx)) reads the
   `user-agent` header, injects the pre-paint PWA script, and wraps the tree in five
   nested providers plus the install gate.
3. **Page** renders. Most pages are `"use client"` and fetch through `/api/*`.
4. **API route** authenticates via `auth()`, validates, calls a service, hits Prisma.

---

## 4. Data model

18 models and 12 enums across five domains. All tables are snake_case via `@@map`.

```mermaid
erDiagram
    User ||--o{ Consultation : "requests"
    User ||--o{ Consultation : "assigned as pharmacist"
    User ||--o{ Message : writes
    User ||--o{ Order : places
    User ||--o{ Prescription : receives
    User ||--o{ Delivery : receives
    User ||--o{ Notification : receives
    User ||--o{ PushSubscription : "subscribes"
    User ||--o| UserSettings : has
    User ||--o| Staff : "is"
    User ||--o| LicenseVerification : has
    User ||--o{ InventoryItem : stocks

    Consultation ||--o{ Message : contains
    Consultation ||--o{ Prescription : yields
    Prescription ||--o{ Order : "fulfilled by"
    Order ||--o| Delivery : "shipped as"
    Medication ||--o{ Prescription : "prescribed as"
    Medication ||--o{ InventoryItem : "stocked as"

    Staff ||--o{ StaffSchedule : has
    Staff ||--o{ Shift : works
    Staff ||--o{ TimeOffRequest : requests
    Staff ||--o{ Consultation : "assigned"

    AnonymousSession }o..o| Consultation : "tracks (no FK)"
```

### Domains

**Identity** — `User`, `UserSettings`, `LicenseVerification`, `AnonymousSession`
**Clinical** — `Consultation`, `Message`, `Prescription`, `Medication`
**Commerce** — `Order`, `Delivery`, `InventoryItem`
**Workforce** — `Staff`, `StaffSchedule`, `Shift`, `TimeOffRequest`
**Comms** — `Notification`, `PushSubscription`, `ContactMessage`

### The nullable-`userId` pattern

The single most important structural decision in the schema. `Consultation`,
`Message`, `Prescription`, `Order`, `Delivery`, and `PushSubscription` **all** carry:

```prisma
userId      String?   // null for anonymous
anonymousId String?   // opaque identifier instead
isAnonymous Boolean   @default(false)
```

An anonymous student therefore produces a complete, fully functional clinical record
with **no foreign key to any person**. This is what makes the anonymity real rather
than cosmetic — there is no join that recovers the identity, because the identity was
never written.

### Enums

`UserRole` · `ConsultationStatus` · `MessageType` · `NotificationType` ·
`DeliveryStatus` (7 states) · `PrescriptionStatus` · `OrderStatus` (7 states) ·
`PaymentStatus` · `StaffPosition` · `ShiftStatus` · `TimeOffType` · `TimeOffStatus`

### Live GPS on `Delivery`

`Delivery` carries courier telemetry directly: `courierLat`, `courierLng`,
`courierAccuracy`, `courierHeading`, `courierSpeed`, `courierActive`,
`courierUpdatedAt`. See §8.

---

## 5. Identity, authentication, and the anonymity model

### Three authentication paths

[`src/app/auth.ts`](../src/app/auth.ts) defines one Credentials provider that branches
on the submitted `role`:

```mermaid
flowchart TD
    A[Login attempt] --> B{role === PHARMACY?}
    B -->|Yes| C[email + password + licenseNumber]
    B -->|No| D[username + password]
    C --> E{Email found?}
    E -->|No| X[Invalid credentials]
    E -->|Yes| F{role is PHARMACY?}
    F -->|No| X
    F -->|Yes| G{isVerified?}
    G -->|No| X
    G -->|Yes| H{Password valid?}
    H -->|No| X
    H -->|Yes| I{licenseNumber matches on file?}
    I -->|No| X
    I -->|Yes| J[Session issued]
    D --> K{User found + verified + password valid?}
    K -->|No| X
    K -->|Yes| J
```

Two details worth calling out:

- **Every failure returns the identical string, `"Invalid credentials"`.** Nothing
  distinguishes an unknown email from a wrong password from an unverified account.
  This is deliberate anti-enumeration.
- **A license-number mismatch fails the login and does not self-heal.** The comment
  in `auth.ts:96-100` is explicit: changing a verified credential must go through the
  admin verification flow, never a login attempt.

Sessions are **JWT**, 24-hour `maxAge`, with `id`/`username`/`role` propagated through
the `jwt` and `session` callbacks. Passwords are bcrypt-hashed
([`src/utils/password.ts`](../src/utils/password.ts)).

### The anonymous path

No account required. `POST /api/consultations/anonymous` creates two rows:

```
Consultation { isAnonymous: true, anonymousId, userId: null }
AnonymousSession { sessionId, consultationId, expiresAt: +7 days }
```

The student is handed the **`sessionId`** as their only claim ticket. `anonymousId`
and `sessionId` are **different values** — the consultation carries `anonymousId`,
while `AnonymousSession` is keyed on `sessionId` and points back via `consultationId`.
Confusing the two is an easy bug; the push layer navigates the link explicitly in
`notifyConsultationReply()`.

The flow ends at `/track?sessionId=…`, and the session self-expires after 7 days.

---

## 6. Routing and access control

**Three independent layers**, in execution order:

| Layer | File | Enforces | Bypassable? |
|---|---|---|---|
| 1. Middleware | `src/middleware.ts` | Session cookie present | No — server-side |
| 2. `useAuth` hook | `src/hooks/useAuth.ts` | Client redirect | Yes — client-side |
| 3. `ProtectedRoute` | `src/components/Auth/ProtectedRoute.tsx` | Role-based gating | Yes — client-side |

Only layer 1 is a genuine security boundary. Layers 2 and 3 are UX.

**Public routes** are defined once in [`src/lib/routes.ts`](../src/lib/routes.ts) and
consumed by both layer 1 and layer 2: `/`, `/auth`, `/signin`, `/signup`, `/verify`,
`/about`, `/contact`, `/search`, `/legal`, `/consult`, `/track`, `/delivery`,
`/offline`.

`isPublicRoute()` matches a route exactly or as a genuine path prefix. `"/"` is
special-cased to exact-match only — treating it as a prefix would make the entire site
public, which is the one catastrophic bug this module could have. It is covered by a
dedicated test.

The middleware matcher excludes `api`, `_next/static`, `_next/image`, `favicon.ico`,
and **any path containing a dot** — which is what lets `/sw.js`,
`/manifest.webmanifest`, and `/icons/*.png` through untouched.

### Route inventory

**44 pages.** Public marketing (`/`, `/about`, `/contact`, `/legal`, `/search`);
auth (`/auth`, `/signin`, `/signup`, `/signout`, `/verify-license`); student
(`/client-dashboard`, `/consult`, `/consultations`, `/track`, `/orders`, `/medications`,
`/inbox`, `/chat`, `/settings`); pharmacy (`/pharmacy-dashboard`, `/inventory/add`,
`/staff-management`, `/deliver/[deliveryId]`); admin (`/admin` + 12 sub-pages);
system (`/offline`).

**31 API routes**, covering auth, consultations, chat, orders, prescriptions,
medications, inventory, delivery, staff, analytics, notifications, contact, admin,
and push.

---

## 7. Backend

### Layering

```
API route  →  validate (Zod)  →  auth()  →  service  →  Prisma  →  Postgres
```

Adherence is **inconsistent** — newer routes (push, staff) validate with Zod and
delegate to services; older ones call Prisma directly inside the handler.

### The service layer

`src/services/` holds server-side domain logic: `push.ts`, `consultationService.ts`,
`orderService.ts`, `medicationService.ts`, `staffService.ts`, `licenseService.ts`,
`settingsService.ts`, `analyticsService.ts`.

`src/lib/` holds mixed client/server helpers: `prisma.ts`, `notifications.ts`,
`rateLimit.ts`, `dropPoints.ts`, `locationTracking.ts`, `webrtcSignaling.ts`,
`firebase.ts`, `legal.ts`, plus client-side `chatService.ts`, `messageService.ts`,
`deliveryService.ts`, `consultationService.ts`.

> ⚠️ `src/lib/consultationService.ts` and `src/services/consultationService.ts` both
> exist, both 248 lines, with overlapping type names and different shapes. See §15.

### Prisma client construction

[`src/lib/prisma.ts`](../src/lib/prisma.ts) does something subtle and correct: it
inspects the `DATABASE_URL` **protocol at runtime** and only applies the Accelerate
extension for `prisma://` / `prisma+postgres://` URLs. Direct `postgresql://` URLs use
the bundled query engine. This lets the same code run against a local Postgres and a
Vercel Accelerate connection without a build flag.

A `globalThis` singleton prevents connection exhaustion under dev hot-reload.

### Rate limiting

[`src/lib/rateLimit.ts`](../src/lib/rateLimit.ts) is an **in-memory `Map`** with a
fixed window. On serverless this is per-instance and resets on cold start — it slows
casual abuse but is not a real distributed limiter.

---

## 8. Realtime subsystems

### Video consultations (WebRTC over Firestore)

```
videoRooms/{roomId}                        → { offer, answer }
videoRooms/{roomId}/callerCandidates/{id}  → ICE from the student
videoRooms/{roomId}/calleeCandidates/{id}  → ICE from the pharmacist
```

Firestore carries only signalling; media is peer-to-peer and never transits SafeMeds
servers. The file notes honestly that the **pharmacist-side client does not exist
yet** — `createCall` will simply never receive an answer, and the UI must time out
rather than hang.

### Delivery GPS tracking

Notably, this does **not** use Firebase. It runs over the app's own Postgres API:

```
POST /api/delivery/[id]/location   ← courier publishes a fix
GET  /api/delivery/[id]/location   ← student polls every 3000 ms
```

The courier opens `/deliver/[deliveryId]` on a phone, which streams
`navigator.geolocation` fixes. The student's page polls and renders position on an
**OpenStreetMap embed** — no Google Maps key, no billing account. ETA is computed
against the campus drop points in `dropPoints.ts`.

---

## 9. Frontend architecture

### Provider tree

From [`src/app/layout.tsx`](../src/app/layout.tsx):

```
<html>
  <head> ← pre-paint PWA script
  <body>
    ThemeProvider              ← light/dark, localStorage
      SessionProvider          ← NextAuth session
        NotificationProvider   ← in-app notification bell state
          OnboardingProvider   ← first-run wizard
            NavButtons
            ThemeToggle        ← fixed bottom-right, every page
            InstallGate        ← wraps children
              {children}
            ServiceWorkerRegistrar
            OnboardingWizard
```

### State management

No Redux, Zustand, or React Query. State is:

- **React Context** for cross-cutting concerns (4 providers above)
- **Local `useState`** for everything else
- **`fetch` in `useEffect`** for server data, with manual `loading`/`error` flags

The consequence is no request deduplication, no caching, and no background
revalidation. It is simple and it works, but data fetching is repetitive across pages.

### Client-heavy rendering

Most pages open with `"use client"`, including the landing page. Server Components are
used mainly for the root layout and `/offline`. Combined with `headers()` in the root
layout (§12), **every route is dynamically rendered**.

---

## 10. UI design system

### Theming

Tailwind v4 with **CSS-first configuration** in
[`globals.css`](../src/app/globals.css). Dark mode is redefined to follow a `.dark`
class rather than `prefers-color-scheme`:

```css
@custom-variant dark (&:where(.dark, .dark *));
```

`ThemeContext` toggles that class on `<html>` and persists to `localStorage`. Because
it resolves in `useEffect`, there is a brief light-then-dark flash on load. (The PWA
gate deliberately avoids this pattern — see §12.)

The app runs on a **full Material Design 3 role-token set** defined in `:root` and
`.dark`, then bridged to Tailwind utilities through `@theme inline`. See
[`DESIGN-SYSTEM.md`](DESIGN-SYSTEM.md) for the complete token reference.

Summary of what exists:

| Group | Examples |
|---|---|
| Surfaces | `--sm-surface`, `--sm-surface-container-{lowest…highest}`, `--sm-on-surface` |
| Brand | `--sm-medical-teal`, `--sm-soft-aqua`, `--sm-dark-navy`, `--sm-cool-gray` |
| MD3 roles | `primary`, `secondary`, `tertiary`, `error` + their `-container` / `on-` pairs |
| Shape | `--radius-sm` … `--radius-xl` |
| Elevation | `--shadow-soft`, `--shadow-card`, `--shadow-floating` |
| Motion | `--motion-fast` (150ms), `--motion-normal` (280ms), `--motion-slow` (520ms) |
| Layout | `--container-content` (1280px), `--container-wide` (1440px) |

`--background` / `--foreground` still exist but are now **aliases** onto the token set,
kept so pre-migration markup renders correctly rather than unstyled.

### Recurring visual patterns

- **Page surface** — `bg-surface` / `dark:bg-surface-dark`; the old
  `blue-50 → purple-50 → pink-50` shell is gone
- **Header** — `bg-surface/90` + `backdrop-blur-lg`, applied only once scrolled
- **Gradient headline text** — `.text-gradient-brand`, reserved for high-impact
  headings, never decoration
- **Card** — `rounded-lg`, `border-outline-variant/60`, `shadow-soft`
- **Hover lift** — the `.lift` utility: `translateY(-4px)` into `--shadow-card`,
  disabled under `prefers-reduced-motion`
- **Primary action** — `buttonClasses({ variant: "primary" })`, never a raw colour

---

## 11. Animation and motion system

> **Historical note.** Earlier revisions of this document described five tiers,
> including Canvas 2D (`ClickSpark`), four WebGL shader backgrounds
> (`LiquidEther`, `LightTunnel`, `Threads`, `WebThreads`) and a looping hero
> video. **None of these exist in the codebase.** `ogl` and `three` are not
> dependencies; the video was removed for asset-licensing reasons recorded in
> [`page.tsx`](../src/app/page.tsx). That stale section caused real downstream
> confusion, so it is corrected rather than deleted.

Two tiers remain, ordered by cost.

### Tier 1 — Framer Motion

Driven through the shared primitives in
[`components/animations/`](../src/components/animations/) — `Reveal` (with
`FadeIn` / `SlideUp` / `ScaleIn` presets) and `StaggerContainer` / `StaggerItem`.
Full API in [`DESIGN-SYSTEM.md`](DESIGN-SYSTEM.md).

The primitives exist because the previous approach — repeating raw props on every
element — had four systemic faults:

```tsx
// The old pattern, ~99 occurrences. Do not reintroduce.
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ delay: 0 }}
whileHover={{ scale: 1.02 }}
```

1. **No reduced-motion handling.** Not one of them honoured the preference.
2. **`animate` fires on mount, not on scroll** — below-fold content animated
   while invisible and was already spent by the time it was reached.
3. **`transition={{ delay: 0 }}`** is inert copy-paste residue.
4. **`whileHover={{ scale: 1.02 }}`** contradicts the design rule against
   aggressive scaling; hover belongs in CSS (`.lift`), not on the main thread.

A fifth fault was worse than cosmetic: two tables used
`whileHover={{ backgroundColor: "#f9fafb" }}`, whose inline style **overrode** the
token-based class beside it and painted a near-white row in dark mode.

`AnimatePresence` is still used directly for enter/exit — mobile-menu collapse,
onboarding wizard, push permission prompt, modal exits. It has no primitive
wrapper because exit animations need the component to control its own unmount.

### Migration status

| | Files |
|---|---|
| Migrated to primitives | `client-dashboard`, `courier-dashboard`, `consultations`, `orders`, `about`, `contact` |
| Still on raw props | 22 files — see the table in [`DESIGN-SYSTEM.md`](DESIGN-SYSTEM.md) |

`components/animations/*` import `framer-motion` directly by design; they are the
abstraction boundary.

### Tier 2 — CSS keyframes

The **testimonial marquee** in `globals.css` is the notable one. The track renders the
list twice back-to-back and translates exactly `-50%` — one full copy's width — so the
loop point is seamless regardless of card count. It pauses on hover and is disabled
entirely under `prefers-reduced-motion`.

Two named animations live here:

- **Testimonial marquee** (described above).
- **Skeleton shimmer** — `.skeleton` sweeps a translucent highlight across a
  surface-tinted background. A sweep is used rather than an opacity pulse
  because pulsing reads as "this control is disabled" rather than "content is
  loading". Under `prefers-reduced-motion` the placeholder keeps its shape and
  drops the highlight entirely.

### On reintroducing WebGL

The removed shader backgrounds are not missed, and the bar for bringing anything
like them back should be high: they are the single easiest way to make a
healthcare product read as a developer portfolio. If one is ever justified, the
non-negotiable discipline is a motion-preference gate, `next/dynamic({ ssr: false })`
so it stays out of the initial bundle, an `IntersectionObserver` +
`visibilitychange` guard so it never burns GPU off-screen, explicit teardown
including `WEBGL_lose_context`, and a static fallback.

---

## 12. The PWA layer

Full design rationale lives in
[`2026-08-09-pwa-install-gate-design.md`](superpowers/specs/2026-08-09-pwa-install-gate-design.md).

### Why it exists

On iOS an installed PWA gets **its own cookie jar, separate from Safari**. A student
who signs in in Safari is signed *out* inside the installed app. Gating the entry
points means the session is created where the student will actually keep using it. It
is also what makes iOS web push possible at all (iOS 16.4+ requires an installed PWA).

### Gate decision logic

Extracted as a **pure function**
([`resolve-gate-state.ts`](../src/lib/pwa/resolve-gate-state.ts)) so it is testable
without a DOM. First match wins:

```mermaid
flowchart TD
    A[Request] --> B{Bot / crawler?}
    B -->|Yes| P[Allow]
    B -->|No| C{Route gated?}
    C -->|No| P
    C -->|Yes| D{Already installed?}
    D -->|Yes| P
    D -->|No| E{Mobile?}
    E -->|No| P
    E -->|Yes| F{Bypassed this session?}
    F -->|Yes| P
    F -->|No| G{In-app webview?}
    G -->|Yes| H[Install screen — open in browser]
    G -->|No| I{beforeinstallprompt captured?}
    I -->|Yes| J[Install screen — native button]
    I -->|No| K{iOS?}
    K -->|Yes| L[Install screen — Share sheet steps]
    K -->|No| M[Install screen — generic steps]
```

Four rules carry real weight:

- **Bots are never gated.** Googlebot crawls with a *smartphone* user agent. Without
  this rule, `/consult` and `/signup` would drop out of search entirely.
- **In-app webviews get different copy.** Instagram/WhatsApp/Facebook browsers
  physically cannot install a PWA; showing them "Add to Home Screen" is a dead end.
- **Everything uncertain fails open.** Any detection error renders the page. Trapping
  a student out of a consultation is worse than letting them use the mobile site.
- **The gate is not a security boundary.** Gated content is present in the DOM
  underneath the overlay, by design.

### No-flash rendering

The user agent is read **server-side**, so the overlay ships in the initial HTML. A
small synchronous script in `<head>` stamps `data-display-mode` and `data-pwa-bypass`
on `<html>` before first paint, and CSS in `globals.css` hides the overlay for people
who already installed or dismissed it. Neither audience ever sees a flash.

### Service worker caching

Hand-written ([`public/sw.js`](../public/sw.js)) — runtime caching avoids precaching
Next's content-hashed filenames, so there is no build coupling.

| Request | Strategy |
|---|---|
| `/_next/static/*`, fonts | Cache-first (immutable) |
| Icons, images | Stale-while-revalidate |
| `/offline`, icons | Precached on install |
| Public page navigations | Network-first → `/offline` |
| **`/api/*`** | **Network-only, never stored** |
| **Gated-route HTML** | **Network-first, never written to cache** |

> The last two rows are load-bearing. A naive network-first worker stores every
> response, which would leave consultation and dashboard markup readable on the device
> **after sign-out**. Verified empirically: after browsing `/consult`, `/about`, and an
> API route, Cache Storage held only `/offline`, icons, and CSS.

### Push notifications

**Payloads carry no medical content.** Notifications render on a *locked* screen, so
the wire payload is a strict three-key whitelist — `{ kind, link, tag }` — and the
service worker renders fixed generic copy: *"SafeMeds · You have a new message"*.

`buildPushPayload()` destructures explicitly rather than spreading, so a caller cannot
accidentally leak a symptom or medication field. A dedicated test asserts that
symptoms, medication names, and patient names never survive serialisation.

`link` is sanitised to same-origin relative paths only — a notification tap calls
`openWindow()`, so an absolute URL would be an open redirect fired from a lock screen.

`PushSubscription.userId` is nullable so anonymous consultations still receive
replies, routed through `AnonymousSession`.

---

## 13. Testing

**Vitest 4**, `environment: "node"`, matching `src/**/*.test.ts`. **90 tests, 9 files.**

| File | Covers |
|---|---|
| `password.test.ts` | bcrypt hashing / verification |
| `legal.test.ts` | Legal document helpers |
| `license.test.ts` | License verification rules |
| `settings.test.ts` | Settings service |
| `public-routes.test.ts` | Public-route allowlist, incl. the `"/"`-as-prefix trap |
| `pwa-environment.test.ts` | UA classification — iOS, Android, Instagram, Googlebot, iPadOS, desktop |
| `pwa-gated-routes.test.ts` | Route matching, incl. `/consultations` ≠ `/consult` |
| `pwa-resolve-gate-state.test.ts` | All 8 gate branches + fail-open |
| `pwa-push-payload.test.ts` | Privacy guard + link sanitisation |

There is **no jsdom and no React Testing Library**, so no component renders under
test. The PWA logic was deliberately written as pure functions to stay testable within
that constraint.

---

## 14. Build and deployment

```jsonc
// vercel.json
{
  "buildCommand": "prisma generate && next build",
  "installCommand": "bun install",
  "framework": "nextjs",
  "functions": { "src/app/api/**/*.ts": { "maxDuration": 30 } }
}
```

| Script | Purpose |
|---|---|
| `npm run dev` | Next dev with Turbopack |
| `npm run build` | `prisma generate && next build` |
| `npm run build:no-db` | `next build` only — use when a dev server holds the Prisma engine DLL |
| `npm test` | Vitest watch |
| `npm run db:migrate` / `db:push` / `db:seed` / `db:studio` | Prisma workflows |
| `node scripts/generate-icons.mjs` | Regenerate PWA icons from the brand mark |

**Required environment:** `DATABASE_URL`, `NEXTAUTH_SECRET`,
`NEXT_PUBLIC_FIREBASE_*`, and — for push — `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`,
`VAPID_SUBJECT`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`.

`next.config.ts` sets `turbopack.root`, tree-shakes `lucide-react` and
`framer-motion`, and serves `/sw.js` with `Cache-Control: max-age=0, must-revalidate`
plus `Service-Worker-Allowed: /`.

---

## 15. Known issues and technical debt

Findings from reading the current tree. Ordered by how much they would bite.

### 1. Push notifications are inert

Three steps outstanding: generate VAPID keys, run
`npx prisma migrate dev --name add_push_subscriptions` (the `PushSubscription` model
is in `schema.prisma` but **has no migration** — the four on disk predate it), and
mount `<PushPermissionPrompt />` in the consult chat. Until then `/api/push/subscribe`
returns 503 by design.

### 2. Duplicate consultation services

`src/lib/consultationService.ts` and `src/services/consultationService.ts` are both
248 lines with overlapping type names (`Consultation`, `CreateConsultationData`) and
different shapes. Unclear which is authoritative.

### 3. Every route is dynamically rendered

`headers()` in the root layout opts the whole app out of static generation. This is
the deliberate cost of a flash-free install gate, but `/about`, `/contact`, and
`/legal` could otherwise be static. Reversible by moving UA detection client-side and
hiding content pre-paint instead.

### 4. Rate limiting does not survive serverless

The in-memory `Map` in `rateLimit.ts` is per-instance and resets on cold start.
Adequate against casual abuse, ineffective against a determined one.

### 5. Video consultation is half-built

`webrtcSignaling.ts` implements the student side; the pharmacist client that would
answer the offer does not exist. The file says so plainly.

### 6. Inconsistent API discipline

Newer routes validate with Zod and delegate to services. Older ones call Prisma
inline with ad-hoc validation. Worth converging.

### 7. iOS install flow is unverified

The Add-to-Home-Screen path cannot be emulated. Every other branch — Android UA,
Instagram webview, Googlebot, desktop, escape hatch, SW registration, cache
contents — has been confirmed directly. This one needs one pass on real hardware.

### 8. `body` background does not follow the dark theme

`globals.css` declares `body { background: var(--background) }`, and `--background`
does flip to `#0a0a0a` when `.dark` is on `<html>`. But the computed `body`
background stays white, because the CSS chunk carrying that rule is not loaded on
every route. It is invisible in practice — every page wraps its content in a
`dark:from-gray-900` gradient container that covers the viewport — which is why it has
gone unnoticed. Cosmetic, pre-existing, and unrelated to the Tailwind config removal
below.

---

## Recently resolved

**`tailwind.config.js` removed.** The project is on Tailwind v4 (CSS-first), and
`globals.css` had no `@config` directive, so the JS config was never loaded. Verified
empirically rather than assumed: adding `bg-safe-blue-600` to a component and running
a full production build emitted **no matching CSS at all**. Its palettes and
animations had zero usages, and its `darkMode: 'class'` was demonstrably inert — which
is exactly why `globals.css` had to declare `@custom-variant dark` by hand. Deleting
it left 143 dark-variant rules untouched and dark-mode utilities working.

**`useAuth` redirect narrowed.** The hook bounced signed-out visitors to `/auth` from
every route except `/auth`, `/signup`, and `/`, which contradicted the middleware
allowlist and made `/about`, `/contact`, and `/legal` unreadable when logged out. The
allowlist now lives once in [`src/lib/routes.ts`](../src/lib/routes.ts) and is
consumed by both the middleware and the hook, so the two can no longer disagree.
