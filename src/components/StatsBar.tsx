import { motion } from "framer-motion";
import { Shield, AlertTriangle, Activity, Zap } from "lucide-react";

const stats = [
  { label: "Threats Blocked", value: "12,847", icon: Shield, color: "text-success" },
  { label: "Active Alerts", value: "23", icon: AlertTriangle, color: "text-warning" },
  { label: "Events / Min", value: "1,429", icon: Activity, color: "text-primary" },
  { label: "Response Time", value: "< 2s", icon: Zap, color: "text-primary" },
];

const StatsBar = () => (
  <section className="py-6 border-y border-border bg-card/50 backdrop-blur-sm">
    <div className="container mx-auto px-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-4"
          >
            <s.icon className={`w-8 h-8 ${s.color} shrink-0`} />
            <div>
              <p className="font-mono text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default StatsBar;
