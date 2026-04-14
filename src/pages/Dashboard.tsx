import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import {
  Shield, AlertTriangle, CheckCircle2, Activity, Globe, Lock,
  LogOut, Ban, Flame, Bug, TrendingUp, Server, Users, Clock, Eye,
  Send, Zap, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import NotificationPanel from "@/components/NotificationPanel";
import ThemeToggle from "@/components/ThemeToggle";
import SecurityMonitor from "@/components/SecurityMonitor";
import DefensePosture from "@/components/DefensePosture";
import AdvancedThreatDetection from "@/components/AdvancedThreatDetection";
import ExternalSystemDefense from "@/components/ExternalSystemDefense";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalIncidents: 0,
    activeThreats: 0,
    blockedIPs: 0,
    resolvedIncidents: 0,
  });
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [autoResponses, setAutoResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingTest, setSendingTest] = useState(false);
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [testAlertType, setTestAlertType] = useState("DDoS Attack");
  const [testSeverity, setTestSeverity] = useState("critical");
  const [testMessage, setTestMessage] = useState("Test critical alert from SOC dashboard");
  const [testSourceIp, setTestSourceIp] = useState("192.168.1.100");

  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [incidents, alerts, blocked] = await Promise.all([
          supabase.from("security_incidents").select("id, status", { count: "exact" }),
          supabase.from("threat_alerts").select("*").order("created_at", { ascending: false }).limit(10),
          supabase.from("blocked_ips").select("id", { count: "exact" }),
        ]);

        const incidentData = incidents.data || [];
        if (!mountedRef.current) return;

        setStats({
          totalIncidents: incidents.count || 0,
          activeThreats: incidentData.filter(i => i.status !== "resolved").length,
          blockedIPs: blocked.count || 0,
          resolvedIncidents: incidentData.filter(i => i.status === "resolved").length,
        });
        setRecentAlerts(alerts.data || []);
      } catch (error) {
        console.error("Dashboard load failed", error);
        toast({ title: "Dashboard error", description: "Unable to fetch dashboard data", variant: "destructive" });
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  const handleAutoResponse = useCallback(async (alert: any) => {
    const responseLog: any = {
      id: crypto.randomUUID(),
      time: new Date().toLocaleTimeString("en-US", { hour12: false }),
      alert_type: alert.alert_type,
      source_ip: alert.source_ip,
      actions: [],
      status: "executing",
    };

    setAutoResponses(prev => [responseLog, ...prev].slice(0, 20));

    try {
      const { error: blockError } = await supabase.from("blocked_ips").insert({
        ip_address: alert.source_ip,
        reason: `Auto-blocked: ${alert.alert_type} - ${alert.message}`,
        blocked_by: "automated-response",
        is_permanent: false,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

      responseLog.actions.push({
        action: "Block IP",
        status: blockError ? "failed" : "success",
        detail: blockError ? blockError.message : `${alert.source_ip} blocked for 24h`,
      });

      const { error: incError } = await supabase.from("security_incidents").insert({
        incident_type: alert.alert_type,
        severity: alert.severity,
        description: `Auto-generated from critical alert: ${alert.message}`,
        source_ip: alert.source_ip,
        status: "investigating",
        response_actions: [
          { action: "IP Blocked", time: new Date().toISOString() },
          { action: "Incident Created", time: new Date().toISOString() },
          { action: "Admin Notified", time: new Date().toISOString() },
        ],
      });

      responseLog.actions.push({
        action: "Create Incident",
        status: incError ? "failed" : "success",
        detail: incError ? incError.message : "Incident logged",
      });

      const { error: alertError } = await supabase.functions.invoke("send-critical-alert", {
        body: {
          alert_type: alert.alert_type,
          severity: alert.severity,
          message: alert.message,
          source_ip: alert.source_ip,
          admin_email: user?.email || "admin@ucsf.local",
        },
      });

      responseLog.actions.push({
        action: "Admin Alert",
        status: alertError ? "failed" : "success",
        detail: alertError ? alertError.message : "Alert sent to admin",
      });

      responseLog.status = "completed";
      if (mountedRef.current) setStats(prev => ({ ...prev, blockedIPs: prev.blockedIPs + 1 }));

      toast({
        title: "⚡ Automated Response Executed",
        description: `${alert.alert_type} from ${alert.source_ip} — IP blocked, incident created, admin notified`,
      });
    } catch (err: any) {
      responseLog.status = "error";
      responseLog.actions.push({
        action: "Error",
        status: "failed",
        detail: err?.message ?? "Unexpected error",
      });
      console.error("Auto response failed", err);
    }

    if (mountedRef.current) {
      setAutoResponses(prev => prev.map(r => (r.id === responseLog.id ? responseLog : r)));
    }
  }, [toast, user]);

  useSupabaseRealtime(
    "dashboard-alerts",
    [
      {
        event: "INSERT",
        schema: "public",
        table: "threat_alerts",
        callback: async (payload) => {
          const newAlert = payload.new as any;
          if (!newAlert) return;

          setRecentAlerts(prev => [newAlert, ...prev].slice(0, 10));
          setStats(prev => ({ ...prev, activeThreats: prev.activeThreats + 1 }));

          if (newAlert.severity === "critical" && newAlert.source_ip) {
            await handleAutoResponse(newAlert);
          }
        },
      },
    ],
    [handleAutoResponse]
  );

  const handleSendTestAlert = async () => {
    setSendingTest(true);
    try {
      // Insert alert into database (triggers realtime → auto-response if critical)
      const { error: insertError } = await supabase.from("threat_alerts").insert({
        alert_type: testAlertType,
        severity: testSeverity,
        message: testMessage,
        source_ip: testSourceIp,
        status: "active",
      });

      if (insertError) throw insertError;

      // Also call Edge Function directly
      const { error: fnError } = await supabase.functions.invoke("send-critical-alert", {
        body: {
          alert_type: testAlertType,
          severity: testSeverity,
          message: testMessage,
          source_ip: testSourceIp,
          admin_email: user?.email || "admin@ucsf.local",
        },
      });

      toast({
        title: "✅ Test Alert Sent",
        description: `${testAlertType} (${testSeverity}) — alert inserted and Edge Function invoked${fnError ? " (Edge Function warning)" : ""}`,
      });
    } catch (err: any) {
      toast({ title: "❌ Error", description: err.message, variant: "destructive" });
    } finally {
      setSendingTest(false);
    }
  };

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
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">UCSF Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <NotificationPanel />
            <span className="text-xs text-muted-foreground font-mono hidden sm:block">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={() => navigate("/siem")} className="text-xs font-mono gap-1">
              <Eye className="w-3 h-3" /> SIEM
            </Button>
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
          <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">Security Operations Center</h1>
              <p className="text-sm text-muted-foreground">Real-time overview with automated incident response</p>
            </div>
            <Button
              variant={showTestPanel ? "default" : "outline"}
              size="sm"
              onClick={() => setShowTestPanel(!showTestPanel)}
              className="font-mono text-xs gap-1"
            >
              <Send className="w-3 h-3" /> Test Alert
            </Button>
          </div>
        </motion.div>

        {/* Test Alert Panel */}
        <AnimatePresence>
          {showTestPanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="bg-card border border-primary/30 rounded-xl p-5">
                <h3 className="text-sm font-mono font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Send className="w-4 h-4 text-primary" /> Send Test Alert
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="text-[10px] font-mono text-muted-foreground mb-1 block">Alert Type</label>
                    <select
                      value={testAlertType}
                      onChange={e => setTestAlertType(e.target.value)}
                      className="w-full bg-muted/20 border border-border/50 rounded-lg px-3 py-2 text-xs font-mono text-foreground"
                    >
                      <option value="DDoS Attack">DDoS Attack</option>
                      <option value="SQL Injection">SQL Injection</option>
                      <option value="Brute Force">Brute Force</option>
                      <option value="Malware Detected">Malware Detected</option>
                      <option value="Data Exfiltration">Data Exfiltration</option>
                      <option value="Port Scan">Port Scan</option>
                      <option value="XSS Attempt">XSS Attempt</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-muted-foreground mb-1 block">Severity</label>
                    <select
                      value={testSeverity}
                      onChange={e => setTestSeverity(e.target.value)}
                      className="w-full bg-muted/20 border border-border/50 rounded-lg px-3 py-2 text-xs font-mono text-foreground"
                    >
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-muted-foreground mb-1 block">Source IP</label>
                    <Input
                      value={testSourceIp}
                      onChange={e => setTestSourceIp(e.target.value)}
                      className="font-mono text-xs bg-muted/20 border-border/50"
                      placeholder="192.168.1.100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-muted-foreground mb-1 block">Message</label>
                    <Input
                      value={testMessage}
                      onChange={e => setTestMessage(e.target.value)}
                      className="font-mono text-xs bg-muted/20 border-border/50"
                      placeholder="Describe the threat..."
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button onClick={handleSendTestAlert} disabled={sendingTest} size="sm" className="font-mono text-xs gap-1">
                    {sendingTest ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                    {sendingTest ? "Sending..." : "Send Test Alert"}
                  </Button>
                  <p className="text-[9px] text-muted-foreground">
                    {testSeverity === "critical" ? "⚡ Critical alerts trigger automated IP blocking + incident creation" : "ℹ️ Non-critical alerts are logged only"}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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

        {/* Automated Response Log */}
        {autoResponses.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
            <div className="bg-card border border-warning/30 rounded-xl p-5">
              <h3 className="text-sm font-mono font-semibold text-foreground mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-warning" /> Automated Response Log
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {autoResponses.map(r => (
                  <div key={r.id} className="p-3 rounded-lg bg-muted/10 border border-border/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={r.status === "completed" ? "secondary" : r.status === "executing" ? "default" : "destructive"} className="text-[8px]">
                        {r.status}
                      </Badge>
                      <span className="text-[11px] font-mono text-foreground">{r.alert_type}</span>
                      <span className="text-[9px] font-mono text-primary/60">{r.source_ip}</span>
                      <span className="text-[9px] font-mono text-muted-foreground/50 ml-auto">{r.time}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {r.actions.map((a: any, i: number) => (
                        <div key={i} className="flex items-center gap-1 text-[9px] font-mono">
                          {a.status === "success" ? (
                            <CheckCircle2 className="w-3 h-3 text-success" />
                          ) : (
                            <AlertTriangle className="w-3 h-3 text-destructive" />
                          )}
                          <span className="text-muted-foreground">{a.action}:</span>
                          <span className={a.status === "success" ? "text-success" : "text-destructive"}>{a.detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* System health + Recent alerts */}
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
                { name: "Auto-Response Engine", status: "active", uptime: "99.99%" },
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

          <div className="bg-card border border-border/50 rounded-xl p-5">
            <h3 className="text-sm font-mono font-semibold text-foreground mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" /> Recent Alerts
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentAlerts.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No recent alerts. Use "Test Alert" to generate one.</p>
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

        {/* Security Monitor */}
        <SecurityMonitor />

        {/* Advanced Security Components */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-2">
            <DefensePosture />
          </div>
          <div>
            <AdvancedThreatDetection />
          </div>
        </div>

        {/* External System Defense */}
        <div className="mt-8">
          <ExternalSystemDefense />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
