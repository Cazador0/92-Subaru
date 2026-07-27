/**
 * Booking → email delivery (system of record, spec FR-002).
 *
 * Configuration (env):
 *   RESEND_API_KEY      Resend API key (https://resend.com)
 *   BOOKING_EMAIL_TO    destination inbox — owner-provided, see issue #9
 *   BOOKING_EMAIL_FROM  verified sender (default: onboarding@resend.dev for testing)
 *   BOOKING_DEV_LOG=1   local/dev mode — log the email instead of sending
 *
 * If neither BOOKING_DEV_LOG nor a configured provider is present, sending
 * throws — the API surfaces a clear error instead of silently dropping the
 * request (spec edge case / checklist CHK001).
 */

export interface BookingInput {
  date: string;
  type?: string;
  location: string;
  budget?: string;
  message: string;
}

export interface BookingEmail {
  subject: string;
  text: string;
}

/** Single-line fields: strip CR/LF + control chars so user input can never
 * inject headers or extra recipients into the outbound email (CHK024). */
function line(s: string | undefined): string {
  return (s ?? "").replace(/[\r\n\t\x00-\x1f\x7f]+/g, " ").trim();
}

/** Multi-line body text: keep newlines, drop other control chars. */
function block(s: string | undefined): string {
  return (s ?? "").replace(/[\x00-\x09\x0b\x0c\x0e-\x1f\x7f]+/g, " ").trim();
}

export function buildBookingEmail(b: BookingInput): BookingEmail {
  const subject = `Booking request — ${line(b.date)} @ ${line(b.location)}`;
  const text = [
    "New booking request via 92subaru site",
    "",
    `Event date : ${line(b.date)}`,
    `Event type : ${line(b.type) || "—"}`,
    `Location   : ${line(b.location)}`,
    `Budget     : ${line(b.budget) || "—"}`,
    "",
    "Message:",
    block(b.message),
  ].join("\n");
  return { subject, text };
}

export async function sendBookingEmail(b: BookingInput): Promise<void> {
  const mail = buildBookingEmail(b);

  if (Deno.env.get("BOOKING_DEV_LOG") === "1") {
    console.info(`[email:dev] ${mail.subject}\n${mail.text}`);
    return;
  }

  const key = Deno.env.get("RESEND_API_KEY");
  const to = Deno.env.get("BOOKING_EMAIL_TO");
  const from = Deno.env.get("BOOKING_EMAIL_FROM") ?? "onboarding@resend.dev";
  if (!key || !to) {
    throw new Error(
      "Email delivery not configured (set RESEND_API_KEY and BOOKING_EMAIL_TO, or BOOKING_DEV_LOG=1 for local dev)",
    );
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: mail.subject,
      text: mail.text,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `Email provider error ${res.status}: ${detail.slice(0, 200)}`,
    );
  }
}
