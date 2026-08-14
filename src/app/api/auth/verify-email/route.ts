import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";
import { createVerificationCode, verifyEmailCode } from "@/lib/emailVerification";
import { isEmailConfigured, sendVerificationCodeEmail, sendWelcomeEmail } from "@/lib/email";

export const runtime = "nodejs";

/**
 * POST { email, code }   — confirm an address.
 * POST { email }         — send a fresh code.
 *
 * The resend branch answers identically whether the address exists, is already
 * verified, or is unknown. Anything else turns this into an oracle for which
 * emails hold SafeMeds accounts, which on a health product is worth not
 * leaking.
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const code = typeof body?.code === "string" ? body.code : "";

  if (!email) {
    return NextResponse.json({ error: "Email address is required." }, { status: 400 });
  }

  // ---- Confirm a code -----------------------------------------------------
  if (code) {
    if (!rateLimit(`verify-code:${ip}`, 10, 60_000).allowed) {
      return NextResponse.json(
        { status: "rate-limited", error: "Too many attempts. Try again shortly." },
        { status: 429 }
      );
    }

    const result = await verifyEmailCode(email, code);

    if (result.status === "verified") {
      // Welcome mail is best-effort: a confirmed address must not be undone
      // because a second, non-essential email failed to send.
      if (isEmailConfigured()) {
        try {
          const user = await prisma.user.findUnique({
            where: { email },
            select: { firstName: true },
          });
          if (user) await sendWelcomeEmail({ to: email, firstName: user.firstName });
        } catch (error) {
          console.error("Welcome email failed to send:", error);
        }
      }
      return NextResponse.json({ status: "verified" });
    }

    const messages: Record<string, string> = {
      "already-verified": "This address is already confirmed. You can sign in.",
      expired: "That code has expired. Request a new one.",
      "too-many-attempts": "Too many incorrect attempts. Request a new code.",
      invalid: "That code is not correct.",
    };
    return NextResponse.json(
      { status: result.status, error: messages[result.status] ?? "That code is not correct." },
      { status: result.status === "already-verified" ? 200 : 400 }
    );
  }

  // ---- Send a fresh code --------------------------------------------------
  if (!rateLimit(`verify-send:${ip}`, 3, 60_000).allowed) {
    return NextResponse.json(
      { error: "Too many requests. Try again shortly." },
      { status: 429 }
    );
  }

  const generic = NextResponse.json({
    status: "sent",
    message: "If that address needs confirming, a code is on its way.",
  });

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, firstName: true, emailVerifiedAt: true },
    });
    if (!user || user.emailVerifiedAt || !isEmailConfigured()) return generic;

    const freshCode = await createVerificationCode(user.id);
    await sendVerificationCodeEmail({
      to: user.email,
      firstName: user.firstName,
      code: freshCode,
    });
  } catch (error) {
    // Logged, never surfaced — the response must not vary with the outcome.
    console.error("Verification code send failed:", error);
  }

  return generic;
}
