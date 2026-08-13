import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { buttonClasses } from "./Button";
import { cn } from "./cn";

/**
 * The shared empty state (§56 — "every list must have a meaningful empty
 * state": icon, short explanation, relevant CTA).
 *
 * `description` is deliberately required. An empty list with only a heading
 * ("No consultations") leaves the user unsure whether nothing exists yet or
 * something failed to load — which is exactly the moment a privacy-sensitive
 * product should be reassuring rather than ambiguous. Empty is not an error,
 * and should not look like one: no error colouring here.
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; href: string };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-outline-variant px-6 py-14 text-center",
        className
      )}
    >
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>

      <h3 className="text-headline-md text-on-surface">{title}</h3>
      <p className="mt-2 max-w-sm text-on-surface-variant">{description}</p>

      {action && (
        <Link
          href={action.href}
          className={cn(buttonClasses({ variant: "primary", size: "md" }), "mt-6")}
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
