/**
 * API Validation Middleware for Supabase Operations
 * All data mutations are validated server-side before insertion
 */

import { supabase } from "@/integrations/supabase/client";
import { logAuditEvent, AuditLogEntry } from "./api-validation";

interface ValidationError {
  field: string;
  message: string;
}

interface OperationResult<T> {
  data: T | null;
  error: string | null;
  validationErrors: ValidationError[];
  auditLogged: boolean;
}

/**
 * Validates and inserts security incident with logging
 */
export const createSecurityIncident = async (
  data: {
    incident_type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    source_ip?: string;
    description?: string;
    status: 'detected' | 'investigating' | 'resolved' | 'false_positive';
  },
  userId?: string
): Promise<OperationResult<any>> => {
  try {
    // Validate required fields
    if (!data.incident_type || data.incident_type.length < 3) {
      return {
        data: null,
        error: "Incident type is required and must be at least 3 characters",
        validationErrors: [{ field: 'incident_type', message: 'Invalid incident type' }],
        auditLogged: false,
      };
    }

    if (!['low', 'medium', 'high', 'critical'].includes(data.severity)) {
      return {
        data: null,
        error: "Invalid severity level",
        validationErrors: [{ field: 'severity', message: 'Must be low, medium, high, or critical' }],
        auditLogged: false,
      };
    }

    // Server-side insertion
    const { data: incident, error } = await supabase
      .from('security_incidents')
      .insert({
        incident_type: data.incident_type,
        severity: data.severity,
        source_ip: data.source_ip,
        description: data.description,
        status: data.status,
      })
      .select()
      .single();

    if (error) {
      // Log failed insertion
      await logAuditEvent({
        user_id: userId,
        event_type: 'security_incident',
        action: 'create',
        resource_type: 'security_incidents',
        severity: 'critical',
        status: 'failed',
        details: { error: error.message, data },
      });
      return { data: null, error: error.message, validationErrors: [], auditLogged: true };
    }

    // Log successful creation
    await logAuditEvent({
      user_id: userId,
      event_type: 'security_incident',
      action: 'create',
      resource_type: 'security_incidents',
      resource_id: incident.id,
      severity: 'info',
      status: 'success',
      details: { incident_type: data.incident_type, severity: data.severity },
    });

    return { data: incident, error: null, validationErrors: [], auditLogged: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Operation failed';
    return { data: null, error: errorMessage, validationErrors: [], auditLogged: false };
  }
};

/**
 * Validates and inserts firewall log with logging
 */
export const createFirewallLog = async (
  data: {
    source_ip: string;
    destination_ip?: string;
    port?: number;
    protocol: 'TCP' | 'UDP' | 'ICMP';
    action: 'allowed' | 'blocked';
    threat_type?: string;
  },
  userId?: string
): Promise<OperationResult<any>> => {
  try {
    // Validate IP format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(data.source_ip)) {
      return {
        data: null,
        error: "Invalid source IP format",
        validationErrors: [{ field: 'source_ip', message: 'Must be valid IPv4 address' }],
        auditLogged: false,
      };
    }

    if (data.destination_ip && !ipRegex.test(data.destination_ip)) {
      return {
        data: null,
        error: "Invalid destination IP format",
        validationErrors: [{ field: 'destination_ip', message: 'Must be valid IPv4 address' }],
        auditLogged: false,
      };
    }

    // Validate port range
    if (data.port && (data.port < 1 || data.port > 65535)) {
      return {
        data: null,
        error: "Port must be between 1 and 65535",
        validationErrors: [{ field: 'port', message: 'Invalid port number' }],
        auditLogged: false,
      };
    }

    const { data: log, error } = await supabase
      .from('firewall_logs')
      .insert({
        source_ip: data.source_ip,
        destination_ip: data.destination_ip,
        port: data.port,
        protocol: data.protocol,
        action: data.action,
        threat_type: data.threat_type,
      })
      .select()
      .single();

    if (error) {
      await logAuditEvent({
        user_id: userId,
        event_type: 'firewall_log',
        action: 'create',
        resource_type: 'firewall_logs',
        severity: 'critical',
        status: 'failed',
        details: { error: error.message },
      });
      return { data: null, error: error.message, validationErrors: [], auditLogged: true };
    }

    await logAuditEvent({
      user_id: userId,
      event_type: 'firewall_log',
      action: 'create',
      resource_type: 'firewall_logs',
      resource_id: log.id,
      severity: data.action === 'blocked' ? 'warning' : 'info',
      status: 'success',
      details: { source_ip: data.source_ip, action: data.action },
    });

    return { data: log, error: null, validationErrors: [], auditLogged: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Operation failed';
    return { data: null, error: errorMessage, validationErrors: [], auditLogged: false };
  }
};

/**
 * Validates and inserts threat alert with logging
 */
export const createThreatAlert = async (
  data: {
    alert_type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    source_ip?: string;
    message: string;
    status?: 'active' | 'acknowledged' | 'resolved';
  },
  userId?: string
): Promise<OperationResult<any>> => {
  try {
    if (!data.alert_type || data.alert_type.length < 3) {
      return {
        data: null,
        error: "Alert type must be at least 3 characters",
        validationErrors: [{ field: 'alert_type', message: 'Invalid alert type' }],
        auditLogged: false,
      };
    }

    if (!data.message || data.message.length < 5) {
      return {
        data: null,
        error: "Message must be at least 5 characters",
        validationErrors: [{ field: 'message', message: 'Message too short' }],
        auditLogged: false,
      };
    }

    const { data: alert, error } = await supabase
      .from('threat_alerts')
      .insert({
        alert_type: data.alert_type,
        severity: data.severity,
        source_ip: data.source_ip,
        message: data.message,
        status: data.status || 'active',
      })
      .select()
      .single();

    if (error) {
      await logAuditEvent({
        user_id: userId,
        event_type: 'threat_alert',
        action: 'create',
        resource_type: 'threat_alerts',
        severity: 'critical',
        status: 'failed',
        details: { error: error.message },
      });
      return { data: null, error: error.message, validationErrors: [], auditLogged: true };
    }

    await logAuditEvent({
      user_id: userId,
      event_type: 'threat_alert',
      action: 'create',
      resource_type: 'threat_alerts',
      resource_id: alert.id,
      severity: data.severity === 'critical' ? 'critical' : 'warning',
      status: 'success',
      details: { alert_type: data.alert_type, severity: data.severity },
    });

    return { data: alert, error: null, validationErrors: [], auditLogged: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Operation failed';
    return { data: null, error: errorMessage, validationErrors: [], auditLogged: false };
  }
};

/**
 * Validates and blocks IP with logging
 */
export const blockIP = async (
  data: {
    ip_address: string;
    reason?: string;
    is_permanent?: boolean;
    expires_at?: string;
  },
  userId?: string
): Promise<OperationResult<any>> => {
  try {
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(data.ip_address)) {
      return {
        data: null,
        error: "Invalid IP address format",
        validationErrors: [{ field: 'ip_address', message: 'Must be valid IPv4 address' }],
        auditLogged: false,
      };
    }

    const { data: blocked, error } = await supabase
      .from('blocked_ips')
      .insert({
        ip_address: data.ip_address,
        reason: data.reason,
        blocked_by: userId ? 'user' : 'system',
        is_permanent: data.is_permanent || false,
        expires_at: data.expires_at,
      })
      .select()
      .single();

    if (error) {
      await logAuditEvent({
        user_id: userId,
        event_type: 'blocked_ip',
        action: 'create',
        resource_type: 'blocked_ips',
        severity: 'critical',
        status: 'failed',
        details: { error: error.message, ip_address: data.ip_address },
      });
      return { data: null, error: error.message, validationErrors: [], auditLogged: true };
    }

    await logAuditEvent({
      user_id: userId,
      event_type: 'blocked_ip',
      action: 'create',
      resource_type: 'blocked_ips',
      resource_id: blocked.id,
      severity: 'critical',
      status: 'success',
      details: { ip_address: data.ip_address, reason: data.reason },
    });

    return { data: blocked, error: null, validationErrors: [], auditLogged: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Operation failed';
    return { data: null, error: errorMessage, validationErrors: [], auditLogged: false };
  }
};

export default {
  createSecurityIncident,
  createFirewallLog,
  createThreatAlert,
  blockIP,
};