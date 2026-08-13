"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // The raw message can carry query fragments, table names, or upstream service
  // detail. On a telepharmacy it could also carry consultation content, so it
  // goes to the console for the developer and never to the screen. `digest` is
  // the server-generated correlation id and is safe to show — it is what
  // support needs to find the matching server log.
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-fixed/30 to-primary-fixed/50 dark:from-surface-dark dark:to-surface-container-high">
      <div className="text-center max-w-md px-6">
        <div className="w-16 h-16 mx-auto mb-5 bg-error-container/60 rounded-full flex items-center justify-center">
          <AlertTriangle className="h-8 w-8 text-error" aria-hidden />
        </div>
        <h1 className="text-2xl font-bold text-on-surface mb-2">
          Something went wrong
        </h1>
        <p className="text-on-surface-variant mb-6">
          An unexpected error occurred. Your consultations and messages are
          unaffected — nothing has been lost.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-6 py-3 bg-medical-teal hover:bg-secondary text-white rounded-xl font-semibold transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-6 py-3 rounded-xl border border-outline-variant font-semibold text-on-surface transition-colors hover:border-soft-aqua"
          >
            Go home
          </Link>
        </div>
        {error.digest && (
          <p className="mt-6 text-xs text-outline">
            Reference: <span className="font-mono">{error.digest}</span>
          </p>
        )}
      </div>
    </div>
  );
}
