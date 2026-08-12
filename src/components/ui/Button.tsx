import { forwardRef } from "react";
import Link from "next/link";
import { cn } from "./cn";

/**
 * SafeMeds Vital button.
 *
 * Per DESIGN.md: primary is solid medical teal with a subtle 1.02 scale-up on
 * hover; secondary is transparent with a soft-aqua border; ghost is borderless
 * teal text for low-stakes actions like Cancel or Skip. Radius is 8px — pill
 * shapes are reserved for chips and badges so main controls keep their medical
 * authority.
 */
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "inverse";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-medical-teal text-white shadow-soft hover:bg-secondary disabled:hover:bg-medical-teal",
  secondary:
    "bg-transparent border border-soft-aqua text-medical-teal hover:bg-surface-variant dark:text-primary dark:border-primary/60 dark:hover:bg-surface-container-high",
  ghost:
    "bg-transparent text-medical-teal hover:bg-surface-variant dark:text-primary dark:hover:bg-surface-container-high",
  danger: "bg-error text-on-error shadow-soft hover:opacity-90",
  inverse: "bg-dark-navy text-white shadow-soft hover:bg-tertiary dark:bg-primary dark:text-on-primary",
};

const SIZES: Record<ButtonSize, string> = {
  // 44px minimum hit area on every size — the touch-target floor from the spec.
  sm: "min-h-11 py-2 px-4 text-sm",
  md: "min-h-11 py-3 px-6 text-sm",
  lg: "min-h-12 py-4 px-8 text-base",
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold tracking-[0.02em] " +
  "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] " +
  "hover:scale-[1.02] active:scale-[0.99] " +
  "disabled:pointer-events-none disabled:opacity-50 " +
  // Honour reduced-motion without a media query per component.
  "motion-reduce:transition-none motion-reduce:hover:scale-100";

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
}

type ButtonProps = CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>;
type AnchorProps = CommonProps & { href: string } & Omit<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    "href"
  >;

export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
}: Pick<CommonProps, "variant" | "size" | "fullWidth" | "className">) {
  return cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && "w-full", className);
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, fullWidth, className, children, type = "button", ...rest },
  ref
) {
  return (
    <button ref={ref} type={type} className={buttonClasses({ variant, size, fullWidth, className })} {...rest}>
      {children}
    </button>
  );
});

/** Same visual treatment, rendered as a Next link for navigation actions. */
export function ButtonLink({ variant, size, fullWidth, className, children, href, ...rest }: AnchorProps) {
  return (
    <Link href={href} className={buttonClasses({ variant, size, fullWidth, className })} {...rest}>
      {children}
    </Link>
  );
}

export default Button;
