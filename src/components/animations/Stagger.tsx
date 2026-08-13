"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { EASE_OUT_SOFT, MOTION } from "./Reveal";

/**
 * Staggered list reveal — the card-grid counterpart to `Reveal`.
 *
 * Wrap a group in `StaggerContainer` and each child in `StaggerItem`; children
 * enter in sequence once the group scrolls into view. Per §18, "do NOT animate
 * everything simultaneously" — a grid of six cards fading in together reads as
 * a page load, while the same cards 80ms apart reads as intent.
 *
 * Stagger is capped rather than uniform: with a long list, a fixed per-item
 * delay means the last card arrives seconds after the first and the user has
 * already scrolled past it. `maxTotal` compresses the step so the whole group
 * always finishes within a predictable window.
 */

export interface StaggerContainerProps {
  children: ReactNode;
  /** Seconds between children. Compressed if the list is long. */
  stagger?: number;
  /** Ceiling for the whole sequence, in seconds. */
  maxTotal?: number;
  /** Number of children, used to compute the compressed step. */
  count?: number;
  amount?: number;
  className?: string;
  as?: "div" | "ul" | "section";
}

export function StaggerContainer({
  children,
  stagger = 0.08,
  maxTotal = 0.6,
  count,
  amount = 0.15,
  className,
  as = "div",
}: StaggerContainerProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount });
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  const step = count && count > 1 ? Math.min(stagger, maxTotal / (count - 1)) : stagger;
  const MotionTag = motion[as];

  return (
    <MotionTag
      ref={ref as never}
      className={className}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: step } } }}
    >
      {children}
    </MotionTag>
  );
}

export function StaggerItem({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li" | "article";
}) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  const MotionTag = motion[as];

  return (
    <MotionTag
      className={className}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: MOTION.slow, ease: EASE_OUT_SOFT },
        },
      }}
    >
      {children}
    </MotionTag>
  );
}
