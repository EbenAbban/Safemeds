"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Boxes, CheckCircle2, Sparkles } from "lucide-react";
import { Badge, Card, Input, Select, buttonClasses } from "@/components/ui";

/**
 * Add stock of a medication to this pharmacy's inventory.
 *
 * Posts to the real `POST /api/inventory`, which is upsert-shaped: stocking a
 * medication already held adds to the existing quantity rather than creating
 * a duplicate row (the table has a unique constraint on
 * medication + pharmacy). The copy says so, because "Add stock" silently
 * meaning "add to what's there" versus "replace what's there" is exactly the
 * kind of ambiguity that loses a pharmacy a count.
 *
 * Reached from the catalog as /inventory/add?medicationId=… . Landing here
 * without that parameter is legitimate too, so the page falls back to a
 * picker rather than an error.
 */

interface Medication {
  id: string;
  name: string;
  genericName: string | null;
  dosageForm: string;
  strength: string;
  manufacturer: string;
  price: string | number;
  isPrescription: boolean;
  isControlled: boolean;
}

interface FormState {
  quantity: string;
  minQuantity: string;
  maxQuantity: string;
  lotNumber: string;
  expirationDate: string;
  location: string;
}

const EMPTY: FormState = {
  quantity: "",
  minQuantity: "10",
  maxQuantity: "1000",
  lotNumber: "",
  expirationDate: "",
  location: "",
};

function isoDateInMonths(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

const SAMPLE: FormState = {
  quantity: "250",
  minQuantity: "40",
  maxQuantity: "1200",
  lotNumber: "LOT-24B7391",
  expirationDate: isoDateInMonths(18),
  location: "Shelf B3",
};

export default function AddInventoryForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const medicationIdParam = searchParams.get("medicationId");

  const [medication, setMedication] = useState<Medication | null>(null);
  const [catalog, setCatalog] = useState<Medication[]>([]);
  const [pickedId, setPickedId] = useState<string>("");
  const [loading, setLoading] = useState(Boolean(medicationIdParam));
  const [loadError, setLoadError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<{ name: string; quantity: number } | null>(null);

  // Arrived with an id: fetch just that medication.
  useEffect(() => {
    if (!medicationIdParam) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/medications/${medicationIdParam}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setLoadError(data.error || "Could not load that medication.");
          return;
        }
        setMedication(data.medication);
      } catch {
        if (!cancelled) setLoadError("Could not load that medication.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [medicationIdParam]);

  // Arrived without one: offer the catalog to pick from.
  useEffect(() => {
    if (medicationIdParam) return;
    (async () => {
      try {
        const res = await fetch("/api/medications?limit=100");
        if (!res.ok) return;
        const data = await res.json();
        setCatalog(data.medications ?? []);
      } catch {
        /* picker just stays empty; the field explains itself */
      }
    })();
  }, [medicationIdParam]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key as string]) setErrors((e) => ({ ...e, [key as string]: "" }));
  };

  const targetId = medicationIdParam ?? pickedId;
  const target =
    medication ?? catalog.find((m) => m.id === pickedId) ?? null;

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!targetId) next.medication = "Choose a medication to stock.";

    const qty = Number(form.quantity);
    if (!form.quantity.trim()) {
      next.quantity = "Quantity is required.";
    } else if (!Number.isInteger(qty) || qty <= 0) {
      next.quantity = "Enter a whole number greater than zero.";
    }

    const min = Number(form.minQuantity);
    const max = Number(form.maxQuantity);
    if (form.minQuantity && (!Number.isInteger(min) || min < 0)) {
      next.minQuantity = "Enter a whole number of zero or more.";
    }
    if (form.maxQuantity && (!Number.isInteger(max) || max <= 0)) {
      next.maxQuantity = "Enter a whole number greater than zero.";
    }
    if (!next.minQuantity && !next.maxQuantity && form.minQuantity && form.maxQuantity && min > max) {
      next.minQuantity = "Reorder level cannot exceed the maximum.";
    }

    if (form.expirationDate && new Date(form.expirationDate) <= new Date()) {
      next.expirationDate = "Expiry must be in the future.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setErrors((prev) => ({ ...prev, general: "" }));

    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicationId: targetId,
          quantity: form.quantity,
          minQuantity: form.minQuantity || "10",
          maxQuantity: form.maxQuantity || "1000",
          lotNumber: form.lotNumber.trim() || null,
          expirationDate: form.expirationDate || null,
          location: form.location.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrors({ general: data.error || "Could not update inventory." });
        return;
      }
      setSaved({
        name: data.inventoryItem.medication.name,
        quantity: data.inventoryItem.quantity,
      });
    } catch {
      setErrors({ general: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const backToInventory = () => router.push("/inventory");

  if (saved) {
    return (
      <div className="mx-auto w-full max-w-2xl p-4 sm:p-6">
        <Card radius="xl" className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary-container/40 text-secondary">
            <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
          </div>
          <h1 className="text-headline-md text-on-surface">Stock updated</h1>
          <p className="mt-2 text-on-surface-variant">
            <span className="font-semibold text-on-surface">{saved.name}</span> now shows{" "}
            <span className="font-semibold text-on-surface">{saved.quantity}</span> units on hand.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/inventory" className={buttonClasses({})}>
              View inventory
            </Link>
            <Link href="/medications" className={buttonClasses({ variant: "secondary" })}>
              Back to catalog
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl p-4 sm:p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <button
            type="button"
            onClick={backToInventory}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-outline-variant/60 px-3 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:text-on-surface"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Inventory
          </button>
          <div className="min-w-0">
            <h1 className="text-headline-md text-on-surface">Add Stock</h1>
            <p className="mt-1 text-sm text-on-surface-variant">
              Adds to this pharmacy&apos;s holding of a catalog medication.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setForm(SAMPLE);
            setErrors({});
          }}
          className="flex items-center gap-1.5 rounded-lg border border-outline-variant/60 px-3 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:text-on-surface"
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Prefill sample
        </button>
      </div>

      {loading && (
        <Card>
          <p className="text-sm text-on-surface-variant">Loading medication…</p>
        </Card>
      )}

      {loadError && (
        <Card>
          <h2 className="font-bold text-on-surface">Medication not found</h2>
          <p className="mt-1 text-sm text-on-surface-variant">{loadError}</p>
          <Link href="/medications" className={buttonClasses({ className: "mt-4" })}>
            Browse the catalog
          </Link>
        </Card>
      )}

      {!loading && !loadError && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* What is being stocked */}
          <Card>
            <div className="mb-5 flex items-center gap-2">
              <Boxes className="h-4 w-4 text-medical-teal dark:text-primary-fixed-dim" aria-hidden="true" />
              <h2 className="font-bold text-on-surface">Medication</h2>
            </div>

            {medicationIdParam ? (
              target && (
                <div className="rounded-lg border border-outline-variant/60 bg-surface-container-low p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-on-surface">{target.name}</p>
                      <p className="text-sm text-on-surface-variant">
                        {target.strength} · {target.dosageForm} · {target.manufacturer}
                      </p>
                      {target.genericName && (
                        <p className="mt-0.5 text-sm text-outline">{target.genericName}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {target.isPrescription && <Badge tone="neutral">Prescription only</Badge>}
                      {target.isControlled && <Badge tone="danger">Controlled</Badge>}
                    </div>
                  </div>
                </div>
              )
            ) : (
              <Select
                label="Medication"
                value={pickedId}
                onChange={(e) => {
                  setPickedId(e.target.value);
                  setErrors((x) => ({ ...x, medication: "" }));
                }}
                placeholder={catalog.length ? "Select a medication…" : "No medications in the catalog yet"}
                error={errors.medication}
                hint="Only medications already in the catalog can be stocked."
              >
                {catalog.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} · {m.strength} · {m.dosageForm}
                  </option>
                ))}
              </Select>
            )}
          </Card>

          {/* Quantities */}
          <Card>
            <h2 className="mb-1 font-bold text-on-surface">Quantity</h2>
            <p className="mb-5 text-sm text-on-surface-variant">
              This is <span className="font-semibold text-on-surface">added to</span> any stock
              already held, not a replacement count.
            </p>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <Input
                label="Units to add"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={form.quantity}
                onChange={(e) => set("quantity", e.target.value)}
                placeholder="250"
                error={errors.quantity}
              />
              <Input
                label="Reorder level"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={form.minQuantity}
                onChange={(e) => set("minQuantity", e.target.value)}
                placeholder="10"
                hint="Flags as low stock below this."
                error={errors.minQuantity}
              />
              <Input
                label="Maximum"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={form.maxQuantity}
                onChange={(e) => set("maxQuantity", e.target.value)}
                placeholder="1000"
                hint="Shelf capacity."
                error={errors.maxQuantity}
              />
            </div>
          </Card>

          {/* Traceability */}
          <Card>
            <h2 className="mb-1 font-bold text-on-surface">Batch details</h2>
            <p className="mb-5 text-sm text-on-surface-variant">
              Optional, but a lot number and expiry are what make a recall actionable.
            </p>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <Input
                label="Lot number"
                value={form.lotNumber}
                onChange={(e) => set("lotNumber", e.target.value)}
                placeholder="LOT-24B7391"
              />
              <Input
                label="Expiry date"
                type="date"
                value={form.expirationDate}
                onChange={(e) => set("expirationDate", e.target.value)}
                error={errors.expirationDate}
              />
              <Input
                label="Shelf location"
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="Shelf B3"
              />
            </div>
          </Card>

          {errors.general && (
            <div className="rounded-lg border border-error/30 bg-error-container px-4 py-3 text-sm text-on-error-container">
              {errors.general}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={backToInventory} className={buttonClasses({ variant: "ghost" })}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className={buttonClasses({ size: "lg" })}>
              {saving ? "Saving…" : "Add to inventory"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
