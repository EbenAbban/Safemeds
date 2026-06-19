import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { anonId } = params;

  try {
    // Simulate API delay
    await new Promise((resolve) =>
      setTimeout(resolve, 1000 + Math.random() * 1000)
    );

    // Mock delivery status based on time
    const deliveryStages = [
      "order_confirmed",
      "processing",
      "packaged",
      "in_transit",
      "out_for_delivery",
      "delivered",
    ];

    // Simulate different stages based on time
    const timeSinceOrder = Date.now() - (Date.now() - 30 * 60 * 1000); // Mock order time
    const stageIndex = Math.min(
      Math.floor(timeSinceOrder / (30 * 60 * 1000)),
      deliveryStages.length - 1
    );

    const status = deliveryStages[stageIndex] || "order_confirmed";

    return NextResponse.json({
      status,
      anonId,
      timestamp: new Date().toISOString(),
      estimatedDelivery: new Date(
        Date.now() + 2 * 60 * 60 * 1000
      ).toISOString(),
    });
  } catch (error) {
    console.error("Delivery status error:", error);
    return NextResponse.json(
      { error: "Failed to fetch delivery status" },
      { status: 500 }
    );
  }
}
