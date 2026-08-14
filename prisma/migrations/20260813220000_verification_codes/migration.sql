-- Switch email verification from a link to a six-digit code.
--
-- A code is typed once and works anywhere; a link has to be clicked from a mail
-- client, which on a phone means bouncing between apps and can be prefetched or
-- rewritten by mail scanners.
--
-- The storage changes with it. A 32-byte token needed only SHA-256, because
-- guessing it was not a threat. Six digits are guessable, so the hash becomes
-- bcrypt and attempts are capped — the same reasoning as the delivery OTP.
-- Since bcrypt is salted, the hash can no longer be looked up directly, so the
-- unique index on it goes and the row is found by user instead.

ALTER TABLE "public"."email_verification_tokens"
  ADD COLUMN IF NOT EXISTS "attempts" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "public"."email_verification_tokens"
  RENAME COLUMN "tokenHash" TO "codeHash";

DROP INDEX IF EXISTS "public"."email_verification_tokens_tokenHash_key";
DROP INDEX IF EXISTS "public"."email_verification_tokens_userId_idx";
CREATE INDEX IF NOT EXISTS "email_verification_tokens_userId_consumedAt_idx"
  ON "public"."email_verification_tokens"("userId", "consumedAt");

-- Any link issued before this point cannot be honoured by the new flow.
UPDATE "public"."email_verification_tokens"
SET "consumedAt" = now()
WHERE "consumedAt" IS NULL;
