import { useEffect, useMemo, useRef, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, ReferenceArea, ReferenceLine } from "recharts";
import { toast } from "sonner";
import { useRealtimeStatus, type ChannelHistoryEntry } from "@/utils/realtimeStatus";
import { useThresholds } from "@/utils/diagnosticsThresholds";
import { TrendingUp, AlertTriangle } from "lucide-react";

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
  const thresholds = useThresholds();
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((t) => t + 1), 5000);
    return () => clearInterval(id);
  }, []);
  const lastAlertedBucketRef = useRef<string>("");

  const matchHistory = (h: ChannelHistoryEntry) => {
    if (channelFilter !== "all" && h.channel !== channelFilter) return false;
    if (eventFilter && !(h.filter?.event ?? "").toLowerCase().includes(eventFilter.toLowerCase())) return false;
    if (schemaFilter && !(h.filter?.schema ?? "").toLowerCase().includes(schemaFilter.toLowerCase())) return false;
    if (tableFilter && !(h.filter?.table ?? "").toLowerCase().includes(tableFilter.toLowerCase())) return false;
    return true;
  };

  const { data, hotZones } = useMemo(() => {
    const now = Date.now();
    const start = fromTs ?? now - 30 * 60_000;
    const end = toTs ?? now;
    const bucketMs = bucketSec * 1000;
    const buckets = Math.max(1, Math.ceil((end - start) / bucketMs));
    const out: { t: string; csp: number; polling: number; ws: number; tsStart: number; breached: boolean }[] = [];

    const filteredHist = history.filter(matchHistory).sort((a, b) => a.at - b.at);
    // CSP burst threshold per bucket — scale to bucket window
    const cspPerBucketLimit = Math.max(
      1,
      Math.ceil((thresholds.cspBurstCount * bucketSec) / thresholds.cspBurstWindowSec)
    );
    // Polling-stuck threshold expressed in buckets
    const pollingBucketsLimit = Math.max(1, Math.ceil(thresholds.pollingAlertSec / bucketSec));

    let runningPolling = 0;

    for (let i = 0; i < buckets; i++) {
      const bStart = start + i * bucketMs;
      const bEnd = bStart + bucketMs;
      const cspCount = csp.filter((v) => v.at >= bStart && v.at < bEnd).length;

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

      if (polling > 0) runningPolling++; else runningPolling = 0;

      const breached =
        cspCount >= cspPerBucketLimit ||
        runningPolling >= pollingBucketsLimit;

      out.push({
        t: new Date(bStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        csp: cspCount,
        polling,
        ws,
        tsStart: bStart,
        breached,
      });
    }

    // Compress contiguous breached buckets into highlight zones
    const zones: { from: string; to: string; reason: string }[] = [];
    let zStart = -1;
    for (let i = 0; i < out.length; i++) {
      if (out[i].breached && zStart < 0) zStart = i;
      if ((!out[i].breached || i === out.length - 1) && zStart >= 0) {
        const last = out[i].breached ? i : i - 1;
        const reasons: string[] = [];
        const slice = out.slice(zStart, last + 1);
        if (slice.some((s) => s.csp >= cspPerBucketLimit)) reasons.push("CSP spike");
        if (slice.some((s) => s.polling > 0)) reasons.push("polling stuck");
        zones.push({
          from: out[zStart].t,
          to: out[last].t,
          reason: reasons.join(" + ") || "threshold",
        });
        zStart = -1;
      }
    }

    return { data: out, hotZones: zones };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [csp, history, channels, channelFilter, eventFilter, schemaFilter, tableFilter, fromTs, toTs, bucketSec, thresholds]);

  // Fire a toast when newest bucket newly breaches (debounced by bucket key)
  useEffect(() => {
    const last = data[data.length - 1];
    if (!last || !last.breached) return;
    const key = `${last.tsStart}`;
    if (lastAlertedBucketRef.current === key) return;
    lastAlertedBucketRef.current = key;
    toast.warning("Threshold breached", {
      description: `Window @ ${last.t} — CSP=${last.csp}, polling=${last.polling}`,
      duration: 7000,
    });
  }, [data]);

  return (
    <div className="rounded-lg border border-border bg-card/50 backdrop-blur-sm p-4">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" /> Diagnostics Time-Series
          {hotZones.length > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-destructive/15 text-destructive border border-destructive/30">
              <AlertTriangle className="w-3 h-3" /> {hotZones.length} breach{hotZones.length === 1 ? "" : "es"}
            </span>
          )}
        </h3>
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          {bucketSec}s buckets · {data.length} pts · CSP≥{Math.max(1, Math.ceil((thresholds.cspBurstCount * bucketSec) / thresholds.cspBurstWindowSec))}/bucket · poll≥{thresholds.pollingAlertSec}s
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
            {hotZones.map((z, i) => (
              <ReferenceArea
                key={`hz-${i}`}
                x1={z.from}
                x2={z.to}
                strokeOpacity={0.4}
                stroke="hsl(var(--destructive))"
                fill="hsl(var(--destructive))"
                fillOpacity={0.12}
                label={{ value: z.reason, position: "insideTop", fontSize: 9, fill: "hsl(var(--destructive))" }}
              />
            ))}
            <Line type="monotone" dataKey="csp" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} name="CSP violations" />
            <Line type="monotone" dataKey="polling" stroke="hsl(var(--warning))" strokeWidth={2} dot={false} name="Channels polling" />
            <Line type="monotone" dataKey="ws" stroke="hsl(var(--success))" strokeWidth={2} dot={false} name="Channels WebSocket" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {hotZones.length > 0 && (
        <div className="mt-2 text-[10px] font-mono text-muted-foreground space-y-0.5 max-h-16 overflow-y-auto">
          {hotZones.slice(-3).map((z, i) => (
            <div key={i}>⚠ {z.from} → {z.to}: {z.reason}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DiagnosticsTimeSeries;
