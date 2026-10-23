import { HAND_CONNECTIONS } from "@/lib/handConnections";

// A "V" handshape as MediaPipe-style landmarks, for illustration.
const PTS: [number, number][] = [
  [50, 110],
  [36, 100], [26, 88], [20, 76], [18, 66],
  [40, 70], [34, 50], [30, 36], [27, 24],
  [52, 66], [56, 44], [58, 30], [60, 17],
  [62, 70], [65, 58], [61, 64], [57, 71],
  [70, 76], [73, 67], [69, 71], [65, 78],
];
const HUES = [330, 45, 160, 195, 270];
const fingerOf = (i: number) => (i === 0 ? 0 : Math.floor((i - 1) / 4));

/** Static rainbow hand skeleton, mirroring the live camera overlay. */
export function SkeletonArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 124" className={className} aria-hidden>
      <defs>
        <filter id="sk-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#sk-glow)" strokeLinecap="round">
        {HAND_CONNECTIONS.map(([a, b]) => (
          <line key={`${a}-${b}`} x1={PTS[a][0]} y1={PTS[a][1]} x2={PTS[b][0]} y2={PTS[b][1]} stroke={`hsl(${HUES[fingerOf(b)]} 95% 64%)`} strokeWidth={3} />
        ))}
        {PTS.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={[4, 8, 12, 16, 20].includes(i) ? 3.4 : 2.2} fill={[4, 8, 12, 16, 20].includes(i) ? "#fff" : `hsl(${HUES[fingerOf(i)]} 95% 72%)`} />
        ))}
      </g>
    </svg>
  );
}
