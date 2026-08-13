"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { AlertTriangle, ClipboardList, MessageSquare, PackageSearch } from "lucide-react";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import PharmacyShell from "@/components/pharmacy/PharmacyShell";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui";

// Pulls in the Firebase SDK + WebRTC signaling for video calls — code a
// pharmacist only needs if a call actually comes in. Loaded on the client
// after the dashboard itself has rendered, instead of blocking first paint.
const IncomingCallListener = dynamic(
  () => import("@/components/Chat/IncomingCallListener"),
  { ssr: false }
);

/**
 * Pharmacist dashboard — SafeMeds Vital design system.
 *
 * The design system's mockup for this screen showed four stat cards: Active
 * Consultations, Pending Prescriptions, Deliveries in Progress, and
 * Pharmacists Online, with placeholder numbers (24/18/42/5). Two of those
 * had no honest backing data to wire up without inventing a new backend
 * subsystem the redesign brief explicitly forbids fabricating around:
 *
 * - "Deliveries in Progress": Delivery has no pharmacy-scoping field and no
 *   list API exists yet, so there is no way to compute a number that is both
 *   real and correctly scoped to this pharmacist.
 * - "Pharmacists Online": SafeMeds has no presence/online-status system for
 *   staff at all.
 *
 * Replaced both with stats that ARE real and already correctly scoped by
 * existing, tested API routes: Pending Consultations (queue awaiting
 * attention) and Low Stock Items (from the inventory this page's sidebar
 * links to). Every number on this page comes from a real query against this
 * pharmacist's own data.
 */

interface Stats {
  activeConsultations: number | null;
  pendingConsultations: number | null;
  pendingPrescriptions: number | null;
  lowStockItems: number | null;
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function DashboardContent() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    activeConsultations: null,
    pendingConsultations: null,
    pendingPrescriptions: null,
    lowStockItems: null,
  });

  useEffect(() => {
    let cancelled = false;

    const fetchCount = async (url: string): Promise<number | null> => {
      try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        return data.pagination?.total ?? data.statistics?.lowStockItems ?? null;
      } catch {
        return null;
      }
    };

    (async () => {
      const [active, pending, prescriptions, inventory] = await Promise.all([
        fetchCount("/api/consultations?status=IN_PROGRESS&limit=1"),
        fetchCount("/api/consultations?status=PENDING&limit=1"),
        fetchCount("/api/prescriptions?status=PENDING&limit=1"),
        fetchCount("/api/inventory?lowStock=true&limit=1"),
      ]);
      if (!cancelled) {
        setStats({
          activeConsultations: active,
          pendingConsultations: pending,
          pendingPrescriptions: prescriptions,
          lowStockItems: inventory,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const cards = [
    { label: "Active Consultations", value: stats.activeConsultations, Icon: MessageSquare, tone: "text-medical-teal dark:text-primary-fixed-dim", tint: "bg-secondary-container/20" },
    { label: "Pending Consultations", value: stats.pendingConsultations, Icon: ClipboardList, tone: "text-tertiary", tint: "bg-tertiary-fixed" },
    { label: "Pending Prescriptions", value: stats.pendingPrescriptions, Icon: PackageSearch, tone: "text-secondary", tint: "bg-secondary-container/20" },
    { label: "Low Stock Items", value: stats.lowStockItems, Icon: AlertTriangle, tone: "text-error", tint: "bg-error-container/50" },
  ] as const;

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-8 px-5 py-8 sm:px-8 lg:px-12">
      <div>
        <h1 className="text-headline-lg text-on-surface">
          {greeting()}, {user?.name || user?.username || "Doctor"}.
        </h1>
        <p className="mt-2 text-on-surface-variant">Here is the current status of your clinical operations.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, Icon, tone, tint }) => (
          <Card key={label} interactive>
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${tint} ${tone}`}>
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="mt-4 text-sm text-on-surface-variant">{label}</p>
            <p className="mt-1 text-headline-md text-on-surface">{value === null ? "—" : value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function PharmacyDashboard() {
  return (
    <ProtectedRoute allowedRoles={["PHARMACY"]}>
      {/* Listens for incoming student video consultation calls */}
      <IncomingCallListener />
      <PharmacyShell active="pharmacy" pageTitle="Dashboard">
        <DashboardContent />
      </PharmacyShell>
    </ProtectedRoute>
  );
}
