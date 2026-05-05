import { useEffect, useState } from "react";
import { ScrollText, RefreshCw, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

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

const sevColor = (s: string) =>
  s === "critical" ? "destructive" : s === "warning" ? "default" : "secondary";

const TerminalAuditLogViewer = () => {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    let q: any = (supabase.from("terminal_audit_log" as never) as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (filter !== "all") q = q.eq("event_type", filter);
    const { data } = await q;
    setRows((data as AuditRow[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  return (
    <div className="bg-card border border-border/50 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-sm font-mono font-semibold text-foreground flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-primary" />
          Terminal Audit Log
          <Badge variant="secondary" className="text-[9px]">admin only</Badge>
        </h3>
        <div className="flex items-center gap-2">
          <Filter className="w-3 h-3 text-muted-foreground" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-muted/20 border border-border/50 rounded px-2 py-1 text-[11px] font-mono"
          >
            <option value="all">All events</option>
            <option value="real_command">Real commands</option>
            <option value="threshold_breach">Threshold breaches</option>
            <option value="rate_limit">Rate limit</option>
            <option value="command_blocked">Blocked</option>
          </select>
          <Button size="sm" variant="outline" onClick={load} className="text-[11px] gap-1">
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

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
                  No audit events yet.
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
    </div>
  );
};

export default TerminalAuditLogViewer;
