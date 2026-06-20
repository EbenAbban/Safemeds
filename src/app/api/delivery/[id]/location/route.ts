import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/app/auth";

// Live courier location for a delivery, backed by Postgres (no Firebase needed).
//
//   POST /api/delivery/[id]/location   -> courier (PHARMACY/ADMIN) pushes a GPS fix
//   GET  /api/delivery/[id]/location   -> tracking map reads the latest fix
//
// The courier device calls POST repeatedly from /deliver/[id]; the student's
// DeliveryMap polls GET. updatedAt is returned as epoch-ms so the client can
// show "LIVE" vs "last seen Ns ago".

// Courier pushes a position fix (or flips sharing off).
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (
    !session?.user ||
    (session.user.role !== "PHARMACY" && session.user.role !== "ADMIN")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: {
    lat?: number;
    lng?: number;
    accuracy?: number | null;
    heading?: number | null;
    speed?: number | null;
    active?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { lat, lng, accuracy, heading, speed, active } = body;

  // Always update the sharing flag + timestamp; update coordinates only when a
  // valid fix is supplied (a "stop sharing" call sends just { active: false }).
  const data: Record<string, unknown> = {
    courierActive: active !== false,
    courierUpdatedAt: new Date(),
  };
  if (typeof lat === "number" && typeof lng === "number") {
    data.courierLat = lat;
    data.courierLng = lng;
    data.courierAccuracy = typeof accuracy === "number" ? accuracy : null;
    data.courierHeading = typeof heading === "number" ? heading : null;
    data.courierSpeed = typeof speed === "number" ? speed : null;
  }

  try {
    await prisma.delivery.update({ where: { id }, data });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Delivery not found" }, { status: 404 });
  }
}

// Tracking map reads the latest courier fix.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const delivery = await prisma.delivery.findUnique({
    where: { id },
    select: {
      courierLat: true,
      courierLng: true,
      courierAccuracy: true,
      courierHeading: true,
      courierSpeed: true,
      courierActive: true,
      courierUpdatedAt: true,
      dropLat: true,
      dropLng: true,
    },
  });

  if (!delivery) {
    return NextResponse.json({ error: "Delivery not found" }, { status: 404 });
  }

  const hasFix =
    delivery.courierLat != null && delivery.courierLng != null;

  return NextResponse.json({
    location: hasFix
      ? {
          lat: delivery.courierLat,
          lng: delivery.courierLng,
          accuracy: delivery.courierAccuracy,
          heading: delivery.courierHeading,
          speed: delivery.courierSpeed,
          active: delivery.courierActive,
          updatedAt: delivery.courierUpdatedAt
            ? delivery.courierUpdatedAt.getTime()
            : null,
        }
      : null,
    drop:
      delivery.dropLat != null && delivery.dropLng != null
        ? { lat: delivery.dropLat, lng: delivery.dropLng }
        : null,
  });
}
