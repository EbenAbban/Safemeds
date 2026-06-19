import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: Promise<{ anonId: string }> }) {
  const { anonId } = await params;

  try {
    // Simulate API delay
    await new Promise((resolve) =>
      setTimeout(resolve, 500 + Math.random() * 1000)
    );

    // Mock delivery location with some movement
    const baseLocation = {
      lat: 40.7128 + (Math.random() - 0.5) * 0.01,
      lng: -74.006 + (Math.random() - 0.5) * 0.01,
      address: "New York, NY",
      accuracy: 50 + Math.random() * 100,
    };

    return NextResponse.json({
      location: baseLocation,
      anonId,
      timestamp: new Date().toISOString(),
      isLive: true,
    });
  } catch (error) {
    console.error('Delivery location fetch error:', error);
    return NextResponse.json(
      { error: "Failed to fetch delivery location" },
      { status: 500 }
    );
  }
}