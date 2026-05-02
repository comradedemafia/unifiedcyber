import { useSyncExternalStore } from "react";

/**
 * Tiny global store for realtime + CSP diagnostics.
 * - Tracks per-channel mode (websocket | polling | connecting | error)
 * - Tracks first-payload health-check confirmation
 * - Records CSP violations in real time
 * - Exposes a `retry` callback so UI can re-attempt WebSocket without reload
 */

export type RealtimeMode = "connecting" | "websocket" | "polling" | "error";

export interface ChannelStatus {
  channel: string;
  mode: RealtimeMode;
  lastUpdate: number | null;
  firstPayloadAt: number | null;
  reason?: string;
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

interface State {
  channels: Record<string, ChannelStatus>;
  csp: CspViolation[];
}

let state: State = { channels: {}, csp: [] };
const listeners = new Set<() => void>();

function emit() {
  // freeze a new top-level reference so React re-renders
  state = { channels: { ...state.channels }, csp: [...state.csp] };
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
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
  state.channels[channel] = { ...prev, ...patch, channel };
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

export function recordCspViolation(v: Omit<CspViolation, "id" | "at">) {
  const entry: CspViolation = {
    ...v,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: Date.now(),
  };
  state.csp = [entry, ...state.csp].slice(0, 50);
  emit();
}

export function clearCspViolations() {
  state.csp = [];
  emit();
}

const getSnapshot = () => state;

export function useRealtimeStatus() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
