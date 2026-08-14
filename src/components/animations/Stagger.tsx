"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { EASE_OUT_SOFT, MOTION, usePrefersReducedMotion } from "./Reveal";

/**
 * Staggered group reveal, on IntersectionObserver and CSS transitions.
 *
 * The container observes itself and publishes its visible state through
 * context; each item claims a stable index on first render and turns that into
 * a transition-delay. No animation library, and no per-frame JavaScript — the
 * browser interpolates opacity and transform on the compositor.
 *
 * Context rather than a module-level counter. A shared counter looks simpler
 * and is wrong: two containers on one page would interleave their indices, and
 * React may render a component more than once before committing, so a counter
 * incremented during render drifts. The index has to belong to the item.
 *
 * Stagger step is capped rather than uniform. With a fixed per-item delay a
 * long list delivers its last card seconds after the first, well after the
 * reader has scrolled past it; `maxTotal` compresses the step so the whole
 * group finishes inside a predictable window.
 */

interface StaggerState {
  shown: boolean;
  step: number;
  reduced: boolean;
  claimIndex: () => number;
}

const StaggerContext = createContext<StaggerState>({
  shown: true,
  step: 0,
  reduced: true,
  claimIndex: () => 0,
});

export interface StaggerContainerProps {
  children: ReactNode;
  stagger?: number;
  maxTotal?: number;
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
  as: Tag = "div",
}: StaggerContainerProps) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);
  const reduced = usePrefersReducedMotion();
  const nextIndex = useRef(0);

  useEffect(() => {
    if (reduced) {
      setShown(true);
      return;
    }
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

  const value = useMemo<StaggerState>(() => {
    const step = count && count > 1 ? Math.min(stagger, maxTotal / (count - 1)) : stagger;
    return { shown, step, reduced, claimIndex: () => nextIndex.current++ };
  }, [shown, step_dep(count, stagger, maxTotal), reduced]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <StaggerContext.Provider value={value}>
      <Tag ref={ref as never} className={className}>
        {children}
      </Tag>
    </StaggerContext.Provider>
  );
}

// Collapses the three inputs that determine `step` into one dependency.
function step_dep(count: number | undefined, stagger: number, maxTotal: number) {
  return `${count ?? ""}|${stagger}|${maxTotal}`;
}

export function StaggerItem({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li" | "article";
}) {
  const { shown, step, reduced, claimIndex } = useContext(StaggerContext);

  // Claimed once and kept for the lifetime of this item, so re-renders never
  // shuffle the order the group animates in.
  const indexRef = useRef<number | null>(null);
  if (indexRef.current === null) indexRef.current = claimIndex();

  const style: CSSProperties = reduced
    ? {}
    : {
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : "translate3d(0, 20px, 0)",
        transition: `opacity ${MOTION.slow / 1000}s ${EASE_OUT_SOFT} ${
          indexRef.current * step
        }s, transform ${MOTION.slow / 1000}s ${EASE_OUT_SOFT} ${indexRef.current * step}s`,
      };

  return (
    <Tag className={className} style={style}>
      {children}
    </Tag>
  );
}
