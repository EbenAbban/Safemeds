"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import PharmacyShell from "@/components/pharmacy/PharmacyShell";
import ConsultationQueue from "@/components/pharmacy/ConsultationQueue";
import ConsultationThread from "@/components/pharmacy/ConsultationThread";
import { ConsultationSummary } from "@/components/pharmacy/consultationShared";

/**
 * Pharmacist consultation workspace — SafeMeds Vital design system.
 *
 * Built on the Prisma/Postgres consultation + message system (the one push
 * notifications already depend on), not the pre-existing Firestore-based
 * /inbox + /chat/[id] flow. That was a deliberate, explicit choice: the
 * design's context panel needs real consultation status and prescription
 * linkage that Firestore rooms don't carry, and this endpoint already
 * received a fix for a severe auth bypass (see the route file) that made it
 * safe to build on. Trade-off, stated plainly: this is a fresh queue,
 * disconnected from whatever conversations exist in the old Firestore rooms
 * today. It does not port them over.
 *
 * "Start Video Consult" from the original design is intentionally omitted —
 * wiring real video into this Postgres-backed thread is a separate, real
 * integration effort, not something to fake with a button that goes nowhere
 * or silently reconnects to the other chat system.
 *
 * Two screens, not three columns. Queue, thread, and clinical context used to
 * share one row, leaving the conversation itself a narrow strip on a normal
 * laptop. Opening a consultation now replaces the queue outright, so the
 * thread and its context get the full width. The open consultation lives in
 * the URL (`?c=<id>`) rather than in local state, so browser Back returns to
 * the queue and a specific conversation survives a refresh or a shared link.
 */

function WorkspaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("c");

  const [consultations, setConsultations] = useState<ConsultationSummary[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [search, setSearch] = useState("");

  const loadConsultations = useCallback(async () => {
    try {
      const res = await fetch("/api/consultations?limit=50");
      if (res.ok) {
        const data = await res.json();
        setConsultations(data.consultations ?? []);
      }
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadConsultations();
  }, [loadConsultations]);

  const selected = consultations.find((c) => c.id === selectedId) ?? null;

  const openConsultation = (id: string) => router.push(`/inbox?c=${id}`, { scroll: false });
  const backToQueue = () => router.push("/inbox", { scroll: false });

  // Deep link or refresh: the id is in the URL before the queue has loaded.
  if (selectedId && !selected) {
    return (
      <div className="flex h-[calc(100dvh-4rem)] flex-col items-center justify-center gap-3 p-8 text-center">
        {loadingList ? (
          <p className="text-sm text-on-surface-variant">Loading consultation…</p>
        ) : (
          <>
            <p className="font-semibold text-on-surface">Consultation not found</p>
            <p className="text-sm text-on-surface-variant">
              It may have been closed, or it belongs to another pharmacist.
            </p>
            <button
              type="button"
              onClick={backToQueue}
              className="mt-2 flex items-center gap-1.5 rounded-lg border border-outline-variant/60 px-3 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:text-on-surface"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to queue
            </button>
          </>
        )}
      </div>
    );
  }

  if (selected) {
    return (
      <ConsultationThread
        selected={selected}
        onBack={backToQueue}
        onMessageSent={loadConsultations}
      />
    );
  }

  return (
    <ConsultationQueue
      consultations={consultations}
      loading={loadingList}
      search={search}
      onSearchChange={setSearch}
      onOpen={openConsultation}
    />
  );
}

export default function InboxPage() {
  return (
    <ProtectedRoute allowedRoles={["PHARMACY", "ADMIN"]}>
      <PharmacyShell active="consultations" pageTitle="Consultations">
        {/* useSearchParams needs a Suspense boundary above it. */}
        <Suspense fallback={<div className="p-8 text-sm text-on-surface-variant">Loading…</div>}>
          <WorkspaceContent />
        </Suspense>
      </PharmacyShell>
    </ProtectedRoute>
  );
}
