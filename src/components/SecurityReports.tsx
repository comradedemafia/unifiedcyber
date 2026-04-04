import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Download, TrendingUp, TrendingDown, BarChart3, PieChart, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DailyStats {
  date: string;
  threats: number;
  blocked: number;
  incidents: number;
  resolved: number;
}

const generateStats = (): DailyStats[] => {
  const stats: DailyStats[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    stats.push({
      date: d.toISOString().split("T")[0],
      threats: Math.floor(Math.random() * 200) + 50,
      blocked: Math.floor(Math.random() * 180) + 40,
      incidents: Math.floor(Math.random() * 15) + 2,
      resolved: Math.floor(Math.random() * 14) + 1,
    });
  }
  return stats;
};

const TOP_ATTACKS = [
  { type: "SQL Injection", count: 456, trend: "up" },
  { type: "DDoS", count: 312, trend: "down" },
  { type: "Brute Force SSH", count: 289, trend: "up" },
  { type: "XSS", count: 178, trend: "down" },
  { type: "Port Scanning", count: 145, trend: "up" },
  { type: "DNS Tunneling", count: 89, trend: "down" },
];

const SecurityReports = () => {
  const [stats] = useState<DailyStats[]>(generateStats);
  const [period, setPeriod] = useState<"7d" | "14d" | "30d">("7d");

  const periodDays = period === "7d" ? 7 : period === "14d" ? 14 : 30;
  const periodStats = stats.slice(-periodDays);
  const totalThreats = periodStats.reduce((s, d) => s + d.threats, 0);
  const totalBlocked = periodStats.reduce((s, d) => s + d.blocked, 0);
  const totalIncidents = periodStats.reduce((s, d) => s + d.incidents, 0);
  const totalResolved = periodStats.reduce((s, d) => s + d.resolved, 0);
  const blockRate = totalThreats > 0 ? ((totalBlocked / totalThreats) * 100).toFixed(1) : "0";
  const resolveRate = totalIncidents > 0 ? ((totalResolved / totalIncidents) * 100).toFixed(1) : "0";

  const maxThreats = Math.max(...periodStats.map(d => d.threats));

  const exportReport = () => {
    const csv = ["Date,Threats,Blocked,Incidents,Resolved", ...periodStats.map(d => `${d.date},${d.threats},${d.blocked},${d.incidents},${d.resolved}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `security-report-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="py-16 relative">
      <div className="container mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Security Reports & Analytics</h2>
              </div>
              <p className="text-sm text-muted-foreground">Threat trends, attack analytics, and exportable reports</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex bg-muted/30 rounded-lg p-1">
                {(["7d", "14d", "30d"] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-1 text-[10px] font-mono rounded-md transition-all ${period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {p === "7d" ? "7 Days" : p === "14d" ? "14 Days" : "30 Days"}
                  </button>
                ))}
              </div>
              <Button onClick={exportReport} size="sm" variant="outline" className="text-xs gap-1 font-mono">
                <Download className="w-3 h-3" /> Export CSV
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total Threats", value: totalThreats.toLocaleString(), color: "text-destructive", sub: `${periodDays} days` },
            { label: "Blocked", value: totalBlocked.toLocaleString(), color: "text-success", sub: `${blockRate}% rate` },
            { label: "Incidents", value: totalIncidents.toString(), color: "text-warning", sub: `${periodDays} days` },
            { label: "Resolved", value: totalResolved.toString(), color: "text-primary", sub: `${resolveRate}% rate` },
          ].map((c) => (
            <div key={c.label} className="bg-card/50 border border-border/50 rounded-xl p-4">
              <p className="text-[10px] font-mono text-muted-foreground mb-1">{c.label}</p>
              <p className={`text-2xl font-bold font-mono ${c.color}`}>{c.value}</p>
              <p className="text-[9px] text-muted-foreground/60">{c.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Threat trend chart (bar chart) */}
          <div className="lg:col-span-2 bg-card/50 border border-border/50 rounded-xl p-4">
            <h3 className="text-xs font-mono font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-primary" /> Threat Trend
            </h3>
            <div className="flex items-end gap-[2px] h-40">
              {periodStats.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                  <div className="w-full flex flex-col gap-[1px]">
                    <div
                      className="w-full bg-destructive/60 rounded-t-sm transition-all hover:bg-destructive"
                      style={{ height: `${(d.threats / maxThreats) * 120}px` }}
                    />
                    <div
                      className="w-full bg-success/60 rounded-b-sm"
                      style={{ height: `${(d.blocked / maxThreats) * 120}px` }}
                    />
                  </div>
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-1 hidden group-hover:block bg-card border border-border rounded p-1.5 min-w-24 z-10 shadow-lg">
                    <p className="text-[8px] font-mono text-muted-foreground">{d.date}</p>
                    <p className="text-[8px] font-mono text-destructive">Threats: {d.threats}</p>
                    <p className="text-[8px] font-mono text-success">Blocked: {d.blocked}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-2 text-[9px] font-mono text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-destructive/60 rounded-sm" /> Threats</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-success/60 rounded-sm" /> Blocked</span>
            </div>
          </div>

          {/* Top attacks */}
          <div className="bg-card/50 border border-border/50 rounded-xl p-4">
            <h3 className="text-xs font-mono font-semibold text-foreground mb-4 flex items-center gap-2">
              <PieChart className="w-3.5 h-3.5 text-accent" /> Top Attack Types
            </h3>
            <div className="space-y-3">
              {TOP_ATTACKS.map((atk) => {
                const maxCount = TOP_ATTACKS[0].count;
                return (
                  <div key={atk.type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono text-foreground">{atk.type}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-mono text-muted-foreground">{atk.count}</span>
                        {atk.trend === "up" ? <TrendingUp className="w-3 h-3 text-destructive" /> : <TrendingDown className="w-3 h-3 text-success" />}
                      </div>
                    </div>
                    <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${(atk.count / maxCount) * 100}%` }}
                        viewport={{ once: true }}
                        className="h-full bg-accent/60 rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SecurityReports;
