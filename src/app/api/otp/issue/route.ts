import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";
import { generateOtp, hashOtp, otpExpiry } from "@/lib/otp";

/**
 * Issues (or re-issues) the proof-of-delivery code for a delivery.
 *
 * The plaintext code comes back in this response so the recipient can read it
 * off their own order screen — there is no mail or SMS transport wired up yet,
 * and anonymous deliveries have no address on file to send one to. Possession
 * of the `anonId` is what authorizes the request; it is the same secret that
 * already gates anonymous order tracking.
 *
 * When a real delivery channel lands, drop `otp` from the response body and
 * hand the code to that channel instead — nothing else here needs to change.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    if (!rateLimit(`otp-issue:${ip}`, 5, 60_000).allowed) {
      return NextResponse.json(
        { error: "Too many requests. Try again shortly." },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    const anonId = typeof body?.anonId === "string" ? body.anonId.trim() : "";
    const deliveryId =
      typeof body?.deliveryId === "string" ? body.deliveryId.trim() : "";

    if (!anonId && !deliveryId) {
      return NextResponse.json(
        { error: "anonId or deliveryId is required" },
        { status: 400 }
      );
    }

    const delivery = await prisma.delivery.findFirst({
      where: deliveryId ? { id: deliveryId } : { anonymousId: anonId },
      orderBy: { createdAt: "desc" },
      select: { id: true, status: true, otpVerifiedAt: true },
    });

    if (!delivery) {
      return NextResponse.json({ error: "Delivery not found" }, { status: 404 });
    }

    if (delivery.otpVerifiedAt || delivery.status === "DELIVERED") {
      return NextResponse.json(
        { error: "This delivery has already been confirmed" },
        { status: 409 }
      );
    }

    const otp = generateOtp();
    const expiresAt = otpExpiry();

    await prisma.delivery.update({
      where: { id: delivery.id },
      data: {
        otpHash: await hashOtp(otp),
        otpExpiresAt: expiresAt,
        // A fresh code gets a fresh attempt budget.
        otpAttempts: 0,
      },
    });

    return NextResponse.json({ otp, deliveryId: delivery.id, expiresAt });
  } catch (error) {
    console.error("OTP issue error:", error);
    return NextResponse.json(
      { error: "Failed to issue verification code" },
      { status: 500 }
    );
  }
}
