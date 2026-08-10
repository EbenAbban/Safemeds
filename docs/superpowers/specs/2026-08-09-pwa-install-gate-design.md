# SafeMeds PWA — Install Gate, Offline Support & Push Notifications

**Date:** 2026-08-09
**Status:** Awaiting final review, then implementation planning

## 1. Goal

Turn SafeMeds into an installable Progressive Web App, and steer mobile users
into the installed app before they sign in, sign up, or start a consultation.

The commercial motivation is engagement — an icon on the home screen. The
technical motivation is less obvious but more important: **on iOS an installed
PWA has its own cookie jar, separate from Safari.** A student who signs in
inside Safari is signed *out* inside the installed app. Gating sign-in behind
installation means the session is created in the place the student will
actually keep using. It is also what makes iOS push notifications possible at
all (iOS 16.4+ permits web push only for installed PWAs).

## 2. Decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | **Soft gate** with a "continue in browser" escape hatch | A hard gate permanently blocks in-app webviews (Instagram/WhatsApp links) and browsers without install support. For a healthcare product, locking a student out is worse than a missed install. |
| D2 | Gated routes: `/auth`, `/signin`, `/signup`, `/consult`, `/client-dashboard`, `/pharmacy-dashboard`, `/admin` | Entry points to authenticated and consultation flows. |
| D3 | Escape-hatch memory is **session-scoped** (`sessionStorage`) | Keeps install pressure across visits without re-interrupting a student mid-form. |
| D4 | Install screen is a **full-screen takeover** (layout A) | Chosen from three mocked alternatives. Clearest and most app-like; escape hatch deliberately understated. |
| D5 | Gate implemented as a **client component in the root layout**, keyed on pathname | The server cannot detect installation (`display-mode` is client-only), so any middleware approach depends on a stale cookie. Smallest diff, deep links preserved. |
| D6 | **In-app webviews get a distinct "open in Safari/Chrome" mode** | They physically cannot install a PWA; showing them Add-to-Home-Screen steps is a dead end on a high-traffic path. |
| D7 | **Hand-written service worker**, no `next-pwa` / Serwist | Runtime caching sidesteps the only hard problem (precaching Next's content-hashed filenames). No service-worker build tooling and no Turbopack coupling. (`web-push` in §7 is a separate server-side dependency, unrelated to the worker's build.) |
| D11 | Gate decision extracted as a **pure function**, component is a thin renderer | The project's vitest setup is Node-only with no jsdom or React testing library. A pure function makes the eight-branch table testable with zero new devDependencies — and is the better boundary regardless. |
| D8 | **Gated-route HTML and all `/api/*` responses are never written to Cache Storage** | See §6. Privacy over offline capability. |
| D9 | **Push payloads contain no medical content** | See §7. Lock-screen disclosure is the exact risk this product exists to prevent. |
| D10 | **Push permission requested on a user gesture**, after the first consultation message | Browser policy penalises drive-by prompts; iOS mandates a gesture. |

## 3. Architecture

Three units with no dependencies on each other. If service-worker registration
fails, the gate still works. If the gate is removed later, caching is untouched.

| Unit | Responsibility |
|---|---|
| Manifest | App identity, icons, `display: standalone`, theme colours |
| Service worker + registrar | Caching, offline fallback, push delivery |
| Install gate | Decides who sees the install screen, and renders it |

### New files

```
src/app/manifest.ts                       Next MetadataRoute.Manifest
src/app/offline/page.tsx                  branded offline fallback
src/lib/pwa/environment.ts                browser probes -> PwaEnvironment descriptor
src/lib/pwa/gated-routes.ts               GATED_ROUTES + matchesGatedRoute()
src/lib/pwa/resolve-gate-state.ts         PURE: (env, pathname, bypassed) -> GateVerdict
src/components/pwa/InstallGate.tsx        thin renderer around resolve-gate-state
src/components/pwa/InstallScreen.tsx      layout A UI
src/components/pwa/ServiceWorkerRegistrar.tsx
src/components/pwa/PushPermissionPrompt.tsx
src/services/push.ts                      server-side sender
src/app/api/push/subscribe/route.ts
src/app/api/push/unsubscribe/route.ts
public/sw.js                              hand-written service worker
public/icons/*.png                        generated from src/app/icon.svg
scripts/generate-icons.mjs                one-shot regeneration helper
```

### Modified files

- `src/app/layout.tsx` — pre-paint inline script, `<InstallGate>`, `<ServiceWorkerRegistrar>`
- `next.config.ts` — headers for `/sw.js`
- `prisma/schema.prisma` — `PushSubscription` model, `User.pushSubscriptions` relation
- `.gitignore` — `.superpowers/` (done)

### Icons

Generated from the existing brand mark at `src/app/icon.svg` (green→blue
gradient, white medical cross): 192×192, 512×512, 512×512 maskable, and a
180×180 `apple-touch-icon`. Generated once by `scripts/generate-icons.mjs` and
committed; the script exists for regeneration, not as a build step.

## 4. Install gate decision logic

Evaluated in order; first match wins.

1. **Bot / crawler UA** → render content. Googlebot crawls with a *smartphone*
   user agent; without this rule the gate would hide `/consult` and `/signup`
   from search entirely.
2. **Route not gated** → render content.
3. **Already installed** (`display-mode: standalone`, or `navigator.standalone`
   on iOS) → render content.
4. **Not mobile** → render content. Desktop is never gated.
5. **Bypassed this session** (`sessionStorage` flag) → render content.
6. **In-app webview** (Instagram, Facebook, WhatsApp, TikTok) → install screen
   in "open in Safari/Chrome" mode, with a copy-link button.
7. **`beforeinstallprompt` captured** (Chrome/Android) → install screen with a
   real one-tap **Install app** button.
8. **Otherwise** (iOS Safari; Android without the event) → install screen with
   two-step Share → Add to Home Screen instructions.

### Fail open, always

Any detection error, unknown state, or exception inside the gate renders the
content. This is a healthcare product: a bug that traps a student out of a
consultation is far worse than one that lets them use the mobile web site.
The gate is a UX nudge, never a security boundary.

## 5. Avoiding the content flash

A small synchronous script in `<head>` stamps
`document.documentElement.dataset.displayMode` before first paint, so
`InstallGate` has the answer on its first client render rather than one
`useEffect` later. Without it a gated user sees the consult form flash before
the install screen replaces it.

This deliberately departs from the `useEffect` pattern in
`src/context/ThemeContext.tsx`, which is the cause of that file's
light-then-dark flash. Tolerable for a colour scheme; not for a gate.

The server renders a neutral shell for gated routes so hydration matches.

## 6. Caching policy

| Request | Strategy |
|---|---|
| `/_next/static/*`, fonts | Cache-first (immutable, content-hashed) |
| Icons, images | Stale-while-revalidate |
| `/offline`, manifest, app icons | Precached on install |
| Public navigations (`/`, `/about`, `/contact`, `/legal`) | Network-first → `/offline` on failure |
| `/api/*` | **Network-only, never stored** |
| Gated-route HTML | **Network-first, response never written to cache** |

### Why the exclusions matter

A naive network-first worker writes every HTML response into Cache Storage.
That would leave consultation pages and dashboard markup in a readable
on-device cache that **survives sign-out** — a real disclosure risk on a shared
or lost phone, for a product whose entire premise is confidentiality. The cache
is therefore limited to public, non-personal assets.

The accepted cost: dashboards and consultations do not work offline. For this
product that is the correct trade.

Cache version is a constant in `sw.js`; bumping it purges old caches on
`activate`.

## 7. Push notifications

### Data model

`userId` is nullable because consultations can be anonymous (`Consultation.isAnonymous`,
backed by `AnonymousSession`). An anonymous student must be able to receive a
reply notification without ever creating an account.

```prisma
model PushSubscription {
  id                 String   @id @default(cuid())
  endpoint           String   @unique
  p256dh             String
  auth               String
  userId             String?
  anonymousSessionId String?
  userAgent          String?
  failureCount       Int      @default(0)
  createdAt          DateTime @default(now())
  lastSeenAt         DateTime @updatedAt
  user               User?    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([anonymousSessionId])
  @@map("push_subscriptions")
}
```

### Payloads carry no medical content

Push notifications render on a **locked** screen. For an anonymous student
health service, a lock-screen preview naming a medication or symptom is exactly
the disclosure this product exists to prevent.

- Wire payload: `{ kind, link, tag }` only.
- Service worker renders fixed generic copy: *"SafeMeds · You have a new message"*.
- Never transmitted: pharmacist name, symptoms, medication names, consultation type.
- Real content is fetched inside the app, after authentication.

`kind` is one of `consultation_reply`, `delivery_update`, `order_update`.

### Permission flow

Requested once, on an explicit user gesture, immediately after a student sends
their first consultation message — the moment the value is self-evident. Never
on page load. A decline is recorded and never automatically re-prompted.

iOS additionally requires the PWA to be installed (16.4+), which the gate in
this same spec delivers.

### Sending

`src/services/push.ts` exposes a sender that, for each event, writes an in-app
`Notification` row **and** dispatches the web push, keeping both channels in
sync. A `404` or `410` from the push service deletes the dead subscription row.

Triggers wired in this spec: new consultation message, and delivery status
change.

### Environment and runtime

- New dependency: `web-push`.
- Env: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, and
  `NEXT_PUBLIC_VAPID_PUBLIC_KEY` for the client.
- The subscribe/unsubscribe routes and any route calling the sender must
  declare `export const runtime = "nodejs"` — `web-push` cannot run on Edge.

## 8. Error handling

| Failure | Behaviour |
|---|---|
| Service-worker registration fails | Silent; app fully functional, gate unaffected |
| `beforeinstallprompt` never fires | Fall through to instruction mode |
| User installs mid-session | `display-mode` media listener fires; gate dissolves without reload |
| Offline on an uncached route | `/offline` fallback page |
| Push subscription rejected (404/410) | Subscription row deleted |
| Push permission denied | Recorded; in-app notifications continue as before |
| Any gate detection error | Fail open — render content |

## 9. Testing

The existing `vitest` setup is Node-only (`environment: "node"`, matching
`src/**/*.test.ts`) with no jsdom and no React testing library. Per D11 the
gate's logic lives in a pure function, so **all tests below run on that setup
unchanged — no new devDependencies and no vitest config changes.**

- `environment.test.ts` — real UA strings for iOS Safari, Chrome Android,
  Instagram webview, Googlebot smartphone, and desktop Chrome; assert each
  produces the correct `PwaEnvironment` descriptor.
- `gated-routes.test.ts` — `/consult` and `/consult/new` gated; `/` and
  `/about` not. Guards against a prefix-matching bug silently gating the site.
- `resolve-gate-state.test.ts` — all eight branches of §4 as a table-driven
  test, including the fail-open path. This is the core behavioural test.
- `push.test.ts` — payload contains no medical fields (regression guard on
  D9); a 404/410 prunes the subscription.

`InstallScreen` is presentational and is verified by eye during manual
device testing rather than by a component test, which is what avoids pulling in
DOM test infrastructure for this change.

Manual verification: Chrome DevTools → Application → Service Workers; Lighthouse
PWA installability audit; a real iOS device for the Add-to-Home-Screen flow,
since it cannot be emulated.

## 10. Out of scope

- Native app-store packaging (TWA / Capacitor).
- Background sync for offline consultation drafts.
- Offline access to dashboards or consultation history (see §6).
