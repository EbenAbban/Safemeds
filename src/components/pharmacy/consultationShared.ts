// Types and label helpers shared by the pharmacist consultation queue and the
// conversation screen (see ConsultationQueue.tsx / ConsultationThread.tsx).
// They live here rather than in either component so the two screens cannot
// drift into labelling the same consultation differently.

export interface ConsultationSummary {
  id: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  type: string;
  anonymousId: string | null;
  isAnonymous: boolean;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string } | null;
  messages: { content: string; createdAt: string; isFromPharmacist: boolean }[];
  _count: { messages: number; prescriptions: number };
}

export interface PrescriptionSummary {
  id: string;
  status: string;
  dosage: string;
  frequency: string;
  duration: string;
  medication: { name: string; strength: string };
}

export const STATUS_LABEL: Record<
  ConsultationSummary["status"],
  { label: string; tone: "success" | "neutral" | "danger" }
> = {
  PENDING: { label: "Waiting", tone: "neutral" },
  IN_PROGRESS: { label: "In Progress", tone: "success" },
  COMPLETED: { label: "Resolved", tone: "neutral" },
  CANCELLED: { label: "Cancelled", tone: "danger" },
};

/**
 * What the pharmacist is allowed to see of the patient. An anonymous
 * consultation resolves to a short opaque code, never a name — the record
 * carries no identity to reveal in the first place.
 */
export function patientLabel(
  c: Pick<ConsultationSummary, "anonymousId" | "isAnonymous" | "user">
): string {
  if (c.isAnonymous || !c.user) {
    const raw = c.anonymousId ?? "";
    const tail = raw.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase() || "0000";
    return `ANON-${tail}`;
  }
  return `${c.user.firstName} ${c.user.lastName.charAt(0)}.`;
}

export function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "Now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

export const POLL_INTERVAL_MS = 4000;
