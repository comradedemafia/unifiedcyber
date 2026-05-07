import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Terminal, X, Minus, Square, Menu, Plus, Search, ChevronDown } from "lucide-react";
import { createFileSystem, FSNode } from "./terminal/kaliFileSystem";
import { executeCommand, TerminalState } from "./terminal/kaliCommands";
import { openEditor, createEditorState, EditorState, EditorType } from "./terminal/editorSimulation";
import TerminalEditor from "./terminal/TerminalEditor";
import MidnightCommander from "./terminal/MidnightCommander";
import TerminalPreferences, { TerminalPrefs, defaultPrefs, themeColors } from "./terminal/TerminalPreferences";
import RealCommandConfirm from "./terminal/RealCommandConfirm";
import TerminalAllowlistManager from "./terminal/TerminalAllowlistManager";
import {
  isAllowedCommand, extractTarget, isPrivateHost,
  isHostAllowedThisSession, addToSessionAllowlist, ALLOWED_REAL_COMMANDS,
} from "@/utils/realCommandPolicy";
import { consumeToken } from "@/utils/terminalRateLimit";
import { logTerminalAudit } from "@/utils/terminalAudit";
import { loadTerminalSession, saveTerminalSession, clearTerminalSession } from "@/utils/terminalPersistence";

interface TerminalTab {
  id: number;
  title: string;
  lines: { text: string; type: "input" | "output" | "system" }[];
  state: TerminalState;
  editorState: EditorState;
  mcActive: boolean;
  historyIndex: number;
}

const createInitialState = (): TerminalState => ({
  cwd: "/home/kali",
  fs: createFileSystem(),
  env: {
    HOME: "/home/kali",
    USER: "kali",
    SHELL: "/bin/bash",
    PATH: "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
    TERM: "xterm-256color",
    LANG: "en_US.UTF-8",
    HOSTNAME: "kali",
    LOGNAME: "kali",
    PWD: "/home/kali",
    EDITOR: "nano",
  },
  history: [],
  user: "kali",
  hostname: "kali",
});

const initialLines = (): { text: string; type: "input" | "output" | "system" }[] => [
  { text: "┌──(kali㉿kali)-[~]", type: "system" },
  { text: "└─$ Kali GNU/Linux Rolling 2026.1 — GNOME Terminal", type: "system" },
  { text: 'Type "help" for available commands', type: "system" },
  { text: "", type: "system" },
];

let tabCounter = (typeof window !== "undefined" ? loadTerminalSession()?.tabs?.reduce((m, t) => Math.max(m, t.id), 1) : 1) ?? 1;

const SecurityTerminal = () => {
  const persisted = typeof window !== "undefined" ? loadTerminalSession() : null;
  const [tabs, setTabs] = useState<TerminalTab[]>(() => {
    if (persisted?.tabs?.length) {
      return persisted.tabs.map((p) => ({
        id: p.id,
        title: p.title,
        lines: p.lines,
        state: { ...createInitialState(), history: p.history ?? [] },
        editorState: createEditorState(),
        mcActive: false,
        historyIndex: -1,
      }));
    }
    return [
      {
        id: 1,
        title: "kali@kali: ~",
        lines: initialLines(),
        state: createInitialState(),
        editorState: createEditorState(),
        mcActive: false,
        historyIndex: -1,
      },
    ];
  });
  const [activeTabId, setActiveTabId] = useState(persisted?.activeTabId ?? 1);
  const [input, setInput] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [prefs, setPrefs] = useState<TerminalPrefs>(defaultPrefs);
  const [clipboard, setClipboard] = useState("");
  const [pendingReal, setPendingReal] = useState<{
    realCmd: string; realArgs: string[]; target?: string; raw: string;
  } | null>(null);
  const [rememberTarget, setRememberTarget] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
  const theme = themeColors[prefs.theme];

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(scrollToBottom, [activeTab?.lines, scrollToBottom]);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  // Global GNOME keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey) {
        switch (e.key) {
          case "T":
            e.preventDefault();
            addTab();
            break;
          case "W":
            e.preventDefault();
            closeTab(activeTabId);
            break;
          case "C":
            e.preventDefault();
            const sel = window.getSelection()?.toString() || "";
            if (sel) {
              navigator.clipboard.writeText(sel).catch(() => setClipboard(sel));
              setClipboard(sel);
            }
            break;
          case "V":
            e.preventDefault();
            navigator.clipboard.readText().then((text) => {
              setInput((prev) => prev + text);
            }).catch(() => {
              if (clipboard) setInput((prev) => prev + clipboard);
            });
            break;
          case "F":
            e.preventDefault();
            setSearchOpen((p) => !p);
            break;
        }
      }
    };
    const container = containerRef.current;
    if (container) {
      container.addEventListener("keydown", handler);
      return () => container.removeEventListener("keydown", handler);
    }
  }, [activeTabId, tabs.length, clipboard]);

  const updateActiveTab = useCallback(
    (updater: (tab: TerminalTab) => Partial<TerminalTab>) => {
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTabId ? { ...t, ...updater(t) } : t))
      );
    },
    [activeTabId]
  );

  const getPrompt = useCallback(
    (st: TerminalState) => {
      const dir = st.cwd === "/home/kali" ? "~" : st.cwd.replace("/home/kali", "~");
      return `┌──(${st.user}㉿${st.hostname})-[${dir}]`;
    },
    []
  );

  const getTabTitle = (st: TerminalState) => {
    const dir = st.cwd === "/home/kali" ? "~" : st.cwd.split("/").pop() || "/";
    return `${st.user}@${st.hostname}: ${dir}`;
  };

  const runRealCommand = useCallback(
    async (realCmd: string, realArgs: string[], rawCmd: string) => {
      // Client-side rate limit (defence-in-depth alongside server limiter)
      const rl = consumeToken();
      if (!rl.ok) {
        const wait = Math.ceil(rl.retryInMs / 1000);
        updateActiveTab((t) => ({
          lines: [...t.lines, { text: `error: rate limit exceeded — retry in ${wait}s`, type: "output" as const }, { text: "", type: "system" as const }],
          state: { ...t.state, history: [...t.state.history, rawCmd] },
        }));
        await logTerminalAudit({
          event_type: "rate_limit", command: realCmd, target: extractTarget(realCmd as any, realArgs),
          result: "blocked", severity: "warning", details: { retry_in_ms: rl.retryInMs },
        });
        return;
      }

      const target = extractTarget(realCmd as any, realArgs);
      updateActiveTab((t) => ({
        lines: [...t.lines, { text: `[*] executing real '${realCmd}' via edge function...`, type: "output" as const }],
      }));
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data, error } = await supabase.functions.invoke("terminal-exec", {
          body: { command: realCmd, args: realArgs },
        });

        // The edge function returns { output: ["error: ..."] } with status 4xx
        // for validation/rate-limit failures. supabase-js surfaces non-2xx as
        // `error` while still parsing the JSON body into `data`.
        const rawLines: string[] = (data?.output as string[] | undefined)
          ?? (error ? [`error: ${error.message}`] : ["(no output)"]);
        const isFailure = !!error || rawLines.some((l) => /^error:/i.test(l));
        const failureMsg = isFailure
          ? rawLines.find((l) => /^error:/i.test(l))?.replace(/^error:\s*/i, "") ?? error?.message
          : undefined;

        const display = isFailure && failureMsg
          ? [
              `✗ command rejected: ${failureMsg}`,
              `  hint: only safe read-only verbs and public hosts are allowed.`,
              `  example: rcurl -I https://example.com`,
            ]
          : rawLines;

        updateActiveTab((t) => ({
          lines: [...t.lines, ...display.map((text) => ({ text, type: "output" as const })), { text: "", type: "system" as const }],
          state: { ...t.state, history: [...t.state.history, rawCmd] },
        }));

        if (isFailure) toast.error(`Command blocked: ${failureMsg}`);

        await logTerminalAudit({
          event_type: isFailure ? "command_blocked" : "real_command",
          command: `${realCmd} ${realArgs.join(" ")}`.trim(),
          target,
          result: isFailure ? "blocked" : "success",
          severity: isFailure ? "warning" : "info",
          details: {
            args: realArgs,
            lines: rawLines.length,
            error: failureMsg,
          },
        });
      } catch (err) {
        updateActiveTab((t) => ({
          lines: [...t.lines, { text: `error: ${(err as Error).message}`, type: "output" as const }, { text: "", type: "system" as const }],
          state: { ...t.state, history: [...t.state.history, rawCmd] },
        }));
        await logTerminalAudit({
          event_type: "real_command", command: `${realCmd} ${realArgs.join(" ")}`.trim(),
          target, result: "error", severity: "warning",
          details: { args: realArgs, error: (err as Error).message },
        });
      }
    },
    [updateActiveTab]
  );

  const processCommand = useCallback(
    async (cmd: string) => {
      const tab = tabs.find((t) => t.id === activeTabId);
      if (!tab) return;

      // --- Real network commands routed through edge function ---
      const tokens = cmd.trim().split(/\s+/);
      const head = tokens[0];
      const realAliases: Record<string, string> = {
        rcurl: "curl", rwget: "wget", rdig: "dig", rwhois: "whois",
        rping: "ping", rnslookup: "nslookup", ipinfo: "ipinfo", myip: "myip",
      };
      if (head in realAliases) {
        const realCmd = realAliases[head];
        const realArgs = tokens.slice(1);

        // Allowlist check (defence-in-depth — also enforced server-side)
        if (!isAllowedCommand(realCmd)) {
          updateActiveTab((t) => ({
            lines: [...t.lines, { text: `error: '${realCmd}' is not in the allowed real-command list (${ALLOWED_REAL_COMMANDS.join(", ")})`, type: "output" as const }, { text: "", type: "system" as const }],
            state: { ...t.state, history: [...t.state.history, cmd] },
          }));
          return;
        }

        const target = extractTarget(realCmd, realArgs);
        if (isPrivateHost(target)) {
          updateActiveTab((t) => ({
            lines: [...t.lines, { text: `error: target '${target}' is on a private/internal range — refusing for safety`, type: "output" as const }, { text: "", type: "system" as const }],
            state: { ...t.state, history: [...t.state.history, cmd] },
          }));
          return;
        }

        // If host already trusted this session, skip prompt; otherwise show modal.
        if (target && !isHostAllowedThisSession(target)) {
          setPendingReal({ realCmd, realArgs, target, raw: cmd });
          return;
        }
        if (!target) {
          // Commands like `myip` with no target — still confirm once.
          setPendingReal({ realCmd, realArgs, raw: cmd });
          return;
        }

        await runRealCommand(realCmd, realArgs, cmd);
        return;
      }

      const result = executeCommand(cmd, tab.state);

      if (result.output.length === 1 && result.output[0].startsWith("__EDITOR__:")) {
        const parts = result.output[0].split(":");
        const editorType = parts[1] as EditorType;
        const editorArgs = parts.slice(2).join(":").split(" ").filter(Boolean);
        const newEditor = openEditor(editorType, editorArgs, tab.state);
        if (newEditor) {
          updateActiveTab((t) => ({
            editorState: newEditor,
            state: { ...t.state, history: [...t.state.history, cmd] },
          }));
          return;
        }
        updateActiveTab((t) => ({
          lines: [
            ...t.lines,
            { text: `${editorType}: "${editorArgs[0]}": Is a directory`, type: "output" as const },
            { text: "", type: "system" as const },
          ],
          state: { ...t.state, history: [...t.state.history, cmd] },
        }));
        return;
      }

      if (result.output.length === 1 && result.output[0] === "__MC__") {
        updateActiveTab((t) => ({
          mcActive: true,
          state: { ...t.state, history: [...t.state.history, cmd] },
        }));
        return;
      }

      if (result.output.length === 1 && result.output[0] === "__CLEAR__") {
        updateActiveTab((t) => ({
          lines: [],
          state: { ...t.state, history: [...t.state.history, cmd], ...result.newState },
        }));
        return;
      }

      updateActiveTab((t) => {
        const newState = {
          ...t.state,
          history: [...t.state.history, cmd],
          env: { ...t.state.env, PWD: result.newState?.cwd || t.state.cwd },
          ...result.newState,
        };
        return {
          lines: [
            ...t.lines,
            ...result.output.map((text) => ({ text, type: "output" as const })),
            { text: "", type: "system" as const },
          ],
          state: newState,
          title: getTabTitle(newState),
        };
      });
    },
    [tabs, activeTabId, updateActiveTab]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) {
      updateActiveTab((t) => ({
        lines: [
          ...t.lines,
          { text: getPrompt(t.state), type: "system" as const },
          { text: `└─$ `, type: "input" as const },
        ],
      }));
      return;
    }
    const cmd = input.trim();
    setInput("");
    updateActiveTab((t) => ({
      lines: [
        ...t.lines,
        { text: getPrompt(t.state), type: "system" as const },
        { text: `└─$ ${cmd}`, type: "input" as const },
      ],
      historyIndex: -1,
    }));
    processCommand(cmd);
  };

  const handleEditorClose = useCallback(
    (message: string, newFs?: Record<string, FSNode>) => {
      updateActiveTab((t) => ({
        editorState: createEditorState(),
        ...(newFs ? { state: { ...t.state, fs: newFs } } : {}),
        ...(message
          ? {
              lines: [
                ...t.lines,
                { text: message, type: "output" as const },
                { text: "", type: "system" as const },
              ],
            }
          : {}),
      }));
      setTimeout(() => inputRef.current?.focus(), 50);
    },
    [updateActiveTab]
  );

  const handleMcClose = useCallback(
    (newCwd?: string) => {
      updateActiveTab((t) => ({
        mcActive: false,
        ...(newCwd
          ? { state: { ...t.state, cwd: newCwd, env: { ...t.state.env, PWD: newCwd } } }
          : {}),
      }));
      setTimeout(() => inputRef.current?.focus(), 50);
    },
    [updateActiveTab]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (activeTab.state.history.length === 0) return;
      const newIdx =
        activeTab.historyIndex < 0
          ? activeTab.state.history.length - 1
          : Math.max(0, activeTab.historyIndex - 1);
      updateActiveTab(() => ({ historyIndex: newIdx }));
      setInput(activeTab.state.history[newIdx]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (activeTab.historyIndex < 0) return;
      const newIdx = activeTab.historyIndex + 1;
      if (newIdx >= activeTab.state.history.length) {
        updateActiveTab(() => ({ historyIndex: -1 }));
        setInput("");
      } else {
        updateActiveTab(() => ({ historyIndex: newIdx }));
        setInput(activeTab.state.history[newIdx]);
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const partial = input.trim();
      if (!partial) return;
      const cmds = [
        "ls", "cd", "pwd", "cat", "echo", "whoami", "uname", "ifconfig", "ping",
        "nmap", "python3", "help", "clear", "history", "grep", "find", "mkdir",
        "touch", "rm", "head", "tail", "neofetch", "msfconsole", "hydra", "sqlmap",
        "iptables", "systemctl", "ps", "top", "df", "free", "netstat", "curl",
        "wget", "apt", "git", "vim", "nano", "vi", "mc",
      ];
      const matches = cmds.filter((c) => c.startsWith(partial));
      if (matches.length === 1) setInput(matches[0] + " ");
      else if (matches.length > 1) {
        updateActiveTab((t) => ({
          lines: [...t.lines, { text: matches.join("  "), type: "output" as const }],
        }));
      }
    }
  };

  const addTab = () => {
    tabCounter++;
    const newTab: TerminalTab = {
      id: tabCounter,
      title: "kali@kali: ~",
      lines: initialLines(),
      state: createInitialState(),
      editorState: createEditorState(),
      mcActive: false,
      historyIndex: -1,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(tabCounter);
    setInput("");
  };

  const closeTab = (id: number) => {
    if (tabs.length <= 1) return;
    const newTabs = tabs.filter((t) => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    }
    setInput("");
  };

  const getLineColor = (line: { text: string; type: string }) => {
    const t = line.text;
    if (line.type === "input") return "text-[#d3d7cf]";
    if (t.startsWith("┌──(") || t.startsWith("└─$")) return "text-[#48b9c7]";
    if (line.type === "system") return "text-[#888a85]";
    if (t.includes("\x1b[1;34m")) return "text-[#729fcf]";
    if (t.includes("\x1b[1;32m")) return "text-[#8ae234]";
    if (t.startsWith("[!]") || t.includes("CRITICAL") || t.includes("⚠️") || t.includes("DENY") || t.includes("DROP"))
      return "text-[#ef2929]";
    if (t.startsWith("[✓]") || t.includes("[+]") || t.includes("ALLOW") || t.includes("ACCEPT"))
      return "text-[#8ae234]";
    if (t.startsWith("[*]")) return "text-[#729fcf]";
    if (t.includes("HIGH") || t.includes("WARNING")) return "text-[#fce94f]";
    if (t.includes("VULN-")) return "text-[#fcaf3e]";
    if (t.startsWith("    └──") || t.startsWith("    ├──")) return "text-[#888a85]";
    return "text-[#d3d7cf]";
  };

  const stripAnsi = (text: string) => text.replace(/\x1b\[[0-9;]*m/g, "");

  return (
    <section id="terminal" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/20 to-transparent" />
      <div className="container mx-auto px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
            <span className="font-mono text-[10px] tracking-[0.3em] text-primary/60 uppercase">
              Kali Linux 2026.1
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground text-center mb-4 tracking-tight">
            Security <span className="text-primary text-glow">Terminal</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-center">
            GNOME Terminal — Kali Linux 2026.1. Fully interactive with tabs, vim/nano editors, and 150+ commands.
          </p>
        </motion.div>

        <div
          ref={containerRef}
          tabIndex={-1}
          className="outline-none"
        >
        {prefsOpen && (
          <TerminalPreferences prefs={prefs} onSave={setPrefs} onClose={() => setPrefsOpen(false)} />
        )}
        <div className="max-w-4xl mx-auto mb-4">
          <TerminalAllowlistManager />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto rounded-xl overflow-hidden shadow-2xl border border-[#1a1a2e]/60"
          onClick={() =>
            !activeTab.editorState.active && !activeTab.mcActive && inputRef.current?.focus()
          }
        >
          {/* GNOME Header Bar */}
          <div className="flex items-center bg-[#2d2d2d] h-[38px] select-none">
            {/* Left: Hamburger menu */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
                className="h-[38px] px-3 hover:bg-[#3d3d3d] transition-colors flex items-center"
              >
                <Menu className="w-4 h-4 text-[#ccc]" />
              </button>
              {menuOpen && (
                <div className="absolute top-[38px] left-0 bg-[#3d3d3d] border border-[#555] rounded-b-md shadow-xl z-50 min-w-[200px] py-1">
                  {[
                    { label: "New Tab", shortcut: "Ctrl+Shift+T", action: addTab },
                    { label: "New Window", shortcut: "Ctrl+Shift+N", action: () => {} },
                    null,
                    {
                      label: "Find…",
                      shortcut: "Ctrl+Shift+F",
                      action: () => {
                        setSearchOpen(true);
                        setMenuOpen(false);
                      },
                    },
                    null,
                    { label: "Read-Only", shortcut: "", action: () => {} },
                    null,
                    { label: "Preferences", shortcut: "", action: () => setPrefsOpen(true) },
                    { label: "Help", shortcut: "", action: () => {} },
                    { label: "About", shortcut: "", action: () => {} },
                  ].map((item, i) =>
                    item === null ? (
                      <div key={i} className="h-px bg-[#555] my-1" />
                    ) : (
                      <button
                        key={i}
                        onClick={(e) => {
                          e.stopPropagation();
                          item.action();
                          setMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-1.5 text-[13px] text-[#ddd] hover:bg-[#505050] flex justify-between items-center"
                      >
                        <span>{item.label}</span>
                        {item.shortcut && (
                          <span className="text-[11px] text-[#999] ml-6">{item.shortcut}</span>
                        )}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex-1 flex items-end h-full overflow-x-auto">
              {tabs.map((tab) => (
                <div
                  key={tab.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTabId(tab.id);
                    setInput("");
                  }}
                  className={`group relative flex items-center gap-2 h-full px-4 cursor-pointer text-[12px] font-sans min-w-[120px] max-w-[200px] transition-colors ${
                    tab.id === activeTabId
                      ? "bg-[#1a1b26] text-[#fff]"
                      : "bg-[#2d2d2d] text-[#999] hover:bg-[#383838] hover:text-[#bbb]"
                  }`}
                >
                  <Terminal className="w-3 h-3 shrink-0 opacity-60" />
                  <span className="truncate">{tab.title}</span>
                  {tabs.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTab(tab.id);
                      }}
                      className="ml-auto opacity-0 group-hover:opacity-100 hover:bg-[#555] rounded p-0.5 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}

              {/* New tab button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addTab();
                }}
                className="h-full px-3 hover:bg-[#383838] transition-colors flex items-center"
              >
                <Plus className="w-3.5 h-3.5 text-[#999]" />
              </button>
            </div>

            {/* Right: Search + Window controls */}
            <div className="flex items-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchOpen(!searchOpen);
                }}
                className="h-[38px] px-3 hover:bg-[#3d3d3d] transition-colors flex items-center"
              >
                <Search className="w-3.5 h-3.5 text-[#999]" />
              </button>
              <div className="w-px h-4 bg-[#444]" />
              <button className="h-[38px] px-3 hover:bg-[#3d3d3d] transition-colors flex items-center">
                <Minus className="w-3.5 h-3.5 text-[#999]" />
              </button>
              <button className="h-[38px] px-3 hover:bg-[#3d3d3d] transition-colors flex items-center">
                <Square className="w-3 h-3 text-[#999]" />
              </button>
              <button className="h-[38px] px-3 hover:bg-[#c03030] transition-colors flex items-center rounded-tr-xl">
                <X className="w-3.5 h-3.5 text-[#999]" />
              </button>
            </div>
          </div>

          {/* Search bar (GNOME-style) */}
          {searchOpen && (
            <div className="flex items-center gap-2 bg-[#2d2d2d] px-3 py-2 border-b border-[#444]">
              <Search className="w-3.5 h-3.5 text-[#999]" />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search…"
                className="flex-1 bg-[#1a1b26] text-[#d3d7cf] text-[13px] px-3 py-1.5 rounded outline-none border border-[#444] focus:border-[#48b9c7] font-mono"
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setSearchOpen(false);
                    setSearchQuery("");
                  }
                }}
              />
              <span className="text-[11px] text-[#888]">
                {searchQuery
                  ? `${activeTab.lines.filter((l) => l.text.toLowerCase().includes(searchQuery.toLowerCase())).length} matches`
                  : ""}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchOpen(false);
                  setSearchQuery("");
                }}
                className="p-1 hover:bg-[#444] rounded transition-colors"
              >
                <X className="w-3 h-3 text-[#999]" />
              </button>
            </div>
          )}

          {/* Terminal body */}
          <div
            ref={scrollRef}
            className="h-[480px] overflow-y-auto p-4 font-mono leading-[1.4]"
            style={{
              fontFamily: prefs.fontFamily,
              fontSize: prefs.fontSize,
              backgroundColor: theme.bg,
              color: theme.fg,
            }}
          >
            {activeTab.mcActive ? (
              <MidnightCommander termState={activeTab.state} onClose={handleMcClose} />
            ) : activeTab.editorState.active ? (
              <TerminalEditor
                editor={activeTab.editorState}
                termState={activeTab.state}
                onClose={handleEditorClose}
              />
            ) : (
              <>
                {activeTab.lines.map((line, i) => {
                  const isHighlighted =
                    searchQuery &&
                    line.text.toLowerCase().includes(searchQuery.toLowerCase());
                  return (
                    <div
                      key={i}
                      className={`${getLineColor(line)} whitespace-pre-wrap ${
                        isHighlighted ? "bg-[#48b9c7]/20 rounded" : ""
                      }`}
                    >
                      {stripAnsi(line.text) || "\u00A0"}
                    </div>
                  );
                })}
                <div style={{ color: theme.prompt }}>{getPrompt(activeTab.state)}</div>
                <form onSubmit={handleSubmit} className="flex items-center gap-1">
                  <span style={{ color: theme.prompt }}>└─$</span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent outline-none font-mono placeholder:text-[#555] ml-1"
                    style={{ color: theme.fg, fontSize: prefs.fontSize, fontFamily: prefs.fontFamily, caretColor: theme.fg }}
                    placeholder=""
                    autoComplete="off"
                    spellCheck={false}
                  />
                </form>
              </>
            )}
          </div>

          {/* Quick commands bar */}
          {!activeTab.editorState.active && !activeTab.mcActive && (
            <div className="px-4 py-2.5 border-t border-[#333] bg-[#252530] flex flex-wrap gap-2 items-center">
              <span className="text-[10px] text-[#666] font-mono mr-2">Quick:</span>
              {[
                { label: "neofetch", cmd: "neofetch" },
                { label: "nmap scan", cmd: "nmap -sV 192.168.1.0/24" },
                { label: "vim", cmd: "vim /etc/os-release" },
                { label: "nano", cmd: "nano /home/kali/.bashrc" },
                { label: "mc", cmd: "mc" },
                { label: "port scan", cmd: "python3 port_scanner.py --target 192.168.1.0/24" },
                { label: "help", cmd: "help" },
              ].map((q) => (
                <button
                  key={q.label}
                  onClick={(e) => {
                    e.stopPropagation();
                    updateActiveTab((t) => ({
                      lines: [
                        ...t.lines,
                        { text: getPrompt(t.state), type: "system" as const },
                        { text: `└─$ ${q.cmd}`, type: "input" as const },
                      ],
                    }));
                    processCommand(q.cmd);
                    setInput("");
                  }}
                  className="text-[11px] font-mono px-3 py-1 rounded bg-[#333] text-[#48b9c7] border border-[#444] hover:bg-[#444] hover:text-[#5dd5e3] transition-all"
                >
                  {q.label}
                </button>
              ))}
            </div>
          )}

          {/* GNOME-style bottom info bar */}
          <div className="flex items-center justify-between px-4 py-1 bg-[#2d2d2d] border-t border-[#333] text-[10px] text-[#777] font-mono">
            <span>
              {activeTab.mcActive
                ? "mc — GNU Midnight Commander 4.8.31"
                : activeTab.editorState.active
                ? `${activeTab.editorState.type === "vim" ? "VIM 9.1" : "GNU nano 7.2"} — ${activeTab.editorState.fileName}`
                : `bash — ${activeTab.state.history.length} commands`}
            </span>
            <div className="flex items-center gap-3">
              <span>{tabs.length} tab{tabs.length > 1 ? "s" : ""}</span>
              <span>Kali 2026.1</span>
              <span>GNOME Terminal 3.54</span>
            </div>
          </div>
        </motion.div>
        </div>
      </div>

      <RealCommandConfirm
        open={!!pendingReal}
        command={pendingReal?.realCmd ?? ""}
        args={pendingReal?.realArgs ?? []}
        target={pendingReal?.target}
        rememberTarget={rememberTarget}
        onToggleRemember={setRememberTarget}
        onCancel={() => {
          if (pendingReal) {
            updateActiveTab((t) => ({
              lines: [...t.lines, { text: "[!] cancelled by user", type: "output" as const }, { text: "", type: "system" as const }],
              state: { ...t.state, history: [...t.state.history, pendingReal.raw] },
            }));
          }
          setPendingReal(null);
        }}
        onConfirm={async () => {
          if (!pendingReal) return;
          if (rememberTarget && pendingReal.target) addToSessionAllowlist(pendingReal.target);
          const p = pendingReal;
          setPendingReal(null);
          await runRealCommand(p.realCmd, p.realArgs, p.raw);
        }}
      />
    </section>
  );
};

export default SecurityTerminal;
