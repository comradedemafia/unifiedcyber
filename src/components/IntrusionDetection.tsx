import { useState, useEffect } from "react";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import { AlertTriangle, Shield, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface ThreatPattern {
  id: string;
  type: string;
  pattern: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  lastDetected?: string;
  count: number;
}

const IntrusionDetection = () => {
  const [threats, setThreats] = useState<ThreatPattern[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);

  // Initialize with common threat patterns
  useEffect(() => {
    const initialPatterns: ThreatPattern[] = [
      {
        id: '1',
        type: 'SQL Injection',
        pattern: /('|(\\x27)|(\\x2D\\x2D)|(\\#)|(\\/\\*.*\\*\\/)|(\\x3B)|(\\x2A)|(\\x2B)|(\\x2D)|(\\x25)|(\\x3D)|(\\x28)|(\\x29)|(\\x5B)|(\\x5D)|(\\x7B)|(\\x7D)|(\\x40)|(\\x21)|(\\x3C)|(\\x3E)|(\\x22)|(\\x27)|(\\x3B)|(\\x3A)|(\\x2F)|(\\x5C)|(\\x7C)|(\\x26)|(\\x24)|(\\x23)|(\\x3F)|(\\x3D)|(\\x2B)|(\\x25)|(\\x2E)|(\\x2C)|(\\x3B)|(\\x3A)|(\\x2D)|(\\x5F)|(\\x7E)|(\\x60)|(\\x21)|(\\x40)|(\\x23)|(\\x24)|(\\x25)|(\\x5E)|(\\x26)|(\\x2A)|(\\x28)|(\\x29)|(\\x2D)|(\\x2B)|(\\x3D)|(\\x5B)|(\\x5D)|(\\x7B)|(\\x7D)|(\\x7C)|(\\x5C)|(\\x3A)|(\\x3B)|(\\x22)|(\\x27)|(\\x3C)|(\\x3E)|(\\x2C)|(\\x2E)|(\\x2F)|(\\x3F)|(\\x7E)|(\\x60)|(\\x20)|(\\x09)|(\\x0A)|(\\x0D)|(\\x0B)|(\\x0C))/i,
        severity: 'high',
        description: 'Potential SQL injection attempts detected',
        count: 0,
      },
      {
        id: '2',
        type: 'XSS Attempt',
        pattern: /(<script|javascript:|on\w+\s*=|eval\(|alert\(|document\.|window\.)/i,
        severity: 'high',
        description: 'Cross-site scripting attempts detected',
        count: 0,
      },
      {
        id: '3',
        type: 'Brute Force',
        pattern: /failed.*login|invalid.*password/i,
        severity: 'medium',
        description: 'Multiple failed authentication attempts',
        count: 0,
      },
      {
        id: '4',
        type: 'Port Scan',
        pattern: /port.*scan|scan.*port/i,
        severity: 'medium',
        description: 'Port scanning activity detected',
        count: 0,
      },
      {
        id: '5',
        type: 'DDoS Attack',
        pattern: /ddos|distributed.*denial|attack.*traffic/i,
        severity: 'critical',
        description: 'Distributed denial of service attack indicators',
        count: 0,
      },
    ];
    setThreats(initialPatterns);
  }, []);

  // Monitor logs for threats
  useSupabaseRealtime('firewall_logs', (payload) => {
    if (payload.eventType === 'INSERT') {
      const log = payload.new;
      analyzeLogForThreats(log);
    }
  });

  useSupabaseRealtime('threat_alerts', (payload) => {
    if (payload.eventType === 'INSERT') {
      const alert = payload.new;
      analyzeAlertForThreats(alert);
    }
  });

  const analyzeLogForThreats = (log: any) => {
    threats.forEach(threat => {
      if (threat.pattern.test(log.message || log.details || '')) {
        updateThreatCount(threat.id);
        createIntrusionAlert(threat, log);
      }
    });
  };

  const analyzeAlertForThreats = (alert: any) => {
    threats.forEach(threat => {
      if (threat.pattern.test(alert.message || alert.alert_type || '')) {
        updateThreatCount(threat.id);
        createIntrusionAlert(threat, alert);
      }
    });
  };

  const updateThreatCount = (threatId: string) => {
    setThreats(prev => prev.map(threat =>
      threat.id === threatId
        ? { ...threat, count: threat.count + 1, lastDetected: new Date().toISOString() }
        : threat
    ));
  };

  const createIntrusionAlert = async (threat: ThreatPattern, source: any) => {
    const alert = {
      alert_type: `Intrusion Detected: ${threat.type}`,
      severity: threat.severity,
      message: `${threat.description} - Source: ${source.source_ip || 'Unknown'}`,
      source_ip: source.source_ip || '0.0.0.0',
      detected_pattern: threat.type,
      timestamp: new Date().toISOString(),
    };

    setActiveAlerts(prev => [alert, ...prev].slice(0, 10));

    // Auto-block if critical threat
    if (threat.severity === 'critical') {
      try {
        await supabase.from("blocked_ips").insert({
          ip_address: source.source_ip,
          reason: `Critical threat detected: ${threat.type}`,
          blocked_by: "intrusion-detection",
          is_permanent: true,
        });
      } catch (error) {
        console.error("Failed to auto-block IP:", error);
      }
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500 bg-red-100';
      case 'high': return 'text-orange-500 bg-orange-100';
      case 'medium': return 'text-yellow-500 bg-yellow-100';
      case 'low': return 'text-blue-500 bg-blue-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Intrusion Detection System
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-semibold mb-2">Threat Patterns Monitored</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {threats.map(threat => (
                <div key={threat.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/10">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-foreground">{threat.type}</span>
                      <Badge className={`text-xs ${getSeverityColor(threat.severity)}`}>
                        {threat.severity}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{threat.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">{threat.count}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {threat.lastDetected ? new Date(threat.lastDetected).toLocaleTimeString() : 'Never'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2">Active Intrusion Alerts</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {activeAlerts.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No active intrusion alerts</p>
              ) : (
                activeAlerts.map((alert, index) => (
                  <div key={index} className="p-2 rounded-lg bg-red-50 border border-red-200">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="h-3 w-3 text-red-500" />
                      <span className="text-xs font-mono text-red-800">{alert.alert_type}</span>
                      <Badge className={`text-xs ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-red-700">{alert.message}</p>
                    <p className="text-[9px] text-red-600">{alert.source_ip} • {new Date(alert.timestamp).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {activeAlerts.some(alert => alert.severity === 'critical') && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-red-500" />
              <p className="text-sm text-red-800 font-semibold">Critical Threat Detected!</p>
            </div>
            <p className="text-xs text-red-700 mt-1">
              Critical threats have been automatically blocked. Immediate investigation required.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default IntrusionDetection;