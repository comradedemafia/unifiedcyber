import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-card p-3 shadow-lg backdrop-blur-sm">
      <p className="font-mono text-xs text-muted-foreground mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground capitalize">{entry.name}:</span>
          <span className="font-mono font-semibold text-foreground">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const EventTimeline = () => (
  <section id="timeline" className="py-20 bg-card/30">
    <div className="container mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-14"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
          Event Correlation{" "}
          <span className="text-primary text-glow">Timeline</span>
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Real-time event volume across all three security layers, correlated
          for unified threat analysis.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.15 }}
        className="max-w-5xl mx-auto rounded-lg border border-border bg-card p-4 md:p-8"
      >
        {/* Legend pills */}
        <div className="flex flex-wrap gap-4 mb-6 justify-center">
          {[
            { label: "System", color: "hsl(185,100%,50%)" },
            { label: "Web", color: "hsl(38,92%,50%)" },
            { label: "Network", color: "hsl(0,80%,55%)" },
          ].map((l) => (
            <span
              key={l.label}
              className="flex items-center gap-2 text-xs font-mono text-muted-foreground"
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: l.color }}
              />
              {l.label} Layer
            </span>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={340}>
          <AreaChart
            data={timelineData}
            margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="gradSystem" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(185,100%,50%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(185,100%,50%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradWeb" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(38,92%,50%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(38,92%,50%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradNetwork" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(0,80%,55%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(0,80%,55%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(222,30%,18%)"
              vertical={false}
            />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11, fill: "hsl(215,20%,55%)" }}
              tickLine={false}
              axisLine={{ stroke: "hsl(222,30%,18%)" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(215,20%,55%)" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="system"
              stroke="hsl(185,100%,50%)"
              strokeWidth={2}
              fill="url(#gradSystem)"
              animationDuration={1200}
            />
            <Area
              type="monotone"
              dataKey="web"
              stroke="hsl(38,92%,50%)"
              strokeWidth={2}
              fill="url(#gradWeb)"
              animationDuration={1400}
            />
            <Area
              type="monotone"
              dataKey="network"
              stroke="hsl(0,80%,55%)"
              strokeWidth={2}
              fill="url(#gradNetwork)"
              animationDuration={1600}
            />
          </AreaChart>
        </ResponsiveContainer>

        <p className="text-center text-xs text-muted-foreground mt-4 font-mono">
          Events per interval · Last 24 hours · Peak at 14:30 — DDoS + port scan correlation
        </p>
      </motion.div>
    </div>
  </section>
);

export default EventTimeline;
