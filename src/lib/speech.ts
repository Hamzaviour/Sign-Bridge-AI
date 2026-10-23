"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";

// Minimal typing for the Web Speech API (not in the TS DOM lib everywhere).
interface RecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface RecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<RecognitionResultLike>;
}
interface Recognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((e: RecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
}

function getRecognitionCtor(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Live speech-to-text with interim captions. Final phrases are delivered via onFinal. */
export function useSpeechToText(onFinal: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");
  const supported = useSyncExternalStore(
    () => () => {},
    () => !!getRecognitionCtor(),
    () => true,
  );
  const rec = useRef<Recognition | null>(null);
  const want = useRef(false);
  const finalCb = useRef(onFinal);
  useLayoutEffect(() => {
    finalCb.current = onFinal;
  });

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    const r = new Ctor();
    r.continuous = true;
    r.interimResults = true;
    r.lang = "en-US";
    r.onresult = (e) => {
      let live = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalCb.current(res[0].transcript.trim());
        else live += res[0].transcript;
      }
      setInterim(live);
    };
    r.onerror = (e) => {
      if (e.error !== "no-speech") setError(e.error);
    };
    r.onend = () => {
      // Chrome stops after silence; keep going while the user wants to listen
      if (want.current) {
        try {
          r.start();
        } catch {
          /* already started */
        }
      } else setListening(false);
    };
    rec.current = r;
    want.current = true;
    setError("");
    r.start();
    setListening(true);
  }, []);

  const stop = useCallback(() => {
    want.current = false;
    rec.current?.stop();
    setInterim("");
    setListening(false);
  }, []);

  useEffect(
    () => () => {
      want.current = false;
      rec.current?.stop();
    },
    [],
  );

  return { listening, interim, error, supported, start, stop };
}

export function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window) || !text) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1;
  u.pitch = 1.05;
  window.speechSynthesis.speak(u);
}
