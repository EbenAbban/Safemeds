import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/app/auth";

// GET - Fetch orders with comprehensive details
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const paymentStatus = searchParams.get("paymentStatus");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    // Filter by user role
    if (session.user.role === "CLIENT") {
      where.userId = session.user.id;
    } else if (session.user.role === "PHARMACY") {
      where.prescription = {
        consultation: {
          assignedPharmacistId: session.user.id,
        },
      };
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        prescription: {
          include: {
            medication: {
              select: {
                id: true,
                name: true,
                genericName: true,
                dosageForm: true,
                strength: true,
                manufacturer: true,
                price: true,
              },
            },
            consultation: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
                assignedPharmacist: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        delivery: {
          select: {
            id: true,
            status: true,
            trackingNumber: true,
            estimatedDelivery: true,
            actualDelivery: true,
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
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const total = await prisma.order.count({ where });

    // Get order statistics
    const stats = await prisma.order.aggregate({
      where: {
        ...where,
        status: {
          in: [
            "CONFIRMED",
            "PROCESSING",
            "READY_FOR_PICKUP",
            "SHIPPED",
            "DELIVERED",
          ],
        },
        paymentStatus: "PAID",
      },
      _count: {
        id: true,
      },
      _sum: {
        totalAmount: true,
      },
      _avg: {
        totalAmount: true,
      },
    });

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      statistics: {
        totalOrders: stats._count.id,
        totalRevenue: stats._sum.totalAmount,
        averageOrderValue: stats._avg.totalAmount,
      },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// POST - Create new order from prescription
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      prescriptionId,
      userId,
      anonymousId,
      paymentMethod = "CASH",
      specialInstructions,
      isAnonymous = false,
    } = body;

    // Validate required fields
    if (!prescriptionId) {
      return NextResponse.json(
        { error: "Prescription ID is required" },
        { status: 400 }
      );
    }

    // Check if prescription exists and is approved
    const prescription = await prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        medication: true,
        consultation: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!prescription) {
      return NextResponse.json(
        { error: "Prescription not found" },
        { status: 404 }
      );
    }

    if (prescription.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Prescription must be approved before creating an order" },
        { status: 400 }
      );
    }

    // Check if user has access to this prescription
    if (
      session.user.role === "CLIENT" &&
      prescription.userId !== session.user.id
    ) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Calculate total amount
    const totalAmount = Number(prescription.medication.price) * prescription.quantity;

    // Generate order number
    const { randomUUID } = await import("crypto");
    const orderNumber = `ORD-${Date.now()}-${randomUUID().slice(0, 7).toUpperCase()}`;

    // Create order
    const order = await prisma.order.create({
      data: {
        prescriptionId,
        userId: userId || prescription.userId,
        anonymousId: anonymousId || prescription.anonymousId,
        orderNumber,
        status: "PENDING",
        totalAmount,
        paymentStatus: "PENDING",
        paymentMethod,
        specialInstructions,
        isAnonymous: isAnonymous || prescription.isAnonymous,
      },
      include: {
        prescription: {
          include: {
            medication: true,
            consultation: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Create the delivery record for this order so it enters the tracking
    // pipeline. Non-fatal: if it fails, the order still succeeds.
    try {
      const trackingNumber = `TRK-${Date.now().toString().slice(-6)}-${randomUUID()
        .slice(0, 4)
        .toUpperCase()}`;
      await prisma.delivery.create({
        data: {
          userId: order.userId,
          anonymousId: order.anonymousId,
          orderId: order.id,
          status: "ORDER_CONFIRMED",
          trackingNumber,
          address: body.address || "",
          city: body.city || "",
          state: body.state || "",
          zipCode: body.zipCode || "",
          dropPoint: body.dropPoint || "Campus Library - North Entrance",
          dropLat: body.dropLat ?? null,
          dropLng: body.dropLng ?? null,
          isAnonymous: order.isAnonymous,
          estimatedDelivery: new Date(Date.now() + 2 * 60 * 60 * 1000),
        },
      });
    } catch (deliveryError) {
      console.error("Order created but delivery creation failed:", deliveryError);
    }

    return NextResponse.json({
      order,
      message: "Order created successfully",
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
