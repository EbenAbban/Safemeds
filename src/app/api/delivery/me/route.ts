import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/app/auth";

// GET - the authenticated user's most recent delivery (real DB record),
// with order + prescription + medication context for the tracking page.
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const delivery = await prisma.delivery.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        order: {
          include: {
            prescription: {
              include: {
                medication: {
                  select: { name: true, strength: true, dosageForm: true },
                },
              },
            },
          },
        },
      },
    });

    if (!delivery) {
      return NextResponse.json({ delivery: null });
    }

    return NextResponse.json({ delivery });
  } catch (error) {
    console.error("Error fetching delivery:", error);
    return NextResponse.json(
      { error: "Failed to fetch delivery" },
      { status: 500 }
    );
  }
}
