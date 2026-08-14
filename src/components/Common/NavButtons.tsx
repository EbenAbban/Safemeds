"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Fixed back/forward controls shown on every page (mounted in the root layout).
// Uses the browser history so it works regardless of which page renders it.
//
// Desktop only. On a phone these floated over mid-page content wherever the
// user happened to be scrolled — on /consult they covered the "Describe your
// health concern" label and part of the field beneath it. A fixed control
// always overlaps whatever scrolls under it, and reserving clearance only
// fixes the foot of the document, not the middle.
//
// Phones already have a back gesture and a browser back button, so these were
// duplicating navigation the platform provides while costing usable screen on
// the smallest viewport. `body` still reserves bottom padding in globals.css
// for the theme toggle, which remains fixed at every size.
export default function NavButtons() {
  const router = useRouter();

  return (
    <div className="fixed bottom-4 left-3 z-[60] hidden items-center gap-2 md:flex print:hidden">
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
