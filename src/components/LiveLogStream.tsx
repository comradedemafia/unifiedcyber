import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ScrollText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";

interface SecurityLogEntry {
  id: string;
  created_at: string;
  event_type: string | null;
  action: string | null;
  resource_type: string | null;
  severity: string | null;
  status: string | null;
  ip_address: string | null;
  source_system: string | null;
}

const levelColor: Record<string, string> = {
  INFO: "text-primary/70",
  WARN: "text-warning",
  ERROR: "text-destructive",
  ALERT: "text-destructive",
  DEBUG: "text-muted-foreground/50",
  UNKNOWN: "text-muted-foreground/50",
};

const formatLevel = (level?: string) => (level ? level.toUpperCase() : "UNKNOWN");

const LiveLogStream = () => {
  const [logs, setLogs] = useState<SecurityLogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useSupabaseRealtime(
    "security-log-stream",
    [
      {
        event: "INSERT",
        schema: "public",
        table: "security_logs",
        callback: (payload) => {
          const newLog = payload.new as SecurityLogEntry;
          setLogs((prev) => [...prev.slice(-49), newLog]);
        },
      },
    ],
    [setLogs]
  );

  useEffect(() => {
    const loadLogs = async () => {
      const { data, error } = await supabase
        .from("security_logs")
        .select("id, created_at, event_type, action, resource_type, severity, status, ip_address, source_system")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("LiveLogStream load error", error);
        return;
      }
      setLogs(data.reverse());
    };

    loadLogs();
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
            Live aggregated log stream from your Supabase security pipeline.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto rounded-xl border border-border/60 bg-background overflow-hidden"
        >
          <div className="flex items-center gap-2 px-4 py-2.5 bg-card/80 border-b border-border/40">
            <ScrollText className="w-3.5 h-3.5 text-primary/50" />
            <span className="font-mono text-[10px] text-muted-foreground">security_logs — realtime</span>
            <div className="ml-auto flex items-center gap-1.5">
              <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-success" />
              <span className="font-mono text-[9px] text-success/70">STREAMING</span>
            </div>
          </div>

          <div ref={scrollRef} className="h-[350px] overflow-y-auto p-4 font-mono text-[11px] leading-[1.8]">
            {logs.map((log) => (
              <div key={log.id} className="flex gap-3 hover:bg-muted/10 px-1 rounded">
                <span className="text-muted-foreground/40 shrink-0 w-16">{new Date(log.created_at).toLocaleTimeString("en-US", { hour12: false })}</span>
                <span className="text-accent/60 shrink-0 w-20">{log.source_system ?? "SYS"}</span>
                <span className={`shrink-0 w-14 ${levelColor[formatLevel(log.severity)]}`}>
                  {formatLevel(log.severity)}
                </span>
                <span className="text-foreground/60">
                  [{log.event_type ?? log.action ?? "event"}] {log.resource_type ?? "resource"} {log.ip_address ? `from ${log.ip_address}` : ""}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default LiveLogStream;
