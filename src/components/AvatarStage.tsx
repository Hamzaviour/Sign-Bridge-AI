"use client";

import type { Character } from "@/lib/characters";
import type { BodyPose, PlayItem } from "@/lib/useSignPlayer";
import { Avatar } from "./Avatar";

export function AvatarStage({
  character: c,
  pose,
  current,
  playing,
  className,
  compact,
}: {
  character: Character;
  pose: BodyPose;
  current: PlayItem | null;
  playing: boolean;
  className?: string;
  compact?: boolean;
}) {
  const question = current?.caption === "WHAT" || current?.caption === "HOW";
  return (
    <div
      className={`relative overflow-hidden rounded-[28px] ${className ?? ""}`}
      style={{
        background: `radial-gradient(circle at 50% 38%, ${c.aura}55 0%, ${c.aura}18 38%, transparent 70%), linear-gradient(180deg, #1b1040, #0f0a26)`,
      }}
    >
      {/* stage rings */}
      <div aria-hidden className="absolute left-1/2 top-[44%] h-[70%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed opacity-30 sb-float" style={{ borderColor: c.aura }} />
      <div aria-hidden className="absolute bottom-0 left-1/2 h-10 w-2/3 -translate-x-1/2 rounded-[100%] blur-xl" style={{ background: `${c.aura}66` }} />

      <Avatar character={c} pose={pose} talking={playing} question={question} glow={playing ? c.aura : undefined} className="relative mx-auto h-full w-full" />

      {!compact && (
        <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/45 px-3 py-1 text-sm font-bold backdrop-blur">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.aura, boxShadow: `0 0 10px ${c.aura}` }} />
          {c.name}
        </div>
      )}

      {current && (
        <div key={current.caption + (current.word ?? "")} className="sb-pop absolute right-4 top-4 rounded-3xl px-4 py-2 text-center font-display font-bold text-[#1a0b2e] shadow-xl" style={{ background: c.aura }}>
          {current.kind === "letter" ? (
            <span className="block text-5xl leading-none">{current.caption}</span>
          ) : (
            <span className="block text-xl">{current.caption}</span>
          )}
          <span className="block text-[10px] font-black uppercase tracking-widest opacity-70">{current.kind === "letter" ? "fingerspell" : "sign"}</span>
        </div>
      )}
    </div>
  );
}
