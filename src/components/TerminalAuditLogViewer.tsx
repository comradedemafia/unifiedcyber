import { useEffect, useState, useCallback, useMemo } from "react";
import { ScrollText, RefreshCw, Filter, Search, ChevronLeft, ChevronRight, Radio, Download, AlertOctagon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import { toast } from "sonner";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function csvCell(v: unknown): string {
  if (v == null) return "";
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return `"${s.replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
}

interface AuditRow {
  id: string;
  user_email: string | null;
  event_type: string;
  command: string | null;
  target: string | null;
  result: string | null;
  severity: string;
  details: any;
  created_at: string;
}

const PAGE_SIZE = 20;

const sevColor = (s: string) =>
  s === "critical" ? "destructive" : s === "warning" ? "default" : "secondary";

const TerminalAuditLogViewer = () => {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [live, setLive] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    let q: any = (supabase.from("terminal_audit_log" as never) as any)
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
    if (filter !== "all") q = q.eq("event_type", filter);
    if (search.trim()) {
      const s = `%${search.trim()}%`;
      q = q.or(`command.ilike.${s},target.ilike.${s},user_email.ilike.${s}`);
    }
    const { data, count } = await q;
    setRows((data as AuditRow[]) || []);
    setTotal(count ?? 0);
    setLoading(false);
  }, [filter, search, page]);

  useEffect(() => { load(); }, [load]);

  // Live updates via realtime — prepend new rows when on first page & no filters
  useSupabaseRealtime(
    "terminal-audit-live",
    [
      {
        event: "INSERT",
        schema: "public",
        table: "terminal_audit_log",
        callback: (payload) => {
          if (!live) return;
          const row = payload.new as AuditRow;
          if (!row) return;
          // respect filter
          if (filter !== "all" && row.event_type !== filter) return;
          if (search.trim()) {
            const s = search.trim().toLowerCase();
            const hay = `${row.command ?? ""} ${row.target ?? ""} ${row.user_email ?? ""}`.toLowerCase();
            if (!hay.includes(s)) return;
          }
          if (page === 0) {
            setRows((prev) => [row, ...prev].slice(0, PAGE_SIZE));
          }
          setTotal((t) => t + 1);
        },
      },
    ],
    [live, filter, search, page]
  );

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const reasons = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows) {
      if (r.event_type !== "command_blocked") continue;
      const reason = (r.details as any)?.error ?? (r.details as any)?.reason ?? r.result ?? "unknown";
      map.set(reason, (map.get(reason) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [rows]);

  const exportData = async (format: "csv" | "json") => {
    let q: any = (supabase.from("terminal_audit_log" as never) as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(2000);
    if (filter !== "all") q = q.eq("event_type", filter);
    if (search.trim()) {
      const s = `%${search.trim()}%`;
      q = q.or(`command.ilike.${s},target.ilike.${s},user_email.ilike.${s}`);
    }
    const { data, error } = await q;
    if (error || !data) { toast.error(`Export failed: ${error?.message ?? "no data"}`); return; }
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    if (format === "json") {
      downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }), `terminal-audit-${ts}.json`);
    } else {
      const headers = ["created_at","user_email","event_type","command","target","result","severity","details"];
      const csv = [headers.join(",")]
        .concat((data as AuditRow[]).map((r) => headers.map((h) => csvCell((r as any)[h])).join(",")))
        .join("\n");
      downloadBlob(new Blob([csv], { type: "text/csv" }), `terminal-audit-${ts}.csv`);
    }
    toast.success(`Exported ${(data as any).length} events as ${format.toUpperCase()}`);
  };


  return (
    <div className="bg-card border border-border/50 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-sm font-mono font-semibold text-foreground flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-primary" />
          Terminal Audit Log
          <Badge variant="secondary" className="text-[9px]">admin only</Badge>
          {live && (
            <Badge variant="default" className="text-[9px] gap-1">
              <Radio className="w-2.5 h-2.5 animate-pulse" /> LIVE
            </Badge>
          )}
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-3 h-3 text-muted-foreground" />
          <select
            value={filter}
            onChange={(e) => { setPage(0); setFilter(e.target.value); }}
            className="bg-muted/20 border border-border/50 rounded px-2 py-1 text-[11px] font-mono"
          >
            <option value="all">All events</option>
            <option value="real_command">Real commands</option>
            <option value="threshold_breach">Threshold breaches</option>
            <option value="rate_limit">Rate limit</option>
            <option value="command_blocked">Blocked</option>
          </select>
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => { setPage(0); setSearch(e.target.value); }}
              placeholder="search command/target/user…"
              className="h-7 pl-7 text-[11px] font-mono w-52"
            />
          </div>
          <Button size="sm" variant={live ? "default" : "outline"} onClick={() => setLive(!live)} className="text-[11px] gap-1">
            <Radio className="w-3 h-3" /> {live ? "Live" : "Paused"}
          </Button>
          <Button size="sm" variant="outline" onClick={load} className="text-[11px] gap-1">
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button size="sm" variant="outline" onClick={() => exportData("csv")} className="text-[11px] gap-1">
            <Download className="w-3 h-3" /> CSV
          </Button>
          <Button size="sm" variant="outline" onClick={() => exportData("json")} className="text-[11px] gap-1">
            <Download className="w-3 h-3" /> JSON
          </Button>
        </div>
      </div>

      {/* Quick filter chips */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        {[
          { v: "all", label: "All" },
          { v: "real_command", label: "Real commands" },
          { v: "command_blocked", label: "Blocked" },
          { v: "rate_limit", label: "Rate limit" },
          { v: "threshold_breach", label: "Thresholds" },
        ].map((c) => (
          <button
            key={c.v}
            onClick={() => { setPage(0); setFilter(c.v); }}
            className={`text-[10px] font-mono px-2 py-0.5 rounded-full border transition-colors ${
              filter === c.v
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Validation rejection reasons summary (visible when blocked events present) */}
      {reasons.length > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-warning/5 border border-warning/30">
          <div className="flex items-center gap-2 mb-2">
            <AlertOctagon className="w-3.5 h-3.5 text-warning" />
            <span className="text-[11px] font-mono font-semibold text-foreground">
              Top validation rejection reasons (current page)
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {reasons.map(([reason, n]) => (
              <Badge key={reason} variant="secondary" className="text-[10px] font-mono">
                {reason} <span className="ml-1 text-warning">×{n}</span>
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-[11px] font-mono">
          <thead className="text-muted-foreground border-b border-border/50">
            <tr>
              <th className="text-left py-2 px-2">Time</th>
              <th className="text-left py-2 px-2">User</th>
              <th className="text-left py-2 px-2">Event</th>
              <th className="text-left py-2 px-2">Command</th>
              <th className="text-left py-2 px-2">Target</th>
              <th className="text-left py-2 px-2">Result</th>
              <th className="text-left py-2 px-2">Sev</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-6 text-muted-foreground">
                  No audit events match.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-border/20 hover:bg-muted/5">
                  <td className="py-1.5 px-2 text-muted-foreground whitespace-nowrap">
                    {new Date(r.created_at).toLocaleTimeString()}
                  </td>
                  <td className="py-1.5 px-2 truncate max-w-[140px]">{r.user_email ?? "—"}</td>
                  <td className="py-1.5 px-2 text-primary">{r.event_type}</td>
                  <td className="py-1.5 px-2 truncate max-w-[160px]">{r.command ?? "—"}</td>
                  <td className="py-1.5 px-2 truncate max-w-[140px]">{r.target ?? "—"}</td>
                  <td className="py-1.5 px-2">{r.result ?? "—"}</td>
                  <td className="py-1.5 px-2">
                    <Badge variant={sevColor(r.severity) as any} className="text-[8px]">
                      {r.severity}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
        <span className="text-[10px] font-mono text-muted-foreground">
          Page {page + 1} of {totalPages} — {total} total events
        </span>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} className="h-7 px-2">
            <ChevronLeft className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} className="h-7 px-2">
            <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TerminalAuditLogViewer;
