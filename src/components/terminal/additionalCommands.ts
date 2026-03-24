// Additional OS-level commands for a more realistic Kali Linux experience
import { TerminalState } from "./kaliCommands";
import { resolvePath, getNode, getParentAndName, formatSize, listDirRecursive } from "./kaliFileSystem";

type CmdResult = { output: string[]; newState?: Partial<TerminalState> };

// Installed packages tracker (simulates apt install)
const installedPackages = new Set<string>([
  "nmap", "python3", "git", "curl", "wget", "ssh", "bash", "ls", "cat", "grep", "find",
  "msfconsole", "metasploit-framework", "hydra", "sqlmap", "wireshark", "tcpdump",
  "aircrack-ng", "nikto", "gobuster", "john", "hashcat", "burpsuite", "dirb",
  "netcat", "nc", "ncat", "vim", "nano", "tar", "gzip", "zip", "unzip",
  "iptables", "ufw", "systemctl", "cron", "apache2", "nginx", "openssh-server",
  "python3-pip", "gcc", "make", "ruby", "perl", "php", "nodejs", "npm",
  "wfuzz", "enum4linux", "smbclient", "rpcclient", "crackmapexec", "responder",
  "impacket-scripts", "bloodhound", "wpscan", "subfinder", "amass", "ffuf",
  "binwalk", "foremost", "volatility3", "autopsy", "sleuthkit",
  "tor", "proxychains4", "socat", "chisel", "ligolo-ng",
]);

export const handleAptInstall = (args: string[], state: TerminalState): CmdResult => {
  const pkg = args.find(a => !a.startsWith("-"));
  if (!pkg) return { output: ["E: No package specified"] };
  
  if (installedPackages.has(pkg)) {
    return { output: [
      `Reading package lists... Done`,
      `Building dependency tree... Done`,
      `${pkg} is already the newest version.`,
      `0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.`,
    ]};
  }

  installedPackages.add(pkg);
  const size = (Math.random() * 50 + 5).toFixed(1);
  return { output: [
    `Reading package lists... Done`,
    `Building dependency tree... Done`,
    `Reading state information... Done`,
    `The following NEW packages will be installed:`,
    `  ${pkg}`,
    `0 upgraded, 1 newly installed, 0 to remove and 0 not upgraded.`,
    `Need to get ${size} MB of archives.`,
    `After this operation, ${(parseFloat(size) * 3.2).toFixed(1)} MB of additional disk space will be used.`,
    `Get:1 http://kali.download/kali kali-rolling/main amd64 ${pkg} amd64 [${size} MB]`,
    `Fetched ${size} MB in ${(Math.random() * 3 + 1).toFixed(0)}s (${(parseFloat(size) / (Math.random() * 3 + 1)).toFixed(1)} MB/s)`,
    `Selecting previously unselected package ${pkg}.`,
    `(Reading database ... 345678 files and directories currently installed.)`,
    `Preparing to unpack .../archives/${pkg}.deb ...`,
    `Unpacking ${pkg} ...`,
    `Setting up ${pkg} ...`,
    `Processing triggers for kali-menu (2026.1.0) ...`,
  ]};
};

export const handleAptSearch = (args: string[]): CmdResult => {
  const query = args.find(a => !a.startsWith("-")) || "";
  const results = [
    `Sorting... Done`,
    `Full Text Search... Done`,
  ];
  const pkgs = Array.from(installedPackages).filter(p => p.includes(query));
  for (const p of pkgs.slice(0, 10)) {
    results.push(`${p}/kali-rolling ${(Math.random() * 10).toFixed(1)}.${Math.floor(Math.random() * 10)} amd64`);
    results.push(`  Security tool: ${p}`);
    results.push("");
  }
  return { output: results };
};

export const handleAptFull = (args: string[], state: TerminalState): CmdResult => {
  if (args[0] === "update") return { output: [
    "Hit:1 http://kali.download/kali kali-rolling InRelease",
    "Hit:2 http://kali.download/kali kali-rolling/main amd64 Packages",
    "Hit:3 http://kali.download/kali kali-rolling/contrib amd64 Packages",
    "Hit:4 http://kali.download/kali kali-rolling/non-free amd64 Packages",
    "Reading package lists... Done",
    "Building dependency tree... Done",
    "Reading state information... Done",
    "All packages are up to date.",
  ]};
  if (args[0] === "upgrade") return { output: [
    "Reading package lists... Done",
    "Building dependency tree... Done",
    "Calculating upgrade... Done",
    "The following packages will be upgraded:",
    "  linux-image-amd64 nmap python3 metasploit-framework",
    "4 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.",
    "Need to get 156 MB of archives.",
    "...downloading...",
    "Processing triggers for linux-image-6.6.9-amd64 ...",
    "Done.",
  ]};
  if (args[0] === "install") return handleAptInstall(args.slice(1), state);
  if (args[0] === "remove" || args[0] === "purge") {
    const pkg = args[1];
    if (pkg) {
      installedPackages.delete(pkg);
      return { output: [`Removing ${pkg} ...`, `Processing triggers for kali-menu ...`, `Done.`] };
    }
    return { output: ["E: No package specified"] };
  }
  if (args[0] === "search") return handleAptSearch(args.slice(1));
  if (args[0] === "list" && args.includes("--installed")) {
    const pkgs = Array.from(installedPackages).sort().slice(0, 20);
    return { output: pkgs.map(p => `${p}/kali-rolling,now ${(Math.random()*10).toFixed(0)}.${Math.floor(Math.random()*10)}-0kali1 amd64 [installed]`) };
  }
  if (args[0] === "show") {
    const pkg = args[1] || "nmap";
    return { output: [
      `Package: ${pkg}`,
      `Version: ${(Math.random()*10).toFixed(0)}.${Math.floor(Math.random()*100)}`,
      `Priority: optional`,
      `Section: net`,
      `Maintainer: Kali Developers <devel@kali.org>`,
      `Installed-Size: ${Math.floor(Math.random()*50+5)} MB`,
      `Homepage: https://www.kali.org/tools/${pkg}/`,
      `Description: ${pkg} security tool for Kali Linux`,
    ]};
  }
  return { output: ["Usage: apt [options] command", "Commands: update, upgrade, install, remove, search, list, show"] };
};

export const cmdSort = (args: string[], state: TerminalState): CmdResult => {
  const reverse = args.includes("-r");
  const numeric = args.includes("-n");
  const unique = args.includes("-u");
  const file = args.find(a => !a.startsWith("-"));
  if (!file) return { output: [] };
  const path = resolvePath(state.cwd, file);
  const node = getNode(state.fs, path);
  if (!node || node.type !== "file") return { output: [`sort: cannot read '${file}': No such file or directory`] };
  let lines = (node.content || "").split("\n");
  if (numeric) lines.sort((a, b) => parseFloat(a) - parseFloat(b));
  else lines.sort();
  if (reverse) lines.reverse();
  if (unique) lines = [...new Set(lines)];
  return { output: lines };
};

export const cmdSed = (args: string[]): CmdResult => {
  // Very simple sed simulation
  return { output: ["[sed output - pattern applied]"] };
};

export const cmdAwk = (args: string[]): CmdResult => {
  return { output: ["[awk output - pattern processed]"] };
};

export const cmdCut = (args: string[], state: TerminalState): CmdResult => {
  const dIdx = args.indexOf("-d");
  const fIdx = args.indexOf("-f");
  const delimiter = dIdx >= 0 ? args[dIdx + 1] : "\t";
  const field = fIdx >= 0 ? parseInt(args[fIdx + 1]) - 1 : 0;
  const file = args.find(a => !a.startsWith("-") && a !== delimiter && a !== String(field + 1));
  if (!file) return { output: [] };
  const path = resolvePath(state.cwd, file);
  const node = getNode(state.fs, path);
  if (!node || node.type !== "file") return { output: [`cut: ${file}: No such file or directory`] };
  const lines = (node.content || "").split("\n");
  return { output: lines.map(l => l.split(delimiter)[field] || "").filter(Boolean) };
};

export const cmdTr = (args: string[]): CmdResult => {
  if (args.length < 2) return { output: ["tr: missing operand"] };
  return { output: [`[tr: ${args[0]} → ${args[1]}]`] };
};

export const cmdXargs = (args: string[]): CmdResult => {
  return { output: ["[xargs: commands executed]"] };
};

export const cmdTee = (args: string[], state: TerminalState): CmdResult => {
  const file = args.find(a => !a.startsWith("-"));
  if (file) {
    const path = resolvePath(state.cwd, file);
    const { parent, name } = getParentAndName(state.fs, path);
    if (parent?.type === "dir" && parent.children) {
      parent.children[name] = { type: "file", content: "[tee output]", size: 12, permissions: "-rw-r--r--", owner: state.user, modified: "Mar 23 " + new Date().toLocaleTimeString().slice(0, 5) };
    }
  }
  return { output: [] };
};

export const cmdDiff = (args: string[], state: TerminalState): CmdResult => {
  if (args.length < 2) return { output: ["diff: missing operand"] };
  return { output: [
    `--- ${args[0]}`,
    `+++ ${args[1]}`,
    `@@ -1,3 +1,4 @@`,
    ` line1`,
    `-old line`,
    `+new line`,
    `+added line`,
    ` line3`,
  ]};
};

export const cmdTar = (args: string[]): CmdResult => {
  if (args.includes("-xzf") || args.includes("-xvf")) {
    const file = args.find(a => a.endsWith(".tar.gz") || a.endsWith(".tgz") || a.endsWith(".tar"));
    return { output: file ? [`Extracting ${file}...`, `Done.`] : ["tar: You must specify one of the '-Acdtrux' options"] };
  }
  if (args.includes("-czf") || args.includes("-cvf")) {
    const file = args.find(a => a.endsWith(".tar.gz") || a.endsWith(".tgz") || a.endsWith(".tar"));
    return { output: file ? [`Creating archive ${file}...`, `Done.`] : ["tar: Missing archive name"] };
  }
  return { output: ["tar: You must specify one of the '-Acdtrux' options", "Try 'tar --help' for more information."] };
};

export const cmdZip = (args: string[]): CmdResult => {
  if (args.length < 2) return { output: ["zip: missing operand"] };
  return { output: [`  adding: ${args[1]} (deflated 68%)`, `  zip file: ${args[0]} created`] };
};

export const cmdUnzip = (args: string[]): CmdResult => {
  if (!args.length) return { output: ["UnZip 6.00: missing zipfile argument"] };
  return { output: [`Archive:  ${args[0]}`, `  inflating: file1.txt`, `  inflating: file2.txt`, `Done.`] };
};

export const cmdLn = (args: string[]): CmdResult => {
  if (args.length < 2) return { output: ["ln: missing operand"] };
  return { output: [] };
};

export const cmdStat = (args: string[], state: TerminalState): CmdResult => {
  if (!args.length) return { output: ["stat: missing operand"] };
  const path = resolvePath(state.cwd, args[0]);
  const node = getNode(state.fs, path);
  if (!node) return { output: [`stat: cannot stat '${args[0]}': No such file or directory`] };
  return { output: [
    `  File: ${args[0]}`,
    `  Size: ${node.size || 0}\t\tBlocks: ${Math.ceil((node.size || 0) / 512) * 8}\t IO Block: 4096   ${node.type === "dir" ? "directory" : "regular file"}`,
    `Device: 801h/2049d\tInode: ${Math.floor(Math.random()*900000+100000)}\tLinks: 1`,
    `Access: (${node.permissions || "0644"})\tUid: ( ${node.owner === "root" ? "0" : "1000"}/  ${node.owner || "kali"})\tGid: ( ${node.owner === "root" ? "0" : "1000"}/  ${node.owner || "kali"})`,
    `Access: 2026-03-23 16:00:00.000000000 +0000`,
    `Modify: 2026-03-23 16:00:00.000000000 +0000`,
    `Change: 2026-03-23 16:00:00.000000000 +0000`,
    ` Birth: -`,
  ]};
};

export const cmdReadlink = (args: string[]): CmdResult => {
  if (args.includes("-f") && args.length > 1) {
    const target = args.find(a => !a.startsWith("-")) || "";
    return { output: [target.startsWith("/") ? target : `/home/kali/${target}`] };
  }
  return { output: [""] };
};

export const cmdRealpath = (args: string[], state: TerminalState): CmdResult => {
  if (!args.length) return { output: ["realpath: missing operand"] };
  return { output: [resolvePath(state.cwd, args[0])] };
};

export const cmdBasename = (args: string[]): CmdResult => {
  if (!args.length) return { output: ["basename: missing operand"] };
  return { output: [args[0].split("/").pop() || ""] };
};

export const cmdDirname = (args: string[]): CmdResult => {
  if (!args.length) return { output: ["dirname: missing operand"] };
  const parts = args[0].split("/");
  parts.pop();
  return { output: [parts.join("/") || "."] };
};

export const cmdCp = (args: string[], state: TerminalState): CmdResult => {
  const filtered = args.filter(a => !a.startsWith("-"));
  if (filtered.length < 2) return { output: ["cp: missing operand"] };
  const srcPath = resolvePath(state.cwd, filtered[0]);
  const destPath = resolvePath(state.cwd, filtered[1]);
  const srcNode = getNode(state.fs, srcPath);
  if (!srcNode) return { output: [`cp: cannot stat '${filtered[0]}': No such file or directory`] };
  const { parent, name } = getParentAndName(state.fs, destPath);
  if (parent?.type === "dir" && parent.children && srcNode.type === "file") {
    parent.children[name] = { ...srcNode };
  }
  return { output: [] };
};

export const cmdMv = (args: string[], state: TerminalState): CmdResult => {
  const filtered = args.filter(a => !a.startsWith("-"));
  if (filtered.length < 2) return { output: ["mv: missing operand"] };
  const srcPath = resolvePath(state.cwd, filtered[0]);
  const destPath = resolvePath(state.cwd, filtered[1]);
  const srcNode = getNode(state.fs, srcPath);
  if (!srcNode) return { output: [`mv: cannot stat '${filtered[0]}': No such file or directory`] };
  // Copy to destination
  const { parent: destParent, name: destName } = getParentAndName(state.fs, destPath);
  if (destParent?.type === "dir" && destParent.children) {
    destParent.children[destName] = { ...srcNode };
  }
  // Remove from source
  const { parent: srcParent, name: srcName } = getParentAndName(state.fs, srcPath);
  if (srcParent?.type === "dir" && srcParent.children) {
    delete srcParent.children[srcName];
  }
  return { output: [] };
};

export const cmdWget = (args: string[]): CmdResult => {
  const url = args.find(a => !a.startsWith("-")) || "";
  if (!url) return { output: ["wget: missing URL"] };
  const filename = url.split("/").pop() || "index.html";
  const size = (Math.random() * 10 + 1).toFixed(1);
  return { output: [
    `--${new Date().toISOString()}--  ${url}`,
    `Resolving ${new URL("http://" + url.replace(/^https?:\/\//, "")).hostname || url}... ${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`,
    `Connecting to ${url}... connected.`,
    `HTTP request sent, awaiting response... 200 OK`,
    `Length: ${Math.floor(parseFloat(size) * 1024)} (${size}K) [text/html]`,
    `Saving to: '${filename}'`,
    "",
    `${filename}              100%[=====================>]   ${size}K  --.-KB/s    in ${(Math.random() * 2).toFixed(1)}s`,
    "",
    `${new Date().toISOString()} (${(parseFloat(size) / (Math.random() * 2 + 0.5)).toFixed(1)} KB/s) - '${filename}' saved [${Math.floor(parseFloat(size) * 1024)}/${Math.floor(parseFloat(size) * 1024)}]`,
  ]};
};

export const cmdCurl = (args: string[]): CmdResult => {
  const verbose = args.includes("-v") || args.includes("--verbose");
  const silent = args.includes("-s") || args.includes("--silent");
  const head = args.includes("-I") || args.includes("--head");
  const url = args.find(a => !a.startsWith("-")) || "";

  if (!url) return { output: ["curl: try 'curl --help' for more information"] };

  if (head) {
    return { output: [
      "HTTP/2 200",
      `server: nginx/1.24.0`,
      `date: ${new Date().toUTCString()}`,
      `content-type: text/html; charset=UTF-8`,
      `content-length: 1256`,
      `x-powered-by: Express`,
      `strict-transport-security: max-age=31536000; includeSubDomains`,
      `x-content-type-options: nosniff`,
      `x-frame-options: DENY`,
      `x-xss-protection: 1; mode=block`,
    ]};
  }

  if (url === "ifconfig.me" || url === "icanhazip.com") {
    return { output: ["203.0.113.42"] };
  }

  if (verbose) {
    return { output: [
      `*   Trying ${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.1:443...`,
      `* Connected to ${url} port 443`,
      `* TLS 1.3 connection using TLS_AES_256_GCM_SHA384`,
      `> GET / HTTP/2`,
      `> Host: ${url}`,
      `> User-Agent: curl/8.5.0`,
      `> Accept: */*`,
      `>`,
      `< HTTP/2 200`,
      `< content-type: text/html`,
      `< content-length: 1256`,
      `<`,
      `<!DOCTYPE html><html><head><title>${url}</title></head><body>OK</body></html>`,
    ]};
  }

  return { output: [
    `  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current`,
    `                                 Dload  Upload   Total   Spent    Left  Speed`,
    `100  1256  100  1256    0     0   6280      0 --:--:-- --:--:-- --:--:--  6280`,
    `<!DOCTYPE html><html><head><title>${url}</title></head><body>OK</body></html>`,
  ]};
};

// Hacking tools that can be "installed"
export const cmdWfuzz = (args: string[]): CmdResult => {
  const url = args.find(a => !a.startsWith("-")) || "http://target";
  return { output: [
    "********************************************************",
    "* Wfuzz 3.1.0 - The Web Fuzzer                         *",
    "********************************************************",
    "",
    `Target: ${url}`,
    `Total requests: 4614`,
    "",
    "=====================================================================",
    "ID           Response   Lines    Word       Chars       Payload",
    "=====================================================================",
    "",
    `000000001:   200        42 L     128 W      1234 Ch     "admin"`,
    `000000045:   200        38 L     115 W      1087 Ch     "login"`,
    `000000123:   301        7 L      12 W       178 Ch      "uploads"`,
    `000000234:   403        9 L      28 W       277 Ch      ".htaccess"`,
    `000000567:   200        15 L     45 W       567 Ch      "api"`,
    "",
    `Total time: ${(Math.random()*30+10).toFixed(2)}`,
    `Processed Requests: 4614`,
    `Filtered Requests: 4609`,
    `Requests/sec.: ${Math.floor(Math.random()*200+50)}`,
  ]};
};

export const cmdCrackmapexec = (args: string[]): CmdResult => {
  const protocol = args[0] || "smb";
  const target = args[1] || "192.168.1.0/24";
  return { output: [
    `CrackMapExec v5.4.0`,
    "",
    `${protocol.toUpperCase()}         ${target}   445    TARGET-DC       [*] Windows Server 2022 Build 20348 x64`,
    `${protocol.toUpperCase()}         ${target}   445    TARGET-DC       [+] domain\\admin:password123 (Pwn3d!)`,
    `${protocol.toUpperCase()}         ${target}   445    TARGET-DC       [*] Dumping SAM hashes`,
    `${protocol.toUpperCase()}         ${target}   445    TARGET-DC       Administrator:500:aad3b435b51404eeaad3b435b51404ee:...`,
  ]};
};

export const cmdResponder = (args: string[]): CmdResult => {
  const iface = args.find(a => !a.startsWith("-")) || "eth0";
  return { output: [
    "                                         __",
    "  .----.-----.-----.-----.-----.-----.--|  .-----.----.",
    "  |   _|  -__|__ --|  _  |  _  |     |  _  |  -__|   _|",
    "  |____|_____|_____|   __|_____|__|__|_____|_____|__|",
    "                   |__|",
    "",
    `  Responder v3.1.3.0`,
    "",
    `[+] Listening for events on ${iface}...`,
    `[*] [LLMNR]  Poisoned answer sent to 192.168.1.25 for name fileserver`,
    `[*] [NBT-NS] Poisoned answer sent to 192.168.1.30 for name FILESVR`,
    `[+] NTLMv2 hash captured from 192.168.1.25:`,
    `    admin::DOMAIN:1122334455667788:AABBCCDD...`,
  ]};
};

export const cmdNiktoFull = (args: string[]): CmdResult => {
  const host = args.find(a => !a.startsWith("-")) || args[args.indexOf("-h") + 1] || "192.168.1.10";
  return { output: [
    "- Nikto v2.5.0",
    "---------------------------------------------------------------------------",
    `+ Target IP:          ${host}`,
    `+ Target Hostname:    ${host}`,
    `+ Target Port:        80`,
    `+ Start Time:         ${new Date().toISOString()}`,
    "---------------------------------------------------------------------------",
    `+ Server: Apache/2.4.52 (Ubuntu)`,
    "+ /: The anti-clickjacking X-Frame-Options header is not present.",
    "+ /: The X-Content-Type-Options header is not set.",
    "+ /icons/README: Apache default file found.",
    "+ /admin/: Directory indexing found.",
    "+ /admin/config.php: PHP config file found.",
    "+ /phpmyadmin/: phpMyAdmin found (version 5.2.1).",
    "+ /server-status: Apache server-status accessible (server version info)",
    "+ /.git/: Git repository found! Version control data may be exposed.",
    "+ /api/debug: Debug endpoint accessible without authentication. ⚠️",
    "---------------------------------------------------------------------------",
    `+ ${8 + Math.floor(Math.random() * 5)} items checked: 9 items found`,
    `+ End Time: ${new Date().toISOString()} (${Math.floor(Math.random()*60+10)} seconds)`,
    "---------------------------------------------------------------------------",
  ]};
};

export const cmdSmbclient = (args: string[]): CmdResult => {
  const target = args.find(a => a.startsWith("//")) || "//192.168.1.10";
  if (args.includes("-L")) {
    return { output: [
      `\tSharename       Type      Comment`,
      `\t---------       ----      -------`,
      `\tIPC$            IPC       IPC Service`,
      `\tprint$          Disk      Printer Drivers`,
      `\tshare           Disk      Public Share`,
      `\tbackups         Disk      Backup Files`,
      `\tadmin$          Disk      Admin Share (requires auth)`,
    ]};
  }
  return { output: [`Try "smbclient -L ${target}" to list shares`] };
};

export const cmdChmod = (args: string[], state: TerminalState): CmdResult => {
  if (args.length < 2) return { output: ["chmod: missing operand"] };
  const mode = args[0];
  const file = args[1];
  const path = resolvePath(state.cwd, file);
  const node = getNode(state.fs, path);
  if (!node) return { output: [`chmod: cannot access '${file}': No such file or directory`] };
  // Update permissions display
  if (node.permissions) {
    if (mode === "+x") node.permissions = node.permissions.slice(0, 3) + "x" + node.permissions.slice(4);
    else if (mode === "755") node.permissions = "-rwxr-xr-x";
    else if (mode === "644") node.permissions = "-rw-r--r--";
    else if (mode === "600") node.permissions = "-rw-------";
    else if (mode === "777") node.permissions = "-rwxrwxrwx";
  }
  return { output: [] };
};

export const cmdChown = (args: string[], state: TerminalState): CmdResult => {
  if (args.length < 2) return { output: ["chown: missing operand"] };
  const owner = args[0];
  const file = args.find((a, i) => i > 0 && !a.startsWith("-")) || "";
  const path = resolvePath(state.cwd, file);
  const node = getNode(state.fs, path);
  if (!node) return { output: [`chown: cannot access '${file}': No such file or directory`] };
  node.owner = owner.split(":")[0];
  return { output: [] };
};

export const cmdTree = (args: string[], state: TerminalState): CmdResult => {
  const targetDir = args.find(a => !a.startsWith("-")) || ".";
  const maxDepth = args.includes("-L") ? parseInt(args[args.indexOf("-L") + 1]) || 2 : 2;
  const path = resolvePath(state.cwd, targetDir);
  const node = getNode(state.fs, path);
  if (!node || node.type !== "dir") return { output: [`${targetDir} [error opening dir]`] };

  const output: string[] = [path === state.cwd ? "." : targetDir];
  const entries = Object.entries(node.children || {});
  let dirCount = 0, fileCount = 0;

  const render = (children: Record<string, any>, prefix: string, depth: number) => {
    if (depth >= maxDepth) return;
    const items = Object.entries(children);
    items.forEach(([name, child], i) => {
      const isLast = i === items.length - 1;
      const connector = isLast ? "└── " : "├── ";
      const isDir = (child as any).type === "dir";
      if (isDir) dirCount++;
      else fileCount++;
      output.push(`${prefix}${connector}${isDir ? `\x1b[1;34m${name}\x1b[0m` : name}`);
      if (isDir && (child as any).children) {
        render((child as any).children, prefix + (isLast ? "    " : "│   "), depth + 1);
      }
    });
  };

  render(node.children || {}, "", 0);
  output.push("");
  output.push(`${dirCount} directories, ${fileCount} files`);
  return { output };
};

export const cmdWatch = (args: string[]): CmdResult => {
  const cmd = args.filter(a => !a.startsWith("-")).join(" ");
  return { output: [
    `Every 2.0s: ${cmd}    kali: ${new Date().toLocaleString()}`,
    "",
    `[Watch mode - showing single snapshot of: ${cmd}]`,
  ]};
};

export const cmdScreen = (args: string[]): CmdResult => {
  if (args.includes("-ls")) {
    return { output: [
      "There are screens on:",
      `\t${Math.floor(Math.random()*9000+1000)}.pts-0.kali\t(Detached)`,
      "1 Sockets in /run/screen/S-kali.",
    ]};
  }
  return { output: ["[screen session created]"] };
};

export const cmdTmux = (args: string[]): CmdResult => {
  if (args[0] === "ls" || args[0] === "list-sessions") {
    return { output: [`0: 1 windows (created ${new Date().toLocaleString()}) (attached)`] };
  }
  return { output: ["[tmux session ready]"] };
};

export const cmdCrontab = (args: string[]): CmdResult => {
  if (args.includes("-l")) {
    return { output: [
      "# m h  dom mon dow   command",
      "*/5 * * * * /usr/bin/python3 /home/kali/ids_monitor.py --check",
      "0 */6 * * * /usr/bin/python3 /home/kali/vuln_check.py --auto",
      "0 0 * * 0 /usr/bin/nmap -sV 192.168.1.0/24 -oN /var/log/weekly_scan.txt",
    ]};
  }
  return { output: ["crontab: usage error"] };
};

export const cmdProxychains = (args: string[]): CmdResult => {
  const cmd = args.join(" ");
  return { output: [
    "[proxychains] config file found: /etc/proxychains4.conf",
    "[proxychains] preloading /usr/lib/x86_64-linux-gnu/libproxychains.so.4",
    `[proxychains] DLL init: proxychains-ng 4.16`,
    `[proxychains] Strict chain  ...  127.0.0.1:9050  ...  OK`,
    `[proxychains] Executing: ${cmd || "shell"}`,
  ]};
};

export const cmdSocat = (args: string[]): CmdResult => {
  return { output: ["[socat] Connection established"] };
};

export const cmdExiftool = (args: string[]): CmdResult => {
  const file = args.find(a => !a.startsWith("-")) || "image.jpg";
  return { output: [
    `ExifTool Version Number         : 12.70`,
    `File Name                       : ${file}`,
    `File Size                       : ${Math.floor(Math.random()*5000+500)} kB`,
    `File Modification Date/Time     : 2026:03:23 16:00:00+00:00`,
    `File Type                       : JPEG`,
    `MIME Type                        : image/jpeg`,
    `Image Width                     : 1920`,
    `Image Height                    : 1080`,
    `GPS Latitude                    : 37.7749° N ⚠️`,
    `GPS Longitude                   : 122.4194° W ⚠️`,
    `Camera Model Name               : iPhone 15 Pro`,
    `[!] WARNING: GPS metadata found - location data exposed!`,
  ]};
};

export const cmdBinwalk = (args: string[]): CmdResult => {
  const file = args.find(a => !a.startsWith("-")) || "firmware.bin";
  return { output: [
    `DECIMAL       HEXADECIMAL     DESCRIPTION`,
    `--------------------------------------------------------------------------------`,
    `0             0x0             Linux kernel ARM boot executable zImage`,
    `16384         0x4000          gzip compressed data, from Unix`,
    `2097152       0x200000        Squashfs filesystem, little endian, version 4.0`,
    `4194304       0x400000        JFFS2 filesystem, little endian`,
  ]};
};

export const isCommandInstalled = (cmd: string): boolean => {
  // Common commands always available
  const builtins = ["ls", "cd", "pwd", "cat", "echo", "whoami", "id", "hostname", "uname", "date",
    "uptime", "clear", "history", "touch", "mkdir", "rm", "head", "tail", "grep", "find", "wc",
    "which", "type", "file", "man", "help", "env", "export", "unset", "sudo", "su", "ssh", "scp",
    "ps", "top", "htop", "kill", "df", "du", "free", "mount", "lsblk", "dmesg", "journalctl",
    "chmod", "chown", "cp", "mv", "ln", "stat", "readlink", "realpath", "basename", "dirname",
    "sort", "sed", "awk", "cut", "tr", "xargs", "tee", "diff", "tar", "gzip", "zip", "unzip",
    "true", "false", "exit", "logout", "reboot", "shutdown", "cal", "w", "last", "alias",
    "printenv", "set", "tty", "stty", "arch", "nproc", "lscpu", "xxd", "base64", "md5sum",
    "sha256sum", "openssl", "tree", "watch", "screen", "tmux", "crontab",
    "ping", "ifconfig", "ip", "netstat", "ss", "curl", "wget", "nmap", "python3", "python",
    "pip3", "pip", "git", "apt", "apt-get", "dpkg", "systemctl", "service", "iptables", "ufw",
    "useradd", "userdel", "passwd", "groups", "neofetch", "screenfetch", "lsb_release",
    "msfconsole", "metasploit", "hydra", "sqlmap", "john", "hashcat", "aircrack-ng", "aircrack",
    "nikto", "dirb", "gobuster", "wireshark", "tcpdump", "burpsuite", "nc", "ncat",
    "wfuzz", "crackmapexec", "responder", "smbclient", "proxychains", "socat", "exiftool", "binwalk",
  ];
  return builtins.includes(cmd) || installedPackages.has(cmd);
};

export const getUnknownCommandSuggestion = (cmd: string): CmdResult => {
  // Suggest similar commands or apt install
  const suggestions: Record<string, string> = {
    "ls": "ls", "sl": "sl", "pyhton": "python3", "pytho": "python3", "pyhton3": "python3",
    "nmpa": "nmap", "namap": "nmap", "grpe": "grep", "gre": "grep",
    "ifocnfig": "ifconfig", "iconfig": "ifconfig",
    "systmctl": "systemctl", "systemcl": "systemctl",
    "fierfox": "firefox", "firefox": "firefox",
  };

  const suggestion = suggestions[cmd];
  if (suggestion) {
    return { output: [
      `Command '${cmd}' not found, did you mean:`,
      `  command '${suggestion}' from package '${suggestion}'`,
      `Try: sudo apt install ${suggestion}`,
    ]};
  }

  return { output: [
    `Command '${cmd}' not found, but can be installed with:`,
    `  sudo apt install ${cmd}`,
    ``,
    `If you need to install from the internet, use:`,
    `  apt update && apt install ${cmd}`,
    `  pip3 install ${cmd}`,
    `  git clone https://github.com/tool/${cmd}.git`,
  ]};
};
