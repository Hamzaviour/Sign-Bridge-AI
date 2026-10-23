"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  type HandPose,
  type HandShape,
  type Keyframe,
  type Finger,
  REST_L,
  REST_R,
  PHRASE_BY_GLOSS,
  letterKeyframes,
  textToGloss,
} from "./signs";

export interface BodyPose {
  R: HandPose;
  L: HandPose;
}

export interface PlayItem {
  frames: Keyframe[];
  caption: string;
  kind: "sign" | "letter";
  /** index of the word this item belongs to, for caption highlighting */
  word?: number;
}

interface Segment {
  to: BodyPose;
  dur: number;
  hold: number;
  item: PlayItem | null;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpFinger = (a: Finger, b: Finger, t: number): Finger => ({
  curl: lerp(a.curl, b.curl, t),
  spread: lerp(a.spread, b.spread, t),
});
const lerpShape = (a: HandShape, b: HandShape, t: number): HandShape => ({
  index: lerpFinger(a.index, b.index, t),
  middle: lerpFinger(a.middle, b.middle, t),
  ring: lerpFinger(a.ring, b.ring, t),
  pinky: lerpFinger(a.pinky, b.pinky, t),
  thumbAngle: lerp(a.thumbAngle, b.thumbAngle, t),
  thumbCurl: lerp(a.thumbCurl, b.thumbCurl, t),
});
const lerpHand = (a: HandPose, b: HandPose, t: number): HandPose => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  rot: lerp(a.rot, b.rot, t),
  scale: lerp(a.scale ?? 1, b.scale ?? 1, t),
  shape: lerpShape(a.shape, b.shape, t),
});
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Turns English text into a playlist of avatar animations. */
export function textToPlaylist(text: string): PlayItem[] {
  const items: PlayItem[] = [];
  textToGloss(text).forEach((tok, word) => {
    if (tok.kind === "sign") {
      const entry = PHRASE_BY_GLOSS.get(tok.gloss);
      if (entry) items.push({ frames: entry.frames, caption: entry.gloss, kind: "sign", word });
    } else {
      for (const ch of tok.word) {
        const frames = letterKeyframes(ch);
        if (frames.length) items.push({ frames, caption: ch, kind: "letter", word });
      }
    }
  });
  return items;
}

export function useSignPlayer(reducedMotion = false, speed = 1) {
  const [pose, setPose] = useState<BodyPose>({ R: REST_R, L: REST_L });
  const [current, setCurrent] = useState<PlayItem | null>(null);
  const [playing, setPlaying] = useState(false);

  const poseRef = useRef<BodyPose>(pose);
  const segs = useRef<Segment[]>([]);
  const segIdx = useRef(0);
  const segStart = useRef(0);
  const fromPose = useRef<BodyPose>(pose);
  const raf = useRef<number | null>(null);
  const reducedRef = useRef(reducedMotion);
  const speedRef = useRef(speed);
  useLayoutEffect(() => {
    reducedRef.current = reducedMotion;
    speedRef.current = speed;
  }, [reducedMotion, speed]);

  const stopLoop = () => {
    if (raf.current != null) cancelAnimationFrame(raf.current);
    raf.current = null;
  };

  const tick = useCallback(function step(now: number) {
    const seg = segs.current[segIdx.current];
    if (!seg) {
      setPlaying(false);
      setCurrent(null);
      raf.current = null;
      return;
    }
    const sp = speedRef.current;
    const dur = reducedRef.current ? 0 : seg.dur / sp;
    const hold = (reducedRef.current ? seg.dur + seg.hold : seg.hold) / sp;
    const elapsed = now - segStart.current;
    const t = dur === 0 ? 1 : Math.min(1, elapsed / dur);
    const e = ease(t);
    const next: BodyPose = {
      R: lerpHand(fromPose.current.R, seg.to.R, e),
      L: lerpHand(fromPose.current.L, seg.to.L, e),
    };
    poseRef.current = next;
    setPose(next);
    if (elapsed >= dur + hold) {
      fromPose.current = seg.to;
      segIdx.current += 1;
      segStart.current = now;
      const upcoming = segs.current[segIdx.current];
      if (upcoming && upcoming.item !== seg.item) setCurrent(upcoming.item);
    }
    raf.current = requestAnimationFrame(step);
  }, []);

  const play = useCallback(
    (items: PlayItem[]) => {
      stopLoop();
      const list: Segment[] = [];
      let prevKind: PlayItem["kind"] | null = null;
      for (const item of items) {
        // brief neutral beat between separate signs so they read as distinct
        if (prevKind === "sign" && item.kind === "sign") {
          list.push({ to: { R: { ...REST_R, y: 290, x: 112 }, L: REST_L }, dur: 220, hold: 40, item });
        }
        item.frames.forEach((k) => {
          list.push({ to: { R: k.R, L: k.L ?? REST_L }, dur: k.dur, hold: k.hold ?? 0, item });
        });
        prevKind = item.kind;
      }
      list.push({ to: { R: REST_R, L: REST_L }, dur: 520, hold: 0, item: null });
      segs.current = list;
      segIdx.current = 0;
      fromPose.current = poseRef.current;
      segStart.current = performance.now();
      setCurrent(list[0]?.item ?? null);
      setPlaying(true);
      raf.current = requestAnimationFrame(tick);
    },
    [tick],
  );

  const stop = useCallback(() => {
    segs.current = [{ to: { R: REST_R, L: REST_L }, dur: 400, hold: 0, item: null }];
    segIdx.current = 0;
    fromPose.current = poseRef.current;
    segStart.current = performance.now();
    if (raf.current == null) raf.current = requestAnimationFrame(tick);
  }, [tick]);

  useEffect(() => stopLoop, []);

  return { pose, current, playing, play, stop };
}
