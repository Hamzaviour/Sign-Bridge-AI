"use client";

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function enabled() {
  try {
    return localStorage.getItem("signbridge.sound") !== "off";
  } catch {
    return true;
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", gain = 0.12) {
  const a = audio();
  if (!a) return;
  const t0 = a.currentTime + start;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

/** Short UI sounds, synthesised so there are no audio files to load. */
export const sfx = {
  /** a letter was recognised */
  tick() {
    if (enabled()) tone(880, 0, 0.09, "triangle", 0.08);
  },
  /** correct answer */
  success() {
    if (!enabled()) return;
    [523.25, 659.25, 783.99].forEach((f, i) => tone(f, i * 0.07, 0.25, "triangle"));
  },
  /** finished a word or levelled up */
  fanfare() {
    if (!enabled()) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.09, 0.35, "square", 0.06));
    tone(1318.5, 0.4, 0.5, "triangle", 0.09);
  },
  /** soft "nope" */
  miss() {
    if (enabled()) tone(220, 0, 0.18, "sine", 0.07);
  },
};
