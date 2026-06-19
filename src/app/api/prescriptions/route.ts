import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/app/auth";

// GET - Fetch prescriptions with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const consultationId = searchParams.get("consultationId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (consultationId) {
      where.consultationId = consultationId;
    }

    // Filter by user role
    if (session.user.role === "CLIENT") {
      where.userId = session.user.id;
    } else if (session.user.role === "PHARMACY") {
      where.consultation = {
        assignedPharmacistId: session.user.id,
      };
    }

    const prescriptions = await prisma.prescription.findMany({
      where,
      include: {
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
        medication: {
          select: {
            id: true,
            name: true,
            genericName: true,
            dosageForm: true,
            strength: true,
            manufacturer: true,
            price: true,
            isControlled: true,
          },
        },
        orders: {
          include: {
            delivery: {
              select: {
                id: true,
                status: true,
                trackingNumber: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const total = await prisma.prescription.count({ where });

    return NextResponse.json({
      prescriptions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch prescriptions" },
      { status: 500 }
    );
  }
}

// POST - Create new prescription
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || !["ADMIN", "PHARMACY"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      consultationId,
      userId,
      anonymousId,
      medicationId,
      prescribedBy,
      dosage,
      frequency,
      duration,
      quantity,
      refills = 0,
      instructions,
      isAnonymous = false,
    } = body;

    // Validate required fields
    if (
      !medicationId ||
      !prescribedBy ||
      !dosage ||
      !frequency ||
      !duration ||
      !quantity
    ) {
      return NextResponse.json(
        {
          error:
            "Medication ID, prescribed by, dosage, frequency, duration, and quantity are required",
        },
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

    // Check if consultation exists (if provided)
    if (consultationId) {
      const consultation = await prisma.consultation.findUnique({
        where: { id: consultationId },
      });

      if (!consultation) {
        return NextResponse.json(
          { error: "Consultation not found" },
          { status: 404 }
        );
      }
    }

    const prescription = await prisma.prescription.create({
      data: {
        consultationId,
        userId,
        anonymousId,
        medicationId,
        prescribedBy,
        dosage,
        frequency,
        duration,
        quantity: parseInt(quantity),
        refills: parseInt(refills),
        instructions,
        isAnonymous,
        status: "PENDING",
      },
      include: {
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

    return NextResponse.json({
      prescription,
      message: "Prescription created successfully",
    });
  } catch (error) {
    console.error("Error creating prescription:", error);
    return NextResponse.json(
      { error: "Failed to create prescription" },
      { status: 500 }
    );
  }
}
