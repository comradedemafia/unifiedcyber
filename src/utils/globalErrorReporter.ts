import { toast } from "sonner";
import { recordCspViolation } from "./realtimeStatus";

/**
 * Captures CSP violations, uncaught errors, unhandled promise rejections,
 * and network/WebSocket failures, then surfaces them via console + toast.
 *
 * This prevents silent blank screens by giving us the real cause.
 */
let installed = false;

export function installGlobalErrorReporter() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  // 1) CSP violations — exact directive + blocked URI
  document.addEventListener("securitypolicyviolation", (e) => {
    const detail = {
      blockedURI: e.blockedURI,
      violatedDirective: e.violatedDirective,
      effectiveDirective: e.effectiveDirective,
      originalPolicy: e.originalPolicy?.slice(0, 300),
      sourceFile: e.sourceFile,
      lineNumber: e.lineNumber,
    };
    console.error("[CSP] Violation:", detail);
    recordCspViolation({
      blockedURI: e.blockedURI || "(inline)",
      violatedDirective: e.violatedDirective || "",
      effectiveDirective: e.effectiveDirective || e.violatedDirective || "",
      sourceFile: e.sourceFile,
      lineNumber: e.lineNumber,
    });
    toast.error("CSP blocked a resource", {
      description: `${e.effectiveDirective || e.violatedDirective} → ${e.blockedURI || "inline"}`,
      duration: 10000,
    });
  });

  // 2) Uncaught runtime errors
  window.addEventListener("error", (e) => {
    // Resource load errors (img/script/link) come as ErrorEvent on capture
    const target = e.target as (HTMLElement & { src?: string; href?: string }) | null;
    if (target && target !== (window as unknown as HTMLElement) && (target.src || target.href)) {
      const url = target.src || target.href;
      console.error("[Resource] Failed to load:", target.tagName, url);
      toast.error("Resource failed to load", {
        description: `${target.tagName}: ${url}`,
        duration: 8000,
      });
      return;
    }
    if (e.error || e.message) {
      console.error("[Window error]", e.message, e.error);
      toast.error("Runtime error", {
        description: (e.error?.message || e.message || "Unknown").slice(0, 200),
        duration: 8000,
      });
    }
  }, true); // capture to get resource errors

  // 3) Unhandled promise rejections (fetch/Supabase/Realtime, etc.)
  window.addEventListener("unhandledrejection", (e) => {
    const reason: unknown = e.reason;
    const msg =
      reason instanceof Error ? reason.message :
      typeof reason === "string" ? reason :
      JSON.stringify(reason);
    console.error("[UnhandledRejection]", reason);
    const isWs = /WebSocket|wss:/i.test(msg);
    toast.error(isWs ? "Realtime/WebSocket error" : "Unhandled promise rejection", {
      description: msg.slice(0, 200),
      duration: 8000,
    });
  });

  console.info("[globalErrorReporter] installed (CSP + error + rejection listeners)");
}
