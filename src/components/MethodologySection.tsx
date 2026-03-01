import { motion } from "framer-motion";
import { Search, Pencil, Hammer, TestTube, BarChart3, FlaskConical } from "lucide-react";

const dsrSteps = [
  { icon: Search, title: "Problem Identification", desc: "Analyse gaps in standalone security tools across system, web, and network layers.", weeks: [1, 2], color: "hsl(170,100%,45%)" },
  { icon: Pencil, title: "Solution Design", desc: "Design a four-layer unified architecture with centralised SIEM correlation.", weeks: [3, 4, 5], color: "hsl(260,80%,60%)" },
  { icon: Hammer, title: "Development", desc: "Build the prototype using Wazuh, ModSecurity, Suricata, and ELK Stack.", weeks: [5, 6, 7, 8, 9], color: "hsl(42,100%,55%)" },
  { icon: TestTube, title: "Demonstration", desc: "Deploy in a controlled lab environment and simulate real-world attack scenarios.", weeks: [9, 10, 11], color: "hsl(0,85%,50%)" },
  { icon: BarChart3, title: "Evaluation", desc: "Measure detection accuracy, response time, and cross-layer correlation effectiveness.", weeks: [11, 12, 13], color: "hsl(155,75%,42%)" },
  { icon: FlaskConical, title: "Communication", desc: "Document findings, write the final report, and present results to the faculty.", weeks: [13, 14, 15, 16], color: "hsl(210,80%,60%)" },
];

const totalWeeks = 16;

const MethodologySection = () => (
  <section id="methodology" className="py-24 relative">
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/20 to-transparent" />
    <div className="container mx-auto px-6 relative">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
          <span className="font-mono text-[10px] tracking-[0.3em] text-accent/60 uppercase">DSR Framework</span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
        </div>
        <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground text-center mb-4 tracking-tight">
          Research <span className="text-accent text-glow-accent">Methodology</span>
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto text-center">
          Design Science Research (DSR) — a systematic approach to creating and evaluating the unified security artefact.
        </p>
      </motion.div>

      {/* DSR Steps */}
      <div className="max-w-4xl mx-auto grid gap-3 mb-16">
        {dsrSteps.map((step, i) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.07 }}
            className="flex items-start gap-4 p-4 rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm hover:border-border transition-all group"
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-all" style={{ backgroundColor: `${step.color}15`, color: step.color }}>
              <step.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-mono text-[10px] text-muted-foreground/50">0{i + 1}</span>
                <p className="font-display font-semibold text-sm text-foreground">{step.title}</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground/50 shrink-0 pt-1">
              W{step.weeks[0]}–{step.weeks[step.weeks.length - 1]}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Gantt Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
        className="max-w-5xl mx-auto rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-5 md:p-8"
      >
        <h3 className="font-display font-semibold text-foreground mb-8 text-center text-sm tracking-wider">
          Project Timeline — <span className="text-primary">16 Weeks</span>
        </h3>

        {/* Week headers */}
        <div className="hidden md:grid gap-1 mb-3" style={{ gridTemplateColumns: `140px repeat(${totalWeeks}, 1fr)` }}>
          <span />
          {Array.from({ length: totalWeeks }, (_, i) => (
            <span key={i} className="text-[9px] text-muted-foreground/40 text-center font-mono">
              {i + 1}
            </span>
          ))}
        </div>

        {/* Bars */}
        <div className="space-y-1.5">
          {dsrSteps.map((step, i) => {
            const start = step.weeks[0];
            const end = step.weeks[step.weeks.length - 1];
            return (
              <motion.div key={step.title} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.08 }}>
                {/* Mobile */}
                <div className="md:hidden flex items-center gap-3 mb-0.5">
                  <span className="text-[10px] text-muted-foreground font-mono w-24 shrink-0 truncate">{step.title}</span>
                  <div className="flex-1 bg-muted/20 rounded-full h-5 relative overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${((end - start + 1) / totalWeeks) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
                      className="absolute h-full rounded-full"
                      style={{ left: `${((start - 1) / totalWeeks) * 100}%`, backgroundColor: step.color, opacity: 0.7 }}
                    />
                  </div>
                  <span className="text-[9px] text-muted-foreground/50 font-mono w-12 text-right">W{start}–{end}</span>
                </div>

                {/* Desktop */}
                <div className="hidden md:grid gap-1 items-center" style={{ gridTemplateColumns: `140px repeat(${totalWeeks}, 1fr)` }}>
                  <span className="text-[10px] text-muted-foreground font-mono truncate pr-2">{step.title}</span>
                  {Array.from({ length: totalWeeks }, (_, w) => {
                    const week = w + 1;
                    const active = week >= start && week <= end;
                    const isStart = week === start;
                    const isEnd = week === end;
                    return (
                      <motion.div
                        key={w}
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: active ? 1 : 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.3 + i * 0.08 + w * 0.015 }}
                        className="h-5"
                        style={{
                          backgroundColor: active ? step.color : "transparent",
                          opacity: active ? 0.65 : 0,
                          borderRadius: isStart && isEnd ? "4px" : isStart ? "4px 0 0 4px" : isEnd ? "0 4px 4px 0" : "0",
                        }}
                      />
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>

        <p className="text-center text-[10px] text-muted-foreground/50 mt-8 font-mono tracking-wider">
          Design Science Research Methodology · Feb – May 2026
        </p>
      </motion.div>
    </div>
  </section>
);

export default MethodologySection;
