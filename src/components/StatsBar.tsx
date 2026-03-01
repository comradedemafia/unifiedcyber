import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, AlertTriangle, Activity, Zap } from "lucide-react";

const StatsBar = () => {
  const [stats, setStats] = useState({
    blocked: 12847,
    alerts: 23,
    events: 1429,
    response: 1.8,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => ({
        blocked: prev.blocked + Math.floor(Math.random() * 5),
        alerts: Math.max(0, prev.alerts + (Math.random() > 0.6 ? 1 : Math.random() > 0.3 ? 0 : -1)),
        events: 1200 + Math.floor(Math.random() * 600),
        response: Math.round((1.2 + Math.random() * 1.5) * 10) / 10,
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const items = [
    { label: "Threats Blocked", value: stats.blocked.toLocaleString(), icon: Shield, accent: "text-success" },
    { label: "Active Alerts", value: String(stats.alerts), icon: AlertTriangle, accent: "text-warning" },
    { label: "Events / Min", value: stats.events.toLocaleString(), icon: Activity, accent: "text-primary" },
    { label: "Response Time", value: `${stats.response}s`, icon: Zap, accent: "text-accent" },
  ];

  return (
    <section className="relative py-8 border-y border-border/50 bg-card/40 backdrop-blur-md">
      <div className="absolute inset-0 bg-dots opacity-10" />
      <div className="container mx-auto px-6 relative">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {items.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-4 group"
            >
              <s.icon className={`w-7 h-7 ${s.accent} shrink-0`} />
              <div>
                <motion.p
                  key={s.value}
                  initial={{ opacity: 0.5, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-mono text-2xl md:text-3xl font-bold text-foreground tracking-tight"
                >
                  {s.value}
                </motion.p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mt-0.5">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsBar;
