import { motion } from "framer-motion";
import { Monitor, Globe, Wifi, Server, ArrowRight } from "lucide-react";

const layers = [
  {
    title: "System Security",
    desc: "Host-based intrusion detection with Wazuh/OSSEC. File integrity monitoring, rootkit detection, and compliance auditing.",
    icon: Monitor,
    tools: ["Wazuh", "OSSEC", "HIDS"],
    events: "4,218",
    gradient: "from-primary/10 to-transparent",
  },
  {
    title: "Web App Security",
    desc: "Web application firewall with ModSecurity. Protection against OWASP Top 10 including SQL injection, XSS, and CSRF.",
    icon: Globe,
    tools: ["ModSecurity", "OWASP", "WAF"],
    events: "3,891",
    gradient: "from-accent/10 to-transparent",
  },
  {
    title: "Network Security",
    desc: "Network intrusion detection with Suricata. Deep packet inspection, protocol analysis, and anomaly detection.",
    icon: Wifi,
    tools: ["Suricata", "NIDS", "DPI"],
    events: "4,738",
    gradient: "from-warning/10 to-transparent",
  },
  {
    title: "Central SIEM",
    desc: "Unified SIEM powered by Wazuh + ELK Stack. Real-time log correlation, automated alerting, and centralized dashboards.",
    icon: Server,
    tools: ["Wazuh", "ELK Stack", "SIEM"],
    events: "12,847",
    gradient: "from-success/10 to-transparent",
  },
];

const SecurityLayers = () => (
  <section id="dashboard" className="py-24 relative">
    <div className="absolute inset-0 bg-dots opacity-5" />
    <div className="container mx-auto px-6 relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-16"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
          <span className="font-mono text-[10px] tracking-[0.3em] text-primary/60 uppercase">Security Layers</span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
        </div>
        <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground text-center mb-4 tracking-tight">
          Four-Layer <span className="text-primary text-glow">Architecture</span>
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto text-center">
          Each layer monitors a specific domain while feeding correlated events into the central management platform.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-5 max-w-5xl mx-auto">
        {layers.map((l, i) => (
          <motion.div
            key={l.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="group relative rounded-xl border border-border/60 bg-card overflow-hidden hover:border-primary/30 transition-all duration-500"
          >
            {/* Gradient accent */}
            <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${l.gradient}`} />

            <div className="p-6">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-primary/8 text-primary border border-primary/10 group-hover:bg-primary/15 group-hover:border-primary/20 transition-all">
                    <l.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-semibold text-foreground">{l.title}</h3>
                    <span className="font-mono text-[10px] text-success/80 tracking-wider">● ACTIVE</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{l.desc}</p>

              <div className="flex flex-wrap gap-1.5 mb-5">
                {l.tools.map((t) => (
                  <span key={t} className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-secondary/80 text-secondary-foreground border border-border/50">
                    {t}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border/40">
                <span className="text-[10px] text-muted-foreground uppercase tracking-[0.15em]">Events Processed</span>
                <span className="font-mono text-sm font-bold text-primary">{l.events}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default SecurityLayers;
