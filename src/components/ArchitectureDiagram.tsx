import { motion } from "framer-motion";
import { Monitor, Globe, Wifi, Server, ArrowDown, Database, Bell, ShieldCheck } from "lucide-react";

const ArchitectureDiagram = () => (
  <section id="architecture" className="py-24 relative">
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
          <span className="font-mono text-[10px] tracking-[0.3em] text-accent/60 uppercase">System Design</span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
        </div>
        <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground text-center mb-4 tracking-tight">
          Framework <span className="text-accent text-glow-accent">Architecture</span>
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto text-center">
          How the four layers interconnect through centralized log collection, event correlation, and automated response.
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="max-w-4xl mx-auto">
        {/* Source layers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { icon: Monitor, label: "System Layer", sub: "Wazuh / OSSEC", color: "primary" },
            { icon: Globe, label: "Web Layer", sub: "ModSecurity", color: "accent" },
            { icon: Wifi, label: "Network Layer", sub: "Suricata", color: "warning" },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="flex flex-col items-center p-6 rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm text-center hover:border-primary/20 transition-all group"
            >
              <div className="p-3 rounded-lg bg-primary/8 border border-primary/10 mb-3 group-hover:bg-primary/15 transition-all">
                <item.icon className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-display font-semibold text-foreground text-sm">{item.label}</h4>
              <p className="font-mono text-[10px] text-muted-foreground mt-1">{item.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Connector arrows */}
        <div className="flex justify-center my-4 gap-16">
          {[0, 1, 2].map((i) => (
            <motion.div key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 + i * 0.1 }}>
              <ArrowDown className="w-5 h-5 text-primary/30" />
            </motion.div>
          ))}
        </div>

        {/* Log Collection */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="p-5 rounded-xl border border-primary/15 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 text-center mb-4"
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <Database className="w-4 h-4 text-primary/60" />
            <p className="font-mono text-sm text-primary font-semibold tracking-wider">LOG COLLECTION & NORMALIZATION</p>
          </div>
          <p className="text-[11px] text-muted-foreground">Syslog, Filebeat, API agents → Unified format</p>
        </motion.div>

        <div className="flex justify-center my-4">
          <ArrowDown className="w-5 h-5 text-primary/30" />
        </div>

        {/* Central SIEM */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="p-8 rounded-xl border border-primary/25 bg-card box-glow text-center mb-4 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          <div className="relative">
            <Server className="w-10 h-10 text-primary mx-auto mb-3" />
            <h4 className="text-xl font-display font-bold text-foreground">Central Management (SIEM)</h4>
            <p className="font-mono text-[11px] text-muted-foreground mt-1.5">Wazuh Manager + ELK Stack (Elasticsearch, Logstash, Kibana)</p>
            <div className="flex flex-wrap justify-center gap-2.5 mt-5">
              {["Event Correlation", "Rule Engine", "Dashboard", "Automated Response"].map((f) => (
                <span key={f} className="text-[10px] font-mono px-3 py-1.5 rounded-full bg-primary/8 text-primary border border-primary/15">
                  {f}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="flex justify-center my-4">
          <ArrowDown className="w-5 h-5 text-primary/30" />
        </div>

        {/* Output */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Real-time Alerts", icon: Bell },
            { label: "Incident Reports", icon: ShieldCheck },
            { label: "Automated Blocking", icon: ShieldCheck },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.7 + i * 0.1 }}
              className="p-4 rounded-xl border border-success/15 bg-success/5 text-center"
            >
              <item.icon className="w-4 h-4 text-success mx-auto mb-1.5" />
              <p className="font-display font-semibold text-sm text-success">{item.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  </section>
);

export default ArchitectureDiagram;
