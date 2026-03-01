import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ShieldAlert, Bug, Skull, Clock, Pause, Play, Filter } from "lucide-react";

type Severity = "critical" | "high" | "medium" | "low";

interface Alert {
  id: number;
  time: string;
  severity: Severity;
  source: string;
  message: string;
  icon: typeof Skull;
}

const severityConfig: Record<Severity, { bg: string; dot: string; text: string }> = {
  critical: { bg: "border-destructive/20 bg-destructive/5", dot: "bg-destructive", text: "text-destructive" },
  high: { bg: "border-destructive/10 bg-destructive/3", dot: "bg-destructive/70", text: "text-destructive/70" },
  medium: { bg: "border-warning/15 bg-warning/5", dot: "bg-warning", text: "text-warning" },
  low: { bg: "border-primary/15 bg-primary/5", dot: "bg-primary/60", text: "text-primary/70" },
};

const alertTemplates = [
  { severity: "critical" as Severity, source: "Network", messages: [
    "DDoS attack pattern — 12,000+ SYN packets/s from 45.33.x.x",
    "Port scan from 10.0.0.55 — 2,400 ports in 15s",
    "DNS exfiltration detected — base64 encoded TXT queries",
  ], icon: Skull },
  { severity: "high" as Severity, source: "Web", messages: [
    "SQL Injection on /api/users — blocked by ModSecurity",
    "XSS payload in search parameter — request dropped",
    "Path traversal attempt: /../../etc/passwd — WAF rule triggered",
    "CSRF token mismatch on /api/transfer — request rejected",
  ], icon: ShieldAlert },
  { severity: "medium" as Severity, source: "System", messages: [
    "Unauthorized file modification: /etc/shadow",
    "Failed sudo attempt by user 'guest' — 5 retries",
    "Rootkit signature detected in /tmp/.hidden",
    "Cron job modified: suspicious schedule added",
  ], icon: Bug },
  { severity: "low" as Severity, source: "System", messages: [
    "New USB device connected on workstation-07",
    "User 'admin' logged in from new IP 10.0.1.22",
    "Package update available: openssh-server 9.6p1",
  ], icon: AlertTriangle },
];

const generateAlert = (id: number): Alert => {
  const template = alertTemplates[Math.floor(Math.random() * alertTemplates.length)];
  const message = template.messages[Math.floor(Math.random() * template.messages.length)];
  const now = new Date();
  return {
    id,
    time: now.toLocaleTimeString("en-US", { hour12: false }),
    severity: template.severity,
    source: template.source,
    message,
    icon: template.icon,
  };
};

const LiveThreatFeed = () => {
  const [alerts, setAlerts] = useState<Alert[]>(() =>
    Array.from({ length: 6 }, (_, i) => generateAlert(i))
  );
  const [paused, setPaused] = useState(false);
  const [filter, setFilter] = useState<Severity | "all">("all");
  const counterRef = useRef(6);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      counterRef.current += 1;
      setAlerts((prev) => [generateAlert(counterRef.current), ...prev].slice(0, 20));
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, [paused]);

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
            Real-time correlated events from all security layers. New threats appear automatically.
          </p>
        </motion.div>

        {/* Controls */}
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
          <button
            onClick={() => setPaused((p) => !p)}
            className="flex items-center gap-1.5 text-[10px] font-mono px-3 py-1.5 rounded-full border border-border/40 text-muted-foreground hover:text-foreground hover:border-border transition-all"
          >
            {paused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            {paused ? "RESUME" : "PAUSE"}
          </button>
        </div>

        <div className="max-w-4xl mx-auto space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {filtered.map((a) => {
            const config = severityConfig[a.severity];
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
                  <a.icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="font-mono text-[10px] text-muted-foreground/70 flex items-center gap-1">
                      <Clock className="w-3 h-3" />{a.time}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${config.text}`}>{a.severity}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-secondary/60 text-secondary-foreground border border-border/30">{a.source}</span>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed">{a.message}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LiveThreatFeed;
