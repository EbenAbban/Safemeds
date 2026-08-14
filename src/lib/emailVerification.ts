import { prisma } from "@/lib/prisma";
import { generateOtp, hashOtp, verifyOtp, normalizeOtp } from "@/lib/otp";

/** How long an emailed code stays usable. */
export const VERIFICATION_TTL_MS = 30 * 60 * 1000;

/**
 * Wrong guesses tolerated before the code is burned.
 *
 * Six digits are guessable, so this cap is what makes them safe: without it,
 * 200,000 attempts would exhaust the space. The delivery OTP is capped for the
 * same reason.
 */
export const MAX_ATTEMPTS = 5;

/**
 * Issues a fresh code, invalidating any earlier unused one so a code from a
 * previous email stops working the moment a new one is requested.
 */
export async function createVerificationCode(userId: string): Promise<string> {
  const code = generateOtp();

  await prisma.emailVerificationToken.updateMany({
    where: { userId, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  await prisma.emailVerificationToken.create({
    data: {
      userId,
      codeHash: await hashOtp(code),
      expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS),
    },
  });

  return code;
}

export type VerificationResult =
  | { status: "verified"; email: string }
  | { status: "already-verified" }
  | { status: "expired" }
  | { status: "too-many-attempts" }
  | { status: "invalid" };

/**
 * Checks a code against the newest outstanding one for an address.
 *
 * Lookup is by user rather than by hash: bcrypt is salted, so the stored hash
 * cannot be searched for. `already-verified` is reported separately from
 * `invalid` because entering a code for an address that is already confirmed
 * is not a failure and should not be presented as one.
 */
export async function verifyEmailCode(
  email: string,
  rawCode: string
): Promise<VerificationResult> {
  const code = normalizeOtp(rawCode);
  if (!code) return { status: "invalid" };

  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true, email: true, emailVerifiedAt: true },
  });
  if (!user) return { status: "invalid" };
  if (user.emailVerifiedAt) return { status: "already-verified" };

  const row = await prisma.emailVerificationToken.findFirst({
    where: { userId: user.id, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!row) return { status: "invalid" };
  if (row.expiresAt < new Date()) return { status: "expired" };
  if (row.attempts >= MAX_ATTEMPTS) return { status: "too-many-attempts" };

  if (!(await verifyOtp(code, row.codeHash))) {
    // Count the miss before returning, so the budget cannot be sidestepped by
    // abandoning the request.
    await prisma.emailVerificationToken.update({
      where: { id: row.id },
      data: { attempts: { increment: 1 } },
    });
    return { status: "invalid" };
  }

  await prisma.$transaction([
    prisma.emailVerificationToken.update({
      where: { id: row.id },
      data: { consumedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() },
    }),
  ]);

  return { status: "verified", email: user.email };
}
