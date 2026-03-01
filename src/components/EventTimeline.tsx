import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const timelineData = [
  { time: "00:00", system: 12, web: 8, network: 15 },
  { time: "02:00", system: 18, web: 14, network: 22 },
  { time: "04:00", system: 9, web: 6, network: 11 },
  { time: "06:00", system: 25, web: 19, network: 30 },
  { time: "08:00", system: 42, web: 35, network: 48 },
  { time: "09:00", system: 55, web: 68, network: 40 },
  { time: "10:00", system: 38, web: 45, network: 52 },
  { time: "11:00", system: 60, web: 32, network: 75 },
  { time: "12:00", system: 48, web: 55, network: 62 },
  { time: "13:00", system: 72, web: 40, network: 85 },
  { time: "14:00", system: 95, web: 78, network: 110 },
  { time: "14:30", system: 120, web: 92, network: 145 },
];

const layerColors = {
  system: "hsl(170,100%,45%)",
  web: "hsl(260,80%,60%)",
  network: "hsl(42,100%,55%)",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card/95 p-3.5 shadow-xl backdrop-blur-md">
      <p className="font-mono text-[10px] text-muted-foreground mb-2 tracking-wider">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2.5 text-xs py-0.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground capitalize w-16">{entry.name}</span>
          <span className="font-mono font-bold text-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const EventTimeline = () => (
  <section id="timeline" className="py-24 relative">
    <div className="absolute inset-0 bg-gradient-to-b from-card/20 via-transparent to-card/20" />
    <div className="container mx-auto px-6 relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-16"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
          <span className="font-mono text-[10px] tracking-[0.3em] text-primary/60 uppercase">Analytics</span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
        </div>
        <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground text-center mb-4 tracking-tight">
          Event Correlation <span className="text-primary text-glow">Timeline</span>
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto text-center">
          Real-time event volume across all three security layers, correlated for unified threat analysis.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.15 }}
        className="max-w-5xl mx-auto rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-5 md:p-8"
      >
        <div className="flex flex-wrap gap-5 mb-8 justify-center">
          {[
            { label: "System", color: layerColors.system },
            { label: "Web", color: layerColors.web },
            { label: "Network", color: layerColors.network },
          ].map((l) => (
            <span key={l.label} className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
              <span className="w-3 h-1 rounded-full" style={{ backgroundColor: l.color }} />
              {l.label} Layer
            </span>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={360}>
          <AreaChart data={timelineData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              {Object.entries(layerColors).map(([key, color]) => (
                <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(230,18%,15%)" vertical={false} />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: "hsl(220,15%,50%)" }} tickLine={false} axisLine={{ stroke: "hsl(230,18%,15%)" }} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(220,15%,50%)" }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            {Object.entries(layerColors).map(([key, color]) => (
              <Area key={key} type="monotone" dataKey={key} stroke={color} strokeWidth={2} fill={`url(#grad-${key})`} animationDuration={1200} />
            ))}
          </AreaChart>
        </ResponsiveContainer>

        <p className="text-center text-[10px] text-muted-foreground mt-6 font-mono tracking-wider">
          Events per interval · Last 24 hours · Peak at 14:30 — DDoS + port scan correlation
        </p>
      </motion.div>
    </div>
  </section>
);

export default EventTimeline;
