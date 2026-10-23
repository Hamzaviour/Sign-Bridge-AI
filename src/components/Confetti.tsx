"use client";

const COLORS = ["#ff4fa3", "#fbbf24", "#a3e635", "#22d3ee", "#8b5cf6", "#fb923c"];

/** CSS-only confetti burst. Re-mount (change key) to fire again. Hidden under reduced motion. */
export function Confetti({ count = 46 }: { count?: number }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-visible motion-reduce:hidden">
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + (i % 3) * 0.2;
        const r = 140 + ((i * 37) % 120);
        const style = {
          "--dx": `${Math.cos(angle) * r}px`,
          "--dy": `${Math.sin(angle) * r + 80}px`,
          "--rot": `${(i * 47) % 720}deg`,
          background: COLORS[i % COLORS.length],
          animation: `sb-confetti ${900 + (i % 5) * 120}ms cubic-bezier(.2,.7,.3,1) forwards`,
          borderRadius: i % 2 ? "9999px" : "3px",
        } as React.CSSProperties;
        return <span key={i} className="absolute left-1/2 top-1/2 h-3 w-2" style={style} />;
      })}
    </div>
  );
}
