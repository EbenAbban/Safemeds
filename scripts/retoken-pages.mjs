// One-time mechanical retoken pass for pages that have no supplied design
// mockup in the SafeMeds Vital redesign. Purely a class-string substitution —
// never touches JSX structure, handlers, or business logic. Ordered
// most-specific first: paired "light dark:" phrases collapse into a single
// auto-adapting token (the new token system already handles dark mode via
// CSS custom properties, so `text-gray-900 dark:text-white` and
// `text-on-surface` are equivalent, just one is one class instead of two).
// Run once, reviewed via tsc/vitest/build, not meant to be re-run blindly.

import { readFileSync, writeFileSync } from "node:fs";

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("Usage: node scripts/retoken-pages.mjs <file> [file...]");
  process.exit(1);
}

// [pattern, replacement] — pattern strings are treated as literal phrases
// unless they start with "/", in which case they're a regex.
const RULES = [
  // ---- paired light/dark phrases -> single token ----
  ["text-gray-900 dark:text-white", "text-on-surface"],
  ["text-gray-800 dark:text-white", "text-on-surface"],
  ["text-gray-700 dark:text-gray-300", "text-on-surface-variant"],
  ["text-gray-700 dark:text-white", "text-on-surface"],
  ["text-gray-600 dark:text-gray-300", "text-on-surface-variant"],
  ["text-gray-600 dark:text-gray-400", "text-on-surface-variant"],
  ["text-gray-500 dark:text-gray-400", "text-on-surface-variant"],
  ["text-gray-500 dark:text-gray-500", "text-on-surface-variant"],
  ["text-gray-400 dark:text-gray-500", "text-outline"],
  ["text-gray-400 dark:text-gray-600", "text-outline"],
  ["bg-white dark:bg-gray-800", "bg-surface-container-lowest dark:bg-surface-container"],
  ["bg-white dark:bg-gray-900", "bg-surface-container-lowest dark:bg-surface-dark"],
  ["bg-gray-50 dark:bg-gray-900", "bg-surface dark:bg-surface-dark"],
  ["bg-gray-50 dark:bg-gray-800", "bg-surface-container-low dark:bg-surface-container"],
  ["bg-gray-100 dark:bg-gray-700", "bg-surface-container-high dark:bg-surface-container-high"],
  ["bg-gray-100 dark:bg-gray-800", "bg-surface-container-low dark:bg-surface-container"],
  ["border-gray-200 dark:border-gray-700", "border-outline-variant/60"],
  ["border-gray-200 dark:border-gray-600", "border-outline-variant/60"],
  ["border-gray-300 dark:border-gray-600", "border-outline-variant"],
  ["hover:bg-gray-50 dark:hover:bg-gray-700", "hover:bg-surface-container-high"],
  ["hover:bg-gray-100 dark:hover:bg-gray-700", "hover:bg-surface-container-high"],
  ["hover:bg-gray-100 dark:hover:bg-gray-800", "hover:bg-surface-container-high"],
  ["hover:text-gray-900 dark:hover:text-white", "hover:text-on-surface"],
  ["hover:text-gray-700 dark:hover:text-gray-300", "hover:text-on-surface"],
  ["placeholder-gray-400 dark:placeholder-gray-600", "placeholder:text-on-surface-variant/60"],
  ["placeholder-gray-400 dark:placeholder-gray-500", "placeholder:text-on-surface-variant/60"],

  // ---- brand color families -> medical teal / soft aqua / error ----
  ["bg-blue-600 hover:bg-blue-700", "bg-medical-teal hover:bg-secondary"],
  ["bg-indigo-600 hover:bg-indigo-700", "bg-medical-teal hover:bg-secondary"],
  ["text-blue-600 dark:text-blue-400", "text-medical-teal dark:text-primary-fixed-dim"],
  ["text-indigo-600 dark:text-indigo-400", "text-medical-teal dark:text-primary-fixed-dim"],
  ["hover:text-blue-600 dark:hover:text-blue-400", "hover:text-medical-teal dark:hover:text-primary-fixed-dim"],
  ["hover:text-indigo-600 dark:hover:text-indigo-400", "hover:text-medical-teal dark:hover:text-primary-fixed-dim"],
  ["focus:ring-blue-500", "focus:ring-soft-aqua"],
  ["focus:ring-indigo-500", "focus:ring-soft-aqua"],
  ["bg-red-500 hover:bg-red-600", "bg-error hover:opacity-90"],
  ["bg-red-600 hover:bg-red-700", "bg-error hover:opacity-90"],
  ["text-red-600 dark:text-red-400", "text-error"],
  ["text-red-500 dark:text-red-400", "text-error"],
  ["bg-red-50 dark:bg-red-950", "bg-error-container"],
  ["border-red-200 dark:border-red-800", "border-error/30"],
  ["bg-green-500 hover:bg-green-600", "bg-secondary hover:opacity-90"],
  ["bg-green-600 hover:bg-green-700", "bg-secondary hover:opacity-90"],
  ["text-green-600 dark:text-green-400", "text-secondary"],
  ["bg-green-50 dark:bg-green-950", "bg-secondary-container/40"],
  ["border-green-200 dark:border-green-800", "border-secondary/30"],
  ["bg-purple-500 hover:bg-purple-600", "bg-tertiary hover:opacity-90"],
  ["bg-purple-600 hover:bg-purple-700", "bg-tertiary hover:opacity-90"],
  ["text-purple-600 dark:text-purple-400", "text-tertiary"],

  // ---- status badge pairs (bg-X-100 + text-X-800 pattern) ----
  ["bg-green-100 text-green-800", "bg-secondary-container text-on-secondary-container"],
  ["bg-red-100 text-red-800", "bg-error-container text-on-error-container"],
  ["bg-blue-100 text-blue-800", "bg-primary-fixed text-on-primary-fixed"],
  ["bg-purple-100 text-purple-800", "bg-tertiary-fixed text-on-tertiary-fixed"],
  ["dark:bg-green-900/30 dark:text-green-300", "dark:bg-secondary-container dark:text-on-secondary-container"],
  ["dark:bg-red-900/30 dark:text-red-300", "dark:bg-error-container dark:text-on-error-container"],
  ["dark:bg-blue-900/30 dark:text-blue-300", "dark:bg-primary-container dark:text-on-primary-container"],

  // ---- more paired light/dark phrases ----
  ["dark:bg-gray-700/50", "dark:bg-surface-container-high/50"],
  ["dark:bg-gray-700", "dark:bg-surface-container-high"],
  ["dark:text-gray-100", "dark:text-on-surface"],
  ["dark:text-gray-200", "dark:text-on-surface"],
  ["dark:border-gray-700", "dark:border-outline-variant/40"],
  ["dark:border-gray-600", "dark:border-outline-variant/40"],
  ["divide-gray-700", "divide-outline-variant/40"],
  ["dark:hover:text-gray-200", "dark:hover:text-on-surface"],
  ["dark:hover:bg-gray-700", "dark:hover:bg-surface-container-high"],
  ["hover:bg-gray-400", "hover:bg-outline-variant"],
  ["bg-gray-300", "bg-outline-variant"],

  // ---- remaining brand-color odds and ends ----
  ["hover:bg-blue-700", "hover:bg-secondary"],
  ["hover:bg-green-700", "hover:opacity-90"],
  ["hover:bg-purple-700", "hover:opacity-90"],
  ["hover:bg-red-50", "hover:bg-error-container/60"],
  ["hover:bg-green-50", "hover:bg-secondary-container/30"],
  ["hover:bg-blue-50", "hover:bg-primary-fixed/40"],
  ["hover:bg-blue-100", "hover:bg-primary-fixed/60"],
  ["hover:text-blue-900", "hover:text-primary"],
  ["hover:text-blue-700", "hover:text-secondary"],
  ["focus:ring-purple-500", "focus:ring-soft-aqua"],
  ["focus:ring-green-500", "focus:ring-soft-aqua"],
  ["border-red-200", "border-error/30"],
  ["border-red-500", "border-error"],
  ["border-purple-500", "border-tertiary"],
  ["border-purple-200", "border-tertiary-fixed"],
  ["border-green-200", "border-secondary/30"],
  ["border-blue-200", "border-primary-fixed"],
  ["bg-green-600", "bg-secondary"],
  ["bg-green-500", "bg-secondary"],
  ["bg-purple-600", "bg-tertiary"],
  ["bg-blue-500", "bg-soft-aqua"],
  ["bg-blue-50", "bg-primary-fixed/30"],
  ["bg-blue-100", "bg-primary-fixed/50"],
  ["bg-red-50", "bg-error-container/60"],
  ["bg-purple-50", "bg-tertiary-fixed/40"],
  ["text-red-400", "text-error"],
  ["text-blue-700", "text-primary"],
  ["text-blue-800", "text-primary"],
  ["dark:text-red-300", "dark:text-on-error-container"],
  ["dark:text-green-300", "dark:text-on-secondary-container"],
  ["from-gray-900", "from-surface-dark"],
  ["to-gray-800", "to-surface-container-high"],
  ["from-blue-50", "from-primary-fixed/30"],
  ["to-blue-100", "to-primary-fixed/50"],
  ["from-purple-50", "from-tertiary-fixed/30"],
  ["to-purple-100", "to-tertiary-fixed/50"],

  // ---- third pass: slate + remaining grey variants ----
  ["text-slate-700 dark:text-slate-300", "text-on-surface-variant"],
  ["dark:bg-gray-800/80", "dark:bg-surface-container/80"],
  ["dark:bg-gray-800/60", "dark:bg-surface-container/60"],
  ["dark:text-gray-400", "dark:text-on-surface-variant"],
  ["from-gray-900", "from-surface-dark"],
  ["to-gray-900", "to-surface-dark"],
  ["to-gray-800", "to-surface-container-high"],

  // ---- single-token fallbacks (no dark: pair in source) ----
  ["/\\btext-gray-900\\b/g", "text-on-surface"],
  ["/\\btext-gray-800\\b/g", "text-on-surface"],
  ["/\\btext-gray-700\\b/g", "text-on-surface-variant"],
  ["/\\btext-gray-600\\b/g", "text-on-surface-variant"],
  ["/\\btext-gray-500\\b/g", "text-on-surface-variant"],
  ["/\\btext-gray-400\\b/g", "text-outline"],
  ["/\\bbg-gray-50\\b/g", "bg-surface"],
  ["/\\bbg-gray-100\\b/g", "bg-surface-container-low"],
  ["/\\bbg-gray-200\\b/g", "bg-surface-container-high"],
  ["/\\bbg-white\\b/g", "bg-surface-container-lowest"],
  ["/\\bborder-gray-200\\b/g", "border-outline-variant/60"],
  ["/\\bborder-gray-300\\b/g", "border-outline-variant"],
  ["/\\bdivide-gray-100\\b/g", "divide-outline-variant/60"],
  ["/\\bdivide-gray-200\\b/g", "divide-outline-variant/60"],
  ["/\\bbg-blue-600\\b/g", "bg-medical-teal"],
  ["/\\bbg-indigo-600\\b/g", "bg-medical-teal"],
  ["/\\btext-blue-600\\b/g", "text-medical-teal"],
  ["/\\btext-indigo-600\\b/g", "text-medical-teal"],
  ["/\\btext-blue-500\\b/g", "text-soft-aqua"],
  ["/\\bborder-blue-500\\b/g", "border-soft-aqua"],
  ["/\\btext-red-600\\b/g", "text-error"],
  ["/\\btext-green-600\\b/g", "text-secondary"],
  ["/\\btext-green-800\\b/g", "text-on-secondary-container"],
  ["/\\btext-red-800\\b/g", "text-on-error-container"],
  ["/\\btext-purple-600\\b/g", "text-tertiary"],
  ["/\\btext-purple-800\\b/g", "text-on-tertiary-container"],
];

let totalReplacements = 0;

for (const file of files) {
  let content = readFileSync(file, "utf8");
  let fileReplacements = 0;

  for (const [pattern, replacement] of RULES) {
    if (pattern.startsWith("/")) {
      const lastSlash = pattern.lastIndexOf("/");
      const body = pattern.slice(1, lastSlash);
      const flags = pattern.slice(lastSlash + 1);
      const re = new RegExp(body, flags);
      const matches = content.match(re);
      if (matches) fileReplacements += matches.length;
      content = content.replace(re, replacement);
    } else {
      const count = content.split(pattern).length - 1;
      if (count > 0) {
        fileReplacements += count;
        content = content.split(pattern).join(replacement);
      }
    }
  }

  writeFileSync(file, content, "utf8");
  console.log(`${file}: ${fileReplacements} replacements`);
  totalReplacements += fileReplacements;
}

console.log(`\nTotal: ${totalReplacements} replacements across ${files.length} files`);
