// Argument validation / sanitisation for the terminal-exec edge function.
// Extracted into its own module so it can be unit-tested without booting
// the HTTP server in index.ts.

export const ALLOWED = new Set([
  "curl","wget","dig","whois","ping","nslookup","ipinfo","myip",
]);

export const MAX_ARGS = 12;
export const MAX_ARG_LEN = 512;

// Reject any shell metacharacter even though we never spawn a shell.
export const SHELL_META = /[;&|`$<>\\\n\r\t\x00"'(){}[\]*?!]/;
export const SAFE_HOST = /^[a-zA-Z0-9.-]{1,253}$/;
export const SAFE_IP   = /^(\d{1,3}\.){3}\d{1,3}$|^[0-9a-fA-F:]{2,45}$/;

export const PRIVATE_HOST = [
  /^localhost$/i, /^127\./, /^10\./, /^192\.168\./,
  /^172\.(1[6-9]|2[0-9]|3[01])\./, /^169\.254\./,
  /^::1$/, /^fe80:/i, /\.local$/i, /\.internal$/i,
];

export const ALLOWED_FLAGS: Record<string, Set<string>> = {
  curl:     new Set(["-v","--verbose","-I","--head","-L","--location","-s","--silent"]),
  wget:     new Set(["-q","--quiet"]),
  dig:      new Set(["+short","+noall","+answer"]),
  whois:    new Set([]),
  ping:     new Set(["-c"]),
  nslookup: new Set([]),
  ipinfo:   new Set([]),
  myip:     new Set([]),
};

export const DNS_TYPES = new Set(["A","AAAA","MX","NS","TXT","CNAME","SOA","PTR"]);

export function isPrivateHost(h: string): boolean {
  return PRIVATE_HOST.some((rx) => rx.test(h));
}

export function parseUrl(u: string): URL | null {
  try {
    const url = new URL(u);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.username || url.password) return null;
    if (isPrivateHost(url.hostname)) return null;
    return url;
  } catch { return null; }
}

export interface ValidationResult { ok: boolean; error?: string; args: string[]; }

export function validateArgs(command: string, rawArgs: unknown): ValidationResult {
  if (!ALLOWED.has(command)) return { ok: false, error: "command not allowed", args: [] };
  if (!Array.isArray(rawArgs)) return { ok: false, error: "args must be an array", args: [] };
  if (rawArgs.length > MAX_ARGS) return { ok: false, error: `too many args (max ${MAX_ARGS})`, args: [] };

  const args: string[] = [];
  for (const a of rawArgs) {
    if (typeof a !== "string") return { ok: false, error: "all args must be strings", args: [] };
    if (a.length > MAX_ARG_LEN) return { ok: false, error: "arg too long", args: [] };
    if (SHELL_META.test(a))   return { ok: false, error: "arg contains forbidden characters", args: [] };
    args.push(a);
  }

  const allowedFlags = ALLOWED_FLAGS[command] ?? new Set<string>();

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    const isFlag = a.startsWith("-") || a.startsWith("+");
    if (isFlag) {
      if (!allowedFlags.has(a)) return { ok: false, error: `flag not permitted: ${a}`, args: [] };
      if (command === "ping" && a === "-c") {
        const n = Number(args[i + 1]);
        if (!Number.isInteger(n) || n < 1 || n > 8) {
          return { ok: false, error: "ping -c expects integer 1..8", args: [] };
        }
        i++;
      }
      continue;
    }

    if (command === "curl" || command === "wget") {
      if (!parseUrl(a)) return { ok: false, error: "invalid or disallowed URL", args: [] };
    } else if (command === "dig" || command === "nslookup") {
      if (DNS_TYPES.has(a)) continue;
      if (!SAFE_HOST.test(a) || isPrivateHost(a)) {
        return { ok: false, error: "invalid hostname", args: [] };
      }
    } else if (command === "ping" || command === "whois") {
      if (!SAFE_HOST.test(a) || isPrivateHost(a)) {
        return { ok: false, error: "invalid hostname", args: [] };
      }
    } else if (command === "ipinfo" || command === "myip") {
      if (!SAFE_IP.test(a) && !SAFE_HOST.test(a)) {
        return { ok: false, error: "invalid IP/host", args: [] };
      }
      if (SAFE_HOST.test(a) && isPrivateHost(a)) {
        return { ok: false, error: "private host not allowed", args: [] };
      }
    }
  }
  return { ok: true, args };
}
