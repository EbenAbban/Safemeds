"use client";

import { forwardRef, useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "./cn";

/**
 * Select field, matching Input's label / error / hint contract so the two can
 * sit side by side in a form row without drifting apart visually.
 *
 * A native <select> on purpose: it gets the platform picker on mobile, which
 * is both faster to use and more accessible than any custom listbox, and it
 * needs no JavaScript to open.
 */
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;
  /** Shown first and non-selectable, so the field starts genuinely empty. */
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, placeholder, className, id, children, ...rest },
  ref
) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const describedBy = error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined;

  return (
    <div className="w-full">
      <label htmlFor={selectId} className="mb-1.5 block text-sm font-semibold text-on-surface-variant">
        {label}
      </label>

      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "min-h-11 w-full appearance-none rounded-lg border bg-surface-container-lowest px-4 py-3 pr-10 text-base text-on-surface",
            "transition-colors duration-200",
            "focus:border-soft-aqua focus:outline-none focus:ring-2 focus:ring-soft-aqua",
            "dark:bg-surface-container",
            error ? "border-error" : "border-outline-variant",
            className
          )}
          {...rest}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {children}
        </select>

        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
        />
      </div>

      {error ? (
        <p id={`${selectId}-error`} className="mt-1.5 text-sm text-error">
          {error}
        </p>
      ) : hint ? (
        <p id={`${selectId}-hint`} className="mt-1.5 text-sm text-on-surface-variant">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export default Select;
