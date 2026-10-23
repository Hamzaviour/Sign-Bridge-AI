import { SHAPES } from "@/lib/signs";
import { HandGlyph } from "./HandGlyph";

/** The SignBridge mark: an "I love you" hand on a candy tile. */
export function LogoMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <span
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-[14px] ${className}`}
      style={{ background: "linear-gradient(140deg, #ff5aa8 0%, #ff8a6b 45%, #ffc23d 100%)", boxShadow: "0 8px 18px -8px rgba(255,90,168,.9)" }}
    >
      <HandGlyph shape={SHAPES.ily} skin="#fff7fb" shade="#7a1f52" className="h-[86%] w-[86%] translate-y-[6%]" />
    </span>
  );
}

export function Wordmark() {
  return (
    <span className="font-display text-[1.35rem] font-bold tracking-tight">
      Sign<span className="text-pink">Bridge</span>
    </span>
  );
}
