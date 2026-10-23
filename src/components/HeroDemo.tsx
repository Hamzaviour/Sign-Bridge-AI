"use client";

import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { getCharacter } from "@/lib/characters";
import { useCharacterId, useReducedMotion, useSignSpeed } from "@/lib/prefs";
import { textToGloss } from "@/lib/signs";
import { textToPlaylist, useSignPlayer } from "@/lib/useSignPlayer";
import { AvatarStage } from "./AvatarStage";
import { SpeedControl } from "./SpeedControl";

const SUGGESTIONS = ["Nice to meet you", "My name is Ava", "Thank you", "I love you", "Can you help me please"];

/** Try-it-now: type something and your buddy signs it, no camera needed. */
export function HeroDemo() {
  const [charId] = useCharacterId();
  const c = getCharacter(charId);
  const reduced = useReducedMotion();
  const [speed] = useSignSpeed();
  const player = useSignPlayer(reduced, Number(speed));
  const [text, setText] = useState("");
  const [shown, setShown] = useState("Hello");

  const sign = (t: string) => {
    if (!t.trim()) return;
    setShown(t);
    player.play(textToPlaylist(t));
  };

  useEffect(() => {
    if (reduced) return;
    const t = setTimeout(() => player.play(textToPlaylist("hello")), 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const gloss = textToGloss(shown);

  return (
    <div className="sb-card p-3 sm:p-4">
      <AvatarStage character={c} pose={player.pose} current={player.current} playing={player.playing} className="aspect-[6/5] w-full" />

      <div className="mt-3 flex min-h-8 flex-wrap items-center gap-1.5 px-1" aria-label="Signed as">
        {gloss.map((t, i) => (
          <span
            key={i}
            className="rounded-full px-2.5 py-0.5 font-mono text-[13px] font-bold transition-colors"
            style={player.current?.word === i ? { background: c.aura, color: "#170c33" } : { background: "var(--sb-surface-2)", color: "var(--sb-muted)" }}
          >
            {t.kind === "sign" ? t.gloss : t.word.split("").join("-")}
          </span>
        ))}
      </div>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          sign(text);
        }}
      >
        <label htmlFor="hero-try" className="sr-only">
          Type something for {c.name} to sign
        </label>
        <input
          id="hero-try"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Type anything for ${c.name} to sign…`}
          maxLength={80}
          className="min-h-[52px] min-w-0 flex-1 rounded-full border border-line bg-[#0c0720] px-5 text-base text-ink placeholder:text-faint focus:border-pink focus:outline-none"
        />
        <button type="submit" className="sb-btn sb-btn-primary px-5" disabled={!text.trim()} aria-label="Sign it">
          <Play aria-hidden fill="currentColor" />
          <span className="hidden sm:inline">Sign it</span>
        </button>
      </form>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => {
                setText(s);
                sign(s);
              }}
              className="rounded-full border border-line px-3 py-1.5 text-sm font-bold text-muted transition hover:border-pink hover:text-ink"
            >
              {s}
            </button>
          ))}
        </div>
        <SpeedControl />
      </div>
    </div>
  );
}
