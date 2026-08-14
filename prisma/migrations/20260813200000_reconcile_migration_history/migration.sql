-- Reconciles the migration history with the schema it is supposed to produce.
--
-- Several objects existed in every database and in schema.prisma but were never
-- captured in a migration — they were applied with `prisma db push`, which
-- writes to the database without recording anything in the history:
--
--   * enum   NotificationType
--   * tables contact_messages, license_verifications
--   * columns on deliveries (courier GPS + drop coordinates) and notifications
--
-- The consequence was not cosmetic. Because the history could no longer
-- reproduce the schema, `prisma migrate dev` reported drift and offered a full
-- reset — "All data will be lost" — to anyone who ran it against a database
-- holding real consultations. Removing that trap is the point of this file.
--
-- Every statement is idempotent, so this is a no-op on existing databases
-- (where all of it is already present) while still building the objects on a
-- fresh one, which is what makes the history reproducible again.
--
-- Postgres has no CREATE TYPE IF NOT EXISTS, hence the DO block.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationType') THEN
    CREATE TYPE "public"."NotificationType" AS ENUM ('ORDER', 'CONSULTATION', 'DELIVERY', 'SYSTEM');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "public"."contact_messages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."license_verifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "licenseType" TEXT NOT NULL,
    "issuingBody" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "documentUrl" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "license_verifications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "license_verifications_userId_key"
  ON "public"."license_verifications"("userId");

-- ADD CONSTRAINT has no IF NOT EXISTS in Postgres.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'license_verifications_userId_fkey'
  ) THEN
    ALTER TABLE "public"."license_verifications"
      ADD CONSTRAINT "license_verifications_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "public"."users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

-- Live courier GPS and campus drop-point coordinates.
ALTER TABLE "public"."deliveries" ADD COLUMN IF NOT EXISTS "dropLat" DOUBLE PRECISION;
ALTER TABLE "public"."deliveries" ADD COLUMN IF NOT EXISTS "dropLng" DOUBLE PRECISION;
ALTER TABLE "public"."deliveries" ADD COLUMN IF NOT EXISTS "courierLat" DOUBLE PRECISION;
ALTER TABLE "public"."deliveries" ADD COLUMN IF NOT EXISTS "courierLng" DOUBLE PRECISION;
ALTER TABLE "public"."deliveries" ADD COLUMN IF NOT EXISTS "courierAccuracy" DOUBLE PRECISION;
ALTER TABLE "public"."deliveries" ADD COLUMN IF NOT EXISTS "courierHeading" DOUBLE PRECISION;
ALTER TABLE "public"."deliveries" ADD COLUMN IF NOT EXISTS "courierSpeed" DOUBLE PRECISION;
ALTER TABLE "public"."deliveries" ADD COLUMN IF NOT EXISTS "courierUpdatedAt" TIMESTAMP(3);
ALTER TABLE "public"."deliveries" ADD COLUMN IF NOT EXISTS "courierActive" BOOLEAN NOT NULL DEFAULT false;

-- notifications.title and .message are NOT NULL with no default. That is safe
-- here: on an existing database the columns are already present so these are
-- no-ops, and on a fresh one the table is empty at this point.
ALTER TABLE "public"."notifications" ADD COLUMN IF NOT EXISTS "title" TEXT NOT NULL;
ALTER TABLE "public"."notifications" ADD COLUMN IF NOT EXISTS "message" TEXT NOT NULL;
ALTER TABLE "public"."notifications" ADD COLUMN IF NOT EXISTS "link" TEXT;
ALTER TABLE "public"."notifications" ADD COLUMN IF NOT EXISTS "read" BOOLEAN NOT NULL DEFAULT false;
