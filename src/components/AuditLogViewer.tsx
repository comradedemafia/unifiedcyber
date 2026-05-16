import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSecurityMonitoring } from "@/hooks/useAuditLogging";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import { Shield, Search, Filter, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";

const AuditLogViewer = () => {
  const { auditLogs, isLoading, loadRecentLogs, loadLogsByType, loadCriticalLogs, appendAuditLog } = useSecurityMonitoring();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");

  useEffect(() => {
    loadRecentLogs(100);
  }, [loadRecentLogs]);

  useSupabaseRealtime(
    "audit-log-viewer",
    [
      {
        event: "INSERT",
        schema: "public",
        table: "security_logs",
        callback: ({ new: payloadNew }) => {
          if (payloadNew) {
            appendAuditLog(payloadNew);
          }
        },
      },
    ],
    [appendAuditLog]
  );

  const handleFilter = async () => {
    if (filterSeverity === "critical") {
      await loadCriticalLogs(100);
    } else if (filterType !== "all") {
      await loadLogsByType(filterType, 100);
    } else {
      await loadRecentLogs(100);
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = !searchQuery ||
      log.event_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource_type?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === "all" || log.event_type === filterType;
    const matchesSeverity = filterSeverity === "all" || log.severity === filterSeverity;

    return matchesSearch && matchesType && matchesSeverity;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    return status === 'success' ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <AlertTriangle className="h-4 w-4 text-red-500" />
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Audit Log Viewer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filter Section */}
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-sm"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-input rounded-md text-sm bg-background"
            >
              <option value="all">All Events</option>
              <option value="authentication">Authentication</option>
              <option value="security_incidents">Incidents</option>
              <option value="firewall_logs">Firewall</option>
              <option value="threat_alerts">Alerts</option>
              <option value="blocked_ips">Blocked IPs</option>
              <option value="validation">Validation</option>
            </select>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-3 py-2 border border-input rounded-md text-sm bg-background"
            >
              <option value="all">All Severities</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
            <Button
              onClick={handleFilter}
              disabled={isLoading}
              size="sm"
              className="gap-1"
            >
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button
              onClick={() => loadRecentLogs(100)}
              disabled={isLoading}
              size="sm"
              variant="outline"
              className="gap-1"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            Showing {filteredLogs.length} of {auditLogs.length} audit logs
          </div>
        </div>

        {/* Logs Table */}
        <div className="max-h-[600px] overflow-y-auto border border-border/50 rounded-lg">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/50 border-b border-border/50">
              <tr>
                <th className="text-left px-3 py-2 font-mono text-xs font-semibold">Time</th>
                <th className="text-left px-3 py-2 font-mono text-xs font-semibold">Event</th>
                <th className="text-left px-3 py-2 font-mono text-xs font-semibold">Action</th>
                <th className="text-left px-3 py-2 font-mono text-xs font-semibold">Resource</th>
                <th className="text-left px-3 py-2 font-mono text-xs font-semibold">Severity</th>
                <th className="text-left px-3 py-2 font-mono text-xs font-semibold">Status</th>
                <th className="text-left px-3 py-2 font-mono text-xs font-semibold">User</th>
                <th className="text-left px-3 py-2 font-mono text-xs font-semibold">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-4 text-center text-muted-foreground text-xs">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, index) => (
                  <tr key={log.id || index} className="hover:bg-muted/50 transition-colors">
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-mono text-muted-foreground">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : 'Unknown'}
                    </td>
                    <td className="px-3 py-2 text-xs font-mono">
                      {log.event_type || 'N/A'}
                    </td>
                    <td className="px-3 py-2 text-xs font-mono">
                      {log.action || 'N/A'}
                    </td>
                    <td className="px-3 py-2 text-xs font-mono">
                      {log.resource_type || 'N/A'}
                    </td>
                    <td className="px-3 py-2">
                      <Badge className={`text-xs ${getSeverityColor(log.severity)}`}>
                        {log.severity || 'unknown'}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        {getStatusIcon(log.status)}
                        <span className="text-xs font-mono">{log.status || 'unknown'}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs font-mono text-muted-foreground">
                      {log.user_id ? log.user_id.substring(0, 8) + '...' : 'System'}
                    </td>
                    <td className="px-3 py-2 text-xs font-mono text-muted-foreground">
                      {log.ip_address || 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-border/50">
          <div className="text-center">
            <div className="text-2xl font-bold">{auditLogs.length}</div>
            <div className="text-xs text-muted-foreground">Total Events</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">
              {auditLogs.filter(l => l.severity === 'critical').length}
            </div>
            <div className="text-xs text-muted-foreground">Critical</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-500">
              {auditLogs.filter(l => l.severity === 'warning').length}
            </div>
            <div className="text-xs text-muted-foreground">Warnings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">
              {auditLogs.filter(l => l.status === 'success').length}
            </div>
            <div className="text-xs text-muted-foreground">Success</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuditLogViewer;
