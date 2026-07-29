import { generateBookingBrief } from "./ai.ts";
import { buildBookingEmail } from "./email.ts";

const input = {
  firstName: "Hunter",
  lastName: "Baucum",
  email: "hunterbaucum@gmail.com",
  phone: "214-555-0192",
  date: "2026-08-15",
  type: "Corporate",
  location: "Liberty Mutual Office, Plano, TX",
  budget: "$5k+",
  message: "We would love to have '92 Subaru perform at our annual corporate summer celebration for Liberty Mutual in Plano! We are expecting ~400 employees. We need 2 full sets of 90s alt-rock and pop hits.",
};

console.log("====================================================================");
console.log("🤖 RUNNING LOCAL AI BRIEFING STRESS TEST (GROQ / GEMINI)");
console.log("====================================================================");

const res = await generateBookingBrief(input);

if (res.brief) {
  console.log(`\n✅ AI BRIEFING GENERATED SUCCESSFULLY (Provider: ${res.provider}):\n`);
  console.log(res.brief);
} else {
  console.log("\n⚠️ GROQ_API_KEY / GEMINI_API_KEY NOT SET IN LOCAL ENV — RUN WITH:");
  console.log("GROQ_API_KEY=\"gsk_...\" deno run --allow-net --allow-env server/test_ai_brief.ts\n");
}

console.log("\n====================================================================");
console.log("📩 FULL OUTBOUND EMAIL TEXT PAYLOAD");
console.log("====================================================================");

const email = await buildBookingEmail(input);
console.log(`SUBJECT: ${email.subject}`);
console.log(`REPLY-TO: ${email.replyTo}`);
console.log("\nBODY:\n" + email.text);
