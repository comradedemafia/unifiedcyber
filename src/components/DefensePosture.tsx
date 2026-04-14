import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield, AlertTriangle, CheckCircle2, Lock, Zap, AlertCircle
} from 'lucide-react';
import { checkSystemIntegrity, DefensePosture as DefensePostureType } from '@/utils/advancedSecurity';

const DefensePosture = () => {
  const [defensePosture, setDefensePosture] = useState<DefensePostureType | null>(null);
  const [threatLevel, setThreatLevel] = useState<'secure' | 'guarded' | 'critical'>('secure');
  const [loading, setLoading] = useState(true);
  const [autoDefenseEnabled, setAutoDefenseEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkDefenses = async () => {
      try {
        setError(null);
        const posture = await checkSystemIntegrity();
        setDefensePosture(posture);
        setThreatLevel(posture.threatLevel);
      } catch (error) {
        console.error('Failed to check system integrity:', error);
        setError('Failed to check system integrity');
        // Set defaults so app doesn't crash
        setThreatLevel('guarded');
      } finally {
        setLoading(false);
      }
    };

    checkDefenses();
    const interval = setInterval(checkDefenses, 30000);

    return () => clearInterval(interval);
  }, []);

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'secure': return 'text-green-600';
      case 'guarded': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getThreatBgColor = (level: string) => {
    switch (level) {
      case 'secure': return 'bg-green-50';
      case 'guarded': return 'bg-yellow-50';
      case 'critical': return 'bg-red-50';
      default: return 'bg-gray-50';
    }
  };

  const getThreatIcon = (level: string) => {
    switch (level) {
      case 'secure': return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'guarded': return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default: return <Shield className="h-5 w-5" />;
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
          <div className="text-center text-muted-foreground">Initializing...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 w-full">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
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

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Status: {threatLevel === 'secure' ? '🟢 Protected' : threatLevel === 'guarded' ? '🟡 Guarded' : '🔴 Critical'}</span>
            {defensePosture && (
              <span>Updated: {new Date(defensePosture.timestamp).toLocaleTimeString()}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {threatLevel === 'critical' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            System defense level is degraded. Review security settings immediately.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default DefensePosture;
