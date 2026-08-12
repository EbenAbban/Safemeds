import { twMerge } from "tailwind-merge";

/**
 * Class-name joiner with real Tailwind conflict resolution.
 *
 * Every primitive here accepts a caller `className` appended after its own
 * base classes, expecting the caller's utility to win (e.g. overriding a
 * Card's background). Tailwind's generated stylesheet does NOT guarantee
 * that later-in-the-class-string wins — CSS ties are broken by the utility's
 * position in the compiled file, not its position in the `class` attribute —
 * so a naive string join produces a real coinflip bug the first time two
 * conflicting utilities of equal specificity meet (found while building the
 * landing page: a card's tint override silently lost to its own default
 * background). twMerge resolves same-property Tailwind utilities correctly
 * regardless of source order.
 */
export type ClassValue = string | number | null | false | undefined;

export function cn(...classes: ClassValue[]): string {
  return twMerge(classes.filter(Boolean).join(" "));
}
