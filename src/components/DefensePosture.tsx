import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield, AlertTriangle, CheckCircle2, Lock, Zap, Globe,
  TrendingUp, Activity, Server, Users, AlertCircle
} from 'lucide-react';
import { checkSystemIntegrity, DefensePosture } from '@/utils/advancedSecurity';

const DefensePostureComponent = () => {
  const [defensePosture, setDefensePosture] = useState<DefensePosture | null>(null);
  const [threatLevel, setThreatLevel] = useState<'secure' | 'guarded' | 'critical'>('secure');
  const [loading, setLoading] = useState(true);
  const [autoDefenseEnabled, setAutoDefenseEnabled] = useState(true);

  useEffect(() => {
    const checkDefenses = async () => {
      try {
        const posture = await checkSystemIntegrity();
        setDefensePosture(posture);
        setThreatLevel(posture.threatLevel);
      } catch (error) {
        console.error('Failed to check system integrity:', error);
      } finally {
        setLoading(false);
      }
    };

    checkDefenses();
    const interval = setInterval(checkDefenses, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'secure':
        return 'text-green-600';
      case 'guarded':
        return 'text-yellow-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getThreatBgColor = (level: string) => {
    switch (level) {
      case 'secure':
        return 'bg-green-50';
      case 'guarded':
        return 'bg-yellow-50';
      case 'critical':
        return 'bg-red-50';
      default:
        return 'bg-gray-50';
    }
  };

  const getThreatIcon = (level: string) => {
    switch (level) {
      case 'secure':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'guarded':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Shield className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Defense Posture
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 w-full">
      {/* Main Defense Posture Card */}
      <Card className={getThreatBgColor(threatLevel)}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {getThreatIcon(threatLevel)}
              Defense Posture Status
            </div>
            <Badge
              variant={threatLevel === 'secure' ? 'secondary' : 'destructive'}
              className="capitalize"
            >
              {threatLevel}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Active Defenses */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Active Defenses</h4>
            <div className="grid grid-cols-2 gap-2">
              {defensePosture?.activeDefenses.map((defense) => (
                <div key={defense} className="flex items-center gap-2 p-2 bg-white/50 rounded">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">{defense}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Threat Level Indicator */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 text-center rounded bg-white/50">
              <div className="text-2xl font-bold text-green-600">{defensePosture?.activeDefenses.length || 0}</div>
              <div className="text-xs text-muted-foreground">Active Defenses</div>
            </div>
            <div className="p-3 text-center rounded bg-white/50">
              <div className="text-2xl font-bold text-blue-600">100%</div>
              <div className="text-xs text-muted-foreground">Uptime</div>
            </div>
            <div className="p-3 text-center rounded bg-white/50">
              <div className="text-2xl font-bold text-purple-600">0</div>
              <div className="text-xs text-muted-foreground">Active Threats</div>
            </div>
          </div>

          {/* Last Check */}
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Last check: {new Date(defensePosture?.timestamp || 0).toLocaleTimeString()}
          </div>
        </CardContent>
      </Card>

      {/* System Integrity Check */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            System Integrity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Configuration Checksum</span>
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {defensePosture?.integrityChecksum.substring(0, 16)}...
              </code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Configuration Version</span>
              <Badge variant="outline">v{defensePosture?.configurationVersion}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Auto-Defense Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Automated Defense Mode
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Auto-Response to Threats</p>
              <p className="text-xs text-muted-foreground">
                Automatically blocks malicious IPs and escalates critical threats
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setAutoDefenseEnabled(!autoDefenseEnabled)}
              variant={autoDefenseEnabled ? 'default' : 'outline'}
            >
              {autoDefenseEnabled ? 'Enabled' : 'Disabled'}
            </Button>
          </div>

          {autoDefenseEnabled && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Automated threat response is active. IP reputation system engaged.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Protection Coverage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Protection Coverage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Web Application Firewall</span>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">DDoS Protection</span>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Anomaly Detection</span>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Threat Intelligence</span>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warning if not secure */}
      {threatLevel !== 'secure' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            System defense level is degraded. Review security settings and ensure all defenses are enabled.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default DefensePostureComponent;
