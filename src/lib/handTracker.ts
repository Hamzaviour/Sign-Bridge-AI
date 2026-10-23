"use client";

import type { HandLandmarker } from "@mediapipe/tasks-vision";

const WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1/wasm";
const MODEL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

let landmarker: Promise<HandLandmarker> | null = null;

/** Lazily creates one shared HandLandmarker (GPU first, CPU fallback). */
export function getHandLandmarker(): Promise<HandLandmarker> {
  if (!landmarker) {
    landmarker = (async () => {
      const { FilesetResolver, HandLandmarker } = await import("@mediapipe/tasks-vision");
      const files = await FilesetResolver.forVisionTasks(WASM);
      const make = (delegate: "GPU" | "CPU") =>
        HandLandmarker.createFromOptions(files, {
          baseOptions: { modelAssetPath: MODEL, delegate },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: 0.6,
          minTrackingConfidence: 0.5,
        });
      try {
        return await make("GPU");
      } catch {
        return await make("CPU");
      }
    })();
    landmarker.catch(() => {
      landmarker = null;
    });
  }
  return landmarker;
}

export { HAND_CONNECTIONS } from "./handConnections";
