import { assertEquals, assertStringIncludes } from "@std/assert";
import { buildBookingEmail } from "./email.ts";

Deno.test("booking email contains every field", () => {
  const mail = buildBookingEmail({
    date: "2026-08-01",
    type: "Wedding",
    location: "Tulips FTW",
    budget: "Flexible",
    message: "Two 45-minute sets, outdoor stage.",
  });
  assertStringIncludes(mail.subject, "2026-08-01");
  assertStringIncludes(mail.subject, "Tulips FTW");
  assertStringIncludes(mail.text, "Wedding");
  assertStringIncludes(mail.text, "Flexible");
  assertStringIncludes(mail.text, "outdoor stage");
});

Deno.test("CR/LF in single-line fields cannot inject email headers (CHK024)", () => {
  const mail = buildBookingEmail({
    date: "2026-08-01\r\nBcc: attacker@evil.test",
    location: "Trees\nX-Spam: yes",
    message: "hello",
  });
  assertEquals(mail.subject.includes("\n"), false);
  assertEquals(mail.subject.includes("\r"), false);
  // The words survive, the line breaks don't.
  assertStringIncludes(mail.subject, "Bcc: attacker@evil.test");
});

Deno.test("message keeps its newlines but drops control chars", () => {
  const mail = buildBookingEmail({
    date: "2026-08-01",
    location: "Trees",
    message: "line one\nline two\x00\x07bell",
  });
  assertStringIncludes(mail.text, "line one\nline two");
  assertEquals(mail.text.includes("\x00"), false);
  assertEquals(mail.text.includes("\x07"), false);
});
