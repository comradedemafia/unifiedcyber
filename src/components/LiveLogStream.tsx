import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ScrollText } from "lucide-react";

const logSources = ["WAZUH", "SURICATA", "MODSEC", "SYSLOG", "FILEBEAT"];
const logLevels = ["INFO", "WARN", "ERROR", "ALERT", "DEBUG"];
const logMessages = [
  "Connection established from 10.0.1.{ip}",
  "Rule {rule} fired: {action}",
  "File integrity check passed: /etc/{file}",
  "Packet inspection: {proto} {src} → {dst}",
  "Authentication success: user={user}",
  "Session timeout for user={user}",
  "Rate limit triggered: {ip} ({count} req/s)",
  "Certificate renewal: {domain}",
  "Malware signature match: {sig}",
  "Backup completed: {size} MB in {time}s",
];

const randomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomIP = () => Math.floor(Math.random() * 254 + 1);

const generateLog = () => {
  let msg = randomItem(logMessages);
  msg = msg.replace("{ip}", String(randomIP()));
  msg = msg.replace("{rule}", String(100000 + Math.floor(Math.random() * 900)));
  msg = msg.replace("{action}", randomItem(["blocked", "allowed", "flagged", "dropped"]));
  msg = msg.replace("{file}", randomItem(["passwd", "shadow", "crontab", "hosts", "resolv.conf"]));
  msg = msg.replace("{proto}", randomItem(["TCP", "UDP", "ICMP", "DNS"]));
  msg = msg.replace("{src}", `10.0.${randomIP()}.${randomIP()}`);
  msg = msg.replace("{dst}", `192.168.1.${randomIP()}`);
  msg = msg.replace("{user}", randomItem(["admin", "operator", "guest", "root", "sysadmin"]));
  msg = msg.replace("{count}", String(Math.floor(Math.random() * 500 + 50)));
  msg = msg.replace("{domain}", randomItem(["security.local", "wazuh.local", "api.ucsf.local"]));
  msg = msg.replace("{sig}", `SIG-${Math.floor(Math.random() * 9999)}`);
  msg = msg.replace("{size}", String(Math.floor(Math.random() * 500 + 10)));
  msg = msg.replace("{time}", String(Math.floor(Math.random() * 30 + 2)));

  const level = randomItem(logLevels);
  return {
    id: Date.now() + Math.random(),
    timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
    source: randomItem(logSources),
    level,
    message: msg,
  };
};

const levelColor: Record<string, string> = {
  INFO: "text-primary/70",
  WARN: "text-warning",
  ERROR: "text-destructive",
  ALERT: "text-destructive",
  DEBUG: "text-muted-foreground/50",
};

const LiveLogStream = () => {
  const [logs, setLogs] = useState(() => Array.from({ length: 15 }, generateLog));
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setLogs((prev) => [...prev, generateLog()].slice(-50));
    }, 800 + Math.random() * 1200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <section id="logs" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/10 to-transparent" />
      <div className="container mx-auto px-6 relative">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="font-mono text-[10px] tracking-[0.3em] text-primary/60 uppercase flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
              Streaming
            </motion.span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground text-center mb-4 tracking-tight">
            Log <span className="text-primary text-glow">Stream</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-center">
            Live aggregated log stream from Wazuh, Suricata, ModSecurity, and system agents.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto rounded-xl border border-border/60 bg-background overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-card/80 border-b border-border/40">
            <ScrollText className="w-3.5 h-3.5 text-primary/50" />
            <span className="font-mono text-[10px] text-muted-foreground">unified_log_stream.py — tail -f</span>
            <div className="ml-auto flex items-center gap-1.5">
              <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-success" />
              <span className="font-mono text-[9px] text-success/70">STREAMING</span>
            </div>
          </div>

          {/* Log output */}
          <div ref={scrollRef} className="h-[350px] overflow-y-auto p-4 font-mono text-[11px] leading-[1.8]">
            {logs.map((log) => (
              <div key={log.id} className="flex gap-3 hover:bg-muted/10 px-1 rounded">
                <span className="text-muted-foreground/40 shrink-0">{log.timestamp}</span>
                <span className="text-accent/60 shrink-0 w-16">{log.source}</span>
                <span className={`shrink-0 w-12 ${levelColor[log.level]}`}>{log.level}</span>
                <span className="text-foreground/60">{log.message}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default LiveLogStream;
