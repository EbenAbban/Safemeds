import { cn } from "./cn";

/**
 * Pill-shaped status chip.
 *
 * Used for "Anonymous", "Verified", consultation and delivery status. Low
 * saturation background tint with high-contrast text, per DESIGN.md — these
 * carry privacy meaning, so they must read clearly without shouting.
 */
export type BadgeTone = "neutral" | "primary" | "success" | "warning" | "danger" | "info";

const TONES: Record<BadgeTone, string> = {
  neutral:
    "bg-surface-container-high text-on-surface-variant dark:bg-surface-container-high dark:text-on-surface-variant",
  primary: "bg-primary-fixed text-on-primary-fixed dark:bg-primary-container dark:text-on-primary-container",
  success: "bg-secondary-container text-on-secondary-container dark:bg-secondary-container dark:text-on-secondary-container",
  warning: "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200",
  danger: "bg-error-container text-on-error-container dark:bg-error-container dark:text-on-error-container",
  info: "bg-tertiary-fixed text-on-tertiary-fixed dark:bg-tertiary-container dark:text-on-tertiary-container",
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export default function Badge({ tone = "neutral", icon, className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-[0.02em]",
        TONES[tone],
        className
      )}
      {...rest}
    >
      {icon}
      {children}
    </span>
  );
}
