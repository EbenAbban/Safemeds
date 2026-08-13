import NextAuth, { DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { verifyPassword } from "@/utils/password";
import { getUserByUsername } from "@/utils/db";
import { linkOrCreateGoogleUser } from "@/utils/googleAuth";
import { formatLicenseNumber } from "@/services/licenseService";
import { prisma } from "@/lib/prisma";

// Extend the built-in session types
declare module "next-auth" {
  interface User {
    id: string;
    username: string;
    role: string;
    name?: string;
  }

  interface Session {
    user: {
      id: string;
      username: string;
      role: string;
      name?: string;
    } & DefaultSession["user"];
  }
}

export const { handlers, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  // Required by NextAuth v5 when running behind a proxy/host it can't infer
  // (e.g. Vercel) — without it auth throws `UntrustedHost` in production.
  trustHost: true,
  debug: false,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Ask Google to prefer an already-verified address on multi-account
      // profiles, and always show the chooser rather than silently reusing
      // whichever session the browser happens to hold.
      authorization: { params: { prompt: "select_account" } },
    }),
    Credentials({
      name: "credentials",
      credentials: {
        username: {},
        email: {},
        password: {},
        licenseNumber: {},
        role: {},
      },
      authorize: async (credentials) => {
        // Check if credentials exist
        if (!credentials) {
          throw new Error("Invalid credentials");
        }

        const { username, email, password, licenseNumber, role } = credentials;

        // Handle different login types
        if (role === "PHARMACY") {
          // Pharmacist login with email, password, and license number
          if (!email || !password || !licenseNumber) {
            throw new Error("Invalid credentials");
          }

          const trimmedEmail = (email as string).trim().toLowerCase();
          const trimmedPassword = (password as string).trim();
          const trimmedLicenseNumber = (licenseNumber as string).trim();

          if (!trimmedEmail || !trimmedPassword || !trimmedLicenseNumber) {
            throw new Error("Invalid credentials");
          }

          let dbUser;
          try {
            dbUser = await prisma.user.findFirst({
              where: { email: trimmedEmail },
            });
          } catch (error) {
            console.error("Database connection error:", error);
            throw new Error("Invalid credentials");
          }

          if (!dbUser) {
            throw new Error("Invalid credentials");
          }

          if (dbUser.role !== "PHARMACY") {
            throw new Error("Invalid credentials");
          }

          if (dbUser.isVerified === false) {
            throw new Error("Invalid credentials");
          }

          // Google-provisioned accounts have no local password; they must go
          // through the Google button rather than this form.
          if (!dbUser.passwordHash) {
            throw new Error("Invalid credentials");
          }

          const isValidPassword = await verifyPassword(
            trimmedPassword,
            dbUser.passwordHash
          );

          if (!isValidPassword) {
            throw new Error("Invalid credentials");
          }

          // The provided license number must match the one on file for this
          // pharmacist. We intentionally do NOT auto-update it on mismatch:
          // changing a verified credential must go through the admin license
          // verification flow, never a login attempt. A generic error is
          // returned to avoid leaking which field was wrong.
          //
          // Both sides are normalised before comparing. A licence number is a
          // case-insensitive identifier that people write with separators
          // ("RPh-123-456"), and a raw string compare rejected every one of
          // those spellings as "Invalid credentials" — indistinguishable from
          // a wrong password, and unguessable for the pharmacist. Normalising
          // does not weaken the check: the digits and letters must still match
          // exactly.
          if (
            formatLicenseNumber(dbUser.licenseNumber ?? "") !==
            formatLicenseNumber(trimmedLicenseNumber)
          ) {
            throw new Error("Invalid credentials");
          }

          // Return pharmacist user object
          const user = {
            id: dbUser.id,
            username: dbUser.username,
            email: dbUser.email,
            role: dbUser.role,
            name: `${dbUser.firstName} ${dbUser.lastName}`,
          };

          if (process.env.NODE_ENV === "development") console.log(`Pharmacist ${user.email} authenticated successfully`);
          return user;
        } else {
          // Regular login with username and password (CLIENT or ADMIN)
          if (!username || !password) {
            throw new Error("Invalid credentials");
          }

          const trimmedUsername = (username as string).trim();
          const trimmedPassword = (password as string).trim();

          if (!trimmedUsername || !trimmedPassword) {
            throw new Error("Invalid credentials");
          }

          if (trimmedUsername.length < 3 || trimmedUsername.length > 50) {
            throw new Error("Invalid credentials");
          }

          if (trimmedPassword.length < 6 || trimmedPassword.length > 128) {
            throw new Error("Invalid credentials");
          }

          let dbUser;
          try {
            dbUser = await getUserByUsername(trimmedUsername);
          } catch (error) {
            console.error("Database connection error:", error);
            throw new Error("Invalid credentials");
          }

          if (!dbUser) {
            throw new Error("Invalid credentials");
          }

          if (dbUser.isVerified === false) {
            throw new Error("Invalid credentials");
          }

          // Google-provisioned accounts have no local password; they must go
          // through the Google button rather than this form.
          if (!dbUser.passwordHash) {
            throw new Error("Invalid credentials");
          }

          const isValidPassword = await verifyPassword(
            trimmedPassword,
            dbUser.passwordHash
          );

          if (!isValidPassword) {
            throw new Error("Invalid credentials");
          }

          // Return user object without password hash
          const user = {
            id: dbUser.id,
            username: dbUser.username,
            email: dbUser.email,
            role: dbUser.role,
            name: dbUser.name || `${dbUser.firstName} ${dbUser.lastName}`,
          };

          if (!user.id || !user.username || !user.role) {
            throw new Error("Invalid credentials");
          }

          return user;
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth",
    error: "/auth",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    // Google is trusted for identity only after it says the address is
    // verified. Without this check an attacker could register an unverified
    // Google account bearing someone else's address and take over the
    // SafeMeds account that email maps to.
    async signIn({ account, profile }) {
      if (account?.provider !== "google") return true;

      if (!profile?.email || profile.email_verified !== true) {
        console.warn("Rejected Google sign-in with unverified email");
        return false;
      }

      try {
        await linkOrCreateGoogleUser({
          sub: profile.sub as string,
          email: profile.email,
          given_name: profile.given_name as string | undefined,
          family_name: profile.family_name as string | undefined,
          name: profile.name as string | undefined,
        });
        return true;
      } catch (error) {
        console.error("Google account provisioning failed:", error);
        return false;
      }
    },
    async jwt({ token, user, account }) {
      if (account?.provider === "google") {
        // The `user` handed to this callback is Google's profile, not a
        // SafeMeds row — it has no id, username or role. Read the record
        // signIn just created or linked.
        const dbUser = await prisma.user.findUnique({
          where: { email: (token.email ?? user?.email ?? "").toLowerCase() },
          select: { id: true, username: true, role: true },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.username = dbUser.username;
          token.role = dbUser.role;
        }
        return token;
      }

      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});