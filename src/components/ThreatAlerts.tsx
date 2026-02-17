import { motion } from "framer-motion";
import { AlertTriangle, ShieldAlert, Bug, Skull } from "lucide-react";

type Severity = "critical" | "high" | "medium" | "low";

const severityStyles: Record<Severity, string> = {
  critical: "bg-destructive/10 text-destructive border-destructive/30",
  high: "bg-destructive/5 text-destructive/80 border-destructive/20",
  medium: "bg-warning/10 text-warning border-warning/30",
  low: "bg-primary/10 text-primary border-primary/30",
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
  <section id="alerts" className="py-20 bg-card/30">
    <div className="container mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-14"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
          Live Threat <span className="text-destructive">Alerts</span>
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Real-time correlated events from all security layers, prioritized by severity.
        </p>
      </motion.div>

      <div className="max-w-4xl mx-auto space-y-3">
        {alerts.map((a, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className={`flex items-start gap-4 p-4 rounded-md border ${severityStyles[a.severity]} backdrop-blur-sm`}
          >
            <a.icon className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <span className="font-mono text-xs opacity-70">{a.time}</span>
                <span className="text-xs font-semibold uppercase tracking-wider">{a.severity}</span>
                <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-secondary/50 text-secondary-foreground">{a.source}</span>
              </div>
              <p className="text-sm leading-relaxed">{a.message}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default ThreatAlerts;
