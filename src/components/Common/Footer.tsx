"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui";

/**
 * Public marketing footer — SafeMeds Vital.
 *
 * Structure follows design.md §21 (logo + message, Platform, Support, Legal,
 * bottom bar). Social icons are omitted rather than faked — the spec says
 * "where actually available," and SafeMeds has no live social accounts to
 * link to. The security/status line the spec allows is used instead, since it
 * is true today and reinforces the product's actual privacy claim.
 */
const FOOTER_LINK_CLASS =
  "text-sm text-on-surface-variant transition-colors hover:text-soft-aqua dark:hover:text-primary-fixed-dim";

export default function Footer() {
  return (
    <footer className="border-t border-outline-variant/60 bg-surface-container-low dark:bg-surface-dark">
      <Container className="py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <h3 className="font-display text-lg font-bold text-medical-teal dark:text-primary-fixed-dim">
              SafeMeds
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
              Secure, anonymous healthcare consultations for students. Licensed
              pharmacists, private messaging, and prescription delivery — no
              account required to get help.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-on-surface-variant">
              Platform
            </h4>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/consult" className={FOOTER_LINK_CLASS}>
                  Consult a Pharmacist
                </Link>
              </li>
              <li>
                <Link href="/medications" className={FOOTER_LINK_CLASS}>
                  Medications
                </Link>
              </li>
              <li>
                <Link href="/orders" className={FOOTER_LINK_CLASS}>
                  Orders
                </Link>
              </li>
              <li>
                <Link href="/delivery" className={FOOTER_LINK_CLASS}>
                  Delivery
                </Link>
              </li>
              <li>
                <Link href="/track" className={FOOTER_LINK_CLASS}>
                  Track Consultation
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-on-surface-variant">
              Support
            </h4>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/contact" className={FOOTER_LINK_CLASS}>
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/about" className={FOOTER_LINK_CLASS}>
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/legal?tab=faq" className={FOOTER_LINK_CLASS}>
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/auth" className={FOOTER_LINK_CLASS}>
                  Sign In
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-on-surface-variant">
              Legal
            </h4>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/legal?tab=privacy" className={FOOTER_LINK_CLASS}>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/legal?tab=terms" className={FOOTER_LINK_CLASS}>
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/legal?tab=hipaa" className={FOOTER_LINK_CLASS}>
                  HIPAA Compliance
                </Link>
              </li>
              <li>
                <Link href="/legal?tab=disclaimer" className={FOOTER_LINK_CLASS}>
                  Medical Disclaimer
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-outline-variant/60 pt-6 sm:flex-row">
          <p className="text-sm text-on-surface-variant">
            &copy; {new Date().getFullYear()} SafeMeds. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <ShieldCheck className="h-4 w-4 text-secondary" aria-hidden="true" />
            Private by design — consultations are never linked to your identity unless you choose.
          </div>
        </div>
      </Container>
    </footer>
  );
}
