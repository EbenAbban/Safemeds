"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, MailCheck } from "lucide-react";
import { buttonClasses } from "@/components/ui";

/**
 * Confirm an email address with the six-digit code that was emailed.
 *
 * A code rather than a link: it is typed once and works on whatever device the
 * person is already using, instead of requiring them to open a mail client,
 * click through, and land in whichever browser that app happens to prefer.
 *
 * ?email= is prefilled from the signup redirect so the common path is a single
 * field. It stays editable for anyone arriving here later from sign-in.
 */
function VerifyEmailInner() {
  const params = useSearchParams();
  const router = useRouter();

  const [email, setEmail] = useState(params.get("email") ?? "");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [done, setDone] = useState(false);

  // Signup redirects here having just sent a code, so say so rather than
  // leaving the reader wondering whether anything happened.
  useEffect(() => {
    if (params.get("sent") === "1") {
      setNotice("We've emailed you a six-digit code. It expires in 30 minutes.");
    }
  }, [params]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !code.trim() || busy) return;

    setBusy(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json().catch(() => ({}));

      if (data.status === "verified" || data.status === "already-verified") {
        setDone(true);
        setTimeout(() => router.push("/auth"), 2500);
        return;
      }
      setError(data.error ?? "That code is not correct.");
    } catch {
      setError("Could not confirm the code. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (!email.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      setNotice(data.message ?? "If that address needs confirming, a code is on its way.");
      setCode("");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface p-4 dark:bg-surface-dark">
        <div className="w-full max-w-md rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-8 text-center shadow-soft dark:bg-surface-container">
          <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-secondary-container">
            <CheckCircle2 className="h-7 w-7 text-on-secondary-container" aria-hidden="true" />
          </span>
          <h1 className="text-headline-md text-on-surface">Email confirmed</h1>
          <p className="mt-3 text-on-surface-variant">
            Your address is verified and your account is ready. Taking you to sign in…
          </p>
          <Link
            href="/auth"
            className={`${buttonClasses({ variant: "primary", size: "md", fullWidth: true })} mt-6`}
          >
            Sign in now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4 dark:bg-surface-dark">
      <div className="w-full max-w-md rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-8 shadow-soft dark:bg-surface-container">
        <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-surface-container-high">
          <MailCheck className="h-7 w-7 text-medical-teal dark:text-primary" aria-hidden="true" />
        </span>

        <h1 className="text-center text-headline-md text-on-surface">Confirm your email</h1>
        <p className="mt-3 text-center text-on-surface-variant">
          Enter the six-digit code we emailed you.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="ve-email" className="mb-1.5 block text-sm font-semibold text-on-surface-variant">
              Email address
            </label>
            <input
              id="ve-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="min-h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-on-surface dark:bg-surface-container-high"
            />
          </div>

          <div>
            <label htmlFor="ve-code" className="mb-1.5 block text-sm font-semibold text-on-surface-variant">
              Confirmation code
            </label>
            <input
              id="ve-code"
              // Numeric keypad on phones, and one-tap fill from the OS when the
              // code is read out of the email.
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="min-h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-center font-mono text-2xl tracking-[0.4em] text-on-surface dark:bg-surface-container-high"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-lg border border-error/30 bg-error-container px-4 py-3 text-sm text-on-error-container">
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="rounded-lg bg-surface-container-high px-4 py-3 text-sm text-on-surface-variant">
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || code.length !== 6 || !email.trim()}
            className={buttonClasses({ variant: "primary", size: "lg", fullWidth: true })}
          >
            {busy ? "Confirming…" : "Confirm email"}
          </button>
        </form>

        <button
          onClick={resend}
          disabled={busy || !email.trim()}
          className="mt-4 w-full text-sm text-on-surface-variant underline disabled:opacity-50"
        >
          Send a new code
        </button>

        <Link
          href="/auth"
          className={`${buttonClasses({ variant: "secondary", size: "md", fullWidth: true })} mt-4`}
        >
          Back to sign in
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
