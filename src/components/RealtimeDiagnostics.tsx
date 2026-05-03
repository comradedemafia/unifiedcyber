import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Wifi, WifiOff, RefreshCw, ShieldAlert, Trash2, FileDown, History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  useRealtimeStatus,
  clearCspViolations,
  clearHistory,
  type RealtimeMode,
} from "@/utils/realtimeStatus";
import { exportCspReport } from "@/utils/exportCspReport";
import DiagnosticsTimeSeries from "./DiagnosticsTimeSeries";
import DiagnosticsThresholdSettings from "./DiagnosticsThresholdSettings";

const modeStyles: Record<RealtimeMode, { label: string; cls: string; icon: React.ReactNode }> = {
  connecting: { label: "Connecting", cls: "text-muted-foreground border-border", icon: <Activity className="w-3 h-3 animate-pulse" /> },
  websocket:  { label: "WebSocket",  cls: "text-success border-success/40 bg-success/10", icon: <Wifi className="w-3 h-3" /> },
  polling:    { label: "Polling",    cls: "text-warning border-warning/40 bg-warning/10", icon: <RefreshCw className="w-3 h-3" /> },
  error:      { label: "Error",      cls: "text-destructive border-destructive/40 bg-destructive/10", icon: <WifiOff className="w-3 h-3" /> },
};

const fmtTime = (ts: number | null) => {
  if (!ts) return "—";
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return new Date(ts).toLocaleTimeString();
};

const RealtimeDiagnostics = () => {
  const { channels, csp, history } = useRealtimeStatus();
  const channelList = Object.values(channels);

  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [eventFilter, setEventFilter] = useState<string>("");
  const [tableFilter, setTableFilter] = useState<string>("");
  const [schemaFilter, setSchemaFilter] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [showHistory, setShowHistory] = useState(false);

  const allChannelNames = useMemo(
    () => Array.from(new Set([...channelList.map((c) => c.channel), ...history.map((h) => h.channel)])),
    [channelList, history]
  );

  const filteredChannels = useMemo(
    () =>
      channelList.filter((c) => {
        if (channelFilter !== "all" && c.channel !== channelFilter) return false;
        if (eventFilter && !(c.filter?.event ?? "").toLowerCase().includes(eventFilter.toLowerCase())) return false;
        if (tableFilter && !(c.filter?.table ?? "").toLowerCase().includes(tableFilter.toLowerCase())) return false;
        if (schemaFilter && !(c.filter?.schema ?? "").toLowerCase().includes(schemaFilter.toLowerCase())) return false;
        return true;
      }),
    [channelList, channelFilter, eventFilter, tableFilter, schemaFilter]
  );

  const fromTs = fromDate ? new Date(fromDate).getTime() : undefined;
  const toTs = toDate ? new Date(toDate).getTime() + 86_399_000 : undefined;

  const filteredCsp = useMemo(
    () => csp.filter((v) => (!fromTs || v.at >= fromTs) && (!toTs || v.at <= toTs)),
    [csp, fromTs, toTs]
  );

  const filteredHistory = useMemo(
    () =>
      history.filter(
        (h) =>
          (channelFilter === "all" || h.channel === channelFilter) &&
          (!fromTs || h.at >= fromTs) &&
          (!toTs || h.at <= toTs)
      ),
    [history, channelFilter, fromTs, toTs]
  );

  const handleExport = () => {
    exportCspReport(filteredCsp, filteredHistory, {
      fromTs, toTs,
      channelFilter: channelFilter === "all" ? undefined : channelFilter,
    });
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Filter bar */}
      <div className="rounded-lg border border-border bg-card/50 backdrop-blur-sm p-3 flex flex-wrap gap-2 items-center">
        <select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
          className="h-8 px-2 text-xs font-mono bg-background border border-border rounded"
        >
          <option value="all">All channels</option>
          {allChannelNames.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <Input
          placeholder="event (INSERT…)"
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          className="h-8 w-32 text-xs font-mono"
        />
        <Input
          placeholder="schema"
          value={schemaFilter}
          onChange={(e) => setSchemaFilter(e.target.value)}
          className="h-8 w-28 text-xs font-mono"
        />
        <Input
          placeholder="table"
          value={tableFilter}
          onChange={(e) => setTableFilter(e.target.value)}
          className="h-8 w-32 text-xs font-mono"
        />
        <span className="text-[10px] font-mono text-muted-foreground ml-2">From</span>
        <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-8 w-36 text-xs font-mono" />
        <span className="text-[10px] font-mono text-muted-foreground">To</span>
        <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-8 w-36 text-xs font-mono" />

        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowHistory((v) => !v)} className="h-8 text-xs gap-1">
            <History className="w-3 h-3" /> {showHistory ? "Hide" : "Show"} history
          </Button>
          <Button size="sm" variant="outline" onClick={handleExport} className="h-8 text-xs gap-1">
            <FileDown className="w-3 h-3" /> Export CSP PDF
          </Button>
        </div>
      </div>

      <DiagnosticsThresholdSettings />

      <DiagnosticsTimeSeries
        channelFilter={channelFilter}
        eventFilter={eventFilter}
        schemaFilter={schemaFilter}
        tableFilter={tableFilter}
        fromTs={fromTs}
        toTs={toTs}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Realtime status */}
        <div className="rounded-lg border border-border bg-card/50 backdrop-blur-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Realtime Channels
            </h3>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              {filteredChannels.length}/{channelList.length} shown
            </span>
          </div>

          {filteredChannels.length === 0 ? (
            <p className="text-xs text-muted-foreground font-mono">No channels match filters.</p>
          ) : (
            <ul className="space-y-2">
              {filteredChannels.map((c) => {
                const s = modeStyles[c.mode];
                return (
                  <li key={c.channel} className="flex items-start justify-between gap-3 text-xs font-mono p-2 rounded border border-border/50 bg-background/30">
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`gap-1 ${s.cls}`}>{s.icon}{s.label}</Badge>
                        <span className="truncate text-foreground">{c.channel}</span>
                      </div>
                      {c.filter && (
                        <div className="text-[10px] text-muted-foreground truncate">
                          {c.filter.schema}.{c.filter.table} · {c.filter.event}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-muted-foreground hidden sm:inline">
                        {c.firstPayloadAt ? "✓ healthy" : "awaiting data"}
                      </span>
                      <span className="text-muted-foreground">{fmtTime(c.lastUpdate)}</span>
                      {c.retry && c.mode !== "websocket" && (
                        <Button size="sm" variant="ghost" onClick={c.retry} className="h-6 px-2 text-[10px] gap-1" title="Retry WebSocket">
                          <RefreshCw className="w-3 h-3" /> Retry
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* CSP violations */}
        <div className="rounded-lg border border-border bg-card/50 backdrop-blur-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-warning" />
              CSP Violations
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                {filteredCsp.length}/{csp.length}
              </span>
              {csp.length > 0 && (
                <Button size="sm" variant="ghost" onClick={clearCspViolations} className="h-6 px-2 text-[10px] gap-1">
                  <Trash2 className="w-3 h-3" /> Clear
                </Button>
              )}
            </div>
          </div>

          {filteredCsp.length === 0 ? (
            <p className="text-xs text-muted-foreground font-mono">No CSP violations in range. ✓</p>
          ) : (
            <ul className="space-y-1.5 max-h-48 overflow-y-auto">
              <AnimatePresence initial={false}>
                {filteredCsp.map((v) => (
                  <motion.li
                    key={v.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-xs font-mono p-2 rounded border border-warning/30 bg-warning/5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className="text-warning border-warning/40 text-[10px]">
                        {v.effectiveDirective}
                      </Badge>
                      <span className="text-muted-foreground text-[10px]">
                        {new Date(v.at).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-foreground/80 break-all mt-1">{v.blockedURI}</div>
                    {v.sourceFile && (
                      <div className="text-muted-foreground text-[10px] mt-0.5 truncate">
                        {v.sourceFile}{v.lineNumber ? `:${v.lineNumber}` : ""}
                      </div>
                    )}
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </div>

      {showHistory && (
        <div className="rounded-lg border border-border bg-card/50 backdrop-blur-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              Channel History (persisted)
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-muted-foreground">{filteredHistory.length}/{history.length}</span>
              {history.length > 0 && (
                <Button size="sm" variant="ghost" onClick={clearHistory} className="h-6 px-2 text-[10px] gap-1">
                  <Trash2 className="w-3 h-3" /> Clear
                </Button>
              )}
            </div>
          </div>
          {filteredHistory.length === 0 ? (
            <p className="text-xs text-muted-foreground font-mono">No history in range.</p>
          ) : (
            <ul className="space-y-1 max-h-64 overflow-y-auto">
              {filteredHistory.map((h, i) => {
                const s = modeStyles[h.mode];
                return (
                  <li key={i} className="text-xs font-mono p-2 rounded border border-border/40 bg-background/30 flex items-center gap-3">
                    <span className="text-muted-foreground text-[10px] w-32 shrink-0">{new Date(h.at).toLocaleString()}</span>
                    <Badge variant="outline" className={`gap-1 ${s.cls}`}>{s.icon}{s.label}</Badge>
                    <span className="text-foreground truncate">{h.channel}</span>
                    {h.reason && <span className="text-muted-foreground text-[10px] truncate ml-auto">{h.reason}</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default RealtimeDiagnostics;
