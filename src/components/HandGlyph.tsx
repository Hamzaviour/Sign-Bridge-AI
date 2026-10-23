import type { HandShape } from "@/lib/signs";
import { Hand } from "./Avatar";

/** A single drawn handshape, used as an icon for letters, signs and the logo. */
export function HandGlyph({
  shape,
  rot = 0,
  skin = "#ffe1cc",
  shade = "#d9a483",
  className,
  title,
}: {
  shape: HandShape;
  rot?: number;
  skin?: string;
  shade?: string;
  className?: string;
  title?: string;
}) {
  return (
    <svg viewBox="-36 -60 72 72" className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <Hand pose={{ x: 0, y: 8, rot, shape, scale: 1 }} mirror={false} skin={skin} shade={shade} />
    </svg>
  );
}
