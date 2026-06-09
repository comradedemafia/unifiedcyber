import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Monitor, Globe, Wifi, Server, X, Shield, Activity, AlertTriangle, CheckCircle } from "lucide-react";

interface LayerDetail {
  title: string;
  desc: string;
  icon: typeof Monitor;
  tools: string[];
  events: number;
  gradient: string;
  details: {
    rulesActive: number;
    alertsToday: number;
    blockedToday: number;
    lastUpdate: string;
    topThreats: string[];
    status: "operational" | "warning" | "critical";
  };
}

const layers: LayerDetail[] = [
  {
    title: "System Security",
    desc: "Host-based intrusion detection with Wazuh/OSSEC. File integrity monitoring, rootkit detection, and compliance auditing.",
    icon: Monitor,
    tools: ["Wazuh", "OSSEC", "HIDS"],
    events: 4218,
    gradient: "from-primary/10 to-transparent",
    details: {
      rulesActive: 1847,
      alertsToday: 156,
      blockedToday: 89,
      lastUpdate: "2 min ago",
      topThreats: ["File integrity violation", "Brute force SSH", "Rootkit detection", "Privilege escalation"],
      status: "operational",
    },
  },
  {
    title: "Web App Security",
    desc: "Web application firewall with ModSecurity. Protection against OWASP Top 10.",
    icon: Globe,
    tools: ["ModSecurity", "OWASP", "WAF"],
    events: 3891,
    gradient: "from-accent/10 to-transparent",
    details: {
      rulesActive: 2340,
      alertsToday: 234,
      blockedToday: 198,
      lastUpdate: "30 sec ago",
      topThreats: ["SQL Injection", "XSS attacks", "CSRF attempts", "Path traversal"],
      status: "operational",
    },
  },
  {
    title: "Network Security",
    desc: "Network intrusion detection with Suricata. Deep packet inspection and anomaly detection.",
    icon: Wifi,
    tools: ["Suricata", "NIDS", "DPI"],
    events: 4738,
    gradient: "from-warning/10 to-transparent",
    details: {
      rulesActive: 34521,
      alertsToday: 312,
      blockedToday: 245,
      lastUpdate: "15 sec ago",
      topThreats: ["Port scanning", "DDoS patterns", "DNS tunneling", "Protocol anomalies"],
      status: "warning",
    },
  },
  {
    title: "Central SIEM",
    desc: "Unified SIEM powered by Wazuh + ELK Stack. Real-time log correlation and automated alerting.",
    icon: Server,
    tools: ["Wazuh", "ELK Stack", "SIEM"],
    events: 12847,
    gradient: "from-success/10 to-transparent",
    details: {
      rulesActive: 38708,
      alertsToday: 702,
      blockedToday: 532,
      lastUpdate: "5 sec ago",
      topThreats: ["Multi-stage attacks", "Lateral movement", "Data exfiltration", "Coordinated scans"],
      status: "operational",
    },
  },
];

const statusConfig = {
  operational: { label: "OPERATIONAL", color: "text-success", dot: "bg-success" },
  warning: { label: "WARNING", color: "text-warning", dot: "bg-warning" },
  critical: { label: "CRITICAL", color: "text-destructive", dot: "bg-destructive" },
};

const SecurityLayers = () => {
  const [selected, setSelected] = useState<LayerDetail | null>(null);
  const [eventCounts, setEventCounts] = useState(() => layers.map((l) => l.events));

  // Live event counter
  useState(() => {
    const interval = setInterval(() => {
      setEventCounts((prev) => prev.map((c) => c + Math.floor(Math.random() * 3)));
    }, 2500);
    return () => clearInterval(interval);
  });

  return (
    <>
      <section id="dashboard" className="py-24 relative">
        <div className="absolute inset-0 bg-dots opacity-5" />
        <div className="container mx-auto px-6 relative">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
              <span className="font-mono text-[10px] tracking-[0.3em] text-primary/60 uppercase">Security Layers</span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground text-center mb-4 tracking-tight">
              Four-Layer <span className="text-primary text-glow">Architecture</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-center">
              Click any layer to view detailed status, active rules, and threat intelligence.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-5 max-w-5xl mx-auto">
            {layers.map((l, i) => (
              <motion.button
                key={l.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setSelected(l)}
                className="group relative rounded-xl border border-border/60 bg-card overflow-hidden hover:border-primary/30 transition-all duration-500 text-left cursor-pointer"
              >
                <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${l.gradient}`} />
                <div className="p-6">
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-primary/8 text-primary border border-primary/10 group-hover:bg-primary/15 group-hover:border-primary/20 group-hover:box-glow transition-all">
                        <l.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-display text-base font-semibold text-foreground">{l.title}</h3>
                        <motion.span
                          animate={{ opacity: [1, 0.5, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className={`font-mono text-[10px] ${statusConfig[l.details.status].color} tracking-wider`}
                        >
                          ● {statusConfig[l.details.status].label}
                        </motion.span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{l.desc}</p>
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {l.tools.map((t) => (
                      <span key={t} className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-secondary/80 text-secondary-foreground border border-border/50">{t}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-border/40">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-[0.15em]">Events Processed</span>
                    <motion.span
                      key={eventCounts[i]}
                      initial={{ opacity: 0.5 }}
                      animate={{ opacity: 1 }}
                      className="font-mono text-sm font-bold text-primary"
                    >
                      {eventCounts[i].toLocaleString()}
                    </motion.span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Detail Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-xl border border-primary/20 bg-card p-6 shadow-2xl box-glow relative"
            >
              <button onClick={() => setSelected(null)} aria-label="Close" className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>


              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-lg bg-primary/10 text-primary border border-primary/15">
                  <selected.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-foreground">{selected.title}</h3>
                  <span className={`font-mono text-[10px] ${statusConfig[selected.details.status].color}`}>
                    ● {statusConfig[selected.details.status].label}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: "Active Rules", value: selected.details.rulesActive.toLocaleString(), icon: Shield },
                  { label: "Alerts Today", value: String(selected.details.alertsToday), icon: AlertTriangle },
                  { label: "Blocked", value: String(selected.details.blockedToday), icon: CheckCircle },
                ].map((stat) => (
                  <div key={stat.label} className="p-3 rounded-lg bg-muted/30 border border-border/30 text-center">
                    <stat.icon className="w-4 h-4 text-primary mx-auto mb-1.5" />
                    <p className="font-mono text-lg font-bold text-foreground">{stat.value}</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="mb-5">
                <h4 className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-3">Top Threats Detected</h4>
                <div className="space-y-1.5">
                  {selected.details.topThreats.map((threat, i) => (
                    <div key={threat} className="flex items-center gap-2 text-sm">
                      <span className="font-mono text-[10px] text-muted-foreground/40">0{i + 1}</span>
                      <span className="text-foreground/80">{threat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground pt-4 border-t border-border/30">
                <span>Last updated: {selected.details.lastUpdate}</span>
                <span className="text-primary">{selected.tools.join(" · ")}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SecurityLayers;
