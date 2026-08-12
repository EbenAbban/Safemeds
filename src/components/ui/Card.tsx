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

type CardOwnProps<T extends React.ElementType> = {
  as?: T;
  padding?: CardPadding;
  interactive?: boolean;
  /** Feature cards use 16px; large featured/hero containers use 24px. */
  radius?: "lg" | "xl";
  children: React.ReactNode;
};

type CardProps<T extends React.ElementType> = CardOwnProps<T> &
  Omit<React.ComponentPropsWithoutRef<T>, keyof CardOwnProps<T>>;

const DEFAULT_TAG = "div";

export default function Card<T extends React.ElementType = typeof DEFAULT_TAG>({
  as,
  padding = "lg",
  interactive = false,
  radius = "lg",
  className,
  children,
  ...rest
}: CardProps<T>) {
  const Tag = as || DEFAULT_TAG;

  return (
    <Tag
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
    </Tag>
  );
}
