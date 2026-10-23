"use client";

import { useEffect } from "react";
import { Check } from "lucide-react";
import { CHARACTERS, type Character } from "@/lib/characters";
import { PHRASE_BY_GLOSS } from "@/lib/signs";
import { useSignPlayer } from "@/lib/useSignPlayer";
import { useCharacterId, useReducedMotion } from "@/lib/prefs";
import { AvatarStage } from "./AvatarStage";

const DEMOS = ["HELLO", "LOVE", "THANK-YOU", "GOODBYE", "GOOD", "WELCOME", "YES"];

/** One crew member: signs a greeting on a loop (paused for reduced motion); click to pick as your buddy. */
function CrewMember({ c, delay, sign, selected, onSelect }: { c: Character; delay: number; sign: string; selected: boolean; onSelect: () => void }) {
  const reduced = useReducedMotion();
  const { pose, current, playing, play } = useSignPlayer(reduced);

  const doSign = (g: string) => {
    const e = PHRASE_BY_GLOSS.get(g);
    if (e) play([{ frames: e.frames, caption: e.gloss, kind: "sign" }]);
  };

  useEffect(() => {
    if (reduced) return;
    let i = DEMOS.indexOf(sign);
    const first = setTimeout(() => doSign(sign), delay);
    const loop = setInterval(() => {
      i = (i + 1) % DEMOS.length;
      doSign(DEMOS[i]);
    }, 6400 + delay / 3);
    return () => {
      clearTimeout(first);
      clearInterval(loop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  return (
    <button
      onClick={() => {
        onSelect();
        doSign("HELLO");
      }}
      aria-pressed={selected}
      className="group block w-full rounded-[26px] text-left"
    >
      <div
        className="relative rounded-[26px] p-1 transition duration-300"
        style={{ background: selected ? `linear-gradient(140deg, ${c.aura}, ${c.outfitAccent})` : "transparent" }}
      >
        <AvatarStage character={c} pose={pose} current={current} playing={playing} compact className="aspect-[5/6] w-full transition duration-300 group-hover:-translate-y-1" />
        {selected && (
          <span className="sb-pop absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full px-3 py-1 text-xs font-black text-[#170c33]" style={{ background: c.aura }}>
            <Check className="h-3.5 w-3.5" aria-hidden strokeWidth={3} /> Your buddy
          </span>
        )}
      </div>
      <div className="mt-3 px-1">
        <div className="font-display text-xl font-bold" style={{ color: c.aura }}>
          {c.name}
        </div>
        <div className="text-sm leading-snug text-muted">{c.tagline}</div>
      </div>
    </button>
  );
}

export function CrewPicker() {
  const [id, setId] = useCharacterId();
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
      {CHARACTERS.map((c, i) => (
        <CrewMember
          key={c.id}
          c={c}
          delay={900 + i * 1100}
          sign={["GOODBYE", "GOOD", "WELCOME", "YES", "LOVE"][i]}
          selected={c.id === id}
          onSelect={() => setId(c.id)}
        />
      ))}
    </div>
  );
}
