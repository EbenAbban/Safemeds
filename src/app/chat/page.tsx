"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MessageSquarePlus, ShieldCheck, UserCheck } from "lucide-react";
import Navigation from "@/components/Common/Navigation";
import ConsultationChat from "@/components/Chat/ConsultationChat";
import { useAuth } from "@/hooks/useAuth";
import { SlideUp } from "@/components/animations";
import { ChatSkeleton, EmptyState, buttonClasses } from "@/components/ui";

/**
 * The student's consultation conversation.
 *
 * Rewritten to read and write the same Postgres thread the pharmacist sees in
 * /inbox. It previously rendered a Firestore-backed room keyed by a random
 * localStorage string, so nothing a student typed here could ever reach a
 * pharmacist — two parallel systems that never met.
 *
 * Resolution order for "which consultation": an explicit ?consultationId in the
 * URL (how /consult hands off), then the id this browser saved when the
 * consultation was created, then the newest consultation on the signed-in
 * account. If none resolves there is nothing to talk about yet, and the page
 * says so rather than opening an orphan room.
 *
 * Not wrapped in ProtectedRoute: anonymous students have no account by design.
 * Access is enforced by the API on session or anonymousId.
 */
export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [consultationId, setConsultationId] = useState<string | null>(null);
  const [anonymousId, setAnonymousId] = useState<string | null>(null);
  const [resolving, setResolving] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const resolve = async () => {
      const storedAnon = localStorage.getItem("anonymousId");
      if (storedAnon) setAnonymousId(storedAnon);

      const fromQuery = searchParams.get("consultationId");
      if (fromQuery) {
        if (!cancelled) {
          setConsultationId(fromQuery);
          setResolving(false);
        }
        return;
      }

      const stored = localStorage.getItem("consultationId");
      if (stored) {
        if (!cancelled) {
          setConsultationId(stored);
          setResolving(false);
        }
        return;
      }

      // Signed-in students may have consultations created on another device,
      // with no local record. Fall back to the most recent one on the account.
      if (user) {
        try {
          const res = await fetch("/api/consultations?limit=1");
          if (res.ok) {
            const data = await res.json();
            const latest = data.consultations?.[0];
            if (latest && !cancelled) setConsultationId(latest.id);
          }
        } catch {
          // Leave unresolved — the empty state below is the correct outcome.
        }
      }

      if (!cancelled) setResolving(false);
    };

    resolve();
    return () => {
      cancelled = true;
    };
  }, [searchParams, user]);

  const isPharmacist = user?.role === "PHARMACY";

  return (
    <div className="min-h-screen bg-surface dark:bg-surface-dark">
      <Navigation
        title="Consultation"
        userRole={(user?.role?.toLowerCase() as "client" | "pharmacy" | "admin") || "client"}
      />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <SlideUp className="mb-6">
          <h1 className="text-headline-lg text-on-surface">
            {isPharmacist ? "Patient consultation" : "Chat with a pharmacist"}
          </h1>
          <p className="mt-2 text-on-surface-variant">
            {isPharmacist
              ? "Reply to this patient's inquiry. Messages are recorded against the consultation."
              : "Ask a licensed pharmacist about your medication or symptoms."}
          </p>
        </SlideUp>

        <SlideUp className="overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container-lowest shadow-soft dark:bg-surface-container">
          {resolving ? (
            <div className="p-4">
              <ChatSkeleton messages={4} />
            </div>
          ) : consultationId ? (
            <ConsultationChat
              consultationId={consultationId}
              anonymousId={anonymousId}
              viewerIsPharmacist={isPharmacist}
            />
          ) : (
            <EmptyState
              className="border-0"
              icon={MessageSquarePlus}
              title="No consultation yet"
              description="Start an anonymous consultation and a licensed pharmacist will reply here. You don't need an account."
              action={{ label: "Start a consultation", href: "/consult" }}
            />
          )}
        </SlideUp>

        {/* Privacy notes describe what the system actually does. The previous
            copy promised "end-to-end encrypted conversations", which the
            implementation does not provide and the design rules forbid. */}
        <SlideUp className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex gap-3 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-5 dark:bg-surface-container">
            <ShieldCheck className="h-5 w-5 shrink-0 text-medical-teal dark:text-primary" aria-hidden="true" />
            <div>
              <h2 className="text-sm font-semibold text-on-surface">Anonymous by design</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Your consultation is not linked to your name. No account is
                required to start one.
              </p>
            </div>
          </div>
          <div className="flex gap-3 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-5 dark:bg-surface-container">
            <UserCheck className="h-5 w-5 shrink-0 text-medical-teal dark:text-primary" aria-hidden="true" />
            <div>
              <h2 className="text-sm font-semibold text-on-surface">Licensed pharmacists</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Replies come from pharmacists whose licence has been verified by
                an administrator.
              </p>
            </div>
          </div>
        </SlideUp>

        {!consultationId && !resolving && (
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push("/consult")}
              className={buttonClasses({ variant: "secondary", size: "md" })}
            >
              Start a new consultation
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
