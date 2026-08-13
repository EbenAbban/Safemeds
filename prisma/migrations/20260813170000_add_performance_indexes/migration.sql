-- Performance indexes.
--
-- Before this migration the database carried only primary keys and unique
-- constraints. Postgres does not index foreign keys automatically, so every
-- lookup below was a sequential scan — confirmed with EXPLAIN ANALYZE against
-- the live database.
--
-- Hand-written rather than generated: `prisma migrate dev` cannot run against
-- this database because the migration history does not reproduce the current
-- schema (users.termsAcceptedAt / termsVersion exist in the database and in
-- schema.prisma but were never captured in a migration, most likely via
-- `db push`). It therefore offers a full reset, which would destroy live data.
-- This file is additive and safe to apply with `prisma migrate deploy`.
--
-- IF NOT EXISTS keeps it idempotent, since a couple of these may already have
-- been created ad hoc.
--
-- Note for a larger dataset: CREATE INDEX takes a brief write lock. At current
-- volumes that is instantaneous. If these tables ever grow large, prefer
-- CREATE INDEX CONCURRENTLY, which cannot run inside Prisma's migration
-- transaction and would need to be applied by hand.

-- The hottest read in the product: the consultation chat polls this every 4
-- seconds per open conversation, on both the student and pharmacist sides.
-- Composite so the ORDER BY is satisfied by the index rather than a sort.
CREATE INDEX IF NOT EXISTS "messages_chatId_createdAt_idx" ON "messages"("chatId", "createdAt");

-- Consultation access paths: anonymous student opening their own thread, a
-- signed-in student's list, the pharmacist inbox queue, and status ordering.
CREATE INDEX IF NOT EXISTS "consultations_anonymousId_idx" ON "consultations"("anonymousId");
CREATE INDEX IF NOT EXISTS "consultations_userId_idx" ON "consultations"("userId");
CREATE INDEX IF NOT EXISTS "consultations_assignedPharmacistId_idx" ON "consultations"("assignedPharmacistId");
CREATE INDEX IF NOT EXISTS "consultations_status_createdAt_idx" ON "consultations"("status", "createdAt");

-- Delivery: anonymousId backs both the OTP lookup and anonymous tracking,
-- courierId backs the courier's own list, status backs the unassigned pool.
CREATE INDEX IF NOT EXISTS "deliveries_anonymousId_idx" ON "deliveries"("anonymousId");
CREATE INDEX IF NOT EXISTS "deliveries_userId_idx" ON "deliveries"("userId");
CREATE INDEX IF NOT EXISTS "deliveries_courierId_idx" ON "deliveries"("courierId");
CREATE INDEX IF NOT EXISTS "deliveries_status_idx" ON "deliveries"("status");

CREATE INDEX IF NOT EXISTS "orders_userId_idx" ON "orders"("userId");
CREATE INDEX IF NOT EXISTS "orders_anonymousId_idx" ON "orders"("anonymousId");
CREATE INDEX IF NOT EXISTS "orders_status_createdAt_idx" ON "orders"("status", "createdAt");

-- The notification bell polls this per user on every authenticated page.
CREATE INDEX IF NOT EXISTS "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");
