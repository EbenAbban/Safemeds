"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Package, PackageCheck, RefreshCw } from "lucide-react";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import Navigation from "@/components/Common/Navigation";

interface DeliverySummary {
  id: string;
  trackingNumber: string;
  status: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  dropPoint: string | null;
  estimatedDelivery: string | null;
  createdAt: string;
}

const STATUS_LABEL: Record<string, string> = {
  ORDER_CONFIRMED: "Order Confirmed",
  PROCESSING: "Processing",
  PACKAGED: "Packaged",
  IN_TRANSIT: "In Transit",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

function DeliveryCard({
  delivery,
  action,
}: {
  delivery: DeliverySummary;
  action: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-4 dark:bg-surface-container">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm font-semibold text-on-surface">
            {delivery.trackingNumber}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-on-surface-variant">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {delivery.dropPoint || `${delivery.address}, ${delivery.city}`}
          </p>
        </div>
        <span className="whitespace-nowrap rounded-full bg-secondary-container px-3 py-1 text-xs font-semibold text-on-secondary-container">
          {STATUS_LABEL[delivery.status] || delivery.status}
        </span>
      </div>
      <div className="mt-3">{action}</div>
    </div>
  );
}

export default function CourierDashboard() {
  const [assigned, setAssigned] = useState<DeliverySummary[]>([]);
  const [available, setAvailable] = useState<DeliverySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/courier/deliveries");
      if (!res.ok) throw new Error("Failed to load deliveries");
      const data = await res.json();
      setAssigned(data.assigned || []);
      setAvailable(data.available || []);
    } catch {
      setError("Unable to load deliveries. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const claim = async (id: string) => {
    setClaimingId(id);
    setClaimError(null);
    try {
      const res = await fetch(`/api/courier/deliveries/${id}/claim`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setClaimError(data.error || "Could not claim this delivery.");
        return;
      }
      await load();
    } catch {
      setClaimError("Could not claim this delivery. Please try again.");
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["COURIER"]}>
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 dark:from-surface-dark dark:via-gray-800 dark:to-surface-dark">
        <Navigation title="Courier Dashboard" userRole="courier" />

        <main className="mx-auto max-w-5xl px-4 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-headline-md text-on-surface">Your Deliveries</h1>
              <p className="mt-1 text-on-surface-variant">
                Claim a packaged delivery and share your GPS while you drop it off.
              </p>
            </div>
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-outline-variant/60 px-3 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:text-on-surface disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
              Refresh
            </button>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-error/30 bg-error-container px-4 py-3 text-sm text-on-error-container">
              {error}
            </div>
          )}
          {claimError && (
            <div className="mb-6 rounded-lg border border-error/30 bg-error-container px-4 py-3 text-sm text-on-error-container">
              {claimError}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-orange-600" />
            </div>
          ) : (
            <div className="space-y-10">
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-on-surface">
                  <PackageCheck className="h-5 w-5 text-medical-teal" aria-hidden="true" />
                  My deliveries ({assigned.length})
                </h2>
                {assigned.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-outline-variant/60 p-6 text-center text-sm text-on-surface-variant">
                    You haven&apos;t claimed any deliveries yet — pick one up from the pool below.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {assigned.map((d) => (
                      <motion.div key={d.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <DeliveryCard
                          delivery={d}
                          action={
                            <Link
                              href={`/deliver/${d.id}`}
                              className="inline-flex items-center gap-1.5 text-sm font-semibold text-medical-teal hover:text-soft-aqua dark:text-primary-fixed-dim"
                            >
                              <MapPin className="h-4 w-4" aria-hidden="true" />
                              Share GPS for this delivery →
                            </Link>
                          }
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-on-surface">
                  <Package className="h-5 w-5 text-on-surface-variant" aria-hidden="true" />
                  Available to claim ({available.length})
                </h2>
                {available.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-outline-variant/60 p-6 text-center text-sm text-on-surface-variant">
                    No packaged deliveries are waiting for a courier right now.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {available.map((d) => (
                      <motion.div key={d.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <DeliveryCard
                          delivery={d}
                          action={
                            <button
                              onClick={() => claim(d.id)}
                              disabled={claimingId === d.id}
                              className="rounded-lg bg-medical-teal px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50"
                            >
                              {claimingId === d.id ? "Claiming…" : "Claim delivery"}
                            </button>
                          }
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
