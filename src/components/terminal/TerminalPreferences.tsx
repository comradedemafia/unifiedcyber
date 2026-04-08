import { useState } from "react";
import { X } from "lucide-react";

export interface TerminalPrefs {
  fontSize: number;
  fontFamily: string;
  theme: "kali-dark" | "solarized-dark" | "monokai" | "dracula" | "gruvbox";
  cursorStyle: "block" | "underline" | "ibeam";
  cursorBlink: boolean;
  scrollbackSize: number;
}

export const defaultPrefs: TerminalPrefs = {
  fontSize: 13,
  fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
  theme: "kali-dark",
  cursorStyle: "block",
  cursorBlink: true,
  scrollbackSize: 10000,
};

export const themeColors: Record<string, { bg: string; fg: string; prompt: string; accent: string }> = {
  "kali-dark": { bg: "#1a1b26", fg: "#d3d7cf", prompt: "#48b9c7", accent: "#2d2d2d" },
  "solarized-dark": { bg: "#002b36", fg: "#839496", prompt: "#2aa198", accent: "#073642" },
  "monokai": { bg: "#272822", fg: "#f8f8f2", prompt: "#a6e22e", accent: "#3e3d32" },
  "dracula": { bg: "#282a36", fg: "#f8f8f2", prompt: "#50fa7b", accent: "#44475a" },
  "gruvbox": { bg: "#282828", fg: "#ebdbb2", prompt: "#b8bb26", accent: "#3c3836" },
};

interface Props {
  prefs: TerminalPrefs;
  onSave: (prefs: TerminalPrefs) => void;
  onClose: () => void;
}

const TerminalPreferences = ({ prefs, onSave, onClose }: Props) => {
  const [local, setLocal] = useState<TerminalPrefs>({ ...prefs });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-[#2d2d2d] rounded-lg border border-[#555] shadow-2xl w-[480px] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#444]">
          <h3 className="text-[15px] font-sans text-[#eee] font-medium">Preferences</h3>
          <button onClick={onClose} className="p-1 hover:bg-[#444] rounded transition-colors">
            <X className="w-4 h-4 text-[#999]" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Font Size */}
          <div>
            <label className="text-[12px] text-[#aaa] font-sans block mb-1.5">Font Size</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={10}
                max={20}
                value={local.fontSize}
                onChange={(e) => setLocal((p) => ({ ...p, fontSize: +e.target.value }))}
                className="flex-1 accent-[#48b9c7]"
              />
              <span className="text-[13px] text-[#ddd] font-mono w-8 text-right">{local.fontSize}</span>
            </div>
          </div>

          {/* Font Family */}
          <div>
            <label className="text-[12px] text-[#aaa] font-sans block mb-1.5">Font Family</label>
            <select
              value={local.fontFamily}
              onChange={(e) => setLocal((p) => ({ ...p, fontFamily: e.target.value }))}
              className="w-full bg-[#1a1b26] text-[#ddd] text-[13px] px-3 py-2 rounded border border-[#444] outline-none focus:border-[#48b9c7]"
            >
              <option value="'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace">JetBrains Mono</option>
              <option value="'Fira Code', monospace">Fira Code</option>
              <option value="'Cascadia Code', monospace">Cascadia Code</option>
              <option value="'Source Code Pro', monospace">Source Code Pro</option>
              <option value="monospace">System Monospace</option>
            </select>
          </div>

          {/* Theme */}
          <div>
            <label className="text-[12px] text-[#aaa] font-sans block mb-1.5">Color Theme</label>
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(themeColors).map(([name, colors]) => (
                <button
                  key={name}
                  onClick={() => setLocal((p) => ({ ...p, theme: name as TerminalPrefs["theme"] }))}
                  className={`rounded-md p-2 border transition-all ${
                    local.theme === name ? "border-[#48b9c7] ring-1 ring-[#48b9c7]" : "border-[#444] hover:border-[#666]"
                  }`}
                  style={{ backgroundColor: colors.bg }}
                >
                  <div className="text-[9px] font-mono truncate" style={{ color: colors.prompt }}>$</div>
                  <div className="text-[8px] mt-0.5 truncate" style={{ color: colors.fg }}>{name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Cursor Style */}
          <div>
            <label className="text-[12px] text-[#aaa] font-sans block mb-1.5">Cursor Style</label>
            <div className="flex gap-2">
              {(["block", "underline", "ibeam"] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => setLocal((p) => ({ ...p, cursorStyle: style }))}
                  className={`flex-1 px-3 py-2 rounded text-[12px] font-mono border transition-all ${
                    local.cursorStyle === style
                      ? "bg-[#48b9c7]/20 border-[#48b9c7] text-[#48b9c7]"
                      : "bg-[#1a1b26] border-[#444] text-[#999] hover:border-[#666]"
                  }`}
                >
                  {style === "block" ? "█" : style === "underline" ? "_" : "│"} {style}
                </button>
              ))}
            </div>
          </div>

          {/* Cursor Blink */}
          <div className="flex items-center justify-between">
            <label className="text-[12px] text-[#aaa] font-sans">Cursor Blink</label>
            <button
              onClick={() => setLocal((p) => ({ ...p, cursorBlink: !p.cursorBlink }))}
              className={`w-10 h-5 rounded-full transition-colors ${local.cursorBlink ? "bg-[#48b9c7]" : "bg-[#555]"}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-0.5 ${local.cursorBlink ? "translate-x-5" : ""}`} />
            </button>
          </div>

          {/* Scrollback */}
          <div>
            <label className="text-[12px] text-[#aaa] font-sans block mb-1.5">Scrollback Lines</label>
            <select
              value={local.scrollbackSize}
              onChange={(e) => setLocal((p) => ({ ...p, scrollbackSize: +e.target.value }))}
              className="w-full bg-[#1a1b26] text-[#ddd] text-[13px] px-3 py-2 rounded border border-[#444] outline-none focus:border-[#48b9c7]"
            >
              <option value={1000}>1,000</option>
              <option value={5000}>5,000</option>
              <option value={10000}>10,000</option>
              <option value={50000}>50,000</option>
              <option value={100000}>Unlimited</option>
            </select>
          </div>

          {/* Preview */}
          <div>
            <label className="text-[12px] text-[#aaa] font-sans block mb-1.5">Preview</label>
            <div
              className="rounded-md p-3 border border-[#444]"
              style={{
                backgroundColor: themeColors[local.theme].bg,
                fontFamily: local.fontFamily,
                fontSize: local.fontSize,
              }}
            >
              <div style={{ color: themeColors[local.theme].prompt }}>┌──(kali㉿kali)-[~]</div>
              <div className="flex items-center gap-1">
                <span style={{ color: themeColors[local.theme].prompt }}>└─$</span>
                <span style={{ color: themeColors[local.theme].fg }}> neofetch</span>
                <span
                  className={local.cursorBlink ? "animate-pulse" : ""}
                  style={{ color: themeColors[local.theme].fg }}
                >
                  {local.cursorStyle === "block" ? "█" : local.cursorStyle === "underline" ? "_" : "│"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-[#444]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-[12px] text-[#ccc] hover:bg-[#444] rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { onSave(local); onClose(); }}
            className="px-4 py-1.5 text-[12px] bg-[#48b9c7] text-[#1a1b26] rounded font-medium hover:bg-[#5dd5e3] transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default TerminalPreferences;
