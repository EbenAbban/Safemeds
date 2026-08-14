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
const NEWLINE = "\n";

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

/** Shared frame so every SafeMeds email looks like the same sender. */
function layout(heading: string, body: string): string {
  return `
    <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#191c1e">
      <p style="margin:0 0 24px;font-weight:700;font-size:18px;color:#0b5e4d">SafeMeds</p>
      <h1 style="font-size:20px;margin:0 0 16px">${heading}</h1>
      ${body}
      <p style="margin:32px 0 0;font-size:12px;color:#6f7975">
        SafeMeds — private healthcare for students.
      </p>
    </div>`;
}

/**
 * The six-digit code that confirms an address.
 *
 * No medical content, and nothing about the account beyond the first name —
 * the same restraint the push payloads keep, for the same reason: this arrives
 * on a lock screen.
 */
export async function sendVerificationCodeEmail(opts: {
  to: string;
  firstName: string;
  code: string;
}): Promise<void> {
  const { to, firstName, code } = opts;

  const { error } = await resend().emails.send({
    from: FROM,
    to,
    subject: `${code} is your SafeMeds confirmation code`,
    text: [
      `Hi ${firstName},`,
      "",
      `Your SafeMeds confirmation code is: ${code}`,
      "",
      "Enter it on the confirmation screen to finish setting up your account.",
      "The code expires in 30 minutes.",
      "",
      "If you did not create a SafeMeds account, you can ignore this email.",
    ].join(NEWLINE),
    html: layout(
      "Confirm your email address",
      `<p style="margin:0 0 16px">Hi ${firstName},</p>
       <p style="margin:0 0 20px">Enter this code to finish setting up your account:</p>
       <p style="margin:0 0 20px;font-size:34px;font-weight:700;letter-spacing:8px;color:#0b5e4d">${code}</p>
       <p style="margin:0 0 8px;font-size:14px;color:#3f4945">The code expires in 30 minutes.</p>
       <p style="margin:0;font-size:14px;color:#3f4945">If you did not create a SafeMeds account, you can ignore this email.</p>`
    ),
  });

  if (error) throw new Error(error.message ?? "Failed to send verification email");
}

/** Sent once, after an address is confirmed. */
export async function sendWelcomeEmail(opts: {
  to: string;
  firstName: string;
}): Promise<void> {
  const { to, firstName } = opts;

  const { error } = await resend().emails.send({
    from: FROM,
    to,
    subject: "Thanks for joining SafeMeds",
    text: [
      `Hi ${firstName},`,
      "",
      "Thanks for joining SafeMeds. Your email address is confirmed and your account is ready.",
      "",
      "You can start an anonymous consultation whenever you need one — a licensed",
      "pharmacist will reply, and your consultation is not linked to your name.",
    ].join(NEWLINE),
    html: layout(
      "Thanks for joining SafeMeds",
      `<p style="margin:0 0 16px">Hi ${firstName},</p>
       <p style="margin:0 0 16px">Your email address is confirmed and your account is ready.</p>
       <p style="margin:0;font-size:14px;color:#3f4945">
         Start an anonymous consultation whenever you need one. A licensed pharmacist
         will reply, and your consultation is not linked to your name.
       </p>`
    ),
  });

  if (error) throw new Error(error.message ?? "Failed to send welcome email");
}

/**
 * Sent after each successful sign-in.
 *
 * Doubles as a security notice, so it says when and invites the reader to act
 * if it was not them. A bare "thanks for signing in" would be pure noise; this
 * at least earns its place in the inbox.
 */
export async function sendSignInEmail(opts: {
  to: string;
  firstName: string;
  when?: Date;
}): Promise<void> {
  const { to, firstName, when = new Date() } = opts;
  const stamp = when.toLocaleString("en-GH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Accra",
  });

  const { error } = await resend().emails.send({
    from: FROM,
    to,
    subject: "You signed in to SafeMeds",
    text: [
      `Hi ${firstName},`,
      "",
      `Thanks for signing in to SafeMeds on ${stamp}.`,
      "",
      "If this was not you, change your password straight away.",
    ].join(NEWLINE),
    html: layout(
      "You signed in to SafeMeds",
      `<p style="margin:0 0 16px">Hi ${firstName},</p>
       <p style="margin:0 0 16px">Thanks for signing in on <strong>${stamp}</strong>.</p>
       <p style="margin:0;font-size:14px;color:#3f4945">
         If this was not you, change your password straight away.
       </p>`
    ),
  });

  if (error) throw new Error(error.message ?? "Failed to send sign-in email");
}
