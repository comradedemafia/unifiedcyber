import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame, Shield, Clock, MapPin, Target, CheckCircle2, AlertTriangle,
  X, ChevronRight, Activity, Ban, Mail, Search, FileText
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface IncidentDetailProps {
  incident: any;
  onClose: () => void;
  relatedAlerts: any[];
  relatedFirewall: any[];
  blockedIps: any[];
}

const IncidentDetail = ({ incident, onClose, relatedAlerts, relatedFirewall, blockedIps }: IncidentDetailProps) => {
  const sevColor = (s: string) =>
    s === "critical" ? "text-destructive" : s === "high" ? "text-warning" : s === "medium" ? "text-accent" : "text-muted-foreground";

  const sevBg = (s: string) =>
    s === "critical" ? "bg-destructive/10 border-destructive/30" : s === "high" ? "bg-warning/10 border-warning/30" : "bg-accent/10 border-accent/30";

  // Build timeline from incident data
  const timeline: { time: string; icon: any; title: string; detail: string; type: string }[] = [];

  // 1. Detection
  timeline.push({
    time: incident.created_at,
    icon: Search,
    title: "Threat Detected",
    detail: `${incident.type} detected from ${incident.source_ip || "unknown source"}`,
    type: "detection",
  });

  // 2. Related alerts (before or around incident time)
  relatedAlerts.forEach((a) => {
    timeline.push({
      time: a.created_at,
      icon: AlertTriangle,
      title: `IDS/IPS Alert: ${a.alert_type}`,
      detail: a.message,
      type: "alert",
    });
  });

  // 3. Related firewall actions
  relatedFirewall.forEach((f) => {
    timeline.push({
      time: f.created_at,
      icon: Shield,
      title: `Firewall ${f.action}: ${f.source_ip}`,
      detail: `${f.protocol || "TCP"}:${f.port || "N/A"} — ${f.threat_type || "Unknown threat"} — Rule: ${f.rule_matched || "auto"}`,
      type: "firewall",
    });
  });

  // 4. IP blocked
  const relatedBlocked = blockedIps.filter(
    (ip) => ip.ip_address === incident.source_ip
  );
  relatedBlocked.forEach((b) => {
    timeline.push({
      time: b.created_at,
      icon: Ban,
      title: `IP Blocked: ${b.ip_address}`,
      detail: `${b.is_permanent ? "Permanent" : "Temporary"} block — ${b.reason || "Automated response"}`,
      type: "blocked",
    });
  });

  // 5. Response actions from incident
  const actions = Array.isArray(incident.response_actions) ? incident.response_actions : [];
  actions.forEach((action: any, i: number) => {
    const actionTime = new Date(new Date(incident.created_at).getTime() + (i + 1) * 1000).toISOString();
    timeline.push({
      time: actionTime,
      icon: CheckCircle2,
      title: typeof action === "string" ? action : action.action || `Response Step ${i + 1}`,
      detail: typeof action === "string" ? "" : action.detail || action.status || "",
      type: "response",
    });
  });

  // 6. Resolution
  if (incident.resolved_at) {
    timeline.push({
      time: incident.resolved_at,
      icon: CheckCircle2,
      title: "Incident Resolved",
      detail: `Status changed to ${incident.status}`,
      type: "resolved",
    });
  }

  // Sort timeline
  timeline.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  const typeColor = (t: string) => {
    switch (t) {
      case "detection": return "border-primary/50 bg-primary/5";
      case "alert": return "border-warning/50 bg-warning/5";
      case "firewall": return "border-accent/50 bg-accent/5";
      case "blocked": return "border-destructive/50 bg-destructive/5";
      case "response": return "border-secondary bg-secondary/5";
      case "resolved": return "border-green-500/50 bg-green-500/5";
      default: return "border-border bg-muted/5";
    }
  };

  const typeIconColor = (t: string) => {
    switch (t) {
      case "detection": return "text-primary";
      case "alert": return "text-warning";
      case "firewall": return "text-accent";
      case "blocked": return "text-destructive";
      case "response": return "text-secondary-foreground";
      case "resolved": return "text-green-500";
      default: return "text-muted-foreground";
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-card border border-border/50 rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-border/50 flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${sevBg(incident.severity)}`}>
                <Flame className={`w-5 h-5 ${sevColor(incident.severity)}`} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-sm font-bold font-mono text-foreground">{incident.incident_type}</h2>
                  <Badge variant={incident.severity === "critical" ? "destructive" : "secondary"} className="text-[8px]">
                    {incident.severity}
                  </Badge>
                  <Badge variant={incident.status === "resolved" ? "secondary" : "destructive"} className="text-[8px]">
                    {incident.status}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground">{incident.description}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Incident Metadata */}
          <div className="p-4 border-b border-border/50 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: MapPin, label: "Source IP", value: incident.source_ip || "N/A" },
              { icon: Target, label: "Target", value: incident.target || "N/A" },
              { icon: Clock, label: "Detected", value: new Date(incident.created_at).toLocaleString() },
              { icon: Activity, label: "Related Events", value: `${timeline.length}` },
            ].map((m) => (
              <div key={m.label} className="bg-muted/20 rounded-lg p-2">
                <div className="flex items-center gap-1 mb-0.5">
                  <m.icon className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[8px] text-muted-foreground font-mono">{m.label}</span>
                </div>
                <p className="text-[11px] font-mono text-foreground truncate">{m.value}</p>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div className="p-4 overflow-y-auto max-h-[50vh]">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-xs font-mono font-semibold text-foreground">Incident Timeline</span>
              <span className="text-[9px] text-muted-foreground">({timeline.length} events)</span>
            </div>

            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border/50" />

              <div className="space-y-3">
                {timeline.map((event, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex gap-3 relative"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${typeColor(event.type)} z-10`}>
                      <event.icon className={`w-3.5 h-3.5 ${typeIconColor(event.type)}`} />
                    </div>
                    <div className="flex-1 min-w-0 pb-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[11px] font-mono font-semibold text-foreground">{event.title}</span>
                      </div>
                      {event.detail && (
                        <p className="text-[10px] text-muted-foreground">{event.detail}</p>
                      )}
                      <span className="text-[9px] font-mono text-muted-foreground/50">
                        <Clock className="w-2.5 h-2.5 inline mr-1" />
                        {new Date(event.time).toLocaleString()}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {timeline.length === 0 && (
              <div className="text-center py-8 text-xs text-muted-foreground">No timeline events found</div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default IncidentDetail;
