import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import {
  Shield, AlertTriangle, Activity, Globe, Lock, LogOut, Flame, Ban,
  CheckCircle2, Search, Filter, RefreshCw, Clock, Server, Eye, TrendingUp, FileDown, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import NotificationPanel from "@/components/NotificationPanel";
import GeoThreatMap from "@/components/GeoThreatMap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { exportSIEMReport } from "@/utils/exportSIEMReport";
import IncidentDetail from "@/components/IncidentDetail";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import IntrusionDetection from "@/components/IntrusionDetection";

const SIEM = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [firewallLogs, setFirewallLogs] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [blockedIps, setBlockedIps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [selectedIncident, setSelectedIncident] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [inc, fw, al, bl] = await Promise.allSettled([
        supabase.from("security_incidents").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("firewall_logs").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("threat_alerts").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("blocked_ips").select("*").order("created_at", { ascending: false }).limit(50),
      ]);

      if (inc.status === "fulfilled") setIncidents(inc.value.data || []);
      if (fw.status === "fulfilled") setFirewallLogs(fw.value.data || []);
      if (al.status === "fulfilled") setAlerts(al.value.data || []);
      if (bl.status === "fulfilled") setBlockedIps(bl.value.data || []);

      [inc, fw, al, bl].forEach((result, index) => {
        if (result.status === "rejected") {
          console.error("SIEM data load failed", index, result.reason);
        }
      });
    } catch (error) {
      console.error("SIEM loadData error", error);
      toast({ title: "SIEM load failed", description: "Could not fetch event data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useSupabaseRealtime("siem-realtime", [
    {
      event: "INSERT",
      schema: "public",
      table: "threat_alerts",
      callback: (payload) => {
        if (payload?.new) setAlerts(prev => [payload.new, ...prev].slice(0, 100));
      },
    },
    {
      event: "INSERT",
      schema: "public",
      table: "firewall_logs",
      callback: (payload) => {
        if (payload?.new) setFirewallLogs(prev => [payload.new, ...prev].slice(0, 100));
      },
    },
    {
      event: "INSERT",
      schema: "public",
      table: "security_incidents",
      callback: (payload) => {
        if (payload?.new) setIncidents(prev => [payload.new, ...prev].slice(0, 100));
      },
    },
  ], []);

  useEffect(() => {
    loadData();
  }, [toast]);

  const allEvents = useMemo(() => {
    return [
      ...incidents.map(i => ({ ...i, _source: "incident", _time: i.created_at })),
      ...firewallLogs.map(f => ({ ...f, _source: "firewall", _time: f.created_at })),
      ...alerts.map(a => ({ ...a, _source: "alert", _time: a.created_at })),
    ].sort((a, b) => new Date(b._time).getTime() - new Date(a._time).getTime());
  }, [incidents, firewallLogs, alerts]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return allEvents.filter(e => {
      const matchesSearch = !q || JSON.stringify(e).toLowerCase().includes(q);
      const matchesSev = severityFilter === "all" || e.severity === severityFilter;
      return matchesSearch && matchesSev;
    });
  }, [allEvents, searchQuery, severityFilter]);

  const stats = {
    totalEvents: allEvents.length,
    critical: allEvents.filter(e => e.severity === "critical").length,
    high: allEvents.filter(e => e.severity === "high").length,
    blocked: blockedIps.length,
  };

  const sevColor = (s: string) => s === "critical" ? "text-destructive" : s === "high" ? "text-warning" : s === "medium" ? "text-accent" : "text-muted-foreground";
  const sourceIcon = (s: string) => s === "incident" ? <Flame className="w-3.5 h-3.5" /> : s === "firewall" ? <Shield className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />;
  const sourceLabel = (s: string) => s === "incident" ? "Incident" : s === "firewall" ? "Firewall" : "IDS/IPS Alert";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-primary" />
            <span className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">SIEM Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <NotificationPanel />
            <span className="text-xs text-muted-foreground font-mono hidden sm:block">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="text-xs font-mono gap-1">
              <Activity className="w-3 h-3" /> Dashboard
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-xs font-mono gap-1">
              <Globe className="w-3 h-3" /> Home
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">Security Information & Event Management</h1>
              <p className="text-sm text-muted-foreground">Unified view of all security events across all systems</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => exportSIEMReport(allEvents, blockedIps, stats)} className="font-mono text-xs gap-1">
                <FileDown className="w-3 h-3" /> Export PDF
              </Button>
              <Button variant="outline" size="sm" onClick={loadData} className="font-mono text-xs gap-1">
                <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} /> Refresh
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Events", value: stats.totalEvents, icon: Activity, color: "text-primary", bg: "bg-primary/10" },
            { label: "Critical", value: stats.critical, icon: Flame, color: "text-destructive", bg: "bg-destructive/10" },
            { label: "High", value: stats.high, icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10" },
            { label: "Blocked IPs", value: stats.blocked, icon: Ban, color: "text-accent", bg: "bg-accent/10" },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card border border-border/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg ${s.bg}`}><s.icon className={`w-4 h-4 ${s.color}`} /></div>
                <span className="text-[10px] font-mono text-muted-foreground">{s.label}</span>
              </div>
              <p className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search events..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 font-mono text-xs bg-card border-border/50" />
          </div>
          <div className="flex gap-2">
            {["all", "critical", "high", "medium", "low"].map(s => (
              <Button key={s} variant={severityFilter === s ? "default" : "outline"} size="sm"
                onClick={() => setSeverityFilter(s)} className="text-[10px] font-mono capitalize">
                {s}
              </Button>
            ))}
          </div>
        </div>

        {/* GeoIP Threat Map */}
        <div className="mb-6">
          <GeoThreatMap events={allEvents} />
        </div>

        <Tabs defaultValue="unified" className="space-y-4">
          <TabsList className="bg-card border border-border/50">
            <TabsTrigger value="unified" className="font-mono text-xs">Unified Timeline</TabsTrigger>
            <TabsTrigger value="firewall" className="font-mono text-xs">Firewall</TabsTrigger>
            <TabsTrigger value="ids" className="font-mono text-xs">IDS/IPS</TabsTrigger>
            <TabsTrigger value="incidents" className="font-mono text-xs">Incidents</TabsTrigger>
            <TabsTrigger value="blocked" className="font-mono text-xs">Blocked IPs</TabsTrigger>
            <TabsTrigger value="intrusion" className="font-mono text-xs">Intrusion Detection</TabsTrigger>
          </TabsList>

          <TabsContent value="unified">
            <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
              <div className="p-3 border-b border-border/50 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-xs font-mono font-semibold text-foreground">Unified Event Timeline ({filtered.length})</span>
              </div>
              <div className="max-h-[600px] overflow-y-auto divide-y divide-border/30">
                {filtered.slice(0, 50).map((e, i) => (
                  <div key={`${e._source}-${e.id}-${i}`} className="p-3 hover:bg-muted/10 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 ${sevColor(e.severity)}`}>{sourceIcon(e._source)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <Badge variant="secondary" className="text-[8px]">{sourceLabel(e._source)}</Badge>
                          <span className="text-[11px] font-mono text-foreground truncate">
                            {e.alert_type || e.incident_type || e.action || "Event"}
                          </span>
                          {e.severity && <Badge variant={e.severity === "critical" ? "destructive" : "secondary"} className="text-[8px]">{e.severity}</Badge>}
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">{e.message || e.description || `${e.source_ip} → ${e.destination_ip || "N/A"}`}</p>
                        <div className="flex items-center gap-3 mt-1">
                          {e.source_ip && <span className="text-[9px] font-mono text-primary/60">{e.source_ip}</span>}
                          <span className="text-[9px] font-mono text-muted-foreground/50">
                            <Clock className="w-2.5 h-2.5 inline mr-1" />
                            {new Date(e._time).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div className="p-8 text-center text-xs text-muted-foreground">No events matching filters</div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="firewall">
            <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
              <div className="p-3 border-b border-border/50">
                <span className="text-xs font-mono font-semibold text-foreground">Firewall Logs ({firewallLogs.length})</span>
              </div>
              <div className="max-h-[600px] overflow-y-auto divide-y divide-border/30">
                {firewallLogs.map(l => (
                  <div key={l.id} className="p-3 hover:bg-muted/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <Shield className={`w-3.5 h-3.5 ${l.action === "blocked" ? "text-destructive" : "text-success"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-foreground">{l.source_ip} → {l.destination_ip || "N/A"}</span>
                          <Badge variant={l.action === "blocked" ? "destructive" : "secondary"} className="text-[8px]">{l.action}</Badge>
                          {l.protocol && <span className="text-[9px] font-mono text-muted-foreground">{l.protocol}:{l.port}</span>}
                        </div>
                        {l.threat_type && <p className="text-[10px] text-muted-foreground">{l.threat_type} — {l.rule_matched}</p>}
                      </div>
                      <span className="text-[9px] font-mono text-muted-foreground/50 shrink-0">{new Date(l.created_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
                {firewallLogs.length === 0 && <div className="p-8 text-center text-xs text-muted-foreground">No firewall logs</div>}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ids">
            <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
              <div className="p-3 border-b border-border/50">
                <span className="text-xs font-mono font-semibold text-foreground">IDS/IPS Alerts ({alerts.length})</span>
              </div>
              <div className="max-h-[600px] overflow-y-auto divide-y divide-border/30">
                {alerts.map(a => (
                  <div key={a.id} className="p-3 hover:bg-muted/10 transition-colors">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 ${sevColor(a.severity)}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[11px] font-mono text-foreground">{a.alert_type}</span>
                          <Badge variant={a.severity === "critical" ? "destructive" : "secondary"} className="text-[8px]">{a.severity}</Badge>
                          <Badge variant="secondary" className="text-[8px]">{a.status}</Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground">{a.message}</p>
                        <span className="text-[9px] font-mono text-primary/60">{a.source_ip}</span>
                      </div>
                      <span className="text-[9px] font-mono text-muted-foreground/50 shrink-0">{new Date(a.created_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
                {alerts.length === 0 && <div className="p-8 text-center text-xs text-muted-foreground">No IDS/IPS alerts</div>}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="incidents">
            <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
              <div className="p-3 border-b border-border/50">
                <span className="text-xs font-mono font-semibold text-foreground">Security Incidents ({incidents.length})</span>
              </div>
              <div className="max-h-[600px] overflow-y-auto divide-y divide-border/30">
                {incidents.map(inc => (
                  <div key={inc.id} className="p-3 hover:bg-muted/10 transition-colors cursor-pointer" onClick={() => setSelectedIncident(inc)}>
                    <div className="flex items-start gap-3">
                      <Flame className={`w-3.5 h-3.5 mt-0.5 ${sevColor(inc.severity)}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[11px] font-mono text-foreground">{inc.incident_type}</span>
                          <Badge variant={inc.severity === "critical" ? "destructive" : "secondary"} className="text-[8px]">{inc.severity}</Badge>
                          <Badge variant={inc.status === "resolved" ? "secondary" : "destructive"} className="text-[8px]">{inc.status}</Badge>
                          <ChevronRight className="w-3 h-3 text-muted-foreground ml-auto" />
                        </div>
                        <p className="text-[10px] text-muted-foreground">{inc.description}</p>
                        <div className="flex items-center gap-3 mt-1">
                          {inc.source_ip && <span className="text-[9px] font-mono text-primary/60">{inc.source_ip}</span>}
                          {inc.target && <span className="text-[9px] font-mono text-muted-foreground">Target: {inc.target}</span>}
                        </div>
                      </div>
                      <span className="text-[9px] font-mono text-muted-foreground/50 shrink-0">{new Date(inc.created_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
                {incidents.length === 0 && <div className="p-8 text-center text-xs text-muted-foreground">No incidents</div>}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="blocked">
            <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
              <div className="p-3 border-b border-border/50">
                <span className="text-xs font-mono font-semibold text-foreground">Blocked IPs ({blockedIps.length})</span>
              </div>
              <div className="max-h-[600px] overflow-y-auto divide-y divide-border/30">
                {blockedIps.map(ip => (
                  <div key={ip.id} className="p-3 hover:bg-muted/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <Ban className="w-3.5 h-3.5 text-destructive" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-foreground">{ip.ip_address}</span>
                          <Badge variant={ip.is_permanent ? "destructive" : "secondary"} className="text-[8px]">
                            {ip.is_permanent ? "Permanent" : "Temporary"}
                          </Badge>
                        </div>
                        {ip.reason && <p className="text-[10px] text-muted-foreground">{ip.reason}</p>}
                      </div>
                      <span className="text-[9px] font-mono text-muted-foreground/50 shrink-0">{new Date(ip.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
                {blockedIps.length === 0 && <div className="p-8 text-center text-xs text-muted-foreground">No blocked IPs</div>}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="intrusion">
            <IntrusionDetection />
          </TabsContent>
        </Tabs>

        {selectedIncident && (
          <IncidentDetail
            incident={selectedIncident}
            onClose={() => setSelectedIncident(null)}
            relatedAlerts={alerts.filter(a => a.source_ip === selectedIncident.source_ip)}
            relatedFirewall={firewallLogs.filter(f => f.source_ip === selectedIncident.source_ip)}
            blockedIps={blockedIps}
          />
        )}
      </main>
    </div>
  );
};

export default SIEM;
