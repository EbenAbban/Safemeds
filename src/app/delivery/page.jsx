"use client";

import { useState, useEffect } from "react";
import DeliveryTracker from "@/components/Delivery/DeliveryTracker";
import DeliveryMap from "@/components/Delivery/DeliveryMap";
import OrderStatus from "@/components/Delivery/OrderStatus";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import Navigation from "@/components/Common/Navigation";
import { useAuth } from "@/hooks/useAuth";
import { AlertTriangle, BadgeCheck, Clock3, Lock, Package } from "lucide-react";

export default function DeliveryPage() {
  const [deliveryData, setDeliveryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [anonId, setAnonId] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    // Get anonymous ID from localStorage
    let id = localStorage.getItem("anonId");
    if (!id) {
      // Generate random ID
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let result = "";
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      id = result;
      localStorage.setItem("anonId", id);
    }
    setAnonId(id);

    // Fetch the user's real delivery record from the DB.
    const fetchDeliveryData = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/delivery/me");
        const data = await res.json();
        const d = data?.delivery;
        if (d) {
          setDeliveryData({
            // DB enum (ORDER_CONFIRMED) -> tracker stage id (order_confirmed)
            status: String(d.status || "ORDER_CONFIRMED").toLowerCase(),
            orderId: d.order?.orderNumber || d.trackingNumber,
            estimatedDelivery: d.estimatedDelivery,
            dropPoint: d.dropPoint || "Campus Library - North Entrance",
            dropLat: d.dropLat,
            dropLng: d.dropLng,
            packageType: d.packageType || "Discreet Packaging",
            trackingCode: d.trackingNumber,
            deliveryId: d.id,
            medication: d.order?.prescription?.medication?.name,
          });
        } else {
          setDeliveryData(null); // no active delivery
        }
      } catch (err) {
        setError("Unable to fetch delivery information");
        console.error("Delivery fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveryData();
  }, []);

  return (
    <ProtectedRoute allowedRoles={["CLIENT", "PHARMACY"]}>
      <div className="min-h-screen bg-gradient-to-br from-primary-fixed/30 to-primary-fixed/50 dark:from-surface-dark dark:to-surface-container-high">
        {/* Navigation */}
        <Navigation
          title="Delivery Tracking"
          userRole={user?.role?.toLowerCase() || "client"}
        />

        {loading ? (
          <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-soft-aqua mx-auto mb-4"></div>
              <p className="text-on-surface-variant">
                🔍 Loading your delivery information...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
            <div className="text-center max-w-md mx-auto p-6">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-error-container/60">
                <AlertTriangle className="h-7 w-7 text-error" aria-hidden />
              </div>
              <h2 className="text-xl font-semibold text-on-surface mb-2">
                Delivery Unavailable
              </h2>
              <p className="text-on-surface-variant mb-4">{error}</p>
              <p className="text-sm text-on-surface-variant">
                Please ensure you have submitted a consultation first, or try
                again later.
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-on-surface mb-2">
                🚚 Secure Delivery Tracking
              </h1>
              <p className="text-on-surface-variant max-w-2xl mx-auto">
                Track your discreet delivery in real-time. Your privacy is
                protected throughout the entire process.
              </p>
            </div>

            {/* Privacy Notice */}
            <div className="bg-surface-container-lowest/70 dark:bg-surface-container/70 backdrop-blur-sm border border-outline-variant/60 rounded-xl p-4 mb-6 max-w-4xl mx-auto">
              <div className="flex items-start space-x-3">
                <Lock className="h-5 w-5 flex-shrink-0 text-medical-teal dark:text-primary-fixed-dim" aria-hidden />
                <div>
                  <h3 className="font-semibold text-on-surface mb-1">
                    Privacy Protected
                  </h3>
                  <p className="text-sm text-on-surface-variant">
                    Your delivery is handled with complete discretion. No
                    personal information is visible on the package.
                  </p>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Map and Tracker */}
              <div className="space-y-6">
                {/* Delivery Map */}
                <div className="bg-surface-container-lowest/80 dark:bg-surface-container/80 backdrop-blur-sm rounded-xl shadow-lg border border-outline-variant/60 overflow-hidden">
                  <div className="p-4 border-b border-outline-variant/60">
                    <h2 className="text-lg font-semibold text-on-surface">
                      Live Location
                    </h2>
                    <p className="text-sm text-on-surface-variant">
                      Real-time delivery vehicle tracking
                    </p>
                  </div>
                  <div className="p-4">
                    <DeliveryMap
                      deliveryId={deliveryData?.deliveryId}
                      dropPoint={deliveryData?.dropPoint}
                      dropCoords={
                        deliveryData?.dropLat != null && deliveryData?.dropLng != null
                          ? { lat: deliveryData.dropLat, lng: deliveryData.dropLng }
                          : undefined
                      }
                    />
                    {deliveryData?.deliveryId && (
                      <a
                        href={`/deliver/${deliveryData.deliveryId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-block text-xs text-medical-teal dark:text-primary-fixed-dim underline"
                      >
                        Courier: open GPS sharing for this delivery →
                      </a>
                    )}
                  </div>
                </div>

                {/* Delivery Tracker */}
                <div className="bg-surface-container-lowest/80 dark:bg-surface-container/80 backdrop-blur-sm rounded-xl shadow-lg border border-outline-variant/60 overflow-hidden">
                  <div className="p-4 border-b border-outline-variant/60">
                    <h2 className="text-lg font-semibold text-on-surface">
                      Delivery Progress
                    </h2>
                    <p className="text-sm text-on-surface-variant">
                      Track your order through each stage
                    </p>
                  </div>
                  <div className="p-4">
                    <DeliveryTracker status={deliveryData?.status} />
                  </div>
                </div>
              </div>

              {/* Right Column - Order Status */}
              <div className="space-y-6">
                <div className="bg-surface-container-lowest/80 dark:bg-surface-container/80 backdrop-blur-sm rounded-xl shadow-lg border border-outline-variant/60 overflow-hidden">
                  <div className="p-4 border-b border-outline-variant/60">
                    <h2 className="text-lg font-semibold text-on-surface">
                      Order Details
                    </h2>
                    <p className="text-sm text-on-surface-variant">
                      Complete order information and status
                    </p>
                  </div>
                  <div className="p-4">
                    <OrderStatus
                      orderId={deliveryData?.orderId}
                      status={deliveryData?.status}
                      trackingCode={deliveryData?.trackingCode}
                      packageType={deliveryData?.packageType}
                      dropPoint={deliveryData?.dropPoint}
                      estimatedDelivery={deliveryData?.estimatedDelivery}
                    />
                  </div>
                </div>

                {/* Additional Info */}
                <div className="bg-surface-container-lowest/80 dark:bg-surface-container/80 backdrop-blur-sm rounded-xl shadow-lg border border-outline-variant/60 p-6">
                  <h3 className="text-lg font-semibold text-on-surface mb-4">
                    Delivery Instructions
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start space-x-3">
                      <Package className="h-5 w-5 flex-shrink-0 text-medical-teal dark:text-primary-fixed-dim" aria-hidden />
                      <div>
                        <p className="font-medium text-on-surface dark:text-on-surface">
                          Package Collection
                        </p>
                        <p className="text-on-surface-variant">
                          Present your tracking code to collect your package
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <BadgeCheck className="h-5 w-5 flex-shrink-0 text-medical-teal dark:text-primary-fixed-dim" aria-hidden />
                      <div>
                        <p className="font-medium text-on-surface dark:text-on-surface">
                          Identification
                        </p>
                        <p className="text-on-surface-variant">
                          No personal ID required - tracking code only
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Clock3 className="h-5 w-5 flex-shrink-0 text-medical-teal dark:text-primary-fixed-dim" aria-hidden />
                      <div>
                        <p className="font-medium text-on-surface dark:text-on-surface">
                          Collection Window
                        </p>
                        <p className="text-on-surface-variant">
                          Available for pickup within 24 hours of delivery
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
