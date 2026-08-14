import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

/** How long a verification link stays usable. */
export const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * SHA-256 rather than bcrypt, unlike the delivery OTP.
 *
 * The OTP is six digits, so it needs a slow hash to survive brute force. This
 * token is 32 random bytes — guessing it is not a threat model — and the
 * lookup has to find a row by token, which a salted hash cannot do. Hashing at
 * all is still worth it: a leak of this table then reveals nothing usable.
 */
function hash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Issues a fresh link for a user, invalidating any earlier unused one so a
 * previously emailed link stops working once a new one is requested.
 */
export async function createVerificationToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");

  await prisma.emailVerificationToken.updateMany({
    where: { userId, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  await prisma.emailVerificationToken.create({
    data: {
      userId,
      tokenHash: hash(token),
      expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS),
    },
  });

  return token;
}

export type VerificationResult =
  | { status: "verified"; email: string }
  | { status: "already-verified" }
  | { status: "expired" }
  | { status: "invalid" };

/**
 * Consumes a token and stamps the address as verified.
 *
 * `already-verified` is distinguished from `invalid` on purpose: clicking the
 * same link twice, or having it prefetched by a mail client, is not a failure
 * and should not be reported as one.
 */
export async function consumeVerificationToken(token: string): Promise<VerificationResult> {
  if (!token) return { status: "invalid" };

  const row = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: hash(token) },
    include: { user: { select: { id: true, email: true, emailVerifiedAt: true } } },
  });

  if (!row) return { status: "invalid" };
  if (row.user.emailVerifiedAt) return { status: "already-verified" };
  if (row.consumedAt) return { status: "invalid" };
  if (row.expiresAt < new Date()) return { status: "expired" };

  await prisma.$transaction([
    prisma.emailVerificationToken.update({
      where: { id: row.id },
      data: { consumedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: row.userId },
      data: { emailVerifiedAt: new Date() },
    }),
  ]);

  return { status: "verified", email: row.user.email };
}
