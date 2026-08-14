import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/app/auth";

export const runtime = "nodejs";

/**
 * PATCH — the student accepts or declines a prescription issued to them.
 *
 * Accepting is what moves it to APPROVED, and POST /api/orders already refuses
 * to raise an order for anything not APPROVED. So this is the gate between "a
 * pharmacist suggested this" and "a package is coming", and it belongs to the
 * student rather than the pharmacy: they are the one choosing to receive
 * medication, and the one who has to be somewhere to collect it.
 *
 * Accepting also takes a drop point. The courier is never told who the student
 * is — only where to go and which package to carry — so the collection point
 * has to be chosen here, by the person who will be standing at it.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const action = body?.action;
    const dropPoint = typeof body?.dropPoint === "string" ? body.dropPoint.trim() : "";

    if (action !== "accept" && action !== "decline") {
      return NextResponse.json(
        { error: "action must be 'accept' or 'decline'" },
        { status: 400 }
      );
    }

    const prescription = await prisma.prescription.findFirst({
      // Scoped to the caller: a prescription belongs to the person it was
      // written for, and nobody else may act on it.
      where: { id, userId: session.user.id },
      include: { medication: { select: { id: true, name: true, price: true } } },
    });

    if (!prescription) {
      return NextResponse.json({ error: "Prescription not found" }, { status: 404 });
    }

    if (prescription.status !== "PENDING") {
      return NextResponse.json(
        { error: `This prescription is already ${prescription.status.toLowerCase()}.` },
        { status: 409 }
      );
    }

    if (action === "decline") {
      await prisma.prescription.update({
        where: { id },
        data: { status: "REJECTED" },
      });
      return NextResponse.json({ status: "REJECTED" });
    }

    if (!dropPoint) {
      return NextResponse.json(
        { error: "Choose a campus drop point for collection." },
        { status: 400 }
      );
    }

    const { randomUUID } = await import("crypto");
    const orderNumber = `ORD-${Date.now()}-${randomUUID().slice(0, 7).toUpperCase()}`;
    // The package code. This is the only thing tying a courier's parcel to the
    // student waiting for it — both sides see this string and nothing else.
    const trackingNumber = `PKG-${randomUUID().slice(0, 8).toUpperCase()}`;
    const totalAmount = Number(prescription.medication.price) * prescription.quantity;

    // One transaction: a prescription marked APPROVED with no delivery behind
    // it would tell the student a package was coming when none exists.
    const [, order, delivery] = await prisma.$transaction([
      prisma.prescription.update({ where: { id }, data: { status: "APPROVED" } }),
      prisma.order.create({
        data: {
          prescriptionId: prescription.id,
          userId: session.user.id,
          orderNumber,
          status: "CONFIRMED",
          totalAmount,
          paymentStatus: "PENDING",
          paymentMethod: "CASH",
        },
      }),
      prisma.delivery.create({
        data: {
          userId: session.user.id,
          trackingNumber,
          status: "PROCESSING",
          dropPoint,
          // No street address: collection is at a campus drop point, and the
          // courier is deliberately not given a home address for a student who
          // may have consulted anonymously.
          address: dropPoint,
          city: "Kumasi",
          state: "Ashanti",
          zipCode: "",
          estimatedDelivery: new Date(Date.now() + 2 * 60 * 60 * 1000),
        },
      }),
    ]);

    await prisma.delivery.update({
      where: { id: delivery.id },
      data: { orderId: order.id },
    });

    return NextResponse.json({
      status: "APPROVED",
      trackingNumber,
      dropPoint,
      estimatedDelivery: delivery.estimatedDelivery,
    });
  } catch (error) {
    console.error("Prescription update failed:", error);
    return NextResponse.json(
      { error: "Could not update this prescription." },
      { status: 500 }
    );
  }
}
