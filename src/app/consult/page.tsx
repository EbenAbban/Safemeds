"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Baby,
  Brain,
  CheckCircle2,
  HeartPulse,
  Info,
  Stethoscope,
} from "lucide-react";
import Navigation from "@/components/Common/Navigation";
import { SlideUp } from "@/components/animations";
import { buttonClasses, cn } from "@/components/ui";
import { createAnonymousConsultation } from "@/services/consultationService";

/**
 * Anonymous consultation intake.
 *
 * On success this now hands the student straight into the real consultation
 * thread. Previously it showed a session id and a "Track" button, and the chat
 * was never reachable — the copy promised "access your chat with the
 * pharmacist" that no link led to.
 *
 * The consultation id and anonymousId are persisted so /chat can reopen the
 * same thread later; anonymousId is what authorises access without an account.
 */

const CONSULTATION_TYPES = [
  { value: "general", label: "General Health", icon: Stethoscope },
  { value: "mental health", label: "Mental Health", icon: Brain },
  { value: "pain relief", label: "Pain Relief", icon: Activity },
  { value: "pregnancy", label: "Pregnancy", icon: Baby },
  { value: "sexual health", label: "Sexual Health", icon: HeartPulse },
] as const;

const FIELD_CLASS =
  "w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-on-surface placeholder:text-on-surface-variant focus:border-transparent focus:ring-2 focus:ring-soft-aqua dark:bg-surface-container-high";

export default function AnonymousConsultationPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    type: "",
    description: "",
    symptoms: "",
    medications: "",
    allergies: "",
    age: "",
    gender: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    sessionId: string;
    consultationId: string;
    anonymousId: string;
  } | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.type || !formData.description.trim()) {
      setError("Choose a consultation type and describe your concern.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await createAnonymousConsultation({
        ...formData,
        age: formData.age ? parseInt(formData.age) : undefined,
        isAnonymous: true,
      });

      if (!response) {
        setError("Could not submit your consultation. Please try again.");
        return;
      }

      // Persist so /chat can reopen this thread. anonymousId is the access
      // credential for the consultation API — without it an anonymous student
      // cannot read their own replies.
      localStorage.setItem("consultationId", response.consultation.id);
      localStorage.setItem("anonymousId", response.anonymousId);
      localStorage.setItem("sessionId", response.sessionId);

      setResult({
        sessionId: response.sessionId,
        consultationId: response.consultation.id,
        anonymousId: response.anonymousId,
      });
    } catch (err) {
      console.error("Error creating consultation:", err);
      setError("Could not submit your consultation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="min-h-screen bg-surface dark:bg-surface-dark">
        <Navigation title="Anonymous Consultation" userRole="client" />

        <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
          <SlideUp className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-8 shadow-soft dark:bg-surface-container">
            <div className="mb-6 flex flex-col items-center text-center">
              <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary-container">
                <CheckCircle2
                  className="h-7 w-7 text-on-secondary-container"
                  aria-hidden="true"
                />
              </span>
              <h1 className="text-headline-lg text-on-surface">Consultation submitted</h1>
              <p className="mt-3 text-on-surface-variant">
                A licensed pharmacist will review your inquiry and reply in the
                conversation below.
              </p>
            </div>

            <div className="mb-8 rounded-xl border border-outline-variant/60 bg-surface-container-low p-5 dark:bg-surface-container-high">
              <h2 className="text-sm font-semibold text-on-surface">Your session ID</h2>
              <p className="mt-3 break-all rounded-lg border border-outline-variant bg-surface-container-lowest p-3 font-mono text-sm text-on-surface dark:bg-surface-container">
                {result.sessionId}
              </p>
              <p className="mt-3 text-sm text-on-surface-variant">
                Save this to reopen your consultation on another device. This
                browser will remember it automatically.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => router.push(`/chat?consultationId=${result.consultationId}`)}
                className={buttonClasses({ variant: "primary", size: "lg", fullWidth: true })}
              >
                Open conversation
              </button>
              <button
                onClick={() => router.push(`/track?sessionId=${result.sessionId}`)}
                className={buttonClasses({ variant: "secondary", size: "lg", fullWidth: true })}
              >
                Track status
              </button>
            </div>

            <div className="mt-8 flex gap-3 rounded-xl border border-outline-variant/60 bg-surface-container-low p-5 dark:bg-surface-container-high">
              <Info
                className="h-5 w-5 shrink-0 text-on-surface-variant"
                aria-hidden="true"
              />
              <ul className="space-y-1.5 text-sm text-on-surface-variant">
                <li>Your consultation is not linked to your name or account.</li>
                <li>A licensed pharmacist reviews every inquiry.</li>
                <li>
                  For an emergency, contact emergency services immediately rather
                  than waiting for a reply.
                </li>
              </ul>
            </div>
          </SlideUp>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface dark:bg-surface-dark">
      <Navigation title="Anonymous Consultation" userRole="client" />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <SlideUp className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-6 shadow-soft sm:p-8 dark:bg-surface-container">
          <div className="mb-8">
            <h1 className="text-headline-lg text-on-surface">
              Anonymous health consultation
            </h1>
            <p className="mt-3 text-on-surface-variant">
              Describe your concern and a licensed pharmacist will respond. You
              do not need an account, and you are not asked for your name.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <fieldset>
              <legend className="mb-3 text-sm font-medium text-on-surface-variant">
                Consultation type <span aria-hidden="true">*</span>
                <span className="sr-only">(required)</span>
              </legend>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {CONSULTATION_TYPES.map(({ value, label, icon: Icon }) => {
                  const selected = formData.type === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, type: value }));
                        if (error) setError("");
                      }}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border p-4 text-left transition-colors",
                        selected
                          ? "border-medical-teal bg-primary-fixed/40 dark:border-primary dark:bg-surface-container-high"
                          : "border-outline-variant/60 hover:border-outline"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5 shrink-0",
                          selected
                            ? "text-medical-teal dark:text-primary"
                            : "text-on-surface-variant"
                        )}
                        aria-hidden="true"
                      />
                      <span className="text-sm font-medium text-on-surface">{label}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium text-on-surface-variant"
              >
                Describe your health concern <span aria-hidden="true">*</span>
                <span className="sr-only">(required)</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                required
                className={FIELD_CLASS}
                placeholder="Describe your symptoms, concerns, or questions in detail…"
              />
            </div>

            {[
              { id: "symptoms", label: "Current symptoms", rows: 3, placeholder: "List any symptoms you're experiencing…" },
              { id: "medications", label: "Current medications", rows: 3, placeholder: "List any medications you're currently taking…" },
              { id: "allergies", label: "Known allergies", rows: 2, placeholder: "List any known allergies to medications or substances…" },
            ].map((f) => (
              <div key={f.id}>
                <label
                  htmlFor={f.id}
                  className="mb-2 block text-sm font-medium text-on-surface-variant"
                >
                  {f.label}
                </label>
                <textarea
                  id={f.id}
                  name={f.id}
                  value={formData[f.id as keyof typeof formData]}
                  onChange={handleInputChange}
                  rows={f.rows}
                  className={FIELD_CLASS}
                  placeholder={f.placeholder}
                />
              </div>
            ))}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="age" className="mb-2 block text-sm font-medium text-on-surface-variant">
                  Age
                </label>
                <input
                  id="age"
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  min="13"
                  max="100"
                  className={FIELD_CLASS}
                  placeholder="Your age"
                />
              </div>
              <div>
                <label htmlFor="gender" className="mb-2 block text-sm font-medium text-on-surface-variant">
                  Gender
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className={FIELD_CLASS}
                >
                  <option value="">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Privacy notice. Deliberately describes what the system actually
                does — the previous copy claimed "all data is encrypted and
                secure", a blanket security guarantee the implementation does
                not support and which the design rules forbid. */}
            <div className="rounded-xl border border-outline-variant/60 bg-surface-container-low p-5 dark:bg-surface-container-high">
              <h2 className="mb-2 text-sm font-semibold text-on-surface">Privacy</h2>
              <ul className="space-y-1.5 text-sm text-on-surface-variant">
                <li>No account or name is required to submit this.</li>
                <li>Your consultation is not linked to a personal identity.</li>
                <li>Only licensed pharmacists can read and reply to it.</li>
                <li>
                  For an emergency, contact emergency services immediately.
                </li>
              </ul>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-error/30 bg-error-container px-4 py-3 text-sm text-on-error-container"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={buttonClasses({ variant: "primary", size: "lg", fullWidth: true })}
            >
              {loading ? "Submitting…" : "Submit consultation"}
            </button>
          </form>
        </SlideUp>
      </main>
    </div>
  );
}
