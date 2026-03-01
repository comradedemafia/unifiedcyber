import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Terminal, Play, Square, ChevronRight } from "lucide-react";

const pythonScripts: Record<string, { output: string[]; delay: number }> = {
  "python3 scanner.py --target 192.168.1.0/24": {
    delay: 120,
    output: [
      "#!/usr/bin/env python3",
      '"""Unified Network Scanner - UCSF Module"""',
      "",
      "import nmap, socket, sys",
      "from datetime import datetime",
      "",
      "[*] Starting UCSF Network Scanner v2.1",
      `[*] Target: 192.168.1.0/24`,
      `[*] Scan started at: ${new Date().toISOString()}`,
      "",
      "[+] Discovering live hosts...",
      "    ├── 192.168.1.1   [GATEWAY]  UP  (latency: 1.2ms)",
      "    ├── 192.168.1.10  [SERVER]   UP  (latency: 0.8ms)",
      "    ├── 192.168.1.15  [WORKST]   UP  (latency: 2.1ms)",
      "    ├── 192.168.1.22  [PRINTER]  UP  (latency: 5.4ms)",
      "    ├── 192.168.1.33  [UNKNOWN]  UP  (latency: 1.9ms)",
      "    └── 192.168.1.105 [SUSPECT]  UP  (latency: 0.3ms) ⚠️",
      "",
      "[+] 6 hosts discovered in 4.2 seconds",
      "",
      "[*] Running port scan on flagged host 192.168.1.105...",
      "    PORT     STATE   SERVICE        VERSION",
      "    22/tcp   open    ssh            OpenSSH 8.9p1",
      "    80/tcp   open    http           Apache 2.4.52",
      "    443/tcp  open    https          Apache 2.4.52",
      "    3306/tcp open    mysql          MySQL 8.0.32",
      "    8080/tcp open    http-proxy     ⚠️ SUSPICIOUS",
      "    9090/tcp open    unknown        ⚠️ C2 SIGNATURE MATCH",
      "",
      "[!] ALERT: Host 192.168.1.105 flagged — potential C2 beacon on port 9090",
      "[*] Sending alert to SIEM → Wazuh Manager...",
      "[✓] Alert dispatched. Rule ID: 100201 | Level: 12 (HIGH)",
      "[✓] Automated firewall rule applied: DROP 192.168.1.105:9090",
      "",
      ">>> Scan complete. Results saved to /var/log/ucsf/scan_results.json",
    ],
  },
  "python3 vuln_check.py --deep": {
    delay: 100,
    output: [
      "#!/usr/bin/env python3",
      '"""UCSF Vulnerability Assessment Engine"""',
      "",
      "import requests, json, hashlib",
      "from concurrent.futures import ThreadPoolExecutor",
      "",
      "[*] UCSF Vulnerability Assessment v1.4",
      "[*] Loading CVE database (2024-2026)...",
      "[✓] 234,891 CVE entries loaded",
      "",
      "[*] Scanning web application on 192.168.1.10:443...",
      "",
      "  VULN-001 [CRITICAL] SQL Injection",
      "    └── Location: /api/users?id=1' OR '1'='1",
      "    └── Type: Boolean-based blind SQLi",
      "    └── CVE: CVE-2024-23897",
      "    └── Fix: Use parameterized queries",
      "",
      "  VULN-002 [HIGH] Cross-Site Scripting (XSS)",
      "    └── Location: /search?q=<script>alert(1)</script>",
      "    └── Type: Reflected XSS",
      "    └── CVE: CVE-2024-21626",
      "    └── Fix: Sanitize user input, encode output",
      "",
      "  VULN-003 [MEDIUM] Outdated SSL/TLS",
      "    └── TLS 1.0 enabled — should be disabled",
      "    └── Weak cipher: TLS_RSA_WITH_RC4_128_SHA",
      "    └── Fix: Enforce TLS 1.2+ only",
      "",
      "  VULN-004 [LOW] Missing Security Headers",
      "    └── X-Frame-Options: MISSING",
      "    └── Content-Security-Policy: MISSING",
      "    └── X-Content-Type-Options: MISSING",
      "",
      "[*] Generating ModSecurity rules...",
      "[✓] 3 custom WAF rules generated → /etc/modsecurity/ucsf_rules.conf",
      "[✓] Report exported → /var/log/ucsf/vuln_report_2026.pdf",
      "",
      ">>> Assessment complete: 1 CRITICAL, 1 HIGH, 1 MEDIUM, 1 LOW",
    ],
  },
  "python3 ids_monitor.py --realtime": {
    delay: 150,
    output: [
      "#!/usr/bin/env python3",
      '"""UCSF Intrusion Detection System - Real-time Monitor"""',
      "",
      "import asyncio, json",
      "from wazuh_api import WazuhClient",
      "from suricata import SuricataSocket",
      "",
      "[*] UCSF IDS Monitor v3.0 — Real-time Mode",
      "[*] Connecting to Wazuh Manager API...",
      "[✓] Connected: wazuh-manager.local:55000",
      "[*] Connecting to Suricata EVE socket...",
      "[✓] Connected: /var/run/suricata/eve.sock",
      "",
      "[LIVE] Monitoring started — Press Ctrl+C to stop",
      "─────────────────────────────────────────────────",
      "",
      `[${new Date().toLocaleTimeString()}] SYSTEM  | File integrity: /etc/shadow modified`,
      `[${new Date().toLocaleTimeString()}] NETWORK | SYN flood detected from 45.33.32.156`,
      `[${new Date().toLocaleTimeString()}] WEB     | SQLi attempt blocked: /api/login`,
      `[${new Date().toLocaleTimeString()}] SYSTEM  | Brute force SSH: 15 attempts in 30s`,
      `[${new Date().toLocaleTimeString()}] NETWORK | DNS tunnel detected: suspicious TXT queries`,
      `[${new Date().toLocaleTimeString()}] SIEM    | Correlation: Multi-layer attack pattern`,
      "",
      "[!] CORRELATED EVENT DETECTED:",
      "    ├── Stage 1: Port scan from 45.33.32.156 (Network)",
      "    ├── Stage 2: SQLi attempts on /api/login (Web)",
      "    ├── Stage 3: SSH brute force on server (System)",
      "    └── Classification: COORDINATED ATTACK",
      "",
      "[✓] Automated Response: IP 45.33.32.156 blocked at all layers",
      "[✓] Incident ticket created: INC-2026-0847",
      "[✓] Notification sent to SOC team via webhook",
    ],
  },
  help: {
    delay: 50,
    output: [
      "╔══════════════════════════════════════════════════╗",
      "║  UCSF — Unified Cyber Security Framework v2.1   ║",
      "║  Python3 Security Operations Terminal            ║",
      "╚══════════════════════════════════════════════════╝",
      "",
      "Available commands:",
      "",
      "  python3 scanner.py --target 192.168.1.0/24",
      "    → Network discovery & port scanning",
      "",
      "  python3 vuln_check.py --deep",
      "    → Web application vulnerability assessment",
      "",
      "  python3 ids_monitor.py --realtime",
      "    → Real-time intrusion detection monitoring",
      "",
      "  clear  → Clear terminal",
      "  help   → Show this help message",
    ],
  },
};

const SecurityTerminal = () => {
  const [lines, setLines] = useState<{ text: string; type: "input" | "output" | "system" }[]>([
    { text: "UCSF Security Terminal v2.1 — Python3 Environment", type: "system" },
    { text: 'Type "help" for available commands', type: "system" },
    { text: "", type: "system" },
  ]);
  const [input, setInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(scrollToBottom, [lines, scrollToBottom]);

  const executeCommand = useCallback(async (cmd: string) => {
    const trimmed = cmd.trim().toLowerCase();

    if (trimmed === "clear") {
      setLines([]);
      return;
    }

    setLines((prev) => [...prev, { text: `$ ${cmd}`, type: "input" }]);

    const script = pythonScripts[trimmed] || pythonScripts[cmd.trim()];
    if (!script) {
      setLines((prev) => [...prev, { text: `bash: command not found: ${cmd}`, type: "output" }]);
      return;
    }

    setIsRunning(true);
    for (const line of script.output) {
      await new Promise((r) => setTimeout(r, script.delay));
      setLines((prev) => [...prev, { text: line, type: "output" }]);
    }
    setLines((prev) => [...prev, { text: "", type: "system" }]);
    setIsRunning(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isRunning) return;
    const cmd = input;
    setInput("");
    executeCommand(cmd);
  };

  const getLineColor = (line: { text: string; type: string }) => {
    if (line.type === "input") return "text-primary";
    if (line.type === "system") return "text-muted-foreground/60";
    if (line.text.startsWith("[!]") || line.text.includes("CRITICAL") || line.text.includes("⚠️")) return "text-destructive";
    if (line.text.startsWith("[✓]") || line.text.includes("[+]")) return "text-success";
    if (line.text.startsWith("[*]")) return "text-primary/80";
    if (line.text.includes("HIGH")) return "text-warning";
    if (line.text.includes("MEDIUM")) return "text-accent";
    if (line.text.startsWith("  VULN-")) return "text-warning";
    if (line.text.startsWith("    └──") || line.text.startsWith("    ├──")) return "text-muted-foreground/80";
    return "text-foreground/70";
  };

  return (
    <section id="terminal" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/20 to-transparent" />
      <div className="container mx-auto px-6 relative">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
            <span className="font-mono text-[10px] tracking-[0.3em] text-primary/60 uppercase">Python3 Console</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground text-center mb-4 tracking-tight">
            Security <span className="text-primary text-glow">Terminal</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-center">
            Interactive Python3 security operations console. Run scans, check vulnerabilities, and monitor intrusions.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto rounded-xl border border-border/60 bg-background overflow-hidden shadow-2xl"
          onClick={() => inputRef.current?.focus()}
        >
          {/* Title bar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-card border-b border-border/40">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-warning/60" />
                <div className="w-3 h-3 rounded-full bg-success/60" />
              </div>
              <span className="font-mono text-[10px] text-muted-foreground ml-2">
                ucsf@security-ops:~
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isRunning && (
                <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-success" />
                  <span className="font-mono text-[9px] text-success">RUNNING</span>
                </motion.div>
              )}
              <Terminal className="w-3.5 h-3.5 text-muted-foreground/40" />
            </div>
          </div>

          {/* Terminal body */}
          <div ref={scrollRef} className="h-[420px] overflow-y-auto p-4 font-mono text-xs leading-relaxed">
            {lines.map((line, i) => (
              <div key={i} className={`${getLineColor(line)} whitespace-pre-wrap`}>
                {line.text || "\u00A0"}
              </div>
            ))}

            {/* Input line */}
            <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-1">
              <ChevronRight className="w-3 h-3 text-primary shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isRunning}
                className="flex-1 bg-transparent text-foreground outline-none font-mono text-xs placeholder:text-muted-foreground/30 disabled:opacity-40"
                placeholder={isRunning ? "Executing..." : "Type a command..."}
                autoComplete="off"
                spellCheck={false}
              />
            </form>
          </div>

          {/* Quick commands */}
          <div className="px-4 py-3 border-t border-border/30 bg-card/50 flex flex-wrap gap-2">
            <span className="text-[9px] text-muted-foreground/40 font-mono mr-2 self-center">Quick:</span>
            {[
              { label: "Network Scan", cmd: "python3 scanner.py --target 192.168.1.0/24" },
              { label: "Vuln Check", cmd: "python3 vuln_check.py --deep" },
              { label: "IDS Monitor", cmd: "python3 ids_monitor.py --realtime" },
            ].map((q) => (
              <button
                key={q.label}
                onClick={() => { if (!isRunning) { setInput(""); executeCommand(q.cmd); } }}
                disabled={isRunning}
                className="text-[10px] font-mono px-3 py-1.5 rounded-lg bg-primary/8 text-primary border border-primary/15 hover:bg-primary/15 transition-all disabled:opacity-30"
              >
                <Play className="w-2.5 h-2.5 inline mr-1" />
                {q.label}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SecurityTerminal;
