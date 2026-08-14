import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/app/auth";

// GET /api/medications/[id] - one catalog entry.
//
// Added for the "add stock" flow, which arrives holding only a medication id
// (/inventory/add?medicationId=…) and needs to show the pharmacist what they
// are about to stock. Without this the page would have to pull the whole
// paginated catalog and search it client-side, which silently breaks once the
// catalog outgrows one page.
//
// Auth matches the list route: any signed-in user may read the catalog. It
// carries no patient data — only drug facts.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const medication = await prisma.medication.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        genericName: true,
        description: true,
        dosageForm: true,
        strength: true,
        manufacturer: true,
        isPrescription: true,
        isControlled: true,
        requiresLicense: true,
        sideEffects: true,
        interactions: true,
        contraindications: true,
        price: true,
        isActive: true,
      },
    });

    if (!medication) {
      return NextResponse.json({ error: "Medication not found" }, { status: 404 });
    }

    return NextResponse.json({ medication });
  } catch (error) {
    console.error("Error fetching medication:", error);
    return NextResponse.json({ error: "Failed to fetch medication" }, { status: 500 });
  }
}
