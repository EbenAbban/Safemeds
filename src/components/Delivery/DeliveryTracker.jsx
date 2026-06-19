"use client";

import { useState, useEffect } from "react";

const DeliveryTracker = ({ status, estimatedDelivery }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const deliveryStages = [
    {
      id: "order_confirmed",
      title: "Order Confirmed",
      description: "Your order has been received and confirmed",
      icon: "📝",
      color: "bg-blue-500",
    },
    {
      id: "processing",
      title: "Processing",
      description: "Pharmacist is reviewing and preparing your medication",
      icon: "⚙️",
      color: "bg-yellow-500",
    },
    {
      id: "packaged",
      title: "Packaged",
      description: "Medication packaged with discreet labeling",
      icon: "📦",
      color: "bg-purple-500",
    },
    {
      id: "in_transit",
      title: "In Transit",
      description: "Package picked up and on the way",
      icon: "🚚",
      color: "bg-orange-500",
    },
    {
      id: "out_for_delivery",
      title: "Out for Delivery",
      description: "Package is being delivered to your drop point",
      icon: "🎯",
      color: "bg-red-500",
    },
    {
      id: "delivered",
      title: "Delivered",
      description: "Package has been delivered to drop point",
      icon: "✅",
      color: "bg-green-500",
    },
  ];

  const getCurrentStageIndex = () => {
    const index = deliveryStages.findIndex((stage) => stage.id === status);
    return index >= 0 ? index : 0;
  };

  const getTimeRemaining = () => {
    if (!estimatedDelivery) return null;

    const diff = estimatedDelivery.getTime() - currentTime.getTime();
    if (diff <= 0) return "Arriving soon";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  };

  const getProgressPercentage = () => {
    const currentIndex = getCurrentStageIndex();
    return ((currentIndex + 1) / deliveryStages.length) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="relative">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Delivery Progress
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(getProgressPercentage())}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 via-orange-500 to-green-500 h-2 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
      </div>

      {/* Estimated Delivery Time */}
      {estimatedDelivery && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-orange-800">
                Estimated Delivery
              </p>
              <p className="text-sm text-orange-600">
                {estimatedDelivery.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-orange-800">
                {getTimeRemaining()}
              </p>
              <p className="text-xs text-orange-600">
                {estimatedDelivery.toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Stages Timeline */}
      <div className="space-y-4">
        {deliveryStages.map((stage, index) => {
          const isCompleted = index <= getCurrentStageIndex();
          const isCurrent = index === getCurrentStageIndex();
          const isUpcoming = index > getCurrentStageIndex();

          return (
            <div key={stage.id} className="flex items-start space-x-4">
              {/* Stage Icon */}
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white text-lg transition-all duration-300 ${
                  isCompleted
                    ? stage.color
                    : isCurrent
                    ? `${stage.color} animate-pulse`
                    : "bg-gray-300"
                }`}
              >
                {stage.icon}
              </div>

              {/* Stage Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3
                    className={`text-sm font-medium ${
                      isCompleted
                        ? "text-gray-900"
                        : isCurrent
                        ? "text-orange-600"
                        : "text-gray-500"
                    }`}
                  >
                    {stage.title}
                  </h3>
                  {isCurrent && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      Current
                    </span>
                  )}
                </div>
                <p
                  className={`text-sm ${
                    isCompleted ? "text-gray-600" : "text-gray-400"
                  }`}
                >
                  {stage.description}
                </p>

                {/* Stage Timestamp */}
                {isCompleted && (
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(
                      Date.now() -
                        (deliveryStages.length - index) * 30 * 60 * 1000
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>

              {/* Connection Line */}
              {index < deliveryStages.length - 1 && (
                <div
                  className={`absolute left-5 w-0.5 h-8 transition-colors duration-300 ${
                    isCompleted ? "bg-green-500" : "bg-gray-300"
                  }`}
                  style={{ top: "2.5rem" }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Current Status Highlight */}
      {status && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">
              {deliveryStages.find((stage) => stage.id === status)?.icon ||
                "📦"}
            </div>
            <div>
              <p className="font-semibold text-blue-800">
                {deliveryStages.find((stage) => stage.id === status)?.title ||
                  "Processing"}
              </p>
              <p className="text-sm text-blue-600">
                {deliveryStages.find((stage) => stage.id === status)
                  ?.description || "Your order is being processed"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryTracker;
