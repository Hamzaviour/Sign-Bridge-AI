/** Offline gloss -> English used when no LLM is configured. Deliberately simple. */
export function glossToSentenceRules(tokens: string[]): string {
  const map: Record<string, string> = {
    HELLO: "hello",
    "THANK-YOU": "thank you",
    ME: "I",
    MY: "my",
    YOU: "you",
    NAME: "name",
    LOVE: "love",
    GOODBYE: "goodbye",
  };
  const words = tokens.map((t) => map[t] ?? (t.length > 1 && /^[A-Z]+$/.test(t) ? t[0] + t.slice(1).toLowerCase() : t.toLowerCase()));
  let s = words.join(" ");
  s = s.replace(/\bmy name ([a-z]+)/i, (_, n: string) => `my name is ${n[0].toUpperCase()}${n.slice(1)}`);
  s = s.replace(/\bnice meet you\b/i, ", nice to meet you");
  s = s.replace(/^hello\b(?!,)/i, "hello,").replace(/\s+,/g, ",");
  s = s.replace(/^i love you$/i, "I love you");
  if (!s) return "";
  return s[0].toUpperCase() + s.slice(1) + (/[.!?]$/.test(s) ? "" : ".");
}
