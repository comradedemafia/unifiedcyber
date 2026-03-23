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
                    content: "192.168.1.0/24\n10.0.0.0/8\n172.16.0.0/12",
                    size: 42,
                    permissions: "-rw-r--r--",
                    owner: "kali",
                    modified: "Mar 23 14:20",
                  },
                  "notes.md": {
                    type: "file",
                    content: "# Penetration Test Notes\n\n## Scope\n- Internal network 192.168.1.0/24\n- Web application on port 443\n\n## Findings\n- SQL injection on /api/login\n- XSS on search endpoint\n- Weak TLS configuration",
                    size: 210,
                    permissions: "-rw-r--r--",
                    owner: "kali",
                    modified: "Mar 22 09:15",
                  },
                },
              },
              Downloads: { type: "dir", children: {} },
              ".bashrc": {
                type: "file",
                content: '# ~/.bashrc\nexport PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"\nexport PS1="┌──(kali㉿kali)-[\\w]\\n└─$ "\nalias ll="ls -la"\nalias grep="grep --color=auto"',
                size: 189,
                permissions: "-rw-r--r--",
                owner: "kali",
                modified: "Jan 15 08:00",
              },
              ".bash_history": {
                type: "file",
                content: "nmap -sV 192.168.1.0/24\nsqlmap -u http://target/login --dbs\nhydra -l admin -P /usr/share/wordlists/rockyou.txt ssh://192.168.1.10\nwireshark &\nmsfconsole",
                size: 156,
                permissions: "-rw-------",
                owner: "kali",
                modified: "Mar 23 16:45",
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
                content: '#!/usr/bin/env python3\n"""UCSF Vulnerability Assessment Engine"""\nimport requests\nimport json\nfrom concurrent.futures import ThreadPoolExecutor\n\ndef check_sqli(url):\n    payloads = ["\'", "\' OR 1=1--", "\' UNION SELECT NULL--"]\n    for p in payloads:\n        r = requests.get(f"{url}?id={p}")\n        if "error" in r.text.lower() or r.status_code == 500:\n            return True\n    return False\n\ndef check_xss(url):\n    payload = "<script>alert(1)</script>"\n    r = requests.get(f"{url}?q={payload}")\n    return payload in r.text',
                size: 487,
                permissions: "-rwxr-xr-x",
                owner: "kali",
                modified: "Mar 21 15:00",
              },
              "ids_monitor.py": {
                type: "file",
                content: '#!/usr/bin/env python3\n"""UCSF IDS Monitor - Real-time"""\nimport asyncio\nimport json\nfrom datetime import datetime\n\nasync def monitor():\n    print("[*] IDS Monitor started")\n    while True:\n        await asyncio.sleep(1)\n        print(f"[{datetime.now()}] Monitoring...")\n\nif __name__ == "__main__":\n    asyncio.run(monitor())',
                size: 298,
                permissions: "-rwxr-xr-x",
                owner: "kali",
                modified: "Mar 22 09:00",
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
            content: "root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nbin:x:2:2:bin:/bin:/usr/sbin/nologin\nsys:x:3:3:sys:/dev:/usr/sbin/nologin\nkali:x:1000:1000:Kali,,,:/home/kali:/bin/bash",
            size: 213,
            permissions: "-rw-r--r--",
            owner: "root",
            modified: "Jan 01 00:00",
          },
          shadow: {
            type: "file",
            content: "root:$6$rounds=656000$...:19000:0:99999:7:::\nkali:$6$rounds=656000$...:19000:0:99999:7:::",
            size: 98,
            permissions: "-rw-r-----",
            owner: "root",
            modified: "Jan 01 00:00",
          },
          hosts: {
            type: "file",
            content: "127.0.0.1\tlocalhost\n127.0.1.1\tkali\n::1\t\tlocalhost ip6-localhost ip6-loopback",
            size: 72,
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
            content: "nameserver 8.8.8.8\nnameserver 8.8.4.4",
            size: 38,
            permissions: "-rw-r--r--",
            owner: "root",
            modified: "Jan 01 00:00",
          },
        },
      },
      usr: {
        type: "dir",
        children: {
          bin: { type: "dir", children: {} },
          share: {
            type: "dir",
            children: {
              wordlists: {
                type: "dir",
                children: {
                  "rockyou.txt": { type: "file", content: "[Wordlist: 14,344,392 passwords]", size: 139921497, permissions: "-rw-r--r--", owner: "root", modified: "Jan 01 00:00" },
                },
              },
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
              "syslog": { type: "file", content: "Mar 23 16:00:01 kali CRON[1234]: (root) CMD (test -x /usr/sbin/anacron)\nMar 23 16:05:01 kali kernel: [UFW BLOCK] IN=eth0 OUT= SRC=45.33.32.156", size: 152, permissions: "-rw-r-----", owner: "root", modified: "Mar 23 16:05" },
              "auth.log": { type: "file", content: "Mar 23 15:30:01 kali sshd[5678]: Failed password for root from 45.33.32.156 port 22 ssh2\nMar 23 15:30:02 kali sshd[5678]: Failed password for root from 45.33.32.156 port 22 ssh2", size: 178, permissions: "-rw-r-----", owner: "root", modified: "Mar 23 15:30" },
            },
          },
        },
      },
      tmp: { type: "dir", children: {} },
      root: {
        type: "dir",
        children: {
          ".bashrc": { type: "file", content: "# root bashrc", size: 14, permissions: "-rw-r--r--", owner: "root", modified: "Jan 01 00:00" },
        },
      },
      proc: {
        type: "dir",
        children: {
          cpuinfo: { type: "file", content: "processor\t: 0\nvendor_id\t: GenuineIntel\ncpu family\t: 6\nmodel name\t: Intel(R) Core(TM) i9-13900K\nstepping\t: 1\ncpu MHz\t\t: 3000.000\ncache size\t: 36864 KB\ncpu cores\t: 24", size: 180, permissions: "-r--r--r--", owner: "root", modified: "Mar 23 00:00" },
          meminfo: { type: "file", content: "MemTotal:       32768000 kB\nMemFree:        18432000 kB\nMemAvailable:   24576000 kB\nBuffers:          512000 kB\nCached:          4096000 kB\nSwapTotal:       8192000 kB\nSwapFree:        8192000 kB", size: 200, permissions: "-r--r--r--", owner: "root", modified: "Mar 23 00:00" },
          version: { type: "file", content: "Linux version 6.6.9-amd64 (kali@kali-dev) (gcc-13 (Debian 13.2.0-13) 13.2.0) #1 SMP PREEMPT_DYNAMIC Kali 6.6.9-1kali1 (2026-01-15)", size: 132, permissions: "-r--r--r--", owner: "root", modified: "Mar 23 00:00" },
        },
      },
      dev: { type: "dir", children: {} },
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
