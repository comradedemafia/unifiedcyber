import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ShieldAlert, Bug, Skull, Clock, Filter } from "lucide-react";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import { supabase } from "@/integrations/supabase/client";

type Severity = "critical" | "high" | "medium" | "low";

interface Alert {
  id: string;
  createdAt: string;
  alertType: string;
  severity: Severity;
  source: string;
  message: string;
  sourceIp?: string;
  metadata: Record<string, any> | null;
}

const severityConfig: Record<Severity, { bg: string; dot: string; text: string }> = {
  critical: { bg: "border-destructive/20 bg-destructive/5", dot: "bg-destructive", text: "text-destructive" },
  high: { bg: "border-destructive/10 bg-destructive/3", dot: "bg-destructive/70", text: "text-destructive/70" },
  medium: { bg: "border-warning/15 bg-warning/5", dot: "bg-warning", text: "text-warning" },
  low: { bg: "border-primary/15 bg-primary/5", dot: "bg-primary/60", text: "text-primary/70" },
};

const iconBySeverity: Record<Severity, typeof Skull> = {
  critical: Skull,
  high: ShieldAlert,
  medium: Bug,
  low: AlertTriangle,
};

const normalizeAlert = (row: any): Alert => {
  const severity = (row.severity || "medium") as Severity;
  const source = row.metadata?.usb_device
    ? "USB"
    : row.metadata?.endpoint_compromise
    ? "Endpoint"
    : row.alert_type || "System";

  return {
    id: row.id,
    createdAt: row.created_at,
    alertType: row.alert_type || "Detection",
    severity,
    source,
    message: row.message || "Threat event detected.",
    sourceIp: row.source_ip || undefined,
    metadata: row.metadata || null,
  };
};

const LiveThreatFeed = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<Severity | "all">("all");
  const [loading, setLoading] = useState(true);

  const loadAlerts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("threat_alerts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("LiveThreatFeed load failed", error);
      setAlerts([]);
    } else {
      setAlerts((data || []).map(normalizeAlert));
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  useSupabaseRealtime(
    "live-threat-feed",
    [
      {
        event: "INSERT",
        schema: "public",
        table: "threat_alerts",
        callback: (payload) => {
          if (!payload?.new) return;
          setAlerts((prev) => [normalizeAlert(payload.new), ...prev].slice(0, 20));
        },
      },
    ],
    []
  );

  const filtered = filter === "all" ? alerts : alerts.filter((a) => a.severity === filter);

  return (
    <section id="alerts" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-card/30 via-transparent to-card/30" />
      <div className="container mx-auto px-6 relative">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="font-mono text-[10px] tracking-[0.3em] text-destructive uppercase flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-destructive inline-block" />
              Live Feed
            </motion.span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground text-center mb-4 tracking-tight">
            Threat <span className="text-destructive">Alerts</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-center">
            Real-time correlated events from all security layers. New threats appear automatically when the system detects them.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            {(["all", "critical", "high", "medium", "low"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`text-[10px] font-mono px-3 py-1.5 rounded-full border transition-all ${
                  filter === s
                    ? "bg-primary/15 text-primary border-primary/30"
                    : "bg-card/50 text-muted-foreground border-border/40 hover:border-border"
                }`}
              >
                {s.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="text-xs text-muted-foreground">
            {loading ? "Loading live alerts…" : `${filtered.length} recent alert${filtered.length === 1 ? "" : "s"}`}
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-border/50 bg-card/60 p-8 text-center text-sm text-muted-foreground">
              {loading ? "Connecting to live alert stream…" : "No live threat alerts have arrived yet."}
            </div>
          ) : (
            filtered.map((a) => {
              const config = severityConfig[a.severity];
              const Icon = iconBySeverity[a.severity];
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, x: -30, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: "auto" }}
                  transition={{ duration: 0.3 }}
                  className={`group flex items-start gap-4 p-4 rounded-xl border ${config.bg} backdrop-blur-sm cursor-pointer hover:scale-[1.005] transition-transform duration-200`}
                >
                  <div className="flex flex-col items-center gap-2 pt-1">
                    <motion.div
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className={`w-2 h-2 rounded-full ${config.dot}`}
                    />
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="font-mono text-[10px] text-muted-foreground/70 flex items-center gap-1">
                        <Clock className="w-3 h-3" />{new Date(a.createdAt).toLocaleTimeString("en-US", { hour12: false })}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${config.text}`}>{a.severity}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-secondary/60 text-secondary-foreground border border-border/30">{a.source}</span>
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed">{a.message}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-muted-foreground font-mono">
                      <span>{a.alertType}</span>
                      {a.sourceIp && <span>{a.sourceIp}</span>}
                      {a.metadata?.usb_device && <span>USB: {String(a.metadata.usb_device)}</span>}
                      {a.metadata?.endpoint && <span>Endpoint: {String(a.metadata.endpoint)}</span>}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};

export default LiveThreatFeed;
