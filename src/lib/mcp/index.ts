import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listSecurityIncidents from "./tools/list-security-incidents";
import listThreatAlerts from "./tools/list-threat-alerts";
import listFirewallLogs from "./tools/list-firewall-logs";
import listBlockedIps from "./tools/list-blocked-ips";
import blockIp from "./tools/block-ip";

// The OAuth issuer MUST be the direct Supabase host (not the .lovable.cloud proxy).
// Read the project ref from a Vite-inlined env var to keep this module import-safe
// (no runtime env reads at module top-level).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "rucu-cybersecurity-mcp",
  title: "RUCU Cybersecurity MCP",
  version: "0.1.0",
  instructions:
    "Tools for the RUCU Unified Cyber Security platform. Read recent security incidents, threat alerts, firewall logs, and blocked IPs, or block an offending IP address. All tools act on behalf of the signed-in RUCU user under RLS.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listSecurityIncidents, listThreatAlerts, listFirewallLogs, listBlockedIps, blockIp],
});
