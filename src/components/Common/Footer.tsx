"use client";

import Link from "next/link";
import { Container } from "@/components/ui";

/**
 * Public marketing footer — SafeMeds Vital.
 *
 * Column structure (Brand, Legal, Partners, Help) matches the design
 * system's hero mockup exactly. "Campus Partners" has no dedicated page yet
 * — routed to /about rather than left as a dead link or invented page.
 * Social icons are omitted rather than faked — the spec says "where actually
 * available," and SafeMeds has no live social accounts to link to.
 */
const FOOTER_LINK_CLASS =
  "text-sm text-on-surface-variant transition-colors hover:text-soft-aqua dark:hover:text-primary-fixed-dim";

export default function Footer() {
  return (
    <footer className="border-t border-outline-variant/60 bg-surface-container-lowest dark:bg-surface-dark">
      <Container className="py-section-gap">
        <div className="grid grid-cols-1 gap-x-gutter gap-y-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <Link
              href="/"
              className="font-display block text-lg font-bold text-medical-teal dark:text-inverse-primary"
            >
              SafeMeds
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-on-surface-variant">
              &copy; {new Date().getFullYear()} SafeMeds.
              <br />
              Anonymous-first healthcare for students.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-dark-navy dark:text-on-surface">
              Legal
            </h4>
            <Link href="/legal?tab=privacy" className={FOOTER_LINK_CLASS}>
              Privacy Policy
            </Link>
            <Link href="/legal?tab=terms" className={FOOTER_LINK_CLASS}>
              Terms of Service
            </Link>
            <Link href="/legal?tab=hipaa" className={FOOTER_LINK_CLASS}>
              HIPAA Compliance
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-dark-navy dark:text-on-surface">
              Partners
            </h4>
            <Link href="/auth" className={FOOTER_LINK_CLASS}>
              Pharmacist Portal
            </Link>
            <Link href="/about" className={FOOTER_LINK_CLASS}>
              Campus Partners
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-dark-navy dark:text-on-surface">
              Help
            </h4>
            <Link href="/contact" className={FOOTER_LINK_CLASS}>
              Support
            </Link>
            <Link href="/legal?tab=faq" className={FOOTER_LINK_CLASS}>
              FAQ
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
