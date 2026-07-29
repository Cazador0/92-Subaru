import type { BookingInput } from "./email.ts";

/**
 * Multi-Provider AI Booking Intelligence & Entity Research Briefing module.
 * Primary Provider: Groq Cloud API (GROQ_API_KEY — llama-3.3-70b-versatile — 30 req/min free tier)
 * Fallback Provider: Google Gemini API (GEMINI_API_KEY — gemini-2.0-flash)
 */
export async function generateBookingBrief(
  b: BookingInput,
): Promise<{ brief: string | null; error?: string; provider?: string }> {
  const groqKey = (Deno.env.get("GROQ_API_KEY") || "").trim().replace(/^["']|["']$/g, "");
  const geminiKey = (Deno.env.get("GEMINI_API_KEY") || "").trim().replace(/^["']|["']$/g, "");

  if (!groqKey && !geminiKey) {
    return {
      brief: null,
      error: "GROQ_API_KEY or GEMINI_API_KEY environment variable is missing on Vercel",
    };
  }

  const systemPrompt = `You are an executive booking manager and venue researcher for "'92 Subaru", a premier Dallas-Fort Worth '90s and early-2000s cover band (playing Goo Goo Dolls, Cranberries, Third Eye Blind, Oasis, Stone Temple Pilots, Green Day, Nirvana, Sublime, etc.).`;

  const userPrompt = `Analyze this new booking inquiry submitted through the band's website:
- Client Name: ${b.firstName} ${b.lastName}
- Client Email: ${b.email}
- Phone: ${b.phone || "Not provided"}
- Event Date: ${b.date}
- Event Type: ${b.type || "Not specified"}
- Venue / Location: ${b.location}
- Budget Range: ${b.budget || "Not specified"}
- Client Message: "${b.message}"

Please generate a concise, structured 3-part AI Booking Intelligence Briefing formatted in clean plain text ASCII:
1. 📍 VENUE / LOCATION & ENTITY RESEARCH: Provide background on the venue/location (${b.location}) or organization/client domain if recognizable (e.g., venue capacity, music history, city vibe, typical crowd).
2. 🎸 EVENT VIBE & RECOMMENDED SETLIST FOCUS: Suggest which songs/genres from '92 Subaru's repertoire (Alt-Rock, Pop, Grunge) will hit best for this specific gig/venue.
3. 💡 RECOMMENDED BAND REPLY STRATEGY: Provide 2-3 quick bullet points on how the band should respond to this client (e.g., pricing guidance, questions to ask, P.A. system needs).

Keep the briefing concise, actionable, professional, and formatted for an email body with bullet points.`;

  // 1. Try Groq Cloud API (Llama 3.3 70B Versatile) if GROQ_API_KEY is available
  if (groqKey) {
    const groqModels = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
    for (const model of groqModels) {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "authorization": `Bearer ${groqKey}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.5,
            max_tokens: 1000,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const text = data?.choices?.[0]?.message?.content;
          if (text) {
            return {
              brief: text.trim(),
              provider: `Groq Cloud (${model})`,
            };
          }
        } else {
          const errText = await res.text().catch(() => "");
          console.warn(`[ai:groq] Model ${model} HTTP ${res.status}: ${errText.slice(0, 100)}`);
        }
      } catch (e) {
        console.warn(`[ai:groq] Error calling ${model}:`, e);
      }
    }
  }

  // 2. Fallback to Google Gemini API (gemini-2.0-flash) if GEMINI_API_KEY is available
  if (geminiKey) {
    const model = "gemini-2.0-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            return {
              brief: text.trim(),
              provider: `Google Gemini (${model})`,
            };
          }
        }

        const errText = await res.text().catch(() => "");
        console.warn(`[ai:gemini] Attempt ${attempt} HTTP ${res.status}: ${errText.slice(0, 100)}`);

        if (res.status === 429 && attempt === 1) {
          await new Promise((r) => setTimeout(r, 2500));
          continue;
        }

        if (res.status === 429) {
          return {
            brief: null,
            error: "Gemini API free-tier rate limit active — please wait ~60 seconds or set GROQ_API_KEY on Vercel.",
          };
        }

        return { brief: null, error: `Gemini HTTP ${res.status}: ${errText.slice(0, 150)}` };
      } catch (e) {
        if (attempt === 1) {
          await new Promise((r) => setTimeout(r, 2500));
          continue;
        }
        return { brief: null, error: `Gemini network error: ${String(e)}` };
      }
    }
  }

  return { brief: null, error: "AI Briefing generation failed on all available providers" };
}
