"use client";

import { Gauge } from "lucide-react";
import { useSignSpeed } from "@/lib/prefs";

const SPEEDS = ["0.5", "0.75", "1", "1.5"] as const;

/** Signing speed: slow it down to follow along. */
export function SpeedControl() {
  const [speed, setSpeed] = useSignSpeed();
  return (
    <div className="flex items-center gap-2" role="group" aria-label="Signing speed">
      <Gauge className="h-4 w-4 text-faint" aria-hidden />
      <div className="sb-seg">
        {SPEEDS.map((s) => (
          <button key={s} onClick={() => setSpeed(s)} aria-pressed={speed === s}>
            {s}×
          </button>
        ))}
      </div>
    </div>
  );
}
