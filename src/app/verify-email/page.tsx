"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Clock, MailWarning, MailCheck } from "lucide-react";
import { buttonClasses } from "@/components/ui";

/**
 * Where the emailed confirmation link lands, via a redirect from
 * /api/auth/verify-email so the token never sits in a shareable address bar.
 *
 * "Already verified" is treated as success rather than an error. Mail clients
 * prefetch links, and people click twice; neither is a failure, and reporting
 * one would send a verified user off to fix a problem they do not have.
 */
const OUTCOMES = {
  verified: {
    Icon: CheckCircle2,
    tone: "text-secondary",
    title: "Email confirmed",
    body: "Your address is verified. You can sign in now.",
    showResend: false,
  },
  "already-verified": {
    Icon: MailCheck,
    tone: "text-secondary",
    title: "Already confirmed",
    body: "This address was verified previously. You can sign in.",
    showResend: false,
  },
  expired: {
    Icon: Clock,
    tone: "text-on-surface-variant",
    title: "That link has expired",
    body: "Verification links last 24 hours. Request a new one below.",
    showResend: true,
  },
  invalid: {
    Icon: MailWarning,
    tone: "text-on-surface-variant",
    title: "That link isn't valid",
    body: "It may have been superseded by a newer link. Request a fresh one below.",
    showResend: true,
  },
} as const;

function VerifyEmailInner() {
  const params = useSearchParams();
  const status = (params.get("status") ?? "invalid") as keyof typeof OUTCOMES;
  const outcome = OUTCOMES[status] ?? OUTCOMES.invalid;
  const { Icon } = outcome;

  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState("");

  const resend = async () => {
    if (!email.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      setSent(data.message ?? "If that address needs confirming, a new link is on its way.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4 dark:bg-surface-dark">
      <div className="w-full max-w-md rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-8 text-center shadow-soft dark:bg-surface-container">
        <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-surface-container-high">
          <Icon className={`h-7 w-7 ${outcome.tone}`} aria-hidden="true" />
        </span>

        <h1 className="text-headline-md text-on-surface">{outcome.title}</h1>
        <p className="mt-3 text-on-surface-variant">{outcome.body}</p>

        {outcome.showResend && (
          <div className="mt-6 text-left">
            <label htmlFor="resend-email" className="mb-1.5 block text-sm font-semibold text-on-surface-variant">
              Email address
            </label>
            <input
              id="resend-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="min-h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-on-surface dark:bg-surface-container-high"
            />
            <button
              onClick={resend}
              disabled={sending || !email.trim()}
              className={`${buttonClasses({ variant: "primary", size: "md", fullWidth: true })} mt-3`}
            >
              {sending ? "Sending…" : "Send a new link"}
            </button>
            {sent && (
              <p role="status" className="mt-3 text-sm text-on-surface-variant">
                {sent}
              </p>
            )}
          </div>
        )}

        <Link
          href="/auth"
          className={`${buttonClasses({ variant: "secondary", size: "md", fullWidth: true })} mt-6`}
        >
          Go to sign in
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  // useSearchParams needs a Suspense boundary in the App Router.
  return (
    <Suspense fallback={null}>
      <VerifyEmailInner />
    </Suspense>
  );
}
