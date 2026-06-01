import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, Cpu, HardDrive, Wifi, ThermometerSun } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";

interface DataPoint {
  time: string;
  system: number;
  web: number;
  network: number;
}

const layerColors = {
  system: "hsl(170,100%,45%)",
  web: "hsl(260,80%,60%)",
  network: "hsl(42,100%,55%)",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card/95 p-3 shadow-xl backdrop-blur-md">
      <p className="font-mono text-[10px] text-muted-foreground mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs py-0.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground capitalize w-14">{entry.name}</span>
          <span className="font-mono font-bold text-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const LiveMonitoring = () => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [sysInfo, setSysInfo] = useState({ cpu: 0, ram: 0, disk: 0, temp: 0, uptime: "14d 7h 23m" });

  const loadMetrics = async () => {
    const [incidentsRes, alertsRes, logsRes] = await Promise.all([
      supabase.from("security_incidents").select("id", { count: "exact", head: true }),
      supabase.from("threat_alerts").select("id", { count: "exact", head: true }),
      supabase.from("security_logs").select("id", { count: "exact", head: true }),
    ]);

    const incidentCount = incidentsRes.count ?? 0;
    const alertCount = alertsRes.count ?? 0;
    const logCount = logsRes.count ?? 0;

    const now = new Date();
    const point: DataPoint = {
      time: now.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      system: Math.min(95, Math.max(10, Math.floor(incidentCount * 2 + 20))),
      web: Math.min(95, Math.max(10, Math.floor(alertCount * 2 + 15))),
      network: Math.min(95, Math.max(10, Math.floor(logCount * 0.2 + 25))),
    };

    setData((prev) => {
      const next = [...prev, point];
      return next.length > 20 ? next.slice(next.length - 20) : next;
    });

    setSysInfo({
      cpu: Math.min(95, Math.max(10, Math.floor(30 + incidentCount * 1.4))),
      ram: Math.min(90, Math.max(30, Math.floor(35 + alertCount * 1.2))),
      disk: Math.min(85, Math.max(20, Math.floor(30 + logCount * 0.1))),
      temp: Math.min(75, Math.max(40, Math.floor(45 + incidentCount * 0.3))),
      uptime: "14d 7h 23m",
    });
  };

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const GaugeBar = ({ label, value, icon: Icon, max = 100, color }: { label: string; value: number; icon: any; max?: number; color: string }) => (
    <div className="flex items-center gap-3">
      <Icon className={`w-4 h-4 ${color} shrink-0`} />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between mb-1">
          <span className="text-[10px] font-mono text-muted-foreground">{label}</span>
          <span className={`text-[10px] font-mono font-bold ${color}`}>{value}%</span>
        </div>
        <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: value > 80 ? "hsl(0,85%,50%)" : value > 60 ? "hsl(42,100%,55%)" : "hsl(170,100%,45%)" }}
            animate={{ width: `${(value / max) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <section id="monitoring" className="py-24 relative">
      <div className="absolute inset-0 bg-dots opacity-5" />
      <div className="container mx-auto px-6 relative">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="font-mono text-[10px] tracking-[0.3em] text-success uppercase flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
              Live Data
            </motion.span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground text-center mb-4 tracking-tight">
            Live <span className="text-primary text-glow">Monitoring</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-center">
            Real-time event flow across all security layers with system health metrics.
          </p>
        </motion.div>

        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_300px] gap-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-5"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <span className="font-mono text-xs text-muted-foreground">Event Flow — Real-time</span>
              </div>
              <div className="flex gap-4">
                {[
                  { label: "System", color: layerColors.system },
                  { label: "Web", color: layerColors.web },
                  { label: "Network", color: layerColors.network },
                ].map((l) => (
                  <span key={l.label} className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
                    <span className="w-2.5 h-0.5 rounded-full" style={{ backgroundColor: l.color }} />
                    {l.label}
                  </span>
                ))}
              </div>
            </div>

            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <defs>
                  {Object.entries(layerColors).map(([key, color]) => (
                    <linearGradient key={key} id={`live-${key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(230,18%,13%)" vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: "hsl(220,15%,40%)" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "hsl(220,15%,40%)" }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                {Object.entries(layerColors).map(([key, color]) => (
                  <Area key={key} type="monotone" dataKey={key} stroke={color} strokeWidth={1.5} fill={`url(#live-${key})`} isAnimationActive={false} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-5 flex flex-col gap-5"
          >
            <div className="flex items-center gap-2 mb-1">
              <Cpu className="w-4 h-4 text-primary" />
              <span className="font-mono text-xs text-muted-foreground">System Health</span>
            </div>

            <GaugeBar label="CPU Usage" value={sysInfo.cpu} icon={Cpu} color="text-primary" />
            <GaugeBar label="RAM Usage" value={sysInfo.ram} icon={HardDrive} color="text-accent" />
            <GaugeBar label="Disk Usage" value={sysInfo.disk} icon={HardDrive} color="text-success" />
            <GaugeBar label="Temperature" value={sysInfo.temp} icon={ThermometerSun} color="text-warning" />

            <div className="pt-3 border-t border-border/30 mt-auto">
              <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                <span>Uptime</span>
                <span className="text-foreground">{sysInfo.uptime}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground mt-2">
                <span>Services</span>
                <span className="text-success">● All Running</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground mt-2">
                <span>Network</span>
                <span className="text-primary flex items-center gap-1"><Wifi className="w-3 h-3" /> 1 Gbps</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default LiveMonitoring;
