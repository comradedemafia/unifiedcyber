import { motion } from "framer-motion";
import { Shield, AlertTriangle, Activity, Zap, TrendingUp } from "lucide-react";

const stats = [
  { label: "Threats Blocked", value: "12,847", icon: Shield, accent: "text-success" },
  { label: "Active Alerts", value: "23", icon: AlertTriangle, accent: "text-warning" },
  { label: "Events / Min", value: "1,429", icon: Activity, accent: "text-primary" },
  { label: "Response Time", value: "< 2s", icon: Zap, accent: "text-accent" },
];

const StatsBar = () => (
  <section className="relative py-8 border-y border-border/50 bg-card/40 backdrop-blur-md">
    <div className="absolute inset-0 bg-dots opacity-10" />
    <div className="container mx-auto px-6 relative">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="flex items-center gap-4 group"
          >
            <div className="relative">
              <s.icon className={`w-7 h-7 ${s.accent} shrink-0 transition-all group-hover:scale-110`} />
              <div className={`absolute inset-0 ${s.accent} blur-xl opacity-0 group-hover:opacity-20 transition-opacity`} />
            </div>
            <div>
              <p className="font-mono text-2xl md:text-3xl font-bold text-foreground tracking-tight">{s.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mt-0.5">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default StatsBar;
