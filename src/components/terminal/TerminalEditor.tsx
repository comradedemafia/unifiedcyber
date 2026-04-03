import { useState, useEffect, useCallback, useRef } from "react";
import {
  EditorState,
  EditorType,
  handleVimNormalKey,
  handleVimInsertKey,
  handleVimCommand,
  handleNanoKey,
  saveEditorFile,
} from "./editorSimulation";
import { TerminalState } from "./kaliCommands";
import { FSNode } from "./kaliFileSystem";
import { highlightLine } from "./syntaxHighlight";

interface TerminalEditorProps {
  editor: EditorState;
  termState: TerminalState;
  onClose: (message: string, newFs?: Record<string, FSNode>) => void;
}

const TerminalEditor = ({ editor: initialEditor, termState, onClose }: TerminalEditorProps) => {
  const [editor, setEditor] = useState<EditorState>(initialEditor);
  const containerRef = useRef<HTMLDivElement>(null);
  const VISIBLE_LINES = 26;

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  const handleSave = useCallback(() => {
    if (!editor.filePath && editor.fileName === "[No Name]") {
      setEditor(prev => ({ ...prev, message: "E32: No file name" }));
      return null;
    }
    const { newFs, message } = saveEditorFile(editor, termState);
    setEditor(prev => ({ ...prev, modified: false, message, isNewFile: false }));
    return newFs;
  }, [editor, termState]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (editor.type === "nano") {
      const result = handleNanoKey(e.key, e.ctrlKey, editor);
      setEditor(result.editor);

      if (result.action === "save") {
        const newFs = handleSave();
        if (newFs) {
          setEditor(prev => ({ ...prev, message: `Wrote ${prev.lines.length} lines` }));
        }
      } else if (result.action === "quit") {
        if (editor.modified) {
          const newFs = handleSave();
          onClose("", newFs || undefined);
        } else {
          onClose("");
        }
      }
      return;
    }

    // VIM
    if (editor.vimMode === "command") {
      if (e.key === "Escape") {
        setEditor(prev => ({ ...prev, vimMode: "normal", vimCommandBuffer: "", message: "" }));
        return;
      }
      if (e.key === "Enter") {
        const { action, message } = handleVimCommand(editor.vimCommandBuffer);
        if (action === "save") {
          const newFs = handleSave();
          if (newFs) {
            setEditor(prev => ({ ...prev, vimMode: "normal", vimCommandBuffer: "" }));
          }
        } else if (action === "quit") {
          if (editor.modified) {
            setEditor(prev => ({ ...prev, vimMode: "normal", vimCommandBuffer: "", message: "E37: No write since last change (add ! to override)" }));
          } else {
            onClose("");
          }
        } else if (action === "savequit") {
          const newFs = handleSave();
          onClose("", newFs || undefined);
        } else if (action === "forcequit") {
          onClose("");
        } else {
          setEditor(prev => ({ ...prev, vimMode: "normal", vimCommandBuffer: "", message }));
        }
        return;
      }
      if (e.key === "Backspace") {
        setEditor(prev => {
          const buf = prev.vimCommandBuffer.slice(0, -1);
          return buf.length === 0 ? { ...prev, vimMode: "normal", vimCommandBuffer: "", message: "" } : { ...prev, vimCommandBuffer: buf };
        });
        return;
      }
      if (e.key.length === 1) {
        setEditor(prev => ({ ...prev, vimCommandBuffer: prev.vimCommandBuffer + e.key }));
        return;
      }
      return;
    }

    if (editor.vimMode === "insert") {
      setEditor(prev => handleVimInsertKey(e.key, prev));
      return;
    }

    // Normal mode
    setEditor(prev => handleVimNormalKey(e.key, prev));
  }, [editor, handleSave, onClose]);

  // Compute visible lines
  const startLine = Math.max(0, editor.cursorRow - Math.floor(VISIBLE_LINES / 2));
  const endLine = Math.min(editor.lines.length, startLine + VISIBLE_LINES);

  const isVim = editor.type === "vim";
  const fileName = editor.fileName;

  const renderLineContent = (lineContent: string, lineIdx: number, isCurrentLine: boolean) => {
    if (isCurrentLine) {
      // For the current line, we need to show cursor, so render with highlight but split at cursor
      const before = lineContent.slice(0, editor.cursorCol);
      const cursorChar = lineContent[editor.cursorCol] || " ";
      const after = lineContent.slice(editor.cursorCol + 1);

      return (
        <>
          <span>{highlightLine(before, fileName)}</span>
          <span className="bg-primary text-primary-foreground">{cursorChar}</span>
          <span>{highlightLine(after, fileName)}</span>
        </>
      );
    }
    return highlightLine(lineContent, fileName);
  };

  return (
    <div
      ref={containerRef}
      className="h-full w-full outline-none font-mono text-xs"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={() => containerRef.current?.focus()}
    >
      {/* Title bar */}
      {!isVim && (
        <div className="text-center bg-muted/30 text-white py-0.5 border-b border-border/30">
          GNU nano 7.2{" "}
          <span className="text-primary">{editor.fileName}</span>
          {editor.modified && <span className="text-warning ml-2">(Modified)</span>}
        </div>
      )}

      {/* Editor content */}
      <div className="leading-relaxed">
        {Array.from({ length: VISIBLE_LINES }, (_, idx) => {
          const lineIdx = startLine + idx;
          const isCurrentLine = lineIdx === editor.cursorRow;
          const lineContent = lineIdx < editor.lines.length ? editor.lines[lineIdx] : null;

          if (isVim && lineContent === null) {
            return (
              <div key={idx} className="flex">
                <span className="w-8 text-right pr-2 text-primary/40 select-none">~</span>
                <span>&nbsp;</span>
              </div>
            );
          }

          if (lineContent === null) {
            return <div key={idx}>&nbsp;</div>;
          }

          return (
            <div
              key={idx}
              className={`flex ${isCurrentLine ? "bg-muted/20" : ""}`}
            >
              {isVim && (
                <span className={`w-8 text-right pr-2 select-none ${isCurrentLine ? "text-warning" : "text-muted-foreground/50"}`}>
                  {lineIdx + 1}
                </span>
              )}
              <span className="flex-1 whitespace-pre">
                {renderLineContent(lineContent, lineIdx, isCurrentLine)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Status / bottom bar */}
      {isVim ? (
        <div className="border-t border-border/30 mt-1">
          <div className={`px-2 py-0.5 ${editor.vimMode === "insert" ? "text-success" : editor.vimMode === "command" ? "text-white" : "text-muted-foreground"}`}>
            {editor.vimMode === "command" ? (
              <span>{editor.vimCommandBuffer}<span className="bg-primary text-primary-foreground">&nbsp;</span></span>
            ) : editor.vimMode === "insert" ? (
              <span>-- INSERT --<span className="float-right">{editor.cursorRow + 1},{editor.cursorCol + 1}   All</span></span>
            ) : (
              <span>
                {editor.message || `"${editor.fileName}" ${editor.modified ? "[+] " : ""}${editor.lines.length}L, ${editor.lines.join("\n").length}C`}
                <span className="float-right">{editor.cursorRow + 1},{editor.cursorCol + 1}   All</span>
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="border-t border-border/30 mt-1">
          <div className="text-center text-muted-foreground/70 py-0.5 text-[10px]">
            {editor.message || `[ line ${editor.cursorRow + 1}/${editor.lines.length}, col ${editor.cursorCol + 1}/${(editor.lines[editor.cursorRow]?.length || 0) + 1} ]`}
          </div>
          <div className="flex flex-wrap justify-center gap-x-3 px-2 py-1 bg-muted/20 text-[10px]">
            <span><span className="text-white font-bold">^G</span> <span className="text-muted-foreground">Help</span></span>
            <span><span className="text-white font-bold">^O</span> <span className="text-muted-foreground">Write Out</span></span>
            <span><span className="text-white font-bold">^W</span> <span className="text-muted-foreground">Where Is</span></span>
            <span><span className="text-white font-bold">^K</span> <span className="text-muted-foreground">Cut</span></span>
            <span><span className="text-white font-bold">^X</span> <span className="text-muted-foreground">Exit</span></span>
            <span><span className="text-white font-bold">^R</span> <span className="text-muted-foreground">Read File</span></span>
            <span><span className="text-white font-bold">^\</span> <span className="text-muted-foreground">Replace</span></span>
            <span><span className="text-white font-bold">^C</span> <span className="text-muted-foreground">Cur Pos</span></span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TerminalEditor;
