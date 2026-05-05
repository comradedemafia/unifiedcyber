/**
 * Client-side rate limiter for the terminal-exec edge function.
 * Token-bucket per session — also enforced server-side in the function.
 */
const KEY = "siem.term.rate";
const MAX_TOKENS = 10;          // burst
const REFILL_PER_SEC = 0.5;     // 30 / minute sustained

interface Bucket { tokens: number; updated: number; }

function load(): Bucket {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* */ }
  return { tokens: MAX_TOKENS, updated: Date.now() };
}

function save(b: Bucket) {
  try { sessionStorage.setItem(KEY, JSON.stringify(b)); } catch { /* */ }
}

export function consumeToken(): { ok: boolean; retryInMs: number } {
  const b = load();
  const now = Date.now();
  const elapsed = (now - b.updated) / 1000;
  b.tokens = Math.min(MAX_TOKENS, b.tokens + elapsed * REFILL_PER_SEC);
  b.updated = now;
  if (b.tokens >= 1) {
    b.tokens -= 1;
    save(b);
    return { ok: true, retryInMs: 0 };
  }
  save(b);
  const need = 1 - b.tokens;
  return { ok: false, retryInMs: Math.ceil((need / REFILL_PER_SEC) * 1000) };
}
