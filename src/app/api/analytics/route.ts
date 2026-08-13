import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/app/auth";

// GET - Fetch pharmacy analytics
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || !["ADMIN", "PHARMACY"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30"; // days
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Calculate date range
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(end.getTime() - parseInt(period) * 24 * 60 * 60 * 1000);

    // Build date filter
    const dateFilter = {
      createdAt: {
        gte: start,
        lte: end,
      },
    };

    // Sales Analytics
    const salesData$ = prisma.order.aggregate({
      where: {
        ...dateFilter,
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

    // Daily sales for chart
    const dailySales$ = prisma.order.groupBy({
      by: ["createdAt"],
      where: {
        ...dateFilter,
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
      _sum: {
        totalAmount: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Consultation Analytics
    const consultationStats$ = prisma.consultation.aggregate({
      where: {
        ...dateFilter,
        assignedPharmacistId:
          session.user.role === "PHARMACY" ? session.user.id : undefined,
      },
      _count: {
        id: true,
      },
    });

    const consultationStatusBreakdown$ = prisma.consultation.groupBy({
      by: ["status"],
      where: {
        ...dateFilter,
        assignedPharmacistId:
          session.user.role === "PHARMACY" ? session.user.id : undefined,
      },
      _count: {
        id: true,
      },
    });

    // Prescription Analytics
    const prescriptionStats$ = prisma.prescription.aggregate({
      where: {
        ...dateFilter,
        consultation:
          session.user.role === "PHARMACY"
            ? {
                assignedPharmacistId: session.user.id,
              }
            : undefined,
      },
      _count: {
        id: true,
      },
    });

    const prescriptionStatusBreakdown$ = prisma.prescription.groupBy({
      by: ["status"],
      where: {
        ...dateFilter,
        consultation:
          session.user.role === "PHARMACY"
            ? {
                assignedPharmacistId: session.user.id,
              }
            : undefined,
      },
      _count: {
        id: true,
      },
    });

    // Inventory Analytics
    const inventoryStats$ = prisma.inventoryItem.aggregate({
      where: {
        pharmacyId: session.user.id,
        isActive: true,
      },
      _count: {
        id: true,
      },
      _sum: {
        quantity: true,
      },
    });

    const lowStockItems$ = prisma.inventoryItem.count({
      where: {
        pharmacyId: session.user.id,
        isActive: true,
        quantity: {
          lte: 10,
        },
      },
    });

    const expiringItems$ = prisma.inventoryItem.count({
      where: {
        pharmacyId: session.user.id,
        isActive: true,
        expirationDate: {
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      },
    });

    // Top Medications
    const topMedications$ = prisma.prescription.groupBy({
      by: ["medicationId"],
      where: {
        ...dateFilter,
        consultation:
          session.user.role === "PHARMACY"
            ? {
                assignedPharmacistId: session.user.id,
              }
            : undefined,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 10,
    });

    // Anonymous vs Authenticated Users
    const anonymousStats$ = prisma.consultation.aggregate({
      where: {
        ...dateFilter,
        isAnonymous: true,
        assignedPharmacistId:
          session.user.role === "PHARMACY" ? session.user.id : undefined,
      },
      _count: {
        id: true,
      },
    });

    const authenticatedStats$ = prisma.consultation.aggregate({
      where: {
        ...dateFilter,
        isAnonymous: false,
        assignedPharmacistId:
          session.user.role === "PHARMACY" ? session.user.id : undefined,
      },
      _count: {
        id: true,
      },
    });

    // All twelve queries above are independent, so they are issued together
    // rather than awaited one at a time. Sequentially this route paid twelve
    // round trips to a pooled remote database before it could send a byte.
    const [
      salesData,
      dailySales,
      consultationStats,
      consultationStatusBreakdown,
      prescriptionStats,
      prescriptionStatusBreakdown,
      inventoryStats,
      lowStockItems,
      expiringItems,
      topMedications,
      anonymousStats,
      authenticatedStats,
    ] = await Promise.all([
      salesData$,
      dailySales$,
      consultationStats$,
      consultationStatusBreakdown$,
      prescriptionStats$,
      prescriptionStatusBreakdown$,
      inventoryStats$,
      lowStockItems$,
      expiringItems$,
      topMedications$,
      anonymousStats$,
      authenticatedStats$,
    ]);

    // Medication details for the top medications.
    //
    // Previously a findUnique per row inside Promise.all — a textbook N+1
    // issuing ten queries for ten medications. One findMany with an `in`
    // filter returns the same data in a single query.
    const medications = await prisma.medication.findMany({
      where: { id: { in: topMedications.map((m) => m.medicationId) } },
      select: { id: true, name: true, genericName: true, dosageForm: true, strength: true },
    });
    const medicationById = new Map(medications.map((m) => [m.id, m]));
    const topMedicationsWithDetails = topMedications.map((med) => ({
      ...med,
      // Preserve the previous shape: an unmatched id yielded null, not undefined.
      medication: medicationById.get(med.medicationId) ?? null,
    }));

    return NextResponse.json({
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
        days: Math.ceil(
          (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
        ),
      },
      sales: {
        totalOrders: salesData._count.id,
        totalRevenue: salesData._sum.totalAmount,
        averageOrderValue: salesData._avg.totalAmount,
        dailySales: dailySales.map((day) => ({
          date: day.createdAt.toISOString().split("T")[0],
          revenue: day._sum.totalAmount,
          orders: day._count.id,
        })),
      },
      consultations: {
        total: consultationStats._count.id,
        statusBreakdown: consultationStatusBreakdown.map((status) => ({
          status: status.status,
          count: status._count.id,
        })),
      },
      prescriptions: {
        total: prescriptionStats._count.id,
        statusBreakdown: prescriptionStatusBreakdown.map((status) => ({
          status: status.status,
          count: status._count.id,
        })),
      },
      inventory: {
        totalItems: inventoryStats._count.id,
        totalQuantity: inventoryStats._sum.quantity,
        lowStockItems,
        expiringItems,
      },
      topMedications: topMedicationsWithDetails,
      userTypes: {
        anonymous: anonymousStats._count.id,
        authenticated: authenticatedStats._count.id,
        total: anonymousStats._count.id + authenticatedStats._count.id,
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
