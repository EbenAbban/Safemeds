"use client";

import { useCallback, useEffect, useState } from "react";
import { Info, Pill, Search, Truck } from "lucide-react";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import ConsultationChat from "@/components/Chat/ConsultationChat";
import PharmacyShell from "@/components/pharmacy/PharmacyShell";
import { Badge, Button, cn } from "@/components/ui";

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
 */

interface ConsultationSummary {
  id: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  type: string;
  anonymousId: string | null;
  isAnonymous: boolean;
  createdAt: string;
  user: { firstName: string; lastName: string } | null;
  messages: { content: string; createdAt: string; isFromPharmacist: boolean }[];
  _count: { messages: number; prescriptions: number };
}

interface PrescriptionSummary {
  id: string;
  status: string;
  dosage: string;
  frequency: string;
  duration: string;
  medication: { name: string; strength: string };
}

const STATUS_LABEL: Record<ConsultationSummary["status"], { label: string; tone: "success" | "neutral" | "danger" }> = {
  PENDING: { label: "Waiting", tone: "neutral" },
  IN_PROGRESS: { label: "In Progress", tone: "success" },
  COMPLETED: { label: "Resolved", tone: "neutral" },
  CANCELLED: { label: "Cancelled", tone: "danger" },
};

function patientLabel(c: Pick<ConsultationSummary, "anonymousId" | "isAnonymous" | "user">): string {
  if (c.isAnonymous || !c.user) {
    const raw = c.anonymousId ?? "";
    const tail = raw.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase() || "0000";
    return `ANON-${tail}`;
  }
  return `${c.user.firstName} ${c.user.lastName.charAt(0)}.`;
}

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "Now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

const POLL_INTERVAL_MS = 4000;

function WorkspaceContent() {
  const [consultations, setConsultations] = useState<ConsultationSummary[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [prescriptions, setPrescriptions] = useState<PrescriptionSummary[]>([]);

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

  // Messages are owned by ConsultationChat now, including their own polling.
  // This only loads the prescription context panel, which that component
  // knows nothing about.
  const loadPrescriptions = useCallback(async (consultationId: string) => {
    const res = await fetch(`/api/prescriptions?consultationId=${consultationId}`);
    if (res.ok) {
      const data = await res.json();
      setPrescriptions(data.prescriptions ?? []);
    }
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    loadPrescriptions(selectedId);
    const interval = setInterval(() => loadPrescriptions(selectedId), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [selectedId, loadPrescriptions]);

  const filtered = consultations.filter((c) => {
    if (!search.trim()) return true;
    const label = patientLabel(c).toLowerCase();
    return label.includes(search.toLowerCase()) || c.messages[0]?.content.toLowerCase().includes(search.toLowerCase());
  });

  const selected = consultations.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="flex h-[calc(100vh-64px)] gap-6 p-4 sm:p-6">
      {/* Queue */}
      <aside className="hidden w-full max-w-xs flex-col overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-container-lowest shadow-soft lg:flex dark:bg-surface-container">
        <div className="border-b border-outline-variant/60 bg-surface-bright p-6 dark:bg-surface-dark">
          <h2 className="text-lg font-bold text-medical-teal dark:text-primary-fixed-dim">Active Consultations</h2>
          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" aria-hidden="true" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full rounded-lg border-none bg-surface-container-low py-2 pl-10 pr-4 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-soft-aqua"
            />
          </div>
        </div>

        <div className="flex-grow space-y-3 overflow-y-auto p-4">
          {loadingList && <p className="p-4 text-center text-sm text-on-surface-variant">Loading queue…</p>}
          {!loadingList && filtered.length === 0 && (
            <p className="p-4 text-center text-sm text-on-surface-variant">No consultations match.</p>
          )}
          {filtered.map((c) => {
            const status = STATUS_LABEL[c.status];
            const isActive = c.id === selectedId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedId(c.id)}
                className={cn(
                  "w-full rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card",
                  isActive
                    ? "border-transparent bg-surface-container-low"
                    : "border-outline-variant/60 bg-surface-container-lowest dark:bg-surface-container"
                )}
              >
                <div className="mb-2 flex items-start justify-between">
                  <span className="text-sm font-bold text-medical-teal dark:text-primary-fixed-dim">{patientLabel(c)}</span>
                  <span className="text-xs text-outline">{c.messages[0] ? timeAgo(c.messages[0].createdAt) : timeAgo(c.createdAt)}</span>
                </div>
                <p className="mb-3 truncate text-sm text-on-surface-variant">
                  {c.messages[0]?.content ?? "No messages yet"}
                </p>
                <Badge tone={status.tone}>{status.label}</Badge>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Thread */}
      <section className="flex flex-1 flex-col overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-container-lowest shadow-soft dark:bg-surface-container">
        {!selected ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-on-surface-variant">
            <p className="font-semibold text-on-surface">Select a consultation</p>
            <p className="text-sm">Choose a conversation from the queue to view its messages.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-outline-variant/60 bg-surface-bright p-6 dark:bg-surface-dark">
              <div>
                <h2 className="font-bold text-on-surface">{patientLabel(selected)}</h2>
                <p className="text-sm text-outline">Consultation · {STATUS_LABEL[selected.status].label}</p>
              </div>
            </div>

            <div className="flex justify-center border-b border-outline-variant/60 bg-surface-bright/50 py-3 dark:bg-surface-dark/40">
              <span className="rounded-full bg-surface-container px-3 py-1 text-xs text-outline">
                Consultation started {new Date(selected.createdAt).toLocaleString()}
              </span>
            </div>

            {/* The same component the student sees, so both sides of a
                consultation are literally one implementation. `key` forces a
                remount when the pharmacist switches conversation — without it
                the previous thread's messages would linger while the new one
                loads. Header is off because the patient header above already
                names the consultation and its status. */}
            <ConsultationChat
              key={selected.id}
              consultationId={selected.id}
              viewerIsPharmacist
              showHeader={false}
              onMessageSent={loadConsultations}
              className="min-h-0 flex-grow"
            />
          </>
        )}
      </section>

      {/* Context panel */}
      {selected && (
        <aside className="hidden w-full max-w-xs flex-col gap-6 overflow-y-auto xl:flex">
          <div className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-5 shadow-soft dark:bg-surface-container">
            <h3 className="mb-4 font-bold text-on-surface">Consultation Details</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-outline">Patient ID</dt>
                <dd className="font-semibold text-on-surface">{patientLabel(selected)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-outline">Started</dt>
                <dd className="font-semibold text-on-surface">{new Date(selected.createdAt).toLocaleDateString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-outline">Status</dt>
                <dd>
                  <Badge tone={STATUS_LABEL[selected.status].tone}>{STATUS_LABEL[selected.status].label}</Badge>
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-5 shadow-soft dark:bg-surface-container">
            <h3 className="mb-4 font-bold text-on-surface">Clinical Actions</h3>
            <div className="flex flex-col gap-3">
              <Button variant="secondary" fullWidth onClick={() => window.open("/medications", "_blank")}>
                <Pill className="h-4 w-4" aria-hidden="true" />
                View Medications
              </Button>
              <Button variant="ghost" fullWidth onClick={() => window.open("/orders", "_blank")}>
                <Truck className="h-4 w-4" aria-hidden="true" />
                View Orders &amp; Delivery
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-container-lowest shadow-soft dark:bg-surface-container">
            <div className="flex items-center gap-2 border-b border-outline-variant/60 bg-medical-teal/5 p-4">
              <Pill className="h-4 w-4 text-medical-teal dark:text-primary-fixed-dim" aria-hidden="true" />
              <h3 className="font-bold text-on-surface">Prescriptions</h3>
            </div>
            <div className="space-y-4 p-5">
              {prescriptions.length === 0 && (
                <p className="flex items-start gap-2 text-sm text-on-surface-variant">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  No prescription issued for this consultation yet.
                </p>
              )}
              {prescriptions.map((p) => (
                <div key={p.id}>
                  <h4 className="text-base font-semibold text-on-surface">{p.medication.name}</h4>
                  <p className="text-sm text-outline">{p.medication.strength}</p>
                  <div className="mt-2 rounded-lg border border-outline-variant/60 bg-surface-container-low p-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Dosage</p>
                    <p className="text-sm text-on-surface">
                      {p.dosage}, {p.frequency}, for {p.duration}.
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm text-outline">Status</span>
                    <Badge tone={p.status === "DISPENSED" ? "success" : "neutral"}>{p.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}

export default function InboxPage() {
  return (
    <ProtectedRoute allowedRoles={["PHARMACY", "ADMIN"]}>
      <PharmacyShell active="consultations" pageTitle="Consultations">
        <WorkspaceContent />
      </PharmacyShell>
    </ProtectedRoute>
  );
}
