import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const SecurityMonitor = () => {
  const { user, session } = useAuth();
  const [securityStatus, setSecurityStatus] = useState({
    authSecure: false,
    sessionValid: false,
    httpsEnabled: false,
    cspEnabled: false,
    lastActivity: 0,
    defenseMode: false,
  });

  useEffect(() => {
    const checkSecurity = () => {
      const isHttps = window.location.protocol === 'https:';
      const hasCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]') !== null;
      const sessionValid = !!(session && session.expires_at && session.expires_at > Date.now() / 1000);
      const lastActivity = parseInt(localStorage.getItem("security_last_activity") || "0", 10);
      const defenseMode = lastActivity > 0 && Date.now() - lastActivity < 30 * 60 * 1000;

      setSecurityStatus({
        authSecure: !!user,
        sessionValid,
        httpsEnabled: isHttps,
        cspEnabled: hasCSP,
        lastActivity,
        defenseMode,
      });
    };

    checkSecurity();
    const interval = setInterval(checkSecurity, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [user, session]);

  const getStatusIcon = (status: boolean) => status ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertTriangle className="h-4 w-4 text-red-500" />;

  const getStatusBadge = (status: boolean) => status ? <Badge variant="secondary" className="bg-green-100 text-green-800">Secure</Badge> : <Badge variant="destructive">At Risk</Badge>;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          System Security Monitor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Authentication</span>
            <div className="flex items-center gap-2">
              {getStatusIcon(securityStatus.authSecure)}
              {getStatusBadge(securityStatus.authSecure)}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Session Validity</span>
            <div className="flex items-center gap-2">
              {getStatusIcon(securityStatus.sessionValid)}
              {getStatusBadge(securityStatus.sessionValid)}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">HTTPS Enabled</span>
            <div className="flex items-center gap-2">
              {getStatusIcon(securityStatus.httpsEnabled)}
              {getStatusBadge(securityStatus.httpsEnabled)}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Content Security Policy</span>
            <div className="flex items-center gap-2">
              {getStatusIcon(securityStatus.cspEnabled)}
              {getStatusBadge(securityStatus.cspEnabled)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          Last checked: {new Date(securityStatus.lastActivity).toLocaleTimeString()}
        </div>
        {!securityStatus.httpsEnabled && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              Warning: HTTPS is not enabled. Consider deploying over HTTPS for secure communication.
            </p>
          </div>
        )}
        {!securityStatus.cspEnabled && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">
              Critical: Content Security Policy is not configured. This increases risk of XSS attacks.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SecurityMonitor;