import { useState, useEffect, useRef } from "react";
import { Globe, Trash2, ShieldCheck, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  getSessionAllowlist,
  removeFromSessionAllowlist,
  clearSessionAllowlist,
  exportAllowlistJSON,
  importAllowlistJSON,
} from "@/utils/realCommandPolicy";

const TerminalAllowlistManager = () => {
  const [hosts, setHosts] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = () => setHosts(getSessionAllowlist());
  useEffect(() => {
    refresh();
    const i = setInterval(refresh, 2000);
    return () => clearInterval(i);
  }, []);

  const handleExport = () => {
    const blob = new Blob([exportAllowlistJSON()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `terminal-allowlist-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${hosts.length} hosts`);
  };

  const handleImport = async (file: File) => {
    const text = await file.text();
    const r = importAllowlistJSON(text, "merge");
    refresh();
    if (r.errors.length) toast.error(r.errors.join("; "));
    else toast.success(`Imported: ${r.added} added, ${r.skipped} skipped`);
  };

  return (
    <div className="bg-card border border-border/50 rounded-xl">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-3 text-left"
      >
        <span className="flex items-center gap-2 text-xs font-mono text-foreground">
          <ShieldCheck className="w-4 h-4 text-primary" />
          Session-trusted hosts ({hosts.length})
        </span>
        <span className="text-[10px] font-mono text-muted-foreground">
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div className="border-t border-border/50 p-3 space-y-2">
          {/* Import / Export controls always visible */}
          <div className="flex items-center gap-2 pb-2 border-b border-border/30">
            <Button
              size="sm" variant="outline"
              className="text-[11px] font-mono gap-1 flex-1"
              onClick={handleExport}
              disabled={hosts.length === 0}
            >
              <Download className="w-3 h-3" /> Export JSON
            </Button>
            <Button
              size="sm" variant="outline"
              className="text-[11px] font-mono gap-1 flex-1"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="w-3 h-3" /> Import JSON
            </Button>
            <input
              ref={fileRef} type="file" accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImport(f);
                e.target.value = "";
              }}
            />
          </div>

          {hosts.length === 0 ? (
            <p className="text-[11px] font-mono text-muted-foreground py-2">
              No trusted hosts yet. They appear after you confirm an r-command for a host, or import a JSON list.
            </p>
          ) : (
            <>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {hosts.map((h) => (
                  <div
                    key={h}
                    className="flex items-center gap-2 px-2 py-1.5 bg-muted/10 rounded"
                  >
                    <Globe className="w-3 h-3 text-primary/60 shrink-0" />
                    <span className="text-[11px] font-mono text-foreground flex-1 truncate">
                      {h}
                    </span>
                    <button
                      onClick={() => {
                        removeFromSessionAllowlist(h);
                        refresh();
                      }}
                      className="p-1 rounded hover:bg-destructive/10 text-destructive"
                      title="Revoke"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full text-[11px] font-mono gap-1"
                onClick={() => {
                  clearSessionAllowlist();
                  refresh();
                }}
              >
                <Trash2 className="w-3 h-3" /> Clear all
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TerminalAllowlistManager;
