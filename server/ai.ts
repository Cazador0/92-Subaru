import type { BookingInput } from "./email.ts";

/**
 * AI Booking Intelligence & Entity Research Briefing module.
 * Uses Google Gemini LLM (gemini-2.5-flash / GEMINI_API_KEY) to research
 * venue/entity context, crowd vibe, setlist recommendations, and suggested
 * band reply strategies.
 */
export async function generateBookingBrief(
  b: BookingInput,
): Promise<{ brief: string | null; error?: string }> {
  const rawKey = Deno.env.get("GEMINI_API_KEY");
  if (!rawKey) {
    return { brief: null, error: "GEMINI_API_KEY environment variable is not set on Vercel" };
  }
  const apiKey = rawKey.trim().replace(/^["']|["']$/g, "").trim();
  if (!apiKey) {
    return { brief: null, error: "GEMINI_API_KEY environment variable is empty" };
  }

  const prompt = `You are an executive booking manager and venue researcher for "'92 Subaru", a premier Dallas-Fort Worth '90s and early-2000s cover band (playing Goo Goo Dolls, Cranberries, Third Eye Blind, Oasis, Stone Temple Pilots, Green Day, Nirvana, Sublime, etc.).

Analyze this new booking inquiry submitted through the band's website:
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

  // Try v1beta and v1 endpoints across Gemini models (including Gemini 2.5 Pro & Flash)
  const models = [
    "gemini-2.5-pro",
    "gemini-2.5-flash",
    "gemini-2.0-pro-exp",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
    "gemini-pro",
  ];
  const apiVersions = ["v1beta", "v1"];
  const errors: string[] = [];

  for (const ver of apiVersions) {
    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/${ver}/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => "");
          const msg = `${ver}/${model} (${res.status}: ${errText.slice(0, 70)})`;
          errors.push(msg);
          console.warn(`[ai:gemini] ${msg}`);
          continue;
        }

        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return { brief: text.trim() };
      } catch (e) {
        errors.push(`${ver}/${model} (Err: ${String(e)})`);
      }
    }
  }

  // Diagnostic: Query available models for this key to diagnose 404
  let diagInfo = "";
  try {
    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const listRes = await fetch(listUrl);
    const listJson = await listRes.json().catch(() => null);
    if (listJson?.models) {
      const modelNames = listJson.models
        .map((m: { name?: string }) => (m.name || "").replace("models/", ""))
        .filter((n: string) => n.includes("flash") || n.includes("pro"))
        .slice(0, 5)
        .join(", ");
      diagInfo = ` (Key available models: [${modelNames}])`;
    } else if (listJson?.error) {
      diagInfo = ` (GCP Key Error: ${listJson.error.message})`;
    }
  } catch (e) {
    diagInfo = ` (List check err: ${String(e)})`;
  }

  return { brief: null, error: (errors.join(" | ") + diagInfo) };
}
