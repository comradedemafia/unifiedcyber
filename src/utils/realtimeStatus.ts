import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { getThresholds } from "./diagnosticsThresholds";

/**
 * Global store for realtime + CSP diagnostics.
 * - Tracks per-channel mode (websocket | polling | connecting | error) + filter (event/schema/table)
 * - Tracks first-payload health-check confirmation
 * - Records CSP violations in real time, persisted to localStorage
 * - Auto-alerts when polling persists too long or CSP violations spike in a 1-min window
 * - Exposes a `retry` callback so UI can re-attempt WebSocket without reload
 */

export type RealtimeMode = "connecting" | "websocket" | "polling" | "error";

export interface ChannelFilter {
  event?: string;
  schema?: string;
  table?: string;
}

export interface ChannelStatus {
  channel: string;
  mode: RealtimeMode;
  lastUpdate: number | null;
  firstPayloadAt: number | null;
  pollingSince?: number | null;
  reason?: string;
  filter?: ChannelFilter;
  retry?: () => void;
}

export interface CspViolation {
  id: string;
  at: number;
  blockedURI: string;
  violatedDirective: string;
  effectiveDirective: string;
  sourceFile?: string;
  lineNumber?: number;
}

export interface ChannelHistoryEntry {
  at: number;
  channel: string;
  mode: RealtimeMode;
  reason?: string;
  filter?: ChannelFilter;
}

interface State {
  channels: Record<string, ChannelStatus>;
  csp: CspViolation[];
  history: ChannelHistoryEntry[];
}

// ---------- Auto-alert thresholds ----------
const POLLING_ALERT_AFTER_MS = 60_000; // 1 min in polling = alert
const CSP_BURST_WINDOW_MS = 60_000;
const CSP_BURST_THRESHOLD = 5;

// ---------- localStorage persistence ----------
const LS_CSP = "siem.diag.csp";
const LS_HIST = "siem.diag.history";
const LS_LIMIT = 200;

function loadLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveLS(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota — ignore */
  }
}

let state: State = {
  channels: {},
  csp: loadLS<CspViolation[]>(LS_CSP, []),
  history: loadLS<ChannelHistoryEntry[]>(LS_HIST, []),
};

const listeners = new Set<() => void>();

function emit() {
  state = {
    channels: { ...state.channels },
    csp: [...state.csp],
    history: [...state.history],
  };
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function pushHistory(entry: ChannelHistoryEntry) {
  state.history = [entry, ...state.history].slice(0, LS_LIMIT);
  saveLS(LS_HIST, state.history);
}

export function setChannelStatus(
  channel: string,
  patch: Partial<Omit<ChannelStatus, "channel">>
) {
  const prev = state.channels[channel] ?? {
    channel,
    mode: "connecting" as RealtimeMode,
    lastUpdate: null,
    firstPayloadAt: null,
  };
  const next: ChannelStatus = { ...prev, ...patch, channel };

  // Track when polling started (for auto-alert)
  if (patch.mode === "polling" && prev.mode !== "polling") {
    next.pollingSince = Date.now();
    pushHistory({
      at: Date.now(),
      channel,
      mode: "polling",
      reason: patch.reason,
      filter: next.filter,
    });
  } else if (patch.mode && patch.mode !== "polling" && prev.mode === "polling") {
    next.pollingSince = null;
    if (patch.mode === "websocket") {
      pushHistory({
        at: Date.now(),
        channel,
        mode: "websocket",
        reason: "recovered",
        filter: next.filter,
      });
    }
  } else if (patch.mode && patch.mode !== prev.mode) {
    pushHistory({
      at: Date.now(),
      channel,
      mode: patch.mode,
      reason: patch.reason,
      filter: next.filter,
    });
  }

  state.channels[channel] = next;
  emit();
}

export function recordPayload(channel: string) {
  const prev = state.channels[channel];
  if (!prev) return;
  const now = Date.now();
  state.channels[channel] = {
    ...prev,
    lastUpdate: now,
    firstPayloadAt: prev.firstPayloadAt ?? now,
  };
  emit();
}

const recentlyAlertedCsp = { at: 0 };

export function recordCspViolation(v: Omit<CspViolation, "id" | "at">) {
  const entry: CspViolation = {
    ...v,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: Date.now(),
  };
  state.csp = [entry, ...state.csp].slice(0, LS_LIMIT);
  saveLS(LS_CSP, state.csp);
  emit();

  // Auto-alert: burst detection (uses dynamic thresholds)
  const th = getThresholds();
  const windowMs = th.cspBurstWindowSec * 1000;
  const cutoff = Date.now() - windowMs;
  const recent = state.csp.filter((c) => c.at >= cutoff);
  if (
    recent.length >= th.cspBurstCount &&
    Date.now() - recentlyAlertedCsp.at > windowMs
  ) {
    recentlyAlertedCsp.at = Date.now();
    toast.error("CSP violation burst detected", {
      description: `${recent.length} violations in the last ${th.cspBurstWindowSec}s — review diagnostics`,
      duration: 10000,
    });
  }
}

export function clearCspViolations() {
  state.csp = [];
  saveLS(LS_CSP, state.csp);
  emit();
}

export function clearHistory() {
  state.history = [];
  saveLS(LS_HIST, state.history);
  emit();
}

const getSnapshot = () => state;

export function useRealtimeStatus() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

// ---------- Polling-stuck auto-alert (runs once globally) ----------
const pollingAlertedFor = new Map<string, number>();

if (typeof window !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    const th = getThresholds();
    const pollMs = th.pollingAlertSec * 1000;
    for (const ch of Object.values(state.channels)) {
      if (ch.mode === "polling" && ch.pollingSince) {
        const stuck = now - ch.pollingSince;
        const lastAlert = pollingAlertedFor.get(ch.channel) ?? 0;
        if (stuck >= pollMs && now - lastAlert > 5 * 60_000) {
          pollingAlertedFor.set(ch.channel, now);
          toast.warning("Realtime stuck on polling", {
            description: `${ch.channel} has been polling for ${Math.round(stuck / 1000)}s`,
            duration: 10000,
            action: ch.retry
              ? { label: "Retry now", onClick: ch.retry }
              : undefined,
          });
        }
      } else {
        pollingAlertedFor.delete(ch.channel);
      }
    }
  }, 15_000);
}
