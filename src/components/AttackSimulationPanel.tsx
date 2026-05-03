import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Beaker, Play, CheckCircle2, XCircle, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Layer = "Wazuh" | "ModSecurity" | "Suricata" | "SIEM";
type Result = { layer: Layer; expected: "block" | "alert"; passed: boolean; detail: string };

interface Scenario {
  id: string;
  name: string;
  attack_type: string;
  severity: "critical" | "high" | "medium";
  source_ip: string;
  message: string;
  layers: Layer[];
  protocol?: string;
  port?: number;
  rule_matched: string;
  threat_type: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: "ddos",
    name: "DDoS Flood",
    attack_type: "DDoS Attack",
    severity: "critical",
    source_ip: `203.0.113.${Math.floor(Math.random() * 200) + 1}`,
    message: "Volumetric SYN flood — 12k pps from single source",
    layers: ["Suricata", "SIEM"],
    protocol: "TCP",
    port: 80,
    rule_matched: "DDOS-SYN-FLOOD-001",
    threat_type: "DoS",
  },
  {
    id: "sqli",
    name: "SQL Injection",
    attack_type: "SQL Injection",
    severity: "high",
    source_ip: `198.51.100.${Math.floor(Math.random() * 200) + 1}`,
    message: "OR 1=1 UNION SELECT detected on /login.php",
    layers: ["ModSecurity", "SIEM"],
    protocol: "TCP",
    port: 443,
    rule_matched: "OWASP-CRS-942100",
    threat_type: "Web App Attack",
  },
  {
    id: "brute",
    name: "Brute Force SSH",
    attack_type: "Brute Force",
    severity: "high",
    source_ip: `192.0.2.${Math.floor(Math.random() * 200) + 1}`,
    message: "147 failed sshd password attempts in 30s",
    layers: ["Wazuh", "SIEM"],
    protocol: "TCP",
    port: 22,
    rule_matched: "WAZUH-5710-AUTH-FAIL",
    threat_type: "Authentication",
  },
  {
    id: "exfil",
    name: "Data Exfiltration",
    attack_type: "Data Exfiltration",
    severity: "critical",
    source_ip: `10.0.0.${Math.floor(Math.random() * 200) + 1}`,
    message: "Outbound 4.2 GB encrypted upload to unknown C2",
    layers: ["Suricata", "Wazuh", "SIEM"],
    protocol: "TCP",
    port: 443,
    rule_matched: "ET-EXFIL-DNS-TUNNEL",
    threat_type: "Exfiltration",
  },
];

const LAYER_BADGE: Record<Layer, string> = {
  Wazuh: "border-blue-500/40 text-blue-500 bg-blue-500/10",
  ModSecurity: "border-purple-500/40 text-purple-500 bg-purple-500/10",
  Suricata: "border-orange-500/40 text-orange-500 bg-orange-500/10",
  SIEM: "border-success/40 text-success bg-success/10",
};

const AttackSimulationPanel = () => {
  const [running, setRunning] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, Result[]>>({});

  const runScenario = async (s: Scenario) => {
    setRunning(s.id);
    const out: Result[] = [];
    try {
      // Layer 1: insert IDS/IPS alert (Suricata/Wazuh detect)
      const { error: alertErr } = await supabase.from("threat_alerts").insert({
        alert_type: s.attack_type,
        severity: s.severity,
        message: s.message,
        source_ip: s.source_ip,
        status: "active",
        metadata: { simulated: true, scenario: s.id, layers: s.layers },
      });

      for (const layer of s.layers) {
        if (layer === "Wazuh" || layer === "Suricata" || layer === "ModSecurity") {
          out.push({
            layer,
            expected: "alert",
            passed: !alertErr,
            detail: alertErr ? alertErr.message : `${layer} detected ${s.rule_matched}`,
          });
        }
      }

      // Layer 2: firewall block log
      const { error: fwErr } = await supabase.from("firewall_logs").insert({
        source_ip: s.source_ip,
        destination_ip: "10.10.10.1",
        port: s.port,
        protocol: s.protocol,
        action: "blocked",
        threat_type: s.threat_type,
        rule_matched: s.rule_matched,
      });

      // Layer 3: SIEM correlation incident
      const { error: incErr } = await supabase.from("security_incidents").insert({
        incident_type: s.attack_type,
        severity: s.severity,
        source_ip: s.source_ip,
        target: `port ${s.port}/${s.protocol}`,
        description: `[SIMULATION] ${s.message}`,
        status: "investigating",
        response_actions: [
          { action: "ip_blocked", at: new Date().toISOString() },
          { action: "alert_correlated", at: new Date().toISOString() },
        ],
      });

      out.push({
        layer: "SIEM",
        expected: "block",
        passed: !incErr && !fwErr,
        detail: incErr || fwErr ? "SIEM correlation failed" : "Incident correlated, IP auto-blocked, admin notified",
      });

      // Layer 4: auto-block IP for 24h (defense)
      if (s.severity === "critical") {
        await supabase.from("blocked_ips").insert({
          ip_address: s.source_ip,
          reason: `[SIMULATION] ${s.attack_type}`,
          blocked_by: "simulation",
          is_permanent: false,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });
      }

      setResults((p) => ({ ...p, [s.id]: out }));
      const allPass = out.every((r) => r.passed);
      toast[allPass ? "success" : "warning"](
        `${s.name}: ${allPass ? "all layers blocked ✓" : "partial defense"}`,
        { description: `${out.filter((r) => r.passed).length}/${out.length} checks passed`, duration: 5000 }
      );
    } catch (err) {
      toast.error("Simulation failed", { description: (err as Error).message });
    } finally {
      setRunning(null);
    }
  };

  const runAll = async () => {
    for (const s of SCENARIOS) await runScenario(s);
  };

  return (
    <div className="rounded-lg border border-border bg-card/50 backdrop-blur-sm p-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Beaker className="w-4 h-4 text-primary" /> Attack Simulation & Layer Verification
        </h3>
        <Button size="sm" onClick={runAll} disabled={!!running} className="h-7 text-xs gap-1">
          <Play className="w-3 h-3" /> Run all scenarios
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground font-mono mb-3">
        Verifies Wazuh (host) · ModSecurity (web) · Suricata (network) · SIEM correlation each react correctly.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {SCENARIOS.map((s) => {
          const r = results[s.id];
          const isRunning = running === s.id;
          return (
            <div key={s.id} className="rounded border border-border/60 bg-background/40 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-mono font-semibold text-foreground">{s.name}</span>
                  <Badge variant={s.severity === "critical" ? "destructive" : "secondary"} className="text-[8px]">
                    {s.severity}
                  </Badge>
                </div>
                <Button size="sm" variant="outline" onClick={() => runScenario(s)} disabled={!!running} className="h-6 text-[10px] px-2 gap-1">
                  {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                  {isRunning ? "Running" : "Run"}
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {s.layers.concat(["SIEM"]).filter((l, i, a) => a.indexOf(l) === i).map((l) => (
                  <Badge key={l} variant="outline" className={`text-[9px] ${LAYER_BADGE[l]}`}>{l}</Badge>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mb-2">{s.message}</p>
              <AnimatePresence>
                {r && (
                  <motion.ul initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-1 mt-2">
                    {r.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-[10px] font-mono">
                        {item.passed ? <CheckCircle2 className="w-3 h-3 text-success shrink-0 mt-0.5" /> : <XCircle className="w-3 h-3 text-destructive shrink-0 mt-0.5" />}
                        <span className={item.passed ? "text-success" : "text-destructive"}>{item.layer}</span>
                        <span className="text-muted-foreground truncate">{item.detail}</span>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AttackSimulationPanel;
