"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { MapPin, Navigation as NavIcon, Square } from "lucide-react";
import { publishLocation, stopSharing } from "@/lib/locationTracking";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";

// Courier-facing page. Opened on the runner's phone for a specific delivery.
// Streams the device's real GPS to Firestore so the student's tracking map
// shows the live position. Keep this tab open while delivering.
export default function CourierSharePage() {
  const params = useParams();
  const deliveryId = String(params.deliveryId);

  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [last, setLast] = useState<{
    lat: number;
    lng: number;
    accuracy: number | null;
    updatedAt: number;
  } | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const start = () => {
    setError(null);
    if (!("geolocation" in navigator)) {
      setError("This device/browser does not support geolocation.");
      return;
    }
    setSharing(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        void publishLocation(deliveryId, pos, true);
        setLast({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? null,
          updatedAt: Date.now(),
        });
        setError(null);
      },
      (err) => {
        console.warn("Geolocation error:", err);
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Enable it for this site and retry."
            : "Could not get your location. Check GPS/signal."
        );
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
    );
  };

  const stop = () => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setSharing(false);
    void stopSharing(deliveryId);
  };

  // Clean up the GPS watch on unmount.
  useEffect(() => {
    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <ProtectedRoute allowedRoles={["PHARMACY", "ADMIN"]}>
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full"
      >
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
            <MapPin className="w-7 h-7 text-orange-600 dark:text-orange-300" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Courier Location Sharing
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Delivery <span className="font-mono">{deliveryId}</span>
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6 text-sm text-gray-600 dark:text-gray-300">
          Keep this page open while delivering. Your phone&apos;s GPS streams to the
          student&apos;s tracking map in real time. Stop sharing when the delivery is complete.
        </div>

        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {last && (
          <div className="mb-6 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-gray-700 dark:text-gray-200">
                {last.lat.toFixed(5)}, {last.lng.toFixed(5)}
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                {last.accuracy != null ? `±${Math.round(last.accuracy)} m` : "—"}
              </span>
            </div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              ● Broadcasting live
            </p>
          </div>
        )}

        {!sharing ? (
          <button
            onClick={start}
            className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl font-semibold transition-colors"
          >
            <NavIcon className="w-5 h-5" />
            Start sharing my location
          </button>
        ) : (
          <button
            onClick={stop}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold transition-colors"
          >
            <Square className="w-5 h-5" />
            Stop sharing
          </button>
        )}
      </motion.div>
    </div>
    </ProtectedRoute>
  );
}
