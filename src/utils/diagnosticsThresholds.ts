/**
 * Threshold settings store — editable from UI, persisted to localStorage.
 * Read by realtimeStatus auto-alert loop.
 */
import { useSyncExternalStore } from "react";

export interface Thresholds {
  pollingAlertSec: number;       // alert if a channel polls > N seconds
  cspBurstCount: number;         // alert if N CSP violations
  cspBurstWindowSec: number;     // ...within this many seconds
}

export const DEFAULT_THRESHOLDS: Thresholds = {
  pollingAlertSec: 60,
  cspBurstCount: 5,
  cspBurstWindowSec: 60,
};

const LS_KEY = "siem.diag.thresholds";

let current: Thresholds = (() => {
  if (typeof window === "undefined") return DEFAULT_THRESHOLDS;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    return raw ? { ...DEFAULT_THRESHOLDS, ...JSON.parse(raw) } : DEFAULT_THRESHOLDS;
  } catch {
    return DEFAULT_THRESHOLDS;
  }
})();

const listeners = new Set<() => void>();

export function getThresholds(): Thresholds {
  return current;
}

export function setThresholds(patch: Partial<Thresholds>) {
  current = { ...current, ...patch };
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(current));
  } catch { /* noop */ }
  listeners.forEach((l) => l());
}

export function useThresholds() {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => current,
    () => current,
  );
}
