import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";
import { normalizeOtp, verifyOtp, OTP_MAX_ATTEMPTS } from "@/lib/otp";

/**
 * Confirms a delivery handoff with the recipient's one-time code.
 *
 * The client (src/app/verify/page.jsx) posts `{ otp, anonId }`; `deliveryId` is
 * accepted too for signed-in recipients who don't carry an anonymous id.
 *
 * Failures deliberately return a single generic message. Distinguishing "no
 * such delivery" from "wrong code" would let anyone enumerate which anonymous
 * ids have a live delivery attached.
 */
export async function POST(request: NextRequest) {
  const invalid = () =>
    NextResponse.json(
      { verified: false, error: "Invalid or expired code" },
      { status: 400 }
    );

  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    if (!rateLimit(`otp-verify:${ip}`, 10, 60_000).allowed) {
      return NextResponse.json(
        { verified: false, error: "Too many attempts. Try again shortly." },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) return invalid();

    const otp = normalizeOtp(body.otp);
    const anonId = typeof body.anonId === "string" ? body.anonId.trim() : "";
    const deliveryId =
      typeof body.deliveryId === "string" ? body.deliveryId.trim() : "";

    if (!otp || (!anonId && !deliveryId)) return invalid();

    const delivery = await prisma.delivery.findFirst({
      where: deliveryId ? { id: deliveryId } : { anonymousId: anonId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        otpHash: true,
        otpExpiresAt: true,
        otpAttempts: true,
        otpVerifiedAt: true,
      },
    });

    if (!delivery) return invalid();

    // Already confirmed — treat as success so a double-tap on the Verify
    // button doesn't read as a failure to the recipient.
    //
    // This MUST come before the otpHash check below: a successful verification
    // nulls otpHash to burn the code, so testing the hash first would send
    // every replay down the failure path and report "invalid code" to someone
    // whose delivery was in fact confirmed. Ordering matters here.
    if (delivery.otpVerifiedAt) {
      return NextResponse.json({
        verified: true,
        deliveryId: delivery.id,
        verifiedAt: delivery.otpVerifiedAt,
      });
    }

    if (!delivery.otpHash || !delivery.otpExpiresAt) return invalid();

    if (delivery.otpExpiresAt < new Date()) return invalid();

    if (delivery.otpAttempts >= OTP_MAX_ATTEMPTS) {
      return NextResponse.json(
        {
          verified: false,
          error: "Too many incorrect attempts. Request a new code.",
        },
        { status: 429 }
      );
    }

    if (!(await verifyOtp(otp, delivery.otpHash))) {
      // Count the miss before returning, so the budget can't be sidestepped by
      // abandoning the request.
      await prisma.delivery.update({
        where: { id: delivery.id },
        data: { otpAttempts: { increment: 1 } },
      });
      return invalid();
    }

    const verifiedAt = new Date();
    await prisma.delivery.update({
      where: { id: delivery.id },
      data: {
        otpVerifiedAt: verifiedAt,
        // Burn the code: a confirmed handoff must not be re-confirmable.
        otpHash: null,
        otpExpiresAt: null,
        otpAttempts: 0,
        status: "DELIVERED",
        actualDelivery: verifiedAt,
      },
    });

    return NextResponse.json({
      verified: true,
      deliveryId: delivery.id,
      verifiedAt,
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    return NextResponse.json(
      { verified: false, error: "Verification failed" },
      { status: 500 }
    );
  }
}
