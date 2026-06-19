import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/app/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const verifications = await prisma.licenseVerification.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            pharmacyName: true,
          },
        },
      },
    });

    return NextResponse.json({ verifications });
  } catch (error) {
    console.error("Error fetching license verifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch license verifications" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, action, reason } = await request.json();

    if (!id || !action) {
      return NextResponse.json(
        { error: "ID and action are required" },
        { status: 400 }
      );
    }

    if (action === "approve") {
      const verification = await prisma.licenseVerification.update({
        where: { id },
        data: {
          verified: true,
          verifiedBy: session.user.id,
          verifiedAt: new Date(),
        },
      });

      await prisma.user.update({
        where: { id: verification.userId },
        data: { isVerified: true },
      });

      return NextResponse.json({ verification });
    } else if (action === "reject") {
      const verification = await prisma.licenseVerification.update({
        where: { id },
        data: {
          verified: false,
          rejectionReason: reason || null,
          verifiedBy: session.user.id,
          verifiedAt: new Date(),
        },
      });

      await prisma.user.update({
        where: { id: verification.userId },
        data: { isVerified: false },
      });

      return NextResponse.json({ verification });
    } else {
      return NextResponse.json(
        { error: "Action must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error updating license verification:", error);
    return NextResponse.json(
      { error: "Failed to update license verification" },
      { status: 500 }
    );
  }
}
