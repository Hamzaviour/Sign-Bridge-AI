"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { HandCam } from "@/components/HandCam";
import { AvatarStage } from "@/components/AvatarStage";
import { Confetti } from "@/components/Confetti";
import { getCharacter } from "@/lib/characters";
import { RULE_LETTERS, type Prediction } from "@/lib/classifier";
import { useDataset } from "@/lib/datasetStore";
import { usePref, useCharacterId, useReducedMotion, useSignSpeed } from "@/lib/prefs";
import { sfx } from "@/lib/sfx";
import { letterKeyframes } from "@/lib/signs";
import { useSignPlayer } from "@/lib/useSignPlayer";

const CHEERS = ["Nailed it!", "Beautiful!", "Yes!!", "So clean!", "Perfect form!", "You're on fire!"];

export default function PracticePage() {
  const [charId] = useCharacterId();
  const c = getCharacter(charId);
  const reduced = useReducedMotion();
  const [speed] = useSignSpeed();
  const player = useSignPlayer(reduced, Number(speed));
  const dataset = useDataset();

  const pool = useMemo(() => {
    const trained = Object.keys(dataset).filter((k) => /^[A-Z]$/.test(k) && dataset[k].length >= 5);
    return Array.from(new Set([...RULE_LETTERS, ...trained])).sort();
  }, [dataset]);

  const [target, setTarget] = useState("A");
  const [xpRaw, setXp] = usePref<string>("signbridge.xp", "0");
  const xp = Number(xpRaw) || 0;
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [win, setWin] = useState(0);
  const [cheer, setCheer] = useState("");
  const [live, setLive] = useState<Prediction | null>(null);

  const demo = useCallback(
    (l: string) => player.play([{ frames: letterKeyframes(l), caption: l, kind: "letter" }, { frames: letterKeyframes(l), caption: l, kind: "letter" }]),
    [player],
  );

  const next = useCallback(() => {
    setTarget((cur) => {
      const options = pool.filter((l) => l !== cur);
      const n = options[Math.floor(Math.random() * options.length)] ?? cur;
      setTimeout(() => demo(n), 50);
      return n;
    });
  }, [pool, demo]);

  useEffect(() => {
    const t = setTimeout(() => demo(target), 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCommit = useCallback(
    (label: string) => {
      if (label !== target) return;
      setWin((w) => w + 1);
      if (Math.floor((xp + 10 + streak * 2) / 100) > Math.floor(xp / 100)) sfx.fanfare();
      else sfx.success();
      setCheer(CHEERS[Math.floor(Math.random() * CHEERS.length)]);
      setXp(String(xp + 10 + streak * 2));
      setStreak((s) => {
        setBest((b) => Math.max(b, s + 1));
        return s + 1;
      });
      setTimeout(next, 1100);
    },
    [target, next, setXp, xp, streak],
  );

  const level = Math.floor(xp / 100) + 1;
  const levelPct = (xp % 100) / 100;
  const close = live && live.label !== target ? live.label : null;

  return (
    <div className="pt-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold">Practice fingerspelling</h1>
          <p className="text-muted">Copy {c.name}&apos;s handshape and hold it steady until the ring fills.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Stat label="Level" value={level} color="#a78bfa">
            <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400" style={{ width: `${levelPct * 100}%` }} />
            </div>
          </Stat>
          <Stat label="XP" value={xp} color="#fbbf24" />
          <Stat label="Streak" value={`${streak}🔥`} color="#ff4fa3" />
          <Stat label="Best" value={best} color="#22d3ee" />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="sb-card relative flex flex-col gap-4 p-4" aria-label="Target letter">
          <AvatarStage character={c} pose={player.pose} current={player.current} playing={player.playing} className="aspect-[4/3] w-full" />
          <div className="flex items-center gap-4">
            <div className="relative grid h-28 w-28 shrink-0 place-items-center rounded-[28px] font-display text-7xl font-bold text-[#1a0b2e]" style={{ background: `linear-gradient(135deg, ${c.aura}, #fbbf24)` }}>
              {target}
              {win > 0 && <Confetti key={win} />}
            </div>
            <div className="flex-1">
              <div className="text-sm font-black uppercase tracking-widest text-muted">Sign this letter</div>
              <div className="font-display text-2xl font-bold" aria-live="assertive">
                {cheer && win ? <span className="sb-pop inline-block text-lime-300">{cheer}</span> : close ? <span className="text-amber-200">I see “{close}”. Adjust your hand.</span> : "Show me your hand"}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="sb-btn sb-btn-ghost" onClick={() => demo(target)}>
                  ↻ Show again
                </button>
                <button
                  className="sb-btn sb-btn-ghost"
                  onClick={() => {
                    setStreak(0);
                    next();
                  }}
                >
                  Skip
                </button>
              </div>
            </div>
          </div>
          <div>
            <div className="mb-2 text-sm font-bold text-muted">Pick a letter</div>
            <div className="flex flex-wrap gap-1.5">
              {pool.map((l) => (
                <button
                  key={l}
                  onClick={() => {
                    setTarget(l);
                    demo(l);
                  }}
                  aria-pressed={l === target}
                  className={`h-11 w-11 rounded-xl font-display text-xl font-bold ${l === target ? "bg-white text-black" : "bg-white/10 hover:bg-white/20"}`}
                >
                  {l}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">Only letters the recognizer knows are listed. Train more on the Train page.</p>
          </div>
        </section>

        <section className="sb-card flex flex-col gap-4 p-4" aria-label="Your camera">
          <HandCam dataset={dataset} onCommit={onCommit} onPrediction={setLive} holdMs={700} className="aspect-[4/3] w-full" label="Your turn" />
          <div className="rounded-3xl bg-black/50 p-4 text-white/85">
            <h2 className="font-display text-xl font-bold">Tips</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Keep your whole hand in frame, palm facing the camera.</li>
              <li>Good light helps the skeleton glow brighter (higher confidence).</li>
              <li>The avatar mirrors you: use the hand on the same side of the screen.</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, color, children }: { label: string; value: React.ReactNode; color: string; children?: React.ReactNode }) {
  return (
    <div className="sb-card min-w-24 px-4 py-2" style={{ boxShadow: `inset 0 0 0 1px ${color}55` }}>
      <div className="text-xs font-black uppercase tracking-widest" style={{ color }}>
        {label}
      </div>
      <div className="font-display text-2xl font-bold">{value}</div>
      {children}
    </div>
  );
}
