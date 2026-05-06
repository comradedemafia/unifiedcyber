// Real network commands executor for Kali terminal simulation.
// Supports: curl, wget, dig, whois, ping (HTTP HEAD), http, ipinfo
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

// Multi-dimensional token-bucket rate limiting (per IP, per user, per command).
// Defence-in-depth alongside the client-side limiter. Resets on cold start.
interface Bucket { tokens: number; updated: number; }
const ipBuckets = new Map<string, Bucket>();
const userBuckets = new Map<string, Bucket>();
const cmdBuckets = new Map<string, Bucket>(); // key: `${userOrIp}::${command}`

function take(map: Map<string, Bucket>, key: string, max: number, refillPerSec: number) {
  const now = Date.now();
  const b = map.get(key) ?? { tokens: max, updated: now };
  const elapsed = (now - b.updated) / 1000;
  b.tokens = Math.min(max, b.tokens + elapsed * refillPerSec);
  b.updated = now;
  if (b.tokens >= 1) {
    b.tokens -= 1;
    map.set(key, b);
    return { ok: true, retryInMs: 0 };
  }
  map.set(key, b);
  return { ok: false, retryInMs: Math.ceil(((1 - b.tokens) / refillPerSec) * 1000) };
}

function checkAllLimits(ip: string, userId: string | null, command: string) {
  // Per IP: burst 6, 20/min sustained
  const ipR = take(ipBuckets, ip, 6, 20 / 60);
  if (!ipR.ok) return { ok: false, scope: "ip", retryInMs: ipR.retryInMs };
  // Per user (if authed): burst 10, 40/min
  if (userId) {
    const uR = take(userBuckets, userId, 10, 40 / 60);
    if (!uR.ok) return { ok: false, scope: "user", retryInMs: uR.retryInMs };
  }
  // Per (user|ip)+command: burst 4, 10/min — blocks brute-forcing one verb
  const cmdKey = `${userId ?? ip}::${command}`;
  const cR = take(cmdBuckets, cmdKey, 4, 10 / 60);
  if (!cR.ok) return { ok: false, scope: "command", retryInMs: cR.retryInMs };
  return { ok: true, scope: "ok", retryInMs: 0 };
}

const ALLOWED = new Set(["curl","wget","dig","whois","ping","nslookup","ipinfo","myip"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim()
    || req.headers.get("cf-connecting-ip")
    || "unknown";

  // Best-effort user identification from JWT (sub claim) without verifying signature here —
  // edge function is publicly invokable but we still meter authenticated callers separately.
  let userId: string | null = null;
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    try {
      const payload = JSON.parse(atob(auth.slice(7).split(".")[1]));
      if (typeof payload?.sub === "string") userId = payload.sub;
    } catch { /* ignore */ }
  }

  try {
    const { command, args } = await req.json();
    if (!ALLOWED.has(command)) {
      return new Response(JSON.stringify({ output: [`error: '${command}' is not allowed`] }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rl = checkAllLimits(ip, userId, command);
    if (!rl.ok) {
      const secs = Math.ceil(rl.retryInMs / 1000);
      return new Response(JSON.stringify({
        output: [`error: rate limit exceeded (${rl.scope}) — retry in ${secs}s`],
      }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(secs) },
      });
    }

    const lines: string[] = [];
    const t0 = Date.now();

    if (command === "curl") {
      const urlArg = args.find((a: string) => a.startsWith("http")) || args[args.length - 1];
      if (!urlArg) return ok(["curl: try 'curl --help' for more information"]);
      const verbose = args.includes("-v") || args.includes("--verbose");
      const headOnly = args.includes("-I") || args.includes("--head");
      const res = await fetch(urlArg, { method: headOnly ? "HEAD" : "GET", redirect: "follow" });
      if (verbose || headOnly) {
        lines.push(`* Connected to ${new URL(urlArg).host}`);
        lines.push(`> ${headOnly ? "HEAD" : "GET"} ${new URL(urlArg).pathname} HTTP/1.1`);
        lines.push(`> Host: ${new URL(urlArg).host}`);
        lines.push(`> User-Agent: curl/8.5.0`);
        lines.push(``);
        lines.push(`< HTTP/1.1 ${res.status} ${res.statusText}`);
        res.headers.forEach((v, k) => lines.push(`< ${k}: ${v}`));
        lines.push(``);
      }
      if (!headOnly) {
        const text = await res.text();
        lines.push(...text.slice(0, 8000).split("\n"));
      }
      return ok(lines);
    }

    if (command === "wget") {
      const urlArg = args.find((a: string) => a.startsWith("http"));
      if (!urlArg) return ok(["wget: missing URL"]);
      const res = await fetch(urlArg);
      const text = await res.text();
      const file = urlArg.split("/").pop() || "index.html";
      lines.push(`--${new Date().toISOString()}--  ${urlArg}`);
      lines.push(`Resolving ${new URL(urlArg).host}...`);
      lines.push(`HTTP request sent, awaiting response... ${res.status} ${res.statusText}`);
      lines.push(`Length: ${text.length} bytes`);
      lines.push(`Saving to: '${file}'`);
      lines.push(``);
      lines.push(`'${file}' saved [${text.length}/${text.length}]`);
      return ok(lines);
    }

    if (command === "ping") {
      const host = args.find((a: string) => !a.startsWith("-")) || "localhost";
      const count = parseInt(args[args.indexOf("-c") + 1] || "4");
      lines.push(`PING ${host} (resolved): 56 data bytes`);
      for (let i = 0; i < Math.min(count, 8); i++) {
        const start = Date.now();
        try {
          await fetch(`https://${host}`, { method: "HEAD", signal: AbortSignal.timeout(2000) });
          const t = Date.now() - start;
          lines.push(`64 bytes from ${host}: icmp_seq=${i} ttl=64 time=${t}.0 ms`);
        } catch {
          lines.push(`Request timeout for icmp_seq ${i}`);
        }
      }
      lines.push(``);
      lines.push(`--- ${host} ping statistics ---`);
      lines.push(`${count} packets transmitted, ${count} received, 0% packet loss`);
      return ok(lines);
    }

    if (command === "dig" || command === "nslookup") {
      const host = args.find((a: string) => !a.startsWith("-") && !["A","AAAA","MX","NS","TXT"].includes(a)) || "google.com";
      const type = args.find((a: string) => ["A","AAAA","MX","NS","TXT"].includes(a)) || "A";
      const res = await fetch(`https://dns.google/resolve?name=${host}&type=${type}`);
      const json = await res.json();
      lines.push(`; <<>> DiG 9.18.30 <<>> ${host} ${type}`);
      lines.push(`;; Got answer:`);
      lines.push(`;; ->>HEADER<<- opcode: QUERY, status: ${json.Status === 0 ? "NOERROR" : "ERROR"}`);
      lines.push(``);
      lines.push(`;; QUESTION SECTION:`);
      lines.push(`;${host}.\t\tIN\t${type}`);
      lines.push(``);
      if (json.Answer) {
        lines.push(`;; ANSWER SECTION:`);
        for (const a of json.Answer) lines.push(`${a.name}\t${a.TTL}\tIN\t${type}\t${a.data}`);
      }
      lines.push(``);
      lines.push(`;; Query time: ${Date.now() - t0} msec`);
      lines.push(`;; SERVER: 8.8.8.8#53(dns.google)`);
      return ok(lines);
    }

    if (command === "whois") {
      const host = args[0] || "google.com";
      try {
        const res = await fetch(`https://rdap.org/domain/${host}`);
        const json = await res.json();
        lines.push(`Domain Name: ${json.ldhName || host}`);
        lines.push(`Registry Domain ID: ${json.handle || "N/A"}`);
        for (const ev of json.events || []) lines.push(`${ev.eventAction}: ${ev.eventDate}`);
        for (const ns of json.nameservers || []) lines.push(`Name Server: ${ns.ldhName}`);
        for (const status of json.status || []) lines.push(`Domain Status: ${status}`);
      } catch {
        lines.push(`whois: unable to lookup ${host}`);
      }
      return ok(lines);
    }

    if (command === "ipinfo" || command === "myip") {
      const ip = args[0];
      const url = ip ? `https://ipapi.co/${ip}/json/` : "https://ipapi.co/json/";
      const res = await fetch(url);
      const j = await res.json();
      lines.push(`IP:          ${j.ip}`);
      lines.push(`Hostname:    ${j.hostname || "N/A"}`);
      lines.push(`City:        ${j.city}`);
      lines.push(`Region:      ${j.region}`);
      lines.push(`Country:     ${j.country_name} (${j.country})`);
      lines.push(`Org:         ${j.org}`);
      lines.push(`Lat/Lon:     ${j.latitude}, ${j.longitude}`);
      return ok(lines);
    }

    return ok([`${command}: command not supported in remote exec`]);
  } catch (err) {
    return ok([`error: ${(err as Error).message}`]);
  }

  function ok(lines: string[]) {
    return new Response(JSON.stringify({ output: lines }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
