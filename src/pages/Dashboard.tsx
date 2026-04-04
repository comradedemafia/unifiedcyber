import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import {
  Shield, AlertTriangle, CheckCircle2, Activity, Globe, Lock,
  LogOut, Ban, Flame, Bug, TrendingUp, Server, Users, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import NotificationPanel from "@/components/NotificationPanel";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalIncidents: 0,
    activeThreats: 0,
    blockedIPs: 0,
    resolvedIncidents: 0,
  });
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const [incidents, alerts, blocked] = await Promise.all([
        supabase.from("security_incidents").select("id, status", { count: "exact" }),
        supabase.from("threat_alerts").select("*").order("created_at", { ascending: false }).limit(10),
        supabase.from("blocked_ips").select("id", { count: "exact" }),
      ]);

      const incidentData = incidents.data || [];
      setStats({
        totalIncidents: incidents.count || 0,
        activeThreats: incidentData.filter(i => i.status !== "resolved").length,
        blockedIPs: blocked.count || 0,
        resolvedIncidents: incidentData.filter(i => i.status === "resolved").length,
      });
      setRecentAlerts(alerts.data || []);
      setLoading(false);
    };

    loadData();

    // Realtime subscription
    const channel = supabase
      .channel("dashboard-alerts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "threat_alerts" }, (payload) => {
        setRecentAlerts(prev => [payload.new, ...prev].slice(0, 10));
        setStats(prev => ({ ...prev, activeThreats: prev.activeThreats + 1 }));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const statCards = [
    { label: "Total Incidents", value: stats.totalIncidents, icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
    { label: "Active Threats", value: stats.activeThreats, icon: Flame, color: "text-warning", bg: "bg-warning/10" },
    { label: "Blocked IPs", value: stats.blockedIPs, icon: Ban, color: "text-accent", bg: "bg-accent/10" },
    { label: "Resolved", value: stats.resolvedIncidents, icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
  ];

  const sevColor = (s: string) => s === "critical" ? "text-destructive" : s === "high" ? "text-warning" : s === "medium" ? "text-accent" : "text-muted-foreground";

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">UCSF Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <NotificationPanel />
            <span className="text-xs text-muted-foreground font-mono hidden sm:block">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-xs font-mono gap-1">
              <Globe className="w-3 h-3" /> Home
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-xs font-mono gap-1 text-destructive">
              <LogOut className="w-3 h-3" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground mb-1">Security Operations Center</h1>
          <p className="text-sm text-muted-foreground mb-8">Real-time overview of system security status</p>
        </motion.div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card border border-border/50 rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg ${s.bg}`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">{s.label}</span>
              </div>
              <p className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</p>
            </motion.div>
          ))}
        </div>

        {/* System health */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          <div className="bg-card border border-border/50 rounded-xl p-5">
            <h3 className="text-sm font-mono font-semibold text-foreground mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" /> System Health
            </h3>
            <div className="space-y-3">
              {[
                { name: "Firewall", status: "active", uptime: "99.99%" },
                { name: "IDS/IPS (Suricata)", status: "active", uptime: "99.97%" },
                { name: "Encryption Module", status: "active", uptime: "100%" },
                { name: "Threat Intelligence", status: "active", uptime: "99.95%" },
                { name: "Log Aggregator", status: "active", uptime: "99.98%" },
              ].map((svc) => (
                <div key={svc.name} className="flex items-center justify-between p-2 rounded-lg bg-muted/10">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    <span className="text-xs font-mono text-foreground">{svc.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-[8px]">{svc.status}</Badge>
                    <span className="text-[10px] font-mono text-muted-foreground">{svc.uptime}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent alerts */}
          <div className="bg-card border border-border/50 rounded-xl p-5">
            <h3 className="text-sm font-mono font-semibold text-foreground mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" /> Recent Alerts
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentAlerts.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No recent alerts from database. Simulated alerts appear in the notification panel.</p>
              ) : (
                recentAlerts.map((alert: any) => (
                  <div key={alert.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors">
                    <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 ${sevColor(alert.severity)}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-mono text-foreground truncate">{alert.alert_type}</p>
                      <p className="text-[9px] text-muted-foreground truncate">{alert.message}</p>
                    </div>
                    <Badge variant={alert.severity === "critical" ? "destructive" : "secondary"} className="text-[8px] shrink-0">
                      {alert.severity}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
