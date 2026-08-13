"use client";

import { useState } from "react";
import { ClipboardList, Lock, Receipt, Share2 } from "lucide-react";

const OrderStatus = ({ deliveryData }) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!deliveryData) {
    return (
      <div className="text-center py-8">
        <div className="text-outline text-4xl mb-4">📦</div>
        <p className="text-on-surface-variant">No delivery information available</p>
      </div>
    );
  }

  const formatTrackingCode = (code) => {
    if (!code) return "N/A";
    return code.match(/.{1,4}/g)?.join(" ") || code;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      order_confirmed: {
        color: "bg-primary-fixed text-on-primary-fixed",
        text: "Confirmed",
      },
      processing: {
        color: "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200",
        text: "Processing",
      },
      packaged: { color: "bg-tertiary-fixed text-on-tertiary-fixed", text: "Packaged" },
      in_transit: {
        color: "bg-primary-container text-on-primary-container",
        text: "In Transit",
      },
      // Not an error state — it is the last step before delivery, so it uses
      // the brand progression rather than the error tokens it used to.
      out_for_delivery: {
        color: "bg-secondary-container/70 text-on-secondary-container",
        text: "Out for Delivery",
      },
      delivered: { color: "bg-secondary-container text-on-secondary-container", text: "Delivered" },
    };

    const config = statusConfig[status] || statusConfig["order_confirmed"];
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.text}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Order Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-on-surface-variant uppercase tracking-wide">
            Order ID
          </p>
          <p className="font-mono font-semibold text-on-surface">
            {deliveryData.orderId}
          </p>
        </div>
        <div>
          <p className="text-xs text-on-surface-variant uppercase tracking-wide">
            Status
          </p>
          <div className="mt-1">{getStatusBadge(deliveryData.status)}</div>
        </div>
        <div>
          <p className="text-xs text-on-surface-variant uppercase tracking-wide">
            Tracking Code
          </p>
          <p className="font-mono font-semibold text-on-surface">
            {formatTrackingCode(deliveryData.trackingCode)}
          </p>
        </div>
        <div>
          <p className="text-xs text-on-surface-variant uppercase tracking-wide">
            Package Type
          </p>
          <p className="font-semibold text-on-surface">
            {deliveryData.packageType}
          </p>
        </div>
      </div>

      {/* Drop Point Information */}
      <div className="bg-surface rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="text-secondary text-xl">📍</div>
          <div className="flex-1">
            <h4 className="font-semibold text-on-surface mb-1">Drop Point</h4>
            <p className="text-on-surface-variant text-sm mb-2">
              {deliveryData.dropPoint}
            </p>
            <div className="text-xs text-on-surface-variant space-y-1">
              <p>• Secure campus location</p>
              <p>• 24/7 access with student ID</p>
              <p>• Discreet pickup available</p>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Details */}
      <div className="border-t border-outline-variant/60 pt-4">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="font-semibold text-on-surface">Delivery Details</span>
          <span className="text-outline">{showDetails ? "−" : "+"}</span>
        </button>

        {showDetails && (
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Order Date:</span>
              <span className="font-medium">
                {new Date().toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Estimated Delivery:</span>
              <span className="font-medium">
                {deliveryData.estimatedDelivery?.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Delivery Method:</span>
              <span className="font-medium">Campus Drop Point</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Package Weight:</span>
              <span className="font-medium">~0.5 kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Insurance:</span>
              <span className="font-medium text-secondary">✓ Included</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button className="flex items-center justify-center gap-2 bg-primary-fixed/30 hover:bg-primary-fixed/60 text-on-primary-fixed dark:text-on-primary-container py-2 px-3 rounded-lg transition-colors text-sm">
          <Receipt className="h-4 w-4" aria-hidden />
          <span>View Receipt</span>
        </button>
        <button className="flex items-center justify-center gap-2 bg-secondary-container/50 hover:bg-secondary-container text-on-secondary-container py-2 px-3 rounded-lg transition-colors text-sm">
          <Share2 className="h-4 w-4" aria-hidden />
          <span>Share Status</span>
        </button>
      </div>

      {/* Privacy Notice */}
      <div className="bg-primary-fixed/30 border border-primary-fixed rounded-lg p-3">
        <div className="flex items-start gap-2">
          <Lock className="h-4 w-4 flex-shrink-0 text-medical-teal dark:text-primary-fixed-dim" aria-hidden />
          <div className="text-xs text-on-primary-fixed dark:text-on-primary-container">
            <p className="font-medium mb-1">Privacy Protected</p>
            <p>
              Your package uses discreet packaging with no medical labels or
              personal information visible.
            </p>
          </div>
        </div>
      </div>

      {/* Delivery Instructions */}
      {deliveryData.status === "out_for_delivery" && (
        <div className="bg-amber-100/60 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ClipboardList className="h-5 w-5 flex-shrink-0 text-amber-700 dark:text-amber-200" aria-hidden />
            <div>
              <h4 className="font-semibold text-amber-900 dark:text-amber-200 mb-2">
                Pickup Instructions
              </h4>
              <ul className="text-sm text-amber-900/80 dark:text-amber-200/80 space-y-1">
                <li>• Bring your student ID for verification</li>
                <li>• Use the OTP code sent to your device</li>
                <li>• Package will be in a secure locker</li>
                <li>• Available 24/7 at the drop point</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderStatus;
