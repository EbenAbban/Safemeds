"use client";

import { useState, useEffect } from "react";
import DeliveryTracker from "@/components/Delivery/DeliveryTracker";
import DeliveryMap from "@/components/Delivery/DeliveryMap";
import OrderStatus from "@/components/Delivery/OrderStatus";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import Navigation from "@/components/Common/Navigation";
import { useAuth } from "@/hooks/useAuth";

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
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Navigation */}
        <Navigation
          title="Delivery Tracking"
          userRole={user?.role?.toLowerCase() || "client"}
        />

        {loading ? (
          <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">
                🔍 Loading your delivery information...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
            <div className="text-center max-w-md mx-auto p-6">
              <div className="text-red-500 text-4xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                Delivery Unavailable
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Please ensure you have submitted a consultation first, or try
                again later.
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-orange-800 dark:text-orange-300 mb-2">
                🚚 Secure Delivery Tracking
              </h1>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Track your discreet delivery in real-time. Your privacy is
                protected throughout the entire process.
              </p>
            </div>

            {/* Privacy Notice */}
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-orange-200 dark:border-gray-700 rounded-xl p-4 mb-6 max-w-4xl mx-auto">
              <div className="flex items-start space-x-3">
                <span className="text-orange-600 text-xl">🔒</span>
                <div>
                  <h3 className="font-semibold text-orange-800 mb-1">
                    Privacy Protected
                  </h3>
                  <p className="text-sm text-orange-700">
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
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-orange-200 dark:border-gray-700 overflow-hidden">
                  <div className="p-4 border-b border-orange-100 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                      Live Location
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
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
                        className="mt-3 inline-block text-xs text-orange-700 dark:text-orange-300 underline"
                      >
                        Courier: open GPS sharing for this delivery →
                      </a>
                    )}
                  </div>
                </div>

                {/* Delivery Tracker */}
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-orange-200 dark:border-gray-700 overflow-hidden">
                  <div className="p-4 border-b border-orange-100 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                      Delivery Progress
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
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
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-orange-200 dark:border-gray-700 overflow-hidden">
                  <div className="p-4 border-b border-orange-100 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                      Order Details
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
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
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-orange-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                    Delivery Instructions
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start space-x-3">
                      <span className="text-orange-500 text-lg">📦</span>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-100">
                          Package Collection
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          Present your tracking code to collect your package
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="text-orange-500 text-lg">🆔</span>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-100">
                          Identification
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          No personal ID required - tracking code only
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="text-orange-500 text-lg">⏰</span>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-100">
                          Collection Window
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
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
