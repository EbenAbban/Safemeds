import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";
import { consumeVerificationToken, createVerificationToken } from "@/lib/emailVerification";
import { isEmailConfigured, sendVerificationEmail } from "@/lib/email";

export const runtime = "nodejs";

/**
 * GET  — the emailed link lands here, then redirects to /verify-email with the
 *        outcome. Redirecting rather than rendering JSON means the token never
 *        stays in the address bar of a page the user might share or bookmark.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const result = await consumeVerificationToken(token);
  const url = new URL("/verify-email", request.url);
  url.searchParams.set("status", result.status);
  return NextResponse.redirect(url);
}

/**
 * POST — resend a link.
 *
 * Always answers the same way regardless of whether the address exists or is
 * already verified. Anything else turns this into an oracle for which emails
 * hold SafeMeds accounts, which on a health product is exactly the thing worth
 * not leaking.
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (!rateLimit(`verify-email:${ip}`, 3, 60_000).allowed) {
    return NextResponse.json(
      { error: "Too many requests. Try again shortly." },
      { status: 429 }
    );
  }

  const generic = NextResponse.json({
    message: "If that address needs confirming, a new link is on its way.",
  });

  try {
    const body = await request.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email) return generic;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, firstName: true, emailVerifiedAt: true },
    });
    if (!user || user.emailVerifiedAt || !isEmailConfigured()) return generic;

    const token = await createVerificationToken(user.id);
    await sendVerificationEmail({
      to: user.email,
      firstName: user.firstName,
      verifyUrl: new URL(
        `/api/auth/verify-email?token=${encodeURIComponent(token)}`,
        request.nextUrl.origin
      ).toString(),
    });
  } catch (error) {
    // Logged, not surfaced — the response must not vary with the outcome.
    console.error("Verification resend failed:", error);
  }

  return generic;
}
