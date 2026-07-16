import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_threat_alerts",
  title: "List threat alerts",
  description: "List recent threat alerts detected by the SIEM, ordered by most recent.",
  inputSchema: {
    limit: z.number().int().min(1).max(100).default(20).describe("Max rows to return (1-100)."),
    severity: z.enum(["low", "medium", "high", "critical"]).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, severity }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    let q = supabaseForUser(ctx)
      .from("threat_alerts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (severity) q = q.eq("severity", severity);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { alerts: data ?? [] },
    };
  },
});
