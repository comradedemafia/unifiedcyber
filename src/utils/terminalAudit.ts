import { supabase } from "@/integrations/supabase/client";

export type TerminalAuditEvent =
  | "real_command"
  | "threshold_breach"
  | "rate_limit"
  | "command_blocked";

interface LogParams {
  event_type: TerminalAuditEvent;
  command?: string;
  target?: string;
  result?: "success" | "blocked" | "error";
  severity?: "info" | "warning" | "critical";
  details?: Record<string, unknown>;
}

export async function logTerminalAudit(params: LogParams) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const u = userData?.user;
    await (supabase.from("terminal_audit_log" as never) as any).insert({
      user_id: u?.id ?? null,
      user_email: u?.email ?? null,
      event_type: params.event_type,
      command: params.command ?? null,
      target: params.target ?? null,
      result: params.result ?? null,
      severity: params.severity ?? "info",
      details: params.details ?? {},
    });
  } catch (e) {
    console.warn("[terminalAudit] log failed", e);
  }
}
