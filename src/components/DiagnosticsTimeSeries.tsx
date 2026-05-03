import { useEffect, useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";
import { useRealtimeStatus, type ChannelHistoryEntry } from "@/utils/realtimeStatus";
import { TrendingUp } from "lucide-react";

interface Props {
  channelFilter: string;
  eventFilter: string;
  schemaFilter: string;
  tableFilter: string;
  fromTs?: number;
  toTs?: number;
  bucketSec?: number;
}

const DiagnosticsTimeSeries = ({
  channelFilter, eventFilter, schemaFilter, tableFilter, fromTs, toTs, bucketSec = 60,
}: Props) => {
  const { csp, history, channels } = useRealtimeStatus();
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((t) => t + 1), 5000);
    return () => clearInterval(id);
  }, []);

  const matchHistory = (h: ChannelHistoryEntry) => {
    if (channelFilter !== "all" && h.channel !== channelFilter) return false;
    if (eventFilter && !(h.filter?.event ?? "").toLowerCase().includes(eventFilter.toLowerCase())) return false;
    if (schemaFilter && !(h.filter?.schema ?? "").toLowerCase().includes(schemaFilter.toLowerCase())) return false;
    if (tableFilter && !(h.filter?.table ?? "").toLowerCase().includes(tableFilter.toLowerCase())) return false;
    return true;
  };

  const data = useMemo(() => {
    const now = Date.now();
    const start = fromTs ?? now - 30 * 60_000;
    const end = toTs ?? now;
    const bucketMs = bucketSec * 1000;
    const buckets = Math.max(1, Math.ceil((end - start) / bucketMs));
    const out: { t: string; csp: number; polling: number; ws: number }[] = [];

    // Build channel state-time map from history
    const filteredHist = history.filter(matchHistory).sort((a, b) => a.at - b.at);

    for (let i = 0; i < buckets; i++) {
      const bStart = start + i * bucketMs;
      const bEnd = bStart + bucketMs;
      const cspCount = csp.filter((v) => v.at >= bStart && v.at < bEnd).length;

      // Determine per-channel mode at bucket midpoint, count polling/ws
      const mid = bStart + bucketMs / 2;
      let polling = 0, ws = 0;
      const channelNames = channelFilter === "all"
        ? Array.from(new Set([...Object.keys(channels), ...history.map((h) => h.channel)]))
        : [channelFilter];

      for (const name of channelNames) {
        const lastBefore = [...filteredHist].reverse().find((h) => h.channel === name && h.at <= mid);
        const mode = lastBefore?.mode ?? channels[name]?.mode;
        if (mode === "polling") polling++;
        else if (mode === "websocket") ws++;
      }

      out.push({
        t: new Date(bStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        csp: cspCount,
        polling,
        ws,
      });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [csp, history, channels, channelFilter, eventFilter, schemaFilter, tableFilter, fromTs, toTs, bucketSec]);

  return (
    <div className="rounded-lg border border-border bg-card/50 backdrop-blur-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" /> Diagnostics Time-Series
        </h3>
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          {bucketSec}s buckets · {data.length} pts
        </span>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis dataKey="t" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                fontSize: 11,
                fontFamily: "monospace",
              }}
            />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Line type="monotone" dataKey="csp" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} name="CSP violations" />
            <Line type="monotone" dataKey="polling" stroke="hsl(var(--warning))" strokeWidth={2} dot={false} name="Channels polling" />
            <Line type="monotone" dataKey="ws" stroke="hsl(var(--success))" strokeWidth={2} dot={false} name="Channels WebSocket" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DiagnosticsTimeSeries;
