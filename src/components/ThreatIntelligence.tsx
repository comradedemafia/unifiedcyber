import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Globe, MapPin, Ban, Plus, Trash2, Search, Shield, AlertTriangle, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRealtimeIncidents } from "@/hooks/useRealtimeIncidents";

interface ThreatSource {
  ip: string;
  country: string;
  lat: number;
  lng: number;
  attacks: number;
  type: string;
  severity: "critical" | "high" | "medium";
}

const KNOWN_THREATS: ThreatSource[] = [
  { ip: "45.33.32.156", country: "United States", lat: 37.7749, lng: -122.4194, attacks: 142, type: "SQL Injection", severity: "critical" },
  { ip: "185.220.101.42", country: "Germany", lat: 52.5200, lng: 13.4050, attacks: 89, type: "Brute Force SSH", severity: "high" },
  { ip: "103.75.190.11", country: "China", lat: 39.9042, lng: 116.4074, attacks: 234, type: "DDoS", severity: "critical" },
  { ip: "91.219.237.229", country: "Russia", lat: 55.7558, lng: 37.6173, attacks: 167, type: "DNS Tunneling", severity: "high" },
  { ip: "178.128.88.201", country: "Netherlands", lat: 52.3676, lng: 4.9041, attacks: 56, type: "XSS", severity: "medium" },
  { ip: "202.14.108.73", country: "India", lat: 28.6139, lng: 77.2090, attacks: 78, type: "Port Scanning", severity: "medium" },
  { ip: "177.54.150.200", country: "Brazil", lat: -23.5505, lng: -46.6333, attacks: 112, type: "Ransomware C2", severity: "critical" },
  { ip: "41.215.241.50", country: "Kenya", lat: -1.2921, lng: 36.8219, attacks: 34, type: "Phishing", severity: "medium" },
];

interface CveEntry {
  id: string;
  service: string;
  score: number;
  status: "active" | "patched" | "unknown";
}

const ThreatIntelligence = () => {
  const { user } = useAuth();
  const { incidents, loading } = useRealtimeIncidents(20);
  const [blockedIPs, setBlockedIPs] = useState<string[]>([]);
  const [newIP, setNewIP] = useState("");
  const [searchIP, setSearchIP] = useState("");
  const [activeView, setActiveView] = useState<"map" | "blacklist" | "cve">("map");
  const [cveData, setCveData] = useState<CveEntry[]>([]);
  const [cveLoading, setCveLoading] = useState(true);
  const [cveError, setCveError] = useState<string | null>(null);

  // Convert demo data to real data from the hook
  const threats = useMemo(() => {
    if (loading || !incidents.length) return KNOWN_THREATS;
    
    const grouped: Record<string, ThreatSource> = {};
    incidents.forEach((inc: any) => {
      const ip = inc.source_ip;
      if (!grouped[ip]) {
        grouped[ip] = {
          ip,
          country: inc.country || "Unknown",
          lat: Number(inc.location_lat) || 0,
          lng: Number(inc.location_lng) || 0,
          attacks: 0,
          type: inc.type || "Security Event",
          severity: inc.severity as any
        };
      }
      grouped[ip].attacks++;
    });
    return Object.values(grouped);
  }, [incidents, loading]);

  // Load blocked IPs from database
  useEffect(() => {
    if (!user) return;

    const loadBlocked = async () => {
      const { data } = await supabase.from("blocked_ips").select("ip_address");
      if (data) setBlockedIPs(data.map((d) => d.ip_address));
    };

    const loadCveData = async () => {
      setCveLoading(true);
      setCveError(null);
      const { data, error } = await supabase
        .from("threat_alerts")
        .select("alert_type, severity, message, created_at")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        setCveError(error.message);
        setCveData([]);
        setCveLoading(false);
        return;
      }

      const regex = /CVE-\d{4}-\d{4,7}/g;
      const seen = new Map<string, CveEntry>();

      (data ?? []).forEach((row) => {
        const text = `${row.message ?? ""} ${row.alert_type ?? ""}`;
        const matches = text.match(regex);
        if (!matches) return;

        matches.forEach((cve) => {
          if (!seen.has(cve)) {
            const score = row.severity === "critical" ? 10.0 : row.severity === "high" ? 9.0 : row.severity === "medium" ? 7.0 : 5.0;
            const status = row.severity === "critical" || row.severity === "high" ? "active" : "patched";
            seen.set(cve, {
              id: cve,
              service: row.alert_type ?? "Threat Alert",
              score,
              status,
            });
          }
        });
      });

      setCveData(Array.from(seen.values()).slice(0, 20));
      setCveLoading(false);
    };

    loadBlocked();
    loadCveData();
  }, [user]);

  const addToBlacklist = async () => {
    if (!newIP || blockedIPs.includes(newIP)) return;
    if (user) {
      await supabase.from("blocked_ips").insert({ ip_address: newIP, reason: "Manual block", blocked_by: "admin" });
    }
    setBlockedIPs(prev => [...prev, newIP]);
    setNewIP("");
  };

  const removeFromBlacklist = async (ip: string) => {
    if (user) {
      await supabase.from("blocked_ips").delete().eq("ip_address", ip);
    }
    setBlockedIPs(prev => prev.filter(i => i !== ip));
  };

  const autoBlockThreat = async (ip: string) => {
    if (blockedIPs.includes(ip)) return;
    if (user) {
      await supabase.from("blocked_ips").insert({ ip_address: ip, reason: "Auto-blocked from threat intel", blocked_by: "system" });
    }
    setBlockedIPs(prev => [...prev, ip]);
  };

  const filteredThreats = searchIP
    ? threats.filter(t => t.ip.includes(searchIP) || t.country.toLowerCase().includes(searchIP.toLowerCase()))
    : threats;

  const sevColor = (s: string) => s === "critical" ? "text-destructive" : s === "high" ? "text-warning" : "text-accent";

  return (
    <section className="py-16 relative">
      <div className="container mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
              <Globe className="w-5 h-5 text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Threat Intelligence</h2>
          </div>
          <p className="text-sm text-muted-foreground">Global threat monitoring, IP reputation, and CVE tracking</p>
        </motion.div>

        {/* View tabs */}
        <div className="flex gap-1 mb-6 bg-muted/30 rounded-lg p-1 w-fit">
          {[
            { key: "map" as const, label: "Geo Threats", icon: MapPin },
            { key: "blacklist" as const, label: "IP Blacklist", icon: Ban },
            { key: "cve" as const, label: "CVE Database", icon: AlertTriangle },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveView(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono rounded-md transition-all ${activeView === tab.key ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <tab.icon className="w-3 h-3" /> {tab.label}
            </button>
          ))}
        </div>

        {activeView === "map" && (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={searchIP}
                onChange={(e) => setSearchIP(e.target.value)}
                placeholder="Search IP or country..."
                className="pl-9 bg-muted/30 border-border/50 text-xs font-mono h-8"
              />
            </div>

            {/* World map visualization (ASCII style) */}
            <div className="bg-card/50 border border-border/50 rounded-xl p-4 overflow-hidden">
              <div className="relative h-64 bg-muted/10 rounded-lg border border-border/30 overflow-hidden">
                <div className="absolute inset-0 bg-grid opacity-20" />
                {/* Threat dots */}
                {threats.map((t, i) => {
                  const x = ((t.lng + 180) / 360) * 100;
                  const y = ((90 - t.lat) / 180) * 100;
                  return (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="absolute"
                      style={{ left: `${x}%`, top: `${y}%` }}
                    >
                      <div className={`relative group cursor-pointer`}>
                        <div className={`w-3 h-3 rounded-full ${t.severity === "critical" ? "bg-destructive" : t.severity === "high" ? "bg-warning" : "bg-accent"} animate-pulse`} />
                        <div className={`absolute w-6 h-6 rounded-full -inset-1.5 ${t.severity === "critical" ? "bg-destructive/20" : t.severity === "high" ? "bg-warning/20" : "bg-accent/20"} animate-ping`} />
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 bg-card border border-border rounded-lg p-2 min-w-40 shadow-lg">
                          <p className="text-[10px] font-mono font-semibold text-foreground">{t.ip}</p>
                          <p className="text-[9px] text-muted-foreground">{t.country} · {t.type}</p>
                          <p className={`text-[9px] font-mono ${sevColor(t.severity)}`}>{t.attacks} attacks</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                <div className="absolute bottom-2 right-2 flex items-center gap-3 text-[9px] font-mono text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive" /> Critical</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning" /> High</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent" /> Medium</span>
                </div>
              </div>
            </div>

            {/* Threat table */}
            <div className="bg-card/50 border border-border/50 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-border/50 text-muted-foreground">
                      <th className="text-left p-3">IP Address</th>
                      <th className="text-left p-3">Country</th>
                      <th className="text-left p-3">Attack Type</th>
                      <th className="text-left p-3">Attacks</th>
                      <th className="text-left p-3">Severity</th>
                      <th className="text-left p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredThreats.map((t, i) => (
                      <tr key={i} className="border-b border-border/20 hover:bg-muted/10">
                        <td className="p-3 text-primary">{t.ip}</td>
                        <td className="p-3 text-foreground">{t.country}</td>
                        <td className="p-3">{t.type}</td>
                        <td className="p-3 text-foreground">{t.attacks}</td>
                        <td className="p-3"><Badge variant={t.severity === "critical" ? "destructive" : "secondary"} className="text-[9px]">{t.severity}</Badge></td>
                        <td className="p-3">
                          {blockedIPs.includes(t.ip) ? (
                            <span className="text-[9px] text-destructive">BLOCKED</span>
                          ) : (
                            <Button size="sm" variant="ghost" className="h-6 text-[10px] text-destructive hover:bg-destructive/10" onClick={() => autoBlockThreat(t.ip)}>
                              <Ban className="w-3 h-3 mr-1" /> Block
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeView === "blacklist" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newIP}
                onChange={(e) => setNewIP(e.target.value)}
                placeholder="Enter IP to block (e.g., 192.168.1.100)"
                className="bg-muted/30 border-border/50 text-xs font-mono max-w-sm"
              />
              <Button onClick={addToBlacklist} size="sm" className="text-xs gap-1">
                <Plus className="w-3 h-3" /> Add to Blacklist
              </Button>
            </div>

            <div className="bg-card/50 border border-border/50 rounded-xl overflow-hidden">
              {blockedIPs.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">No blocked IPs yet</div>
              ) : (
                <div className="divide-y divide-border/30">
                  {blockedIPs.map((ip) => (
                    <div key={ip} className="flex items-center justify-between p-3 hover:bg-muted/10">
                      <div className="flex items-center gap-3">
                        <Ban className="w-4 h-4 text-destructive" />
                        <span className="font-mono text-xs text-foreground">{ip}</span>
                        <Badge variant="destructive" className="text-[8px]">BLOCKED</Badge>
                      </div>
                      <Button size="sm" variant="ghost" className="h-6 text-[10px] text-muted-foreground" onClick={() => removeFromBlacklist(ip)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === "cve" && (
          <div className="bg-card/50 border border-border/50 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border/50">
              <p className="text-sm text-muted-foreground">CVE inventory derived from live threat alerts stored in Supabase.</p>
            </div>
            {cveLoading ? (
              <div className="p-6 text-center text-sm text-muted-foreground">Loading CVE details…</div>
            ) : cveError ? (
              <div className="p-6 text-center text-sm text-destructive">Unable to load CVE data: {cveError}</div>
            ) : cveData.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No CVE-linked threat alerts found yet. Create an alert or check your Supabase data.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-border/50 text-muted-foreground">
                      <th className="text-left p-3">CVE ID</th>
                      <th className="text-left p-3">Affected Service</th>
                      <th className="text-left p-3">CVSS Score</th>
                      <th className="text-left p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cveData.map((cve) => (
                      <tr key={cve.id} className="border-b border-border/20 hover:bg-muted/10">
                        <td className="p-3 text-primary">{cve.id}</td>
                        <td className="p-3 text-foreground">{cve.service}</td>
                        <td className="p-3">
                          <span className={cve.score >= 9.0 ? "text-destructive" : "text-warning"}>{cve.score.toFixed(1)}</span>
                        </td>
                        <td className="p-3">
                          <Badge variant={cve.status === "active" ? "destructive" : "secondary"} className="text-[9px]">
                            {cve.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default ThreatIntelligence;
