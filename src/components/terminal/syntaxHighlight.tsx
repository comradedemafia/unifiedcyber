import React from "react";

type TokenType = "keyword" | "string" | "comment" | "number" | "builtin" | "operator" | "variable" | "decorator" | "section" | "key" | "value" | "normal";

interface Token {
  text: string;
  type: TokenType;
}

const tokenColors: Record<TokenType, string> = {
  keyword: "text-[#c678dd]",    // purple
  string: "text-[#98c379]",     // green
  comment: "text-[#5c6370]",    // gray
  number: "text-[#d19a66]",     // orange
  builtin: "text-[#61afef]",    // blue
  operator: "text-[#56b6c2]",   // cyan
  variable: "text-[#e06c75]",   // red
  decorator: "text-[#e5c07b]",  // yellow
  section: "text-[#61afef] font-bold", // blue bold
  key: "text-[#e06c75]",        // red
  value: "text-[#98c379]",      // green
  normal: "text-white",
};

const pythonKeywords = new Set([
  "import", "from", "def", "class", "return", "if", "elif", "else", "for", "while",
  "try", "except", "finally", "with", "as", "yield", "lambda", "pass", "break",
  "continue", "raise", "in", "not", "and", "or", "is", "None", "True", "False",
  "global", "nonlocal", "del", "assert", "async", "await",
]);

const pythonBuiltins = new Set([
  "print", "len", "range", "str", "int", "float", "list", "dict", "set", "tuple",
  "open", "type", "isinstance", "super", "self", "input", "map", "filter", "zip",
  "enumerate", "sorted", "reversed", "abs", "max", "min", "sum", "any", "all",
  "hex", "oct", "bin", "chr", "ord", "format", "hash", "id", "dir", "vars",
  "__init__", "__name__", "__main__",
]);

const bashKeywords = new Set([
  "if", "then", "else", "elif", "fi", "for", "while", "do", "done", "case", "esac",
  "function", "return", "exit", "export", "source", "alias", "unalias", "local",
  "readonly", "declare", "typeset", "set", "unset", "shift", "eval", "exec",
  "trap", "select", "until", "in",
]);

const bashBuiltins = new Set([
  "echo", "printf", "cd", "pwd", "ls", "cat", "grep", "sed", "awk", "find",
  "mkdir", "rm", "cp", "mv", "chmod", "chown", "curl", "wget", "tar", "ssh",
  "sudo", "apt", "dpkg", "systemctl", "service", "kill", "ps", "top",
]);

const detectLanguage = (fileName: string): "python" | "bash" | "config" | "text" => {
  if (fileName.endsWith(".py")) return "python";
  if (fileName.endsWith(".sh") || fileName.endsWith(".bash") || fileName === ".bashrc" || fileName === ".bash_profile" || fileName === ".profile" || fileName === ".zshrc") return "bash";
  if (fileName.endsWith(".conf") || fileName.endsWith(".cfg") || fileName.endsWith(".ini") || fileName.endsWith(".toml") || fileName.endsWith(".yml") || fileName.endsWith(".yaml") || fileName === ".env" || fileName.includes("config") || fileName === "os-release" || fileName === "passwd" || fileName === "shadow" || fileName === "hosts" || fileName === "resolv.conf" || fileName === "sshd_config" || fileName === "fstab") return "config";
  return "text";
};

const tokenizePython = (line: string): Token[] => {
  const tokens: Token[] = [];
  let i = 0;

  while (i < line.length) {
    // Comment
    if (line[i] === "#") {
      tokens.push({ text: line.slice(i), type: "comment" });
      break;
    }
    // Decorator
    if (line[i] === "@" && (i === 0 || /\s/.test(line[i - 1]))) {
      const m = line.slice(i).match(/^@\w+/);
      if (m) { tokens.push({ text: m[0], type: "decorator" }); i += m[0].length; continue; }
    }
    // Strings
    if (line[i] === '"' || line[i] === "'") {
      const q = line[i];
      const triple = line.slice(i, i + 3) === q.repeat(3);
      const end = triple ? q.repeat(3) : q;
      const start = triple ? i + 3 : i + 1;
      const endIdx = line.indexOf(end, start);
      const actualEnd = endIdx >= 0 ? endIdx + end.length : line.length;
      tokens.push({ text: line.slice(i, actualEnd), type: "string" });
      i = actualEnd;
      continue;
    }
    // Numbers
    if (/\d/.test(line[i]) && (i === 0 || /[\s(=,[\]{:+\-*/]/.test(line[i - 1]))) {
      const m = line.slice(i).match(/^[\d.]+[xXoObB]?[\da-fA-F]*/);
      if (m) { tokens.push({ text: m[0], type: "number" }); i += m[0].length; continue; }
    }
    // Words
    if (/[a-zA-Z_]/.test(line[i])) {
      const m = line.slice(i).match(/^[a-zA-Z_]\w*/);
      if (m) {
        const word = m[0];
        if (pythonKeywords.has(word)) tokens.push({ text: word, type: "keyword" });
        else if (pythonBuiltins.has(word)) tokens.push({ text: word, type: "builtin" });
        else tokens.push({ text: word, type: "normal" });
        i += word.length;
        continue;
      }
    }
    // Operators
    if ("=+-*/<>!&|^~%".includes(line[i])) {
      tokens.push({ text: line[i], type: "operator" });
      i++;
      continue;
    }
    // Default
    tokens.push({ text: line[i], type: "normal" });
    i++;
  }
  return tokens;
};

const tokenizeBash = (line: string): Token[] => {
  const tokens: Token[] = [];
  let i = 0;

  while (i < line.length) {
    if (line[i] === "#" && (i === 0 || line[i-1] !== "$")) {
      tokens.push({ text: line.slice(i), type: "comment" });
      break;
    }
    if (line[i] === "$") {
      const m = line.slice(i).match(/^\$\{?\w+\}?/);
      if (m) { tokens.push({ text: m[0], type: "variable" }); i += m[0].length; continue; }
    }
    if (line[i] === '"' || line[i] === "'") {
      const q = line[i];
      const endIdx = line.indexOf(q, i + 1);
      const actualEnd = endIdx >= 0 ? endIdx + 1 : line.length;
      tokens.push({ text: line.slice(i, actualEnd), type: "string" });
      i = actualEnd;
      continue;
    }
    if (/[a-zA-Z_]/.test(line[i])) {
      const m = line.slice(i).match(/^[a-zA-Z_][\w-]*/);
      if (m) {
        const word = m[0];
        if (bashKeywords.has(word)) tokens.push({ text: word, type: "keyword" });
        else if (bashBuiltins.has(word)) tokens.push({ text: word, type: "builtin" });
        else tokens.push({ text: word, type: "normal" });
        i += word.length;
        continue;
      }
    }
    if (/\d/.test(line[i])) {
      const m = line.slice(i).match(/^\d+/);
      if (m) { tokens.push({ text: m[0], type: "number" }); i += m[0].length; continue; }
    }
    if ("=|&;<>!".includes(line[i])) {
      tokens.push({ text: line[i], type: "operator" });
      i++;
      continue;
    }
    tokens.push({ text: line[i], type: "normal" });
    i++;
  }
  return tokens;
};

const tokenizeConfig = (line: string): Token[] => {
  const trimmed = line.trimStart();
  // Comments
  if (trimmed.startsWith("#") || trimmed.startsWith(";")) {
    return [{ text: line, type: "comment" }];
  }
  // Section headers [section]
  if (trimmed.startsWith("[") && trimmed.includes("]")) {
    return [{ text: line, type: "section" }];
  }
  // Key=value
  const eqIdx = line.indexOf("=");
  if (eqIdx > 0) {
    return [
      { text: line.slice(0, eqIdx), type: "key" },
      { text: "=", type: "operator" },
      { text: line.slice(eqIdx + 1), type: "value" },
    ];
  }
  // Key: value (YAML style)
  const colonIdx = line.indexOf(":");
  if (colonIdx > 0 && /^[\w.-]+:/.test(trimmed)) {
    return [
      { text: line.slice(0, colonIdx), type: "key" },
      { text: ":", type: "operator" },
      { text: line.slice(colonIdx + 1), type: "value" },
    ];
  }
  return [{ text: line, type: "normal" }];
};

export const highlightLine = (line: string, fileName: string): React.ReactNode => {
  const lang = detectLanguage(fileName);
  if (lang === "text") return <span className="text-white">{line || "\u00A0"}</span>;

  let tokens: Token[];
  switch (lang) {
    case "python": tokens = tokenizePython(line); break;
    case "bash": tokens = tokenizeBash(line); break;
    case "config": tokens = tokenizeConfig(line); break;
    default: return <span className="text-white">{line || "\u00A0"}</span>;
  }

  if (tokens.length === 0) return <span className="text-white">{"\u00A0"}</span>;

  return (
    <>
      {tokens.map((t, i) => (
        <span key={i} className={tokenColors[t.type]}>{t.text}</span>
      ))}
    </>
  );
};

export { detectLanguage };
