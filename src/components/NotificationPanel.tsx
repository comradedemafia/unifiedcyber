import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, AlertTriangle, Shield, Flame, Bug, Volume2, VolumeX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface Notification {
  id: string;
  type: string;
  severity: string;
  message: string;
  source_ip?: string;
  timestamp: string;
  is_read: boolean;
}

const NotificationPanel = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Generate simulation notifications
  useEffect(() => {
    const types = [
      { type: "DDoS Attack", severity: "critical", msg: "DDoS SYN flood detected from multiple sources" },
      { type: "SQL Injection", severity: "high", msg: "SQL injection attempt blocked on /api/login" },
      { type: "Brute Force", severity: "high", msg: "Multiple failed login attempts from single IP" },
      { type: "Malware", severity: "critical", msg: "Malware signature detected in uploaded file" },
      { type: "Port Scan", severity: "medium", msg: "Sequential port scanning detected" },
      { type: "XSS Attempt", severity: "medium", msg: "Cross-site scripting payload blocked by WAF" },
    ];

    const addNotif = () => {
      const t = types[Math.floor(Math.random() * types.length)];
      const notif: Notification = {
        id: crypto.randomUUID(),
        type: t.type,
        severity: t.severity,
        message: t.msg,
        source_ip: `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`,
        timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
        is_read: false,
      };
      setNotifications(prev => [notif, ...prev].slice(0, 50));

      if (soundEnabled && t.severity === "critical") {
        try {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 880;
          osc.type = "square";
          gain.gain.value = 0.05;
          osc.start();
          osc.stop(ctx.currentTime + 0.15);
        } catch {}
      }
    };

    addNotif();
    const iv = setInterval(addNotif, 15000);
    return () => clearInterval(iv);
  }, [soundEnabled]);

  // Subscribe to realtime alerts
  useEffect(() => {
    const channel = supabase
      .channel("threat-alerts-notif")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "threat_alerts" }, (payload) => {
        const row = payload.new as any;
        setNotifications(prev => [{
          id: row.id,
          type: row.alert_type,
          severity: row.severity,
          message: row.message,
          source_ip: row.source_ip,
          timestamp: new Date(row.created_at).toLocaleTimeString("en-US", { hour12: false }),
          is_read: false,
        }, ...prev].slice(0, 50));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));

  const sevIcon = (s: string) => {
    if (s === "critical") return <Flame className="w-3.5 h-3.5 text-destructive" />;
    if (s === "high") return <AlertTriangle className="w-3.5 h-3.5 text-warning" />;
    return <Shield className="w-3.5 h-3.5 text-accent" />;
  };

  const sevBadge = (s: string) => {
    if (s === "critical") return "destructive" as const;
    if (s === "high") return "default" as const;
    return "secondary" as const;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-muted-foreground hover:text-primary transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="flex items-center justify-between p-3 border-b border-border/50">
                <span className="text-xs font-mono font-semibold text-foreground">Security Alerts</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSoundEnabled(!soundEnabled)} className="text-muted-foreground hover:text-foreground">
                    {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={markAllRead} className="text-[10px] font-mono text-primary hover:underline">
                    Mark all read
                  </button>
                  <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">No alerts</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 border-b border-border/30 hover:bg-muted/20 transition-colors ${!n.is_read ? "bg-primary/5" : ""}`}
                    >
                      <div className="flex items-start gap-2">
                        {sevIcon(n.severity)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[11px] font-mono font-semibold text-foreground truncate">{n.type}</span>
                            <Badge variant={sevBadge(n.severity)} className="text-[8px] px-1.5 py-0">
                              {n.severity}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground leading-tight">{n.message}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {n.source_ip && <span className="text-[9px] font-mono text-primary/60">{n.source_ip}</span>}
                            <span className="text-[9px] font-mono text-muted-foreground/50">{n.timestamp}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationPanel;
