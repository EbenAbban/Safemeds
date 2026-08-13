"use client";

import { motion, useInView, useReducedMotion, type Variants } from "framer-motion";
import { useRef, type ReactNode } from "react";

/**
 * The one scroll-reveal primitive. FadeIn / SlideUp / ScaleIn below are thin
 * presets over this rather than three near-identical components — the brief
 * asks for that API surface (§62) but also forbids duplicate components for
 * the same visual pattern (§61), and these three differ only by their initial
 * transform.
 *
 * Two behaviours are deliberate:
 *
 * 1. Reveals fire ONCE. `useInView({ once: true })` — per §41, "once visible,
 *    animate once, do not replay aggressively on every scroll." Re-animating
 *    on scroll-back is the single most common way a reveal system starts
 *    feeling cheap.
 *
 * 2. Reduced motion renders the final state immediately with no transform and
 *    no transition. It does not merely shorten the animation: §50 requires
 *    large movement to be removed outright, and content must never depend on
 *    animation to become visible.
 */

export type RevealVariant = "fade" | "up" | "down" | "left" | "right" | "scale";

/** Matches --motion-* in globals.css so JS and CSS motion stay in step. */
export const MOTION = {
  fast: 0.15,
  normal: 0.28,
  slow: 0.52,
} as const;

/** The soft ease used across the design system (--ease-out-soft). */
export const EASE_OUT_SOFT = [0.22, 1, 0.36, 1] as const;

/**
 * `left`/`right` name the side the element enters FROM, which is how the
 * two-column sections that use them are described in the design ("the form
 * slides in from the right"). They travel a shorter distance than the vertical
 * variants: horizontal movement can push a wide element past the viewport edge
 * mid-animation and cause a transient scrollbar.
 */
const OFFSETS: Record<RevealVariant, { x?: number; y?: number; scale?: number }> = {
  fade: {},
  up: { y: 24 },
  down: { y: -24 },
  left: { x: -20 },
  right: { x: 20 },
  scale: { scale: 0.96 },
};

export interface RevealProps {
  children: ReactNode;
  /** Which entrance to use. Defaults to a gentle upward slide. */
  variant?: RevealVariant;
  /** Seconds to wait before starting — use for hand-tuned hero sequencing. */
  delay?: number;
  duration?: number;
  /** How much must be on screen before firing. 0.2 = 20%. */
  amount?: number;
  className?: string;
  /** Render as something other than a div (e.g. "section", "li"). */
  as?: "div" | "section" | "article" | "li" | "span";
}

export default function Reveal({
  children,
  variant = "up",
  delay = 0,
  duration = MOTION.slow,
  amount = 0.2,
  className,
  as = "div",
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount });
  const prefersReducedMotion = useReducedMotion();

  const MotionTag = motion[as];

  if (prefersReducedMotion) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  const offset = OFFSETS[variant];

  return (
    <MotionTag
      ref={ref as never}
      className={className}
      initial={{ opacity: 0, ...offset }}
      animate={inView ? { opacity: 1, x: 0, y: 0, scale: 1 } : undefined}
      transition={{ duration, delay, ease: EASE_OUT_SOFT }}
    >
      {children}
    </MotionTag>
  );
}

export const FadeIn = (props: Omit<RevealProps, "variant">) => (
  <Reveal {...props} variant="fade" />
);

export const SlideUp = (props: Omit<RevealProps, "variant">) => (
  <Reveal {...props} variant="up" />
);

export const ScaleIn = (props: Omit<RevealProps, "variant">) => (
  <Reveal {...props} variant="scale" />
);

/**
 * Variants for callers that need to drive a stagger from a parent's own
 * `animate` state rather than from scroll position (e.g. the hero, which
 * plays on load instead of on view).
 */
export const staggerParent = (stagger = 0.08, delayChildren = 0): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger, delayChildren } },
});

export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: MOTION.slow, ease: EASE_OUT_SOFT },
  },
};
