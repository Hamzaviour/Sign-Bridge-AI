"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { getHandLandmarker, HAND_CONNECTIONS } from "@/lib/handTracker";
import { classify, type Dataset, type Prediction, type Pt } from "@/lib/classifier";
import { useReducedMotion } from "@/lib/prefs";
import { Camera, CameraOff, Loader2, RotateCcw } from "lucide-react";
import { SkeletonArt } from "./SkeletonArt";

const FINGER_HUES = [330, 45, 160, 195, 270]; // thumb, index, middle, ring, pinky
const fingerOf = (i: number) => (i === 0 ? 0 : Math.floor((i - 1) / 4));

export interface HandCamProps {
  dataset: Dataset;
  /** fires once per stable, held sign */
  onCommit?: (label: string, p: Prediction) => void;
  onPrediction?: (p: Prediction | null) => void;
  onFrame?: (lm: Pt[], handedness: string | undefined) => void;
  holdMs?: number;
  className?: string;
  label?: string;
}

type Status = "idle" | "loading" | "running" | "error";

export function HandCam({ dataset, onCommit, onPrediction, onFrame, holdMs = 650, className, label }: HandCamProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");
  const [pred, setPred] = useState<Prediction | null>(null);
  const [badge, setBadge] = useState<{ x: number; y: number } | null>(null);
  const [holdPct, setHoldPct] = useState(0);
  const reduced = useReducedMotion();

  const cb = useRef({ onCommit, onPrediction, onFrame, dataset, holdMs, reduced });
  useLayoutEffect(() => {
    cb.current = { onCommit, onPrediction, onFrame, dataset, holdMs, reduced };
  });

  const stable = useRef<{ label: string; since: number; committed: boolean; lastCommit: number; lastLabel: string }>({
    label: "",
    since: 0,
    committed: false,
    lastCommit: 0,
    lastLabel: "",
  });
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStatus("idle");
  }, []);

  const start = useCallback(async () => {
    setStatus("loading");
    setError("");
    try {
      const [stream, hl] = await Promise.all([
        navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: "user" }, audio: false }),
        getHandLandmarker(),
      ]);
      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
      setStatus("running");

      let lastTs = -1;
      let lastUi = 0;
      const loop = () => {
        rafRef.current = requestAnimationFrame(loop);
        const v = videoRef.current;
        const canvas = canvasRef.current;
        if (!v || !canvas || v.readyState < 2) return;
        const now = performance.now();
        if (now === lastTs) return;
        lastTs = now;
        const res = hl.detectForVideo(v, now);
        if (canvas.width !== v.videoWidth) {
          canvas.width = v.videoWidth;
          canvas.height = v.videoHeight;
        }
        const ctx = canvas.getContext("2d")!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const hands = res.landmarks as Pt[][];
        let p: Prediction | null = null;
        if (hands.length) {
          const lm = hands[0];
          const handed = res.handedness?.[0]?.[0]?.categoryName;
          cb.current.onFrame?.(lm, handed);
          p = classify(lm, handed, cb.current.dataset);
        }

        hands.forEach((lm, h) => drawHand(ctx, lm, canvas.width, canvas.height, h === 0 ? (p?.confidence ?? 0.3) : 0.3, now, cb.current.reduced));

        // stabilise: commit a letter once it has been held steadily
        const s = stable.current;
        const cur = p && p.confidence >= 0.55 ? p.label : "";
        if (cur !== s.label) {
          s.label = cur;
          s.since = now;
          s.committed = false;
        }
        const held = cur ? (now - s.since) / cb.current.holdMs : 0;
        const repeatOk = cur !== s.lastLabel || now - s.lastCommit > 1500;
        if (cur && !s.committed && held >= 1 && repeatOk) {
          s.committed = true;
          s.lastCommit = now;
          s.lastLabel = cur;
          cb.current.onCommit?.(cur, p!);
        }
        if (!cur) s.lastLabel = "";

        if (now - lastUi > 60) {
          lastUi = now;
          setPred(p);
          setHoldPct(s.committed ? 1 : Math.min(1, held));
          cb.current.onPrediction?.(p);
          if (hands.length) {
            const w = hands[0][0];
            setBadge({ x: (1 - w.x) * 100, y: w.y * 100 });
          } else setBadge(null);
        }
      };
      loop();
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
      stop();
      setStatus("error");
    }
  }, [stop]);

  useEffect(() => stop, [stop]);

  const conf = pred?.confidence ?? 0;
  const ring = `conic-gradient(var(--sb-lime) ${holdPct * 360}deg, rgba(255,255,255,.15) 0deg)`;

  return (
    <div className={`relative overflow-hidden rounded-[22px] bg-[#0c0720] ring-1 ring-[color:var(--sb-line)] ${className ?? ""}`}>
      <video ref={videoRef} playsInline muted className="absolute inset-0 h-full w-full -scale-x-100 object-cover" />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full -scale-x-100 object-cover" aria-hidden />

      {label && (
        <div className="absolute left-4 top-4 rounded-full bg-black/55 px-3 py-1 text-sm font-bold text-white backdrop-blur">
          {label}
        </div>
      )}

      {status === "running" && pred && badge && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 translate-y-3 transition-[left,top] duration-100"
          style={{ left: `${badge.x}%`, top: `${Math.min(badge.y, 82)}%` }}
        >
          <div className="grid h-20 w-20 place-items-center rounded-full p-[5px]" style={{ background: ring }}>
            <div className="grid h-full w-full place-items-center rounded-full bg-[#120a2a]/90 text-4xl font-black text-white">
              {pred.label}
            </div>
          </div>
          <div className="mt-1 text-center text-xs font-bold text-white drop-shadow">
            {Math.round(conf * 100)}% · {pred.source === "knn" ? "trained" : "rules"}
          </div>
        </div>
      )}

      {status !== "running" && (
        <div className="absolute inset-0 grid place-items-center p-6 text-center">
          <div className="max-w-xs">
            <SkeletonArt className={`mx-auto mb-3 h-28 w-24 ${status === "loading" ? "animate-pulse" : "sb-float"}`} />
            {status === "error" ? (
              <p className="mb-5 text-sm text-[color:var(--sb-danger)]">
                {/denied|permission|notallowed/i.test(error) ? "Camera permission was blocked. Allow it from the address bar, then try again." : `The camera or hand model didn't load (${error}).`}
              </p>
            ) : (
              <p className="mb-5 text-base text-muted">Turn on your camera to start hand tracking. Video never leaves your device.</p>
            )}
            <button onClick={start} disabled={status === "loading"} className="sb-btn sb-btn-primary">
              {status === "loading" ? <Loader2 className="animate-spin" aria-hidden /> : status === "error" ? <RotateCcw aria-hidden /> : <Camera aria-hidden />}
              {status === "loading" ? "Loading hand model…" : status === "error" ? "Try again" : "Start camera"}
            </button>
          </div>
        </div>
      )}
      {status === "running" && (
        <button onClick={stop} className="absolute right-3 top-3 inline-flex min-h-11 items-center gap-1.5 rounded-full bg-[#0c0720]/80 px-3.5 text-sm font-bold text-ink hover:bg-[#0c0720]">
          <CameraOff className="h-4 w-4" aria-hidden /> Stop camera
        </button>
      )}
    </div>
  );
}

function drawHand(ctx: CanvasRenderingContext2D, lm: Pt[], w: number, h: number, conf: number, now: number, reduced: boolean) {
  const pulse = reduced ? 1 : 0.85 + 0.15 * Math.sin(now / 180);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const [a, b] of HAND_CONNECTIONS) {
    const hue = FINGER_HUES[fingerOf(b)];
    ctx.strokeStyle = `hsla(${hue}, 95%, 62%, ${0.55 + conf * 0.45})`;
    ctx.shadowColor = `hsla(${hue}, 100%, 60%, 1)`;
    ctx.shadowBlur = (6 + conf * 26) * pulse;
    ctx.lineWidth = 4 + conf * 3;
    ctx.beginPath();
    ctx.moveTo(lm[a].x * w, lm[a].y * h);
    ctx.lineTo(lm[b].x * w, lm[b].y * h);
    ctx.stroke();
  }
  lm.forEach((p, i) => {
    const hue = FINGER_HUES[fingerOf(i)];
    const tip = [4, 8, 12, 16, 20].includes(i);
    ctx.fillStyle = tip ? "#ffffff" : `hsl(${hue}, 95%, 70%)`;
    ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
    ctx.shadowBlur = tip ? 18 * conf * pulse + 6 : 6;
    ctx.beginPath();
    ctx.arc(p.x * w, p.y * h, tip ? 6 : 3.5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.shadowBlur = 0;
}
