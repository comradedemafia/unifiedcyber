import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BarChart3, TrendingUp, AlertTriangle, CheckCircle2, Zap,
  Activity, Target, Brain, AlertCircle
} from 'lucide-react';
import { analyzeUserBehavior, AnomalyScore, automatedThreatResponse } from '@/utils/advancedSecurity';
import { getAuditLogs } from '@/utils/api-validation';
import { useToast } from '@/hooks/use-toast';

interface ThreatAlert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  timestamp: number;
  description: string;
  actionTaken?: string;
}

const AdvancedThreatDetection = () => {
  const [anomalyScores, setAnomalyScores] = useState<AnomalyScore[]>([]);
  const [threatAlerts, setThreatAlerts] = useState<ThreatAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const startDetection = async () => {
      try {
        await analyzeSystemThreats();
        const interval = setInterval(() => {
          void analyzeSystemThreats();
        }, 60000); // Every minute
        return () => clearInterval(interval);
      } catch (err) {
        console.error('Error in AdvancedThreatDetection:', err);
        setError('Failed to initialize threat detection');
        setLoading(false);
      }
    };

    void startDetection();
  }, []);

  const analyzeSystemThreats = async () => {
    try {
      const logs = await getAuditLogs(undefined, undefined, 200);
      const userId = localStorage.getItem('current_user_id') || 'anonymous';
      const anomalyScore = analyzeUserBehavior(userId, logs);

      setAnomalyScores(prev => [anomalyScore, ...prev].slice(0, 10));

      if (anomalyScore.riskLevel !== 'normal') {
        generateThreatAlert(anomalyScore);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error analyzing threats:', err);
      setError('Failed to analyze threats');
    }
  };

  const generateThreatAlert = (anomaly: AnomalyScore) => {
    const threatType = anomaly.factors[0] || 'Unknown Threat';
    let severity: ThreatAlert['severity'] = 'low';
    
    if (anomaly.riskLevel === 'critical') severity = 'critical';
    else if (anomaly.riskLevel === 'high-risk') severity = 'high';
    else if (anomaly.riskLevel === 'suspicious') severity = 'medium';

    const newAlert: ThreatAlert = {
      id: crypto.randomUUID(),
      type: threatType,
      severity,
      source: `User: ${anomaly.userId}`,
      timestamp: anomaly.timestamp,
      description: `Anomaly score: ${anomaly.score}. Detected patterns: ${anomaly.factors.join(', ')}`
    };

    setThreatAlerts(prev => [newAlert, ...prev].slice(0, 20));

    // Auto-respond to critical threats
    if (severity === 'critical') {
      respondToThreat(newAlert);
    }
  };

  const respondToThreat = async (alert: ThreatAlert) => {
    try {
      const response = await automatedThreatResponse.respondToThreat(alert.type, alert.source);
      
      setThreatAlerts(prev =>
        prev.map(a =>
          a.id === alert.id
            ? { ...a, actionTaken: response.action }
            : a
        )
      );

      toast({
        title: 'Threat Response',
        description: `Auto-response: ${response.action}`,
      });

      // Log the response
      console.log('Threat response executed:', response);
    } catch (error) {
      console.error('Error responding to threat:', error);
    }
  };

  const getSeverityColor = (severity: ThreatAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getSeverityBadge = (severity: ThreatAlert['severity']) => {
    const colors = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return colors[severity];
  };

  const getRiskLevelColor = (riskLevel: AnomalyScore['riskLevel']) => {
    switch (riskLevel) {
      case 'critical':
        return 'text-red-600';
      case 'high-risk':
        return 'text-orange-600';
      case 'suspicious':
        return 'text-yellow-600';
      case 'normal':
        return 'text-green-600';
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Advanced Threat Detection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Analyzing...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Advanced Threat Detection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const criticalThreats = threatAlerts.filter(a => a.severity === 'critical').length;
  const highThreats = threatAlerts.filter(a => a.severity === 'high').length;

  return (
    <div className="space-y-4 w-full">
      {/* Overview Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-Based Threat Detection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3 text-center rounded bg-red-50">
              <div className="text-2xl font-bold text-red-600">{criticalThreats}</div>
              <div className="text-xs text-muted-foreground">Critical</div>
            </div>
            <div className="p-3 text-center rounded bg-orange-50">
              <div className="text-2xl font-bold text-orange-600">{highThreats}</div>
              <div className="text-xs text-muted-foreground">High</div>
            </div>
            <div className="p-3 text-center rounded bg-yellow-50">
              <div className="text-2xl font-bold text-yellow-600">
                {threatAlerts.filter(a => a.severity === 'medium').length}
              </div>
              <div className="text-xs text-muted-foreground">Medium</div>
            </div>
            <div className="p-3 text-center rounded bg-green-50">
              <div className="text-2xl font-bold text-green-600">
                {threatAlerts.filter(a => a.severity === 'low').length}
              </div>
              <div className="text-xs text-muted-foreground">Low</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Alerts */}
      {criticalThreats > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {criticalThreats} critical threat{criticalThreats > 1 ? 's' : ''} detected. Automated response activated.
          </AlertDescription>
        </Alert>
      )}

      {/* Recent Threat Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Recent Threats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {threatAlerts.length === 0 ? (
            <div className="text-center text-muted-foreground flex items-center justify-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              No threats detected
            </div>
          ) : (
            threatAlerts.slice(0, 10).map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded border-l-4 border-transparent ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm">{alert.type}</h4>
                      <Badge className={getSeverityBadge(alert.severity)} variant="outline">
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{alert.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{alert.source}</span>
                      <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                      {alert.actionTaken && (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="h-3 w-3" />
                          {alert.actionTaken}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => respondToThreat(alert)}
                    disabled={!!alert.actionTaken}
                  >
                    <Zap className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Anomaly Score Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Anomaly Score Trends
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {anomalyScores.length === 0 ? (
            <div className="text-center text-muted-foreground">No data available yet</div>
          ) : (
            <div className="space-y-2">
              {anomalyScores.slice(0, 5).map((score, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{new Date(score.timestamp).toLocaleTimeString()}</span>
                    <Badge className={getRiskLevelColor(score.riskLevel)}>
                      {score.riskLevel}
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        score.riskLevel === 'critical'
                          ? 'bg-red-600'
                          : score.riskLevel === 'high-risk'
                          ? 'bg-orange-600'
                          : score.riskLevel === 'suspicious'
                          ? 'bg-yellow-600'
                          : 'bg-green-600'
                      }`}
                      style={{ width: `${Math.min(100, (score.score / 100) * 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Score: {score.score} | Factors: {score.factors.join(', ') || 'None'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detection Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Detection Methods
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-blue-50 rounded">
            <h4 className="text-sm font-semibold text-blue-900">Behavioral Analysis</h4>
            <p className="text-xs text-blue-700 mt-1">ML-based user behavior analysis</p>
          </div>
          <div className="p-3 bg-purple-50 rounded">
            <h4 className="text-sm font-semibold text-purple-900">Anomaly Detection</h4>
            <p className="text-xs text-purple-700 mt-1">Statistical anomaly scoring</p>
          </div>
          <div className="p-3 bg-indigo-50 rounded">
            <h4 className="text-sm font-semibold text-indigo-900">Pattern Recognition</h4>
            <p className="text-xs text-indigo-700 mt-1">Known threat pattern matching</p>
          </div>
          <div className="p-3 bg-cyan-50 rounded">
            <h4 className="text-sm font-semibold text-cyan-900">Heuristic Scanning</h4>
            <p className="text-xs text-cyan-700 mt-1">Advanced heuristic analysis</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedThreatDetection;
