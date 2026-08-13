import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/app/auth";

// GET - deliveries relevant to the signed-in courier: the ones already
// assigned to them, plus an open pool of packaged-but-unclaimed deliveries
// they can pick up. Couriers self-assign from this pool (see claim/route.ts)
// rather than being dispatched by a pharmacist.
export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "COURIER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const select = {
    id: true,
    trackingNumber: true,
    status: true,
    address: true,
    city: true,
    state: true,
    zipCode: true,
    dropPoint: true,
    estimatedDelivery: true,
    createdAt: true,
  } as const;

  const [assigned, available] = await Promise.all([
    prisma.delivery.findMany({
      where: { courierId: session.user.id, status: { notIn: ["DELIVERED", "CANCELLED"] } },
      orderBy: { createdAt: "desc" },
      select,
    }),
    prisma.delivery.findMany({
      where: {
        courierId: null,
        status: { in: ["PACKAGED", "IN_TRANSIT", "OUT_FOR_DELIVERY"] },
      },
      orderBy: { createdAt: "asc" },
      select,
    }),
  ]);

  return NextResponse.json({ assigned, available });
}
