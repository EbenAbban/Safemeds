# SafeMeds — Frontend & Design System

Companion to [`ARCHITECTURE.md`](ARCHITECTURE.md). That document covers the system
as a whole; this one covers everything a developer touches when building UI:
tokens, primitives, motion, loading and empty states, and the rules that keep the
interface coherent.

**Audience:** anyone adding or changing a screen.

---

## Table of contents

1. [Ground rules](#1-ground-rules)
2. [Design tokens](#2-design-tokens)
3. [Typography](#3-typography)
4. [Layout and spacing](#4-layout-and-spacing)
5. [UI primitives](#5-ui-primitives)
6. [Motion primitives](#6-motion-primitives)
7. [Loading states](#7-loading-states)
8. [Empty states](#8-empty-states)
9. [Dark mode](#9-dark-mode)
10. [Accessibility](#10-accessibility)
11. [Privacy constraints on UI](#11-privacy-constraints-on-ui)
12. [Outstanding work](#12-outstanding-work)

---

## 1. Ground rules

Six rules, in priority order. When two conflict, the higher one wins.

1. **Privacy beats visuals.** No redesign may surface identity or medical detail
   that the anonymous consultation model deliberately keeps separate.
2. **Accessibility beats beauty.** Contrast, focus, and keyboard reach are not
   negotiable against aesthetics.
3. **Performance beats animation.** If an effect costs frames, it goes.
4. **Never fabricate data.** No invented statistics, testimonials, names, or
   quotes — not even as placeholders that could ship. If real data does not
   exist, show an honest empty state.
5. **Never hardcode a colour.** Every colour comes from a token. A literal hex in
   a component is a bug — see [§9](#9-dark-mode) for what it actually breaks.
6. **One component per pattern.** Before adding a component, check
   `components/ui/` and `components/animations/`.

---

## 2. Design tokens

Defined in [`globals.css`](../src/app/globals.css) in three layers:

```
:root { --sm-* }        raw values, light theme
.dark { --sm-* }        raw values, dark theme  (same names, redefined)
@theme inline { }       bridge → Tailwind utilities
```

Because `.dark` redefines the *same* variable names, components never branch on
theme. `bg-surface` is correct in both.

### Surfaces

| Token | Utility | Use |
|---|---|---|
| `--sm-surface` | `bg-surface` | Page background |
| `--sm-surface-container-lowest` | `bg-surface-container-lowest` | Cards on a page |
| `--sm-surface-container-low/high/highest` | `bg-surface-container-*` | Nested elevation |
| `--sm-on-surface` | `text-on-surface` | Primary text |
| `--sm-on-surface-variant` | `text-on-surface-variant` | Secondary text |
| `--sm-outline-variant` | `border-outline-variant` | Hairline borders |

### Brand and roles

| Token | Utility | Use |
|---|---|---|
| `--sm-medical-teal` | `text-medical-teal` | Brand primary |
| `--sm-soft-aqua` | `text-soft-aqua` | Accent, focus rings |
| `--sm-dark-navy` | `bg-dark-navy` | Inverse surfaces |
| `primary` / `secondary` / `tertiary` / `error` | `bg-*`, `text-on-*` | MD3 role pairs |

Always use a role **with** its `on-` counterpart: `bg-primary text-on-primary`.
Pairing a role background with an arbitrary text colour is how contrast bugs start.

### Shape, elevation, motion

```css
--radius-sm: 0.25rem;  --radius-md: 0.75rem;  --radius-lg: 1rem;  --radius-xl: 1.5rem;

--shadow-soft;      /* resting */
--shadow-card;      /* hover / raised */
--shadow-floating;  /* modals, popovers */

--motion-fast: 150ms;    /* micro-interactions */
--motion-normal: 280ms;  /* component transitions */
--motion-slow: 520ms;    /* section reveals */
```

Pills (`rounded-full`) are reserved for chips and badges. Main containers never
use them.

The JS mirror of the motion values lives in `components/animations/Reveal.tsx`
as `MOTION` — **keep the two in step** if either changes.

---

## 3. Typography

Two families, wired through `next/font` in `layout.tsx`:

- **Manrope** (`--font-display`) — headings. Applied automatically to `h1`–`h3`.
- **Inter** (`--font-sans`) — body and UI.

Fluid scale classes, all `clamp()`-based so there are no breakpoint jumps:

| Class | Range | Use |
|---|---|---|
| `.text-hero` | 40 → 64px | One per page, hero only |
| `.text-headline-lg` | 30 → 40px | Section headings |
| `.text-headline-md` | 24 → 32px | Card and subsection headings |

Large headings carry negative tracking (`-0.02em` to `-0.04em`); that tightening
is what makes them read as deliberate rather than merely big.

`.text-gradient-brand` exists for high-impact headings **only**. It is not decoration.

---

## 4. Layout and spacing

| Token | Value |
|---|---|
| `--container-content` | 1280px — standard pages |
| `--container-wide` | 1440px — full-bleed hero layouts |

Horizontal padding steps 20 → 32 → 48 → 64px across breakpoints. Content never
touches the viewport edge unless that is the design.

`.section-y` gives vertical rhythm: `clamp(4.5rem, 3rem + 6vw, 7.5rem)`.

Use `Container` and `Section` from `components/ui` rather than re-deriving widths.

---

## 5. UI primitives

All exported from `@/components/ui`.

| Component | Notes |
|---|---|
| `Button` / `ButtonLink` / `buttonClasses` | Variants: `primary`, `secondary`, `ghost`, `danger`, `inverse`. Sizes `sm`/`md`/`lg`, all ≥44px tall. |
| `Card` | Surface container with border and `shadow-soft`. |
| `Badge` | Status pills, tone-based. |
| `Input` | Label, hint, error, and trailing-slot support. Never label by placeholder alone. |
| `Container` / `Section` / `SectionHeading` | Layout scaffolding. |
| `Accordion` | FAQ and expandable groups. |
| `CountUp` | IntersectionObserver count-up, fires once, reduced-motion aware. **Only wire to real numbers.** |
| `Skeleton` + 7 composed variants | [§7](#7-loading-states) |
| `EmptyState` | [§8](#8-empty-states) |

`buttonClasses()` exists for when a native `<button>` is needed but the visual
should match — e.g. a submit button inside a form that manages its own handler.

### `cn()` — and why it is not a string join

`cn()` wraps `twMerge`. Every primitive appends the caller's `className` after
its own, expecting the caller to win. **Tailwind does not guarantee that.** CSS
ties break on utility position in the compiled stylesheet, not order in the
`class` attribute. A naive join produces a genuine coinflip: this was found when
a card's background override silently lost to the card's own default.

Always use `cn()`. Never template-string class names together.

---

## 6. Motion primitives

From `@/components/animations`.

### `Reveal`

```tsx
<Reveal variant="up" delay={0.1} className="mb-8">…</Reveal>
```

| Prop | Default | Notes |
|---|---|---|
| `variant` | `"up"` | `fade` · `up` · `down` · `left` · `right` · `scale` |
| `delay` | `0` | Seconds. For hand-tuned sequences. |
| `duration` | `MOTION.slow` | Seconds. |
| `amount` | `0.2` | Fraction visible before firing. |
| `as` | `"div"` | `section` · `article` · `li` · `span` |

Presets: `<FadeIn>`, `<SlideUp>`, `<ScaleIn>`.

`left`/`right` name the side the element enters **from**, and travel a shorter
distance (20px vs 24px) — horizontal movement on a wide element can overshoot the
viewport edge and flash a scrollbar.

**Two guarantees:**

- **Fires once.** `useInView({ once: true })`. Re-animating on scroll-back is the
  fastest way to make a reveal system feel cheap.
- **Reduced motion renders the plain element** — no wrapper, no transform, no
  transition. Not a shortened animation: no animation.

### `StaggerContainer` / `StaggerItem`

```tsx
<StaggerContainer count={items.length} className="grid gap-6 md:grid-cols-3">
  {items.map((i) => <StaggerItem key={i.id}>…</StaggerItem>)}
</StaggerContainer>
```

Pass `count` — the stagger step is **compressed** so the whole sequence finishes
within `maxTotal` (default 0.6s). With a fixed per-item delay, a long list means
the last card arrives seconds late, well after the user has scrolled past it.

### What stays inline

`AnimatePresence` for enter/exit (modals, mobile menu, wizard) — exit animation
requires the component to control its own unmount, which a wrapper cannot do.

### What must never come back

```tsx
whileHover={{ scale: 1.02 }}                    // ✗ aggressive scale; use .lift
whileHover={{ backgroundColor: "#f9fafb" }}     // ✗ hardcoded; breaks dark mode
transition={{ delay: 0 }}                        // ✗ inert
initial={{ opacity: 0 }} animate={{ opacity: 1 }} // ✗ no reduced-motion gate
```

Hover belongs in CSS. The `.lift` utility does `translateY(-4px)` into
`--shadow-card` and is already reduced-motion gated — zero JS.

---

## 7. Loading states

Never render a bare `"Loading…"` or a lone spinner.

| Component | Shape |
|---|---|
| `CardSkeleton` | Media block, title, two body lines |
| `DashboardSkeleton` | Greeting, 4 stat tiles, 3-card grid |
| `TableSkeleton` | Desktop rows **and** mobile card stack, same breakpoints as real tables |
| `ChatSkeleton` | Alternating sides, varied widths |
| `ProfileSkeleton` | Avatar + identity lines |
| `MedicationSkeleton` | Catalogue grid |
| `DeliverySkeleton` | Map panel + status timeline |

Two rules they all follow:

1. **Mirror the real shape.** A placeholder with different proportions trades a
   spinner for a layout shift — worse, because it costs CLS.
2. **One `aria-busy` region per group.** Screen readers should hear "loading
   consultations" once, not forty anonymous blank elements. Individual bars are
   `aria-hidden`.

`TableSkeleton` renders both layouts deliberately, so the placeholder does not
reflow into a different structure the moment data lands.

---

## 8. Empty states

```tsx
<EmptyState
  icon={PillBottle}
  title="No medications found"
  description="No medication matches these filters. Try clearing the search."
  action={{ label: "Add first medication", href: "/medications/add" }}
/>
```

`description` is **required**. A bare heading leaves the user unsure whether
nothing exists yet or something failed to load — exactly the ambiguity a
privacy-sensitive product should avoid.

`action` is optional and should be **omitted when a filter merely matched
nothing**. Suggesting "add a medication" to someone whose search returned no rows
is the wrong next step.

Empty is not an error. No error colouring.

---

## 9. Dark mode

Dark mode is a designed theme, not an inversion. Backgrounds are deep navy
(`#0f172a`) and slate — never pure black, which reads as harsh and cheap on OLED.

**Every colour must be a token.** The concrete failure mode, found in two tables:

```tsx
<motion.tr
  whileHover={{ backgroundColor: "#f9fafb" }}   // inline style
  className="hover:bg-surface-container-high/50" // token class
>
```

The inline style wins, so dark mode painted a near-white row on a dark table.
Both instances are fixed; the pattern is what to watch for.

Test every change in both themes. `ThemeContext` resolves in `useEffect`, so
there is a brief light-then-dark flash on load — a known issue, see
[`ARCHITECTURE.md`](ARCHITECTURE.md) §15.

---

## 10. Accessibility

- **Focus.** A global `:focus-visible` rule paints a 2px `soft-aqua` ring on every
  interactive element. Do not remove it per-component.
- **Touch targets** ≥44px — every `Button` size already satisfies this.
- **Reduced motion.** `Reveal`, `StaggerContainer`, `CountUp`, `.lift`,
  `.marquee-track`, and `.skeleton` all honour it. Anything new must too.
- **Never animate as the sole signal of state.** Motion may reinforce a state
  change; it may not be the only indication one happened.
- **Icons** are `aria-hidden` when adjacent to a text label; decorative images
  take `alt=""`.
- **Labels**, not placeholders. `Input` has a real `label` prop — use it.

---

## 11. Privacy constraints on UI

SafeMeds is anonymous-first, and some UI decisions exist to protect that.

- Anonymous consultations are deliberately **not** joined to a person's identity.
  No screen may reintroduce that link for visual convenience.
- **Push payloads carry no medical content** — no symptoms, medication names,
  patient names, or message text. Lock-screen notifications stay generic. This is
  enforced and covered by tests; do not "improve" the copy.
- **Do not overstate security.** No "100% secure", "unhackable", or "completely
  anonymous" unless the implementation supports that precise claim.
- The service worker **does not cache API responses or gated consultation HTML**.
  Do not add caching for perceived speed.

---

## 12. Outstanding work

Honest status, so nobody assumes more is done than is.

### Motion migration — 6 of 28 files

Migrated: `client-dashboard`, `courier-dashboard`, `consultations`, `orders`,
`about`, `contact`.

Remaining, roughly by size:

| File | Motion usages | Notes |
|---|---|---|
| `chat/page.tsx` | 44 | Largest; has `AnimatePresence` — migrate reveals only |
| `page.tsx` (landing) | 28 | Hand-tuned hero sequence; use `staggerParent`/`staggerChild` |
| `admin/page.tsx` | 28 | |
| `analytics/page.tsx` | 24 | |
| `signout/page.tsx` | 20 | |
| `search`, `legal` | 18 each | |
| `medications`, `verify-license` | 15–16 | |
| `staff-management`, `ThemeToggle`, `SiteHeader` | 12 each | Header/toggle are interaction, not reveal — likely stay inline |
| `ProtectedRoute` | 10 | |
| `Accordion`, `PushPermissionPrompt`, `OnboardingWizard`, `Navigation`, `track`, `consult` | ≤6 | Mostly `AnimatePresence`; may legitimately stay |

`components/animations/*` import `framer-motion` directly by design.

### Not yet built

- **Page transitions** (`PageTransition`) — not implemented.
- **`Parallax`, `MagneticButton`, `ImageReveal`, `TextReveal`** — not implemented.
  Add only when a real screen needs one; speculative primitives rot.
- **Error states** — only 2 `error.tsx` / `not-found.tsx` files across 48 routes.
- **Skeleton adoption** — components exist; only `medications` and
  `consultations` consume them so far.

### Known debt

- **~31 legacy Tailwind colour classes** remain (`bg-yellow-100`, `bg-indigo-100`,
  `bg-green-100`, `bg-purple-100`, 2× `bg-blue-600`), concentrated in status-badge
  helpers in `orders` and `consultations`. These are hardcoded and do not theme.
- **Empty icon `<div>`s** — several pages had `<div className="text-3xl mb-4"></div>`,
  leftover emoji slots rendering as dead space. Fixed in `medications`,
  `client-dashboard`, and `consultations`; others may remain.
