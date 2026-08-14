"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Info, Pill, Truck } from "lucide-react";
import ConsultationChat from "@/components/Chat/ConsultationChat";
import IssuePrescription from "@/components/pharmacy/IssuePrescription";
import { useAuth } from "@/hooks/useAuth";
import { Badge, Button, cn } from "@/components/ui";
import {
  ConsultationSummary,
  POLL_INTERVAL_MS,
  PrescriptionSummary,
  STATUS_LABEL,
  patientLabel,
} from "./consultationShared";

/**
 * One consultation, on its own screen.
 *
 * The queue, the thread, and this clinical context panel used to share a
 * single row, which squeezed the actual conversation into a narrow middle
 * strip on any normal laptop. The queue now gives way entirely once a
 * consultation is opened, leaving these two panels the full width.
 */
export default function ConsultationThread({
  selected,
  onBack,
  onMessageSent,
}: {
  selected: ConsultationSummary;
  onBack: () => void;
  onMessageSent: () => void;
}) {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<PrescriptionSummary[]>([]);
  // Below lg there is only room for one panel at a time, so the two swap
  // rather than stack — a stacked context panel would push the message
  // composer off the bottom of a phone screen.
  const [mobilePane, setMobilePane] = useState<"chat" | "details">("chat");

  // Messages are owned by ConsultationChat, including their own polling.
  // This only loads the prescription context, which that component knows
  // nothing about.
  const loadPrescriptions = useCallback(async (consultationId: string) => {
    const res = await fetch(`/api/prescriptions?consultationId=${consultationId}`);
    if (res.ok) {
      const data = await res.json();
      setPrescriptions(data.prescriptions ?? []);
    }
  }, []);

  useEffect(() => {
    loadPrescriptions(selected.id);
    const interval = setInterval(() => loadPrescriptions(selected.id), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [selected.id, loadPrescriptions]);

  const status = STATUS_LABEL[selected.status];

  return (
    // dvh, not vh: on a phone, 100vh is measured against the viewport with the
    // browser chrome retracted, so a vh-based full-height panel runs taller
    // than the screen and pushes the message composer out of reach. dvh
    // tracks the chrome as it shows and hides. 4rem is the shell's fixed top
    // bar (h-16), which this sits underneath.
    <div className="flex h-[calc(100dvh-4rem)] flex-col gap-3 p-3 sm:gap-4 sm:p-6">
      {/* Screen header: back out to the queue, plus who this is */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-outline-variant/60 px-3 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:text-on-surface"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Queue
          </button>
          <div className="min-w-0">
            <h2 className="truncate font-bold text-on-surface">{patientLabel(selected)}</h2>
            <p className="truncate text-sm text-outline">Consultation · {status.label}</p>
          </div>
        </div>

        {/* Panel switcher, small screens only */}
        <div className="flex rounded-lg bg-surface-container-low p-1 lg:hidden">
          {(["chat", "details"] as const).map((pane) => (
            <button
              key={pane}
              type="button"
              onClick={() => setMobilePane(pane)}
              aria-pressed={mobilePane === pane}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-semibold capitalize transition-colors",
                mobilePane === pane
                  ? "bg-surface-container-lowest text-on-surface shadow-sm dark:bg-surface-container"
                  : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              {pane}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-6">
        {/* Thread */}
        <section
          className={cn(
            "min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-container-lowest shadow-soft dark:bg-surface-container",
            mobilePane === "chat" ? "flex" : "hidden lg:flex"
          )}
        >
          <div className="flex justify-center border-b border-outline-variant/60 bg-surface-bright/50 py-3 dark:bg-surface-dark/40">
            <span className="rounded-full bg-surface-container px-3 py-1 text-xs text-outline">
              Consultation started {new Date(selected.createdAt).toLocaleString()}
            </span>
          </div>

          {/* The same component the student sees, so both sides of a
              consultation are literally one implementation. `key` forces a
              remount when the pharmacist switches conversation — without it
              the previous thread's messages would linger while the new one
              loads. Header is off because the screen header above already
              names the consultation and its status. */}
          <ConsultationChat
            key={selected.id}
            consultationId={selected.id}
            viewerIsPharmacist
            showHeader={false}
            onMessageSent={onMessageSent}
            className="min-h-0 flex-grow"
          />
        </section>

        {/* Clinical context */}
        <aside
          className={cn(
            "w-full shrink-0 flex-col gap-6 overflow-y-auto lg:flex lg:w-80 xl:w-96",
            mobilePane === "details" ? "flex" : "hidden"
          )}
        >
          <div className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-5 shadow-soft dark:bg-surface-container">
            <h3 className="mb-4 font-bold text-on-surface">Consultation Details</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-outline">Patient ID</dt>
                <dd className="font-semibold text-on-surface">{patientLabel(selected)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-outline">Started</dt>
                <dd className="font-semibold text-on-surface">
                  {new Date(selected.createdAt).toLocaleDateString()}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-outline">Status</dt>
                <dd>
                  <Badge tone={status.tone}>{status.label}</Badge>
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
              <IssuePrescription
                consultationId={selected.id}
                patientUserId={selected.user?.id ?? null}
                pharmacistName={user?.name ?? user?.username ?? "Pharmacist"}
                onIssued={() => {
                  loadPrescriptions(selected.id);
                  onMessageSent();
                }}
              />
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
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                      Dosage
                    </p>
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
      </div>
    </div>
  );
}
