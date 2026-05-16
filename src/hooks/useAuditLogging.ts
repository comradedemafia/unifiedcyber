import { useState, useCallback } from "react";
import { validateAndLog, logAuthEvent, getAuditLogs, ValidationResult } from "@/utils/api-validation";
import { useToast } from "@/hooks/use-toast";

interface UseAuditLoggingOptions {
  onSuccess?: (result: ValidationResult) => void;
  onError?: (errors: string[]) => void;
  showNotifications?: boolean;
}

/**
 * Hook for audited data operations with validation and logging
 */
export const useAuditLogging = (options: UseAuditLoggingOptions = {}) => {
  const { toast } = useToast();
  const [isValidating, setIsValidating] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  const validateAndInsert = useCallback(
    async (
      resourceType: string,
      action: string,
      data: Record<string, any>,
      userId?: string
    ): Promise<ValidationResult> => {
      setIsValidating(true);
      setErrors([]);
      setWarnings([]);

      try {
        const result = await validateAndLog(resourceType, action, data, userId);

        if (!result.valid) {
          setErrors(result.errors);
          if (options.onError) options.onError(result.errors);
          if (options.showNotifications) {
            toast({
              title: "Validation Failed",
              description: result.errors.join(", "),
              variant: "destructive",
            });
          }
        } else {
          setWarnings(result.warnings);
          if (options.onSuccess) options.onSuccess(result);
          if (options.showNotifications && result.warnings.length > 0) {
            toast({
              title: "Data Entered",
              description: result.warnings.join(", "),
              variant: "default",
            });
          }
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Validation failed";
        setErrors([errorMessage]);
        if (options.onError) options.onError([errorMessage]);
        return {
          valid: false,
          errors: [errorMessage],
          warnings: [],
        };
      } finally {
        setIsValidating(false);
      }
    },
    [toast, options]
  );

  const logAuthAction = useCallback(
    async (
      eventType: 'login' | 'logout' | 'signup' | 'password_reset',
      status: 'success' | 'failed',
      details?: Record<string, any>
    ): Promise<boolean> => {
      try {
        const success = await logAuthEvent(eventType, status, details);
        if (!success && options.showNotifications) {
          toast({
            title: "Log Warning",
            description: "Could not record authentication event",
            variant: "default",
          });
        }
        return success;
      } catch (error) {
        console.error("Error logging auth action:", error);
        return false;
      }
    },
    [toast, options]
  );

  const fetchAuditLogs = useCallback(
    async (eventType?: string, severity?: 'info' | 'warning' | 'critical', limit?: number) => {
      try {
        return await getAuditLogs(eventType, severity, limit);
      } catch (error) {
        console.error("Error fetching audit logs:", error);
        return [];
      }
    },
    []
  );

  const appendAuditLog = useCallback((entry: any) => {
    setAuditLogs((prev) => [entry, ...prev].slice(0, 200));
  }, []);

  return {
    validateAndInsert,
    logAuthAction,
    fetchAuditLogs,
    appendAuditLog,
    isValidating,
    errors,
    warnings,
  };
};

/**
 * Hook for monitoring security events
 */
export const useSecurityMonitoring = () => {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const audit = useAuditLogging();

  const loadRecentLogs = useCallback(
    async (limit: number = 50) => {
      setIsLoading(true);
      try {
        const logs = await audit.fetchAuditLogs(undefined, undefined, limit);
        setAuditLogs(logs);
      } finally {
        setIsLoading(false);
      }
    },
    [audit]
  );

  const loadLogsByType = useCallback(
    async (eventType: string, limit: number = 50) => {
      setIsLoading(true);
      try {
        const logs = await audit.fetchAuditLogs(eventType, undefined, limit);
        setAuditLogs(logs);
      } finally {
        setIsLoading(false);
      }
    },
    [audit]
  );

  const loadCriticalLogs = useCallback(
    async (limit: number = 50) => {
      setIsLoading(true);
      try {
        const logs = await audit.fetchAuditLogs(undefined, 'critical', limit);
        setAuditLogs(logs);
      } finally {
        setIsLoading(false);
      }
    },
    [audit]
  );

  return {
    auditLogs,
    isLoading,
    loadRecentLogs,
    loadLogsByType,
    loadCriticalLogs,
  };
};
