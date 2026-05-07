/**
 * Lightweight short-lived persistence for the Security Terminal.
 * Stores recent lines + command history per tab in localStorage with a TTL,
 * so reopening the page within the window restores history (incl. validation
 * messages) without leaking long-term across days.
 */

const KEY = "siem.term.session.v1";
const TTL_MS = 1000 * 60 * 60 * 6; // 6 hours
const MAX_LINES = 500;
const MAX_HISTORY = 200;

export interface PersistedTab {
  id: number;
  title: string;
  lines: { text: string; type: "input" | "output" | "system" }[];
  history: string[];
}

interface Snapshot { savedAt: number; tabs: PersistedTab[]; activeTabId: number; }

export function loadTerminalSession(): Snapshot | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const snap = JSON.parse(raw) as Snapshot;
    if (!snap?.savedAt || Date.now() - snap.savedAt > TTL_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return snap;
  } catch {
    return null;
  }
}

export function saveTerminalSession(tabs: PersistedTab[], activeTabId: number) {
  try {
    const trimmed = tabs.map((t) => ({
      ...t,
      lines: t.lines.slice(-MAX_LINES),
      history: t.history.slice(-MAX_HISTORY),
    }));
    localStorage.setItem(KEY, JSON.stringify({ savedAt: Date.now(), tabs: trimmed, activeTabId }));
  } catch { /* quota — ignore */ }
}

export function clearTerminalSession() {
  try { localStorage.removeItem(KEY); } catch { /* */ }
}
