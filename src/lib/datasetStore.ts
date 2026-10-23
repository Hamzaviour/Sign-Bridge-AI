"use client";

import { useSyncExternalStore } from "react";
import { loadDataset, saveDataset, type Dataset } from "./classifier";

const EMPTY: Dataset = {};
let cache: Dataset | null = null;
const subs = new Set<() => void>();

function get(): Dataset {
  if (!cache) cache = loadDataset();
  return cache;
}

/** Replace the training set. Set persist=false for rapid updates (e.g. while recording). */
export function updateDataset(fn: (ds: Dataset) => Dataset, persist = true) {
  cache = fn(get());
  if (persist) saveDataset(cache);
  subs.forEach((s) => s());
}

export function useDataset(): Dataset {
  return useSyncExternalStore(
    (l) => {
      subs.add(l);
      return () => subs.delete(l);
    },
    get,
    () => EMPTY,
  );
}
