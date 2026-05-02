import { motion, AnimatePresence } from "framer-motion";
import { Activity, Wifi, WifiOff, RefreshCw, ShieldAlert, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useRealtimeStatus,
  clearCspViolations,
  type RealtimeMode,
} from "@/utils/realtimeStatus";

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

/**
 * Diagnostics panel: realtime channel status (mode + last update + retry)
 * plus a live feed of CSP violations captured by globalErrorReporter.
 */
const RealtimeDiagnostics = () => {
  const { channels, csp } = useRealtimeStatus();
  const channelList = Object.values(channels);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      {/* Realtime status */}
      <div className="rounded-lg border border-border bg-card/50 backdrop-blur-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Realtime Channels
          </h3>
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            {channelList.length} active
          </span>
        </div>

        {channelList.length === 0 ? (
          <p className="text-xs text-muted-foreground font-mono">No active channels.</p>
        ) : (
          <ul className="space-y-2">
            {channelList.map((c) => {
              const s = modeStyles[c.mode];
              return (
                <li
                  key={c.channel}
                  className="flex items-center justify-between gap-3 text-xs font-mono p-2 rounded border border-border/50 bg-background/30"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant="outline" className={`gap-1 ${s.cls}`}>
                      {s.icon}
                      {s.label}
                    </Badge>
                    <span className="truncate text-foreground">{c.channel}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-muted-foreground hidden sm:inline">
                      {c.firstPayloadAt ? "✓ healthy" : "awaiting data"}
                    </span>
                    <span className="text-muted-foreground">{fmtTime(c.lastUpdate)}</span>
                    {c.retry && c.mode !== "websocket" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={c.retry}
                        className="h-6 px-2 text-[10px] gap-1"
                        title="Retry WebSocket without reload"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Retry
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
              {csp.length} captured
            </span>
            {csp.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={clearCspViolations}
                className="h-6 px-2 text-[10px] gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {csp.length === 0 ? (
          <p className="text-xs text-muted-foreground font-mono">
            No CSP violations detected. ✓
          </p>
        ) : (
          <ul className="space-y-1.5 max-h-48 overflow-y-auto">
            <AnimatePresence initial={false}>
              {csp.map((v) => (
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
  );
};

export default RealtimeDiagnostics;
