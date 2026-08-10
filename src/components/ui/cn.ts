/**
 * Minimal class-name joiner.
 *
 * Deliberately not clsx + tailwind-merge: the primitives in this directory put
 * caller-supplied classes last, and Tailwind's generated CSS has a single
 * source order, so later utilities in the same class string already win. Adding
 * two dependencies to solve a problem this codebase does not have would be
 * weight for nothing.
 */
export type ClassValue = string | number | null | false | undefined;

export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}
