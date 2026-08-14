"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import PharmacyShell from "@/components/pharmacy/PharmacyShell";
import { Badge, EmptyState, TableSkeleton } from "@/components/ui";
import { formatCurrency } from "@/lib/currency";

/**
 * The pharmacist's prescription list.
 *
 * The nav item called "Prescriptions" used to open Medication Management,
 * which is a different thing entirely — a catalogue of what the pharmacy
 * stocks, not a record of what has been prescribed to whom. This is the page
 * the label was always promising.
 */
interface PrescriptionRow {
  id: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  status: string;
  createdAt: string;
  consultationId: string | null;
  medication: { name: string; strength: string; price: number | string } | null;
}

const STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger"> = {
  PENDING: "warning",
  APPROVED: "success",
  DISPENSED: "success",
  REJECTED: "danger",
  EXPIRED: "neutral",
};

const STATUS_HELP: Record<string, string> = {
  PENDING: "Waiting for the student to accept and choose a drop point",
  APPROVED: "Accepted — a delivery has been raised",
  DISPENSED: "Handed over",
  REJECTED: "Declined by the student",
  EXPIRED: "No longer valid",
};

export default function PrescriptionsPage() {
  const [rows, setRows] = useState<PrescriptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = status ? `?status=${status}` : "";
      const res = await fetch(`/api/prescriptions${qs}`);
      if (res.ok) {
        const data = await res.json();
        setRows(data.prescriptions ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ProtectedRoute allowedRoles={["PHARMACY", "ADMIN"]}>
      <PharmacyShell active="prescriptions" pageTitle="Prescriptions">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-on-surface-variant">
            Prescriptions you have issued. Issue a new one from inside a consultation.
          </p>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="min-h-11 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-sm text-on-surface dark:bg-surface-container-high"
          >
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="DISPENSED">Dispensed</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {loading ? (
          <TableSkeleton rows={6} columns={5} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No prescriptions yet"
            description="Prescriptions are issued from within a consultation, where the patient's symptoms are already on screen."
            action={{ label: "Go to consultations", href: "/inbox" }}
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-outline-variant/60">
            <table className="hidden min-w-full divide-y divide-outline-variant/60 md:table">
              <thead className="bg-surface-container-low">
                <tr>
                  {["Medication", "Directions", "Qty", "Status", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40 bg-surface-container-lowest dark:bg-surface-container">
                {rows.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-surface-container-high/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-on-surface">{p.medication?.name ?? "—"}</p>
                      <p className="text-xs text-on-surface-variant">
                        {p.medication?.strength} · {formatCurrency(p.medication?.price)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-on-surface-variant">
                      {p.dosage}, {p.frequency}, for {p.duration}
                    </td>
                    <td className="px-4 py-3 text-sm text-on-surface">{p.quantity}</td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[p.status] ?? "neutral"}>{p.status.toLowerCase()}</Badge>
                      <p className="mt-1 text-xs text-on-surface-variant">{STATUS_HELP[p.status]}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {p.consultationId && (
                        <Link href={`/chat/${p.consultationId}`} className="text-sm font-semibold text-medical-teal hover:underline dark:text-primary-fixed-dim">
                          Open consultation
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Desktop tables do not fit a phone; each row becomes a card. */}
            <div className="divide-y divide-outline-variant/40 md:hidden">
              {rows.map((p) => (
                <div key={p.id} className="bg-surface-container-lowest p-4 dark:bg-surface-container">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-on-surface">{p.medication?.name ?? "—"}</p>
                    <Badge tone={STATUS_TONE[p.status] ?? "neutral"}>{p.status.toLowerCase()}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {p.dosage}, {p.frequency}, for {p.duration} · qty {p.quantity}
                  </p>
                  {p.consultationId && (
                    <Link href={`/chat/${p.consultationId}`} className="mt-2 inline-block text-sm font-semibold text-medical-teal dark:text-primary-fixed-dim">
                      Open consultation
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </PharmacyShell>
    </ProtectedRoute>
  );
}
