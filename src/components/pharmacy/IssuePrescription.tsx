"use client";

import { useEffect, useState } from "react";
import { ClipboardPlus } from "lucide-react";
import { Select, buttonClasses } from "@/components/ui";
import { formatCurrency } from "@/lib/currency";

/**
 * Issue a prescription from inside the consultation it answers.
 *
 * Deliberately here rather than on a separate page: the pharmacist has the
 * symptoms, allergies and current medications on screen in the thread beside
 * this, which is exactly the information the decision depends on. A standalone
 * form would mean prescribing from memory or from a second tab.
 *
 * This only creates the prescription. It does not raise a delivery — the
 * student accepts first and chooses where to collect, because they are the one
 * who has to be standing there.
 */
interface MedicationOption {
  id: string;
  name: string;
  strength: string;
  dosageForm: string;
  price: number | string;
}

export default function IssuePrescription({
  consultationId,
  patientUserId,
  pharmacistName,
  onIssued,
}: {
  consultationId: string;
  /** Null for an anonymous consultation — see the notice rendered below. */
  patientUserId: string | null;
  pharmacistName: string;
  onIssued: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [meds, setMeds] = useState<MedicationOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    medicationId: "",
    dosage: "",
    frequency: "",
    duration: "",
    quantity: "1",
    refills: "0",
    instructions: "",
  });

  useEffect(() => {
    if (!open || meds.length) return;
    fetch("/api/medications?limit=100")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setMeds(d?.medications ?? []))
      .catch(() => setError("Could not load the medication list."));
  }, [open, meds.length]);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    if (!form.medicationId || !form.dosage || !form.frequency || !form.duration) {
      setError("Medication, dosage, frequency and duration are all required.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consultationId,
          userId: patientUserId,
          medicationId: form.medicationId,
          prescribedBy: pharmacistName,
          dosage: form.dosage,
          frequency: form.frequency,
          duration: form.duration,
          quantity: Number(form.quantity) || 1,
          refills: Number(form.refills) || 0,
          instructions: form.instructions || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not issue this prescription.");
      }
      setOpen(false);
      setForm({ medicationId: "", dosage: "", frequency: "", duration: "", quantity: "1", refills: "0", instructions: "" });
      onIssued();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not issue this prescription.");
    } finally {
      setSaving(false);
    }
  };

  if (!patientUserId) {
    return (
      <p className="rounded-lg border border-outline-variant/60 bg-surface-container-low p-3 text-xs text-on-surface-variant">
        This consultation is anonymous, so there is no account to attach a
        prescription to. Advise the student in the conversation to create an
        account if they need medication dispensed.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={buttonClasses({ variant: "primary", size: "sm", fullWidth: true })}
      >
        <ClipboardPlus className="h-4 w-4" aria-hidden="true" />
        Issue prescription
      </button>
    );
  }

  const chosen = meds.find((m) => m.id === form.medicationId);
  const field =
    "min-h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface dark:bg-surface-container-high";

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border border-outline-variant/60 p-3">
      <Select
        label="Medication"
        value={form.medicationId}
        onChange={(e) => set("medicationId", e.target.value)}
        placeholder={meds.length ? "Select a medication" : "Loading…"}
      >
        {meds.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name} {m.strength} ({m.dosageForm})
          </option>
        ))}
      </Select>

      <div className="grid grid-cols-2 gap-2">
        <input className={field} placeholder="Dosage, e.g. 500mg" value={form.dosage} onChange={(e) => set("dosage", e.target.value)} aria-label="Dosage" />
        <input className={field} placeholder="Frequency, e.g. twice daily" value={form.frequency} onChange={(e) => set("frequency", e.target.value)} aria-label="Frequency" />
        <input className={field} placeholder="Duration, e.g. 5 days" value={form.duration} onChange={(e) => set("duration", e.target.value)} aria-label="Duration" />
        <input className={field} type="number" min="1" placeholder="Quantity" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} aria-label="Quantity" />
      </div>

      <textarea
        className={`${field} min-h-[4.5rem]`}
        placeholder="Instructions for the student (optional) — e.g. take with food"
        value={form.instructions}
        onChange={(e) => set("instructions", e.target.value)}
        aria-label="Instructions"
      />

      {chosen && (
        <p className="text-xs text-on-surface-variant">
          {formatCurrency(chosen.price)} each · {form.quantity || 1} ={" "}
          <strong>{formatCurrency(Number(chosen.price) * (Number(form.quantity) || 1))}</strong>
        </p>
      )}

      {error && <p role="alert" className="text-xs text-error">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={saving} className={buttonClasses({ variant: "primary", size: "sm", fullWidth: true })}>
          {saving ? "Issuing…" : "Issue prescription"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className={buttonClasses({ variant: "ghost", size: "sm" })}>
          Cancel
        </button>
      </div>
    </form>
  );
}
