"use client";

import { useState, useEffect } from "react";
import {
  ClipboardCheck,
  Settings2,
  Package,
  Truck,
  MapPin,
  CheckCircle2,
} from "lucide-react";

/**
 * Delivery progress timeline.
 *
 * Two deliberate constraints, both from the privacy/honesty brief:
 *
 * 1. Stages are coloured by *progress state* (done / current / upcoming), not
 *    one hue per stage. A six-colour rainbow reads as decoration; a single
 *    brand progression reads as a status.
 * 2. Completed stages show no timestamp. The component only receives `status`
 *    and `estimatedDelivery`, so per-stage completion times are not knowable —
 *    the previous version synthesised them from `Date.now()`, which displayed
 *    invented delivery history. Real per-stage times need to come from the
 *    delivery record before this can show them.
 */

const DELIVERY_STAGES = [
  {
    id: "order_confirmed",
    title: "Order Confirmed",
    description: "Your order has been received and confirmed",
    Icon: ClipboardCheck,
  },
  {
    id: "processing",
    title: "Processing",
    description: "Pharmacist is reviewing and preparing your medication",
    Icon: Settings2,
  },
  {
    id: "packaged",
    title: "Packaged",
    description: "Medication packaged with discreet labeling",
    Icon: Package,
  },
  {
    id: "in_transit",
    title: "In Transit",
    description: "Package picked up and on the way",
    Icon: Truck,
  },
  {
    id: "out_for_delivery",
    title: "Out for Delivery",
    description: "Package is being delivered to your drop point",
    Icon: MapPin,
  },
  {
    id: "delivered",
    title: "Delivered",
    description: "Package has been delivered to drop point",
    Icon: CheckCircle2,
  },
];

const DeliveryTracker = ({ status, estimatedDelivery }) => {
  const [currentTime, setCurrentTime] = useState(() => new Date());

  // The countdown is rendered at minute granularity, so ticking every second
  // just burns renders. 30s keeps it visually current without the churn.
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const currentIndex = Math.max(
    DELIVERY_STAGES.findIndex((stage) => stage.id === status),
    0
  );

  const getTimeRemaining = () => {
    if (!estimatedDelivery) return null;

    const diff = estimatedDelivery.getTime() - currentTime.getTime();
    if (diff <= 0) return "Arriving soon";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return hours > 0 ? `${hours}h ${minutes}m remaining` : `${minutes}m remaining`;
  };

  const progressPercentage = ((currentIndex + 1) / DELIVERY_STAGES.length) * 100;
  const activeStage = DELIVERY_STAGES.find((stage) => stage.id === status);

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-on-surface-variant">
            Delivery Progress
          </span>
          <span className="text-sm text-on-surface-variant">
            {Math.round(progressPercentage)}%
          </span>
        </div>
        <div
          className="w-full bg-surface-container-high rounded-full h-2"
          role="progressbar"
          aria-valuenow={Math.round(progressPercentage)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Delivery progress"
        >
          <div
            className="bg-gradient-to-r from-medical-teal to-soft-aqua h-2 rounded-full transition-all duration-1000 ease-out motion-reduce:transition-none"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Estimated Delivery Time */}
      {estimatedDelivery && (
        <div className="bg-primary-fixed/30 border border-primary-fixed rounded-lg p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-on-primary-fixed dark:text-on-primary-container">
                Estimated Delivery
              </p>
              <p className="text-sm text-on-surface-variant">
                {estimatedDelivery.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-on-primary-fixed dark:text-on-primary-container">
                {getTimeRemaining()}
              </p>
              <p className="text-xs text-on-surface-variant">
                {estimatedDelivery.toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Stages Timeline */}
      <ol className="space-y-4">
        {DELIVERY_STAGES.map((stage, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const { Icon } = stage;

          return (
            <li key={stage.id} className="relative flex items-start gap-4">
              {/* Connector — sits behind the icon, spanning to the next row. */}
              {index < DELIVERY_STAGES.length - 1 && (
                <span
                  aria-hidden
                  className={`absolute left-5 top-10 -ml-px h-full w-0.5 transition-colors duration-300 ${
                    index < currentIndex ? "bg-medical-teal" : "bg-outline-variant"
                  }`}
                />
              )}

              <div
                className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCurrent
                    ? "bg-medical-teal text-white ring-4 ring-soft-aqua/30"
                    : isCompleted
                    ? "bg-medical-teal text-white"
                    : "bg-surface-container-high text-on-surface-variant"
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </div>

              <div className="flex-1 min-w-0 pb-2">
                <div className="flex items-center justify-between gap-2">
                  <h3
                    className={`text-sm font-medium ${
                      isCompleted ? "text-on-surface" : "text-on-surface-variant"
                    }`}
                  >
                    {stage.title}
                  </h3>
                  {isCurrent && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-primary-fixed text-on-primary-fixed dark:bg-primary-container dark:text-on-primary-container">
                      Current
                    </span>
                  )}
                </div>
                <p
                  className={`text-sm ${
                    isCompleted ? "text-on-surface-variant" : "text-outline"
                  }`}
                >
                  {stage.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Current Status Highlight */}
      {status && (
        <div className="bg-primary-fixed/30 border border-primary-fixed rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-medical-teal text-white">
              {activeStage ? (
                <activeStage.Icon className="h-5 w-5" aria-hidden />
              ) : (
                <Package className="h-5 w-5" aria-hidden />
              )}
            </div>
            <div>
              <p className="font-semibold text-on-primary-fixed dark:text-on-primary-container">
                {activeStage?.title || "Processing"}
              </p>
              <p className="text-sm text-on-surface-variant">
                {activeStage?.description || "Your order is being processed"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryTracker;
