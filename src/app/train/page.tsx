"use client";

import { useCallback, useRef, useState } from "react";
import { HandCam } from "@/components/HandCam";
import { datasetSize, normalize, type Dataset, type Prediction, type Pt } from "@/lib/classifier";
import { updateDataset, useDataset } from "@/lib/datasetStore";
import { ALPHABET } from "@/lib/signs";

const TARGET = 40;
const LABELS = [...ALPHABET, "␣"];

export default function TrainPage() {
  const dataset = useDataset();
  const [label, setLabel] = useState("A");
  const [recording, setRecording] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [pred, setPred] = useState<Prediction | null>(null);
  const rec = useRef<{ on: boolean; label: string; got: number; lastT: number }>({ on: false, label: "A", got: 0, lastT: 0 });
  const fileRef = useRef<HTMLInputElement>(null);

  const onFrame = useCallback((lm: Pt[], handed: string | undefined) => {
    const r = rec.current;
    const now = performance.now();
    if (!r.on || now - r.lastT < 70) return;
    r.lastT = now;
    const vec = normalize(lm, handed);
    r.got += 1;
    const done = r.got >= TARGET;
    updateDataset((ds) => ({ ...ds, [r.label]: [...(ds[r.label] ?? []), vec] }), done);
    if (done) {
      r.on = false;
      setRecording(false);
    }
  }, []);

  const startRecording = () => {
    setCountdown(3);
    let n = 3;
    const t = setInterval(() => {
      n -= 1;
      setCountdown(n);
      if (n <= 0) {
        clearInterval(t);
        rec.current = { on: true, label, got: 0, lastT: 0 };
        setRecording(true);
      }
    }, 700);
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(dataset)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "signbridge-samples.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importData = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as Dataset;
      const merged: Dataset = { ...dataset };
      for (const [k, v] of Object.entries(parsed)) if (Array.isArray(v)) merged[k] = [...(merged[k] ?? []), ...v.filter((x) => Array.isArray(x) && x.length === 63)];
      updateDataset(() => merged);
    } catch {
      alert("That file isn't a SignBridge sample export.");
    }
  };

  const count = dataset[label]?.length ?? 0;

  return (
    <div className="pt-6">
      <h1 className="font-display text-4xl font-bold">Train your recognizer</h1>
      <p className="max-w-3xl text-muted">
        Teach SignBridge new letters, or make existing ones work better for your hands. Samples become normalised landmark vectors for an on-device k-nearest-neighbour model. Nothing leaves your browser.
      </p>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <section className="sb-card relative p-4" aria-label="Camera">
          <HandCam dataset={dataset} onFrame={onFrame} onPrediction={setPred} className="aspect-[4/3] w-full" label={recording ? `● Recording ${label}` : "Live prediction"} />
          {countdown > 0 && (
            <div className="pointer-events-none absolute inset-4 grid place-items-center rounded-[28px] bg-black/40">
              <span key={countdown} className="sb-pop font-display text-9xl font-bold text-amber-300">
                {countdown}
              </span>
            </div>
          )}
        </section>

        <section className="sb-card flex flex-col gap-4 p-5" aria-label="Training controls">
          <div>
            <div className="mb-2 text-sm font-bold text-muted">Choose a label</div>
            <div className="grid grid-cols-7 gap-1.5">
              {LABELS.map((l) => {
                const n = dataset[l]?.length ?? 0;
                return (
                  <button
                    key={l}
                    onClick={() => setLabel(l)}
                    aria-pressed={label === l}
                    aria-label={`${l === "␣" ? "space" : l}, ${n} samples`}
                    className={`relative h-12 rounded-xl font-display text-xl font-bold ${label === l ? "bg-white text-black" : "bg-white/10 hover:bg-white/20"}`}
                  >
                    {l}
                    {n > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-lime-400 px-1.5 text-[10px] font-black text-black">{n}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl bg-black/50 p-4">
            <div className="flex items-center justify-between">
              <span className="font-display text-2xl font-bold">“{label}”</span>
              <span className="text-sm text-muted">{count} samples</span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 via-amber-400 to-lime-400 transition-[width]" style={{ width: `${Math.min(100, (count / TARGET) * 100)}%` }} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="sb-btn sb-btn-primary flex-1" disabled={recording || countdown > 0} onClick={startRecording}>
                {recording ? "Recording…" : `● Record ${TARGET} samples`}
              </button>
              <button
                className="sb-btn sb-btn-ghost"
                disabled={!count}
                onClick={() =>
                  updateDataset((ds) => {
                    const n = { ...ds };
                    delete n[label];
                    return n;
                  })
                }
              >
                Clear
              </button>
            </div>
            <p className="mt-3 text-sm text-muted">Tip: wiggle a little and move closer/further while recording so the model sees variety.</p>
          </div>

          <div className="rounded-3xl bg-black/50 p-4" aria-live="polite">
            <div className="text-sm font-bold text-muted">Model sees</div>
            <div className="font-display text-4xl font-bold">
              {pred ? (
                <>
                  {pred.label} <span className="text-base text-muted">{Math.round(pred.confidence * 100)}% · {pred.source}</span>
                </>
              ) : (
                "—"
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="mr-auto self-center text-sm text-muted">{datasetSize(dataset)} samples total</span>
            <button className="sb-btn sb-btn-ghost" onClick={exportData} disabled={!datasetSize(dataset)}>
              Export
            </button>
            <button className="sb-btn sb-btn-ghost" onClick={() => fileRef.current?.click()}>
              Import
            </button>
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])} />
          </div>
        </section>
      </div>
    </div>
  );
}
