# SafeMeds: Product Presentation

*Anonymous telepharmacy for students, built on Next.js, PostgreSQL, and a deliberate refusal to know more about a patient than it needs to.*

## 1. Project Overview

### 1.1 The problem

- University students needing medical advice about sensitive conditions (sexual health, mental health, substance use, reproductive care) face a well-documented barrier that has nothing to do with the quality of care available to them: being seen asking for it.
- A campus health centre is a small, socially dense place; a pharmacy counter is a public one.
- For a meaningful number of students, the fear of being recognised, judged, or reported to someone who knows their family is enough to make them delay care entirely, or avoid it altogether.
- At the same time, the students who *do* seek care still need the ordinary mechanics of healthcare to work: a licensed pharmacist has to actually evaluate them, a real prescription has to be issued when appropriate, the medication has to reach them, and all of it has to happen fast enough to matter and safely enough to trust.
- Those two needs are normally in tension. Systems that protect privacy tend to do it by removing accountability and rigor; systems with real clinical and logistical rigor tend to do it by collecting identity at every step, because that is the easy way to build audit trails, assign responsibility, and route deliveries.
- SafeMeds exists to resolve that tension rather than pick a side.

### 1.2 The requirements this implies

Read literally, "anonymous *and* real" cashes out into a specific, unusually strict set of engineering requirements, not just product requirements:

- A student must be able to open a consultation with **no account, no name, and no email**, and still receive a real pharmacist's real clinical judgment.
- Nothing in the system (not a database join, not a notification payload, not a browser cache) should be able to reconstruct who an anonymous student is, even after the fact, even under a subpoena of the database alone.
- Pharmacists, who are not anonymous, must be verifiably licensed before they can practice on the platform; their side of the workflow (consultations, prescriptions, inventory, staff scheduling) has to be a genuinely usable professional tool, not an afterthought bolted onto the patient-facing app.
- A prescribed medication has to become a physical package at a real campus location, trackable in something close to real time, without requiring a Google Maps billing account or third-party logistics platform the project can't afford.
- The whole thing has to run as a single deployable web application, installable as a PWA for the push notifications and reliability that a native app would offer, without the operational overhead of maintaining native iOS/Android codebases.

Those five bullets are the actual spec. Everything described below is the answer to them.

## 2. Developer Objectives

Beyond satisfying the requirements above, the engineering work on SafeMeds has been organised around a small number of standing objectives that show up repeatedly across the codebase and its documentation:

- **Make privacy structural, not procedural.** A policy that says "we don't look at anonymous data" is worth much less than a schema where there is no foreign key to look through in the first place. Every table that can carry a patient identity is built with a nullable `userId` and an anonymous fallback path, so the guarantee holds even against a curious engineer with direct database access, not just against the UI.
- **Never fabricate data.** This is written into the project's own design rules as a first-class constraint on equal footing with accessibility and performance: no placeholder statistics, no invented testimonials, no dashboard number that isn't backed by a real query. Where a metric can't be computed honestly and correctly scoped, such as "pharmacists online" when no presence system exists, the objective is to leave it out and say so, not to ship a plausible-looking lie.
- **Keep the two data stores honest about their job.** PostgreSQL, via Prisma, is the system of record for everything clinical, commercial, and financial. Firebase/Firestore is used only for WebRTC call signalling and remote configuration; it is explicitly documented as holding no medical data, and the codebase has been actively corrected more than once (see §7) when a feature quietly drifted into using it as a second, shadow database.
- **Prefer free, self-hostable infrastructure over paid platform lock-in where the trade-off is sound.** Delivery tracking runs on OpenStreetMap tile embeds and the OSRM routing API rather than the Google Maps Platform, specifically to avoid requiring a billing account for a student project. Fonts are self-hosted rather than pulled from Google Fonts at build time, so the project builds offline. Push notifications use the open web-push/VAPID standard rather than a vendor SDK.
- **Build role-appropriate tools, not one UI wearing three hats.** A student's dashboard, a pharmacist's consultation workspace, and an admin's oversight panel are different jobs with different information density and different urgency. The objective has been to give each role software that actually fits how that role works, rather than a single screen with visibility toggles.
- **Leave an honest paper trail.** The project's own architecture and design-system documents include a section titled "Known issues and technical debt" that is updated as things are found: inert push notifications pending a migration, a duplicated service file, an unverified iOS install path. The objective is that anyone picking up the codebase inherits an accurate map of its rough edges, not a document that only describes the finished parts.

## 3. Built System's Achievements

What actually exists today, verified against the running codebase rather than described aspirationally:

- **A working anonymity model, not just an anonymity *policy*.** `POST /api/consultations/anonymous` produces a complete, functional clinical record: a `Consultation` row and an `AnonymousSession` row, with `userId: null` throughout. The student's only credential is an opaque session ID; a separate `anonymousId` (not the same value, on purpose) is what the consultation itself carries. The session self-expires after seven days. No name, no email, no phone number is ever collected or required for this path.
- **Three real, distinct authentication flows**, unified behind one NextAuth v5 credentials provider: students and admins sign in with a username and password; pharmacists sign in with an email, a password, and a license number that must match what's on file. A credential mismatch fails closed and does not silently self-correct, because a login attempt is deliberately not treated as an authorization to change a verified professional credential. Every failure path returns an identical, generic error, so a login attempt can't be used to enumerate which accounts exist.
- **A three-layer access-control system**, in explicit order of trust: server-side middleware (the only genuine security boundary, enforced on every request before a page even renders), a client-side redirect hook, and a component-level role gate. All three consume a single shared allowlist of public routes, closing a real bug class where the layers used to disagree about what was public.
- **Live courier GPS tracking that needed no paid mapping platform.** A courier opens a delivery-specific link on their phone, which streams `navigator.geolocation` fixes to the app's own Postgres-backed API every few seconds. The student's tracking page polls that same API and renders the live position on an OpenStreetMap embed, with ETA computed from the OSRM routing API against real campus drop-point coordinates: not a straight-line guess, and not a third-party SDK.
- **A self-service courier workforce**, added in this development cycle: a fourth account type (`COURIER`) that can register itself, see a real pool of packaged-and-unclaimed deliveries, claim one with a race-safe database guard against two couriers claiming the same delivery, and then use the existing GPS-sharing page, now opened up to couriers specifically for the delivery they claimed, with server-side enforcement that a courier account can only ever broadcast location for a delivery it actually owns.
- **A privacy-preserving push notification layer.** Notification payloads are restricted to a strict three-key whitelist (kind, link, tag), enforced by a function that destructures explicitly rather than spreading an object, specifically so a future caller can't accidentally leak a symptom or a medication name into a payload that will render on a stranger's lock screen. A dedicated automated test exists solely to assert that patient names and medical details never survive serialization into a push payload.
- **A caching strategy that treats "logged in" and "logged out" as genuinely different security states on the same device.** The hand-written service worker never caches API responses and never caches the HTML of a gated (authenticated) route, verified empirically by browsing a consultation, then inspecting Cache Storage and confirming it held nothing but the offline page, icons, and stylesheets. This closes a real, easy-to-miss failure mode where a shared or borrowed device could otherwise retain readable dashboard markup after sign-out.
- **A working PWA install gate** that solves a concrete, otherwise-silent bug: an installed iOS PWA gets its own separate cookie jar from Safari, so a student who signs in in the browser is invisibly signed out inside the installed app. The gate detects platform and install state server-side (so there is no flash of the wrong UI) and fails open on any uncertainty, on the principle that trapping a student out of a consultation is a worse outcome than occasionally under-gating.
- **Measured, verified performance work**, not assumed. The pharmacy dashboard's first-load JavaScript was reduced from roughly 310 KB to roughly 167 KB by deferring the video-call/Firebase code path until it's actually needed. Five separate list-data API endpoints (medications, inventory, orders, consultations, prescriptions) had their database reads parallelized instead of run one after another. Both changes were verified with production builds and a before/after size comparison, not estimated.
- **A test suite covering the parts of the system where a silent regression would be dangerous rather than merely annoying:** the public-route allowlist (including the specific trap of treating `"/"` as a path prefix, which would make the entire site public), the PWA gate's full decision tree across bots, iOS, Android, and in-app browsers, and the push-payload privacy guard described above.

## 4. Product's Use Cases

- **A student with a symptom they don't want to discuss with anyone who knows them.** They visit the site, tap into an anonymous consultation with no sign-up step, describe what's going on, and exchange messages with a real, licensed pharmacist in a chat that polls for replies every few seconds. If a prescription is warranted, it's issued directly against that anonymous record. Nothing about the interaction is ever linkable back to the student's identity through the database.
- **A returning student who wants an ongoing relationship with the platform.** They register with just a username and password, and from their dashboard can track consultation history, reorder, and follow an order all the way through delivery; trading a small amount of the anonymous path's opacity for the convenience of continuity.
- **A pharmacist starting their shift.** They sign in with their email, password, and license number, land on a dashboard scoped to real, honestly-computed metrics (not invented placeholder numbers), and move into a dedicated consultation workspace to answer queued patients, issue prescriptions against the medication catalog, and manage their pharmacy's live inventory: stock levels, low-stock and expiring-soon flags, and the ability to add new stock.
- **A pharmacy manager running staff operations.** Through the staff-management surface, they handle shift schedules and time-off requests against a real workforce data model, not a spreadsheet bolted on the side.
- **A courier picking up a shift's worth of deliveries.** They create their own courier account, open their dashboard, see a real, live pool of packaged deliveries nobody has claimed yet, claim one, and open the GPS-sharing link on their phone before heading out; their live position becomes immediately visible on the recipient's tracking map.
- **A student waiting for their delivery.** Whether they created an anonymous consultation or a named account, they land on a tracking page that shows an honest state at every stage: a real live map with the courier's actual position once one has started sharing, a graceful and clearly-labelled fallback to the student's own device location before that happens, and OTP-based delivery verification at the door.
- **An administrator overseeing the platform.** They verify pending pharmacist licenses before those accounts can practice, manage user accounts and roles, and review platform-wide analytics: the accountability and oversight layer that makes the anonymity guarantees elsewhere trustworthy rather than reckless.

## 5. Technology Stack

| Layer | Choice | Why it was chosen |
|---|---|---|
| Framework | **Next.js 15.5**, App Router, React 19 | Single deployable app covering pages, API routes, and middleware; Turbopack for fast local iteration |
| Language | **TypeScript 5** (`strict` mode) | Catches an entire class of Prisma-shape and role-typing mistakes, such as a courier role silently narrowed out of a type union, at compile time rather than in production |
| Styling | **Tailwind CSS v4**, CSS-first configuration | A single, MD3-derived design-token set bridged into utilities, so dark mode is a variable redefinition rather than a second copy of every component |
| Database | **PostgreSQL** via **Prisma 6.16** | System of record for every clinical, commercial, and workforce record; 18 models and 12 enums across five domains |
| Auth | **NextAuth v5** (Credentials provider, JWT sessions) | One provider, three role-specific credential shapes, uniform generic failure messaging to resist account enumeration |
| Realtime signalling | **Firebase / Firestore** | Deliberately scoped to WebRTC call signalling and remote config only; never medical data, by explicit architectural rule |
| Delivery tracking | **OpenStreetMap embeds + OSRM routing API** | Real live maps and real road-distance ETAs with no Google Maps billing account required |
| Push notifications | **web-push (VAPID)**, open standard | No vendor SDK; payloads are a hard three-field whitelist enforced in code and covered by a dedicated test |
| Animation | **Framer Motion 12**, wrapped in shared primitives | Centralizes reduced-motion handling and scroll-triggered reveal behaviour that ad-hoc, per-component animation props kept getting wrong |
| Icons | **lucide-react**, tree-shaken via `optimizePackageImports` | Keeps a large icon library from bloating the production bundle |
| Validation | **Zod 4** | Adopted on newer API routes; an explicit, acknowledged migration-in-progress rather than a finished state |
| Testing | **Vitest 4** | Fast, dependency-light unit testing for the pure-function logic (route gating, PWA decisions, push-payload safety) that most needs to never silently regress |
| Hosting | **Vercel** | Serverless Next.js hosting; `bun install` for dependency install, a 30-second function ceiling budgeted into the API design |

## 6. Implementation of Solutions

This section maps each requirement from §1.2 to the concrete feature that satisfies it.

### 6.1 "Real anonymity, not a promise of it"

- The nullable-`userId` pattern is the single most important structural decision in the schema: `Consultation`, `Message`, `Prescription`, `Order`, `Delivery`, and `PushSubscription` all carry `userId String?`, `anonymousId String?`, and `isAnonymous Boolean` side by side.
- An anonymous student's entire clinical and commercial history exists with no foreign key to any person; there is no join that recovers the identity, because the identity was never written down.
- This is enforced further up the stack too: push notification payloads never carry medical content, gated-route HTML is never written to the browser's cache, and the service worker treats `/api/*` as strictly network-only.

### 6.2 "A verified, professional pharmacist workflow"

- Pharmacist accounts require a license number at sign-up and go through a verification step (`isVerified`) before they can log in at all. An unverified account fails login with the same generic error as a wrong password, so the state of a pending application isn't leaked either.
- Once verified, pharmacists get a dedicated consultation workspace, built on the same Postgres-backed message thread the student sees, not a parallel Firestore system that used to silently fail to connect the two sides.
- They also get a real inventory management surface backed by live stock queries, and a staff-management area for shift scheduling.

### 6.3 "A prescription becomes a tracked physical package"

- The `Order` to `Prescription` to `Delivery` chain is a real, connected data model, not three unrelated screens.
- Delivery status moves through seven real states (`ORDER_CONFIRMED` through `DELIVERED`/`CANCELLED`), campus drop points carry real coordinates, courier GPS is streamed live over the app's own API and rendered on an OpenStreetMap embed, and OTP verification exists at the handoff point.
- The courier side of this (self-registration, a claimable delivery pool, and race-safe claiming) was built specifically to make this chain fully self-service rather than requiring a pharmacist or admin to manually assign every delivery.

### 6.4 "One deployable app, installable and reliable"

- The PWA layer, made up of the install gate, hand-written service worker, and push notifications, turns the Next.js app into something that behaves like a native app on the platforms that matter. iOS's separate-cookie-jar problem specifically motivated the install gate's existence, and none of it requires a second codebase.
- The gate's decision logic is implemented as a pure, dependency-free function specifically so it can be exhaustively unit-tested: bots, in-app browsers, iOS, Android, and every uncertain case are each a distinct, verified branch.

### 6.5 "No paid platform lock-in where it isn't earned"

- OpenStreetMap and OSRM replace the Google Maps Platform for the entire delivery-tracking feature.
- Fonts are committed to the repository as self-hosted variable `.woff2` files rather than fetched from Google Fonts at build time, so the project builds with no network access at all.
- Push notifications use the open VAPID standard.
- These choices were made explicitly, and are recorded as such, rather than being defaults nobody examined.

### 6.6 Honesty as an implementation detail, not just a value statement

- The pharmacy dashboard's original design called for a "Pharmacists Online" metric and a "Deliveries in Progress" count; both were left out rather than faked, because no presence system and no pharmacy-scoped delivery query existed to back them honestly. The dashboard ships with real numbers only.
- When an earlier revision of the project's own architecture documentation described five tiers of WebGL shader animation that didn't actually exist in the codebase, that section was corrected rather than quietly left to mislead the next engineer, because a project that insists on honest data should not itself ship a dishonest description of its own state.

## 7. Closing Note

- SafeMeds is not presented here as a finished product with no rough edges; its own documentation keeps an explicit, current list of known gaps: push notifications are provisioned but not yet fully wired end-to-end, video consultation has a working student side and no pharmacist side yet, and the in-memory rate limiter is honest about not surviving a serverless cold start.
- Carrying that list forward accurately is itself part of the engineering discipline this project has tried to hold to throughout: build the anonymity guarantee into the data model rather than the UI copy, never let a dashboard number outrun the query that's supposed to back it, and when something isn't true anymore, fix the documentation instead of leaving it to mislead the next person who reads it.
