import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, AlertTriangle, Ban, RotateCcw, CheckCircle2, 
  Activity, Zap, Server, Globe, Lock, Eye,
  ChevronRight, Play, Square, Clock
} from "lucide-react";

type Phase = "idle" | "detection" | "containment" | "recovery" | "complete";

interface Incident {
  id: string;
  type: string;
  source: string;
  severity: "critical" | "high" | "medium";
  timestamp: string;
  phase: Phase;
  details: string[];
  detectionLog: string[];
  containmentLog: string[];
  recoveryLog: string[];
}

const ATTACK_TYPES = [
  { type: "SQL Injection Attack", source: "45.33.32.156", severity: "critical" as const, icon: Globe },
  { type: "Brute Force SSH", source: "185.220.101.42", severity: "high" as const, icon: Lock },
  { type: "DDoS SYN Flood", source: "103.75.190.11", severity: "critical" as const, icon: Zap },
  { type: "Ransomware Detected", source: "192.168.1.105", severity: "critical" as const, icon: AlertTriangle },
  { type: "DNS Tunneling", source: "91.219.237.229", severity: "high" as const, icon: Server },
  { type: "XSS Payload Injection", source: "178.128.88.201", severity: "medium" as const, icon: Globe },
];

const DETECTION_LOGS = [
  (atk: typeof ATTACK_TYPES[0]) => `[SURICATA] Alert triggered: ${atk.type} from ${atk.source}`,
  (atk: typeof ATTACK_TYPES[0]) => `[WAZUH] Correlation engine matched rule ID: ${1000 + Math.floor(Math.random() * 9000)}`,
  (atk: typeof ATTACK_TYPES[0]) => `[SIEM] Threat level assessed: ${atk.severity.toUpperCase()}`,
  (atk: typeof ATTACK_TYPES[0]) => `[AI-ENGINE] Behavioral analysis: anomalous pattern confirmed`,
  (atk: typeof ATTACK_TYPES[0]) => `[SCANNER] Source IP reputation: MALICIOUS (score: ${Math.floor(Math.random() * 30 + 70)}/100)`,
  () => `[ALERT] Incident auto-created → initiating response pipeline...`,
];

const CONTAINMENT_LOGS = [
  (atk: typeof ATTACK_TYPES[0]) => `[FIREWALL] iptables -A INPUT -s ${atk.source} -j DROP ✓`,
  () => `[WAF] ModSecurity rule injected: block pattern match ✓`,
  () => `[NETWORK] Isolating affected subnet from core network ✓`,
  (atk: typeof ATTACK_TYPES[0]) => `[IDS] Suricata blacklist updated: ${atk.source} added ✓`,
  () => `[SIEM] All related sessions terminated ✓`,
  () => `[CONTAINMENT] Damage spread halted — perimeter secured ✓`,
];

const RECOVERY_LOGS = [
  () => `[BACKUP] Initiating system snapshot restore...`,
  () => `[DATABASE] Rolling back to last clean state (${new Date(Date.now() - 3600000).toISOString()})`,
  () => `[INTEGRITY] File integrity check: /etc/shadow → RESTORED ✓`,
  () => `[INTEGRITY] File integrity check: /var/www/html → RESTORED ✓`,
  () => `[SERVICES] Restarting affected services: apache2, mysql, sshd ✓`,
  () => `[MONITOR] Post-incident monitoring enabled (24h elevated alert) ✓`,
  () => `[REPORT] Incident report generated → /var/log/ucsf/incident_${Date.now()}.pdf`,
  () => `[RECOVERY] System fully restored — all services operational ✓`,
];

const phaseConfig = {
  idle: { color: "text-muted-foreground", bg: "bg-muted/20", label: "Standby", icon: Eye },
  detection: { color: "text-destructive", bg: "bg-destructive/10", label: "Detection", icon: AlertTriangle },
  containment: { color: "text-warning", bg: "bg-warning/10", label: "Containment", icon: Ban },
  recovery: { color: "text-success", bg: "bg-success/10", label: "Recovery", icon: RotateCcw },
  complete: { color: "text-success", bg: "bg-success/10", label: "Resolved", icon: CheckCircle2 },
};

const IncidentResponse = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [activeIncident, setActiveIncident] = useState<Incident | null>(null);
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [totalResolved, setTotalResolved] = useState(0);
  const [avgResponseTime, setAvgResponseTime] = useState(0);
  const logRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const processingRef = useRef(false);

  const scrollLog = useCallback(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, []);

  const processPhase = useCallback(async (
    incident: Incident,
    phase: Phase,
    logs: ((atk: typeof ATTACK_TYPES[0]) => string)[],
    logKey: "detectionLog" | "containmentLog" | "recoveryLog"
  ) => {
    const atk = ATTACK_TYPES.find(a => a.type === incident.type) || ATTACK_TYPES[0];
    
    setIncidents(prev => prev.map(inc => 
      inc.id === incident.id ? { ...inc, phase } : inc
    ));
    setActiveIncident(prev => prev?.id === incident.id ? { ...prev, phase } : prev);

    for (const logFn of logs) {
      await new Promise(r => setTimeout(r, 400 + Math.random() * 300));
      const logLine = logFn(atk);
      setIncidents(prev => prev.map(inc => 
        inc.id === incident.id ? { ...inc, [logKey]: [...inc[logKey], logLine] } : inc
      ));
      setActiveIncident(prev => {
        if (prev?.id === incident.id) {
          return { ...prev, [logKey]: [...prev[logKey], logLine] };
        }
        return prev;
      });
      scrollLog();
    }
  }, [scrollLog]);

  const handleIncident = useCallback(async (incident: Incident) => {
    if (processingRef.current) return;
    processingRef.current = true;
    const start = Date.now();

    setActiveIncident(incident);

    await processPhase(incident, "detection", DETECTION_LOGS, "detectionLog");
    await new Promise(r => setTimeout(r, 600));
    await processPhase(incident, "containment", CONTAINMENT_LOGS, "containmentLog");
    await new Promise(r => setTimeout(r, 600));
    await processPhase(incident, "recovery", RECOVERY_LOGS, "recoveryLog");

    const elapsed = ((Date.now() - start) / 1000);
    
    setIncidents(prev => prev.map(inc => 
      inc.id === incident.id ? { ...inc, phase: "complete" } : inc
    ));
    setActiveIncident(prev => prev?.id === incident.id ? { ...prev, phase: "complete" } : prev);
    setTotalResolved(prev => prev + 1);
    setAvgResponseTime(prev => prev === 0 ? elapsed : (prev + elapsed) / 2);
    
    processingRef.current = false;
  }, [processPhase]);

  // Auto-generate incidents
  useEffect(() => {
    if (!isAutoMode) return;

    const generate = () => {
      const atk = ATTACK_TYPES[Math.floor(Math.random() * ATTACK_TYPES.length)];
      const incident: Incident = {
        id: `INC-${Date.now()}`,
        type: atk.type,
        source: atk.source,
        severity: atk.severity,
        timestamp: new Date().toLocaleTimeString(),
        phase: "idle",
        details: [],
        detectionLog: [],
        containmentLog: [],
        recoveryLog: [],
      };

      setIncidents(prev => [incident, ...prev].slice(0, 10));

      if (!processingRef.current) {
        handleIncident(incident);
      }
    };

    generate();
    intervalRef.current = setInterval(generate, 18000);
    return () => clearInterval(intervalRef.current);
  }, [isAutoMode, handleIncident]);

  const triggerManual = () => {
    const atk = ATTACK_TYPES[Math.floor(Math.random() * ATTACK_TYPES.length)];
    const incident: Incident = {
      id: `INC-${Date.now()}`,
      type: atk.type,
      source: atk.source,
      severity: atk.severity,
      timestamp: new Date().toLocaleTimeString(),
      phase: "idle",
      details: [],
      detectionLog: [],
      containmentLog: [],
      recoveryLog: [],
    };
    setIncidents(prev => [incident, ...prev].slice(0, 10));
    if (!processingRef.current) handleIncident(incident);
  };

  const currentPhase = activeIncident?.phase || "idle";
  const config = phaseConfig[currentPhase];
  const PhaseIcon = config.icon;

  return (
    <section id="incident-response" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-destructive/[0.02] to-transparent" />
      <div className="container mx-auto px-6 relative">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
            <span className="font-mono text-[10px] tracking-[0.3em] text-primary/60 uppercase">Automated Response</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground text-center mb-4 tracking-tight">
            Incident <span className="text-primary text-glow">Response</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-center">
            Fully automated incident response pipeline — detect attacks, contain damage, and restore systems in real-time without human intervention.
          </p>
        </motion.div>

        {/* Phase Pipeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-4xl mx-auto"
        >
          {(["detection", "containment", "recovery"] as const).map((phase, i) => {
            const pc = phaseConfig[phase];
            const Icon = pc.icon;
            const isActive = currentPhase === phase;
            const isDone = (
              (phase === "detection" && ["containment", "recovery", "complete"].includes(currentPhase)) ||
              (phase === "containment" && ["recovery", "complete"].includes(currentPhase)) ||
              (phase === "recovery" && currentPhase === "complete")
            );

            return (
              <div key={phase} className="relative">
                <motion.div
                  animate={isActive ? { borderColor: "hsl(var(--primary))" } : {}}
                  className={`p-5 rounded-xl border transition-all duration-500 ${
                    isActive 
                      ? `${pc.bg} border-primary/40 shadow-lg` 
                      : isDone 
                        ? "bg-success/5 border-success/20" 
                        : "bg-card/40 border-border/30"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${isActive ? pc.bg : isDone ? "bg-success/10" : "bg-muted/30"}`}>
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      ) : (
                        <Icon className={`w-5 h-5 ${isActive ? pc.color : "text-muted-foreground/40"}`} />
                      )}
                    </div>
                    <div>
                      <p className={`text-xs font-mono uppercase tracking-wider ${isActive ? pc.color : isDone ? "text-success" : "text-muted-foreground/50"}`}>
                        Phase {i + 1}
                      </p>
                      <p className={`font-semibold text-sm ${isActive ? "text-foreground" : isDone ? "text-success" : "text-muted-foreground/60"}`}>
                        {pc.label}
                      </p>
                    </div>
                    {isActive && (
                      <motion.div
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="ml-auto"
                      >
                        <Activity className={`w-4 h-4 ${pc.color}`} />
                      </motion.div>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground/60">
                    {phase === "detection" && "AI-powered threat detection using Suricata, Wazuh & behavioral analysis"}
                    {phase === "containment" && "Auto-firewall rules, WAF injection, network isolation to stop damage"}
                    {phase === "recovery" && "System restore from backup, integrity verification, service restart"}
                  </p>
                  {isActive && (
                    <motion.div
                      className="mt-3 h-1 rounded-full bg-muted/30 overflow-hidden"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <motion.div
                        className={`h-full rounded-full ${
                          phase === "detection" ? "bg-destructive" : phase === "containment" ? "bg-warning" : "bg-success"
                        }`}
                        animate={{ width: ["0%", "100%"] }}
                        transition={{ duration: phase === "recovery" ? 6 : 4, ease: "linear" }}
                      />
                    </motion.div>
                  )}
                </motion.div>
                {i < 2 && (
                  <div className="hidden md:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10">
                    <ChevronRight className={`w-4 h-4 ${isDone ? "text-success" : "text-muted-foreground/20"}`} />
                  </div>
                )}
              </div>
            );
          })}
        </motion.div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 max-w-4xl mx-auto">
          {[
            { label: "Active Incidents", value: incidents.filter(i => !["idle", "complete"].includes(i.phase)).length, icon: AlertTriangle, color: "text-destructive" },
            { label: "Total Resolved", value: totalResolved, icon: CheckCircle2, color: "text-success" },
            { label: "Avg Response", value: `${avgResponseTime.toFixed(1)}s`, icon: Clock, color: "text-primary" },
            { label: "Auto Mode", value: isAutoMode ? "ON" : "OFF", icon: Zap, color: isAutoMode ? "text-success" : "text-muted-foreground" },
          ].map((stat) => (
            <div key={stat.label} className="p-3 rounded-lg bg-card/40 border border-border/30 text-center">
              <stat.icon className={`w-4 h-4 ${stat.color} mx-auto mb-1`} />
              <p className={`text-lg font-bold font-mono ${stat.color}`}>{stat.value}</p>
              <p className="text-[9px] text-muted-foreground/50 font-mono uppercase">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Main Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-4"
        >
          {/* Incident List */}
          <div className="lg:col-span-2 rounded-xl border border-border/40 bg-card/30 overflow-hidden">
            <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-xs font-mono text-foreground/80">Incidents</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsAutoMode(!isAutoMode)}
                  className={`text-[9px] font-mono px-2 py-1 rounded border transition-all ${
                    isAutoMode 
                      ? "bg-success/10 border-success/30 text-success" 
                      : "bg-muted/20 border-border/30 text-muted-foreground"
                  }`}
                >
                  {isAutoMode ? "AUTO" : "MANUAL"}
                </button>
                <button
                  onClick={triggerManual}
                  disabled={processingRef.current}
                  className="text-[9px] font-mono px-2 py-1 rounded bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all disabled:opacity-30"
                >
                  <Play className="w-2.5 h-2.5 inline mr-1" />
                  SIMULATE
                </button>
              </div>
            </div>
            <div className="h-[400px] overflow-y-auto">
              <AnimatePresence>
                {incidents.map((inc) => {
                  const pc = phaseConfig[inc.phase];
                  const Icon = pc.icon;
                  return (
                    <motion.div
                      key={inc.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => setActiveIncident(inc)}
                      className={`px-4 py-3 border-b border-border/20 cursor-pointer hover:bg-card/60 transition-all ${
                        activeIncident?.id === inc.id ? "bg-primary/5 border-l-2 border-l-primary" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`w-3.5 h-3.5 ${pc.color}`} />
                        <span className="text-[10px] font-mono text-foreground/80 truncate flex-1">{inc.type}</span>
                        <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded ${pc.bg} ${pc.color}`}>
                          {pc.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[9px] text-muted-foreground/50 font-mono">
                        <span>{inc.id}</span>
                        <span>•</span>
                        <span>{inc.source}</span>
                        <span>•</span>
                        <span className={
                          inc.severity === "critical" ? "text-destructive" : 
                          inc.severity === "high" ? "text-warning" : "text-accent"
                        }>{inc.severity.toUpperCase()}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {incidents.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground/30">
                  <Shield className="w-8 h-8 mb-2" />
                  <p className="text-xs font-mono">No incidents</p>
                </div>
              )}
            </div>
          </div>

          {/* Live Response Log */}
          <div className="lg:col-span-3 rounded-xl border border-border/40 bg-background overflow-hidden">
            <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between bg-card/50">
              <div className="flex items-center gap-2">
                <PhaseIcon className={`w-4 h-4 ${config.color}`} />
                <span className="text-xs font-mono text-foreground/80">
                  {activeIncident ? `${activeIncident.id} — ${activeIncident.type}` : "Response Log"}
                </span>
              </div>
              {activeIncident && currentPhase !== "idle" && currentPhase !== "complete" && (
                <motion.div
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="flex items-center gap-1.5"
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    currentPhase === "detection" ? "bg-destructive" : 
                    currentPhase === "containment" ? "bg-warning" : "bg-success"
                  }`} />
                  <span className={`text-[9px] font-mono ${config.color}`}>PROCESSING</span>
                </motion.div>
              )}
            </div>
            <div ref={logRef} className="h-[400px] overflow-y-auto p-4 font-mono text-[11px] leading-relaxed">
              {activeIncident ? (
                <>
                  {activeIncident.detectionLog.length > 0 && (
                    <div className="mb-3">
                      <p className="text-destructive/60 text-[9px] uppercase tracking-wider mb-1">━━ Detection Phase ━━</p>
                      {activeIncident.detectionLog.map((log, i) => (
                        <motion.div
                          key={`d-${i}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`whitespace-pre-wrap ${
                            log.includes("✓") ? "text-success/80" : 
                            log.includes("ALERT") || log.includes("MALICIOUS") ? "text-destructive/80" : 
                            "text-foreground/60"
                          }`}
                        >
                          {log}
                        </motion.div>
                      ))}
                    </div>
                  )}
                  {activeIncident.containmentLog.length > 0 && (
                    <div className="mb-3">
                      <p className="text-warning/60 text-[9px] uppercase tracking-wider mb-1">━━ Containment Phase ━━</p>
                      {activeIncident.containmentLog.map((log, i) => (
                        <motion.div
                          key={`c-${i}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`whitespace-pre-wrap ${
                            log.includes("✓") ? "text-success/80" : "text-warning/70"
                          }`}
                        >
                          {log}
                        </motion.div>
                      ))}
                    </div>
                  )}
                  {activeIncident.recoveryLog.length > 0 && (
                    <div className="mb-3">
                      <p className="text-success/60 text-[9px] uppercase tracking-wider mb-1">━━ Recovery Phase ━━</p>
                      {activeIncident.recoveryLog.map((log, i) => (
                        <motion.div
                          key={`r-${i}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`whitespace-pre-wrap ${
                            log.includes("✓") || log.includes("RESTORED") ? "text-success/80" : "text-foreground/60"
                          }`}
                        >
                          {log}
                        </motion.div>
                      ))}
                    </div>
                  )}
                  {activeIncident.phase === "complete" && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-4 p-3 rounded-lg bg-success/10 border border-success/20 text-center"
                    >
                      <CheckCircle2 className="w-6 h-6 text-success mx-auto mb-2" />
                      <p className="text-success font-semibold text-xs">INCIDENT RESOLVED</p>
                      <p className="text-success/60 text-[10px] mt-1">All systems restored • Monitoring elevated</p>
                    </motion.div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground/30">
                  <Activity className="w-8 h-8 mb-2" />
                  <p className="text-xs">Select an incident to view response log</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default IncidentResponse;
