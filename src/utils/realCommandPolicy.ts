/**
 * Allowlist + safety policy for real network commands invoked from the terminal.
 * These commands hit the `terminal-exec` edge function which performs outbound
 * fetches. We restrict to read-only verbs, deny private/internal ranges, and
 * require explicit user confirmation per host (with a session allowlist).
 */

export const ALLOWED_REAL_COMMANDS = [
  "curl", "wget", "dig", "whois", "ping", "nslookup", "ipinfo", "myip",
] as const;

export type AllowedRealCommand = typeof ALLOWED_REAL_COMMANDS[number];

const PRIVATE_HOST_PATTERNS: RegExp[] = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^169\.254\./,
  /^::1$/,
  /^fe80:/i,
  /\.local$/i,
  /\.internal$/i,
];

const SESSION_ALLOW_KEY = "siem.term.allowedHosts";

export function isAllowedCommand(cmd: string): cmd is AllowedRealCommand {
  return (ALLOWED_REAL_COMMANDS as readonly string[]).includes(cmd);
}

/** Pull the host/target arg the command will operate on (best-effort). */
export function extractTarget(cmd: AllowedRealCommand, args: string[]): string | undefined {
  if (cmd === "myip") return undefined;
  if (cmd === "curl" || cmd === "wget") {
    const url = args.find((a) => /^https?:\/\//i.test(a));
    if (url) {
      try { return new URL(url).hostname; } catch { return undefined; }
    }
    return args.find((a) => !a.startsWith("-"));
  }
  // dig/whois/ping/nslookup/ipinfo — first non-flag, non-record-type arg
  return args.find((a) => !a.startsWith("-") && !["A","AAAA","MX","NS","TXT"].includes(a));
}

export function isPrivateHost(host?: string): boolean {
  if (!host) return false;
  return PRIVATE_HOST_PATTERNS.some((rx) => rx.test(host));
}

export function getSessionAllowlist(): string[] {
  try {
    const raw = sessionStorage.getItem(SESSION_ALLOW_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function addToSessionAllowlist(host: string) {
  if (!host) return;
  const cur = new Set(getSessionAllowlist());
  cur.add(host.toLowerCase());
  try {
    sessionStorage.setItem(SESSION_ALLOW_KEY, JSON.stringify([...cur]));
  } catch { /* ignore */ }
}

export function isHostAllowedThisSession(host?: string): boolean {
  if (!host) return false;
  return getSessionAllowlist().includes(host.toLowerCase());
}

export function removeFromSessionAllowlist(host: string) {
  const next = getSessionAllowlist().filter((h) => h !== host.toLowerCase());
  try {
    sessionStorage.setItem(SESSION_ALLOW_KEY, JSON.stringify(next));
  } catch { /* */ }
}

export function clearSessionAllowlist() {
  try { sessionStorage.removeItem(SESSION_ALLOW_KEY); } catch { /* */ }
}

export function exportAllowlistJSON(): string {
  return JSON.stringify(
    { version: 1, exported_at: new Date().toISOString(), hosts: getSessionAllowlist() },
    null, 2
  );
}

export interface ImportResult { added: number; skipped: number; errors: string[]; }

export function importAllowlistJSON(json: string, mode: "merge" | "replace" = "merge"): ImportResult {
  const result: ImportResult = { added: 0, skipped: 0, errors: [] };
  let parsed: any;
  try { parsed = JSON.parse(json); } catch { result.errors.push("Invalid JSON"); return result; }

  const hosts: unknown = Array.isArray(parsed) ? parsed : parsed?.hosts;
  if (!Array.isArray(hosts)) { result.errors.push("Expected array or {hosts:[...]}"); return result; }

  const valid = /^[a-z0-9.-]+(\.[a-z]{2,})$/i;
  const existing = new Set(mode === "replace" ? [] : getSessionAllowlist());
  for (const h of hosts) {
    if (typeof h !== "string" || !valid.test(h) || PRIVATE_HOST_PATTERNS.some((rx) => rx.test(h))) {
      result.skipped++; continue;
    }
    const low = h.toLowerCase();
    if (existing.has(low)) { result.skipped++; continue; }
    existing.add(low); result.added++;
  }
  try {
    sessionStorage.setItem(SESSION_ALLOW_KEY, JSON.stringify([...existing]));
  } catch (e) {
    result.errors.push("Failed to persist to sessionStorage");
  }
  return result;
}
