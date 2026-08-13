-- Proof-of-delivery OTP (only the bcrypt hash is stored).
ALTER TABLE "deliveries" ADD COLUMN "otpHash" TEXT;
ALTER TABLE "deliveries" ADD COLUMN "otpExpiresAt" TIMESTAMP(3);
ALTER TABLE "deliveries" ADD COLUMN "otpAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "deliveries" ADD COLUMN "otpVerifiedAt" TIMESTAMP(3);

-- Google OAuth. passwordHash becomes nullable because accounts provisioned
-- through Google never had a local password.
ALTER TABLE "users" ALTER COLUMN "passwordHash" DROP NOT NULL;
ALTER TABLE "users" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "googleId" TEXT;

CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");
