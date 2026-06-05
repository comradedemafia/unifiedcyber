// Vim and Nano editor simulation for the Kali Linux terminal
import { FSNode, resolvePath, getNode, getParentAndName, saveFileToSupabase } from "./kaliFileSystem";
import { TerminalState } from "./kaliCommands";
import { supabase } from "@/integrations/supabase/client";

export type EditorType = "vim" | "nano";
export type VimMode = "normal" | "insert" | "command" | "visual";

export interface EditorState {
  active: boolean;
  type: EditorType;
  filePath: string;
  fileName: string;
  lines: string[];
  cursorRow: number;
  cursorCol: number;
  vimMode: VimMode;
  vimCommandBuffer: string;
  modified: boolean;
  message: string;
  readOnly: boolean;
  isNewFile: boolean;
}

export const createEditorState = (): EditorState => ({
  active: false,
  type: "nano",
  filePath: "",
  fileName: "",
  lines: [""],
  cursorRow: 0,
  cursorCol: 0,
  vimMode: "normal",
  vimCommandBuffer: "",
  modified: false,
  message: "",
  readOnly: false,
  isNewFile: false,
});

export const openEditor = async (
  type: EditorType,
  args: string[],
  termState: TerminalState
): Promise<EditorState | null> => {
  const fileName = args.find(a => !a.startsWith("-") && !a.startsWith("+"));
  if (!fileName) {
    // Open empty buffer
    return {
      active: true,
      type,
      filePath: "",
      fileName: "[No Name]",
      lines: [""],
      cursorRow: 0,
      cursorCol: 0,
      vimMode: type === "vim" ? "normal" : "insert",
      vimCommandBuffer: "",
      modified: false,
      message: type === "vim" ? '"[No Name]" [New File]' : "New Buffer",
      readOnly: args.includes("-R") || args.includes("-v"),
      isNewFile: true,
    };
  }

  const path = resolvePath(termState.cwd, fileName);
  const node = getNode(termState.fs, path);

  if (node && node.type === "dir") {
    return null; // Can't edit directories
  }

  let content = node?.type === "file" ? (node.content || "") : "";
  let isNew = !node;

  // If file not present in in-memory fs, try to load from Supabase 'terminal_files'
  if (!content) {
    try {
      const { data, error } = await supabase.from("terminal_files").select("content").eq("path", path).maybeSingle();
      if (!error && data && (data as any).content) {
        content = (data as any).content || "";
        isNew = false;
      }
    } catch (e) {
      console.debug("openEditor: failed to load from supabase", e);
    }
  }

  const fileLines = content ? content.split("\n") : [""];

  return {
    active: true,
    type,
    filePath: path,
    fileName,
    lines: fileLines,
    cursorRow: 0,
    cursorCol: 0,
    vimMode: type === "vim" ? "normal" : "insert",
    vimCommandBuffer: "",
    modified: false,
    message: type === "vim"
      ? `"${fileName}" ${isNew ? "[New File]" : `${fileLines.length}L, ${content.length}C`}`
      : (isNew ? "New Buffer" : `Read ${fileLines.length} lines`),
    readOnly: args.includes("-R") || args.includes("-v"),
    isNewFile: isNew,
  };
};

export const saveEditorFile = (
  editor: EditorState,
  termState: TerminalState
): { newFs: Record<string, FSNode>; message: string } => {
  const content = editor.lines.join("\n");
  const path = editor.filePath || resolvePath(termState.cwd, editor.fileName);
  const newFs = { ...termState.fs };
  
  const { parent, name } = getParentAndName(newFs, path);
  if (parent?.type === "dir" && parent.children) {
    parent.children[name] = {
      type: "file",
      content,
      size: content.length,
      permissions: "-rw-r--r--",
      owner: termState.user,
      modified: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit" }) + " " + new Date().toLocaleTimeString().slice(0, 5),
    };
  }

  // Persist file content to Supabase for the terminal workspace (best-effort)
  (async () => {
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      await supabase.from("terminal_files").upsert({ path, content, owner: termState.user, updated_at: new Date().toISOString() });
      try {
        const { parent: p, name: n } = getParentAndName(newFs, path);
        if (p && p.type === "dir" && p.children && p.children[n]) {
          await saveFileToSupabase(path, p.children[n]);
        }
      } catch (e) {
        console.debug("saveFileToSupabase from editor failed", e);
      }
    } catch (e) {
      // ignore persistence errors — UI should not break
      console.debug("terminal file persist failed", e);
    }
  })();

  return {
    newFs,
    message: `"${editor.fileName}" ${editor.lines.length}L, ${content.length}C written`,
  };
};

// Handle vim key in normal mode
export const handleVimNormalKey = (
  key: string,
  editor: EditorState
): EditorState => {
  const e = { ...editor, lines: [...editor.lines] };

  switch (key) {
    case "i":
      return { ...e, vimMode: "insert", message: "-- INSERT --" };
    case "a":
      return { ...e, vimMode: "insert", cursorCol: Math.min(e.cursorCol + 1, e.lines[e.cursorRow].length), message: "-- INSERT --" };
    case "A":
      return { ...e, vimMode: "insert", cursorCol: e.lines[e.cursorRow].length, message: "-- INSERT --" };
    case "I":
      return { ...e, vimMode: "insert", cursorCol: 0, message: "-- INSERT --" };
    case "o":
      e.lines.splice(e.cursorRow + 1, 0, "");
      return { ...e, vimMode: "insert", cursorRow: e.cursorRow + 1, cursorCol: 0, modified: true, message: "-- INSERT --" };
    case "O":
      e.lines.splice(e.cursorRow, 0, "");
      return { ...e, vimMode: "insert", cursorCol: 0, modified: true, message: "-- INSERT --" };
    case "h":
    case "ArrowLeft":
      return { ...e, cursorCol: Math.max(0, e.cursorCol - 1) };
    case "j":
    case "ArrowDown":
      if (e.cursorRow < e.lines.length - 1) {
        const newRow = e.cursorRow + 1;
        return { ...e, cursorRow: newRow, cursorCol: Math.min(e.cursorCol, e.lines[newRow].length - 1) };
      }
      return e;
    case "k":
    case "ArrowUp":
      if (e.cursorRow > 0) {
        const newRow = e.cursorRow - 1;
        return { ...e, cursorRow: newRow, cursorCol: Math.min(e.cursorCol, e.lines[newRow].length - 1) };
      }
      return e;
    case "l":
    case "ArrowRight":
      return { ...e, cursorCol: Math.min(e.cursorCol + 1, Math.max(0, e.lines[e.cursorRow].length - 1)) };
    case "0":
    case "Home":
      return { ...e, cursorCol: 0 };
    case "$":
    case "End":
      return { ...e, cursorCol: Math.max(0, e.lines[e.cursorRow].length - 1) };
    case "w": {
      // Move forward one word
      const line = e.lines[e.cursorRow];
      const rest = line.slice(e.cursorCol);
      const match = rest.match(/^\S*\s+/);
      if (match) return { ...e, cursorCol: e.cursorCol + match[0].length };
      if (e.cursorRow < e.lines.length - 1) return { ...e, cursorRow: e.cursorRow + 1, cursorCol: 0 };
      return { ...e, cursorCol: Math.max(0, line.length - 1) };
    }
    case "b": {
      // Move backward one word
      if (e.cursorCol === 0 && e.cursorRow > 0) {
        return { ...e, cursorRow: e.cursorRow - 1, cursorCol: Math.max(0, e.lines[e.cursorRow - 1].length - 1) };
      }
      const before = e.lines[e.cursorRow].slice(0, e.cursorCol);
      const match = before.match(/\S+\s*$/);
      return { ...e, cursorCol: match ? e.cursorCol - match[0].length : 0 };
    }
    case "G":
      return { ...e, cursorRow: e.lines.length - 1, cursorCol: 0 };
    case "g":
      // gg goes to top — simplified, just go to top
      return { ...e, cursorRow: 0, cursorCol: 0 };
    case "x": {
      // Delete char under cursor
      const line = e.lines[e.cursorRow];
      if (line.length > 0) {
        e.lines[e.cursorRow] = line.slice(0, e.cursorCol) + line.slice(e.cursorCol + 1);
        return { ...e, modified: true, cursorCol: Math.min(e.cursorCol, Math.max(0, e.lines[e.cursorRow].length - 1)) };
      }
      return e;
    }
    case "d": {
      // dd deletes entire line — simplified
      if (e.lines.length > 1) {
        e.lines.splice(e.cursorRow, 1);
        const newRow = Math.min(e.cursorRow, e.lines.length - 1);
        return { ...e, cursorRow: newRow, cursorCol: 0, modified: true, message: "1 line deleted" };
      }
      e.lines[0] = "";
      return { ...e, cursorCol: 0, modified: true };
    }
    case "u":
      return { ...e, message: "Already at oldest change" };
    case ":":
      return { ...e, vimMode: "command", vimCommandBuffer: ":" };
    case "/":
      return { ...e, vimMode: "command", vimCommandBuffer: "/" };
    default:
      return e;
  }
};

// Handle vim command mode (:w, :q, :wq, etc.)
export const handleVimCommand = (
  commandBuffer: string
): { action: "save" | "quit" | "savequit" | "forcequit" | "none"; message: string } => {
  const cmd = commandBuffer.slice(1).trim();

  if (cmd === "w") return { action: "save", message: "" };
  if (cmd === "q") return { action: "quit", message: "" };
  if (cmd === "wq" || cmd === "x") return { action: "savequit", message: "" };
  if (cmd === "q!") return { action: "forcequit", message: "" };
  if (cmd === "w!" ) return { action: "save", message: "" };
  if (cmd === "wq!") return { action: "savequit", message: "" };
  if (cmd.startsWith("/")) return { action: "none", message: `Pattern not found: ${cmd.slice(1)}` };
  if (cmd === "set nu" || cmd === "set number") return { action: "none", message: "" };
  if (cmd === "set nonu" || cmd === "set nonumber") return { action: "none", message: "" };

  return { action: "none", message: `E492: Not an editor command: ${cmd}` };
};

// Handle vim insert mode key
export const handleVimInsertKey = (
  key: string,
  editor: EditorState
): EditorState => {
  const e = { ...editor, lines: [...editor.lines] };

  if (key === "Escape") {
    return { ...e, vimMode: "normal", message: "", cursorCol: Math.max(0, e.cursorCol - 1) };
  }

  if (key === "Enter") {
    const line = e.lines[e.cursorRow];
    const before = line.slice(0, e.cursorCol);
    const after = line.slice(e.cursorCol);
    e.lines[e.cursorRow] = before;
    e.lines.splice(e.cursorRow + 1, 0, after);
    return { ...e, cursorRow: e.cursorRow + 1, cursorCol: 0, modified: true };
  }

  if (key === "Backspace") {
    if (e.cursorCol > 0) {
      const line = e.lines[e.cursorRow];
      e.lines[e.cursorRow] = line.slice(0, e.cursorCol - 1) + line.slice(e.cursorCol);
      return { ...e, cursorCol: e.cursorCol - 1, modified: true };
    } else if (e.cursorRow > 0) {
      const prevLine = e.lines[e.cursorRow - 1];
      const curLine = e.lines[e.cursorRow];
      e.lines[e.cursorRow - 1] = prevLine + curLine;
      e.lines.splice(e.cursorRow, 1);
      return { ...e, cursorRow: e.cursorRow - 1, cursorCol: prevLine.length, modified: true };
    }
    return e;
  }

  if (key === "Tab") {
    const line = e.lines[e.cursorRow];
    e.lines[e.cursorRow] = line.slice(0, e.cursorCol) + "    " + line.slice(e.cursorCol);
    return { ...e, cursorCol: e.cursorCol + 4, modified: true };
  }

  if (key === "ArrowUp") return { ...e, cursorRow: Math.max(0, e.cursorRow - 1), cursorCol: Math.min(e.cursorCol, e.lines[Math.max(0, e.cursorRow - 1)].length) };
  if (key === "ArrowDown") return { ...e, cursorRow: Math.min(e.lines.length - 1, e.cursorRow + 1), cursorCol: Math.min(e.cursorCol, e.lines[Math.min(e.lines.length - 1, e.cursorRow + 1)].length) };
  if (key === "ArrowLeft") return { ...e, cursorCol: Math.max(0, e.cursorCol - 1) };
  if (key === "ArrowRight") return { ...e, cursorCol: Math.min(e.lines[e.cursorRow].length, e.cursorCol + 1) };

  // Regular character
  if (key.length === 1) {
    const line = e.lines[e.cursorRow];
    e.lines[e.cursorRow] = line.slice(0, e.cursorCol) + key + line.slice(e.cursorCol);
    return { ...e, cursorCol: e.cursorCol + 1, modified: true };
  }

  return e;
};

// Handle nano key
export const handleNanoKey = (
  key: string,
  ctrlKey: boolean,
  editor: EditorState
): { editor: EditorState; action?: "save" | "quit" | "savequit" | "help" } => {
  const e = { ...editor, lines: [...editor.lines] };

  // Ctrl shortcuts
  if (ctrlKey) {
    switch (key.toLowerCase()) {
      case "x":
        if (e.modified) {
          return { editor: { ...e, message: "Save modified buffer? (Y/N)" }, action: "quit" };
        }
        return { editor: e, action: "quit" };
      case "o":
        return { editor: { ...e, message: `Wrote ${e.lines.length} lines` }, action: "save" };
      case "k":
        // Cut line
        if (e.lines.length > 1) {
          e.lines.splice(e.cursorRow, 1);
          const newRow = Math.min(e.cursorRow, e.lines.length - 1);
          return { editor: { ...e, cursorRow: newRow, cursorCol: 0, modified: true, message: "Cut 1 line" } };
        }
        e.lines[0] = "";
        return { editor: { ...e, cursorCol: 0, modified: true } };
      case "u":
        // Paste (simplified)
        return { editor: { ...e, message: "Uncut buffer is empty" } };
      case "w":
        return { editor: { ...e, message: "Search: " } };
      case "g":
        return { editor: { ...e, message: `[ line ${e.cursorRow + 1}/${e.lines.length} (${Math.round(((e.cursorRow + 1) / e.lines.length) * 100)}%), col ${e.cursorCol + 1}/${e.lines[e.cursorRow].length + 1} ]` } };
      case "a":
        return { editor: { ...e, cursorCol: 0 } };
      case "e":
        return { editor: { ...e, cursorCol: e.lines[e.cursorRow].length } };
      default:
        return { editor: e };
    }
  }

  if (key === "Enter") {
    const line = e.lines[e.cursorRow];
    const before = line.slice(0, e.cursorCol);
    const after = line.slice(e.cursorCol);
    e.lines[e.cursorRow] = before;
    e.lines.splice(e.cursorRow + 1, 0, after);
    return { editor: { ...e, cursorRow: e.cursorRow + 1, cursorCol: 0, modified: true, message: "" } };
  }

  if (key === "Backspace") {
    if (e.cursorCol > 0) {
      const line = e.lines[e.cursorRow];
      e.lines[e.cursorRow] = line.slice(0, e.cursorCol - 1) + line.slice(e.cursorCol);
      return { editor: { ...e, cursorCol: e.cursorCol - 1, modified: true, message: "" } };
    } else if (e.cursorRow > 0) {
      const prevLine = e.lines[e.cursorRow - 1];
      const curLine = e.lines[e.cursorRow];
      e.lines[e.cursorRow - 1] = prevLine + curLine;
      e.lines.splice(e.cursorRow, 1);
      return { editor: { ...e, cursorRow: e.cursorRow - 1, cursorCol: prevLine.length, modified: true, message: "" } };
    }
    return { editor: e };
  }

  if (key === "Delete") {
    const line = e.lines[e.cursorRow];
    if (e.cursorCol < line.length) {
      e.lines[e.cursorRow] = line.slice(0, e.cursorCol) + line.slice(e.cursorCol + 1);
      return { editor: { ...e, modified: true, message: "" } };
    } else if (e.cursorRow < e.lines.length - 1) {
      e.lines[e.cursorRow] = line + e.lines[e.cursorRow + 1];
      e.lines.splice(e.cursorRow + 1, 1);
      return { editor: { ...e, modified: true, message: "" } };
    }
    return { editor: e };
  }

  if (key === "Tab") {
    const line = e.lines[e.cursorRow];
    e.lines[e.cursorRow] = line.slice(0, e.cursorCol) + "    " + line.slice(e.cursorCol);
    return { editor: { ...e, cursorCol: e.cursorCol + 4, modified: true, message: "" } };
  }

  if (key === "ArrowUp") return { editor: { ...e, cursorRow: Math.max(0, e.cursorRow - 1), cursorCol: Math.min(e.cursorCol, e.lines[Math.max(0, e.cursorRow - 1)].length), message: "" } };
  if (key === "ArrowDown") return { editor: { ...e, cursorRow: Math.min(e.lines.length - 1, e.cursorRow + 1), cursorCol: Math.min(e.cursorCol, e.lines[Math.min(e.lines.length - 1, e.cursorRow + 1)].length), message: "" } };
  if (key === "ArrowLeft") return { editor: { ...e, cursorCol: Math.max(0, e.cursorCol - 1), message: "" } };
  if (key === "ArrowRight") return { editor: { ...e, cursorCol: Math.min(e.lines[e.cursorRow].length, e.cursorCol + 1), message: "" } };
  if (key === "Home") return { editor: { ...e, cursorCol: 0, message: "" } };
  if (key === "End") return { editor: { ...e, cursorCol: e.lines[e.cursorRow].length, message: "" } };
  if (key === "PageUp") return { editor: { ...e, cursorRow: Math.max(0, e.cursorRow - 20), message: "" } };
  if (key === "PageDown") return { editor: { ...e, cursorRow: Math.min(e.lines.length - 1, e.cursorRow + 20), message: "" } };

  // Regular character
  if (key.length === 1) {
    const line = e.lines[e.cursorRow];
    e.lines[e.cursorRow] = line.slice(0, e.cursorCol) + key + line.slice(e.cursorCol);
    return { editor: { ...e, cursorCol: e.cursorCol + 1, modified: true, message: "" } };
  }

  return { editor: e };
};

// Render nano editor view
export const renderNanoView = (editor: EditorState, visibleLines: number): string[] => {
  const output: string[] = [];
  const titleBar = `  GNU nano 7.2      ${editor.fileName}${editor.modified ? " (Modified)" : ""}`;
  output.push(titleBar);
  output.push("");

  // Show file content with scroll
  const startLine = Math.max(0, editor.cursorRow - Math.floor(visibleLines / 2));
  const endLine = Math.min(editor.lines.length, startLine + visibleLines - 6);

  for (let i = startLine; i < endLine; i++) {
    output.push(editor.lines[i] || "");
  }

  // Pad remaining lines with empty
  for (let i = endLine - startLine; i < visibleLines - 6; i++) {
    output.push("");
  }

  // Status + shortcuts
  output.push("");
  output.push(editor.message || `[ line ${editor.cursorRow + 1}/${editor.lines.length}, col ${editor.cursorCol + 1}/${(editor.lines[editor.cursorRow]?.length || 0) + 1} ]`);
  output.push("^G Help    ^O Write Out  ^W Where Is   ^K Cut       ^U Paste     ^T Execute");
  output.push("^X Exit    ^R Read File  ^\\ Replace    ^J Justify   ^C Cur Pos   ^_ Go To Line");

  return output;
};

// Render vim editor view
export const renderVimView = (editor: EditorState, visibleLines: number): string[] => {
  const output: string[] = [];

  const startLine = Math.max(0, editor.cursorRow - Math.floor(visibleLines / 2));
  const endLine = Math.min(editor.lines.length, startLine + visibleLines - 3);

  for (let i = startLine; i < endLine; i++) {
    const lineNum = String(i + 1).padStart(3, " ");
    output.push(`${lineNum} ${editor.lines[i] || ""}`);
  }

  // Fill remaining lines with tildes
  for (let i = endLine - startLine; i < visibleLines - 3; i++) {
    output.push("  ~");
  }

  // Status line
  output.push("");
  if (editor.vimMode === "command") {
    output.push(editor.vimCommandBuffer);
  } else if (editor.vimMode === "insert") {
    output.push(`-- INSERT --                                          ${editor.cursorRow + 1},${editor.cursorCol + 1}      All`);
  } else {
    output.push(`"${editor.fileName}" ${editor.modified ? "[+]" : ""}${editor.isNewFile ? "[New File]" : `${editor.lines.length}L, ${editor.lines.join("\n").length}C`}     ${editor.cursorRow + 1},${editor.cursorCol + 1}      All`);
  }

  return output;
};
