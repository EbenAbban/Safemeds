import { cn } from "./cn";

/**
 * Layout primitives.
 *
 * A single content width (1280px, 1440px for major hero layouts) with fluid
 * gutters — 20px mobile, 32px tablet, 48px desktop, 64px+ large — so content
 * never touches the viewport edge unintentionally.
 */
export function Container({
  wide = false,
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { wide?: boolean }) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-5 sm:px-8 lg:px-12 xl:px-16",
        wide ? "max-w-[1440px]" : "max-w-[1280px]",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/** Vertical rhythm wrapper — generous section spacing, 72px → 120px fluid. */
export function Section({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <section className={cn("section-y", className)} {...rest}>
      {children}
    </section>
  );
}

interface SectionHeadingProps {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className
      )}
    >
      {eyebrow && (
        <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-medical-teal dark:text-primary">
          {eyebrow}
        </span>
      )}
      <h2 className="text-headline-lg text-on-surface">{title}</h2>
      {description && (
        <p className="mt-4 text-lg leading-relaxed text-on-surface-variant">{description}</p>
      )}
    </div>
  );
}
