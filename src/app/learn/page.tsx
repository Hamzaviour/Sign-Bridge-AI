"use client";

import { useState } from "react";
import { AvatarStage } from "@/components/AvatarStage";
import { HandGlyph } from "@/components/HandGlyph";
import { SpeedControl } from "@/components/SpeedControl";
import { getCharacter } from "@/lib/characters";
import { useCharacterId, useReducedMotion, useSignSpeed } from "@/lib/prefs";
import { ALPHABET, PHRASES, letterKeyframes } from "@/lib/signs";
import { useSignPlayer } from "@/lib/useSignPlayer";

const TILE_COLORS = ["#ff4fa3", "#fbbf24", "#a3e635", "#22d3ee", "#a78bfa", "#fb923c"];

export default function LearnPage() {
  const [charId] = useCharacterId();
  const c = getCharacter(charId);
  const reduced = useReducedMotion();
  const [speed] = useSignSpeed();
  const player = useSignPlayer(reduced, Number(speed));
  const [tab, setTab] = useState<"phrases" | "alphabet">("phrases");
  const [selected, setSelected] = useState<string | null>(null);

  const playPhrase = (g: string) => {
    const e = PHRASES.find((p) => p.gloss === g)!;
    setSelected(g);
    player.play([{ frames: e.frames, caption: e.gloss, kind: "sign" }]);
  };
  const playLetter = (l: string) => {
    setSelected(l);
    player.play([{ frames: letterKeyframes(l), caption: l, kind: "letter" }]);
  };
  const playAll = () => {
    setSelected(null);
    player.play(ALPHABET.map((l) => ({ frames: letterKeyframes(l), caption: l, kind: "letter" as const })));
  };

  return (
    <div className="pt-6">
      <h1 className="font-display text-4xl font-bold">Phrasebook</h1>
      <p className="text-muted">Tap a card and {c.name} will sign it. Stylised for learning; check with a Deaf teacher for the real thing.</p>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_1.15fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <AvatarStage character={c} pose={player.pose} current={player.current} playing={player.playing} className="aspect-square w-full" />
          <div className="mt-3 flex justify-center">
            <SpeedControl />
          </div>
        </div>

        <div>
          <div role="tablist" aria-label="Sign sets" className="sb-seg mb-4">
            {(["phrases", "alphabet"] as const).map((t) => (
              <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className="!min-h-10 !px-5">
                {t === "phrases" ? "Everyday signs" : "Alphabet A–Z"}
              </button>
            ))}
          </div>

          {tab === "phrases" ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {PHRASES.map((p, i) => {
                const col = TILE_COLORS[i % TILE_COLORS.length];
                return (
                  <button
                    key={p.gloss}
                    onClick={() => playPhrase(p.gloss)}
                    aria-pressed={selected === p.gloss}
                    className="sb-card group flex min-h-28 flex-col items-start justify-between p-4 text-left transition hover:-translate-y-1"
                    style={selected === p.gloss ? { boxShadow: `0 0 0 3px ${col}, 0 12px 40px -10px ${col}` } : undefined}
                  >
                    <span className="grid h-14 w-14 place-items-center rounded-2xl transition group-hover:scale-110" style={{ background: `color-mix(in oklab, ${col} 18%, transparent)` }}>
                      <HandGlyph shape={p.frames[p.frames.length - 1].R.shape} className="h-12 w-12" />
                    </span>
                    <span>
                      <span className="block font-display text-xl font-bold">{p.label}</span>
                      <span className="block font-mono text-xs" style={{ color: col }}>
                        {p.gloss}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <>
              <button className="sb-btn sb-btn-cool mb-4" onClick={playAll}>
                ▶ Spell the whole alphabet
              </button>
              <div className="grid grid-cols-6 gap-2 sm:grid-cols-7">
                {ALPHABET.map((l, i) => {
                  const col = TILE_COLORS[i % TILE_COLORS.length];
                  const active = player.current?.caption === l || selected === l;
                  return (
                    <button
                      key={l}
                      onClick={() => playLetter(l)}
                      className="aspect-square rounded-2xl font-display text-2xl font-bold transition hover:scale-105"
                      style={{ background: active ? col : `${col}22`, color: active ? "#1a0b2e" : "white", boxShadow: `inset 0 0 0 2px ${col}66` }}
                      aria-label={`Letter ${l}`}
                    >
                      {l}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
