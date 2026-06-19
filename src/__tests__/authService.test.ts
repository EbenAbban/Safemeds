import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn(() => Promise.resolve("hashed-password")),
    compare: vi.fn(() => Promise.resolve(true)),
  },
  hash: vi.fn(() => Promise.resolve("hashed-password")),
  compare: vi.fn(() => Promise.resolve(true)),
}));

import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

const mockUser = {
  id: "user-1",
  email: "test@example.com",
  firstName: "John",
  lastName: "Doe",
  role: "CLIENT" as const,
  organization: "Test University",
  pharmacyName: null,
  licenseNumber: null,
  phone: null,
  address: null,
  city: null,
  state: null,
  zipCode: null,
  isVerified: false,
  username: "testuser",
  passwordHash: "hashed-password",
  termsAcceptedAt: null,
  termsVersion: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("Auth Service - SignUp validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reject missing required fields", async () => {
    const { signUp } = await import("@/lib/authService");
    const invalidData = {
      email: "",
      password: "Weak1",
      firstName: "",
      lastName: "",
      role: "CLIENT" as const,
    };

    await expect(signUp(invalidData)).rejects.toThrow(
      "Please provide a valid email address"
    );
  });

  it("should reject weak passwords", async () => {
    const { signUp } = await import("@/lib/authService");
    const data = {
      email: "test@example.com",
      password: "short",
      firstName: "John",
      lastName: "Doe",
      role: "CLIENT" as const,
      organization: "Test University",
    };

    await expect(signUp(data)).rejects.toThrow(
      /Password/
    );
  });

  it("should reject duplicate emails", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

    const { signUp } = await import("@/lib/authService");
    const data = {
      email: "test@example.com",
      password: "StrongPass1",
      firstName: "John",
      lastName: "Doe",
      role: "CLIENT" as const,
      organization: "Test University",
    };

    await expect(signUp(data)).rejects.toThrow(
      "Unable to create account"
    );
  });

  it("should create user with valid CLIENT data", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue(mockUser);

    const { signUp } = await import("@/lib/authService");
    const result = await signUp({
      email: "test@example.com",
      password: "StrongPass1",
      firstName: "John",
      lastName: "Doe",
      role: "CLIENT",
      organization: "Test University",
    });

    expect(result.email).toBe("test@example.com");
    expect(result.role).toBe("CLIENT");
    expect(prisma.user.create).toHaveBeenCalledOnce();
  });

  it("should require organization for CLIENT role", async () => {
    const { signUp } = await import("@/lib/authService");
    const data = {
      email: "test@example.com",
      password: "StrongPass1",
      firstName: "John",
      lastName: "Doe",
      role: "CLIENT" as const,
    };

    await expect(signUp(data)).rejects.toThrow("Organization name is required");
  });

  it("should require pharmacy fields for PHARMACY role", async () => {
    const { signUp } = await import("@/lib/authService");
    const data = {
      email: "pharmacist@example.com",
      password: "StrongPass1",
      firstName: "Jane",
      lastName: "Smith",
      role: "PHARMACY" as const,
    };

    await expect(signUp(data)).rejects.toThrow(
      "All pharmacy information"
    );
  });
});

describe("Auth Service - SignIn validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reject invalid email format", async () => {
    const { signIn } = await import("@/lib/authService");

    await expect(
      signIn({ email: "not-an-email", password: "StrongPass1" })
    ).rejects.toThrow("Please provide a valid email address");
  });

  it("should reject unverified users", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...mockUser,
      isVerified: false,
    });

    const { signIn } = await import("@/lib/authService");

    await expect(
      signIn({ email: "test@example.com", password: "StrongPass1" })
    ).rejects.toThrow("Invalid email or password");
  });

  it("should reject incorrect password", async () => {
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...mockUser,
      isVerified: true,
    });

    const { signIn } = await import("@/lib/authService");

    await expect(
      signIn({ email: "test@example.com", password: "WrongPass1" })
    ).rejects.toThrow("Invalid email or password");
  });

  it("should sign in with valid credentials", async () => {
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...mockUser,
      isVerified: true,
    });

    const { signIn } = await import("@/lib/authService");
    const result = await signIn({
      email: "test@example.com",
      password: "StrongPass1",
    });

    expect(result.email).toBe("test@example.com");
    expect(result.firstName).toBe("John");
  });
});
