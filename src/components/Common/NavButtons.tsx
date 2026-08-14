"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Fixed back/forward controls shown on every page (mounted in the root layout).
// Uses the browser history so it works regardless of which page renders it.
//
// These float above page content, so `body` reserves matching bottom padding in
// globals.css. Without it these buttons sat on top of whatever was at the foot
// of the page — including interactive controls, which could not then be
// clicked at all.
export default function NavButtons() {
  const router = useRouter();

  return (
    <div className="fixed bottom-4 left-3 z-[60] flex items-center gap-2 print:hidden">
      <button
        onClick={() => router.back()}
        aria-label="Go back"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant/60 bg-surface-container-lowest/80 text-on-surface-variant shadow-soft backdrop-blur-md transition-colors hover:bg-surface-container-lowest hover:text-on-surface dark:bg-surface-container/80 dark:hover:bg-surface-container-high"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={() => router.forward()}
        aria-label="Go forward"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant/60 bg-surface-container-lowest/80 text-on-surface-variant shadow-soft backdrop-blur-md transition-colors hover:bg-surface-container-lowest hover:text-on-surface dark:bg-surface-container/80 dark:hover:bg-surface-container-high"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
