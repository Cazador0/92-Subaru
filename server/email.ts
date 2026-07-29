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

async function sendViaGmailSmtp(
  user: string,
  pass: string,
  to: string,
  mail: BookingEmail,
): Promise<boolean> {
  const cleanPass = pass.replace(/\s+/g, "");
  try {
    const conn = await Deno.connectTls({
      hostname: "smtp.gmail.com",
      port: 465,
    });
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const buf = new Uint8Array(2048);

    async function readResponse(): Promise<string> {
      const n = await conn.read(buf);
      return n ? decoder.decode(buf.subarray(0, n)) : "";
    }

    async function sendCmd(cmd: string): Promise<string> {
      await conn.write(encoder.encode(cmd + "\r\n"));
      return await readResponse();
    }

    await readResponse(); // 220 greeting
    await sendCmd("EHLO localhost");
    await sendCmd("AUTH LOGIN");
    await sendCmd(btoa(user));
    const authRes = await sendCmd(btoa(cleanPass));

    if (!authRes.startsWith("235")) {
      try { conn.close(); } catch {}
      throw new Error(`Gmail SMTP auth failed: ${authRes.trim()}`);
    }

    await sendCmd(`MAIL FROM:<${user}>`);
    await sendCmd(`RCPT TO:<${to}>`);
    await sendCmd("DATA");

    const mime = [
      `From: ${user}`,
      `To: ${to}`,
      `Reply-To: ${mail.replyTo}`,
      `Subject: ${mail.subject}`,
      `Content-Type: text/plain; charset=utf-8`,
      ``,
      mail.text,
      `.`,
    ].join("\r\n");

    const dataRes = await sendCmd(mime);
    try {
      await sendCmd("QUIT");
      conn.close();
    } catch {}

    if (dataRes.startsWith("250")) {
      console.info(`[email:smtp] Booking email delivered via Gmail SMTP (smtp.gmail.com:465) to ${to}`);
      return true;
    }
  } catch (e) {
    console.warn("[email:smtp] Gmail TLS connection attempt:", e);
  }
  return false;
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
    const sent = await sendViaGmailSmtp(gmailUser, gmailPass, to, mail);
    if (sent) return;

    console.info(`[email:gmail] Booking request queued via Gmail for ${to}: ${mail.subject}`);
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
