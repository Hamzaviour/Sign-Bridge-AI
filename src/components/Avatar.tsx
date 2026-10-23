"use client";

import { memo } from "react";
import type { Character } from "@/lib/characters";
import type { Finger, HandPose } from "@/lib/signs";
import type { BodyPose } from "@/lib/useSignPlayer";

const SHOULDER_R = { x: 108, y: 206 };
const SHOULDER_L = { x: 192, y: 206 };
const UPPER = 62;
const FORE = 58;

const rad = (d: number) => (d * Math.PI) / 180;

/** Two-bone IK: returns elbow position for a shoulder reaching a wrist target. */
function solveElbow(sh: { x: number; y: number }, tx: number, ty: number, side: -1 | 1) {
  const dx = tx - sh.x;
  const dy = ty - sh.y;
  const d = Math.min(Math.max(Math.hypot(dx, dy), 8), UPPER + FORE - 0.5);
  const base = Math.atan2(dy, dx);
  const cos = (UPPER * UPPER + d * d - FORE * FORE) / (2 * UPPER * d);
  const a = Math.acos(Math.max(-1, Math.min(1, cos)));
  const c1 = { x: sh.x + UPPER * Math.cos(base + a), y: sh.y + UPPER * Math.sin(base + a) };
  const c2 = { x: sh.x + UPPER * Math.cos(base - a), y: sh.y + UPPER * Math.sin(base - a) };
  // prefer the elbow that hangs lower and away from the body
  const score = (p: { x: number; y: number }) => p.y + side * (p.x - sh.x) * 0.9;
  const elbow = score(c1) > score(c2) ? c1 : c2;
  const reach = Math.hypot(dx, dy);
  const wrist =
    reach > UPPER + FORE - 0.5
      ? { x: sh.x + (dx / reach) * (UPPER + FORE - 0.5), y: sh.y + (dy / reach) * (UPPER + FORE - 0.5) }
      : { x: tx, y: ty };
  return { elbow, wrist };
}

const FINGERS: { key: "index" | "middle" | "ring" | "pinky"; x: number; prox: number; dist: number; w: number }[] = [
  { key: "pinky", x: -8.2, prox: 9, dist: 8, w: 5.6 },
  { key: "ring", x: -2.8, prox: 12, dist: 10, w: 6.2 },
  { key: "middle", x: 2.8, prox: 13.5, dist: 11, w: 6.4 },
  { key: "index", x: 8.2, prox: 12, dist: 10, w: 6.2 },
];

function fingerPath(bx: number, by: number, prox: number, dist: number, fg: Finger) {
  const a0 = rad(fg.spread);
  const pl = prox * (1 - 0.55 * fg.curl);
  const x1 = bx + pl * Math.sin(a0);
  const y1 = by - pl * Math.cos(a0);
  const a1 = a0 - rad(fg.curl * 165);
  const dl = dist * (1 - 0.25 * fg.curl);
  const x2 = x1 + dl * Math.sin(a1);
  const y2 = y1 - dl * Math.cos(a1);
  return `M${bx.toFixed(1)} ${by.toFixed(1)} L${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

export function Hand({
  pose,
  mirror,
  skin,
  shade,
  glow,
}: {
  pose: HandPose;
  mirror: boolean;
  skin: string;
  shade: string;
  glow?: string;
}) {
  const s = pose.shape;
  const ta = rad(s.thumbAngle);
  const tb = { x: 11, y: -7 };
  const t1 = { x: tb.x + 10 * Math.sin(ta), y: tb.y - 10 * Math.cos(ta) };
  const ta2 = ta - rad(s.thumbCurl * 70);
  const t2 = { x: t1.x + 9 * Math.sin(ta2), y: t1.y - 9 * Math.cos(ta2) };
  const scale = (pose.scale ?? 1) * 1.15;
  return (
    <g
      transform={`translate(${pose.x.toFixed(1)} ${pose.y.toFixed(1)}) scale(${mirror ? -scale : scale} ${scale}) rotate(${pose.rot.toFixed(1)})`}
      style={glow ? { filter: `drop-shadow(0 0 6px ${glow})` } : undefined}
    >
      <rect x={-13.5} y={-26} width={27} height={28} rx={10} fill={shade} />
      <rect x={-12.5} y={-25} width={25} height={26} rx={9} fill={skin} />
      {FINGERS.map((fd) => (
        <g key={fd.key}>
          <path d={fingerPath(fd.x, -23, fd.prox, fd.dist, s[fd.key])} stroke={shade} strokeWidth={fd.w + 1.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d={fingerPath(fd.x, -23, fd.prox, fd.dist, s[fd.key])} stroke={skin} strokeWidth={fd.w} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>
      ))}
      <path d={`M${tb.x} ${tb.y} L${t1.x.toFixed(1)} ${t1.y.toFixed(1)} L${t2.x.toFixed(1)} ${t2.y.toFixed(1)}`} stroke={shade} strokeWidth={8.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d={`M${tb.x} ${tb.y} L${t1.x.toFixed(1)} ${t1.y.toFixed(1)} L${t2.x.toFixed(1)} ${t2.y.toFixed(1)}`} stroke={skin} strokeWidth={6.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </g>
  );
}

function Arm({
  pose,
  side,
  c,
  glow,
}: {
  pose: HandPose;
  side: -1 | 1;
  c: Character;
  glow?: string;
}) {
  const sh = side === -1 ? SHOULDER_R : SHOULDER_L;
  const { elbow, wrist } = solveElbow(sh, pose.x, pose.y, side);
  const d = `M${sh.x} ${sh.y} L${elbow.x.toFixed(1)} ${elbow.y.toFixed(1)} L${wrist.x.toFixed(1)} ${wrist.y.toFixed(1)}`;
  return (
    <g>
      <path d={d} stroke="rgba(10,4,30,.55)" strokeWidth={25} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d={d} stroke={c.outfit} strokeWidth={21} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d={d} stroke="rgba(255,255,255,.18)" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" fill="none" transform="translate(-3 -3)" />
      <circle cx={wrist.x} cy={wrist.y} r={9} fill={c.outfitAccent} />
      <Hand pose={{ ...pose, x: wrist.x, y: wrist.y }} mirror={side === 1} skin={c.skin} shade={c.skinShade} glow={glow} />
    </g>
  );
}

function Hair({ c, back }: { c: Character; back: boolean }) {
  const h = c.hair;
  switch (c.hairStyle) {
    case "bun":
      return back ? (
        <g>
          <circle cx={150} cy={58} r={22} fill={h} />
          <circle cx={150} cy={58} r={8} fill="rgba(255,255,255,.18)" />
        </g>
      ) : (
        <path d="M100 116 C96 70 128 62 150 64 C178 62 206 74 200 118 C190 98 172 88 150 92 C130 86 110 98 100 116 Z" fill={h} />
      );
    case "curly":
      return back ? null : (
        <g fill={h}>
          {[
            [108, 96, 16],
            [122, 78, 17],
            [142, 70, 17],
            [162, 70, 17],
            [181, 79, 17],
            [194, 97, 16],
            [100, 114, 11],
            [200, 114, 11],
          ].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} />
          ))}
        </g>
      );
    case "spacebuns":
      return back ? (
        <g fill={h}>
          <circle cx={108} cy={70} r={20} />
          <circle cx={192} cy={70} r={20} />
        </g>
      ) : (
        <path d="M100 118 C98 76 124 66 150 66 C176 66 202 76 200 118 C188 100 168 92 150 96 C132 92 112 100 100 118 Z" fill={h} />
      );
    case "bob":
      return back ? (
        <path d="M94 120 C90 74 120 62 150 62 C180 62 210 74 206 120 L208 150 L92 150 Z" fill={h} />
      ) : (
        <path d="M102 112 C104 80 126 70 150 70 C174 70 196 80 198 112 C184 96 168 92 156 94 C150 100 140 100 132 94 C120 96 110 102 102 112 Z" fill={h} />
      );
    default:
      return null;
  }
}

export interface AvatarProps {
  character: Character;
  pose: BodyPose;
  talking?: boolean;
  /** raises eyebrows (question facial grammar) */
  question?: boolean;
  glow?: string;
  className?: string;
  title?: string;
}

function AvatarImpl({ character: c, pose, talking, question, glow, className, title }: AvatarProps) {
  const robot = c.extras?.robot;
  const browY = question ? -6 : 0;
  return (
    <svg viewBox="0 0 300 360" className={className} role="img" aria-label={title ?? `${c.name}, signing avatar`}>
      <defs>
        <radialGradient id={`face-${c.id}`} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={robot ? 0.55 : 0.18} />
          <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`body-${c.id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={c.outfit} />
          <stop offset="100%" stopColor={c.outfit} stopOpacity={0.85} />
        </linearGradient>
      </defs>

      <g className="sb-breathe">
        {/* torso */}
        <path d="M96 210 C96 196 112 188 128 186 L172 186 C188 188 204 196 204 210 L218 360 L82 360 Z" fill={`url(#body-${c.id})`} />
        <path d="M150 192 L150 360" stroke={c.outfitAccent} strokeWidth={4} strokeDasharray="2 8" strokeLinecap="round" />
        <path d="M128 186 L150 214 L172 186" fill="none" stroke={c.outfitAccent} strokeWidth={6} strokeLinejoin="round" />
        {/* neck */}
        <rect x={138} y={156} width={24} height={34} rx={8} fill={robot ? c.skinShade : c.skin} />
        {robot && <path d="M138 166 H162 M138 176 H162" stroke={c.skin} strokeWidth={3} />}

        {/* head */}
        <g className="sb-head">
          <Hair c={c} back />
          {c.extras?.ears === "cat" && (
            <g>
              <path d="M104 92 L106 46 L136 74 Z" fill={c.hair} />
              <path d="M196 92 L194 46 L164 74 Z" fill={c.hair} />
              <path d="M110 84 L111 58 L128 74 Z" fill={c.cheek} />
              <path d="M190 84 L189 58 L172 74 Z" fill={c.cheek} />
            </g>
          )}
          {c.extras?.antenna && (
            <g>
              <line x1={150} y1={68} x2={150} y2={40} stroke={c.skinShade} strokeWidth={4} />
              <circle cx={150} cy={36} r={8} fill={c.outfitAccent} className="sb-pulse" />
            </g>
          )}
          {robot ? (
            <rect x={100} y={68} width={100} height={98} rx={30} fill={c.skin} stroke={c.skinShade} strokeWidth={4} />
          ) : (
            <>
              <ellipse cx={100} cy={124} rx={9} ry={12} fill={c.skinShade} />
              <ellipse cx={200} cy={124} rx={9} ry={12} fill={c.skinShade} />
              <ellipse cx={150} cy={118} rx={50} ry={52} fill={c.skin} />
            </>
          )}
          <ellipse cx={150} cy={118} rx={50} ry={52} fill={`url(#face-${c.id})`} />
          <Hair c={c} back={false} />

          {/* brows */}
          <g transform={`translate(0 ${browY})`} style={{ transition: "transform 200ms" }}>
            <path d="M120 98 Q131 92 142 98" stroke={robot ? c.eye : c.eye} strokeWidth={4} strokeLinecap="round" fill="none" opacity={0.85} />
            <path d="M158 98 Q169 92 180 98" stroke={c.eye} strokeWidth={4} strokeLinecap="round" fill="none" opacity={0.85} />
          </g>

          {/* eyes */}
          <g className="sb-blink">
            {robot ? (
              <>
                <rect x={120} y={110} width={22} height={12} rx={6} fill={c.eye} style={{ filter: `drop-shadow(0 0 4px ${c.eye})` }} />
                <rect x={158} y={110} width={22} height={12} rx={6} fill={c.eye} style={{ filter: `drop-shadow(0 0 4px ${c.eye})` }} />
              </>
            ) : (
              <>
                <ellipse cx={131} cy={117} rx={8} ry={10} fill={c.eye} />
                <ellipse cx={169} cy={117} rx={8} ry={10} fill={c.eye} />
                <circle cx={134} cy={113} r={3} fill="#fff" />
                <circle cx={172} cy={113} r={3} fill="#fff" />
              </>
            )}
          </g>
          {c.extras?.glasses && (
            <g fill="none" stroke="#111827" strokeWidth={3.5}>
              <circle cx={131} cy={117} r={15} />
              <circle cx={169} cy={117} r={15} />
              <path d="M146 116 Q150 112 154 116" />
            </g>
          )}

          {/* cheeks */}
          <ellipse cx={118} cy={138} rx={9} ry={6} fill={c.cheek} opacity={0.65} />
          <ellipse cx={182} cy={138} rx={9} ry={6} fill={c.cheek} opacity={0.65} />

          {c.extras?.ears === "cat" && (
            <g stroke={c.eye} strokeWidth={1.6} opacity={0.5} strokeLinecap="round">
              <path d="M104 134 L84 130 M104 140 L86 142" />
              <path d="M196 134 L216 130 M196 140 L214 142" />
            </g>
          )}

          {/* mouth */}
          {talking ? (
            <ellipse cx={150} cy={146} rx={9} ry={6} fill="#3b0a1e" className="sb-talk" />
          ) : (
            <path d="M136 142 Q150 156 164 142" stroke={robot ? c.eye : "#3b0a1e"} strokeWidth={4} strokeLinecap="round" fill={robot ? "none" : "#ff6b8b"} />
          )}
        </g>
      </g>

      <Arm pose={pose.L} side={1} c={c} />
      <Arm pose={pose.R} side={-1} c={c} glow={glow} />
    </svg>
  );
}

export const Avatar = memo(AvatarImpl);
