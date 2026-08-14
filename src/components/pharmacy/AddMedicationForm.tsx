"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, PillBottle, Sparkles } from "lucide-react";
import { Card, Input, Select, buttonClasses } from "@/components/ui";

/**
 * Add a medication to the catalog.
 *
 * Posts to the real `POST /api/medications` route, which writes an actual
 * Medication row — this is not a mock screen. The field set and the required
 * fields below mirror that handler exactly (name, dosageForm, strength,
 * manufacturer, price are what it rejects a request for), so the form can
 * never construct a body the API refuses for a reason the user can't see.
 *
 * "Prefill sample" fills the form with a plausible, clearly-labelled example
 * so the page can be demonstrated without inventing data behind the user's
 * back: nothing is written until they review it and press Save, and the
 * button says what it does.
 */

const DOSAGE_FORMS = [
  "Tablet",
  "Capsule",
  "Syrup",
  "Suspension",
  "Injection",
  "Cream",
  "Ointment",
  "Drops",
  "Inhaler",
  "Suppository",
];

interface FormState {
  name: string;
  genericName: string;
  manufacturer: string;
  dosageForm: string;
  strength: string;
  price: string;
  description: string;
  sideEffects: string;
  interactions: string;
  contraindications: string;
  isPrescription: boolean;
  isControlled: boolean;
  requiresLicense: boolean;
}

const EMPTY: FormState = {
  name: "",
  genericName: "",
  manufacturer: "",
  dosageForm: "",
  strength: "",
  price: "",
  description: "",
  sideEffects: "",
  interactions: "",
  contraindications: "",
  isPrescription: true,
  isControlled: false,
  requiresLicense: false,
};

const SAMPLE: FormState = {
  name: "Amoxicillin",
  genericName: "Amoxicillin trihydrate",
  manufacturer: "Ernest Chemists Ltd",
  dosageForm: "Capsule",
  strength: "500 mg",
  price: "24.50",
  description: "Broad-spectrum penicillin antibiotic for bacterial infections.",
  sideEffects: "Nausea, rash, diarrhoea.",
  interactions: "May reduce the effectiveness of combined oral contraceptives.",
  contraindications: "Known penicillin or cephalosporin hypersensitivity.",
  isPrescription: true,
  isControlled: false,
  requiresLicense: false,
};

export default function AddMedicationForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<{ id: string; name: string } | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key as string]) setErrors((e) => ({ ...e, [key as string]: "" }));
  };

  // Mirrors the API's own required set, so a submit that passes here cannot
  // come back as a 400 the user has no field-level explanation for.
  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Medication name is required.";
    if (!form.manufacturer.trim()) next.manufacturer = "Manufacturer is required.";
    if (!form.dosageForm) next.dosageForm = "Select a dosage form.";
    if (!form.strength.trim()) next.strength = "Strength is required (e.g. 500 mg).";
    if (!form.price.trim()) {
      next.price = "Unit price is required.";
    } else if (Number.isNaN(Number(form.price)) || Number(form.price) < 0) {
      next.price = "Enter a valid, non-negative amount.";
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
      const res = await fetch("/api/medications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          genericName: form.genericName.trim() || null,
          description: form.description.trim() || null,
          dosageForm: form.dosageForm,
          strength: form.strength.trim(),
          manufacturer: form.manufacturer.trim(),
          isPrescription: form.isPrescription,
          isControlled: form.isControlled,
          requiresLicense: form.requiresLicense,
          sideEffects: form.sideEffects.trim() || null,
          interactions: form.interactions.trim() || null,
          contraindications: form.contraindications.trim() || null,
          price: form.price,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrors({ general: data.error || "Could not save this medication." });
        return;
      }
      setSaved({ id: data.medication.id, name: data.medication.name });
    } catch {
      setErrors({ general: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  // Success is a real branch, not a toast: the next useful action is almost
  // always to stock the medication that was just created, and that screen
  // needs the new id.
  if (saved) {
    return (
      <div className="mx-auto w-full max-w-2xl p-4 sm:p-6">
        <Card radius="xl" className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary-container/40 text-secondary">
            <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
          </div>
          <h1 className="text-headline-md text-on-surface">Medication added</h1>
          <p className="mt-2 text-on-surface-variant">
            <span className="font-semibold text-on-surface">{saved.name}</span> is now in the
            catalog. It has no stock yet.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href={`/inventory/add?medicationId=${saved.id}`} className={buttonClasses({})}>
              Add stock for it
            </Link>
            <Link href="/medications" className={buttonClasses({ variant: "secondary" })}>
              Back to catalog
            </Link>
            <button
              type="button"
              onClick={() => {
                setSaved(null);
                setForm(EMPTY);
              }}
              className={buttonClasses({ variant: "ghost" })}
            >
              Add another
            </button>
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
            onClick={() => router.push("/medications")}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-outline-variant/60 px-3 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:text-on-surface"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Catalog
          </button>
          <div className="min-w-0">
            <h1 className="text-headline-md text-on-surface">Add Medication</h1>
            <p className="mt-1 text-sm text-on-surface-variant">
              Adds an entry to the shared medication catalog.
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

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card>
          <div className="mb-5 flex items-center gap-2">
            <PillBottle className="h-4 w-4 text-medical-teal dark:text-primary-fixed-dim" aria-hidden="true" />
            <h2 className="font-bold text-on-surface">Identity</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Input
              label="Medication name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Amoxicillin"
              error={errors.name}
            />
            <Input
              label="Generic name"
              value={form.genericName}
              onChange={(e) => set("genericName", e.target.value)}
              placeholder="Amoxicillin trihydrate"
              hint="Optional."
            />
            <Input
              label="Manufacturer"
              value={form.manufacturer}
              onChange={(e) => set("manufacturer", e.target.value)}
              placeholder="Ernest Chemists Ltd"
              error={errors.manufacturer}
            />
            <Select
              label="Dosage form"
              value={form.dosageForm}
              onChange={(e) => set("dosageForm", e.target.value)}
              placeholder="Select a form…"
              error={errors.dosageForm}
            >
              {DOSAGE_FORMS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
            <Input
              label="Strength"
              value={form.strength}
              onChange={(e) => set("strength", e.target.value)}
              placeholder="500 mg"
              error={errors.strength}
            />
            <Input
              label="Unit price (GHS)"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              placeholder="24.50"
              error={errors.price}
            />
          </div>
        </Card>

        <Card>
          <h2 className="mb-5 font-bold text-on-surface">Clinical information</h2>
          <div className="flex flex-col gap-5">
            <Input
              label="Description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Broad-spectrum penicillin antibiotic."
              hint="Optional. Shown to pharmacists on the catalog card."
            />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Input
                label="Side effects"
                value={form.sideEffects}
                onChange={(e) => set("sideEffects", e.target.value)}
                placeholder="Nausea, rash, diarrhoea."
                hint="Optional."
              />
              <Input
                label="Interactions"
                value={form.interactions}
                onChange={(e) => set("interactions", e.target.value)}
                placeholder="Reduces effectiveness of…"
                hint="Optional."
              />
            </div>
            <Input
              label="Contraindications"
              value={form.contraindications}
              onChange={(e) => set("contraindications", e.target.value)}
              placeholder="Known penicillin hypersensitivity."
              hint="Optional."
            />
          </div>
        </Card>

        <Card>
          <h2 className="mb-1 font-bold text-on-surface">Dispensing rules</h2>
          <p className="mb-4 text-sm text-on-surface-variant">
            These control how the medication may be handed out.
          </p>
          <div className="flex flex-col gap-3">
            {(
              [
                { key: "isPrescription", label: "Prescription only", hint: "Cannot be dispensed without a pharmacist's prescription." },
                { key: "isControlled", label: "Controlled substance", hint: "Subject to additional record-keeping." },
                { key: "requiresLicense", label: "Requires license check", hint: "Dispensing pharmacist's license must be verified." },
              ] as const
            ).map(({ key, label, hint }) => (
              <label
                key={key}
                htmlFor={key}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-outline-variant/60 p-4 transition-colors hover:bg-surface-container-low"
              >
                <input
                  id={key}
                  type="checkbox"
                  checked={form[key]}
                  onChange={(e) => set(key, e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-outline-variant text-medical-teal focus:ring-soft-aqua"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-on-surface">{label}</span>
                  <span className="block text-sm text-on-surface-variant">{hint}</span>
                </span>
              </label>
            ))}
          </div>
        </Card>

        {errors.general && (
          <div className="rounded-lg border border-error/30 bg-error-container px-4 py-3 text-sm text-on-error-container">
            {errors.general}
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => router.push("/medications")}
            className={buttonClasses({ variant: "ghost" })}
          >
            Cancel
          </button>
          <button type="submit" disabled={saving} className={buttonClasses({ size: "lg" })}>
            {saving ? "Saving…" : "Save medication"}
          </button>
        </div>
      </form>
    </div>
  );
}
