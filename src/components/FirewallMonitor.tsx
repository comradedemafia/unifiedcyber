import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ShieldOff, ShieldCheck, ArrowDownToLine, ArrowUpFromLine, Ban, CheckCircle2, AlertTriangle, Flame, Globe, Server, Wifi, Filter, Play, Pause, Settings2, RotateCcw } from "lucide-react";

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
  bytes: number;
}

const maliciousPatterns = [
  { threat: "SQL Injection Attempt", port: 80, protocol: "HTTP", reason: "Malicious payload detected in request" },
  { threat: "Port Scan Detected", port: 22, protocol: "TCP", reason: "Rapid sequential port probing" },
  { threat: "DDoS SYN Flood", port: 443, protocol: "TCP", reason: "Abnormal SYN packet rate exceeded threshold" },
  { threat: "Brute Force SSH", port: 22, protocol: "SSH", reason: "Multiple failed auth attempts from source" },
  { threat: "Malware C2 Callback", port: 8443, protocol: "HTTPS", reason: "Known C2 server communication blocked" },
  { threat: "DNS Tunneling", port: 53, protocol: "DNS", reason: "Suspicious DNS query pattern detected" },
  { threat: "XSS Payload", port: 80, protocol: "HTTP", reason: "Cross-site scripting attempt blocked by WAF" },
  { threat: "RCE Exploit (CVE-2024-1234)", port: 8080, protocol: "HTTP", reason: "Remote code execution payload intercepted" },
];

const safePatterns = [
  { port: 443, protocol: "HTTPS", reason: "Valid TLS handshake, certificate verified" },
  { port: 80, protocol: "HTTP", reason: "Clean GET request, no malicious signatures" },
  { port: 53, protocol: "DNS", reason: "Standard DNS resolution query" },
  { port: 993, protocol: "IMAPS", reason: "Encrypted email retrieval" },
  { port: 123, protocol: "NTP", reason: "Time synchronization request" },
  { port: 443, protocol: "HTTPS", reason: "API call to trusted endpoint" },
];

const randomIP = () => `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`;
const localIP = () => `192.168.${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 250) + 1}`;

const generateTraffic = (): TrafficEntry => {
  const isMalicious = Math.random() < 0.35;
  const isInbound = Math.random() < 0.6;
  const now = new Date();

  if (isMalicious) {
    const p = maliciousPatterns[Math.floor(Math.random() * maliciousPatterns.length)];
    return {
      id: crypto.randomUUID(),
      direction: isInbound ? "inbound" : "outbound",
      srcIP: isInbound ? randomIP() : localIP(),
      dstIP: isInbound ? localIP() : randomIP(),
      port: p.port,
      protocol: p.protocol,
      status: "blocked",
      reason: p.reason,
      threat: p.threat,
      timestamp: now.toLocaleTimeString("en-US", { hour12: false }),
      bytes: Math.floor(Math.random() * 5000) + 64,
    };
  }

  const p = safePatterns[Math.floor(Math.random() * safePatterns.length)];
  return {
    id: crypto.randomUUID(),
    direction: isInbound ? "inbound" : "outbound",
    srcIP: isInbound ? randomIP() : localIP(),
    dstIP: isInbound ? localIP() : randomIP(),
    port: p.port,
    protocol: p.protocol,
    status: "allowed",
    reason: p.reason,
    timestamp: now.toLocaleTimeString("en-US", { hour12: false }),
    bytes: Math.floor(Math.random() * 50000) + 200,
  };
};

const FirewallMonitor = () => {
  const [traffic, setTraffic] = useState<TrafficEntry[]>([]);
  const [stats, setStats] = useState({ totalIn: 0, totalOut: 0, blocked: 0, allowed: 0, threats: 0, bytesProcessed: 0 });
  const [filter, setFilter] = useState<"all" | "blocked" | "allowed">("all");
  const [paused, setPaused] = useState(false);
  const [firewallActive, setFirewallActive] = useState(true);
  const [rules, setRules] = useState([
    { id: 1, name: "Block Known Malicious IPs", active: true, type: "blacklist" },
    { id: 2, name: "DDoS Rate Limiting (1000 req/s)", active: true, type: "rate-limit" },
    { id: 3, name: "SQL Injection Filter", active: true, type: "waf" },
    { id: 4, name: "XSS Prevention", active: true, type: "waf" },
    { id: 5, name: "Port Scan Detection", active: true, type: "ids" },
    { id: 6, name: "Geo-Block (Sanctioned Countries)", active: true, type: "geo" },
  ]);

  const toggleRule = (id: number) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  useEffect(() => {
    if (paused || !firewallActive) return;
    const interval = setInterval(() => {
      const entry = generateTraffic();
      setTraffic(prev => [entry, ...prev].slice(0, 50));
      setStats(prev => ({
        totalIn: prev.totalIn + (entry.direction === "inbound" ? 1 : 0),
        totalOut: prev.totalOut + (entry.direction === "outbound" ? 1 : 0),
        blocked: prev.blocked + (entry.status === "blocked" ? 1 : 0),
        allowed: prev.allowed + (entry.status === "allowed" ? 1 : 0),
        threats: prev.threats + (entry.threat ? 1 : 0),
        bytesProcessed: prev.bytesProcessed + entry.bytes,
      }));
    }, 1200);
    return () => clearInterval(interval);
  }, [paused, firewallActive]);

  const filtered = traffic.filter(t => filter === "all" || t.status === filter);

  const formatBytes = (b: number) => b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : b > 1024 ? `${(b / 1024).toFixed(1)} KB` : `${b} B`;

  return (
    <section id="firewall" className="py-24 relative">
      <div className="absolute inset-0 bg-dots opacity-5" />
      <div className="container mx-auto px-6 relative">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="font-mono text-[10px] tracking-[0.3em] text-warning uppercase flex items-center gap-2"
            >
              <Flame className="w-3 h-3" />
              Firewall Active
            </motion.span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground text-center mb-4 tracking-tight">
            Network <span className="text-primary text-glow">Firewall</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-center">
            Real-time traffic monitoring & control — blocking malicious packets, allowing verified connections.
          </p>
        </motion.div>

        {/* Stats Row */}
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          {[
            { label: "Inbound", value: stats.totalIn, icon: ArrowDownToLine, color: "text-primary" },
            { label: "Outbound", value: stats.totalOut, icon: ArrowUpFromLine, color: "text-accent" },
            { label: "Allowed", value: stats.allowed, icon: CheckCircle2, color: "text-success" },
            { label: "Blocked", value: stats.blocked, icon: Ban, color: "text-destructive" },
            { label: "Threats", value: stats.threats, icon: AlertTriangle, color: "text-warning" },
            { label: "Processed", value: formatBytes(stats.bytesProcessed), icon: Server, color: "text-muted-foreground" },
          ].map((s) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-lg border border-border/60 bg-card/60 backdrop-blur-sm p-3 text-center"
            >
              <s.icon className={`w-4 h-4 ${s.color} mx-auto mb-1`} />
              <div className={`font-mono text-lg font-bold ${s.color}`}>{s.value}</div>
              <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">{s.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_280px] gap-5">
          {/* Traffic Feed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm overflow-hidden"
          >
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <span className="font-mono text-xs text-muted-foreground">Traffic Monitor</span>
                {!paused && firewallActive && (
                  <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 1, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-success" />
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Filter */}
                <div className="flex bg-muted/30 rounded-md border border-border/40 overflow-hidden">
                  {(["all", "allowed", "blocked"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-2.5 py-1 text-[10px] font-mono transition-all ${
                        filter === f ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {f.toUpperCase()}
                    </button>
                  ))}
                </div>
                <button onClick={() => setPaused(!paused)} className="p-1.5 rounded-md hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors">
                  {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => { setTraffic([]); setStats({ totalIn: 0, totalOut: 0, blocked: 0, allowed: 0, threats: 0, bytesProcessed: 0 }); }} className="p-1.5 rounded-md hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors">
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Header Row */}
            <div className="grid grid-cols-[60px_70px_130px_130px_55px_50px_1fr] gap-2 px-4 py-2 border-b border-border/30 text-[9px] font-mono text-muted-foreground/60 uppercase tracking-wider">
              <span>Status</span><span>Dir</span><span>Source</span><span>Destination</span><span>Port</span><span>Proto</span><span>Reason</span>
            </div>

            {/* Entries */}
            <div className="max-h-[420px] overflow-y-auto scrollbar-thin">
              <AnimatePresence initial={false}>
                {filtered.length === 0 ? (
                  <div className="flex items-center justify-center py-16 text-muted-foreground/40 font-mono text-xs">
                    {firewallActive ? "Waiting for traffic..." : "Firewall disabled"}
                  </div>
                ) : filtered.map((t) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, x: -20, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`grid grid-cols-[60px_70px_130px_130px_55px_50px_1fr] gap-2 px-4 py-2 border-b border-border/20 text-[11px] font-mono items-center hover:bg-muted/20 transition-colors ${
                      t.status === "blocked" ? "bg-destructive/5" : ""
                    }`}
                  >
                    <span className={`flex items-center gap-1 font-bold ${t.status === "blocked" ? "text-destructive" : "text-success"}`}>
                      {t.status === "blocked" ? <Ban className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                      <span className="hidden sm:inline">{t.status === "blocked" ? "DROP" : "PASS"}</span>
                    </span>
                    <span className={`flex items-center gap-1 ${t.direction === "inbound" ? "text-primary" : "text-accent"}`}>
                      {t.direction === "inbound" ? <ArrowDownToLine className="w-3 h-3" /> : <ArrowUpFromLine className="w-3 h-3" />}
                      <span className="hidden sm:inline">{t.direction === "inbound" ? "IN" : "OUT"}</span>
                    </span>
                    <span className="text-foreground/80 truncate">{t.srcIP}</span>
                    <span className="text-foreground/80 truncate">{t.dstIP}</span>
                    <span className="text-warning">{t.port}</span>
                    <span className="text-muted-foreground">{t.protocol}</span>
                    <span className={`truncate ${t.threat ? "text-destructive/80" : "text-muted-foreground/60"}`}>
                      {t.threat ? `⚠ ${t.threat}` : t.reason}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Firewall Rules Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4 flex flex-col gap-4"
          >
            {/* Master Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-primary" />
                <span className="font-mono text-xs text-muted-foreground">Firewall Rules</span>
              </div>
              <button
                onClick={() => setFirewallActive(!firewallActive)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold transition-all ${
                  firewallActive
                    ? "bg-success/15 text-success border border-success/30"
                    : "bg-destructive/15 text-destructive border border-destructive/30"
                }`}
              >
                {firewallActive ? "ENABLED" : "DISABLED"}
              </button>
            </div>

            {/* Visual Diagram */}
            <div className="rounded-lg border border-border/40 bg-muted/10 p-3">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <span className="text-[9px] font-mono text-muted-foreground">INTERNET</span>
              </div>
              <div className="flex justify-center mb-2">
                <div className="flex flex-col items-center">
                  <motion.div
                    animate={{ y: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-primary"
                  >
                    <ArrowDownToLine className="w-4 h-4" />
                  </motion.div>
                  <span className="text-[8px] font-mono text-success">Safe</span>
                </div>
                <div className="w-6" />
                <div className="flex flex-col items-center">
                  <motion.div
                    animate={{ y: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                    className="text-destructive"
                  >
                    <Ban className="w-4 h-4" />
                  </motion.div>
                  <span className="text-[8px] font-mono text-destructive">Blocked</span>
                </div>
              </div>
              <div className={`mx-auto w-16 h-16 rounded-lg border-2 flex items-center justify-center mb-2 transition-all ${
                firewallActive ? "border-primary/50 bg-primary/10" : "border-destructive/50 bg-destructive/10"
              }`}>
                {firewallActive ? <ShieldCheck className="w-8 h-8 text-primary" /> : <ShieldOff className="w-8 h-8 text-destructive" />}
              </div>
              <div className="text-center text-[8px] font-mono text-muted-foreground mb-2">FIREWALL</div>
              <div className="flex justify-center">
                <motion.div animate={{ y: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}>
                  <ArrowDownToLine className="w-4 h-4 text-success" />
                </motion.div>
              </div>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Server className="w-4 h-4 text-muted-foreground" />
                <span className="text-[9px] font-mono text-muted-foreground">INTERNAL NETWORK</span>
              </div>
            </div>

            {/* Rules List */}
            <div className="flex flex-col gap-2">
              {rules.map((rule) => (
                <button
                  key={rule.id}
                  onClick={() => toggleRule(rule.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all ${
                    rule.active
                      ? "border-success/30 bg-success/5 hover:bg-success/10"
                      : "border-border/30 bg-muted/10 hover:bg-muted/20 opacity-50"
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 ${rule.active ? "bg-success" : "bg-muted-foreground/30"}`} />
                  <span className={`text-[10px] font-mono flex-1 ${rule.active ? "text-foreground/80" : "text-muted-foreground"}`}>
                    {rule.name}
                  </span>
                  <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded ${
                    rule.type === "waf" ? "bg-accent/15 text-accent" :
                    rule.type === "ids" ? "bg-warning/15 text-warning" :
                    rule.type === "rate-limit" ? "bg-primary/15 text-primary" :
                    "bg-muted/30 text-muted-foreground"
                  }`}>
                    {rule.type.toUpperCase()}
                  </span>
                </button>
              ))}
            </div>

            {/* Quick Stats */}
            <div className="mt-auto pt-3 border-t border-border/30 space-y-2">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-muted-foreground">Block Rate</span>
                <span className="text-destructive font-bold">
                  {stats.totalIn + stats.totalOut > 0 ? Math.round((stats.blocked / (stats.totalIn + stats.totalOut)) * 100) : 0}%
                </span>
              </div>
              <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-success to-destructive"
                  animate={{ width: `${stats.totalIn + stats.totalOut > 0 ? (stats.blocked / (stats.totalIn + stats.totalOut)) * 100 : 0}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                <span className="flex items-center gap-1"><Wifi className="w-3 h-3" /> Active Rules</span>
                <span className="text-foreground">{rules.filter(r => r.active).length}/{rules.length}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FirewallMonitor;
