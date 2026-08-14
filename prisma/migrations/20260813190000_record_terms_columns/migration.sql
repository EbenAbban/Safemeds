-- Records two columns that already exist in every environment but were never
-- captured in a migration.
--
-- users.termsAcceptedAt and users.termsVersion are declared in schema.prisma
-- and present in the database, but no migration file creates them — they were
-- almost certainly applied with `prisma db push`, which writes to the database
-- without recording anything in the migration history.
--
-- The consequence was not cosmetic. Because the migration history could no
-- longer reproduce the current schema, `prisma migrate dev` reported drift and
-- offered a full reset — "All data will be lost" — to anyone who ran it, on a
-- database holding real consultations. That trap is what this file removes.
--
-- IF NOT EXISTS makes it a no-op wherever the columns are already present,
-- which is every existing environment, while still creating them on a fresh
-- database so the history reproduces the schema from scratch.
--
-- Types match the live database exactly: timestamp(3) and text, both nullable,
-- no default.

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "termsAcceptedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "termsVersion" TEXT;
