"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { ButtonLink, Container } from "@/components/ui";

/**
 * Public marketing header — SafeMeds Vital.
 *
 * Nav labels match the design system's hero mockup exactly (Consultations,
 * Pharmacy, Delivery, About), each mapped to the closest real route rather
 * than a fictional marketing page: "Pharmacy" -> /auth (the pharmacist portal
 * entry point), the rest are direct matches. Never a dead link.
 *
 * Per design.md §6: sticky, and on scroll the header tightens — background
 * goes opaque, blur increases, a hairline border and soft shadow appear. Kept
 * subtle; this is a healthcare product; the header should recede, not perform.
 *
 * The utility strip above the nav (pulsing dot + availability line) rides in
 * the same sticky unit, matching the mockup's two-tier fixed header.
 */
const NAV_LINKS = [
  { href: "/consult", label: "Consultations" },
  { href: "/auth", label: "Pharmacy" },
  { href: "/delivery", label: "Delivery" },
  { href: "/about", label: "About" },
] as const;

export default function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close on route change, and never carry a stale open menu across navigation.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Body scroll lock + Escape-to-close while the fullscreen mobile menu is open.
  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Utility strip — availability line with a pulsing status dot, per the
          design system's hero mockup. Copy is deliberately honest: it states
          pharmacists are reachable, not a live headcount SafeMeds has no way
          to actually track. */}
      <div className="flex items-center justify-center gap-2 bg-medical-teal py-2 text-sm font-medium text-white dark:bg-primary-container">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-soft-aqua opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-soft-aqua" />
        </span>
        Licensed pharmacists available for anonymous consultations
      </div>

      <div
        className={[
          "w-full transition-all duration-300",
          scrolled
            ? "bg-surface/90 dark:bg-surface-dark/90 backdrop-blur-lg shadow-soft border-b border-outline-variant/60"
            : "bg-surface/60 dark:bg-surface-dark/60 backdrop-blur-md border-b border-transparent",
        ].join(" ")}
      >
      <Container>
        <div className={["flex items-center justify-between transition-all duration-300", scrolled ? "h-16" : "h-20"].join(" ")}>
          <Link
            href="/"
            className="font-display text-xl font-bold text-medical-teal transition-colors hover:text-soft-aqua dark:text-primary-fixed-dim"
          >
            SafeMeds
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-on-surface-variant transition-colors hover:text-soft-aqua dark:hover:text-primary-fixed-dim"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/auth"
              className="px-3 py-2 text-sm font-semibold text-on-surface-variant transition-colors hover:text-medical-teal dark:hover:text-primary-fixed-dim"
            >
              Sign In
            </Link>
            <ButtonLink href="/consult" size="sm">
              Start Consultation
            </ButtonLink>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container md:hidden"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </Container>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 top-[104px] z-40 bg-surface dark:bg-surface-dark md:hidden"
          >
            <nav className="flex h-full flex-col px-6 py-8">
              <div className="flex flex-1 flex-col gap-1">
                {NAV_LINKS.map((link, index) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.05 }}
                  >
                    <Link
                      href={link.href}
                      className="block rounded-lg px-3 py-4 text-lg font-semibold text-on-surface transition-colors hover:bg-surface-container hover:text-medical-teal"
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: NAV_LINKS.length * 0.05 }}
                className="flex flex-col gap-3 border-t border-outline-variant/60 pt-6"
              >
                <ButtonLink href="/auth" variant="secondary" fullWidth>
                  Sign In
                </ButtonLink>
                <ButtonLink href="/consult" fullWidth>
                  Start Consultation
                </ButtonLink>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
