import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Terminal } from "lucide-react";
import { createFileSystem, FSNode } from "./terminal/kaliFileSystem";
import { executeCommand, TerminalState } from "./terminal/kaliCommands";
import { openEditor, createEditorState, EditorState, EditorType } from "./terminal/editorSimulation";
import TerminalEditor from "./terminal/TerminalEditor";
import MidnightCommander from "./terminal/MidnightCommander";

const SecurityTerminal = () => {
  const [state, setState] = useState<TerminalState>(() => ({
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
  }));

  const [lines, setLines] = useState<{ text: string; type: "input" | "output" | "system" }[]>([
    { text: "┌──(kali㉿kali)-[~]", type: "system" },
    { text: "└─$ Kali GNU/Linux Rolling 2026.1 — UCSF Security Terminal", type: "system" },
    { text: 'Type "help" for available commands', type: "system" },
    { text: "", type: "system" },
  ]);
  const [input, setInput] = useState("");
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [editorState, setEditorState] = useState<EditorState>(createEditorState());
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(scrollToBottom, [lines, scrollToBottom]);

  const getPrompt = useCallback(() => {
    const dir = state.cwd === "/home/kali" ? "~" : state.cwd.replace("/home/kali", "~");
    return `┌──(${state.user}㉿${state.hostname})-[${dir}]`;
  }, [state.cwd, state.user, state.hostname]);

  const processCommand = useCallback((cmd: string) => {
    const result = executeCommand(cmd, state);

    // Check for editor signal
    if (result.output.length === 1 && result.output[0].startsWith("__EDITOR__:")) {
      const parts = result.output[0].split(":");
      const editorType = parts[1] as EditorType;
      const editorArgs = parts.slice(2).join(":").split(" ").filter(Boolean);
      const newEditor = openEditor(editorType, editorArgs, state);
      if (newEditor) {
        setEditorState(newEditor);
        setState(prev => ({ ...prev, history: [...prev.history, cmd] }));
        return;
      }
      // If null, it's a directory error
      setLines(prev => [
        ...prev,
        { text: `${editorType}: "${editorArgs[0]}": Is a directory`, type: "output" },
        { text: "", type: "system" },
      ]);
      setState(prev => ({ ...prev, history: [...prev.history, cmd] }));
      return;
    }

    // Handle clear
    if (result.output.length === 1 && result.output[0] === "__CLEAR__") {
      setLines([]);
      setState(prev => ({ ...prev, history: [...prev.history, cmd], ...result.newState }));
      return;
    }

    // Add output
    setLines(prev => [
      ...prev,
      ...result.output.map(text => ({ text, type: "output" as const })),
      { text: "", type: "system" as const },
    ]);

    setState(prev => ({
      ...prev,
      history: [...prev.history, cmd],
      env: { ...prev.env, PWD: result.newState?.cwd || prev.cwd },
      ...result.newState,
    }));
  }, [state]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) {
      setLines(prev => [...prev, { text: getPrompt(), type: "system" }, { text: `└─$ `, type: "input" }]);
      return;
    }

    const cmd = input.trim();
    setInput("");
    setHistoryIndex(-1);

    setLines(prev => [
      ...prev,
      { text: getPrompt(), type: "system" },
      { text: `└─$ ${cmd}`, type: "input" },
    ]);

    processCommand(cmd);
  };

  const handleEditorClose = useCallback((message: string, newFs?: Record<string, FSNode>) => {
    setEditorState(createEditorState());
    if (newFs) {
      setState(prev => ({ ...prev, fs: newFs }));
    }
    if (message) {
      setLines(prev => [...prev, { text: message, type: "output" }, { text: "", type: "system" }]);
    }
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (state.history.length === 0) return;
      const newIdx = historyIndex < 0 ? state.history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(newIdx);
      setInput(state.history[newIdx]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex < 0) return;
      const newIdx = historyIndex + 1;
      if (newIdx >= state.history.length) {
        setHistoryIndex(-1);
        setInput("");
      } else {
        setHistoryIndex(newIdx);
        setInput(state.history[newIdx]);
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const partial = input.trim();
      if (!partial) return;
      const cmds = ["ls", "cd", "pwd", "cat", "echo", "whoami", "uname", "ifconfig", "ping", "nmap", "python3", "help", "clear", "history", "grep", "find", "mkdir", "touch", "rm", "head", "tail", "neofetch", "msfconsole", "hydra", "sqlmap", "iptables", "systemctl", "ps", "top", "df", "free", "netstat", "curl", "wget", "apt", "git", "vim", "nano", "vi"];
      const matches = cmds.filter(c => c.startsWith(partial));
      if (matches.length === 1) setInput(matches[0] + " ");
      else if (matches.length > 1) {
        setLines(prev => [...prev, { text: matches.join("  "), type: "output" }]);
      }
    }
  };

  const getLineColor = (line: { text: string; type: string }) => {
    const t = line.text;
    if (line.type === "input") return "text-foreground";
    if (t.startsWith("┌──(") || t.startsWith("└─$")) return "text-primary";
    if (line.type === "system") return "text-muted-foreground/60";
    if (t.includes("\x1b[1;34m")) return "text-primary";
    if (t.includes("\x1b[1;32m")) return "text-success";
    if (t.startsWith("[!]") || t.includes("CRITICAL") || t.includes("⚠️") || t.includes("DENY") || t.includes("DROP")) return "text-destructive";
    if (t.startsWith("[✓]") || t.includes("[+]") || t.includes("ALLOW") || t.includes("ACCEPT")) return "text-success";
    if (t.startsWith("[*]")) return "text-primary/80";
    if (t.includes("HIGH") || t.includes("WARNING")) return "text-warning";
    if (t.includes("VULN-")) return "text-warning";
    if (t.startsWith("    └──") || t.startsWith("    ├──")) return "text-muted-foreground/80";
    return "text-foreground/70";
  };

  const stripAnsi = (text: string) => text.replace(/\x1b\[[0-9;]*m/g, "");

  return (
    <section id="terminal" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/20 to-transparent" />
      <div className="container mx-auto px-6 relative">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
            <span className="font-mono text-[10px] tracking-[0.3em] text-primary/60 uppercase">Kali Linux 2026.1</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground text-center mb-4 tracking-tight">
            Security <span className="text-primary text-glow">Terminal</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-center">
            Fully interactive Kali Linux terminal with vim/nano editors. Run real commands — ls, cat, nmap, vim, nano, and more.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto rounded-xl border border-border/60 bg-background overflow-hidden shadow-2xl"
          onClick={() => !editorState.active && inputRef.current?.focus()}
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
                {editorState.active
                  ? `${editorState.type === "vim" ? "vim" : "nano"} — ${editorState.fileName}`
                  : `kali@kali: ${state.cwd === "/home/kali" ? "~" : state.cwd}`
                }
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] text-muted-foreground/50">
                {editorState.active ? (editorState.type === "vim" ? "VIM 9.1" : "GNU nano 7.2") : "Kali 2026.1 | bash 5.2"}
              </span>
              <Terminal className="w-3.5 h-3.5 text-muted-foreground/40" />
            </div>
          </div>

          {/* Terminal body or Editor */}
          <div ref={scrollRef} className="h-[480px] overflow-y-auto p-4 font-mono text-xs leading-relaxed bg-[hsl(var(--background))]">
            {editorState.active ? (
              <TerminalEditor
                editor={editorState}
                termState={state}
                onClose={handleEditorClose}
              />
            ) : (
              <>
                {lines.map((line, i) => (
                  <div key={i} className={`${getLineColor(line)} whitespace-pre-wrap`}>
                    {stripAnsi(line.text) || "\u00A0"}
                  </div>
                ))}
                <div className="text-primary text-xs">{getPrompt()}</div>
                <form onSubmit={handleSubmit} className="flex items-center gap-1">
                  <span className="text-primary text-xs">└─$</span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent text-foreground outline-none font-mono text-xs placeholder:text-muted-foreground/30 ml-1"
                    placeholder=""
                    autoComplete="off"
                    spellCheck={false}
                  />
                </form>
              </>
            )}
          </div>

          {/* Quick commands */}
          {!editorState.active && (
            <div className="px-4 py-3 border-t border-border/30 bg-card/50 flex flex-wrap gap-2">
              <span className="text-[9px] text-muted-foreground/40 font-mono mr-2 self-center">Quick:</span>
              {[
                { label: "neofetch", cmd: "neofetch" },
                { label: "nmap scan", cmd: "nmap -sV 192.168.1.0/24" },
                { label: "vim demo", cmd: "vim /etc/os-release" },
                { label: "nano demo", cmd: "nano /home/kali/.bashrc" },
                { label: "port scanner", cmd: "python3 port_scanner.py --target 192.168.1.0/24" },
                { label: "wifi audit", cmd: "python3 wifi_cracker.py" },
                { label: "help", cmd: "help" },
              ].map((q) => (
                <button
                  key={q.label}
                  onClick={() => {
                    setLines(prev => [
                      ...prev,
                      { text: getPrompt(), type: "system" },
                      { text: `└─$ ${q.cmd}`, type: "input" },
                    ]);
                    processCommand(q.cmd);
                    setInput("");
                  }}
                  className="text-[10px] font-mono px-3 py-1.5 rounded-lg bg-primary/8 text-primary border border-primary/15 hover:bg-primary/15 transition-all"
                >
                  {q.label}
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default SecurityTerminal;
