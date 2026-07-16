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
  name: "list_security_incidents",
  title: "List security incidents",
  description:
    "List recent security incidents from the RUCU platform, ordered by most recent. Optionally filter by severity or status.",
  inputSchema: {
    limit: z.number().int().min(1).max(100).default(20).describe("Max rows to return (1-100)."),
    severity: z.enum(["low", "medium", "high", "critical"]).optional().describe("Filter by severity level."),
    status: z.string().optional().describe("Filter by status, e.g. open, contained, resolved."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, severity, status }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    let q = supabaseForUser(ctx)
      .from("security_incidents")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (severity) q = q.eq("severity", severity);
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { incidents: data ?? [] },
    };
  },
});
