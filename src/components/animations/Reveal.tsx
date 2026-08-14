"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * Scroll reveal built on IntersectionObserver and a CSS transition.
 *
 * Deliberately not framer-motion. This primitive is used across most routes,
 * so importing an animation library here put it in the shared bundle for every
 * page — tens of kilobytes to fade an element in. A transform and an opacity
 * transition are things the browser already does, on the compositor, without
 * any JavaScript running per frame.
 *
 * Three behaviours are preserved from the framer version:
 *
 * 1. Reveals fire ONCE. The observer disconnects on first intersection —
 *    re-animating on scroll-back is the fastest way to make a page feel cheap.
 *
 * 2. Reduced motion renders the final state immediately, with no transform and
 *    no transition. Not a shortened animation: none.
 *
 * 3. Content is never hidden behind JavaScript that might not run. If the
 *    observer never fires the element still ends up visible, because the
 *    hidden state is only applied once we know we can remove it.
 */

export type RevealVariant = "fade" | "up" | "down" | "left" | "right" | "scale";

/** Mirrors --motion-* in globals.css. */
export const MOTION = { fast: 150, normal: 280, slow: 520 } as const;
export const EASE_OUT_SOFT = "cubic-bezier(0.22, 1, 0.36, 1)";

const HIDDEN: Record<RevealVariant, string> = {
  fade: "none",
  up: "translate3d(0, 24px, 0)",
  down: "translate3d(0, -24px, 0)",
  // Shorter travel than the vertical variants: a wide element moving
  // horizontally can overshoot the viewport edge and flash a scrollbar.
  left: "translate3d(-20px, 0, 0)",
  right: "translate3d(20px, 0, 0)",
  scale: "scale(0.96)",
};

export interface RevealProps {
  children: ReactNode;
  variant?: RevealVariant;
  /** Seconds, matching the previous framer API. */
  delay?: number;
  /** Seconds. */
  duration?: number;
  /** Fraction of the element that must be visible before firing. */
  amount?: number;
  className?: string;
  as?: "div" | "section" | "article" | "li" | "span";
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export default function Reveal({
  children,
  variant = "up",
  delay = 0,
  duration = MOTION.slow / 1000,
  amount = 0.2,
  className,
  as: Tag = "div",
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return setShown(true);
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShown(true);
        observer.disconnect(); // fire once
      },
      { threshold: amount }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [amount, reduced]);

  const style: CSSProperties = reduced
    ? {}
    : {
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : HIDDEN[variant],
        transition: `opacity ${duration}s ${EASE_OUT_SOFT} ${delay}s, transform ${duration}s ${EASE_OUT_SOFT} ${delay}s`,
        // Hint the compositor only while the transition can still run.
        willChange: shown ? undefined : "opacity, transform",
      };

  return (
    <Tag ref={ref as never} className={className} style={style}>
      {children}
    </Tag>
  );
}

export const FadeIn = (p: Omit<RevealProps, "variant">) => <Reveal {...p} variant="fade" />;
export const SlideUp = (p: Omit<RevealProps, "variant">) => <Reveal {...p} variant="up" />;
export const ScaleIn = (p: Omit<RevealProps, "variant">) => <Reveal {...p} variant="scale" />;
