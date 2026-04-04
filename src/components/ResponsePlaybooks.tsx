import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Play, CheckCircle2, Loader2, XCircle, Shield, Zap, Bug, Database, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PlaybookStep {
  name: string;
  description: string;
  status: "pending" | "running" | "complete" | "failed";
  duration?: number;
}

interface Playbook {
  id: string;
  name: string;
  type: "ddos" | "bruteforce" | "malware" | "exfiltration";
  icon: typeof Shield;
  color: string;
  steps: PlaybookStep[];
  status: "idle" | "running" | "complete" | "failed";
}

const PLAYBOOK_TEMPLATES: Omit<Playbook, "status">[] = [
  {
    id: "ddos",
    name: "DDoS Mitigation",
    type: "ddos",
    icon: Zap,
    color: "text-destructive",
    steps: [
      { name: "Rate Limiting", description: "Apply rate limiting rules to incoming traffic", status: "pending" },
      { name: "IP Blocking", description: "Block source IPs exceeding threshold", status: "pending" },
      { name: "CDN Failover", description: "Route traffic through CDN scrubbing center", status: "pending" },
      { name: "Admin Alert", description: "Notify admin team of ongoing attack", status: "pending" },
      { name: "Monitor Recovery", description: "Verify traffic returns to normal levels", status: "pending" },
    ],
  },
  {
    id: "bruteforce",
    name: "Brute Force Defense",
    type: "bruteforce",
    icon: Shield,
    color: "text-warning",
    steps: [
      { name: "Account Lockout", description: "Lock targeted accounts after 5 failed attempts", status: "pending" },
      { name: "IP Ban", description: "Ban attacking IP addresses", status: "pending" },
      { name: "Password Policy", description: "Enforce stronger password requirements", status: "pending" },
      { name: "2FA Enforcement", description: "Enable two-factor authentication for affected accounts", status: "pending" },
      { name: "Audit Log Review", description: "Review authentication logs for compromised accounts", status: "pending" },
    ],
  },
  {
    id: "malware",
    name: "Malware Response",
    type: "malware",
    icon: Bug,
    color: "text-accent",
    steps: [
      { name: "Quarantine", description: "Isolate infected systems from network", status: "pending" },
      { name: "Full Scan", description: "Run comprehensive malware scan on all endpoints", status: "pending" },
      { name: "Clean & Remove", description: "Remove identified malware artifacts", status: "pending" },
      { name: "System Restore", description: "Restore systems from clean backup", status: "pending" },
      { name: "Signature Update", description: "Update all AV signatures and IDS rules", status: "pending" },
    ],
  },
  {
    id: "exfiltration",
    name: "Data Exfiltration Response",
    type: "exfiltration",
    icon: Database,
    color: "text-primary",
    steps: [
      { name: "Network Isolation", description: "Isolate affected network segment", status: "pending" },
      { name: "Forensic Capture", description: "Capture network traffic and memory dumps", status: "pending" },
      { name: "Data Integrity Check", description: "Verify integrity of sensitive data stores", status: "pending" },
      { name: "Access Revocation", description: "Revoke compromised credentials and tokens", status: "pending" },
      { name: "Incident Report", description: "Generate detailed incident report for compliance", status: "pending" },
    ],
  },
];

const ResponsePlaybooks = () => {
  const [playbooks, setPlaybooks] = useState<Playbook[]>(
    PLAYBOOK_TEMPLATES.map(p => ({ ...p, status: "idle" as const }))
  );
  const [activePlaybook, setActivePlaybook] = useState<string | null>(null);

  const runPlaybook = useCallback(async (id: string) => {
    setActivePlaybook(id);
    setPlaybooks(prev => prev.map(p => p.id === id ? {
      ...p,
      status: "running" as const,
      steps: p.steps.map(s => ({ ...s, status: "pending" as const })),
    } : p));

    const pb = PLAYBOOK_TEMPLATES.find(p => p.id === id)!;
    for (let i = 0; i < pb.steps.length; i++) {
      setPlaybooks(prev => prev.map(p => p.id === id ? {
        ...p,
        steps: p.steps.map((s, idx) => idx === i ? { ...s, status: "running" as const } : s),
      } : p));

      const duration = 1000 + Math.random() * 2000;
      await new Promise(r => setTimeout(r, duration));

      const failed = Math.random() < 0.05;
      setPlaybooks(prev => prev.map(p => p.id === id ? {
        ...p,
        steps: p.steps.map((s, idx) => idx === i ? { ...s, status: failed ? "failed" as const : "complete" as const, duration: duration / 1000 } : s),
        ...(failed ? { status: "failed" as const } : {}),
      } : p));

      if (failed) return;
    }

    setPlaybooks(prev => prev.map(p => p.id === id ? { ...p, status: "complete" as const } : p));
  }, []);

  const getStepIcon = (status: string) => {
    if (status === "running") return <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />;
    if (status === "complete") return <CheckCircle2 className="w-3.5 h-3.5 text-success" />;
    if (status === "failed") return <XCircle className="w-3.5 h-3.5 text-destructive" />;
    return <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/30" />;
  };

  const selected = playbooks.find(p => p.id === activePlaybook) || playbooks[0];

  return (
    <section className="py-16 relative">
      <div className="container mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-success/10 border border-success/20">
              <BookOpen className="w-5 h-5 text-success" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Automated Response Playbooks</h2>
          </div>
          <p className="text-sm text-muted-foreground">Pre-configured automated responses for common attack scenarios</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Playbook list */}
          <div className="space-y-2">
            {playbooks.map((pb) => {
              const Icon = pb.icon;
              return (
                <button
                  key={pb.id}
                  onClick={() => setActivePlaybook(pb.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                    selected.id === pb.id
                      ? "bg-card border-primary/30"
                      : "bg-card/30 border-border/30 hover:border-border/60"
                  }`}
                >
                  <div className={`p-1.5 rounded-lg ${pb.status === "running" ? "bg-primary/10" : "bg-muted/30"}`}>
                    <Icon className={`w-4 h-4 ${pb.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono font-semibold text-foreground truncate">{pb.name}</p>
                    <p className="text-[9px] text-muted-foreground">{pb.steps.length} steps</p>
                  </div>
                  <Badge
                    variant={pb.status === "complete" ? "default" : pb.status === "failed" ? "destructive" : "secondary"}
                    className="text-[8px]"
                  >
                    {pb.status}
                  </Badge>
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                </button>
              );
            })}
          </div>

          {/* Playbook detail */}
          <div className="lg:col-span-2 bg-card/50 border border-border/50 rounded-xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <selected.icon className={`w-5 h-5 ${selected.color}`} />
                <h3 className="text-sm font-mono font-bold text-foreground">{selected.name}</h3>
              </div>
              <Button
                onClick={() => runPlaybook(selected.id)}
                disabled={selected.status === "running"}
                size="sm"
                className="gap-1.5 text-xs font-mono"
              >
                <Play className="w-3 h-3" /> {selected.status === "running" ? "Running..." : "Execute"}
              </Button>
            </div>

            <div className="space-y-3">
              {selected.steps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                    step.status === "running"
                      ? "bg-primary/5 border-primary/20"
                      : step.status === "complete"
                      ? "bg-success/5 border-success/20"
                      : step.status === "failed"
                      ? "bg-destructive/5 border-destructive/20"
                      : "bg-muted/5 border-border/20"
                  }`}
                >
                  <div className="mt-0.5">{getStepIcon(step.status)}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-mono font-semibold text-foreground">
                        Step {i + 1}: {step.name}
                      </p>
                      {step.duration && (
                        <span className="text-[9px] font-mono text-muted-foreground">{step.duration.toFixed(1)}s</span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResponsePlaybooks;
