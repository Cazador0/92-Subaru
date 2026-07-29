import { assertEquals } from "@std/assert";
import { RateLimiter } from "./spam.ts";
import { handleApi } from "./api.ts";

// ---------- rate limiter ----------

Deno.test("rate limiter allows up to max hits, then blocks", () => {
  const rl = new RateLimiter(3, 60_000);
  const t0 = 1_000_000;
  assertEquals(rl.allow("1.2.3.4", t0), true);
  assertEquals(rl.allow("1.2.3.4", t0 + 1), true);
  assertEquals(rl.allow("1.2.3.4", t0 + 2), true);
  assertEquals(rl.allow("1.2.3.4", t0 + 3), false);
  // Other IPs are unaffected.
  assertEquals(rl.allow("5.6.7.8", t0 + 3), true);
});

Deno.test("rate limiter window slides — old hits expire", () => {
  const rl = new RateLimiter(2, 1_000);
  const t0 = 1_000_000;
  assertEquals(rl.allow("ip", t0), true);
  assertEquals(rl.allow("ip", t0 + 10), true);
  assertEquals(rl.allow("ip", t0 + 20), false);
  assertEquals(rl.allow("ip", t0 + 1_500), true); // first two aged out
});

// ---------- booking endpoint behavior ----------

function post(body: unknown, ip: string): Request {
  return new Request("http://localhost/api/bookings", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}

const VALID = {
  firstName: "Jane",
  lastName: "Doe",
  email: "jane@example.test",
  date: "2026-08-01",
  location: "Trees",
  message: "hello",
};

Deno.test("honeypot hit returns fake success and sends no email", async () => {
  // Email delivery is unconfigured in tests — if the handler tried to send,
  // it would 502. A 201 therefore proves no email was attempted.
  const res = await handleApi(
    post({ ...VALID, website: "spam.example" }, "10.0.0.1"),
  );
  assertEquals(res.status, 201);
  assertEquals((await res.json()).ok, true);
});

Deno.test("valid submission passes honeypot/rate-limit and attempts email delivery", async () => {
  // Email delivery is unconfigured in tests, so a 502 proves the submission
  // cleared validation and reached the send step.
  const res = await handleApi(post(VALID, "10.0.0.2"));
  assertEquals(res.status, 502);
});

Deno.test("rate limit: sixth rapid submission from one IP gets 429", async () => {
  let last = 0;
  for (let i = 0; i < 6; i++) {
    const res = await handleApi(post({ website: "spam.example" }, "10.0.0.99"));
    last = res.status;
    await res.body?.cancel();
  }
  assertEquals(last, 429);
});
