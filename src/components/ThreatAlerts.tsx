import { motion } from "framer-motion";
import { AlertTriangle, ShieldAlert, Bug, Skull, Clock } from "lucide-react";

type Severity = "critical" | "high" | "medium" | "low";

const severityConfig: Record<Severity, { bg: string; dot: string }> = {
  critical: { bg: "border-destructive/20 bg-destructive/5", dot: "bg-destructive" },
  high: { bg: "border-destructive/10 bg-destructive/3", dot: "bg-destructive/70" },
  medium: { bg: "border-warning/15 bg-warning/5", dot: "bg-warning" },
  low: { bg: "border-primary/15 bg-primary/5", dot: "bg-primary/60" },
};

const alerts = [
  { time: "14:32:07", severity: "critical" as Severity, source: "Network", message: "DDoS attack pattern detected — 10,000+ SYN packets/s from 45.33.x.x", icon: Skull },
  { time: "14:31:52", severity: "high" as Severity, source: "Web", message: "SQL Injection attempt on /api/login — blocked by ModSecurity", icon: ShieldAlert },
  { time: "14:31:28", severity: "medium" as Severity, source: "System", message: "Unauthorized file modification detected: /etc/passwd", icon: Bug },
  { time: "14:30:45", severity: "critical" as Severity, source: "Network", message: "Port scan detected from 192.168.1.105 — 1,200 ports in 30s", icon: AlertTriangle },
  { time: "14:29:11", severity: "low" as Severity, source: "System", message: "New USB device connected on host workstation-07", icon: Bug },
  { time: "14:28:33", severity: "high" as Severity, source: "Web", message: "XSS payload detected in search parameter — request dropped", icon: ShieldAlert },
];

const ThreatAlerts = () => (
  <section id="alerts" className="py-24 relative">
    <div className="absolute inset-0 bg-gradient-to-b from-card/30 via-transparent to-card/30" />
    <div className="container mx-auto px-6 relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-16"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
          <span className="font-mono text-[10px] tracking-[0.3em] text-destructive/60 uppercase">Live Feed</span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
        </div>
        <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground text-center mb-4 tracking-tight">
          Threat <span className="text-destructive">Alerts</span>
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto text-center">
          Real-time correlated events from all security layers, prioritized by severity.
        </p>
      </motion.div>

      <div className="max-w-4xl mx-auto space-y-2.5">
        {alerts.map((a, i) => {
          const config = severityConfig[a.severity];
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className={`group flex items-start gap-4 p-4 rounded-xl border ${config.bg} backdrop-blur-sm hover:scale-[1.01] transition-transform duration-300`}
            >
              {/* Severity dot */}
              <div className="flex flex-col items-center gap-2 pt-1">
                <div className={`w-2 h-2 rounded-full ${config.dot} animate-pulse`} />
                <a.icon className="w-4 h-4 text-muted-foreground" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="font-mono text-[10px] text-muted-foreground/70 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {a.time}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    a.severity === "critical" ? "text-destructive" : 
                    a.severity === "high" ? "text-destructive/70" :
                    a.severity === "medium" ? "text-warning" : "text-primary/70"
                  }`}>
                    {a.severity}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-secondary/60 text-secondary-foreground border border-border/30">
                    {a.source}
                  </span>
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

export default ThreatAlerts;
