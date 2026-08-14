-- Email verification for credentials signup.
--
-- Until now nothing verified that a person owned the address they registered
-- with: signup set isVerified = true immediately, and the sign-in check for it
-- could therefore never fire. Anyone could register with someone else's email
-- and use the account straight away.

CREATE TABLE IF NOT EXISTS "public"."email_verification_tokens" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "email_verification_tokens_tokenHash_key"
  ON "public"."email_verification_tokens"("tokenHash");
CREATE INDEX IF NOT EXISTS "email_verification_tokens_userId_idx"
  ON "public"."email_verification_tokens"("userId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'email_verification_tokens_userId_fkey'
  ) THEN
    ALTER TABLE "public"."email_verification_tokens"
      ADD CONSTRAINT "email_verification_tokens_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "public"."users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

-- Grandfather every account that already exists.
--
-- Sign-in is about to require a verified address. These people registered when
-- no such requirement existed and have no way to receive a link they were never
-- sent, so locking them out would be punishing them for our change. Their
-- verification timestamp is backdated to when they signed up, which is honest:
-- it records that the address was accepted then, not that it was proven now.
-- Only accounts existing at this moment are covered; everyone after this
-- migration verifies normally.
UPDATE "public"."users"
SET "emailVerifiedAt" = "createdAt"
WHERE "emailVerifiedAt" IS NULL;
