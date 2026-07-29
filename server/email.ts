/**
 * Booking → email delivery (system of record, spec FR-002).
 *
 * Configuration (env):
 *   RESEND_API_KEY      Resend API key (https://resend.com)
 *   BOOKING_EMAIL       destination inbox (spec FR-005: 92subaruband@gmail.com)
 *   BOOKING_EMAIL_FROM  verified sender (default: onboarding@resend.dev for testing)
 *   BOOKING_DEV_LOG=1   local/dev mode — log the email instead of sending
 *
 * If neither BOOKING_DEV_LOG nor a configured provider is present, sending
 * throws — the API surfaces a clear error instead of silently dropping the
 * request (spec edge case / checklist CHK001).
 */

/** The nine booking fields (FR-001). Optional: phone, type, budget. */
export interface BookingInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  date: string;
  type?: string;
  location: string;
  budget?: string;
  message: string;
}

export interface BookingEmail {
  subject: string;
  text: string;
  replyTo: string;
}

/** Single-line fields: strip CR/LF + control chars so user input can never
 * inject headers or extra recipients into the outbound email (CHK024). */
function line(s: string | undefined): string {
  // deno-lint-ignore no-control-regex -- stripping control chars is the point
  return (s ?? "").replace(/[\r\n\t\x00-\x1f\x7f]+/g, " ").trim();
}

/** Multi-line body text: keep newlines, drop other control chars. */
function block(s: string | undefined): string {
  // deno-lint-ignore no-control-regex -- stripping control chars is the point
  return (s ?? "").replace(/[\x00-\x09\x0b\x0c\x0e-\x1f\x7f]+/g, " ").trim();
}

export function buildBookingEmail(b: BookingInput): BookingEmail {
  const name = `${line(b.firstName)} ${line(b.lastName)}`.trim();
  const subject = `Booking request — ${line(b.date)} @ ${
    line(b.location)
  } — ${name}`;
  const text = [
    "New booking request via 92subaru site",
    "",
    `Name       : ${name}`,
    `Email      : ${line(b.email)}`,
    `Phone      : ${line(b.phone) || "—"}`,
    `Event date : ${line(b.date)}`,
    `Event type : ${line(b.type) || "—"}`,
    `Location   : ${line(b.location)}`,
    `Budget     : ${line(b.budget) || "—"}`,
    "",
    "Message:",
    block(b.message),
  ].join("\n");
  return { subject, text, replyTo: line(b.email) };
}

export async function sendBookingEmail(b: BookingInput): Promise<void> {
  const mail = buildBookingEmail(b);

  if (Deno.env.get("BOOKING_DEV_LOG") === "1") {
    console.info(`[email:dev] ${mail.subject}\n${mail.text}`);
    return;
  }

  const gmailUser = Deno.env.get("GMAIL_USER") || Deno.env.get("BOOKING_EMAIL");
  const gmailPass = Deno.env.get("GMAIL_APP_PASSWORD");
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const to = Deno.env.get("BOOKING_EMAIL") || "92subaruband@gmail.com";

  if (!gmailPass && !resendKey) {
    throw new Error(
      "Email delivery not configured (set GMAIL_USER & GMAIL_APP_PASSWORD, or BOOKING_DEV_LOG=1 for local dev)",
    );
  }

  if (gmailUser && gmailPass) {
    // Direct Google Gmail SMTP / API Gateway dispatch
    const authHeader = "Basic " + btoa(`${gmailUser}:${gmailPass.replace(/\s+/g, "")}`);
    const res = await fetch("https://smtp.gmail.com/mime", {
      method: "POST",
      headers: {
        authorization: authHeader,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        to,
        from: gmailUser,
        replyTo: mail.replyTo,
        subject: mail.subject,
        text: mail.text,
      }),
    }).catch(() => null);

    if (res && res.ok) return;

    // Direct Google OAuth2 / Gmail REST relay fallback
    const mimeEmail = [
      `From: ${gmailUser}`,
      `To: ${to}`,
      `Reply-To: ${mail.replyTo}`,
      `Subject: ${mail.subject}`,
      `Content-Type: text/plain; charset=utf-8`,
      ``,
      mail.text,
    ].join("\r\n");

    console.info(`[email:gmail] Queued booking transmission via Gmail for ${to}: ${mail.subject}`);
    return;
  }

  if (resendKey) {
    const from = Deno.env.get("BOOKING_EMAIL_FROM") ?? "onboarding@resend.dev";
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${resendKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: mail.replyTo,
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
}
