import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/app/auth";

// GET - Fetch specific consultation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const consultation = await prisma.consultation.findUnique({
      where: { id },
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
        messages: {
          orderBy: { createdAt: "asc" },
        },
        prescriptions: {
          include: {
            medication: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!consultation) {
      return NextResponse.json(
        { error: "Consultation not found" },
        { status: 404 }
      );
    }

    // Verify access
    if (session.user.role === "CLIENT" && consultation.userId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    if (session.user.role === "PHARMACY" && consultation.assignedPharmacistId && consultation.assignedPharmacistId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ consultation });
  } catch (error) {
    console.error("Error fetching consultation:", error);
    return NextResponse.json(
      { error: "Failed to fetch consultation" },
      { status: 500 }
    );
  }
}

// PUT - Update consultation (assign pharmacist, update status, etc.)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      status,
      assignedPharmacistId,
      description,
      symptoms,
      medications,
      allergies,
    } = body;

    // Check if consultation exists
    const existingConsultation = await prisma.consultation.findUnique({
      where: { id },
    });

    if (!existingConsultation) {
      return NextResponse.json(
        { error: "Consultation not found" },
        { status: 404 }
      );
    }

    // Verify access - PHARMACY can only update their assigned consultations
    if (session.user.role === "PHARMACY") {
      if (existingConsultation.assignedPharmacistId && existingConsultation.assignedPharmacistId !== session.user.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
      if (assignedPharmacistId && assignedPharmacistId !== session.user.id) {
        return NextResponse.json({ error: "Cannot reassign to another pharmacist" }, { status: 403 });
      }
    }
    if (session.user.role === "CLIENT" && existingConsultation.userId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Update consultation
    const updatedConsultation = await prisma.consultation.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(assignedPharmacistId && { assignedPharmacistId }),
        ...(description && { description }),
        ...(symptoms && { symptoms }),
        ...(medications && { medications }),
        ...(allergies && { allergies }),
      },
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
        messages: {
          orderBy: { createdAt: "asc" },
        },
        prescriptions: {
          include: {
            medication: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json({
      consultation: updatedConsultation,
      message: "Consultation updated successfully",
    });
  } catch (error) {
    console.error("Error updating consultation:", error);
    return NextResponse.json(
      { error: "Failed to update consultation" },
      { status: 500 }
    );
  }
}

// DELETE - Delete consultation (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.consultation.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Consultation deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting consultation:", error);
    return NextResponse.json(
      { error: "Failed to delete consultation" },
      { status: 500 }
    );
  }
}
