import { useState, useEffect, useCallback, useRef } from "react";
import { FSNode, getNode, resolvePath } from "./kaliFileSystem";
import { TerminalState } from "./kaliCommands";

interface MCProps {
  termState: TerminalState;
  onClose: (newCwd?: string) => void;
}

interface MCState {
  leftPath: string;
  rightPath: string;
  activePane: "left" | "right";
  leftSelected: number;
  rightSelected: number;
  leftScroll: number;
  rightScroll: number;
}

const VISIBLE_ROWS = 20;

const getEntries = (fs: Record<string, FSNode>, path: string): { name: string; node: FSNode; isDir: boolean }[] => {
  const node = getNode(fs, path);
  if (!node || node.type !== "dir" || !node.children) return [];
  const entries: { name: string; node: FSNode; isDir: boolean }[] = [];
  // Add parent directory
  if (path !== "/") {
    entries.push({ name: "..", node: { type: "dir", children: {}, permissions: "drwxr-xr-x", owner: "root", modified: "" }, isDir: true });
  }
  // Sort: dirs first, then files
  const sorted = Object.entries(node.children).sort(([aName, aNode], [bName, bNode]) => {
    if (aNode.type === "dir" && bNode.type !== "dir") return -1;
    if (aNode.type !== "dir" && bNode.type === "dir") return 1;
    return aName.localeCompare(bName);
  });
  for (const [name, child] of sorted) {
    entries.push({ name, node: child, isDir: child.type === "dir" });
  }
  return entries;
};

const formatSize = (node: FSNode): string => {
  if (node.type === "dir") return "DIR";
  return String(node.size || node.content?.length || 0);
};

const MidnightCommander = ({ termState, onClose }: MCProps) => {
  const [state, setState] = useState<MCState>({
    leftPath: termState.cwd,
    rightPath: "/",
    activePane: "left",
    leftSelected: 0,
    rightSelected: 0,
    leftScroll: 0,
    rightScroll: 0,
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  const leftEntries = getEntries(termState.fs, state.leftPath);
  const rightEntries = getEntries(termState.fs, state.rightPath);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const isLeft = state.activePane === "left";
    const entries = isLeft ? leftEntries : rightEntries;
    const selected = isLeft ? state.leftSelected : state.rightSelected;

    if (e.key === "Tab") {
      setState(prev => ({ ...prev, activePane: prev.activePane === "left" ? "right" : "left" }));
      return;
    }

    if (e.key === "F10" || (e.key === "q" && !e.ctrlKey) || e.key === "Escape") {
      const activePath = isLeft ? state.leftPath : state.rightPath;
      onClose(activePath);
      return;
    }

    if (e.key === "ArrowUp" || e.key === "k") {
      const newSel = Math.max(0, selected - 1);
      setState(prev => isLeft
        ? { ...prev, leftSelected: newSel, leftScroll: Math.min(prev.leftScroll, newSel) }
        : { ...prev, rightSelected: newSel, rightScroll: Math.min(prev.rightScroll, newSel) }
      );
      return;
    }

    if (e.key === "ArrowDown" || e.key === "j") {
      const newSel = Math.min(entries.length - 1, selected + 1);
      setState(prev => isLeft
        ? { ...prev, leftSelected: newSel, leftScroll: Math.max(prev.leftScroll, newSel - VISIBLE_ROWS + 1) }
        : { ...prev, rightSelected: newSel, rightScroll: Math.max(prev.rightScroll, newSel - VISIBLE_ROWS + 1) }
      );
      return;
    }

    if (e.key === "Enter") {
      const entry = entries[selected];
      if (!entry) return;
      if (entry.isDir) {
        const currentPath = isLeft ? state.leftPath : state.rightPath;
        let newPath: string;
        if (entry.name === "..") {
          const parts = currentPath.split("/").filter(Boolean);
          parts.pop();
          newPath = "/" + parts.join("/");
          if (newPath === "") newPath = "/";
        } else {
          newPath = currentPath === "/" ? `/${entry.name}` : `${currentPath}/${entry.name}`;
        }
        setState(prev => isLeft
          ? { ...prev, leftPath: newPath, leftSelected: 0, leftScroll: 0 }
          : { ...prev, rightPath: newPath, rightSelected: 0, rightScroll: 0 }
        );
      }
      return;
    }
  }, [state, leftEntries, rightEntries, onClose]);

  const renderPane = (path: string, entries: { name: string; node: FSNode; isDir: boolean }[], selected: number, scroll: number, isActive: boolean) => {
    const visible = entries.slice(scroll, scroll + VISIBLE_ROWS);
    return (
      <div className={`flex-1 border ${isActive ? "border-primary/60" : "border-border/40"} overflow-hidden`}>
        {/* Path header */}
        <div className={`text-center text-[10px] py-0.5 truncate px-1 ${isActive ? "bg-primary/20 text-primary" : "bg-muted/30 text-muted-foreground"}`}>
          {path}
        </div>
        {/* Column headers */}
        <div className="flex text-[9px] text-muted-foreground/60 border-b border-border/30 px-1">
          <span className="flex-1">Name</span>
          <span className="w-12 text-right">Size</span>
          <span className="w-16 text-right">Perms</span>
        </div>
        {/* File list */}
        <div className="text-[11px]">
          {Array.from({ length: VISIBLE_ROWS }, (_, idx) => {
            const entry = visible[idx];
            const globalIdx = scroll + idx;
            const isSel = globalIdx === selected && isActive;

            if (!entry) {
              return <div key={idx} className="h-[18px]">&nbsp;</div>;
            }

            return (
              <div
                key={idx}
                className={`flex px-1 h-[18px] items-center cursor-pointer ${
                  isSel ? "bg-primary text-primary-foreground" : ""
                }`}
              >
                <span className={`flex-1 truncate ${
                  !isSel && entry.isDir ? "text-primary font-bold" : 
                  !isSel ? "text-white" : ""
                }`}>
                  {entry.isDir ? "/" : " "}{entry.name}
                </span>
                <span className={`w-12 text-right text-[9px] ${isSel ? "" : "text-muted-foreground/70"}`}>
                  {formatSize(entry.node)}
                </span>
                <span className={`w-16 text-right text-[9px] ${isSel ? "" : "text-muted-foreground/50"}`}>
                  {entry.node.permissions?.slice(0, 10) || "----------"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="h-full w-full outline-none font-mono text-xs"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={() => containerRef.current?.focus()}
    >
      {/* MC Title */}
      <div className="text-center bg-primary/20 text-primary py-0.5 text-[10px] font-bold">
        GNU Midnight Commander 4.8.31
      </div>

      {/* Dual panes */}
      <div className="flex gap-0 h-[calc(100%-60px)]">
        {renderPane(state.leftPath, leftEntries, state.leftSelected, state.leftScroll, state.activePane === "left")}
        {renderPane(state.rightPath, rightEntries, state.rightSelected, state.rightScroll, state.activePane === "right")}
      </div>

      {/* Hint bar */}
      <div className="text-[9px] text-muted-foreground/60 text-center py-0.5">
        {state.activePane === "left" ? state.leftPath : state.rightPath}
      </div>

      {/* Function key bar */}
      <div className="flex justify-between px-1 py-1 bg-muted/30 border-t border-border/30 text-[9px]">
        {[
          { key: "1", label: "Help" },
          { key: "2", label: "Menu" },
          { key: "3", label: "View" },
          { key: "4", label: "Edit" },
          { key: "5", label: "Copy" },
          { key: "6", label: "Move" },
          { key: "7", label: "Mkdir" },
          { key: "8", label: "Delete" },
          { key: "9", label: "PullDn" },
          { key: "10", label: "Quit" },
        ].map(f => (
          <span key={f.key} className="flex items-center gap-0.5">
            <span className="bg-muted/50 text-muted-foreground px-1 rounded">{f.key}</span>
            <span className="text-white">{f.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default MidnightCommander;
