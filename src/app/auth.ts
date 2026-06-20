import NextAuth, { DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verifyPassword } from "@/utils/password";
import { getUserByUsername } from "@/utils/db";
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

          const isValidPassword = await verifyPassword(
            trimmedPassword,
            dbUser.passwordHash!
          );

          if (!isValidPassword) {
            throw new Error("Invalid credentials");
          }

          // The provided license number must match the one on file for this
          // pharmacist. We intentionally do NOT auto-update it on mismatch:
          // changing a verified credential must go through the admin license
          // verification flow, never a login attempt. A generic error is
          // returned to avoid leaking which field was wrong.
          if (dbUser.licenseNumber !== trimmedLicenseNumber) {
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

          const isValidPassword = await verifyPassword(
            trimmedPassword,
            dbUser.passwordHash!
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
    async jwt({ token, user }) {
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