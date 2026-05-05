// Real network commands executor for Kali terminal simulation.
// Supports: curl, wget, dig, whois, ping (HTTP HEAD), http, ipinfo
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

// In-memory token bucket per client IP — resets on cold start.
// 20 requests / minute, burst 6. Defence-in-depth alongside client-side limiter.
interface Bucket { tokens: number; updated: number; }
const buckets = new Map<string, Bucket>();
const MAX_TOKENS = 6;
const REFILL_PER_SEC = 20 / 60;

function checkRate(ip: string): { ok: boolean; retryInMs: number } {
  const now = Date.now();
  const b = buckets.get(ip) ?? { tokens: MAX_TOKENS, updated: now };
  const elapsed = (now - b.updated) / 1000;
  b.tokens = Math.min(MAX_TOKENS, b.tokens + elapsed * REFILL_PER_SEC);
  b.updated = now;
  if (b.tokens >= 1) {
    b.tokens -= 1;
    buckets.set(ip, b);
    return { ok: true, retryInMs: 0 };
  }
  buckets.set(ip, b);
  const need = 1 - b.tokens;
  return { ok: false, retryInMs: Math.ceil((need / REFILL_PER_SEC) * 1000) };
}

const ALLOWED = new Set(["curl","wget","dig","whois","ping","nslookup","ipinfo","myip"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // --- Rate limit (per client IP) ---
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim()
    || req.headers.get("cf-connecting-ip")
    || "unknown";
  const rl = checkRate(ip);
  if (!rl.ok) {
    return new Response(JSON.stringify({
      output: [`error: rate limit exceeded — retry in ${Math.ceil(rl.retryInMs / 1000)}s`],
    }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(Math.ceil(rl.retryInMs / 1000)) },
    });
  }

  try {
    const { command, args } = await req.json();
    if (!ALLOWED.has(command)) {
      return new Response(JSON.stringify({ output: [`error: '${command}' is not allowed`] }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
