"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Fixed back/forward controls shown on every page (mounted in the root layout).
// Uses the browser history so it works regardless of which page renders it.
export default function NavButtons() {
  const router = useRouter();

  return (
    <div className="fixed top-3 left-3 z-[60] flex items-center gap-2 print:hidden">
      <button
        onClick={() => router.back()}
        aria-label="Go back"
        className="w-9 h-9 rounded-full flex items-center justify-center bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 shadow-sm backdrop-blur-md hover:bg-white dark:hover:bg-gray-700 transition-colors cursor-pointer"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={() => router.forward()}
        aria-label="Go forward"
        className="w-9 h-9 rounded-full flex items-center justify-center bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 shadow-sm backdrop-blur-md hover:bg-white dark:hover:bg-gray-700 transition-colors cursor-pointer"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
