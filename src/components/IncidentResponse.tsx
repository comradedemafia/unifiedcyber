import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, AlertTriangle, Ban, RotateCcw, CheckCircle2, 
  Activity, Zap, Server, Globe, Lock, Eye,
  ChevronRight, Play, Clock, ArrowDownToLine, ArrowUpFromLine,
  ShieldCheck, ShieldOff, Flame, Filter, Pause, Settings2,
  Wifi, Radar, ShieldAlert, Crosshair, ScanSearch, Bug, KeyRound
} from "lucide-react";
import EncryptionPanel from "./EncryptionPanel";

type Phase = "idle" | "detection" | "containment" | "recovery" | "complete";
type TabView = "response" | "firewall" | "ids" | "ips" | "encryption";

interface Incident {
  id: string;
  type: string;
  source: string;
  severity: "critical" | "high" | "medium";
  timestamp: string;
  phase: Phase;
  detectionLog: string[];
  containmentLog: string[];
  recoveryLog: string[];
}

interface TrafficEntry {
  id: string;
  direction: "inbound" | "outbound";
  srcIP: string;
  dstIP: string;
  port: number;
  protocol: string;
  status: "allowed" | "blocked";
  reason: string;
  threat?: string;
  timestamp: string;
}

interface IDSAlert {
  id: string;
  timestamp: string;
  severity: "critical" | "high" | "medium" | "low";
  signature: string;
  srcIP: string;
  dstIP: string;
  action: string;
  category: string;
}

interface IPSAction {
  id: string;
  timestamp: string;
  threat: string;
  srcIP: string;
  action: "dropped" | "reset" | "rate-limited" | "quarantined";
  rule: string;
  details: string;
}

// ─── Data generators ────────────────────────────────────────
const ATTACK_TYPES = [
  { type: "SQL Injection Attack", source: "45.33.32.156", severity: "critical" as const },
  { type: "Brute Force SSH", source: "185.220.101.42", severity: "high" as const },
  { type: "DDoS SYN Flood", source: "103.75.190.11", severity: "critical" as const },
  { type: "Ransomware Detected", source: "192.168.1.105", severity: "critical" as const },
  { type: "DNS Tunneling", source: "91.219.237.229", severity: "high" as const },
  { type: "XSS Payload Injection", source: "178.128.88.201", severity: "medium" as const },
];

const DETECTION_LOGS = [
  (a: typeof ATTACK_TYPES[0]) => `[SURICATA] Alert triggered: ${a.type} from ${a.source}`,
  (a: typeof ATTACK_TYPES[0]) => `[WAZUH] Correlation engine matched rule ID: ${1000 + Math.floor(Math.random() * 9000)}`,
  (a: typeof ATTACK_TYPES[0]) => `[SIEM] Threat level assessed: ${a.severity.toUpperCase()}`,
  () => `[AI-ENGINE] Behavioral analysis: anomalous pattern confirmed`,
  () => `[IDS] Intrusion signature matched — forwarding to IPS`,
  () => `[ALERT] Incident auto-created → initiating response pipeline...`,
];
const CONTAINMENT_LOGS = [
  (a: typeof ATTACK_TYPES[0]) => `[FIREWALL] iptables -A INPUT -s ${a.source} -j DROP ✓`,
  () => `[IPS] Auto-block rule activated — traffic dropped ✓`,
  () => `[WAF] ModSecurity rule injected: block pattern match ✓`,
  () => `[NETWORK] Isolating affected subnet from core network ✓`,
  (a: typeof ATTACK_TYPES[0]) => `[IDS] Suricata blacklist updated: ${a.source} added ✓`,
  () => `[CONTAINMENT] Damage spread halted — perimeter secured ✓`,
];
const RECOVERY_LOGS = [
  () => `[BACKUP] Initiating system snapshot restore...`,
  () => `[DATABASE] Rolling back to last clean state`,
  () => `[INTEGRITY] File integrity check: /etc/shadow → RESTORED ✓`,
  () => `[SERVICES] Restarting affected services: apache2, mysql, sshd ✓`,
  () => `[IPS] Updating prevention signatures from latest threat intel ✓`,
  () => `[MONITOR] Post-incident monitoring enabled (24h elevated alert) ✓`,
  () => `[RECOVERY] System fully restored — all services operational ✓`,
];

const randomIP = () => `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`;
const localIP = () => `192.168.${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 250) + 1}`;

const maliciousPatterns = [
  { threat: "SQL Injection", port: 80, protocol: "HTTP", reason: "Malicious payload detected" },
  { threat: "Port Scan", port: 22, protocol: "TCP", reason: "Rapid port probing" },
  { threat: "DDoS SYN Flood", port: 443, protocol: "TCP", reason: "Abnormal SYN rate" },
  { threat: "Brute Force SSH", port: 22, protocol: "SSH", reason: "Multiple failed auth" },
  { threat: "Malware C2", port: 8443, protocol: "HTTPS", reason: "C2 communication blocked" },
  { threat: "DNS Tunneling", port: 53, protocol: "DNS", reason: "Suspicious DNS pattern" },
  { threat: "XSS Payload", port: 80, protocol: "HTTP", reason: "XSS blocked by WAF" },
  { threat: "RCE Exploit", port: 8080, protocol: "HTTP", reason: "RCE payload intercepted" },
];
const safePatterns = [
  { port: 443, protocol: "HTTPS", reason: "Valid TLS handshake" },
  { port: 80, protocol: "HTTP", reason: "Clean request, no signatures" },
  { port: 53, protocol: "DNS", reason: "Standard DNS query" },
  { port: 993, protocol: "IMAPS", reason: "Encrypted email retrieval" },
];

const generateTraffic = (): TrafficEntry => {
  const isMalicious = Math.random() < 0.35;
  const isInbound = Math.random() < 0.6;
  if (isMalicious) {
    const p = maliciousPatterns[Math.floor(Math.random() * maliciousPatterns.length)];
    return { id: crypto.randomUUID(), direction: isInbound ? "inbound" : "outbound", srcIP: isInbound ? randomIP() : localIP(), dstIP: isInbound ? localIP() : randomIP(), port: p.port, protocol: p.protocol, status: "blocked", reason: p.reason, threat: p.threat, timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }) };
  }
  const p = safePatterns[Math.floor(Math.random() * safePatterns.length)];
  return { id: crypto.randomUUID(), direction: isInbound ? "inbound" : "outbound", srcIP: isInbound ? randomIP() : localIP(), dstIP: isInbound ? localIP() : randomIP(), port: p.port, protocol: p.protocol, status: "allowed", reason: p.reason, timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }) };
};

const IDS_SIGNATURES = [
  { signature: "ET EXPLOIT CVE-2024-1234 RCE Attempt", category: "Exploit", severity: "critical" as const },
  { signature: "ET SCAN Nmap SYN Scan Detected", category: "Reconnaissance", severity: "high" as const },
  { signature: "ET MALWARE Win32.Emotet CnC Beacon", category: "Malware", severity: "critical" as const },
  { signature: "ET SQL Injection SELECT Statement", category: "Web Attack", severity: "high" as const },
  { signature: "ET DNS Query to .onion Domain", category: "Policy Violation", severity: "medium" as const },
  { signature: "ET TROJAN Cobalt Strike Beacon", category: "Malware", severity: "critical" as const },
  { signature: "ET WEB_SERVER XSS Cookie Stealing", category: "Web Attack", severity: "high" as const },
  { signature: "ET POLICY SSH Brute Force Attempt", category: "Brute Force", severity: "medium" as const },
];

const generateIDSAlert = (): IDSAlert => {
  const sig = IDS_SIGNATURES[Math.floor(Math.random() * IDS_SIGNATURES.length)];
  return {
    id: `IDS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
    severity: sig.severity,
    signature: sig.signature,
    srcIP: randomIP(),
    dstIP: localIP(),
    action: "ALERT",
    category: sig.category,
  };
};

const IPS_ACTIONS_LIST = [
  { threat: "SYN Flood Attack", action: "dropped" as const, rule: "IPS-DDOS-001", details: "Rate exceeded 5000 pps — all SYN from source dropped" },
  { threat: "SQL Injection Payload", action: "reset" as const, rule: "IPS-WAF-042", details: "TCP connection reset — malicious SQL in HTTP body" },
  { threat: "Brute Force Login", action: "rate-limited" as const, rule: "IPS-AUTH-015", details: "Source rate-limited to 3 req/min after 10 failed attempts" },
  { threat: "Malware Download", action: "dropped" as const, rule: "IPS-MAL-088", details: "Executable download blocked — hash matches known malware" },
  { threat: "C2 Beacon Traffic", action: "quarantined" as const, rule: "IPS-C2-033", details: "Host isolated — outbound C2 communication detected" },
  { threat: "Path Traversal", action: "reset" as const, rule: "IPS-WEB-019", details: "Connection reset — directory traversal attempt blocked" },
];

const generateIPSAction = (): IPSAction => {
  const a = IPS_ACTIONS_LIST[Math.floor(Math.random() * IPS_ACTIONS_LIST.length)];
  return { id: `IPS-${Date.now()}-${Math.floor(Math.random() * 1000)}`, timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }), threat: a.threat, srcIP: randomIP(), action: a.action, rule: a.rule, details: a.details };
};

const phaseConfig = {
  idle: { color: "text-muted-foreground", bg: "bg-muted/20", label: "Standby", icon: Eye },
  detection: { color: "text-destructive", bg: "bg-destructive/10", label: "Detection", icon: AlertTriangle },
  containment: { color: "text-warning", bg: "bg-warning/10", label: "Containment", icon: Ban },
  recovery: { color: "text-success", bg: "bg-success/10", label: "Recovery", icon: RotateCcw },
  complete: { color: "text-success", bg: "bg-success/10", label: "Resolved", icon: CheckCircle2 },
};

// ─── Component ──────────────────────────────────────────────
const IncidentResponse = () => {
  const [activeTab, setActiveTab] = useState<TabView>("response");
  // Incident Response state
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [activeIncident, setActiveIncident] = useState<Incident | null>(null);
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [totalResolved, setTotalResolved] = useState(0);
  const [avgResponseTime, setAvgResponseTime] = useState(0);
  const logRef = useRef<HTMLDivElement>(null);
  const processingRef = useRef(false);

  // Firewall state
  const [traffic, setTraffic] = useState<TrafficEntry[]>([]);
  const [fwStats, setFwStats] = useState({ totalIn: 0, totalOut: 0, blocked: 0, allowed: 0, threats: 0 });
  const [fwFilter, setFwFilter] = useState<"all" | "blocked" | "allowed">("all");
  const [fwPaused, setFwPaused] = useState(false);
  const [firewallActive, setFirewallActive] = useState(true);
  const [fwRules, setFwRules] = useState([
    { id: 1, name: "Block Malicious IPs", active: true, type: "blacklist" },
    { id: 2, name: "DDoS Rate Limiting", active: true, type: "rate-limit" },
    { id: 3, name: "SQL Injection Filter", active: true, type: "waf" },
    { id: 4, name: "XSS Prevention", active: true, type: "waf" },
    { id: 5, name: "Port Scan Detection", active: true, type: "ids" },
    { id: 6, name: "Geo-Block", active: true, type: "geo" },
  ]);

  // IDS state
  const [idsAlerts, setIdsAlerts] = useState<IDSAlert[]>([]);
  const [idsStats, setIdsStats] = useState({ total: 0, critical: 0, high: 0, medium: 0, low: 0 });
  const [idsPaused, setIdsPaused] = useState(false);

  // IPS state
  const [ipsActions, setIpsActions] = useState<IPSAction[]>([]);
  const [ipsStats, setIpsStats] = useState({ dropped: 0, reset: 0, rateLimited: 0, quarantined: 0 });
  const [ipsPaused, setIpsPaused] = useState(false);

  const scrollLog = useCallback(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, []);

  // ── Incident processing ──
  const processPhase = useCallback(async (
    incident: Incident, phase: Phase,
    logs: ((a: typeof ATTACK_TYPES[0]) => string)[],
    logKey: "detectionLog" | "containmentLog" | "recoveryLog"
  ) => {
    const atk = ATTACK_TYPES.find(a => a.type === incident.type) || ATTACK_TYPES[0];
    setIncidents(prev => prev.map(inc => inc.id === incident.id ? { ...inc, phase } : inc));
    setActiveIncident(prev => prev?.id === incident.id ? { ...prev, phase } : prev);
    for (const logFn of logs) {
      await new Promise(r => setTimeout(r, 400 + Math.random() * 300));
      const logLine = logFn(atk);
      setIncidents(prev => prev.map(inc => inc.id === incident.id ? { ...inc, [logKey]: [...inc[logKey], logLine] } : inc));
      setActiveIncident(prev => prev?.id === incident.id ? { ...prev, [logKey]: [...prev[logKey], logLine] } : prev);
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
    const elapsed = (Date.now() - start) / 1000;
    setIncidents(prev => prev.map(inc => inc.id === incident.id ? { ...inc, phase: "complete" } : inc));
    setActiveIncident(prev => prev?.id === incident.id ? { ...prev, phase: "complete" } : prev);
    setTotalResolved(prev => prev + 1);
    setAvgResponseTime(prev => prev === 0 ? elapsed : (prev + elapsed) / 2);
    processingRef.current = false;
  }, [processPhase]);

  // Auto incidents
  useEffect(() => {
    if (!isAutoMode) return;
    const generate = () => {
      const atk = ATTACK_TYPES[Math.floor(Math.random() * ATTACK_TYPES.length)];
      const incident: Incident = { id: `INC-${Date.now()}`, type: atk.type, source: atk.source, severity: atk.severity, timestamp: new Date().toLocaleTimeString(), phase: "idle", detectionLog: [], containmentLog: [], recoveryLog: [] };
      setIncidents(prev => [incident, ...prev].slice(0, 10));
      if (!processingRef.current) handleIncident(incident);
    };
    generate();
    const iv = setInterval(generate, 18000);
    return () => clearInterval(iv);
  }, [isAutoMode, handleIncident]);

  // ── Firewall traffic ──
  useEffect(() => {
    if (fwPaused || !firewallActive) return;
    const iv = setInterval(() => {
      const entry = generateTraffic();
      setTraffic(prev => [entry, ...prev].slice(0, 50));
      setFwStats(prev => ({
        totalIn: prev.totalIn + (entry.direction === "inbound" ? 1 : 0),
        totalOut: prev.totalOut + (entry.direction === "outbound" ? 1 : 0),
        blocked: prev.blocked + (entry.status === "blocked" ? 1 : 0),
        allowed: prev.allowed + (entry.status === "allowed" ? 1 : 0),
        threats: prev.threats + (entry.threat ? 1 : 0),
      }));
    }, 1200);
    return () => clearInterval(iv);
  }, [fwPaused, firewallActive]);

  // ── IDS alerts ──
  useEffect(() => {
    if (idsPaused) return;
    const iv = setInterval(() => {
      const alert = generateIDSAlert();
      setIdsAlerts(prev => [alert, ...prev].slice(0, 40));
      setIdsStats(prev => ({
        total: prev.total + 1,
        critical: prev.critical + (alert.severity === "critical" ? 1 : 0),
        high: prev.high + (alert.severity === "high" ? 1 : 0),
        medium: prev.medium + (alert.severity === "medium" ? 1 : 0),
        low: prev.low + (alert.severity === "low" ? 1 : 0),
      }));
    }, 2000);
    return () => clearInterval(iv);
  }, [idsPaused]);

  // ── IPS actions ──
  useEffect(() => {
    if (ipsPaused) return;
    const iv = setInterval(() => {
      const action = generateIPSAction();
      setIpsActions(prev => [action, ...prev].slice(0, 40));
      setIpsStats(prev => ({
        dropped: prev.dropped + (action.action === "dropped" ? 1 : 0),
        reset: prev.reset + (action.action === "reset" ? 1 : 0),
        rateLimited: prev.rateLimited + (action.action === "rate-limited" ? 1 : 0),
        quarantined: prev.quarantined + (action.action === "quarantined" ? 1 : 0),
      }));
    }, 2500);
    return () => clearInterval(iv);
  }, [ipsPaused]);

  const triggerManual = () => {
    const atk = ATTACK_TYPES[Math.floor(Math.random() * ATTACK_TYPES.length)];
    const incident: Incident = { id: `INC-${Date.now()}`, type: atk.type, source: atk.source, severity: atk.severity, timestamp: new Date().toLocaleTimeString(), phase: "idle", detectionLog: [], containmentLog: [], recoveryLog: [] };
    setIncidents(prev => [incident, ...prev].slice(0, 10));
    if (!processingRef.current) handleIncident(incident);
  };

  const currentPhase = activeIncident?.phase || "idle";
  const config = phaseConfig[currentPhase];
  const PhaseIcon = config.icon;
  const filteredTraffic = traffic.filter(t => fwFilter === "all" || t.status === fwFilter);

  const sevColor = (s: string) => s === "critical" ? "text-destructive" : s === "high" ? "text-warning" : s === "medium" ? "text-accent" : "text-muted-foreground";
  const sevBg = (s: string) => s === "critical" ? "bg-destructive/10" : s === "high" ? "bg-warning/10" : s === "medium" ? "bg-accent/10" : "bg-muted/10";
  const actionColor = (a: string) => a === "dropped" ? "text-destructive" : a === "reset" ? "text-warning" : a === "rate-limited" ? "text-accent" : "text-primary";
  const actionBg = (a: string) => a === "dropped" ? "bg-destructive/10" : a === "reset" ? "bg-warning/10" : a === "rate-limited" ? "bg-accent/10" : "bg-primary/10";

  // ─── Tabs config ──
  const tabs: { key: TabView; label: string; icon: typeof Shield; color: string }[] = [
    { key: "response", label: "Incident Response", icon: Shield, color: "text-primary" },
    { key: "firewall", label: "Firewall", icon: Flame, color: "text-warning" },
    { key: "ids", label: "IDS", icon: Radar, color: "text-accent" },
    { key: "ips", label: "IPS", icon: ShieldAlert, color: "text-destructive" },
    { key: "encryption", label: "Encryption", icon: KeyRound, color: "text-emerald-400" },
  ];

  return (
    <section id="incident-response" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-destructive/[0.02] to-transparent" />
      <div className="container mx-auto px-6 relative">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
            <span className="font-mono text-[10px] tracking-[0.3em] text-primary/60 uppercase">Security Operations Center</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground text-center mb-4 tracking-tight">
            Incident <span className="text-primary text-glow">Response</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-center">
            Automated security operations — Incident Response, Firewall, Intrusion Detection & Prevention systems working together.
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <div className="max-w-6xl mx-auto mb-6">
          <div className="flex flex-wrap gap-2 justify-center">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border font-mono text-xs transition-all ${
                    activeTab === tab.key
                      ? `${tab.color} border-primary/40 bg-primary/10 shadow-lg`
                      : "text-muted-foreground border-border/30 bg-card/30 hover:bg-card/60"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.key === "ids" && idsStats.total > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-accent/20 text-accent text-[9px]">{idsStats.total}</span>
                  )}
                  {tab.key === "ips" && (ipsStats.dropped + ipsStats.reset + ipsStats.rateLimited + ipsStats.quarantined) > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-destructive/20 text-destructive text-[9px]">{ipsStats.dropped + ipsStats.reset + ipsStats.rateLimited + ipsStats.quarantined}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══════════ INCIDENT RESPONSE TAB ═══════════ */}
        {activeTab === "response" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto">
            {/* Phase Pipeline */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {(["detection", "containment", "recovery"] as const).map((phase, i) => {
                const pc = phaseConfig[phase];
                const Icon = pc.icon;
                const isActive = currentPhase === phase;
                const isDone = (phase === "detection" && ["containment","recovery","complete"].includes(currentPhase)) || (phase === "containment" && ["recovery","complete"].includes(currentPhase)) || (phase === "recovery" && currentPhase === "complete");
                return (
                  <div key={phase} className="relative">
                    <motion.div animate={isActive ? { borderColor: "hsl(var(--primary))" } : {}} className={`p-5 rounded-xl border transition-all duration-500 ${isActive ? `${pc.bg} border-primary/40 shadow-lg` : isDone ? "bg-success/5 border-success/20" : "bg-card/40 border-border/30"}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg ${isActive ? pc.bg : isDone ? "bg-success/10" : "bg-muted/30"}`}>
                          {isDone ? <CheckCircle2 className="w-5 h-5 text-success" /> : <Icon className={`w-5 h-5 ${isActive ? pc.color : "text-muted-foreground/40"}`} />}
                        </div>
                        <div>
                          <p className={`text-xs font-mono uppercase tracking-wider ${isActive ? pc.color : isDone ? "text-success" : "text-muted-foreground/50"}`}>Phase {i + 1}</p>
                          <p className={`font-semibold text-sm ${isActive ? "text-foreground" : isDone ? "text-success" : "text-muted-foreground/60"}`}>{pc.label}</p>
                        </div>
                        {isActive && <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} className="ml-auto"><Activity className={`w-4 h-4 ${pc.color}`} /></motion.div>}
                      </div>
                      <p className="text-[11px] text-muted-foreground/60">
                        {phase === "detection" && "AI-powered detection via Suricata, Wazuh & IDS"}
                        {phase === "containment" && "Firewall + IPS auto-block, WAF injection, network isolation"}
                        {phase === "recovery" && "System restore, integrity check, service restart"}
                      </p>
                      {isActive && (
                        <motion.div className="mt-3 h-1 rounded-full bg-muted/30 overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <motion.div className={`h-full rounded-full ${phase === "detection" ? "bg-destructive" : phase === "containment" ? "bg-warning" : "bg-success"}`} animate={{ width: ["0%", "100%"] }} transition={{ duration: phase === "recovery" ? 6 : 4, ease: "linear" }} />
                        </motion.div>
                      )}
                    </motion.div>
                    {i < 2 && <div className="hidden md:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10"><ChevronRight className={`w-4 h-4 ${isDone ? "text-success" : "text-muted-foreground/20"}`} /></div>}
                  </div>
                );
              })}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {[
                { label: "Active", value: incidents.filter(i => !["idle","complete"].includes(i.phase)).length, icon: AlertTriangle, color: "text-destructive" },
                { label: "Resolved", value: totalResolved, icon: CheckCircle2, color: "text-success" },
                { label: "Avg Response", value: `${avgResponseTime.toFixed(1)}s`, icon: Clock, color: "text-primary" },
                { label: "Auto Mode", value: isAutoMode ? "ON" : "OFF", icon: Zap, color: isAutoMode ? "text-success" : "text-muted-foreground" },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-lg bg-card/40 border border-border/30 text-center">
                  <s.icon className={`w-4 h-4 ${s.color} mx-auto mb-1`} />
                  <p className={`text-lg font-bold font-mono ${s.color}`}>{s.value}</p>
                  <p className="text-[9px] text-muted-foreground/50 font-mono uppercase">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Incident list + log */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2 rounded-xl border border-border/40 bg-card/30 overflow-hidden">
                <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
                  <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /><span className="text-xs font-mono text-foreground/80">Incidents</span></div>
                  <div className="flex gap-2">
                    <button onClick={() => setIsAutoMode(!isAutoMode)} className={`text-[9px] font-mono px-2 py-1 rounded border transition-all ${isAutoMode ? "bg-success/10 border-success/30 text-success" : "bg-muted/20 border-border/30 text-muted-foreground"}`}>{isAutoMode ? "AUTO" : "MANUAL"}</button>
                    <button onClick={triggerManual} disabled={processingRef.current} className="text-[9px] font-mono px-2 py-1 rounded bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 disabled:opacity-30"><Play className="w-2.5 h-2.5 inline mr-1" />SIMULATE</button>
                  </div>
                </div>
                <div className="h-[400px] overflow-y-auto">
                  <AnimatePresence>
                    {incidents.map(inc => {
                      const pc = phaseConfig[inc.phase]; const Icon = pc.icon;
                      return (
                        <motion.div key={inc.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} onClick={() => setActiveIncident(inc)}
                          className={`px-4 py-3 border-b border-border/20 cursor-pointer hover:bg-card/60 transition-all ${activeIncident?.id === inc.id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className={`w-3.5 h-3.5 ${pc.color}`} />
                            <span className="text-[10px] font-mono text-foreground/80 truncate flex-1">{inc.type}</span>
                            <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded ${pc.bg} ${pc.color}`}>{pc.label}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[9px] text-muted-foreground/50 font-mono">
                            <span>{inc.id}</span><span>•</span><span>{inc.source}</span><span>•</span>
                            <span className={sevColor(inc.severity)}>{inc.severity.toUpperCase()}</span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  {incidents.length === 0 && <div className="flex flex-col items-center justify-center h-full text-muted-foreground/30"><Shield className="w-8 h-8 mb-2" /><p className="text-xs font-mono">No incidents</p></div>}
                </div>
              </div>

              <div className="lg:col-span-3 rounded-xl border border-border/40 bg-background overflow-hidden">
                <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between bg-card/50">
                  <div className="flex items-center gap-2"><PhaseIcon className={`w-4 h-4 ${config.color}`} /><span className="text-xs font-mono text-foreground/80">{activeIncident ? `${activeIncident.id} — ${activeIncident.type}` : "Response Log"}</span></div>
                  {activeIncident && !["idle","complete"].includes(currentPhase) && (
                    <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${currentPhase === "detection" ? "bg-destructive" : currentPhase === "containment" ? "bg-warning" : "bg-success"}`} />
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
                            <motion.div key={`d-${i}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={`whitespace-pre-wrap ${log.includes("✓") ? "text-success/80" : log.includes("ALERT") || log.includes("MALICIOUS") ? "text-destructive/80" : "text-foreground/60"}`}>{log}</motion.div>
                          ))}
                        </div>
                      )}
                      {activeIncident.containmentLog.length > 0 && (
                        <div className="mb-3">
                          <p className="text-warning/60 text-[9px] uppercase tracking-wider mb-1">━━ Containment Phase ━━</p>
                          {activeIncident.containmentLog.map((log, i) => (
                            <motion.div key={`c-${i}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={`whitespace-pre-wrap ${log.includes("✓") ? "text-success/80" : "text-warning/70"}`}>{log}</motion.div>
                          ))}
                        </div>
                      )}
                      {activeIncident.recoveryLog.length > 0 && (
                        <div className="mb-3">
                          <p className="text-success/60 text-[9px] uppercase tracking-wider mb-1">━━ Recovery Phase ━━</p>
                          {activeIncident.recoveryLog.map((log, i) => (
                            <motion.div key={`r-${i}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={`whitespace-pre-wrap ${log.includes("✓") || log.includes("RESTORED") ? "text-success/80" : "text-foreground/60"}`}>{log}</motion.div>
                          ))}
                        </div>
                      )}
                      {activeIncident.phase === "complete" && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-4 p-3 rounded-lg bg-success/10 border border-success/20 text-center">
                          <CheckCircle2 className="w-6 h-6 text-success mx-auto mb-2" />
                          <p className="text-success font-semibold text-xs">INCIDENT RESOLVED</p>
                          <p className="text-success/60 text-[10px] mt-1">All systems restored • Monitoring elevated</p>
                        </motion.div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground/30"><Activity className="w-8 h-8 mb-2" /><p className="text-xs">Select an incident to view response log</p></div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══════════ FIREWALL TAB ═══════════ */}
        {activeTab === "firewall" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              {[
                { label: "Inbound", value: fwStats.totalIn, icon: ArrowDownToLine, color: "text-primary" },
                { label: "Outbound", value: fwStats.totalOut, icon: ArrowUpFromLine, color: "text-accent" },
                { label: "Allowed", value: fwStats.allowed, icon: CheckCircle2, color: "text-success" },
                { label: "Blocked", value: fwStats.blocked, icon: Ban, color: "text-destructive" },
                { label: "Threats", value: fwStats.threats, icon: AlertTriangle, color: "text-warning" },
              ].map(s => (
                <div key={s.label} className="rounded-lg border border-border/60 bg-card/60 backdrop-blur-sm p-3 text-center">
                  <s.icon className={`w-4 h-4 ${s.color} mx-auto mb-1`} />
                  <div className={`font-mono text-lg font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-[1fr_260px] gap-5">
              {/* Traffic feed */}
              <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <span className="font-mono text-xs text-muted-foreground">Traffic Monitor</span>
                    {!fwPaused && firewallActive && <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 1, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-success" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex bg-muted/30 rounded-md border border-border/40 overflow-hidden">
                      {(["all","allowed","blocked"] as const).map(f => (
                        <button key={f} onClick={() => setFwFilter(f)} className={`px-2.5 py-1 text-[10px] font-mono transition-all ${fwFilter === f ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}>{f.toUpperCase()}</button>
                      ))}
                    </div>
                    <button onClick={() => setFwPaused(!fwPaused)} className="p-1.5 rounded-md hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors">
                      {fwPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-[55px_55px_120px_120px_50px_50px_1fr] gap-2 px-4 py-2 border-b border-border/30 text-[9px] font-mono text-muted-foreground/60 uppercase tracking-wider">
                  <span>Status</span><span>Dir</span><span>Source</span><span>Dest</span><span>Port</span><span>Proto</span><span>Reason</span>
                </div>
                <div className="max-h-[380px] overflow-y-auto scrollbar-thin">
                  <AnimatePresence initial={false}>
                    {filteredTraffic.length === 0 ? (
                      <div className="flex items-center justify-center py-16 text-muted-foreground/40 font-mono text-xs">{firewallActive ? "Waiting for traffic..." : "Firewall disabled"}</div>
                    ) : filteredTraffic.map(t => (
                      <motion.div key={t.id} initial={{ opacity: 0, x: -20, height: 0 }} animate={{ opacity: 1, x: 0, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className={`grid grid-cols-[55px_55px_120px_120px_50px_50px_1fr] gap-2 px-4 py-2 border-b border-border/20 text-[11px] font-mono items-center hover:bg-muted/20 transition-colors ${t.status === "blocked" ? "bg-destructive/5" : ""}`}>
                        <span className={`flex items-center gap-1 font-bold ${t.status === "blocked" ? "text-destructive" : "text-success"}`}>
                          {t.status === "blocked" ? <Ban className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                          <span className="hidden sm:inline">{t.status === "blocked" ? "DROP" : "PASS"}</span>
                        </span>
                        <span className={`flex items-center gap-1 ${t.direction === "inbound" ? "text-primary" : "text-accent"}`}>
                          {t.direction === "inbound" ? <ArrowDownToLine className="w-3 h-3" /> : <ArrowUpFromLine className="w-3 h-3" />}
                        </span>
                        <span className="text-foreground/80 truncate">{t.srcIP}</span>
                        <span className="text-foreground/80 truncate">{t.dstIP}</span>
                        <span className="text-warning">{t.port}</span>
                        <span className="text-muted-foreground">{t.protocol}</span>
                        <span className={`truncate ${t.threat ? "text-destructive/80" : "text-muted-foreground/60"}`}>{t.threat ? `⚠ ${t.threat}` : t.reason}</span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* Rules sidebar */}
              <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><Settings2 className="w-4 h-4 text-primary" /><span className="font-mono text-xs text-muted-foreground">Rules</span></div>
                  <button onClick={() => setFirewallActive(!firewallActive)} className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold transition-all ${firewallActive ? "bg-success/15 text-success border border-success/30" : "bg-destructive/15 text-destructive border border-destructive/30"}`}>
                    {firewallActive ? "ENABLED" : "DISABLED"}
                  </button>
                </div>
                <div className={`mx-auto w-14 h-14 rounded-lg border-2 flex items-center justify-center transition-all ${firewallActive ? "border-primary/50 bg-primary/10" : "border-destructive/50 bg-destructive/10"}`}>
                  {firewallActive ? <ShieldCheck className="w-7 h-7 text-primary" /> : <ShieldOff className="w-7 h-7 text-destructive" />}
                </div>
                <div className="flex flex-col gap-2">
                  {fwRules.map(rule => (
                    <button key={rule.id} onClick={() => setFwRules(prev => prev.map(r => r.id === rule.id ? { ...r, active: !r.active } : r))}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all ${rule.active ? "border-success/30 bg-success/5 hover:bg-success/10" : "border-border/30 bg-muted/10 hover:bg-muted/20 opacity-50"}`}>
                      <div className={`w-2 h-2 rounded-full shrink-0 ${rule.active ? "bg-success" : "bg-muted-foreground/30"}`} />
                      <span className={`text-[10px] font-mono flex-1 ${rule.active ? "text-foreground/80" : "text-muted-foreground"}`}>{rule.name}</span>
                      <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded ${rule.type === "waf" ? "bg-accent/15 text-accent" : rule.type === "ids" ? "bg-warning/15 text-warning" : rule.type === "rate-limit" ? "bg-primary/15 text-primary" : "bg-muted/30 text-muted-foreground"}`}>{rule.type.toUpperCase()}</span>
                    </button>
                  ))}
                </div>
                <div className="mt-auto pt-3 border-t border-border/30 space-y-2">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-muted-foreground">Block Rate</span>
                    <span className="text-destructive font-bold">{fwStats.totalIn + fwStats.totalOut > 0 ? Math.round((fwStats.blocked / (fwStats.totalIn + fwStats.totalOut)) * 100) : 0}%</span>
                  </div>
                  <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full bg-gradient-to-r from-success to-destructive" animate={{ width: `${fwStats.totalIn + fwStats.totalOut > 0 ? (fwStats.blocked / (fwStats.totalIn + fwStats.totalOut)) * 100 : 0}%` }} transition={{ duration: 0.5 }} />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                    <span className="flex items-center gap-1"><Wifi className="w-3 h-3" /> Active Rules</span>
                    <span className="text-foreground">{fwRules.filter(r => r.active).length}/{fwRules.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══════════ IDS TAB ═══════════ */}
        {activeTab === "ids" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto">
            {/* IDS Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              {[
                { label: "Total Alerts", value: idsStats.total, icon: Radar, color: "text-accent" },
                { label: "Critical", value: idsStats.critical, icon: AlertTriangle, color: "text-destructive" },
                { label: "High", value: idsStats.high, icon: ShieldAlert, color: "text-warning" },
                { label: "Medium", value: idsStats.medium, icon: Eye, color: "text-accent" },
                { label: "Low", value: idsStats.low, icon: Activity, color: "text-muted-foreground" },
              ].map(s => (
                <div key={s.label} className="rounded-lg border border-border/60 bg-card/60 backdrop-blur-sm p-3 text-center">
                  <s.icon className={`w-4 h-4 ${s.color} mx-auto mb-1`} />
                  <div className={`font-mono text-lg font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-[1fr_300px] gap-5">
              {/* IDS Alert Feed */}
              <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <Radar className="w-4 h-4 text-accent" />
                    <span className="font-mono text-xs text-muted-foreground">Intrusion Detection System — Suricata Engine</span>
                    {!idsPaused && <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 1, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-accent" />}
                  </div>
                  <button onClick={() => setIdsPaused(!idsPaused)} className="p-1.5 rounded-md hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors">
                    {idsPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="max-h-[420px] overflow-y-auto scrollbar-thin">
                  <AnimatePresence initial={false}>
                    {idsAlerts.map(alert => (
                      <motion.div key={alert.id} initial={{ opacity: 0, x: -20, height: 0 }} animate={{ opacity: 1, x: 0, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className={`px-4 py-3 border-b border-border/20 hover:bg-muted/20 transition-colors ${alert.severity === "critical" ? "bg-destructive/5" : ""}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${sevBg(alert.severity)} ${sevColor(alert.severity)}`}>{alert.severity.toUpperCase()}</span>
                          <span className="text-[10px] font-mono text-foreground/80 flex-1 truncate">{alert.signature}</span>
                          <span className="text-[9px] font-mono text-muted-foreground/50">{alert.timestamp}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[9px] font-mono text-muted-foreground/50">
                          <span className="flex items-center gap-1"><Crosshair className="w-3 h-3" />{alert.srcIP}</span>
                          <span>→</span>
                          <span>{alert.dstIP}</span>
                          <span className="px-1.5 py-0.5 rounded bg-muted/20 text-accent text-[8px]">{alert.category}</span>
                          <span className="ml-auto text-warning font-bold">{alert.action}</span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {idsAlerts.length === 0 && <div className="flex items-center justify-center py-16 text-muted-foreground/40 font-mono text-xs">Monitoring network traffic...</div>}
                </div>
              </div>

              {/* IDS Info panel */}
              <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4 flex flex-col gap-4">
                <div className="flex items-center gap-2 mb-2"><ScanSearch className="w-5 h-5 text-accent" /><span className="font-mono text-sm font-bold text-foreground/80">How IDS Works</span></div>
                <div className="space-y-3 text-[11px] text-muted-foreground/70 font-mono">
                  <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
                    <p className="text-accent font-bold mb-1">1. Packet Inspection</p>
                    <p>Analyzes every packet against 30,000+ Suricata signatures for known attack patterns</p>
                  </div>
                  <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
                    <p className="text-accent font-bold mb-1">2. Anomaly Detection</p>
                    <p>Machine learning models detect zero-day attacks by identifying abnormal traffic behavior</p>
                  </div>
                  <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
                    <p className="text-accent font-bold mb-1">3. Alert & Log</p>
                    <p>Generates alerts with severity classification and forwards to SIEM for correlation</p>
                  </div>
                  <div className="p-3 rounded-lg bg-warning/5 border border-warning/20">
                    <p className="text-warning font-bold mb-1">4. Forward to IPS</p>
                    <p>Critical & high alerts automatically forwarded to IPS for active prevention</p>
                  </div>
                </div>
                <div className="mt-auto pt-3 border-t border-border/30">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-muted-foreground">Engine</span>
                    <span className="text-accent">Suricata 7.0</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono mt-1">
                    <span className="text-muted-foreground">Rules Loaded</span>
                    <span className="text-foreground">31,847</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono mt-1">
                    <span className="text-muted-foreground">Status</span>
                    <span className="text-success font-bold">ACTIVE</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══════════ IPS TAB ═══════════ */}
        {activeTab === "ips" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto">
            {/* IPS Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                { label: "Dropped", value: ipsStats.dropped, icon: Ban, color: "text-destructive" },
                { label: "TCP Reset", value: ipsStats.reset, icon: RotateCcw, color: "text-warning" },
                { label: "Rate-Limited", value: ipsStats.rateLimited, icon: Filter, color: "text-accent" },
                { label: "Quarantined", value: ipsStats.quarantined, icon: Lock, color: "text-primary" },
              ].map(s => (
                <div key={s.label} className="rounded-lg border border-border/60 bg-card/60 backdrop-blur-sm p-3 text-center">
                  <s.icon className={`w-4 h-4 ${s.color} mx-auto mb-1`} />
                  <div className={`font-mono text-lg font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-[1fr_300px] gap-5">
              {/* IPS Action Feed */}
              <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-destructive" />
                    <span className="font-mono text-xs text-muted-foreground">Intrusion Prevention System — Active Defense</span>
                    {!ipsPaused && <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 1, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-destructive" />}
                  </div>
                  <button onClick={() => setIpsPaused(!ipsPaused)} className="p-1.5 rounded-md hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors">
                    {ipsPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="max-h-[420px] overflow-y-auto scrollbar-thin">
                  <AnimatePresence initial={false}>
                    {ipsActions.map(act => (
                      <motion.div key={act.id} initial={{ opacity: 0, x: -20, height: 0 }} animate={{ opacity: 1, x: 0, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="px-4 py-3 border-b border-border/20 hover:bg-muted/20 transition-colors">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${actionBg(act.action)} ${actionColor(act.action)}`}>{act.action.toUpperCase()}</span>
                          <span className="text-[10px] font-mono text-foreground/80 flex-1 truncate">{act.threat}</span>
                          <span className="text-[9px] font-mono text-muted-foreground/50">{act.timestamp}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[9px] font-mono text-muted-foreground/50 mb-1">
                          <span className="flex items-center gap-1"><Bug className="w-3 h-3" />{act.srcIP}</span>
                          <span className="px-1.5 py-0.5 rounded bg-muted/20 text-warning text-[8px]">{act.rule}</span>
                        </div>
                        <p className="text-[10px] font-mono text-muted-foreground/60">{act.details}</p>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {ipsActions.length === 0 && <div className="flex items-center justify-center py-16 text-muted-foreground/40 font-mono text-xs">IPS active — monitoring threats...</div>}
                </div>
              </div>

              {/* IPS Info panel */}
              <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4 flex flex-col gap-4">
                <div className="flex items-center gap-2 mb-2"><ShieldAlert className="w-5 h-5 text-destructive" /><span className="font-mono text-sm font-bold text-foreground/80">How IPS Works</span></div>
                <div className="space-y-3 text-[11px] text-muted-foreground/70 font-mono">
                  <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                    <p className="text-destructive font-bold mb-1">1. Inline Inspection</p>
                    <p>Sits inline with traffic — every packet passes through IPS before reaching destination</p>
                  </div>
                  <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                    <p className="text-destructive font-bold mb-1">2. Auto-Drop</p>
                    <p>Automatically drops malicious packets in real-time — no human intervention needed</p>
                  </div>
                  <div className="p-3 rounded-lg bg-warning/5 border border-warning/20">
                    <p className="text-warning font-bold mb-1">3. TCP Reset</p>
                    <p>Sends RST packets to terminate active attack connections immediately</p>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-primary font-bold mb-1">4. Quarantine</p>
                    <p>Isolates compromised hosts from the network to prevent lateral movement</p>
                  </div>
                </div>
                <div className="mt-auto pt-3 border-t border-border/30">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-muted-foreground">Mode</span>
                    <span className="text-destructive font-bold">INLINE (Active)</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono mt-1">
                    <span className="text-muted-foreground">Prevention Rate</span>
                    <span className="text-success font-bold">99.7%</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono mt-1">
                    <span className="text-muted-foreground">Latency Impact</span>
                    <span className="text-foreground">&lt; 2ms</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono mt-1">
                    <span className="text-muted-foreground">IDS → IPS Link</span>
                    <span className="text-success">CONNECTED</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══════════ ENCRYPTION TAB ═══════════ */}
        {activeTab === "encryption" && <EncryptionPanel />}
      </div>
    </section>
  );
};

export default IncidentResponse;
