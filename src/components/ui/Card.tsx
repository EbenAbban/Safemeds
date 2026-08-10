import { cn } from "./cn";

/**
 * Layered surface with a hairline border.
 *
 * Elevation is tonal, not skeuomorphic: level 2 is a soft ambient shadow, and
 * `interactive` adds the level 3 hover lift (-4px into a deeper shadow).
 * Internal padding defaults to 32px to match the spacious layout philosophy.
 */
export type CardPadding = "none" | "sm" | "md" | "lg";

const PADDING: Record<CardPadding, string> = {
  none: "",
  sm: "p-5",
  md: "p-6",
  lg: "p-8",
};

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: CardPadding;
  interactive?: boolean;
  /** Feature cards use 16px; large featured/hero containers use 24px. */
  radius?: "lg" | "xl";
  children: React.ReactNode;
}

export default function Card({
  padding = "lg",
  interactive = false,
  radius = "lg",
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        "border border-outline-variant/60 bg-surface-container-lowest shadow-soft",
        "dark:border-outline-variant/40 dark:bg-surface-container",
        radius === "xl" ? "rounded-xl" : "rounded-lg",
        PADDING[padding],
        interactive && "lift hover:border-soft-aqua/50",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
