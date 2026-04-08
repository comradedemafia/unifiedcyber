// Realistic Kali Linux package management simulation
import { TerminalState } from "./kaliCommands";

type CmdResult = { output: string[]; newState?: Partial<TerminalState> };

// Package database with metadata
interface PackageInfo {
  version: string;
  size: number; // MB
  description: string;
  deps: string[];
  section: string;
  installed: boolean;
}

const packageDB: Record<string, PackageInfo> = {
  nmap: { version: "7.94+git20240130", size: 5.2, description: "Network exploration tool and security / port scanner", deps: ["libpcap0.8", "liblua5.4-0"], section: "net", installed: true },
  python3: { version: "3.12.3-1", size: 12.4, description: "Interactive high-level object-oriented language", deps: ["libpython3.12"], section: "python", installed: true },
  git: { version: "2.43.0-1", size: 8.7, description: "Fast, scalable, distributed revision control system", deps: ["libcurl4", "zlib1g"], section: "vcs", installed: true },
  curl: { version: "8.5.0-2", size: 1.2, description: "Command line tool for transferring data with URL syntax", deps: ["libcurl4"], section: "web", installed: true },
  wget: { version: "1.21.4-1", size: 3.1, description: "Network utility to retrieve files from the web", deps: ["libssl3"], section: "web", installed: true },
  vim: { version: "9.1.0016-1", size: 15.8, description: "Vi IMproved - enhanced vi editor", deps: ["vim-runtime"], section: "editors", installed: true },
  nano: { version: "7.2-2", size: 2.3, description: "Small, friendly text editor", deps: ["libncursesw6"], section: "editors", installed: true },
  "metasploit-framework": { version: "6.3.55+git20240201", size: 342.5, description: "Framework for exploit development and vulnerability research", deps: ["ruby", "postgresql"], section: "net", installed: true },
  hydra: { version: "9.5-1", size: 4.8, description: "Very fast network logon cracker", deps: ["libssl3", "libssh-4"], section: "net", installed: true },
  sqlmap: { version: "1.8-1", size: 7.2, description: "Automatic SQL injection tool", deps: ["python3"], section: "net", installed: true },
  wireshark: { version: "4.2.2-1", size: 28.6, description: "Network traffic analyzer", deps: ["libwireshark17", "libpcap0.8"], section: "net", installed: true },
  tcpdump: { version: "4.99.4-3", size: 1.4, description: "Command-line network traffic analyzer", deps: ["libpcap0.8"], section: "net", installed: true },
  "aircrack-ng": { version: "1.7-8", size: 6.3, description: "Wireless WEP/WPA cracking utilities", deps: ["libpcap0.8", "libssl3"], section: "net", installed: true },
  nikto: { version: "2.5.0-1", size: 3.8, description: "Web server scanner", deps: ["perl", "libnet-ssleay-perl"], section: "net", installed: true },
  gobuster: { version: "3.6.0-1", size: 8.2, description: "Directory/file & DNS busting tool", deps: [], section: "net", installed: true },
  john: { version: "1.9.0+jumbo1-1", size: 18.5, description: "Active password cracking tool", deps: ["libssl3", "libgmp10"], section: "net", installed: true },
  hashcat: { version: "6.2.6-2", size: 22.3, description: "Advanced CPU/GPU-based password recovery utility", deps: ["libopencl-clang-17"], section: "net", installed: true },
  burpsuite: { version: "2024.2.1-0kali1", size: 485.0, description: "Web application security testing platform", deps: ["openjdk-17-jre"], section: "net", installed: true },
  netcat: { version: "1.226-1", size: 0.4, description: "TCP/IP swiss army knife", deps: [], section: "net", installed: true },
  tor: { version: "0.4.8.10-1", size: 5.6, description: "Anonymizing overlay network", deps: ["libssl3", "libevent-2.1-7"], section: "net", installed: true },
  "proxychains4": { version: "4.16-2", size: 0.3, description: "Redirect connections through proxy servers", deps: [], section: "net", installed: true },
  binwalk: { version: "2.3.4-1", size: 2.1, description: "Tool for searching binary images for embedded files", deps: ["python3"], section: "utils", installed: true },
  socat: { version: "1.8.0.0-1", size: 1.5, description: "Multipurpose relay for bidirectional data transfer", deps: ["libssl3"], section: "net", installed: true },
  ffuf: { version: "2.1.0-1", size: 7.8, description: "Fast web fuzzer", deps: [], section: "net", installed: true },
  subfinder: { version: "2.6.3-1", size: 12.1, description: "Subdomain discovery tool", deps: [], section: "net", installed: true },
  amass: { version: "4.2.0-1", size: 45.2, description: "In-depth attack surface mapping", deps: [], section: "net", installed: true },
  "wpscan": { version: "3.8.25-1", size: 15.4, description: "WordPress security scanner", deps: ["ruby"], section: "net", installed: true },
  bloodhound: { version: "4.3.1-0kali1", size: 156.0, description: "Active Directory relationship explorer", deps: ["neo4j"], section: "net", installed: true },
  responder: { version: "3.1.4.0-1", size: 4.2, description: "LLMNR/NBT-NS/mDNS poisoner", deps: ["python3"], section: "net", installed: true },
  crackmapexec: { version: "5.4.0-1", size: 18.7, description: "Swiss army knife for pentesting networks", deps: ["python3"], section: "net", installed: true },
  // Installable packages (not installed by default)
  firefox: { version: "124.0-1", size: 78.5, description: "Mozilla Firefox web browser", deps: ["libgtk-3-0", "libdbus-1-3"], section: "web", installed: false },
  chromium: { version: "122.0.6261.128-1", size: 95.2, description: "Open-source web browser from Google", deps: ["libgtk-3-0"], section: "web", installed: false },
  "code-oss": { version: "1.86.2-1", size: 112.0, description: "Code editing. Redefined.", deps: ["libgtk-3-0", "libxkbfile1"], section: "editors", installed: false },
  docker: { version: "24.0.7-1", size: 48.3, description: "Container runtime", deps: ["containerd", "runc"], section: "admin", installed: false },
  "docker-compose": { version: "2.24.5-1", size: 12.6, description: "Docker multi-container orchestration", deps: ["docker"], section: "admin", installed: false },
  ansible: { version: "9.2.0-1", size: 35.8, description: "Configuration management and deployment", deps: ["python3", "python3-yaml"], section: "admin", installed: false },
  terraform: { version: "1.7.3-1", size: 42.1, description: "Infrastructure as Code tool", deps: [], section: "admin", installed: false },
  maltego: { version: "4.6.0-0kali1", size: 198.0, description: "Open source intelligence and forensics application", deps: ["openjdk-17-jre"], section: "net", installed: false },
  "social-engineer-toolkit": { version: "8.0.3-0kali3", size: 28.4, description: "Social engineering penetration testing framework", deps: ["python3", "metasploit-framework"], section: "net", installed: false },
  "beef-xss": { version: "0.5.4.0-1", size: 34.2, description: "Browser exploitation framework", deps: ["ruby", "bundler"], section: "net", installed: false },
  zaproxy: { version: "2.14.0-0kali1", size: 145.0, description: "OWASP ZAP - web app security scanner", deps: ["openjdk-17-jre"], section: "net", installed: false },
  kismet: { version: "2023.07.R1-1", size: 18.9, description: "Wireless network and device detector", deps: ["libpcap0.8", "libwebsockets19"], section: "net", installed: false },
  reaver: { version: "1.6.6-1", size: 1.2, description: "Brute force attack against WPS", deps: ["libpcap0.8"], section: "net", installed: false },
  "ghidra": { version: "11.0-0kali1", size: 512.0, description: "Software reverse engineering framework", deps: ["openjdk-17-jre"], section: "devel", installed: false },
  radare2: { version: "5.8.8-1", size: 22.4, description: "Reverse engineering framework", deps: ["libmagic1"], section: "devel", installed: false },
  gdb: { version: "14.1-2", size: 15.3, description: "GNU debugger", deps: ["libpython3.12"], section: "devel", installed: false },
  strace: { version: "6.7-1", size: 1.8, description: "System call tracer", deps: [], section: "utils", installed: false },
  ltrace: { version: "0.7.3-6.1", size: 0.8, description: "Library call tracer", deps: [], section: "utils", installed: false },
  "volatility3": { version: "2.5.2-1", size: 25.0, description: "Advanced memory forensics framework", deps: ["python3"], section: "forensics", installed: false },
  autopsy: { version: "4.21.0-1", size: 198.0, description: "Digital forensics platform", deps: ["openjdk-17-jre", "sleuthkit"], section: "forensics", installed: false },
  cewl: { version: "6.1-1", size: 2.4, description: "Custom word list generator", deps: ["ruby"], section: "net", installed: false },
  crunch: { version: "3.6-3", size: 0.5, description: "Wordlist generator", deps: [], section: "net", installed: false },
  seclists: { version: "2024.1-0kali1", size: 890.0, description: "Collection of security assessment wordlists", deps: [], section: "net", installed: false },
  wordlists: { version: "2024.1-0kali1", size: 134.0, description: "Default wordlists package", deps: [], section: "net", installed: false },
  exploitdb: { version: "20240201-0kali1", size: 420.0, description: "Exploit Database Archive", deps: [], section: "net", installed: false },
  "powershell": { version: "7.4.1-1", size: 68.0, description: "Cross-platform task automation", deps: ["libicu72"], section: "shells", installed: false },
  tmux: { version: "3.4-1", size: 1.2, description: "Terminal multiplexer", deps: ["libevent-2.1-7"], section: "utils", installed: true },
  htop: { version: "3.3.0-2", size: 0.8, description: "Interactive process viewer", deps: ["libncursesw6"], section: "utils", installed: true },
  tree: { version: "2.1.1-1", size: 0.2, description: "Display directory tree structure", deps: [], section: "utils", installed: true },
  neofetch: { version: "7.1.0-4", size: 0.3, description: "CLI system information tool", deps: ["bash"], section: "utils", installed: true },
};

// Track installed state
const installedPkgs = new Set<string>(
  Object.entries(packageDB).filter(([, v]) => v.installed).map(([k]) => k)
);

// Config files created by packages
const packageConfigs: Record<string, string[]> = {
  "nginx": ["/etc/nginx/nginx.conf", "/etc/nginx/sites-enabled/default"],
  "apache2": ["/etc/apache2/apache2.conf", "/etc/apache2/sites-enabled/000-default.conf"],
  "openssh-server": ["/etc/ssh/sshd_config"],
  "tor": ["/etc/tor/torrc"],
  "proxychains4": ["/etc/proxychains4.conf"],
};

// pip packages
const pipPackages = new Set<string>([
  "pip", "setuptools", "wheel", "requests", "scapy", "pwntools", "impacket",
  "pycryptodome", "paramiko", "beautifulsoup4", "flask", "django", "numpy",
  "pandas", "matplotlib", "pillow", "colorama", "rich", "click",
]);

export const isPackageInstalled = (pkg: string): boolean => installedPkgs.has(pkg);

export const handleAptFull = (args: string[], state: TerminalState): CmdResult => {
  const subCmd = args[0];
  const flags = args.filter(a => a.startsWith("-"));
  const pkgArgs = args.slice(1).filter(a => !a.startsWith("-"));
  const assumeYes = flags.includes("-y") || flags.includes("--yes");

  switch (subCmd) {
    case "update": return aptUpdate();
    case "upgrade": return aptUpgrade(flags);
    case "full-upgrade":
    case "dist-upgrade": return aptDistUpgrade();
    case "install": return aptInstall(pkgArgs, assumeYes);
    case "remove": return aptRemove(pkgArgs, false);
    case "purge": return aptPurge(pkgArgs);
    case "autoremove": return aptAutoremove();
    case "autoclean":
    case "clean": return aptClean();
    case "search": return aptSearch(pkgArgs);
    case "show": return aptShow(pkgArgs);
    case "list": return aptList(flags);
    case "policy": return aptPolicy(pkgArgs);
    case "depends": return aptDepends(pkgArgs);
    case "rdepends": return aptRdepends(pkgArgs);
    case "download": return aptDownload(pkgArgs);
    case "source": return aptSource(pkgArgs);
    case "changelog": return aptChangelog(pkgArgs);
    case "edit-sources": return { output: ["deb http://http.kali.org/kali kali-rolling main contrib non-free non-free-firmware", "deb-src http://http.kali.org/kali kali-rolling main contrib non-free non-free-firmware"] };
    default: return { output: [
      "apt 2.7.14 (amd64)",
      "Usage: apt [options] command",
      "",
      "Most used commands:",
      "  list - list packages based on package names",
      "  search - search in package descriptions",
      "  show - show package details",
      "  install - install packages",
      "  reinstall - reinstall packages",
      "  remove - remove packages",
      "  purge - remove packages and config files",
      "  autoremove - remove automatically installed packages no longer needed",
      "  update - update list of available packages",
      "  upgrade - upgrade the system by installing/upgrading packages",
      "  full-upgrade - upgrade the system by removing/installing/upgrading packages",
      "  edit-sources - edit the source information file",
      "  satisfy - satisfy dependency strings",
    ]};
  }
};

function aptUpdate(): CmdResult {
  const mirrors = [
    "http://kali.download/kali",
    "http://archive-4.kali.org/kali",
    "http://ftp.belnet.be/kali",
  ];
  const lines: string[] = [];
  mirrors.forEach((m, i) => {
    lines.push(`Hit:${i * 2 + 1} ${m} kali-rolling InRelease`);
    lines.push(`Hit:${i * 2 + 2} ${m} kali-rolling/main amd64 Packages`);
  });
  lines.push("Reading package lists... Done");
  lines.push(`Building dependency tree... Done`);
  lines.push(`Reading state information... Done`);
  lines.push(`${installedPkgs.size} packages can be upgraded. Run 'apt list --upgradable' to see them.`);
  return { output: lines };
}

function aptUpgrade(flags: string[]): CmdResult {
  const count = Math.floor(Math.random() * 15) + 3;
  const size = (Math.random() * 200 + 50).toFixed(1);
  return { output: [
    "Reading package lists... Done",
    "Building dependency tree... Done",
    "Calculating upgrade... Done",
    `The following packages will be upgraded:`,
    `  linux-image-amd64 nmap python3 metasploit-framework wireshark`,
    `  libssl3 openssl curl wget git`,
    `${count} upgraded, 0 newly installed, 0 to remove and 0 not upgraded.`,
    `Need to get ${size} MB of archives.`,
    `After this operation, ${(parseFloat(size) * 0.3).toFixed(1)} MB of additional disk space will be used.`,
    ...(flags.includes("-y") ? [] : ["Do you want to continue? [Y/n] Y"]),
    `Get:1 http://kali.download/kali kali-rolling/main amd64 linux-image-amd64 amd64 6.6.15-2kali1 [7,218 B]`,
    `Get:2 http://kali.download/kali kali-rolling/main amd64 nmap amd64 7.95+git20240215 [5,248 kB]`,
    `Fetched ${size} MB in ${(Math.random() * 8 + 2).toFixed(0)}s (${(parseFloat(size) / 5).toFixed(1)} MB/s)`,
    "(Reading database ... 345678 files and directories currently installed.)",
    "Preparing to unpack .../linux-image-amd64.deb ...",
    "Setting up linux-image-amd64 (6.6.15-2kali1) ...",
    "Processing triggers for kali-menu (2026.1.0) ...",
    "Processing triggers for man-db (2.12.0-3) ...",
  ]};
}

function aptDistUpgrade(): CmdResult {
  return { output: [
    "Reading package lists... Done",
    "Building dependency tree... Done",
    "Calculating upgrade... Done",
    "The following packages were automatically installed and are no longer required:",
    "  libfoo1 libbar2 old-dep",
    "Use 'sudo apt autoremove' to remove them.",
    "The following NEW packages will be installed:",
    "  linux-image-6.8.0-kali1-amd64 kali-linux-headless",
    "The following packages will be upgraded:",
    "  kali-linux-default kali-desktop-xfce metasploit-framework",
    "3 upgraded, 2 newly installed, 0 to remove and 0 not upgraded.",
    "Need to get 456 MB of archives.",
    "After this operation, 125 MB of additional disk space will be used.",
    "Do you want to continue? [Y/n] Y",
    "...downloading and installing...",
    "Processing triggers for linux-image-6.8.0-kali1-amd64 ...",
    "update-initramfs: Generating /boot/initrd.img-6.8.0-kali1-amd64",
    "Done.",
  ]};
}

function aptInstall(pkgs: string[], assumeYes: boolean): CmdResult {
  if (pkgs.length === 0) return { output: ["E: No packages specified."] };
  
  const lines: string[] = [
    "Reading package lists... Done",
    "Building dependency tree... Done",
    "Reading state information... Done",
  ];

  const toInstall: string[] = [];
  const alreadyInstalled: string[] = [];
  const deps: string[] = [];

  for (const pkg of pkgs) {
    if (installedPkgs.has(pkg)) {
      alreadyInstalled.push(pkg);
    } else {
      toInstall.push(pkg);
      const info = packageDB[pkg];
      if (info) {
        deps.push(...info.deps.filter(d => !installedPkgs.has(d)));
      }
    }
  }

  if (alreadyInstalled.length > 0 && toInstall.length === 0) {
    for (const pkg of alreadyInstalled) {
      const info = packageDB[pkg];
      lines.push(`${pkg} is already the newest version (${info?.version || "1.0.0"}).`);
    }
    lines.push("0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.");
    return { output: lines };
  }

  const uniqueDeps = Array.from(new Set(deps));
  if (uniqueDeps.length > 0) {
    lines.push("The following additional packages will be installed:");
    lines.push(`  ${uniqueDeps.join(" ")}`);
  }

  lines.push("The following NEW packages will be installed:");
  lines.push(`  ${[...toInstall, ...uniqueDeps].join(" ")}`);

  let totalSize = 0;
  for (const pkg of toInstall) {
    const info = packageDB[pkg];
    totalSize += info?.size || (Math.random() * 20 + 2);
  }

  const totalPkgs = toInstall.length + uniqueDeps.length;
  lines.push(`0 upgraded, ${totalPkgs} newly installed, 0 to remove and 0 not upgraded.`);
  lines.push(`Need to get ${totalSize.toFixed(1)} MB of archives.`);
  lines.push(`After this operation, ${(totalSize * 3.2).toFixed(1)} MB of additional disk space will be used.`);

  if (!assumeYes) lines.push("Do you want to continue? [Y/n] Y");

  // Download simulation
  for (let i = 0; i < toInstall.length; i++) {
    const pkg = toInstall[i];
    const info = packageDB[pkg];
    const size = info?.size || (Math.random() * 10 + 1);
    const ver = info?.version || `${Math.floor(Math.random() * 5)}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 20)}-1`;
    lines.push(`Get:${i + 1} http://kali.download/kali kali-rolling/main amd64 ${pkg} amd64 ${ver} [${(size * 1024).toFixed(0)} kB]`);
  }

  const speed = (totalSize / (Math.random() * 5 + 2)).toFixed(1);
  lines.push(`Fetched ${totalSize.toFixed(1)} MB in ${(Math.random() * 8 + 2).toFixed(0)}s (${speed} MB/s)`);

  // Install simulation
  for (const pkg of toInstall) {
    lines.push(`Selecting previously unselected package ${pkg}.`);
    lines.push(`(Reading database ... 345678 files and directories currently installed.)`);
    lines.push(`Preparing to unpack .../archives/${pkg}.deb ...`);
    lines.push(`Unpacking ${pkg} (${packageDB[pkg]?.version || "1.0"}) ...`);
  }

  for (const pkg of toInstall) {
    lines.push(`Setting up ${pkg} (${packageDB[pkg]?.version || "1.0"}) ...`);
    installedPkgs.add(pkg);
  }

  lines.push("Processing triggers for kali-menu (2026.1.0) ...");
  lines.push("Processing triggers for man-db (2.12.0-3) ...");
  lines.push("Processing triggers for desktop-file-utils (0.27-2) ...");

  return { output: lines };
}

function aptRemove(pkgs: string[], purge: boolean): CmdResult {
  if (pkgs.length === 0) return { output: ["E: No packages specified."] };

  const lines: string[] = [
    "Reading package lists... Done",
    "Building dependency tree... Done",
    "Reading state information... Done",
  ];

  const toRemove: string[] = [];
  for (const pkg of pkgs) {
    if (installedPkgs.has(pkg)) {
      toRemove.push(pkg);
    } else {
      lines.push(`Package '${pkg}' is not installed, so not removed.`);
    }
  }

  if (toRemove.length === 0) {
    lines.push("0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.");
    return { output: lines };
  }

  // Check for dependent packages
  const autoremove: string[] = [];
  for (const [name, info] of Object.entries(packageDB)) {
    if (info.deps.some(d => toRemove.includes(d)) && installedPkgs.has(name) && !toRemove.includes(name)) {
      autoremove.push(name);
    }
  }

  if (autoremove.length > 0) {
    lines.push("The following packages were automatically installed and are no longer required:");
    lines.push(`  ${autoremove.slice(0, 5).join(" ")}`);
    lines.push("Use 'sudo apt autoremove' to remove them.");
  }

  lines.push(`The following packages will be REMOVED:`);
  lines.push(`  ${toRemove.map(p => purge ? `${p}*` : p).join(" ")}`);

  let freedSize = 0;
  for (const pkg of toRemove) {
    freedSize += (packageDB[pkg]?.size || 5) * 3.2;
  }

  lines.push(`0 upgraded, 0 newly installed, ${toRemove.length} to remove and 0 not upgraded.`);
  lines.push(`After this operation, ${freedSize.toFixed(1)} MB disk space will be freed.`);
  lines.push("Do you want to continue? [Y/n] Y");

  for (const pkg of toRemove) {
    lines.push(`(Reading database ... 345678 files and directories currently installed.)`);
    lines.push(`Removing ${pkg} (${packageDB[pkg]?.version || "1.0"}) ...`);
    if (purge) {
      lines.push(`Purging configuration files for ${pkg} (${packageDB[pkg]?.version || "1.0"}) ...`);
      const configs = packageConfigs[pkg];
      if (configs) {
        for (const c of configs) lines.push(`  Removing ${c} ...`);
      }
    }
    installedPkgs.delete(pkg);
  }

  lines.push("Processing triggers for kali-menu (2026.1.0) ...");
  lines.push("Processing triggers for man-db (2.12.0-3) ...");

  return { output: lines };
}

function aptPurge(pkgs: string[]): CmdResult {
  return aptRemove(pkgs, true);
}

function aptAutoremove(): CmdResult {
  const orphans = ["libfoo-dev", "libbar-old", "python3-deprecated"];
  const size = (Math.random() * 50 + 10).toFixed(1);
  return { output: [
    "Reading package lists... Done",
    "Building dependency tree... Done",
    "Reading state information... Done",
    "The following packages will be REMOVED:",
    `  ${orphans.join(" ")}`,
    `0 upgraded, 0 newly installed, ${orphans.length} to remove and 0 not upgraded.`,
    `After this operation, ${size} MB disk space will be freed.`,
    "Do you want to continue? [Y/n] Y",
    ...orphans.map(p => `Removing ${p} ...`),
    "Done.",
  ]};
}

function aptClean(): CmdResult {
  return { output: [
    "Reading package lists... Done",
    "Building dependency tree... Done",
    `Del http://kali.download/kali kali-rolling/main amd64 Packages [${(Math.random() * 20 + 5).toFixed(0)} MB]`,
    "Cleaned /var/cache/apt/archives/ — freed 234 MB",
  ]};
}

function aptSearch(terms: string[]): CmdResult {
  const query = terms.join(" ").toLowerCase();
  if (!query) return { output: ["E: No search term specified."] };

  const lines = ["Sorting... Done", "Full Text Search... Done"];
  const matches = Object.entries(packageDB).filter(([name, info]) =>
    name.includes(query) || info.description.toLowerCase().includes(query)
  );

  for (const [name, info] of matches.slice(0, 15)) {
    const installed = installedPkgs.has(name) ? " [installed]" : "";
    lines.push(`\x1b[1;32m${name}\x1b[0m/${info.version} amd64${installed}`);
    lines.push(`  ${info.description}`);
    lines.push("");
  }

  if (matches.length === 0) {
    lines.push(`No packages found matching '${query}'.`);
  }

  return { output: lines };
}

function aptShow(pkgs: string[]): CmdResult {
  const pkg = pkgs[0];
  if (!pkg) return { output: ["E: No package name specified."] };

  const info = packageDB[pkg];
  if (!info) {
    return { output: [`N: Unable to locate package ${pkg}`] };
  }

  return { output: [
    `Package: ${pkg}`,
    `Version: ${info.version}`,
    `Priority: optional`,
    `Section: ${info.section}`,
    `Maintainer: Kali Developers <devel@kali.org>`,
    `Installed-Size: ${(info.size * 3.2).toFixed(0)} MB`,
    `Depends: ${info.deps.length > 0 ? info.deps.join(", ") : "libc6 (>= 2.38)"}`,
    `Download-Size: ${info.size.toFixed(1)} MB`,
    `APT-Sources: http://http.kali.org/kali kali-rolling/main amd64 Packages`,
    `Description: ${info.description}`,
    `Homepage: https://www.kali.org/tools/${pkg}/`,
    installedPkgs.has(pkg) ? `APT-Manual-Installed: yes` : `N: Package is not installed.`,
  ]};
}

function aptList(flags: string[]): CmdResult {
  if (flags.includes("--installed")) {
    const pkgs = Array.from(installedPkgs).sort();
    return { output: [
      "Listing...",
      ...pkgs.slice(0, 30).map(p => {
        const info = packageDB[p];
        return `${p}/${info?.version || "1.0"} amd64 [installed]`;
      }),
      `... and ${Math.max(0, pkgs.length - 30)} more`,
    ]};
  }
  if (flags.includes("--upgradable")) {
    const upgradable = ["nmap", "python3", "metasploit-framework", "wireshark", "curl"];
    return { output: [
      "Listing...",
      ...upgradable.map(p => `${p}/${packageDB[p]?.version || "1.0"} amd64 [upgradable from: older]`),
    ]};
  }
  return { output: [`Listing... ${Object.keys(packageDB).length} packages available`] };
}

function aptPolicy(pkgs: string[]): CmdResult {
  const pkg = pkgs[0];
  if (!pkg) {
    return { output: [
      "Package files:",
      " 100 /var/lib/dpkg/status",
      "     release a=now",
      " 500 http://http.kali.org/kali kali-rolling/non-free amd64 Packages",
      "     release o=Kali,a=kali-rolling,n=kali-rolling,l=Kali,c=non-free",
      " 500 http://http.kali.org/kali kali-rolling/main amd64 Packages",
      "     release o=Kali,a=kali-rolling,n=kali-rolling,l=Kali,c=main",
    ]};
  }
  const info = packageDB[pkg];
  if (!info) return { output: [`N: Unable to locate package ${pkg}`] };
  return { output: [
    `${pkg}:`,
    `  Installed: ${installedPkgs.has(pkg) ? info.version : "(none)"}`,
    `  Candidate: ${info.version}`,
    `  Version table:`,
    `     ${info.version} 500`,
    `        500 http://http.kali.org/kali kali-rolling/main amd64 Packages`,
  ]};
}

function aptDepends(pkgs: string[]): CmdResult {
  const pkg = pkgs[0];
  if (!pkg) return { output: ["E: No package specified."] };
  const info = packageDB[pkg];
  if (!info) return { output: [`E: No packages found for ${pkg}`] };
  return { output: [
    `${pkg}`,
    ...info.deps.map(d => `  Depends: ${d}`),
    `  Depends: libc6 (>= 2.38)`,
  ]};
}

function aptRdepends(pkgs: string[]): CmdResult {
  const pkg = pkgs[0];
  if (!pkg) return { output: ["E: No package specified."] };
  const rdeps = Object.entries(packageDB).filter(([, info]) => info.deps.includes(pkg)).map(([n]) => n);
  return { output: [
    `${pkg}`,
    `Reverse Depends:`,
    ...rdeps.slice(0, 10).map(d => `  ${d}`),
  ]};
}

function aptDownload(pkgs: string[]): CmdResult {
  const pkg = pkgs[0];
  if (!pkg) return { output: ["E: No package specified."] };
  const info = packageDB[pkg];
  const size = info?.size || (Math.random() * 10 + 2);
  return { output: [
    `Get:1 http://kali.download/kali kali-rolling/main amd64 ${pkg} amd64 ${info?.version || "1.0"} [${(size * 1024).toFixed(0)} kB]`,
    `Fetched ${size.toFixed(1)} MB in ${(Math.random() * 3 + 1).toFixed(0)}s (${(size / 2).toFixed(1)} MB/s)`,
    `Downloaded ${pkg}_${info?.version || "1.0"}_amd64.deb to current directory.`,
  ]};
}

function aptSource(pkgs: string[]): CmdResult {
  const pkg = pkgs[0];
  if (!pkg) return { output: ["E: No package specified."] };
  return { output: [
    `Reading package lists... Done`,
    `Picking '${pkg}' as source package`,
    `NOTICE: '${pkg}' packaging is maintained in Git:`,
    `  https://gitlab.com/kalilinux/packages/${pkg}`,
    `Need to get ${(Math.random() * 5 + 1).toFixed(1)} MB of source archives.`,
    `Get:1 http://http.kali.org/kali kali-rolling/main ${pkg} (dsc)`,
    `Get:2 http://http.kali.org/kali kali-rolling/main ${pkg} (tar.xz)`,
    `dpkg-source: extracting ${pkg} in ${pkg}-*`,
  ]};
}

function aptChangelog(pkgs: string[]): CmdResult {
  const pkg = pkgs[0];
  if (!pkg) return { output: ["E: No package specified."] };
  const info = packageDB[pkg];
  return { output: [
    `${pkg} (${info?.version || "1.0"}) kali-rolling; urgency=medium`,
    ``,
    `  * Update to latest upstream release`,
    `  * Fix security vulnerability CVE-2024-${Math.floor(Math.random() * 9999)}`,
    `  * Rebuild against new dependencies`,
    ``,
    ` -- Kali Developers <devel@kali.org>  ${new Date().toUTCString()}`,
  ]};
}

// dpkg command simulation
export const handleDpkg = (args: string[], state: TerminalState): CmdResult => {
  const flags = args.filter(a => a.startsWith("-"));
  const pkgArgs = args.filter(a => !a.startsWith("-"));

  if (flags.includes("-l") || flags.includes("--list")) {
    const query = pkgArgs[0] || "";
    const pkgs = Array.from(installedPkgs).filter(p => !query || p.includes(query)).sort();
    const lines = [
      "Desired=Unknown/Install/Remove/Purge/Hold",
      "| Status=Not/Inst/Conf-files/Unpacked/halF-conf/Half-inst/trig-aWait/Trig-pend",
      "|/ Err?=(none)/Reinst-required (Status,Err: uppercase=bad)",
      "||/ Name                          Version                     Architecture Description",
      "+++-=============================-===========================-============-================================================================",
    ];
    for (const p of pkgs.slice(0, 25)) {
      const info = packageDB[p];
      lines.push(`ii  ${p.padEnd(30)} ${(info?.version || "1.0").padEnd(28)} amd64        ${info?.description || p}`);
    }
    return { output: lines };
  }

  if (flags.includes("-i") || flags.includes("--install")) {
    const deb = pkgArgs[0];
    if (!deb) return { output: ["dpkg: error: --install needs at least one package archive file argument"] };
    const pkgName = deb.replace(/\.deb$/, "").replace(/_.*/, "");
    installedPkgs.add(pkgName);
    return { output: [
      `Selecting previously unselected package ${pkgName}.`,
      `(Reading database ... 345678 files and directories currently installed.)`,
      `Preparing to unpack ${deb} ...`,
      `Unpacking ${pkgName} ...`,
      `Setting up ${pkgName} ...`,
    ]};
  }

  if (flags.includes("-r") || flags.includes("--remove")) {
    const pkg = pkgArgs[0];
    if (!pkg) return { output: ["dpkg: error: --remove needs at least one package name argument"] };
    if (!installedPkgs.has(pkg)) {
      return { output: [`dpkg: error: package '${pkg}' is not installed`] };
    }
    installedPkgs.delete(pkg);
    return { output: [
      `(Reading database ... 345678 files and directories currently installed.)`,
      `Removing ${pkg} (${packageDB[pkg]?.version || "1.0"}) ...`,
      `Processing triggers for man-db (2.12.0-3) ...`,
    ]};
  }

  if (flags.includes("-P") || flags.includes("--purge")) {
    const pkg = pkgArgs[0];
    if (!pkg) return { output: ["dpkg: error: --purge needs at least one package name argument"] };
    installedPkgs.delete(pkg);
    return { output: [
      `(Reading database ... 345678 files and directories currently installed.)`,
      `Removing ${pkg} (${packageDB[pkg]?.version || "1.0"}) ...`,
      `Purging configuration files for ${pkg} ...`,
    ]};
  }

  if (flags.includes("-s") || flags.includes("--status")) {
    const pkg = pkgArgs[0];
    if (!pkg) return { output: ["dpkg-query: error: --status needs a package name argument"] };
    const info = packageDB[pkg];
    if (!info || !installedPkgs.has(pkg)) {
      return { output: [`dpkg-query: package '${pkg}' is not installed and no information is available`] };
    }
    return { output: [
      `Package: ${pkg}`,
      `Status: install ok installed`,
      `Priority: optional`,
      `Section: ${info.section}`,
      `Installed-Size: ${(info.size * 1024 * 3.2).toFixed(0)}`,
      `Maintainer: Kali Developers <devel@kali.org>`,
      `Architecture: amd64`,
      `Version: ${info.version}`,
      `Description: ${info.description}`,
    ]};
  }

  if (flags.includes("-L") || flags.includes("--listfiles")) {
    const pkg = pkgArgs[0];
    if (!pkg) return { output: ["dpkg-query: error: --listfiles needs a package name argument"] };
    return { output: [
      `/usr/bin/${pkg}`,
      `/usr/share/doc/${pkg}/README.md`,
      `/usr/share/doc/${pkg}/changelog.gz`,
      `/usr/share/man/man1/${pkg}.1.gz`,
      `/etc/${pkg}/${pkg}.conf`,
      `/usr/lib/${pkg}/`,
      `/usr/share/${pkg}/`,
    ]};
  }

  if (flags.includes("--configure")) {
    const pkg = pkgArgs[0] || "-a";
    return { output: [`Setting up ${pkg === "-a" ? "all pending packages" : pkg} ...`] };
  }

  return { output: [
    "Usage: dpkg [option...] command",
    "",
    "Commands:",
    "  -i|--install <.deb>    Install the package",
    "  -r|--remove <package>  Remove the package",
    "  -P|--purge <package>   Purge (remove with config)",
    "  -l|--list [pattern]    List packages",
    "  -s|--status <package>  Display package status",
    "  -L|--listfiles <pkg>   List files installed by package",
    "  --configure <pkg>      Configure an unpacked package",
  ]};
};

// pip3 command simulation
export const handlePip = (args: string[], state: TerminalState): CmdResult => {
  const subCmd = args[0];
  const pkgArgs = args.slice(1).filter(a => !a.startsWith("-"));

  switch (subCmd) {
    case "install": {
      const pkg = pkgArgs[0];
      if (!pkg) return { output: ["ERROR: No package specified."] };
      if (pipPackages.has(pkg)) {
        return { output: [`Requirement already satisfied: ${pkg} in /usr/lib/python3/dist-packages`] };
      }
      const ver = `${Math.floor(Math.random() * 5)}.${Math.floor(Math.random() * 20)}.${Math.floor(Math.random() * 10)}`;
      pipPackages.add(pkg);
      return { output: [
        `Collecting ${pkg}`,
        `  Downloading ${pkg}-${ver}-py3-none-any.whl (${(Math.random() * 500 + 50).toFixed(0)} kB)`,
        `     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ${(Math.random() * 500 + 50).toFixed(0)}/${(Math.random() * 500 + 50).toFixed(0)} kB ${(Math.random() * 5 + 1).toFixed(1)} MB/s eta 0:00:00`,
        `Installing collected packages: ${pkg}`,
        `Successfully installed ${pkg}-${ver}`,
      ]};
    }
    case "uninstall": {
      const pkg = pkgArgs[0];
      if (!pkg) return { output: ["ERROR: No package specified."] };
      if (!pipPackages.has(pkg)) {
        return { output: [`WARNING: Skipping ${pkg} as it is not installed.`] };
      }
      pipPackages.delete(pkg);
      return { output: [
        `Found existing installation: ${pkg}`,
        `Uninstalling ${pkg}:`,
        `  Would remove:`,
        `    /usr/lib/python3/dist-packages/${pkg}/*`,
        `Proceed (Y/n)? Y`,
        `  Successfully uninstalled ${pkg}`,
      ]};
    }
    case "list": {
      const lines = ["Package          Version", "---------------- ----------"];
      for (const p of Array.from(pipPackages).sort()) {
        lines.push(`${p.padEnd(17)} ${Math.floor(Math.random() * 5)}.${Math.floor(Math.random() * 20)}.${Math.floor(Math.random() * 10)}`);
      }
      return { output: lines };
    }
    case "show": {
      const pkg = pkgArgs[0];
      if (!pkg) return { output: ["ERROR: No package specified."] };
      return { output: [
        `Name: ${pkg}`,
        `Version: ${Math.floor(Math.random() * 5)}.${Math.floor(Math.random() * 20)}.${Math.floor(Math.random() * 10)}`,
        `Summary: Python package ${pkg}`,
        `Home-page: https://pypi.org/project/${pkg}/`,
        `Author: Open Source Community`,
        `License: MIT`,
        `Location: /usr/lib/python3/dist-packages`,
        `Requires: `,
      ]};
    }
    case "search": {
      return { output: ["WARNING: XMLRPC request failed. PyPI search is disabled. Use https://pypi.org/search instead."] };
    }
    case "freeze": {
      return { output: Array.from(pipPackages).sort().map(p => `${p}==${Math.floor(Math.random() * 5)}.${Math.floor(Math.random() * 20)}.${Math.floor(Math.random() * 10)}`) };
    }
    default:
      return { output: [
        "pip 24.0 from /usr/lib/python3/dist-packages/pip (python 3.12)",
        "",
        "Usage: pip3 <command> [options]",
        "",
        "Commands:",
        "  install      Install packages",
        "  uninstall    Uninstall packages",
        "  list         List installed packages",
        "  show         Show package details",
        "  freeze       Output installed packages in requirements format",
      ]};
  }
};

// gem (Ruby) command
export const handleGem = (args: string[]): CmdResult => {
  const sub = args[0];
  if (sub === "install") {
    const pkg = args[1];
    if (!pkg) return { output: ["ERROR: No gem specified."] };
    return { output: [
      `Fetching ${pkg}-${Math.floor(Math.random() * 3)}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 5)}.gem`,
      `Successfully installed ${pkg}`,
      "1 gem installed",
    ]};
  }
  if (sub === "list") {
    return { output: ["bundler (2.5.6)", "rake (13.1.0)", "rdoc (6.6.2)", "wpscan (3.8.25)"] };
  }
  return { output: ["RubyGems 3.5.6", "Usage: gem <command> [options]"] };
};

// snap command
export const handleSnap = (args: string[]): CmdResult => {
  const sub = args[0];
  if (sub === "install") {
    const pkg = args[1];
    if (!pkg) return { output: ["error: too few arguments for command"] };
    return { output: [
      `${pkg} (stable) installed`,
      `snap "${pkg}" has been installed.`,
    ]};
  }
  if (sub === "list") {
    return { output: [
      "Name       Version   Rev    Tracking     Publisher   Notes",
      "core22     20240111  1122   latest/stable canonical  base",
      "snapd      2.61      21184  latest/stable canonical  snapd",
    ]};
  }
  if (sub === "remove") {
    return { output: [`${args[1] || "package"} removed`] };
  }
  return { output: ["Usage: snap <command> [options]", "Commands: install, remove, list, find, info, refresh"] };
};

// git clone simulation
export const handleGitClone = (args: string[]): CmdResult => {
  const url = args.find(a => a.includes("://") || a.includes("github.com") || a.includes("gitlab.com"));
  if (!url) return { output: ["fatal: You must specify a repository to clone."] };
  
  const repoName = url.split("/").pop()?.replace(".git", "") || "repo";
  const size = (Math.random() * 50 + 5).toFixed(1);
  return { output: [
    `Cloning into '${repoName}'...`,
    `remote: Enumerating objects: ${Math.floor(Math.random() * 5000 + 500)}, done.`,
    `remote: Counting objects: 100% (${Math.floor(Math.random() * 500 + 100)}/${Math.floor(Math.random() * 500 + 100)}), done.`,
    `remote: Compressing objects: 100% (${Math.floor(Math.random() * 200 + 50)}/${Math.floor(Math.random() * 200 + 50)}), done.`,
    `remote: Total ${Math.floor(Math.random() * 5000 + 500)} (delta ${Math.floor(Math.random() * 3000 + 200)}), reused ${Math.floor(Math.random() * 4000 + 400)} (delta ${Math.floor(Math.random() * 2500 + 100)})`,
    `Receiving objects: 100%, ${size} MiB | ${(Math.random() * 10 + 2).toFixed(2)} MiB/s, done.`,
    `Resolving deltas: 100%, done.`,
  ]};
};
