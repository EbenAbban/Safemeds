import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/app/auth";

// POST - a courier claims an unassigned, packaged delivery from the open
// pool. Guarded by updateMany's where clause (courierId: null) so two
// couriers racing to claim the same delivery can't both succeed.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "COURIER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const result = await prisma.delivery.updateMany({
    where: {
      id,
      courierId: null,
      status: { in: ["PACKAGED", "IN_TRANSIT", "OUT_FOR_DELIVERY"] },
    },
    data: { courierId: session.user.id },
  });

  if (result.count === 0) {
    return NextResponse.json(
      { error: "This delivery is no longer available to claim." },
      { status: 409 }
    );
  }

  return NextResponse.json({ ok: true });
}
