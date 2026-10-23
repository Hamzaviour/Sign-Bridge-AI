"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Delete, Hand, Loader2, MessagesSquare, Mic, RotateCcw, Send, Square, Volume2 } from "lucide-react";
import { HandCam } from "@/components/HandCam";
import { AvatarStage } from "@/components/AvatarStage";
import { HandGlyph } from "@/components/HandGlyph";
import { SpeedControl } from "@/components/SpeedControl";
import { getCharacter } from "@/lib/characters";
import { useDataset } from "@/lib/datasetStore";
import { useCaptionSize, useCharacterId, useReducedMotion, useSignSpeed } from "@/lib/prefs";
import { speak, useSpeechToText } from "@/lib/speech";
import { sfx } from "@/lib/sfx";
import { textToPlaylist, useSignPlayer } from "@/lib/useSignPlayer";
import { PHRASE_BY_GLOSS, textToGloss } from "@/lib/signs";

interface Line {
  id: number;
  who: "signer" | "speaker";
  text: string;
  detail?: string;
  at: string;
}

const CAPTION_CLASS = { m: "text-xl", l: "text-3xl", xl: "text-5xl" } as const;
const QUICK = ["HELLO", "ME", "MY", "NAME", "NICE", "MEET", "YOU", "THANK-YOU", "PLEASE", "YES", "NO", "HELP"];
const now = () => new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

export default function CallPage() {
  const [charId] = useCharacterId();
  const c = getCharacter(charId);
  const reduced = useReducedMotion();
  const [speed] = useSignSpeed();
  const [capSize, setCapSize] = useCaptionSize();
  const player = useSignPlayer(reduced, Number(speed));
  const dataset = useDataset();

  // signer side
  const [tokens, setTokens] = useState<string[]>([]);
  const [spelling, setSpelling] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastSaid, setLastSaid] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const nextId = useRef(1);

  const flushSpelling = useCallback((cur: string, toks: string[]) => (cur ? [...toks, cur] : toks), []);

  const onCommit = useCallback((label: string) => {
    sfx.tick();
    if (label === "␣") {
      setSpelling((cur) => {
        if (cur) setTokens((t) => [...t, cur]);
        return "";
      });
      return;
    }
    setSpelling((s) => s + label);
  }, []);

  const addLine = (l: Omit<Line, "id" | "at">) => setLines((ls) => [...ls, { ...l, id: nextId.current++, at: now() }].slice(-40));

  const translate = async () => {
    const all = flushSpelling(spelling, tokens);
    if (!all.length) return;
    setBusy(true);
    try {
      const res = await fetch("/api/gloss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokens: all }),
      });
      const data = (await res.json()) as { sentence: string; source: string };
      setLastSaid(data.sentence);
      addLine({ who: "signer", text: data.sentence, detail: `${all.join(" ")} · ${data.source === "llm" ? "polished by AI" : "offline rules"}` });
      speak(data.sentence);
      setTokens([]);
      setSpelling("");
    } catch {
      setLastSaid("Couldn't reach the translator. Your signs are still here, so try again.");
    } finally {
      setBusy(false);
    }
  };

  const backspace = () => (spelling ? setSpelling((s) => s.slice(0, -1)) : setTokens((t) => t.slice(0, -1)));
  const clearDraft = () => {
    setTokens([]);
    setSpelling("");
  };

  // speaker side
  const [typed, setTyped] = useState("");
  const [signingText, setSigningText] = useState("");
  const signText = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      setSigningText(text);
      addLine({ who: "speaker", text, detail: textToGloss(text).map((t) => (t.kind === "sign" ? t.gloss : t.word.split("").join("-"))).join(" ") });
      player.play(textToPlaylist(text));
    },
    [player],
  );
  const stt = useSpeechToText(signText);

  const glossWords = useMemo(() => textToGloss(signingText), [signingText]);
  const activeWord = player.current?.word;

  const logRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: reduced ? "auto" : "smooth" });
  }, [lines, reduced]);

  const hasDraft = tokens.length > 0 || spelling.length > 0;

  return (
    <div className="pt-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Live call</h1>
          <p className="mt-1 text-muted">Sign on the left to be heard. Speak on the right and {c.name} signs it.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2" role="group" aria-label="Caption size">
            <span className="text-sm font-bold text-faint">Captions</span>
            <div className="sb-seg">
              {(["m", "l", "xl"] as const).map((s) => (
                <button key={s} onClick={() => setCapSize(s)} aria-pressed={capSize === s} aria-label={`Caption size ${s === "m" ? "medium" : s === "l" ? "large" : "extra large"}`}>
                  <span style={{ fontSize: s === "m" ? 12 : s === "l" ? 15 : 18 }}>A</span>
                </button>
              ))}
            </div>
          </div>
          <SpeedControl />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* SIGNER */}
        <section aria-labelledby="signer-h" className="sb-card flex flex-col gap-4 p-4 sm:p-5">
          <header className="flex items-center justify-between gap-3">
            <h2 id="signer-h" className="flex items-center gap-2.5 font-display text-2xl font-bold">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-pink/15 text-pink">
                <Hand className="h-5 w-5" aria-hidden />
              </span>
              You sign
            </h2>
            <span className="text-right text-sm text-faint">Hold a letter · open hand = space</span>
          </header>

          <HandCam dataset={dataset} onCommit={onCommit} className="aspect-[4/3] w-full" />

          <div className="sb-well p-4" aria-live="polite">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-[0.14em] text-amber">Your message</span>
              {hasDraft && (
                <button onClick={clearDraft} className="min-h-8 px-1 text-xs font-bold text-faint underline-offset-4 hover:text-ink hover:underline">
                  Clear
                </button>
              )}
            </div>
            <div className={`flex min-h-14 flex-wrap items-center gap-2 font-display font-bold ${CAPTION_CLASS[capSize]}`}>
              {!hasDraft && <span className="text-base font-semibold text-faint">Fingerspell or tap a quick sign below to start.</span>}
              {tokens.map((t, i) => (
                <span key={i} className="sb-pop rounded-2xl bg-pink/20 px-3 py-0.5 text-ink">
                  {t}
                </span>
              ))}
              {spelling && (
                <span className="flex gap-0.5">
                  {spelling.split("").map((ch, i) => (
                    <span key={i} className="sb-pop grid min-w-[1.3em] place-items-center rounded-lg bg-amber/20 px-1 text-amber">
                      {ch}
                    </span>
                  ))}
                </span>
              )}
              {hasDraft && <span className="inline-block w-[3px] animate-pulse rounded bg-amber" style={{ height: "1em" }} aria-hidden />}
            </div>
            {lastSaid && !hasDraft && (
              <p className="mt-3 flex items-start gap-2 border-t border-line pt-3 text-ink/90">
                <Volume2 className="mt-1 h-4 w-4 shrink-0 text-lime" aria-hidden />
                <span className={capSize === "xl" ? "text-2xl" : "text-lg"}>{lastSaid}</span>
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button className="sb-btn sb-btn-primary flex-1" disabled={busy || !hasDraft} onClick={translate}>
              {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Volume2 aria-hidden />}
              {busy ? "Translating…" : "Translate & speak"}
            </button>
            <button className="sb-btn sb-btn-ghost" onClick={() => onCommit("␣")} disabled={!spelling}>
              Space
            </button>
            <button className="sb-btn sb-btn-ghost px-4" onClick={backspace} disabled={!hasDraft} aria-label="Delete last letter or word">
              <Delete aria-hidden />
            </button>
          </div>

          <div>
            <div className="mb-2 text-sm font-bold text-faint">Quick signs</div>
            <div className="flex flex-wrap gap-2">
              {QUICK.map((g) => {
                const e = PHRASE_BY_GLOSS.get(g);
                const k = e?.frames[e.frames.length - 1];
                return (
                  <button
                    key={g}
                    onClick={() => {
                      setTokens((t) => flushSpelling(spelling, t).concat(g));
                      setSpelling("");
                    }}
                    className="sb-chip pl-1.5 text-sm"
                  >
                    {k && (
                      <span className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-pink/15">
                        <HandGlyph shape={k.R.shape} className="h-8 w-8 translate-y-0.5" />
                      </span>
                    )}
                    {e?.label ?? g}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* SPEAKER */}
        <section aria-labelledby="speaker-h" className="sb-card flex flex-col gap-4 p-4 sm:p-5">
          <header className="flex items-center justify-between gap-3">
            <h2 id="speaker-h" className="flex items-center gap-2.5 font-display text-2xl font-bold">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan/15 text-cyan">
                <Mic className="h-5 w-5" aria-hidden />
              </span>
              They speak
            </h2>
            {stt.listening ? (
              <span className="flex items-center gap-2 text-sm font-bold text-cyan">
                <span className="sb-bars flex h-4 items-end gap-[3px]" aria-hidden>
                  <span />
                  <span />
                  <span />
                  <span />
                </span>
                Listening
              </span>
            ) : (
              <span className="text-sm text-faint">{c.name} signs it back</span>
            )}
          </header>

          <AvatarStage character={c} pose={player.pose} current={player.current} playing={player.playing} className="aspect-[4/3] w-full" />

          <div className="sb-well p-4" aria-live="polite">
            <div className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-cyan">Captions</div>
            <p className={`min-h-14 font-display font-bold leading-tight ${CAPTION_CLASS[capSize]}`}>
              {stt.interim ? (
                <span className="text-ink/70">{stt.interim}</span>
              ) : signingText ? (
                signingText
              ) : (
                <span className="text-base font-semibold text-faint">Press the mic and talk, or type below. {c.name} will sign it.</span>
              )}
            </p>
            {signingText && !stt.interim && (
              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-3" aria-label="Signed as">
                {glossWords.map((t, i) => (
                  <span
                    key={i}
                    className="rounded-full px-2.5 py-0.5 font-mono text-sm font-bold transition-colors"
                    style={activeWord === i ? { background: c.aura, color: "#170c33" } : { background: "var(--sb-surface-2)", color: "var(--sb-muted)" }}
                  >
                    {t.kind === "sign" ? t.gloss : t.word.split("").join("-")}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {stt.supported ? (
              <button className={`sb-btn flex-1 ${stt.listening ? "sb-btn-primary" : "sb-btn-cool"}`} onClick={stt.listening ? stt.stop : stt.start} aria-pressed={stt.listening}>
                {stt.listening ? <Square aria-hidden fill="currentColor" /> : <Mic aria-hidden />}
                {stt.listening ? "Stop listening" : "Start listening"}
              </button>
            ) : (
              <p className="flex-1 rounded-2xl bg-amber/10 px-4 py-3 text-sm text-amber">Speech recognition needs Chrome or Edge. You can still type below.</p>
            )}
            {player.playing ? (
              <button className="sb-btn sb-btn-ghost" onClick={player.stop}>
                <Square aria-hidden /> Stop signing
              </button>
            ) : (
              signingText && (
                <button className="sb-btn sb-btn-ghost" onClick={() => player.play(textToPlaylist(signingText))}>
                  <RotateCcw aria-hidden /> Replay
                </button>
              )
            )}
          </div>
          {stt.error && <p className="text-sm text-[color:var(--sb-danger)]">Microphone problem ({stt.error}). Check the browser&apos;s mic permission and try again.</p>}
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              signText(typed);
              setTyped("");
            }}
          >
            <label htmlFor="type-to-sign" className="sr-only">
              Type a message to sign
            </label>
            <input
              id="type-to-sign"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Type: nice to meet you"
              maxLength={120}
              className="min-h-[52px] min-w-0 flex-1 rounded-full border border-line bg-[#0c0720] px-5 text-lg text-ink placeholder:text-faint focus:border-cyan focus:outline-none"
            />
            <button className="sb-btn sb-btn-ghost px-4" type="submit" disabled={!typed.trim()} aria-label="Sign it">
              <Send aria-hidden />
            </button>
          </form>
        </section>
      </div>

      <section aria-labelledby="log-h" className="sb-card mt-5 p-4 sm:p-5">
        <h2 id="log-h" className="mb-4 flex items-center gap-2.5 font-display text-2xl font-bold">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet/15 text-violet">
            <MessagesSquare className="h-5 w-5" aria-hidden />
          </span>
          Conversation
        </h2>
        <div ref={logRef} className="flex max-h-96 flex-col gap-3 overflow-y-auto pr-1" aria-live="polite">
          {lines.length === 0 && <p className="py-6 text-center text-faint">Nothing said yet. Fingerspell your name, or say hello.</p>}
          {lines.map((l) => {
            const signer = l.who === "signer";
            return (
              <div
                key={l.id}
                className={`sb-rise max-w-[85%] rounded-3xl px-5 py-3 ${signer ? "self-start rounded-bl-md" : "self-end rounded-br-md"}`}
                style={{ background: signer ? "color-mix(in oklab, var(--sb-pink) 22%, var(--sb-surface-2))" : "color-mix(in oklab, var(--sb-cyan) 18%, var(--sb-surface-2))" }}
              >
                <div className="flex items-center gap-1.5 text-xs font-black text-ink/70">
                  {signer ? <Hand className="h-3.5 w-3.5" aria-hidden /> : <Mic className="h-3.5 w-3.5" aria-hidden />}
                  {signer ? "Signed" : "Spoken"} · {l.at}
                </div>
                <div className={`mt-0.5 font-display font-bold leading-snug ${capSize === "xl" ? "text-3xl" : "text-2xl"}`}>{l.text}</div>
                {l.detail && <div className="mt-1 font-mono text-xs text-ink/60">{l.detail}</div>}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
