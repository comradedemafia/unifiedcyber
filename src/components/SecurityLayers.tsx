import { motion } from "framer-motion";
import { Monitor, Globe, Wifi, Server } from "lucide-react";

const layers = [
  {
    title: "System Security",
    desc: "Host-based intrusion detection with Wazuh/OSSEC. File integrity monitoring, rootkit detection, and compliance auditing.",
    icon: Monitor,
    tools: ["Wazuh", "OSSEC", "HIDS"],
    status: "Active",
    events: "4,218",
  },
  {
    title: "Web Application Security",
    desc: "Web application firewall with ModSecurity. Protection against OWASP Top 10 including SQL injection, XSS, and CSRF.",
    icon: Globe,
    tools: ["ModSecurity", "OWASP", "WAF"],
    status: "Active",
    events: "3,891",
  },
  {
    title: "Network Security",
    desc: "Network intrusion detection with Suricata. Deep packet inspection, protocol analysis, and anomaly detection.",
    icon: Wifi,
    tools: ["Suricata", "NIDS", "DPI"],
    status: "Active",
    events: "4,738",
  },
  {
    title: "Central Management",
    desc: "Unified SIEM powered by Wazuh + ELK Stack. Real-time log correlation, automated alerting, and centralized dashboards.",
    icon: Server,
    tools: ["Wazuh", "ELK Stack", "SIEM"],
    status: "Core",
    events: "12,847",
  },
];

const SecurityLayers = () => (
  <section id="dashboard" className="py-20">
    <div className="container mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-14"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
          Four-Layer <span className="text-primary text-glow">Architecture</span>
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Each layer monitors a specific domain while feeding correlated events into the central management platform.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {layers.map((l, i) => (
          <motion.div
            key={l.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="group relative rounded-lg border border-border bg-card p-6 hover:border-primary/40 hover:box-glow transition-all duration-300"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-md bg-primary/10 text-primary">
                  <l.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{l.title}</h3>
              </div>
              <span className="text-xs font-mono px-2 py-1 rounded bg-success/10 text-success">
                {l.status}
              </span>
            </div>

            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{l.desc}</p>

            {/* Tools */}
            <div className="flex flex-wrap gap-2 mb-4">
              {l.tools.map((t) => (
                <span key={t} className="text-xs font-mono px-2 py-1 rounded bg-secondary text-secondary-foreground">
                  {t}
                </span>
              ))}
            </div>

            {/* Events counter */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Events Processed</span>
              <span className="font-mono text-sm font-semibold text-primary">{l.events}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default SecurityLayers;
