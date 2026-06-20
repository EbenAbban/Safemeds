import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/prisma-client";
import { auth } from "@/app/auth";

// GET - Fetch pharmacy inventory with statistics
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || !["ADMIN", "PHARMACY"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const lowStock = searchParams.get("lowStock");
    const expiring = searchParams.get("expiring");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.InventoryItemWhereInput = {
      pharmacyId: session.user.id,
      isActive: true,
    };

    if (search) {
      where.medication = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { genericName: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    if (lowStock === "true") {
      where.quantity = {
        lte: 10,
      };
    }

    if (expiring === "true") {
      where.expirationDate = {
        lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      };
    }

    const inventoryItems = await prisma.inventoryItem.findMany({
      where,
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
            isPrescription: true,
            isControlled: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
    });

    const total = await prisma.inventoryItem.count({ where });

    // Get inventory statistics
    const stats = await prisma.inventoryItem.aggregate({
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

    const lowStockCount = await prisma.inventoryItem.count({
      where: {
        pharmacyId: session.user.id,
        isActive: true,
        quantity: {
          lte: 10,
        },
      },
    });

    const expiringCount = await prisma.inventoryItem.count({
      where: {
        pharmacyId: session.user.id,
        isActive: true,
        expirationDate: {
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    });

    return NextResponse.json({
      inventoryItems,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      statistics: {
        totalItems: stats._count.id,
        totalQuantity: stats._sum.quantity,
        lowStockItems: lowStockCount,
        expiringItems: expiringCount,
      },
    });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}

// POST - Add medication to pharmacy inventory
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || !["ADMIN", "PHARMACY"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      medicationId,
      quantity,
      minQuantity = 10,
      maxQuantity = 1000,
      lotNumber,
      expirationDate,
      location,
    } = body;

    // Validate required fields
    if (!medicationId || !quantity) {
      return NextResponse.json(
        { error: "Medication ID and quantity are required" },
        { status: 400 }
      );
    }

    // Check if medication exists
    const medication = await prisma.medication.findUnique({
      where: { id: medicationId },
    });

    if (!medication) {
      return NextResponse.json(
        { error: "Medication not found" },
        { status: 404 }
      );
    }

    // Check if inventory item already exists
    const existingItem = await prisma.inventoryItem.findUnique({
      where: {
        medicationId_pharmacyId: {
          medicationId,
          pharmacyId: session.user.id,
        },
      },
    });

    let inventoryItem;

    if (existingItem) {
      // Update existing inventory item
      inventoryItem = await prisma.inventoryItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + parseInt(quantity),
          minQuantity: parseInt(minQuantity),
          maxQuantity: parseInt(maxQuantity),
          lotNumber: lotNumber || existingItem.lotNumber,
          expirationDate: expirationDate
            ? new Date(expirationDate)
            : existingItem.expirationDate,
          location: location || existingItem.location,
        },
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
        },
      });
    } else {
      // Create new inventory item
      inventoryItem = await prisma.inventoryItem.create({
        data: {
          medicationId,
          pharmacyId: session.user.id,
          quantity: parseInt(quantity),
          minQuantity: parseInt(minQuantity),
          maxQuantity: parseInt(maxQuantity),
          lotNumber,
          expirationDate: expirationDate ? new Date(expirationDate) : null,
          location,
        },
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
        },
      });
    }

    return NextResponse.json({
      inventoryItem,
      message: "Inventory updated successfully",
    });
  } catch (error) {
    console.error("Error updating inventory:", error);
    return NextResponse.json(
      { error: "Failed to update inventory" },
      { status: 500 }
    );
  }
}
