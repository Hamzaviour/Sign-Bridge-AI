import Anthropic from "@anthropic-ai/sdk";
import { glossToSentenceRules } from "@/lib/glossFallback";

const SYSTEM = `You turn ASL gloss sequences produced by a sign recognizer into one short, natural English sentence.
Input tokens are either glosses (e.g. HELLO, THANK-YOU, ME, NAME) or fingerspelled words in capitals (e.g. SAM).
Fingerspelled words may contain recognition typos; fix obvious ones but keep proper names.
Respond with the sentence only: no quotes, no explanation.`;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { tokens?: unknown };
  const tokens = Array.isArray(body.tokens) ? body.tokens.filter((t): t is string => typeof t === "string").slice(0, 60) : [];
  if (!tokens.length) return Response.json({ sentence: "", source: "none" });

  const fallback = () => Response.json({ sentence: glossToSentenceRules(tokens), source: "rules" });
  const model = process.env.LLM_MODEL;
  if (!model || (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN)) return fallback();

  try {
    const client = new Anthropic();
    const params = {
      model,
      max_tokens: 1024,
      output_config: { effort: "low" },
      // re-run on a fallback model if a safety classifier declines
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM,
      messages: [{ role: "user", content: tokens.join(" ") }],
    } as unknown as Anthropic.Beta.Messages.MessageCreateParamsNonStreaming;
    const msg = await client.beta.messages.create(params);
    if (msg.stop_reason === "refusal") return fallback();
    const text = msg.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim();
    return text ? Response.json({ sentence: text, source: "llm" }) : fallback();
  } catch (err) {
    if (err instanceof Anthropic.APIError) console.error("gloss: LLM API error", err.status, err.message);
    else console.error("gloss: request failed", err);
    return fallback();
  }
}
