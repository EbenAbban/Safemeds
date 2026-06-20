import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/prisma-client";
import { auth } from "@/app/auth";

// GET - Fetch medications with inventory
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const isPrescription = searchParams.get("isPrescription");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.MedicationWhereInput = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { genericName: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (isPrescription !== null) {
      where.isPrescription = isPrescription === "true";
    }

    const medications = await prisma.medication.findMany({
      where,
      include: {
        inventoryItems: {
          where: {
            pharmacyId: session.user.id,
            isActive: true,
          },
          include: {
            medication: true,
          },
        },
        _count: {
          select: {
            prescriptions: true,
          },
        },
      },
      orderBy: { name: "asc" },
      skip,
      take: limit,
    });

    const total = await prisma.medication.count({ where });

    return NextResponse.json({
      medications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching medications:", error);
    return NextResponse.json(
      { error: "Failed to fetch medications" },
      { status: 500 }
    );
  }
}

// POST - Create new medication (admin/pharmacy only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || !["ADMIN", "PHARMACY"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      genericName,
      description,
      dosageForm,
      strength,
      manufacturer,
      isPrescription = true,
      isControlled = false,
      requiresLicense = false,
      sideEffects,
      interactions,
      contraindications,
      price,
    } = body;

    // Validate required fields
    if (!name || !dosageForm || !strength || !manufacturer || !price) {
      return NextResponse.json(
        {
          error:
            "Name, dosage form, strength, manufacturer, and price are required",
        },
        { status: 400 }
      );
    }

    const medication = await prisma.medication.create({
      data: {
        name,
        genericName,
        description,
        dosageForm,
        strength,
        manufacturer,
        isPrescription,
        isControlled,
        requiresLicense,
        sideEffects,
        interactions,
        contraindications,
        price: parseFloat(price),
      },
    });

    return NextResponse.json({
      medication,
      message: "Medication created successfully",
    });
  } catch (error) {
    console.error("Error creating medication:", error);
    return NextResponse.json(
      { error: "Failed to create medication" },
      { status: 500 }
    );
  }
}
