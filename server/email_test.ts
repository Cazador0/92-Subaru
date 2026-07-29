import { assertEquals, assertStringIncludes } from "@std/assert";
import { buildBookingEmail } from "./email.ts";

Deno.test("booking email contains all nine FR-001 fields", async () => {
  const mail = await buildBookingEmail({
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.test",
    phone: "817-555-0192",
    date: "2026-08-01",
    type: "Wedding",
    location: "Tulips FTW",
    budget: "$2.5–5k",
    message: "Two 45-minute sets, outdoor stage.",
  });
  assertStringIncludes(mail.subject, "2026-08-01");
  assertStringIncludes(mail.subject, "Tulips FTW");
  assertStringIncludes(mail.subject, "Jane Doe");
  assertStringIncludes(mail.text, "Jane Doe");
  assertStringIncludes(mail.text, "jane@example.test");
  assertStringIncludes(mail.text, "817-555-0192");
  assertStringIncludes(mail.text, "Wedding");
  assertStringIncludes(mail.text, "$2.5–5k");
  assertStringIncludes(mail.text, "outdoor stage");
  assertEquals(mail.replyTo, "jane@example.test");
});

Deno.test("optional fields render as em-dash placeholders", async () => {
  const mail = await buildBookingEmail({
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.test",
    date: "2026-08-01",
    location: "Trees",
    message: "hello",
  });
  assertStringIncludes(mail.text, "Phone      : —");
  assertStringIncludes(mail.text, "Event type : —");
  assertStringIncludes(mail.text, "Budget     : —");
});

Deno.test("CR/LF in single-line fields cannot inject email headers (CHK024)", async () => {
  const mail = await buildBookingEmail({
    firstName: "Jane\r\nX-Evil: 1",
    lastName: "Doe",
    email: "jane@example.test\r\nBcc: attacker@evil.test",
    date: "2026-08-01\r\nBcc: attacker@evil.test",
    location: "Trees\nX-Spam: yes",
    message: "hello",
  });
  assertEquals(mail.subject.includes("\n"), false);
  assertEquals(mail.subject.includes("\r"), false);
  assertEquals(mail.replyTo.includes("\n"), false);
  assertEquals(mail.replyTo.includes("\r"), false);
  // The words survive, the line breaks don't.
  assertStringIncludes(mail.subject, "Bcc: attacker@evil.test");
});

Deno.test("message keeps its newlines but drops control chars", async () => {
  const mail = await buildBookingEmail({
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.test",
    date: "2026-08-01",
    location: "Trees",
    message: "line one\nline two\x00\x07bell",
  });
  assertStringIncludes(mail.text, "line one\nline two");
  assertEquals(mail.text.includes("\x00"), false);
  assertEquals(mail.text.includes("\x07"), false);
});
