/**
 * Stylised sign library for the avatar. Handshapes are approximations of the
 * ASL manual alphabet drawn from a front view; phrase signs are simplified
 * keyframe animations, not reference-quality ASL.
 */

export interface Finger {
  /** 0 = straight, 1 = fully folded */
  curl: number;
  /** sideways angle in degrees (positive = towards thumb side) */
  spread: number;
}

export interface HandShape {
  index: Finger;
  middle: Finger;
  ring: Finger;
  pinky: Finger;
  /** thumb angle in degrees from "up"; positive points away from palm, negative crosses the palm */
  thumbAngle: number;
  thumbCurl: number;
}

const f = (curl: number, spread = 0): Finger => ({ curl, spread });

function shape(
  i: Finger,
  m: Finger,
  r: Finger,
  p: Finger,
  thumbAngle: number,
  thumbCurl: number,
): HandShape {
  return { index: i, middle: m, ring: r, pinky: p, thumbAngle, thumbCurl };
}

const FIST = 1;

export const SHAPES: Record<string, HandShape> = {
  rest: shape(f(0.35, 2), f(0.4), f(0.45, -2), f(0.5, -4), 25, 0.3),
  open5: shape(f(0, 12), f(0, 3), f(0, -6), f(0, -16), 70, 0),
  flat: shape(f(0), f(0), f(0), f(0), -55, 0.4),
  point: shape(f(0), f(FIST), f(FIST), f(FIST), -40, 0.5),
  ily: shape(f(0, 6), f(FIST), f(FIST), f(0, -14), 75, 0),
  A: shape(f(FIST), f(FIST), f(FIST), f(FIST), 8, 0),
  B: shape(f(0), f(0), f(0), f(0), -70, 0.55),
  C: shape(f(0.5, 4), f(0.5), f(0.5), f(0.5, -4), 45, 0.35),
  D: shape(f(0), f(0.75), f(0.75), f(0.75), -35, 0.6),
  E: shape(f(0.8), f(0.8), f(0.8), f(0.8), -80, 0.7),
  F: shape(f(0.8, 4), f(0, 4), f(0, -4), f(0, -12), -25, 0.65),
  G: shape(f(0), f(FIST), f(FIST), f(FIST), 15, 0),
  H: shape(f(0), f(0), f(FIST), f(FIST), -40, 0.6),
  I: shape(f(FIST), f(FIST), f(FIST), f(0, -6), -60, 0.5),
  J: shape(f(FIST), f(FIST), f(FIST), f(0, -6), -60, 0.5),
  K: shape(f(0, 10), f(0, -6), f(FIST), f(FIST), 20, 0.15),
  L: shape(f(0), f(FIST), f(FIST), f(FIST), 85, 0),
  M: shape(f(0.95), f(0.95), f(0.95), f(FIST), -30, 0.9),
  N: shape(f(0.95), f(0.95), f(FIST), f(FIST), -20, 0.9),
  O: shape(f(0.6, 3), f(0.6), f(0.6), f(0.6, -3), -10, 0.55),
  P: shape(f(0, 10), f(0, -6), f(FIST), f(FIST), 20, 0.15),
  Q: shape(f(0), f(FIST), f(FIST), f(FIST), 15, 0),
  R: shape(f(0, -7), f(0, 7), f(FIST), f(FIST), -45, 0.6),
  S: shape(f(FIST), f(FIST), f(FIST), f(FIST), -75, 0.3),
  T: shape(f(0.9), f(FIST), f(FIST), f(FIST), -25, 0.45),
  U: shape(f(0, 2), f(0, -2), f(FIST), f(FIST), -45, 0.6),
  V: shape(f(0, 14), f(0, -10), f(FIST), f(FIST), -45, 0.6),
  W: shape(f(0, 14), f(0), f(0, -14), f(FIST), -50, 0.6),
  X: shape(f(0.55), f(FIST), f(FIST), f(FIST), -40, 0.6),
  Y: shape(f(FIST), f(FIST), f(FIST), f(0, -18), 80, 0),
  Z: shape(f(0), f(FIST), f(FIST), f(FIST), -40, 0.5),
};

/** Extra hand rotation per letter (degrees, 0 = fingers up). */
export const LETTER_ROT: Partial<Record<string, number>> = {
  G: -80,
  H: -80,
  P: 150,
  Q: 170,
};

export interface HandPose {
  /** wrist target in avatar SVG coordinates (viewBox 0 0 300 360) */
  x: number;
  y: number;
  /** hand rotation, 0 = fingers up, positive = clockwise on the dominant hand */
  rot: number;
  shape: HandShape;
  /** draw the hand larger (used when fingerspelling so it reads clearly) */
  scale?: number;
}

export interface Keyframe {
  /** milliseconds to travel to this pose */
  dur: number;
  R: HandPose;
  L?: HandPose;
  /** hold time after arriving */
  hold?: number;
}

export const REST_R: HandPose = { x: 98, y: 322, rot: 172, shape: SHAPES.rest };
export const REST_L: HandPose = { x: 202, y: 322, rot: 172, shape: SHAPES.rest };

const S = SHAPES;
const p = (x: number, y: number, rot: number, s: HandShape, scale?: number): HandPose => ({
  x,
  y,
  rot,
  shape: s,
  scale,
});

export const SPELL_SPOT = { x: 84, y: 200 };

/** Keyframes for fingerspelling a single letter. */
export function letterKeyframes(letter: string): Keyframe[] {
  const L = letter.toUpperCase();
  const s = SHAPES[L];
  if (!s) return [];
  const rot = LETTER_ROT[L] ?? 0;
  const base = p(SPELL_SPOT.x, SPELL_SPOT.y, rot, s, 1.85);
  if (L === "J") {
    return [
      { dur: 260, R: base, hold: 60 },
      { dur: 220, R: { ...base, y: base.y + 22, rot: 30 } },
      { dur: 220, R: { ...base, x: base.x + 18, y: base.y + 18, rot: 80 }, hold: 120 },
    ];
  }
  if (L === "Z") {
    return [
      { dur: 260, R: base, hold: 40 },
      { dur: 160, R: { ...base, x: base.x + 26 } },
      { dur: 160, R: { ...base, y: base.y + 22 } },
      { dur: 160, R: { ...base, x: base.x + 26, y: base.y + 22 }, hold: 120 },
    ];
  }
  return [{ dur: 260, R: base, hold: 380 }];
}

export interface SignEntry {
  gloss: string;
  label: string;
  emoji: string;
  frames: Keyframe[];
}

const chestL = p(196, 262, 85, S.flat);

export const PHRASES: SignEntry[] = [
  {
    gloss: "HELLO",
    label: "Hello",
    emoji: "👋",
    frames: [
      { dur: 380, R: p(122, 92, 10, S.B), hold: 120 },
      { dur: 380, R: p(78, 110, -25, S.B), hold: 200 },
    ],
  },
  {
    gloss: "THANK-YOU",
    label: "Thank you",
    emoji: "🙏",
    frames: [
      { dur: 380, R: p(146, 158, 0, S.flat), hold: 160 },
      { dur: 420, R: p(118, 238, 25, S.flat), hold: 220 },
    ],
  },
  {
    gloss: "PLEASE",
    label: "Please",
    emoji: "🥺",
    frames: [
      { dur: 360, R: p(158, 252, 65, S.flat) },
      { dur: 220, R: p(176, 236, 65, S.flat) },
      { dur: 220, R: p(160, 220, 65, S.flat) },
      { dur: 220, R: p(142, 238, 65, S.flat) },
      { dur: 220, R: p(158, 252, 65, S.flat), hold: 160 },
    ],
  },
  {
    gloss: "SORRY",
    label: "Sorry",
    emoji: "😔",
    frames: [
      { dur: 360, R: p(158, 252, -20, S.S) },
      { dur: 220, R: p(176, 236, -20, S.S) },
      { dur: 220, R: p(160, 220, -20, S.S) },
      { dur: 220, R: p(142, 238, -20, S.S) },
      { dur: 220, R: p(158, 252, -20, S.S), hold: 160 },
    ],
  },
  {
    gloss: "YES",
    label: "Yes",
    emoji: "✅",
    frames: [
      { dur: 340, R: p(108, 200, 0, S.S) },
      { dur: 180, R: p(108, 214, 40, S.S) },
      { dur: 180, R: p(108, 200, 0, S.S) },
      { dur: 180, R: p(108, 214, 40, S.S), hold: 160 },
    ],
  },
  {
    gloss: "NO",
    label: "No",
    emoji: "🙅",
    frames: [
      { dur: 340, R: p(112, 190, -10, shape(f(0, 4), f(0, -2), f(1), f(1), 70, 0)) },
      { dur: 200, R: p(112, 194, -10, shape(f(0.55), f(0.55), f(1), f(1), -10, 0.4)) },
      { dur: 200, R: p(112, 190, -10, shape(f(0, 4), f(0, -2), f(1), f(1), 70, 0)) },
      { dur: 200, R: p(112, 194, -10, shape(f(0.55), f(0.55), f(1), f(1), -10, 0.4)), hold: 160 },
    ],
  },
  {
    gloss: "NICE",
    label: "Nice",
    emoji: "✨",
    frames: [
      { dur: 380, R: p(170, 246, 85, S.flat), L: chestL },
      { dur: 460, R: p(104, 250, 85, S.flat), L: chestL, hold: 200 },
    ],
  },
  {
    gloss: "MEET",
    label: "Meet",
    emoji: "🤝",
    frames: [
      { dur: 380, R: p(96, 236, 0, S.D), L: p(204, 236, 0, S.D) },
      { dur: 420, R: p(140, 236, 0, S.D), L: p(160, 236, 0, S.D), hold: 220 },
    ],
  },
  {
    gloss: "YOU",
    label: "You",
    emoji: "👉",
    frames: [{ dur: 380, R: p(128, 226, -30, S.point), hold: 360 }],
  },
  {
    gloss: "ME",
    label: "Me / I",
    emoji: "🙋",
    frames: [{ dur: 380, R: p(150, 262, 160, S.point), hold: 360 }],
  },
  {
    gloss: "MY",
    label: "My",
    emoji: "🫶",
    frames: [{ dur: 380, R: p(152, 258, 65, S.flat), hold: 360 }],
  },
  {
    gloss: "NAME",
    label: "Name",
    emoji: "📛",
    frames: [
      { dur: 360, R: p(140, 236, 80, S.H), L: p(172, 252, 80, S.H) },
      { dur: 160, R: p(146, 246, 80, S.H), L: p(172, 252, 80, S.H) },
      { dur: 160, R: p(140, 236, 80, S.H), L: p(172, 252, 80, S.H) },
      { dur: 160, R: p(146, 246, 80, S.H), L: p(172, 252, 80, S.H), hold: 200 },
    ],
  },
  {
    gloss: "WHAT",
    label: "What",
    emoji: "🤷",
    frames: [
      { dur: 360, R: p(98, 262, -50, S.open5), L: p(202, 262, -50, S.open5) },
      { dur: 160, R: p(92, 262, -60, S.open5), L: p(208, 262, -60, S.open5) },
      { dur: 160, R: p(98, 262, -50, S.open5), L: p(202, 262, -50, S.open5), hold: 260 },
    ],
  },
  {
    gloss: "GOOD",
    label: "Good",
    emoji: "👍",
    frames: [
      { dur: 380, R: p(146, 158, 0, S.flat), L: p(170, 268, 85, S.flat), hold: 120 },
      { dur: 420, R: p(150, 240, -30, S.flat), L: p(170, 268, 85, S.flat), hold: 220 },
    ],
  },
  {
    gloss: "LOVE",
    label: "I love you",
    emoji: "🤟",
    frames: [
      { dur: 400, R: p(112, 168, 0, S.ily), hold: 160 },
      { dur: 220, R: p(108, 162, 12, S.ily) },
      { dur: 220, R: p(112, 168, 0, S.ily), hold: 260 },
    ],
  },
  {
    gloss: "HELP",
    label: "Help",
    emoji: "🆘",
    frames: [
      { dur: 380, R: p(150, 262, 0, S.A), L: p(158, 284, 85, S.flat) },
      { dur: 420, R: p(150, 226, 0, S.A), L: p(158, 248, 85, S.flat), hold: 220 },
    ],
  },
  {
    gloss: "WELCOME",
    label: "Welcome",
    emoji: "🏠",
    frames: [
      { dur: 380, R: p(80, 230, -60, S.flat) },
      { dur: 460, R: p(146, 262, 95, S.flat), hold: 220 },
    ],
  },
  {
    gloss: "GOODBYE",
    label: "Goodbye",
    emoji: "🫡",
    frames: [
      { dur: 340, R: p(100, 168, 0, S.open5) },
      { dur: 160, R: p(100, 168, 0, S.B) },
      { dur: 160, R: p(100, 168, 0, S.open5) },
      { dur: 160, R: p(100, 168, 0, S.B) },
      { dur: 160, R: p(100, 168, 0, S.open5), hold: 160 },
    ],
  },
  {
    gloss: "FRIEND",
    label: "Friend",
    emoji: "🧑‍🤝‍🧑",
    frames: [
      { dur: 380, R: p(142, 232, -80, S.X), L: p(160, 246, 80, S.X) },
      { dur: 380, R: p(142, 248, 80, S.X), L: p(160, 232, -80, S.X), hold: 220 },
    ],
  },
  {
    gloss: "HOW",
    label: "How",
    emoji: "❓",
    frames: [
      { dur: 380, R: p(140, 248, 160, shape(f(0.5), f(0.5), f(0.5), f(0.5), -10, 0.4)), L: p(162, 248, 160, shape(f(0.5), f(0.5), f(0.5), f(0.5), -10, 0.4)) },
      { dur: 420, R: p(140, 244, 0, S.C), L: p(162, 244, 0, S.C), hold: 220 },
    ],
  },
];

export const PHRASE_BY_GLOSS = new Map(PHRASES.map((s) => [s.gloss, s]));

/** Words that map onto a library gloss. */
const WORD_TO_GLOSS: Record<string, string> = {
  hello: "HELLO",
  hi: "HELLO",
  hey: "HELLO",
  thanks: "THANK-YOU",
  please: "PLEASE",
  sorry: "SORRY",
  yes: "YES",
  yeah: "YES",
  no: "NO",
  nope: "NO",
  nice: "NICE",
  meet: "MEET",
  meeting: "MEET",
  you: "YOU",
  your: "YOU",
  me: "ME",
  i: "ME",
  my: "MY",
  mine: "MY",
  name: "NAME",
  what: "WHAT",
  good: "GOOD",
  great: "GOOD",
  love: "LOVE",
  help: "HELP",
  welcome: "WELCOME",
  bye: "GOODBYE",
  goodbye: "GOODBYE",
  friend: "FRIEND",
  friends: "FRIEND",
  how: "HOW",
};

const DROP = new Set(["to", "a", "an", "the", "is", "am", "are", "be", "do", "does", "of", "it", "s"]);

export type GlossToken = { kind: "sign"; gloss: string } | { kind: "spell"; word: string };

/** English text to a simplified gloss sequence. Unknown words are fingerspelled. */
export function textToGloss(text: string): GlossToken[] {
  const clean = text
    .toLowerCase()
    .replace(/thank you/g, "thanks")
    .replace(/i love you/g, "love")
    .replace(/[^a-z\s']/g, " ")
    .replace(/'/g, " ");
  const out: GlossToken[] = [];
  for (const word of clean.split(/\s+/).filter(Boolean)) {
    if (DROP.has(word)) continue;
    const g = WORD_TO_GLOSS[word];
    if (g) out.push({ kind: "sign", gloss: g });
    else out.push({ kind: "spell", word: word.toUpperCase().slice(0, 14) });
  }
  return out;
}

export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
