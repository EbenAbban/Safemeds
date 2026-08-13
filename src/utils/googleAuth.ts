import { prisma } from "@/lib/prisma";

export interface GoogleProfileFields {
  sub: string;
  email: string;
  given_name?: string;
  family_name?: string;
  name?: string;
}

/**
 * Turns an email local part into a username that satisfies the `@unique`
 * constraint and the 3–50 char rule the credentials login enforces.
 */
async function allocateUsername(email: string): Promise<string> {
  const base =
    email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, "")
      .slice(0, 40) || "user";
  const padded = base.length >= 3 ? base : `${base}user`;

  for (let suffix = 0; suffix < 50; suffix++) {
    const candidate = suffix === 0 ? padded : `${padded}${suffix}`;
    if (!(await prisma.user.findUnique({ where: { username: candidate } }))) {
      return candidate;
    }
  }

  return `${padded}${Date.now().toString().slice(-6)}`;
}

/**
 * Links a verified Google identity to a SafeMeds account, creating one if this
 * is a first sign-in. Returns the fields the JWT callback needs.
 *
 * Matching is by email because that is what SafeMeds treats as the account
 * identifier, and Google has already attested the address by the time this
 * runs (the caller rejects `email_verified === false`).
 */
export async function linkOrCreateGoogleUser(profile: GoogleProfileFields) {
  const email = profile.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        googleId: existing.googleId ?? profile.sub,
        emailVerifiedAt: existing.emailVerifiedAt ?? new Date(),
        // `isVerified` on a PHARMACY account means the pharmacist license has
        // passed admin review — a Google sign-in says nothing about that, so
        // only client accounts get their verification satisfied this way.
        ...(existing.role === "CLIENT" ? { isVerified: true } : {}),
      },
      select: { id: true, username: true, role: true, email: true, firstName: true, lastName: true },
    });
  }

  const [fallbackFirst, ...fallbackRest] = (profile.name ?? "").split(" ");

  return prisma.user.create({
    data: {
      email,
      username: await allocateUsername(email),
      firstName: profile.given_name || fallbackFirst || email.split("@")[0],
      lastName: profile.family_name || fallbackRest.join(" ") || "",
      role: "CLIENT",
      googleId: profile.sub,
      emailVerifiedAt: new Date(),
      isVerified: true,
      // No passwordHash: this account signs in through Google only. It can
      // still be given one later through a password-reset flow.
    },
    select: { id: true, username: true, role: true, email: true, firstName: true, lastName: true },
  });
}
