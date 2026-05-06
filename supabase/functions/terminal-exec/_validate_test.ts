import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { validateArgs } from "./_validate.ts";

Deno.test("rejects unknown command", () => {
  const r = validateArgs("rm", ["-rf", "/"]);
  assertEquals(r.ok, false);
  assertEquals(r.error, "command not allowed");
});

Deno.test("rejects non-array args", () => {
  assertEquals(validateArgs("curl", "https://x.com" as unknown).ok, false);
});

Deno.test("curl: accepts a clean https URL", () => {
  const r = validateArgs("curl", ["https://example.com/path"]);
  assertEquals(r.ok, true);
});

Deno.test("curl: rejects shell metacharacters in args", () => {
  for (const bad of ["https://x.com;ls", "https://x.com|cat", "`whoami`", "$(id)", "https://x.com&&pwd"]) {
    const r = validateArgs("curl", [bad]);
    assertEquals(r.ok, false, `expected reject for ${bad}`);
    assertEquals(r.error, "arg contains forbidden characters");
  }
});

Deno.test("curl: rejects file://, ftp://, javascript: schemes", () => {
  for (const u of ["file:///etc/passwd", "ftp://x.com", "javascript:alert(1)"]) {
    assertEquals(validateArgs("curl", [u]).ok, false);
  }
});

Deno.test("curl: rejects URLs with embedded credentials", () => {
  assertEquals(validateArgs("curl", ["https://user:pass@example.com"]).ok, false);
});

Deno.test("curl: blocks SSRF to private/loopback hosts", () => {
  for (const u of [
    "http://localhost/admin",
    "http://127.0.0.1:8080",
    "http://10.0.0.5",
    "http://192.168.1.1",
    "http://172.16.0.1",
    "http://169.254.169.254/latest/meta-data",
    "http://metadata.internal",
    "http://printer.local",
  ]) {
    const r = validateArgs("curl", [u]);
    assertEquals(r.ok, false, `expected SSRF block for ${u}`);
    assertEquals(r.error, "invalid or disallowed URL");
  }
});

Deno.test("curl: rejects unknown flags but allows -I -L -v", () => {
  assertEquals(validateArgs("curl", ["-X", "POST", "https://x.com"]).ok, false);
  assertEquals(validateArgs("curl", ["-I", "https://x.com"]).ok, true);
  assertEquals(validateArgs("curl", ["-L", "-v", "https://x.com"]).ok, true);
});

Deno.test("wget: requires URL, rejects --post-data", () => {
  assertEquals(validateArgs("wget", ["--post-data=1", "https://x.com"]).ok, false);
  assertEquals(validateArgs("wget", ["https://x.com/file.txt"]).ok, true);
});

Deno.test("dig: accepts hostname + record type, rejects private", () => {
  assertEquals(validateArgs("dig", ["example.com", "A"]).ok, true);
  assertEquals(validateArgs("dig", ["example.com", "MX", "+short"]).ok, true);
  assertEquals(validateArgs("dig", ["localhost"]).ok, false);
  assertEquals(validateArgs("dig", ["10.0.0.1"]).ok, false); // matches /^10\./
  assertEquals(validateArgs("dig", ["bad host!"]).ok, false);
});

Deno.test("nslookup: same rules as dig", () => {
  assertEquals(validateArgs("nslookup", ["google.com"]).ok, true);
  assertEquals(validateArgs("nslookup", ["evil;rm"]).ok, false);
  assertEquals(validateArgs("nslookup", ["192.168.1.1"]).ok, false);
});

Deno.test("ping: -c must be integer 1..8", () => {
  assertEquals(validateArgs("ping", ["-c", "4", "example.com"]).ok, true);
  assertEquals(validateArgs("ping", ["-c", "0", "example.com"]).ok, false);
  assertEquals(validateArgs("ping", ["-c", "999", "example.com"]).ok, false);
  assertEquals(validateArgs("ping", ["-c", "abc", "example.com"]).ok, false);
  assertEquals(validateArgs("ping", ["127.0.0.1"]).ok, false);
});

Deno.test("whois: accepts public domain, rejects junk", () => {
  assertEquals(validateArgs("whois", ["example.com"]).ok, true);
  assertEquals(validateArgs("whois", ["example.com|ls"]).ok, false);
});

Deno.test("ipinfo/myip: accepts IPv4/host, rejects private", () => {
  assertEquals(validateArgs("ipinfo", ["8.8.8.8"]).ok, true);
  assertEquals(validateArgs("ipinfo", ["192.168.0.1"]).ok, false);
  assertEquals(validateArgs("myip", []).ok, true);
});

Deno.test("rejects too many args", () => {
  const many = Array(13).fill("a");
  assertEquals(validateArgs("curl", many).ok, false);
});

Deno.test("rejects oversized args", () => {
  assertEquals(validateArgs("curl", ["a".repeat(513)]).ok, false);
});
