/**
 * Fingerspelling recognition from MediaPipe hand landmarks.
 *
 * Two layers:
 *  1. A geometric rule set that works out of the box for the static letters
 *     whose finger states are easy to separate (A B C D F I L O S U V W Y + space).
 *  2. A k-nearest-neighbour model trained in the browser on samples the user
 *     records on the Train page. When it has data and a close match it wins.
 */

export interface Pt {
  x: number;
  y: number;
  z: number;
}

export interface Prediction {
  label: string;
  confidence: number;
  source: "rules" | "knn";
}

const WRIST = 0;
const TIPS = [4, 8, 12, 16, 20];
const PIPS = [3, 6, 10, 14, 18];
const MCPS = [2, 5, 9, 13, 17];

const d2 = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
const d3 = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

/** 0 = straight, 1 = folded, for index..pinky (i = 1..4) */
function fingerCurl(lm: Pt[], i: number): number {
  const tip = lm[TIPS[i]];
  const pip = lm[PIPS[i]];
  const mcp = lm[MCPS[i]];
  const w = lm[WRIST];
  const straight = d3(w, tip) / (d3(w, pip) + d3(pip, tip));
  // straight ~0.97+, curled ~0.55
  const c = (0.97 - straight) / 0.4;
  // tip below its own MCP (towards wrist) is a strong fold signal
  const fold = d3(tip, w) < d3(mcp, w) ? 0.25 : 0;
  return Math.max(0, Math.min(1, c + fold));
}

export function handFeatures(lm: Pt[]) {
  const palm = d3(lm[WRIST], lm[9]);
  const curls = [1, 2, 3, 4].map((i) => fingerCurl(lm, i));
  const ext = curls.map((c) => c < 0.35);
  const thumbTip = lm[4];
  const thumbOut = d3(thumbTip, lm[5]) / palm; // far from index base = thumb abducted
  const thumbToIndexTip = d3(thumbTip, lm[8]) / palm;
  const idxMidGap = d2(lm[8], lm[12]) / palm;
  const midRingGap = d2(lm[12], lm[16]) / palm;
  const thumbNear = [5, 6, 10, 14].map((k) => d3(thumbTip, lm[k]));
  return { palm, curls, ext, thumbOut, thumbToIndexTip, idxMidGap, midRingGap, thumbNear };
}

export function ruleClassify(lm: Pt[]): Prediction | null {
  const f = handFeatures(lm);
  const [iE, mE, rE, pE] = f.ext;
  const [iC, mC, rC, pC] = f.curls;
  const thumbOut = f.thumbOut > 0.75;
  const conf = (x: number) => ({ confidence: Math.max(0.35, Math.min(0.98, x)), source: "rules" as const });
  const avgCurl = (iC + mC + rC + pC) / 4;

  if (iE && mE && rE && pE) {
    if (thumbOut && f.idxMidGap > 0.18) return { label: "␣", ...conf(0.9) };
    return { label: "B", ...conf(0.9 - (iC + mC + rC + pC) / 4) };
  }
  if (!iE && mE && rE && pE && f.thumbToIndexTip < 0.35) return { label: "F", ...conf(0.85) };
  if (iE && mE && rE && !pE) return { label: "W", ...conf(0.88) };
  if (iE && mE && !rE && !pE) {
    return f.idxMidGap > 0.22 ? { label: "V", ...conf(0.9) } : { label: "U", ...conf(0.85) };
  }
  if (iE && !mE && !rE && !pE) {
    return thumbOut && f.thumbOut > 0.95 ? { label: "L", ...conf(0.9) } : { label: "D", ...conf(0.8) };
  }
  if (!iE && !mE && !rE && pE) {
    return thumbOut ? { label: "Y", ...conf(0.9) } : { label: "I", ...conf(0.88) };
  }
  if (!iE && !mE && !rE && !pE) {
    if (avgCurl < 0.75) {
      // half-closed hand: O if thumb meets index, otherwise C
      return f.thumbToIndexTip < 0.3 ? { label: "O", ...conf(0.75) } : { label: "C", ...conf(0.7) };
    }
    const nearest = f.thumbNear.indexOf(Math.min(...f.thumbNear));
    if (nearest >= 2) return { label: "S", ...conf(0.72) };
    return { label: "A", ...conf(0.78) };
  }
  return null;
}

/** Normalised feature vector: wrist-centred, scale- and rotation-invariant, handedness-mirrored. */
export function normalize(lm: Pt[], handedness: string | undefined): number[] {
  const w = lm[WRIST];
  const m = lm[9];
  const scale = d3(w, m) || 1;
  const ang = Math.atan2(m.x - w.x, -(m.y - w.y));
  const cos = Math.cos(-ang);
  const sin = Math.sin(-ang);
  const mirror = handedness === "Left" ? -1 : 1;
  const v: number[] = [];
  for (const p of lm) {
    const x = (p.x - w.x) / scale;
    const y = (p.y - w.y) / scale;
    v.push((x * cos - y * sin) * mirror, x * sin + y * cos, ((p.z - w.z) / scale) * 0.6);
  }
  return v;
}

export type Dataset = Record<string, number[][]>;

const STORE_KEY = "signbridge.knn.v1";

export function loadDataset(): Dataset {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as Dataset) : {};
  } catch {
    return {};
  }
}

export function saveDataset(ds: Dataset) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(ds));
  } catch {
    /* storage full or blocked: keep in memory only */
  }
}

export function datasetSize(ds: Dataset) {
  return Object.values(ds).reduce((n, s) => n + s.length, 0);
}

const dist = (a: number[], b: number[]) => {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return Math.sqrt(s);
};

export function knnClassify(vec: number[], ds: Dataset, k = 7): Prediction | null {
  const all: { label: string; d: number }[] = [];
  for (const [label, samples] of Object.entries(ds)) for (const s of samples) all.push({ label, d: dist(vec, s) });
  if (all.length < 3) return null;
  all.sort((a, b) => a.d - b.d);
  const top = all.slice(0, Math.min(k, all.length));
  if (top[0].d > 1.6) return null; // nothing close enough: unknown handshape
  const votes = new Map<string, number>();
  for (const t of top) votes.set(t.label, (votes.get(t.label) ?? 0) + 1 / (t.d + 0.05));
  let best = "";
  let bestV = 0;
  let total = 0;
  for (const [l, v] of votes) {
    total += v;
    if (v > bestV) {
      bestV = v;
      best = l;
    }
  }
  const closeness = Math.max(0, 1 - top[0].d / 1.6);
  return { label: best, confidence: (bestV / total) * (0.55 + 0.45 * closeness), source: "knn" };
}

export function classify(lm: Pt[], handedness: string | undefined, ds: Dataset): Prediction | null {
  const knn = datasetSize(ds) > 0 ? knnClassify(normalize(lm, handedness), ds) : null;
  const rules = ruleClassify(lm);
  if (knn && (knn.confidence > 0.55 || !rules)) return knn;
  return rules ?? knn;
}

export const RULE_LETTERS = ["A", "B", "C", "D", "F", "I", "L", "O", "S", "U", "V", "W", "Y"];
