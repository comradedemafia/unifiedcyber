import { motion } from "framer-motion";
import { Monitor, Globe, Wifi, Server, ArrowDown, ArrowRight } from "lucide-react";

const ArchitectureDiagram = () => (
  <section id="architecture" className="py-20">
    <div className="container mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-14"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
          Framework <span className="text-primary text-glow">Architecture</span>
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          How the four layers interconnect through centralized log collection, event correlation, and automated response.
        </p>
      </motion.div>

      {/* Diagram */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="max-w-4xl mx-auto"
      >
        {/* Source layers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { icon: Monitor, label: "System Layer", sub: "Wazuh / OSSEC" },
            { icon: Globe, label: "Web Layer", sub: "ModSecurity" },
            { icon: Wifi, label: "Network Layer", sub: "Suricata" },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="flex flex-col items-center p-6 rounded-lg border border-primary/20 bg-card text-center"
            >
              <item.icon className="w-8 h-8 text-primary mb-3" />
              <h4 className="font-semibold text-foreground text-sm">{item.label}</h4>
              <p className="font-mono text-xs text-muted-foreground mt-1">{item.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Arrows down */}
        <div className="flex justify-center gap-4 my-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="text-primary/50 hidden md:block"
              style={{ width: "33.33%", display: "flex", justifyContent: "center" }}
            >
              <ArrowDown className="w-6 h-6" />
            </motion.div>
          ))}
        </div>

        {/* Log Collection */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="p-5 rounded-lg border border-primary/30 bg-primary/5 text-center mb-4"
        >
          <p className="font-mono text-sm text-primary font-semibold tracking-wide">LOG COLLECTION & NORMALIZATION</p>
          <p className="text-xs text-muted-foreground mt-1">Syslog, Filebeat, API agents → Unified format</p>
        </motion.div>

        <div className="flex justify-center my-4">
          <ArrowDown className="w-6 h-6 text-primary/50" />
        </div>

        {/* Central SIEM */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="p-6 rounded-lg border-2 border-primary/40 bg-card box-glow text-center mb-4"
        >
          <Server className="w-10 h-10 text-primary mx-auto mb-3" />
          <h4 className="text-lg font-bold text-foreground">Central Management (SIEM)</h4>
          <p className="font-mono text-xs text-muted-foreground mt-1">Wazuh Manager + ELK Stack (Elasticsearch, Logstash, Kibana)</p>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {["Event Correlation", "Rule Engine", "Dashboard", "Automated Response"].map((f) => (
              <span key={f} className="text-xs font-mono px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {f}
              </span>
            ))}
          </div>
        </motion.div>

        <div className="flex justify-center my-4">
          <ArrowDown className="w-6 h-6 text-primary/50" />
        </div>

        {/* Output */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {["Real-time Alerts", "Incident Reports", "Automated Blocking"].map((item, i) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8 + i * 0.1 }}
              className="p-4 rounded-lg border border-success/20 bg-success/5 text-center"
            >
              <p className="font-semibold text-sm text-success">{item}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  </section>
);

export default ArchitectureDiagram;
