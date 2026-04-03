import { FSNode, resolvePath, getNode, getParentAndName, formatSize } from "./kaliFileSystem";
import { executePythonScript } from "./pythonScripts";
import {
  handleAptFull, cmdSort, cmdSed, cmdAwk, cmdCut, cmdTr, cmdXargs, cmdTee, cmdDiff,
  cmdTar, cmdZip, cmdUnzip, cmdLn, cmdStat, cmdReadlink, cmdRealpath, cmdBasename,
  cmdDirname, cmdCp, cmdMv, cmdWget, cmdCurl, cmdWfuzz, cmdCrackmapexec, cmdResponder,
  cmdNiktoFull, cmdSmbclient, cmdChmod, cmdChown, cmdTree, cmdWatch, cmdScreen, cmdTmux,
  cmdCrontab, cmdProxychains, cmdSocat, cmdExiftool, cmdBinwalk,
  isCommandInstalled, getUnknownCommandSuggestion,
} from "./additionalCommands";

export interface TerminalState {
  cwd: string;
  fs: Record<string, FSNode>;
  env: Record<string, string>;
  history: string[];
  user: string;
  hostname: string;
}

type CmdResult = { output: string[]; newState?: Partial<TerminalState> };

const colorize = (text: string, color: string) => `\x1b[${color}]${text}\x1b[0m`;

export const executeCommand = (input: string, state: TerminalState): CmdResult => {
  const trimmed = input.trim();
  if (!trimmed) return { output: [] };

  // Handle pipes (simplified)
  if (trimmed.includes(" | ") && !trimmed.startsWith("echo")) {
    const parts = trimmed.split(" | ");
    let lastOutput: string[] = [];
    for (const part of parts) {
      const result = executeCommand(part.trim(), state);
      if (parts.indexOf(part) === 0) {
        lastOutput = result.output;
      } else {
        // Simple grep filter for piped commands
        const grepMatch = part.trim().match(/^grep\s+(?:-i\s+)?["']?([^"'\s]+)["']?/);
        if (grepMatch) {
          const pattern = grepMatch[1];
          const isInsensitive = part.includes("-i ");
          lastOutput = lastOutput.filter(l => 
            isInsensitive ? l.toLowerCase().includes(pattern.toLowerCase()) : l.includes(pattern)
          );
        }
        const wcMatch = part.trim().match(/^wc\s+(-l)?/);
        if (wcMatch) {
          lastOutput = [String(lastOutput.length)];
        }
        const headMatch = part.trim().match(/^head\s+(?:-n\s+)?(\d+)/);
        if (headMatch) {
          lastOutput = lastOutput.slice(0, parseInt(headMatch[1]));
        }
        const tailMatch = part.trim().match(/^tail\s+(?:-n\s+)?(\d+)/);
        if (tailMatch) {
          lastOutput = lastOutput.slice(-parseInt(tailMatch[1]));
        }
      }
    }
    return { output: lastOutput };
  }

  // Parse command and args
  const tokens = trimmed.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
  const cmd = tokens[0];
  const args = tokens.slice(1).map(a => a.replace(/^["']|["']$/g, ""));

  const commands: Record<string, () => CmdResult> = {
    ls: () => cmdLs(args, state),
    ll: () => cmdLs(["-la", ...args], state),
    cd: () => cmdCd(args, state),
    pwd: () => ({ output: [state.cwd] }),
    cat: () => cmdCat(args, state),
    echo: () => cmdEcho(args, state),
    whoami: () => ({ output: [state.user] }),
    id: () => ({ output: [`uid=1000(${state.user}) gid=1000(${state.user}) groups=1000(${state.user}),4(adm),20(dialout),24(cdrom),25(floppy),27(sudo),29(audio),30(dip),44(video),46(plugdev),100(users),101(netdev),118(bluetooth),141(scanner),148(wireshark)`] }),
    hostname: () => ({ output: [state.hostname] }),
    uname: () => cmdUname(args),
    date: () => ({ output: [new Date().toString()] }),
    uptime: () => ({ output: [` ${new Date().toLocaleTimeString()}  up 14 days, 3:27,  1 user,  load average: 0.52, 0.38, 0.31`] }),
    clear: () => ({ output: ["__CLEAR__"] }),
    history: () => ({ output: state.history.map((h, i) => `  ${String(i + 1).padStart(4)}  ${h}`) }),
    touch: () => cmdTouch(args, state),
    mkdir: () => cmdMkdir(args, state),
    rm: () => cmdRm(args, state),
    cp: () => cmdCp(args, state),
    mv: () => cmdMv(args, state),
    head: () => cmdHead(args, state),
    tail: () => cmdTail(args, state),
    grep: () => cmdGrep(args, state),
    find: () => cmdFind(args, state),
    wc: () => cmdWc(args, state),
    which: () => cmdWhich(args),
    type: () => cmdType(args),
    file: () => cmdFile(args, state),
    chmod: () => cmdChmod(args, state),
    chown: () => cmdChown(args, state),
    man: () => cmdMan(args),
    help: () => cmdHelp(),
    env: () => ({ output: Object.entries(state.env).map(([k, v]) => `${k}=${v}`) }),
    export: () => cmdExport(args, state),
    unset: () => {
      if (args[0]) {
        const newEnv = { ...state.env };
        delete newEnv[args[0]];
        return { output: [], newState: { env: newEnv } };
      }
      return { output: [] };
    },
    ifconfig: () => cmdIfconfig(),
    ip: () => cmdIp(args),
    ping: () => cmdPing(args),
    netstat: () => cmdNetstat(args),
    ss: () => cmdSs(),
    curl: () => cmdCurl(args),
    wget: () => cmdWget(args),
    nmap: () => cmdNmap(args),
    python3: () => cmdPython3(args, state),
    python: () => cmdPython3(args, state),
    pip3: () => ({ output: ["pip 24.0 from /usr/lib/python3/dist-packages/pip (python 3.12)"] }),
    pip: () => ({ output: ["pip 24.0 from /usr/lib/python3/dist-packages/pip (python 3.12)"] }),
    git: () => cmdGit(args),
    apt: () => handleAptFull(args, state),
    "apt-get": () => handleAptFull(args, state),
    dpkg: () => ({ output: args.includes("-l") ? ["ii  nmap  7.94  amd64  Network exploration tool", "ii  python3  3.12.3  amd64  Python interpreter"] : ["dpkg: error: need an action option"] }),
    sudo: () => {
      const subCmd = args.join(" ");
      return executeCommand(subCmd, { ...state, user: "root" });
    },
    su: () => ({ output: ["su: Authentication failure"] }),
    ssh: () => ({ output: [`ssh: connect to host ${args[0] || "unknown"} port 22: Connection timed out`] }),
    scp: () => ({ output: [`scp: missing operand`] }),
    systemctl: () => cmdSystemctl(args),
    service: () => cmdService(args),
    ps: () => cmdPs(args),
    top: () => cmdTop(),
    htop: () => cmdTop(),
    kill: () => ({ output: args.length ? [] : ["kill: usage: kill [-s sigspec | -n signum | -sigspec] pid | jobspec ... or kill -l [sigspec]"] }),
    df: () => cmdDf(),
    du: () => cmdDu(args, state),
    free: () => cmdFree(),
    lsblk: () => cmdLsblk(),
    mount: () => cmdMount(),
    dmesg: () => cmdDmesg(),
    journalctl: () => cmdJournalctl(args),
    iptables: () => cmdIptables(args),
    ufw: () => cmdUfw(args),
    useradd: () => ({ output: [] }),
    userdel: () => ({ output: [] }),
    passwd: () => ({ output: ["passwd: password updated successfully"] }),
    groups: () => ({ output: ["kali adm cdrom sudo dip plugdev users netdev bluetooth scanner wireshark"] }),
    "2>&1": () => ({ output: [] }),
    true: () => ({ output: [] }),
    false: () => ({ output: [] }),
    exit: () => ({ output: ["logout"] }),
    logout: () => ({ output: ["logout"] }),
    reboot: () => ({ output: ["Failed to set wall message, ignoring: Interactive authentication required."] }),
    shutdown: () => ({ output: ["Failed to set wall message, ignoring: Interactive authentication required."] }),
    neofetch: () => cmdNeofetch(state),
    screenfetch: () => cmdNeofetch(state),
    lsb_release: () => ({ output: [
      "Distributor ID:\tKali",
      "Description:\tKali GNU/Linux Rolling",
      "Release:\t2026.1",
      "Codename:\tkali-rolling",
    ]}),
    cal: () => cmdCal(),
    w: () => ({ output: [
      ` ${new Date().toLocaleTimeString()} up 14 days,  3:27,  1 user,  load average: 0.52, 0.38, 0.31`,
      "USER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT",
      "kali     pts/0    10.0.2.2         16:00    0.00s  0.04s  0.01s w",
    ]}),
    last: () => ({ output: [
      "kali     pts/0        10.0.2.2         Mon Mar 23 16:00   still logged in",
      "kali     pts/0        10.0.2.2         Mon Mar 22 09:15 - 18:30  (09:15)",
      "reboot   system boot  6.6.9-amd64      Mon Mar 09 12:00   still running",
    ]}),
    alias: () => ({ output: [
      "alias ll='ls -la'",
      "alias grep='grep --color=auto'",
      "alias ls='ls --color=auto'",
    ]}),
    printenv: () => ({ output: Object.entries(state.env).map(([k, v]) => `${k}=${v}`) }),
    set: () => ({ output: Object.entries(state.env).map(([k, v]) => `${k}=${v}`) }),
    tty: () => ({ output: ["/dev/pts/0"] }),
    stty: () => ({ output: ["speed 38400 baud; rows 42; columns 120; line = 0;"] }),
    arch: () => ({ output: ["x86_64"] }),
    nproc: () => ({ output: ["24"] }),
    lscpu: () => ({ output: [
      "Architecture:            x86_64",
      "CPU op-mode(s):          32-bit, 64-bit",
      "CPU(s):                  24",
      "Thread(s) per core:      2",
      "Core(s) per socket:      12",
      "Model name:              Intel(R) Core(TM) i9-13900K",
      "CPU MHz:                 3000.000",
      "L1d cache:               576 KiB",
      "L1i cache:               384 KiB",
      "L2 cache:                32 MiB",
      "L3 cache:                36 MiB",
    ]}),
    xxd: () => ({ output: ["Usage: xxd [options] [infile [outfile]]"] }),
    base64: () => {
      if (args.length && !args[0].startsWith("-")) {
        return { output: [btoa(args.join(" "))] };
      }
      return { output: ["base64: missing operand"] };
    },
    md5sum: () => ({ output: args.length ? [`d41d8cd98f00b204e9800998ecf8427e  ${args[0]}`] : ["md5sum: missing operand"] }),
    sha256sum: () => ({ output: args.length ? [`e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855  ${args[0]}`] : ["sha256sum: missing operand"] }),
    openssl: () => ({ output: ["OpenSSL 3.1.4 24 Oct 2023 (Library: OpenSSL 3.1.4 24 Oct 2023)"] }),
    nc: () => ({ output: ["Ncat: Connection refused."] }),
    ncat: () => ({ output: ["Ncat: Connection refused."] }),
    msfconsole: () => cmdMsfconsole(),
    hydra: () => cmdHydra(args),
    sqlmap: () => cmdSqlmap(args),
    john: () => ({ output: ["John the Ripper 1.9.0-jumbo-1", "Usage: john [OPTIONS] [PASSWORD-FILES]"] }),
    hashcat: () => ({ output: ["hashcat (v6.2.6) starting...", "", "Usage: hashcat [options]... hash|hashfile|hccapxfile [dictionary|mask|directory]..."] }),
    aircrack: () => ({ output: ["Aircrack-ng 1.7  - (C) 2006-2022 Thomas d'Otreppe"] }),
    "aircrack-ng": () => ({ output: ["Aircrack-ng 1.7  - (C) 2006-2022 Thomas d'Otreppe"] }),
    nikto: () => ({ output: ["- Nikto v2.5.0", "---------------------------------------------------------------------------", "Usage: nikto -h <host>"] }),
    dirb: () => ({ output: ["DIRB v2.22", "By The Dark Raver", "Usage: dirb <url_base> [<wordlist_file(s)>]"] }),
    gobuster: () => ({ output: ["Usage:", "  gobuster [command]", "", "Available Commands:", "  dir         Uses directory/file enumeration mode", "  dns         Uses DNS subdomain enumeration mode", "  fuzz        Uses fuzzing mode", "  vhost       Uses VHOST enumeration mode"] }),
    wireshark: () => ({ output: ["Wireshark 4.2.2 (Git v4.2.2)", "[Display opened in background]"] }),
    tcpdump: () => ({ output: [`tcpdump: listening on eth0, link-type EN10MB`, `${new Date().toLocaleTimeString()} IP 192.168.1.10.443 > 192.168.1.100.54321: Flags [S.], seq 0, ack 1, win 65535`, `${new Date().toLocaleTimeString()} IP 192.168.1.100.54321 > 192.168.1.10.443: Flags [.], ack 1, win 65535`] }),
    metasploit: () => cmdMsfconsole(),
    burpsuite: () => ({ output: ["Burp Suite Professional v2024.2.1", "[*] Starting in headless mode..."] }),
    // Additional commands
    sort: () => cmdSort(args, state),
    sed: () => cmdSed(args),
    awk: () => cmdAwk(args),
    cut: () => cmdCut(args, state),
    tr: () => cmdTr(args),
    xargs: () => cmdXargs(args),
    tee: () => cmdTee(args, state),
    diff: () => cmdDiff(args, state),
    tar: () => cmdTar(args),
    zip: () => cmdZip(args),
    unzip: () => cmdUnzip(args),
    ln: () => cmdLn(args),
    stat: () => cmdStat(args, state),
    readlink: () => cmdReadlink(args),
    realpath: () => cmdRealpath(args, state),
    basename: () => cmdBasename(args),
    dirname: () => cmdDirname(args),
    tree: () => cmdTree(args, state),
    watch: () => cmdWatch(args),
    screen: () => cmdScreen(args),
    tmux: () => cmdTmux(args),
    crontab: () => cmdCrontab(args),
    wfuzz: () => cmdWfuzz(args),
    crackmapexec: () => cmdCrackmapexec(args),
    responder: () => cmdResponder(args),
    smbclient: () => cmdSmbclient(args),
    proxychains: () => cmdProxychains(args),
    proxychains4: () => cmdProxychains(args),
    socat: () => cmdSocat(args),
    exiftool: () => cmdExiftool(args),
    binwalk: () => cmdBinwalk(args),
    gzip: () => ({ output: args.length ? [`${args[0]}: compressed to ${args[0]}.gz`] : ["gzip: missing operand"] }),
    gunzip: () => ({ output: args.length ? [`${args[0]}: decompressed`] : ["gunzip: missing operand"] }),
    less: () => cmdCat(args, state),
    more: () => cmdCat(args, state),
    vi: () => ({ output: [`__EDITOR__:vim:${args.join(" ")}`] }),
    vim: () => ({ output: [`__EDITOR__:vim:${args.join(" ")}`] }),
    nano: () => ({ output: [`__EDITOR__:nano:${args.join(" ")}`] }),
    mc: () => ({ output: ["__MC__"] }),
    sleep: () => ({ output: [] }),
    seq: () => {
      const start = parseInt(args[0]) || 1;
      const end = parseInt(args[1] || args[0]) || 10;
      return { output: Array.from({length: Math.min(end - start + 1, 100)}, (_, i) => String(start + i)) };
    },
    rev: () => ({ output: args.length ? [args.join(" ").split("").reverse().join("")] : [] }),
    factor: () => ({ output: args.length ? [`${args[0]}: ${args[0]}`] : ["factor: missing operand"] }),
    bc: () => ({ output: ["bc 1.07.1 - GNU bc calculator", "Use: echo 'expression' | bc"] }),
    dc: () => ({ output: ["dc - reverse-polish calculator"] }),
  };

  const handler = commands[cmd];
  if (handler) return handler();
  
  // Check if it's a path to a script
  if (cmd.startsWith("./") || cmd.startsWith("/")) {
    const path = resolvePath(state.cwd, cmd);
    const node = getNode(state.fs, path);
    if (node?.type === "file") {
      if (node.permissions?.includes("x")) {
        if (cmd.endsWith(".py")) return cmdPython3([cmd], state);
        if (cmd.endsWith(".sh")) return { output: [`[*] Executing ${cmd}...`, `[✓] Script completed.`] };
      }
      return { output: [`bash: ${cmd}: Permission denied (use chmod +x ${cmd})`] };
    }
    return { output: [`bash: ${cmd}: No such file or directory`] };
  }

  return getUnknownCommandSuggestion(cmd);
};

// Command implementations
function cmdLs(args: string[], state: TerminalState): CmdResult {
  const showAll = args.includes("-a") || args.includes("-la") || args.includes("-al");
  const longFormat = args.includes("-l") || args.includes("-la") || args.includes("-al");
  const pathArg = args.find(a => !a.startsWith("-"));
  const targetPath = pathArg ? resolvePath(state.cwd, pathArg) : state.cwd;
  const node = getNode(state.fs, targetPath);

  if (!node) return { output: [`ls: cannot access '${pathArg}': No such file or directory`] };
  if (node.type === "file") {
    return { output: [longFormat ? `${node.permissions || "-rw-r--r--"} 1 ${node.owner || "kali"} ${node.owner || "kali"} ${formatSize(node.size || 0)} ${node.modified || "Mar 23 00:00"} ${pathArg}` : (pathArg || "")] };
  }

  const entries = Object.entries(node.children || {});
  const output: string[] = [];

  if (longFormat) {
    output.push(`total ${entries.length * 4}`);
    if (showAll) {
      output.push(`drwxr-xr-x  ${entries.length + 2} ${state.user} ${state.user}  4096 Mar 23 16:00 .`);
      output.push(`drwxr-xr-x  ${entries.length + 2} ${state.user} ${state.user}  4096 Mar 23 16:00 ..`);
    }
    for (const [name, child] of entries) {
      if (!showAll && name.startsWith(".")) continue;
      const perm = child.type === "dir" ? "drwxr-xr-x" : (child.permissions || "-rw-r--r--");
      const size = child.type === "dir" ? "4096" : formatSize(child.size || 0);
      const mod = child.modified || "Mar 23 00:00";
      const owner = child.owner || state.user;
      const display = child.type === "dir" ? `\x1b[1;34m${name}\x1b[0m` : name.endsWith(".py") ? `\x1b[1;32m${name}\x1b[0m` : name;
      output.push(`${perm}  1 ${owner} ${owner} ${String(size).padStart(8)} ${mod} ${display}`);
    }
  } else {
    const names = entries
      .filter(([name]) => showAll || !name.startsWith("."))
      .map(([name, child]) => child.type === "dir" ? `\x1b[1;34m${name}\x1b[0m` : name.endsWith(".py") ? `\x1b[1;32m${name}\x1b[0m` : name);
    output.push(names.join("  "));
  }
  return { output };
}

function cmdCd(args: string[], state: TerminalState): CmdResult {
  const target = args[0] || "~";
  const newPath = resolvePath(state.cwd, target);
  const node = getNode(state.fs, newPath);
  if (!node) return { output: [`bash: cd: ${target}: No such file or directory`] };
  if (node.type !== "dir") return { output: [`bash: cd: ${target}: Not a directory`] };
  return { output: [], newState: { cwd: newPath } };
}

function cmdCat(args: string[], state: TerminalState): CmdResult {
  if (!args.length) return { output: [] };
  const allOutput: string[] = [];
  for (const arg of args) {
    const path = resolvePath(state.cwd, arg);
    const node = getNode(state.fs, path);
    if (!node) { allOutput.push(`cat: ${arg}: No such file or directory`); continue; }
    if (node.type === "dir") { allOutput.push(`cat: ${arg}: Is a directory`); continue; }
    allOutput.push(...(node.content || "").split("\n"));
  }
  return { output: allOutput };
}

function cmdEcho(args: string[], state: TerminalState): CmdResult {
  let text = args.join(" ");
  // Replace env vars
  text = text.replace(/\$(\w+)/g, (_, name) => state.env[name] || "");
  // Handle redirect
  if (text.includes(" > ") || text.includes(" >> ")) {
    const redirectMatch = text.match(/^(.*?)\s*>{1,2}\s*(.+)$/);
    if (redirectMatch) {
      const content = redirectMatch[1];
      const filePath = resolvePath(state.cwd, redirectMatch[2].trim());
      const { parent, name } = getParentAndName(state.fs, filePath);
      if (parent?.type === "dir" && parent.children) {
        parent.children[name] = { type: "file", content, size: content.length, permissions: "-rw-r--r--", owner: state.user, modified: "Mar 23 " + new Date().toLocaleTimeString().slice(0, 5) };
      }
      return { output: [] };
    }
  }
  return { output: [text] };
}

function cmdUname(args: string[]): CmdResult {
  if (args.includes("-a")) return { output: ["Linux kali 6.6.9-amd64 #1 SMP PREEMPT_DYNAMIC Kali 6.6.9-1kali1 (2026-01-15) x86_64 GNU/Linux"] };
  if (args.includes("-r")) return { output: ["6.6.9-amd64"] };
  if (args.includes("-m")) return { output: ["x86_64"] };
  if (args.includes("-n")) return { output: ["kali"] };
  if (args.includes("-o")) return { output: ["GNU/Linux"] };
  if (args.includes("-s")) return { output: ["Linux"] };
  return { output: ["Linux"] };
}

function cmdTouch(args: string[], state: TerminalState): CmdResult {
  for (const arg of args) {
    const path = resolvePath(state.cwd, arg);
    const { parent, name } = getParentAndName(state.fs, path);
    if (parent?.type === "dir" && parent.children && !parent.children[name]) {
      parent.children[name] = { type: "file", content: "", size: 0, permissions: "-rw-r--r--", owner: state.user, modified: "Mar 23 " + new Date().toLocaleTimeString().slice(0, 5) };
    }
  }
  return { output: [] };
}

function cmdMkdir(args: string[], state: TerminalState): CmdResult {
  for (const arg of args.filter(a => !a.startsWith("-"))) {
    const path = resolvePath(state.cwd, arg);
    const { parent, name } = getParentAndName(state.fs, path);
    if (parent?.type === "dir" && parent.children) {
      parent.children[name] = { type: "dir", children: {} };
    }
  }
  return { output: [] };
}

function cmdRm(args: string[], state: TerminalState): CmdResult {
  for (const arg of args.filter(a => !a.startsWith("-"))) {
    const path = resolvePath(state.cwd, arg);
    const { parent, name } = getParentAndName(state.fs, path);
    if (parent?.type === "dir" && parent.children) {
      delete parent.children[name];
    }
  }
  return { output: [] };
}

function cmdHead(args: string[], state: TerminalState): CmdResult {
  const nIdx = args.indexOf("-n");
  const n = nIdx >= 0 ? parseInt(args[nIdx + 1]) : 10;
  const file = args.find(a => !a.startsWith("-") && isNaN(Number(a)));
  if (!file) return { output: [] };
  const path = resolvePath(state.cwd, file);
  const node = getNode(state.fs, path);
  if (!node || node.type !== "file") return { output: [`head: cannot open '${file}' for reading: No such file or directory`] };
  return { output: (node.content || "").split("\n").slice(0, n) };
}

function cmdTail(args: string[], state: TerminalState): CmdResult {
  const nIdx = args.indexOf("-n");
  const n = nIdx >= 0 ? parseInt(args[nIdx + 1]) : 10;
  const file = args.find(a => !a.startsWith("-") && isNaN(Number(a)));
  if (!file) return { output: [] };
  const path = resolvePath(state.cwd, file);
  const node = getNode(state.fs, path);
  if (!node || node.type !== "file") return { output: [`tail: cannot open '${file}' for reading: No such file or directory`] };
  return { output: (node.content || "").split("\n").slice(-n) };
}

function cmdGrep(args: string[], state: TerminalState): CmdResult {
  const isInsensitive = args.includes("-i");
  const isRecursive = args.includes("-r") || args.includes("-R");
  const filtered = args.filter(a => !a.startsWith("-"));
  if (filtered.length < 2) return { output: ["Usage: grep [OPTION]... PATTERNS [FILE]..."] };
  const pattern = filtered[0];
  const file = filtered[1];
  const path = resolvePath(state.cwd, file);
  const node = getNode(state.fs, path);
  if (!node || node.type !== "file") return { output: [`grep: ${file}: No such file or directory`] };
  const lines = (node.content || "").split("\n");
  const matches = lines.filter(l => isInsensitive ? l.toLowerCase().includes(pattern.toLowerCase()) : l.includes(pattern));
  return { output: matches };
}

function cmdFind(args: string[], state: TerminalState): CmdResult {
  const dir = args[0] || ".";
  const nameIdx = args.indexOf("-name");
  const pattern = nameIdx >= 0 ? args[nameIdx + 1]?.replace(/\*/g, ".*") : null;
  const results: string[] = [];
  
  const walk = (path: string) => {
    const node = getNode(state.fs, path);
    if (!node) return;
    const displayPath = path === "/" ? "/" : path;
    if (!pattern || new RegExp(pattern).test(displayPath.split("/").pop() || "")) {
      results.push(displayPath);
    }
    if (node.type === "dir" && node.children) {
      for (const name of Object.keys(node.children)) {
        walk(path === "/" ? `/${name}` : `${path}/${name}`);
      }
    }
  };
  walk(resolvePath(state.cwd, dir));
  return { output: results.slice(0, 50) };
}

function cmdWc(args: string[], state: TerminalState): CmdResult {
  const file = args.find(a => !a.startsWith("-"));
  if (!file) return { output: [] };
  const path = resolvePath(state.cwd, file);
  const node = getNode(state.fs, path);
  if (!node || node.type !== "file") return { output: [`wc: ${file}: No such file or directory`] };
  const content = node.content || "";
  const lines = content.split("\n").length;
  const words = content.split(/\s+/).filter(Boolean).length;
  const chars = content.length;
  return { output: [`  ${lines}  ${words} ${chars} ${file}`] };
}

function cmdWhich(args: string[]): CmdResult {
  const bins: Record<string, string> = {
    python3: "/usr/bin/python3", python: "/usr/bin/python3", nmap: "/usr/bin/nmap", git: "/usr/bin/git",
    curl: "/usr/bin/curl", wget: "/usr/bin/wget", ssh: "/usr/bin/ssh", bash: "/usr/bin/bash",
    ls: "/usr/bin/ls", cat: "/usr/bin/cat", grep: "/usr/bin/grep", find: "/usr/bin/find",
    msfconsole: "/usr/bin/msfconsole", hydra: "/usr/bin/hydra", sqlmap: "/usr/bin/sqlmap",
    wireshark: "/usr/bin/wireshark", tcpdump: "/usr/sbin/tcpdump", aircrack: "/usr/bin/aircrack-ng",
    nikto: "/usr/bin/nikto", gobuster: "/usr/bin/gobuster", john: "/usr/bin/john",
    hashcat: "/usr/bin/hashcat", burpsuite: "/usr/bin/burpsuite",
  };
  return { output: args.map(a => bins[a] || `${a} not found`) };
}

function cmdType(args: string[]): CmdResult {
  const builtins = ["cd", "echo", "export", "alias", "history", "exit", "set", "unset"];
  return { output: args.map(a => builtins.includes(a) ? `${a} is a shell builtin` : `${a} is /usr/bin/${a}`) };
}

function cmdFile(args: string[], state: TerminalState): CmdResult {
  if (!args.length) return { output: ["Usage: file [-bchikLNnprsvz0] [--apple] [--mime-encoding] file ..."] };
  const path = resolvePath(state.cwd, args[0]);
  const node = getNode(state.fs, path);
  if (!node) return { output: [`${args[0]}: cannot open (No such file or directory)`] };
  if (node.type === "dir") return { output: [`${args[0]}: directory`] };
  if (args[0].endsWith(".py")) return { output: [`${args[0]}: Python script, UTF-8 Unicode text executable`] };
  return { output: [`${args[0]}: UTF-8 Unicode text`] };
}

function cmdMan(args: string[]): CmdResult {
  if (!args.length) return { output: ["What manual page do you want?"] };
  return { output: [`No manual entry for ${args[0]}`, `(run 'man -k ${args[0]}' to search)`] };
}

function cmdHelp(): CmdResult {
  return { output: [
    "┌──────────────────────────────────────────────────────────────────────┐",
    "│  Kali Linux 2026.1 — UCSF Security Terminal (Full OS Simulation)   │",
    "├──────────────────────────────────────────────────────────────────────┤",
    "│ FILE:     ls cd pwd cat head tail touch mkdir rm cp mv find tree   │",
    "│           stat chmod chown ln diff sort cut tar zip unzip          │",
    "│ TEXT:     echo grep wc sed awk tr rev tee xargs                    │",
    "│ SYSTEM:   uname hostname whoami id ps top df free uptime date      │",
    "│           lsblk mount dmesg journalctl systemctl crontab           │",
    "│ NETWORK:  ifconfig ip ping netstat ss curl wget nmap tcpdump       │",
    "│ SECURITY: nmap msfconsole hydra sqlmap nikto gobuster john wfuzz   │",
    "│           hashcat crackmapexec responder smbclient burpsuite       │",
    "│           binwalk exiftool proxychains socat                       │",
    "│ PYTHON:   python3 port_scanner.py / packet_sniffer.py             │",
    "│           password_cracker.py / wifi_cracker.py / forensics_tool  │",
    "│           exploit_framework.py / keylogger_detector.py            │",
    "│           reverse_shell_gen.py / ids_monitor.py / scanner.py      │",
    "│ PACKAGE:  apt install/update/upgrade/search/remove/show           │",
    "│ OTHER:    history alias env export clear neofetch screen tmux      │",
    "├──────────────────────────────────────────────────────────────────────┤",
    "│ TIP: apt install <pkg> to add new tools                           │",
    "│ TIP: python3 <script.py> to run security scripts                  │",
    "│ TIP: Use pipes: command | grep pattern | wc -l                    │",
    "└──────────────────────────────────────────────────────────────────────┘",
  ] };
}

function cmdExport(args: string[], state: TerminalState): CmdResult {
  const newEnv = { ...state.env };
  for (const arg of args) {
    const match = arg.match(/^(\w+)=(.*)$/);
    if (match) newEnv[match[1]] = match[2];
  }
  return { output: [], newState: { env: newEnv } };
}

function cmdIfconfig(): CmdResult {
  return { output: [
    "eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500",
    "        inet 192.168.1.100  netmask 255.255.255.0  broadcast 192.168.1.255",
    "        inet6 fe80::a00:27ff:fe8d:c04d  prefixlen 64  scopeid 0x20<link>",
    "        ether 08:00:27:8d:c0:4d  txqueuelen 1000  (Ethernet)",
    "        RX packets 152834  bytes 198234567 (189.0 MiB)",
    "        TX packets 98234   bytes 12345678 (11.7 MiB)",
    "",
    "lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536",
    "        inet 127.0.0.1  netmask 255.0.0.0",
    "        inet6 ::1  prefixlen 128  scopeid 0x10<host>",
    "        loop  txqueuelen 1000  (Local Loopback)",
    "        RX packets 8234  bytes 1234567 (1.1 MiB)",
    "        TX packets 8234  bytes 1234567 (1.1 MiB)",
  ] };
}

function cmdIp(args: string[]): CmdResult {
  if (args[0] === "a" || args[0] === "addr") {
    return { output: [
      "1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 state UNKNOWN",
      "    inet 127.0.0.1/8 scope host lo",
      "2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 state UP",
      "    inet 192.168.1.100/24 brd 192.168.1.255 scope global dynamic eth0",
    ] };
  }
  if (args[0] === "route" || args[0] === "r") {
    return { output: [
      "default via 192.168.1.1 dev eth0 proto dhcp metric 100",
      "192.168.1.0/24 dev eth0 proto kernel scope link src 192.168.1.100",
    ] };
  }
  return { output: ["Usage: ip [ OPTIONS ] OBJECT { COMMAND | help }"] };
}

function cmdPing(args: string[]): CmdResult {
  const host = args.find(a => !a.startsWith("-")) || "localhost";
  return { output: [
    `PING ${host} (${host === "localhost" ? "127.0.0.1" : "93.184." + Math.floor(Math.random() * 255) + ".1"}) 56(84) bytes of data.`,
    `64 bytes from ${host}: icmp_seq=1 ttl=64 time=${(Math.random() * 50 + 1).toFixed(1)} ms`,
    `64 bytes from ${host}: icmp_seq=2 ttl=64 time=${(Math.random() * 50 + 1).toFixed(1)} ms`,
    `64 bytes from ${host}: icmp_seq=3 ttl=64 time=${(Math.random() * 50 + 1).toFixed(1)} ms`,
    "",
    `--- ${host} ping statistics ---`,
    `3 packets transmitted, 3 received, 0% packet loss, time 2003ms`,
    `rtt min/avg/max/mdev = ${(Math.random() * 10 + 1).toFixed(3)}/${(Math.random() * 30 + 10).toFixed(3)}/${(Math.random() * 50 + 20).toFixed(3)}/${(Math.random() * 5).toFixed(3)} ms`,
  ] };
}

function cmdNetstat(args: string[]): CmdResult {
  return { output: [
    "Active Internet connections (servers and established)",
    "Proto Recv-Q Send-Q Local Address           Foreign Address         State",
    "tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN",
    "tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN",
    "tcp        0      0 0.0.0.0:443             0.0.0.0:*               LISTEN",
    "tcp        0      0 192.168.1.100:443       10.0.2.15:54321         ESTABLISHED",
    "tcp        0      0 192.168.1.100:22        10.0.2.15:49872         ESTABLISHED",
    "udp        0      0 0.0.0.0:68              0.0.0.0:*",
  ] };
}

function cmdSs(): CmdResult {
  return { output: [
    "Netid  State   Recv-Q  Send-Q  Local Address:Port  Peer Address:Port",
    "tcp    LISTEN  0       128     0.0.0.0:22           0.0.0.0:*",
    "tcp    LISTEN  0       128     0.0.0.0:80           0.0.0.0:*",
    "tcp    LISTEN  0       128     0.0.0.0:443          0.0.0.0:*",
    "tcp    ESTAB   0       0       192.168.1.100:443    10.0.2.15:54321",
  ] };
}




function cmdNmap(args: string[]): CmdResult {
  const target = args.find(a => !a.startsWith("-")) || "192.168.1.1";
  return { output: [
    `Starting Nmap 7.94SVN ( https://nmap.org ) at ${new Date().toISOString()}`,
    `Nmap scan report for ${target}`,
    `Host is up (0.0012s latency).`,
    `Not shown: 995 closed tcp ports (reset)`,
    `PORT     STATE SERVICE     VERSION`,
    `22/tcp   open  ssh         OpenSSH 8.9p1 Ubuntu`,
    `80/tcp   open  http        Apache httpd 2.4.52`,
    `443/tcp  open  ssl/http    Apache httpd 2.4.52`,
    `3306/tcp open  mysql       MySQL 8.0.32`,
    `8080/tcp open  http-proxy`,
    ``,
    `Service detection performed. Please report any incorrect results at https://nmap.org/submit/`,
    `Nmap done: 1 IP address (1 host up) scanned in 8.42 seconds`,
  ] };
}

function cmdPython3(args: string[], state: TerminalState): CmdResult {
  if (!args.length) {
    return { output: [
      "Python 3.12.3 (main, Feb 14 2026, 00:00:00) [GCC 13.2.0] on linux",
      'Type "help", "copyright", "credits" or "license" for more information.',
      ">>> (Interactive mode not supported. Use: python3 script.py)",
    ] };
  }
  if (args[0] === "--version" || args[0] === "-V") {
    return { output: ["Python 3.12.3"] };
  }
  if (args[0] === "-c") {
    const code = args.slice(1).join(" ");
    if (code.includes("print(") && code.includes("+")) return { output: ["[Executed Python expression]"] };
    if (code.includes("import this")) return { output: ["The Zen of Python, by Tim Peters", "", "Beautiful is better than ugly.", "Explicit is better than implicit.", "Simple is better than complex."] };
    if (code.includes("print(")) {
      const match = code.match(/print\(["'](.+?)["']\)/);
      if (match) return { output: [match[1]] };
    }
    return { output: [`${code} → [OK]`] };
  }
  if (args[0] === "-m") {
    if (args[1] === "http.server") return { output: [`Serving HTTP on 0.0.0.0 port ${args[2] || "8000"} (http://0.0.0.0:${args[2] || "8000"}/) ...`] };
    if (args[1] === "pip") return { output: ["pip 24.0 from /usr/lib/python3/dist-packages/pip (python 3.12)"] };
    return { output: [`/usr/bin/python3: No module named ${args[1]}`] };
  }
  // Run .py file
  const scriptName = args[0];
  const path = resolvePath(state.cwd, scriptName);
  const node = getNode(state.fs, path);
  if (!node || node.type !== "file") {
    return { output: [`python3: can't open file '${scriptName}': [Errno 2] No such file or directory`] };
  }
  return { output: executePythonScript(scriptName, args.slice(1), state) };
}

function cmdGit(args: string[]): CmdResult {
  if (!args.length || args[0] === "--version") return { output: ["git version 2.43.0"] };
  if (args[0] === "status") return { output: [
    "On branch main",
    "Your branch is up to date with 'origin/main'.",
    "",
    "nothing to commit, working tree clean",
  ] };
  if (args[0] === "log") return { output: [
    "commit a1b2c3d4e5f6 (HEAD -> main, origin/main)",
    "Author: kali <kali@kali.local>",
    `Date:   ${new Date().toDateString()}`,
    "",
    "    Updated security scripts",
  ] };
  return { output: [`git: '${args[0]}' is not a git command.`] };
}




function cmdSystemctl(args: string[]): CmdResult {
  if (args[0] === "status") {
    const svc = args[1] || "ssh";
    return { output: [
      `● ${svc}.service - ${svc === "ssh" ? "OpenBSD Secure Shell server" : svc}`,
      `     Loaded: loaded (/lib/systemd/system/${svc}.service; enabled; preset: disabled)`,
      `     Active: active (running) since Mon 2026-03-09 12:00:00 UTC; 2 weeks ago`,
      `   Main PID: ${1000 + Math.floor(Math.random() * 9000)}`,
      `      Tasks: 1 (limit: 38292)`,
      `     Memory: 4.2M`,
      `        CPU: 234ms`,
    ] };
  }
  return { output: ["Usage: systemctl [OPTIONS...] COMMAND ..."] };
}

function cmdService(args: string[]): CmdResult {
  return cmdSystemctl(args.reverse());
}

function cmdPs(args: string[]): CmdResult {
  return { output: [
    "  PID TTY          TIME CMD",
    "    1 ?        00:00:03 systemd",
    "  234 ?        00:00:01 sshd",
    "  567 ?        00:00:00 apache2",
    "  890 ?        00:00:02 wazuh-agentd",
    " 1234 ?        00:00:01 suricata",
    " 2345 pts/0    00:00:00 bash",
    ` ${3000 + Math.floor(Math.random() * 1000)} pts/0    00:00:00 ps`,
  ] };
}

function cmdTop(): CmdResult {
  return { output: [
    `top - ${new Date().toLocaleTimeString()} up 14 days,  3:27,  1 user,  load average: 0.52, 0.38, 0.31`,
    "Tasks: 142 total,   1 running, 141 sleeping,   0 stopped,   0 zombie",
    "%Cpu(s):  3.2 us,  1.1 sy,  0.0 ni, 95.4 id,  0.2 wa,  0.0 hi,  0.1 si,  0.0 st",
    "MiB Mem :  32000.0 total,  18000.0 free,   6000.0 used,   8000.0 buff/cache",
    "MiB Swap:   8000.0 total,   8000.0 free,      0.0 used.  24000.0 avail Mem",
    "",
    "  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND",
    " 1234 root      20   0  546240  48320  12032 S   2.3   0.1   0:12.34 wazuh-agentd",
    "  567 root      20   0  432128  34560  10240 S   1.7   0.1   0:08.56 apache2",
    " 1235 root      20   0 1234560 128000  32000 S   1.0   0.4   0:24.12 suricata",
    "  234 root      20   0   15820   6400   5120 S   0.3   0.0   0:01.23 sshd",
    " 2345 kali      20   0   10240   5120   3072 S   0.0   0.0   0:00.01 bash",
  ] };
}

function cmdDf(): CmdResult {
  return { output: [
    "Filesystem     1K-blocks     Used Available Use% Mounted on",
    "/dev/sda1      104857600 32456780  72400820  31% /",
    "tmpfs            8192000        0   8192000   0% /dev/shm",
    "/dev/sda2      209715200 15728640 193986560   8% /home",
    "tmpfs            1638400     1024   1637376   1% /run",
  ] };
}

function cmdDu(args: string[], state: TerminalState): CmdResult {
  return { output: [
    "4.0K\t./Desktop",
    "12K\t./Documents",
    "4.0K\t./Downloads",
    "8.0K\t./scanner.py",
    "4.0K\t./vuln_check.py",
    "4.0K\t./ids_monitor.py",
    "40K\t.",
  ] };
}

function cmdFree(): CmdResult {
  return { output: [
    "               total        used        free      shared  buff/cache   available",
    "Mem:        32768000     6144000    18432000      256000     8192000    24576000",
    "Swap:        8192000           0     8192000",
  ] };
}

function cmdLsblk(): CmdResult {
  return { output: [
    "NAME   MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS",
    "sda      8:0    0   100G  0 disk",
    "├─sda1   8:1    0   100G  0 part /",
    "├─sda2   8:2    0   200G  0 part /home",
    "└─sda3   8:3    0     8G  0 part [SWAP]",
    "sr0     11:0    1  1024M  0 rom",
  ] };
}

function cmdMount(): CmdResult {
  return { output: [
    "/dev/sda1 on / type ext4 (rw,relatime,errors=remount-ro)",
    "/dev/sda2 on /home type ext4 (rw,relatime)",
    "tmpfs on /run type tmpfs (rw,nosuid,nodev,noexec,relatime,size=1638400k)",
    "proc on /proc type proc (rw,nosuid,nodev,noexec,relatime)",
  ] };
}

function cmdDmesg(): CmdResult {
  return { output: [
    "[    0.000000] Linux version 6.6.9-amd64 (kali@kali-dev)",
    "[    0.000000] Command line: BOOT_IMAGE=/vmlinuz-6.6.9-amd64 root=/dev/sda1",
    "[    0.543210] Intel(R) Core(TM) i9-13900K CPU @ 3.00GHz",
    "[    0.654321] Memory: 32768000k/33554432k available",
    "[    1.234567] eth0: Link is Up - 1Gbps/Full",
    "[    2.345678] EXT4-fs (sda1): mounted filesystem with ordered data mode",
  ] };
}

function cmdJournalctl(args: string[]): CmdResult {
  return { output: [
    `-- Journal begins at Mon 2026-03-09 12:00:00 UTC, ends at ${new Date().toISOString()} --`,
    "Mar 23 16:00:01 kali systemd[1]: Started Daily apt download activities.",
    "Mar 23 16:00:01 kali sshd[234]: Server listening on 0.0.0.0 port 22.",
    "Mar 23 16:05:01 kali kernel: [UFW BLOCK] IN=eth0 SRC=45.33.32.156",
    "Mar 23 16:05:02 kali wazuh-agentd[1234]: Alert: Rule 100201 fired (level 12)",
  ] };
}

function cmdIptables(args: string[]): CmdResult {
  if (args.includes("-L") || args.includes("--list")) {
    return { output: [
      "Chain INPUT (policy ACCEPT)",
      "target     prot opt source               destination",
      "DROP       all  --  45.33.32.156         anywhere",
      "ACCEPT     tcp  --  anywhere             anywhere             tcp dpt:ssh",
      "ACCEPT     tcp  --  anywhere             anywhere             tcp dpt:http",
      "ACCEPT     tcp  --  anywhere             anywhere             tcp dpt:https",
      "",
      "Chain FORWARD (policy DROP)",
      "target     prot opt source               destination",
      "",
      "Chain OUTPUT (policy ACCEPT)",
      "target     prot opt source               destination",
    ] };
  }
  return { output: [] };
}

function cmdUfw(args: string[]): CmdResult {
  if (args[0] === "status") {
    return { output: [
      "Status: active",
      "",
      "To                         Action      From",
      "--                         ------      ----",
      "22/tcp                     ALLOW       Anywhere",
      "80/tcp                     ALLOW       Anywhere",
      "443/tcp                    ALLOW       Anywhere",
      "45.33.32.156               DENY        Anywhere",
    ] };
  }
  return { output: ["Usage: ufw COMMAND", "Commands: enable, disable, status, allow, deny, reject, reset"] };
}

function cmdMsfconsole(): CmdResult {
  return { output: [
    "                                                  ",
    " ██████╗███████╗████████╗ █████╗ ███████╗██████╗ ",
    " ██╔════╝██╔════╝╚══██╔══╝██╔══██╗██╔════╝██╔══██╗",
    " ██║     █████╗     ██║   ███████║███████╗██████╔╝",
    " ██║     ██╔══╝     ██║   ██╔══██║╚════██║██╔═══╝ ",
    " ╚██████╗███████╗   ██║   ██║  ██║███████║██║     ",
    "  ╚═════╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝     ",
    "",
    "       =[ metasploit v6.3.44-dev                          ]",
    "+ -- --=[ 2345 exploits - 1234 auxiliary - 416 post        ]",
    "+ -- --=[ 1234 payloads - 46 encoders - 11 nops           ]",
    "+ -- --=[ 9 evasion                                        ]",
    "",
    "Metasploit Documentation: https://docs.metasploit.com/",
    "",
    "msf6 >",
  ] };
}

function cmdHydra(args: string[]): CmdResult {
  const host = args.find(a => a.includes("://"))?.split("://")[1] || "192.168.1.10";
  return { output: [
    "Hydra v9.5 (c) 2023 by van Hauser/THC & David Maciejak",
    `[DATA] attacking ssh://${host}:22/`,
    "[22][ssh] host: " + host + "   login: admin   password: ********",
    "1 of 1 target successfully completed, 1 valid password found",
  ] };
}

function cmdSqlmap(args: string[]): CmdResult {
  const url = args.find(a => a.startsWith("-u"))?.split(" ")[0] || args[1] || "http://target";
  return { output: [
    "        ___",
    "       __H__",
    " ___ ___[.]_____ ___ ___  {1.7.12#stable}",
    "|_ -| . [']     | .'| . |",
    "|___|_  [.]_|_|_|__,|  _|",
    "      |_|V...       |_|",
    "",
    `[*] starting @ ${new Date().toLocaleTimeString()}`,
    `[*] testing URL: ${url}`,
    "[*] testing connection to the target URL",
    "[14:20:15] [INFO] testing 'AND boolean-based blind'",
    "[14:20:16] [INFO] testing 'MySQL >= 5.0 AND error-based'",
    "[14:20:17] [WARNING] parameter appears to be injectable",
    "[14:20:18] [INFO] target is vulnerable to SQL injection",
  ] };
}

function cmdCal(): CmdResult {
  const now = new Date();
  const month = now.toLocaleString("default", { month: "long" });
  return { output: [
    `     ${month} ${now.getFullYear()}`,
    "Su Mo Tu We Th Fr Sa",
    " 1  2  3  4  5  6  7",
    " 8  9 10 11 12 13 14",
    "15 16 17 18 19 20 21",
    "22 23 24 25 26 27 28",
    "29 30 31",
  ] };
}

function cmdNeofetch(state: TerminalState): CmdResult {
  return { output: [
    "       \x1b[1;34m..............       \x1b[0m   \x1b[1;34mkali\x1b[0m@\x1b[1;34mkali\x1b[0m",
    "       \x1b[1;34m            ..,;:ccc, \x1b[0m   ──────────────",
    "       \x1b[1;34m          ......''';lxO.\x1b[0m  \x1b[1;34mOS\x1b[0m: Kali GNU/Linux Rolling 2026.1 x86_64",
    "       \x1b[1;34m .....''''..googggg;...\x1b[0m  \x1b[1;34mHost\x1b[0m: UCSF Security Workstation",
    "       \x1b[1;34m';gdddo'  .ooddddddddndc\x1b[0m \x1b[1;34mKernel\x1b[0m: 6.6.9-amd64",
    "       \x1b[1;34m    .;dddddddddddddddo\x1b[0m  \x1b[1;34mUptime\x1b[0m: 14 days, 3 hours",
    "       \x1b[1;34m        ndddddddddddo  \x1b[0m  \x1b[1;34mShell\x1b[0m: bash 5.2.21",
    "       \x1b[1;34m       ,ddddddddddddddd;\x1b[0m \x1b[1;34mTerminal\x1b[0m: UCSF SecTerm v2.1",
    "       \x1b[1;34m       oddddddddddddddddo\x1b[0m\x1b[1;34mCPU\x1b[0m: Intel i9-13900K (24) @ 3.000GHz",
    "       \x1b[1;34m      :dddddddddddddddddd;\x1b[0m\x1b[1;34mMemory\x1b[0m: 6144MiB / 32000MiB",
    "       \x1b[1;34m   oddo:;,..ddddddddddddd \x1b[0m\x1b[1;34mDisk (/)\x1b[0m: 31G / 100G (31%)",
    "       \x1b[1;34m .oddddddddddddo:       \x1b[0m  \x1b[1;34mIP\x1b[0m: 192.168.1.100",
  ] };
}
