"use client";

import { useCallback, useSyncExternalStore } from "react";

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  window.addEventListener("storage", l);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", l);
  };
};

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** A small localStorage-backed preference, shared across components. */
export function usePref<T extends string>(key: string, fallback: T): [T, (v: T) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => (read(key) as T | null) ?? fallback,
    () => fallback,
  );
  const set = useCallback(
    (v: T) => {
      try {
        localStorage.setItem(key, v);
      } catch {
        /* ignore */
      }
      emit();
    },
    [key],
  );
  return [value, set];
}

export const useCharacterId = () => usePref<string>("signbridge.character", "pip");
export const useSignSpeed = () => usePref<"0.5" | "0.75" | "1" | "1.5">("signbridge.speed", "1");
export const useSoundOn = () => usePref<"on" | "off">("signbridge.sound", "on");
export const useCaptionSize = () => usePref<"m" | "l" | "xl">("signbridge.captions", "l");

function subscribeMotion(l: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", l);
  return () => mq.removeEventListener("change", l);
}

export function useReducedMotion() {
  return useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}
