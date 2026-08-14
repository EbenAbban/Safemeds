"use client";

import { useCallback, useEffect, useState } from "react";
import { ClipboardList, MapPin, PackageCheck } from "lucide-react";
import { EmptyState, Select, buttonClasses } from "@/components/ui";
import { formatCurrency } from "@/lib/currency";
import { DROP_POINTS } from "@/lib/dropPoints";

/**
 * A student's prescriptions, and the point at which one becomes a delivery.
 *
 * Acceptance belongs to the student, not the pharmacy: they are choosing to
 * receive medication, and they are the one who has to be standing at the
 * collection point. So the drop point is chosen here.
 *
 * Once accepted they are shown a package code. That code is the whole
 * connection between them and the courier — the courier is told where to go
 * and which package to carry, never who the student is. Matching happens at
 * the drop point by comparing codes, which is what keeps an anonymous-first
 * product anonymous at the last step.
 */
interface Row {
  id: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions: string | null;
  status: string;
  medication: { name: string; strength: string; price: number | string } | null;
}

export default function MyPrescriptions() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [dropPoint, setDropPoint] = useState(DROP_POINTS[0]?.name ?? "");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [issued, setIssued] = useState<{ code: string; where: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/prescriptions");
      if (res.ok) {
        const data = await res.json();
        setRows(data.prescriptions ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (id: string, action: "accept" | "decline") => {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/prescriptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, dropPoint }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not update this prescription.");
      if (action === "accept") {
        setIssued({ code: data.trackingNumber, where: data.dropPoint });
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update this prescription.");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return null;

  const pending = rows.filter((r) => r.status === "PENDING");

  if (issued) {
    return (
      <div className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-5 dark:bg-surface-container">
        <div className="flex items-start gap-3">
          <PackageCheck className="h-6 w-6 shrink-0 text-secondary" aria-hidden="true" />
          <div>
            <h3 className="font-semibold text-on-surface">Delivery arranged</h3>
            <p className="mt-1 text-sm text-on-surface-variant">
              Collect from <strong>{issued.where}</strong>. Show this package code
              to the courier — it is the only thing they have to match against,
              and they are not told who you are.
            </p>
            <p className="mt-3 rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 text-center font-mono text-xl tracking-widest text-on-surface">
              {issued.code}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (pending.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No prescriptions waiting"
        description="When a pharmacist prescribes something during a consultation, it appears here for you to accept."
        action={{ label: "Start a consultation", href: "/consult" }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {pending.map((p) => (
        <div key={p.id} className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-5 dark:bg-surface-container">
          <h3 className="font-semibold text-on-surface">
            {p.medication?.name} {p.medication?.strength}
          </h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            {p.dosage}, {p.frequency}, for {p.duration} · {p.quantity} to collect
          </p>
          {p.instructions && (
            <p className="mt-2 rounded-lg bg-surface-container-low p-3 text-sm text-on-surface-variant">
              {p.instructions}
            </p>
          )}
          <p className="mt-2 text-sm font-semibold text-on-surface">
            {formatCurrency(Number(p.medication?.price ?? 0) * p.quantity)} on collection
          </p>

          <div className="mt-4">
            <Select
              label="Collect from"
              value={dropPoint}
              onChange={(e) => setDropPoint(e.target.value)}
            >
              {DROP_POINTS.map((d) => (
                <option key={d.name} value={d.name}>
                  {d.name}
                </option>
              ))}
            </Select>
          </div>

          {error && <p role="alert" className="mt-3 text-sm text-error">{error}</p>}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => act(p.id, "accept")}
              disabled={busyId === p.id}
              className={buttonClasses({ variant: "primary", size: "md", fullWidth: true })}
            >
              <MapPin className="h-4 w-4" aria-hidden="true" />
              {busyId === p.id ? "Arranging…" : "Accept and arrange delivery"}
            </button>
            <button
              onClick={() => act(p.id, "decline")}
              disabled={busyId === p.id}
              className={buttonClasses({ variant: "ghost", size: "md" })}
            >
              Decline
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
