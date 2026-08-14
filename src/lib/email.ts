import { Resend } from "resend";

/**
 * Transactional email.
 *
 * The client is created lazily, not at module load, so a missing API key does
 * not crash every route that happens to import this file. Sending is allowed to
 * fail loudly to the caller, which decides what that means — a failed
 * verification email must not, for instance, roll back an account that was
 * created successfully.
 */
let client: Resend | null = null;

function resend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not configured");
  client ??= new Resend(key);
  return client;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/** Resend requires a verified sender domain; onboarding@resend.dev works for testing. */
const FROM = process.env.EMAIL_FROM ?? "SafeMeds <onboarding@resend.dev>";

export async function sendVerificationEmail(opts: {
  to: string;
  firstName: string;
  verifyUrl: string;
}): Promise<void> {
  const { to, firstName, verifyUrl } = opts;

  // Deliberately plain. A verification mail should be legible in any client,
  // and this one carries no medical content whatsoever — consistent with the
  // push payloads, which are kept free of it for the same reason.
  const { error } = await resend().emails.send({
    from: FROM,
    to,
    subject: "Confirm your SafeMeds email address",
    text: [
      `Hi ${firstName},`,
      "",
      "Confirm this address to finish setting up your SafeMeds account:",
      verifyUrl,
      "",
      "The link expires in 24 hours.",
      "",
      "If you did not create a SafeMeds account, you can ignore this email —",
      "no account can be used until the address is confirmed.",
    ].join("\n"),
    html: `
      <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#191c1e">
        <h1 style="font-size:20px;margin:0 0 16px">Confirm your email address</h1>
        <p style="margin:0 0 16px">Hi ${firstName},</p>
        <p style="margin:0 0 24px">Confirm this address to finish setting up your SafeMeds account.</p>
        <p style="margin:0 0 24px">
          <a href="${verifyUrl}" style="display:inline-block;background:#0b5e4d;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600">Confirm email address</a>
        </p>
        <p style="margin:0 0 8px;font-size:14px;color:#3f4945">Or paste this into your browser:</p>
        <p style="margin:0 0 24px;font-size:13px;word-break:break-all;color:#3f4945">${verifyUrl}</p>
        <p style="margin:0 0 8px;font-size:14px;color:#3f4945">The link expires in 24 hours.</p>
        <p style="margin:0;font-size:14px;color:#3f4945">
          If you did not create a SafeMeds account you can ignore this email — no account
          can be used until the address is confirmed.
        </p>
      </div>`,
  });

  if (error) throw new Error(error.message ?? "Failed to send verification email");
}
