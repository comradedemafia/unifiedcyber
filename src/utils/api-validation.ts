import { supabase } from "@/integrations/supabase/client";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface AuditLogEntry {
  user_id?: string;
  event_type: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  severity: 'info' | 'warning' | 'critical';
  status: string;
  details?: Record<string, any>;
  ip_address?: string;
}

/**
 * Validates data before sending to Supabase using server-side validation
 */
export const validateWithServer = async (
  resourceType: string,
  action: string,
  data: Record<string, any>,
  ipAddress?: string
): Promise<ValidationResult> => {
  try {
    const { data: result, error } = await supabase.functions.invoke("validate-data", {
      body: {
        resource_type: resourceType,
        action,
        data,
        ip_address: ipAddress,
      },
    });

    if (error) {
      console.error("Server validation error:", error);
      return {
        valid: false,
        errors: [error.message || "Server validation failed"],
        warnings: [],
      };
    }

    return result as ValidationResult;
  } catch (error) {
    console.error("Validation request failed:", error);
    return {
      valid: false,
      errors: ["Unable to validate data"],
      warnings: [],
    };
  }
};

/**
 * Logs an audit event to the security_logs table
 */
export const logAuditEvent = async (entry: AuditLogEntry): Promise<boolean> => {
  try {
    // Get client IP if not provided (client-side detection)
    const ipAddress = entry.ip_address || await getClientIp();

    const { error } = await supabase.from("security_logs").insert({
      user_id: entry.user_id,
      event_type: entry.event_type,
      action: entry.action,
      resource_type: entry.resource_type,
      resource_id: entry.resource_id,
      severity: entry.severity,
      status: entry.status,
      details: entry.details || {},
      ip_address: ipAddress,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      source_system: 'web-client',
    });

    if (error) {
      console.error("Failed to log audit event:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in logAuditEvent:", error);
    return false;
  }
};

/**
 * Validates and logs data operations
 */
export const validateAndLog = async (
  resourceType: string,
  action: string,
  data: Record<string, any>,
  userId?: string
): Promise<ValidationResult> => {
  const ipAddress = await getClientIp();

  // Server-side validation
  const validation = await validateWithServer(resourceType, action, data, ipAddress);

  // Log the validation event
  await logAuditEvent({
    user_id: userId,
    event_type: `${resourceType}_${action}`,
    action,
    resource_type: resourceType,
    severity: validation.valid ? 'info' : 'critical',
    status: validation.valid ? 'success' : 'failed',
    details: {
      validation_errors: validation.errors,
      validation_warnings: validation.warnings,
      data_sample: sanitizeDataForLog(data),
    },
    ip_address: ipAddress,
  });

  return validation;
};

/**
 * Get client IP address (best effort from client side)
 */
async function getClientIp(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const { ip } = await response.json();
    return ip;
  } catch {
    return 'unknown';
  }
}

/**
 * Sanitize sensitive data before logging
 */
function sanitizeDataForLog(data: Record<string, any>): Record<string, any> {
  const sanitized = { ...data };
  const sensitiveFields = ['password', 'token', 'secret', 'api_key', 'auth_code'];

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '***REDACTED***';
    }
  }

  return sanitized;
}

/**
 * Log authentication event
 */
export const logAuthEvent = async (
  eventType: 'login' | 'logout' | 'signup' | 'password_reset',
  status: 'success' | 'failed',
  details?: Record<string, any>
): Promise<boolean> => {
  try {
    const { data } = await supabase.auth.getUser();
    const ipAddress = await getClientIp();

    const { error } = await (supabase.rpc as any)('log_auth_event', {
      p_event_type: eventType,
      p_status: status,
      p_details: details || {},
      p_ip_address: ipAddress,
      p_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    });

    if (error) {
      console.error("Failed to log auth event:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in logAuthEvent:", error);
    return false;
  }
};

/**
 * Get audit logs with optional filtering
 */
export const getAuditLogs = async (
  eventType?: string,
  severity?: 'info' | 'warning' | 'critical',
  limit: number = 100
) => {
  try {
    const { data, error } = await (supabase.rpc as any)('get_audit_logs', {
      p_event_type: eventType,
      p_severity: severity,
      p_limit: limit,
    });

    if (error) {
      console.error("Failed to fetch audit logs:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getAuditLogs:", error);
    return [];
  }
};

/**
 * Get audit logs by resource
 */
export const getAuditLogsByResource = async (
  resourceType: string,
  resourceId: string
) => {
  try {
    const { data, error } = await (supabase
      .from('security_logs' as never) as any)
      .select('*')
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Failed to fetch logs by resource:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getAuditLogsByResource:", error);
    return [];
  }
};
