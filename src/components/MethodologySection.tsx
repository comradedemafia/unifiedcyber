import { motion } from "framer-motion";
import { FlaskConical, Search, Pencil, Hammer, TestTube, BarChart3 } from "lucide-react";

const dsrSteps = [
  {
    icon: Search,
    title: "Problem Identification",
    desc: "Analyse gaps in standalone security tools across system, web, and network layers.",
    weeks: [1, 2],
    color: "hsl(185,100%,50%)",
  },
  {
    icon: Pencil,
    title: "Solution Design",
    desc: "Design a four-layer unified architecture with centralised SIEM correlation.",
    weeks: [3, 4, 5],
    color: "hsl(260,80%,65%)",
  },
  {
    icon: Hammer,
    title: "Development",
    desc: "Build the prototype using Wazuh, ModSecurity, Suricata, and ELK Stack.",
    weeks: [5, 6, 7, 8, 9],
    color: "hsl(38,92%,50%)",
  },
  {
    icon: TestTube,
    title: "Demonstration",
    desc: "Deploy in a controlled lab environment and simulate real-world attack scenarios.",
    weeks: [9, 10, 11],
    color: "hsl(0,80%,55%)",
  },
  {
    icon: BarChart3,
    title: "Evaluation",
    desc: "Measure detection accuracy, response time, and cross-layer correlation effectiveness.",
    weeks: [11, 12, 13],
    color: "hsl(150,70%,45%)",
  },
  {
    icon: FlaskConical,
    title: "Communication",
    desc: "Document findings, write the final report, and present results to the faculty.",
    weeks: [13, 14, 15, 16],
    color: "hsl(210,80%,60%)",
  },
];

const totalWeeks = 16;

const MethodologySection = () => (
  <section className="py-20 bg-background">
    <div className="container mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-14"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
          Research{" "}
          <span className="text-primary text-glow">Methodology</span>
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Design Science Research (DSR) methodology — a systematic approach to
          creating and evaluating the unified security artefact.
        </p>
      </motion.div>

      {/* DSR Steps */}
      <div className="max-w-5xl mx-auto grid gap-4 mb-14">
        {dsrSteps.map((step, i) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card"
          >
            <div
              className="w-10 h-10 rounded-md flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${step.color}20`, color: step.color }}
            >
              <step.icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-foreground">
                {i + 1}. {step.title}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {step.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Gantt Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
        className="max-w-5xl mx-auto rounded-lg border border-border bg-card p-4 md:p-8"
      >
        <h3 className="font-semibold text-foreground mb-6 text-center font-mono text-sm tracking-wider uppercase">
          Project Timeline — 16 Weeks
        </h3>

        {/* Week headers */}
        <div className="hidden md:grid gap-1 mb-2" style={{ gridTemplateColumns: `140px repeat(${totalWeeks}, 1fr)` }}>
          <span />
          {Array.from({ length: totalWeeks }, (_, i) => (
            <span
              key={i}
              className="text-[10px] text-muted-foreground text-center font-mono"
            >
              W{i + 1}
            </span>
          ))}
        </div>

        {/* Bars */}
        <div className="space-y-2">
          {dsrSteps.map((step, i) => {
            const start = step.weeks[0];
            const end = step.weeks[step.weeks.length - 1];
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                {/* Mobile: simple bar */}
                <div className="md:hidden flex items-center gap-3 mb-1">
                  <span className="text-xs text-muted-foreground font-mono w-28 shrink-0 truncate">
                    {step.title}
                  </span>
                  <div className="flex-1 bg-muted/30 rounded-full h-5 relative overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${((end - start + 1) / totalWeeks) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
                      className="absolute h-full rounded-full"
                      style={{
                        left: `${((start - 1) / totalWeeks) * 100}%`,
                        backgroundColor: step.color,
                        opacity: 0.8,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono w-14 text-right">
                    W{start}–{end}
                  </span>
                </div>

                {/* Desktop: grid-based */}
                <div
                  className="hidden md:grid gap-1 items-center"
                  style={{ gridTemplateColumns: `140px repeat(${totalWeeks}, 1fr)` }}
                >
                  <span className="text-xs text-muted-foreground font-mono truncate pr-2">
                    {step.title}
                  </span>
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
                        transition={{ duration: 0.4, delay: 0.3 + i * 0.1 + w * 0.02 }}
                        className="h-6"
                        style={{
                          backgroundColor: active ? step.color : "transparent",
                          opacity: active ? 0.8 : 0,
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

        <p className="text-center text-xs text-muted-foreground mt-6 font-mono">
          Design Science Research Methodology · Feb – May 2026
        </p>
      </motion.div>
    </div>
  </section>
);

export default MethodologySection;
