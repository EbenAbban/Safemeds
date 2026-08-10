"use client";

import { forwardRef, useId } from "react";
import { cn } from "./cn";

/**
 * Text field with a floating label and a 2px soft-aqua focus ring.
 *
 * Error text uses the muted brick red from the palette rather than a bright
 * neon — a medical intake form should not spike anxiety when a field is wrong.
 */
interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label: string;
  error?: string;
  hint?: string;
  leadingIcon?: React.ReactNode;
  trailingSlot?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, leadingIcon, trailingSlot, className, id, ...rest },
  ref
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className="w-full">
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold text-on-surface-variant">
        {label}
      </label>

      <div className="relative">
        {leadingIcon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
            {leadingIcon}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "min-h-11 w-full rounded-lg border bg-surface-container-lowest px-4 py-3 text-base text-on-surface",
            "placeholder:text-on-surface-variant/60",
            "transition-colors duration-200",
            "focus:outline-none focus:ring-2 focus:ring-soft-aqua focus:border-soft-aqua",
            "dark:bg-surface-container",
            error ? "border-error" : "border-outline-variant",
            leadingIcon ? "pl-10" : undefined,
            trailingSlot ? "pr-12" : undefined,
            className
          )}
          {...rest}
        />

        {trailingSlot && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2">{trailingSlot}</span>
        )}
      </div>

      {error ? (
        <p id={`${inputId}-error`} className="mt-1.5 text-sm text-error">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="mt-1.5 text-sm text-on-surface-variant">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export default Input;
