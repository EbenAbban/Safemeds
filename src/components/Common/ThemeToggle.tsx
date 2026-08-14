"use client";

import { useTheme } from "@/context/ThemeContext";

/**
 * Deliberately free of framer-motion.
 *
 * This renders in the root layout, so anything it imports lands in the shared
 * bundle for all 48 routes — pages that never animate were paying for an
 * animation library to scale a button on hover and spin an icon 180 degrees.
 * Both are CSS transitions, and `motion-reduce:` keeps the reduced-motion
 * behaviour the Framer version had.
 */

interface ThemeToggleProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "button" | "icon";
}

export default function ThemeToggle({
  className = "",
  size = "md",
  variant = "button",
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  if (variant === "icon") {
    return (
      <button
        onClick={toggleTheme}
        className={`${sizeClasses[size]} rounded-full bg-surface-container-high dark:bg-surface-container-high hover:bg-outline-variant dark:hover:bg-gray-600 flex items-center justify-center transition-[colors,transform] duration-200 hover:scale-105 active:scale-95 motion-reduce:transform-none ${className}`}
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      >
        <div
          className={`${iconSizes[size]} transition-transform duration-300 motion-reduce:transition-none ${
            theme === "dark" ? "rotate-180" : "rotate-0"
          }`}
        >
          {theme === "light" ? (
            <svg
              className="w-full h-full text-on-surface-variant"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          ) : (
            <svg
              className="w-full h-full text-yellow-300"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={`px-4 py-2 rounded-lg bg-surface-container-high dark:bg-surface-container-high hover:bg-outline-variant dark:hover:bg-gray-600 text-on-surface-variant dark:text-on-surface flex items-center gap-2 font-medium transition-[colors,transform] duration-200 hover:scale-[1.02] active:scale-[0.98] motion-reduce:transform-none ${className}`}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      <div
        className={`${iconSizes[size]} transition-transform duration-300 motion-reduce:transition-none ${
          theme === "dark" ? "rotate-180" : "rotate-0"
        }`}
      >
        {theme === "light" ? (
          <svg
            className="w-full h-full"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        ) : (
          <svg
            className="w-full h-full"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>
      <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
    </button>
  );
}
