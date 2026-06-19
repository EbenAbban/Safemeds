import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/app/auth";

// GET - Fetch delivery details and tracking information
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ deliveryId: string }> }
) {
  try {
    const { deliveryId } = await params;
    const { searchParams } = new URL(request.url);
    const anonymousId = searchParams.get("anonymousId");
    const session = await auth();

    if (!session?.user && !anonymousId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const delivery = await prisma.delivery.findFirst({
      where: {
        id: deliveryId,
        OR: [
          { userId: session?.user?.id },
          { anonymousId: anonymousId || undefined },
        ],
      },
      include: {
        order: {
          include: {
            prescription: {
              include: {
                medication: true,
                consultation: {
                  include: {
                    assignedPharmacist: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        pharmacyName: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!delivery) {
      return NextResponse.json(
        { error: "Delivery not found" },
        { status: 404 }
      );
    }

    // Generate delivery timeline
    const timeline = generateDeliveryTimeline(delivery);

    return NextResponse.json({
      delivery,
      timeline,
    });
  } catch (error) {
    console.error("Error fetching delivery:", error);
    return NextResponse.json(
      { error: "Failed to fetch delivery" },
      { status: 500 }
    );
  }
}

// PUT - Update delivery status (pharmacy/admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ deliveryId: string }> }
) {
  try {
    const { deliveryId } = await params;
    const session = await auth();

    if (!session?.user || !["ADMIN", "PHARMACY"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { status, estimatedDelivery, actualDelivery, notes } = body;

    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery) {
      return NextResponse.json(
        { error: "Delivery not found" },
        { status: 404 }
      );
    }

    const updatedDelivery = await prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        status,
        estimatedDelivery: estimatedDelivery
          ? new Date(estimatedDelivery)
          : undefined,
        actualDelivery: actualDelivery ? new Date(actualDelivery) : undefined,
      },
      include: {
        order: {
          include: {
            prescription: {
              include: {
                medication: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      delivery: updatedDelivery,
      message: "Delivery status updated successfully",
    });
  } catch (error) {
    console.error("Error updating delivery:", error);
    return NextResponse.json(
      { error: "Failed to update delivery" },
      { status: 500 }
    );
  }
}

// Helper function to generate delivery timeline
function generateDeliveryTimeline(delivery: any) {
  const timeline = [
    {
      status: "ORDER_CONFIRMED",
      title: "Order Confirmed",
      description: "Your order has been confirmed and is being processed",
      timestamp: delivery.createdAt,
      completed: true,
    },
  ];

  if (delivery.status !== "ORDER_CONFIRMED") {
    timeline.push({
      status: "PROCESSING",
      title: "Processing",
      description: "Your medication is being prepared and packaged",
      timestamp: delivery.updatedAt,
      completed: [
        "PROCESSING",
        "PACKAGED",
        "IN_TRANSIT",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
      ].includes(delivery.status),
    });
  }

  if (
    ["PACKAGED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"].includes(
      delivery.status
    )
  ) {
    timeline.push({
      status: "PACKAGED",
      title: "Packaged",
      description: "Your medication has been packaged securely",
      timestamp: delivery.updatedAt,
      completed: true,
    });
  }

  if (
    ["IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"].includes(delivery.status)
  ) {
    timeline.push({
      status: "IN_TRANSIT",
      title: "In Transit",
      description: "Your package is on its way to the delivery location",
      timestamp: delivery.updatedAt,
      completed: true,
    });
  }

  if (["OUT_FOR_DELIVERY", "DELIVERED"].includes(delivery.status)) {
    timeline.push({
      status: "OUT_FOR_DELIVERY",
      title: "Out for Delivery",
      description: "Your package is out for delivery",
      timestamp: delivery.updatedAt,
      completed: true,
    });
  }

  if (delivery.status === "DELIVERED") {
    timeline.push({
      status: "DELIVERED",
      title: "Delivered",
      description: "Your package has been delivered successfully",
      timestamp: delivery.actualDelivery || delivery.updatedAt,
      completed: true,
    });
  }

  return timeline;
}
