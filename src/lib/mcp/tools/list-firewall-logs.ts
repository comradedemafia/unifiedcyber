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
  name: "list_firewall_logs",
  title: "List firewall logs",
  description: "List recent firewall log entries. Optionally filter by source IP or action.",
  inputSchema: {
    limit: z.number().int().min(1).max(200).default(50).describe("Max rows (1-200)."),
    source_ip: z.string().optional().describe("Filter by source IP address."),
    action: z.string().optional().describe("Filter by action, e.g. block, allow."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, source_ip, action }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    let q = supabaseForUser(ctx)
      .from("firewall_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (source_ip) q = q.eq("source_ip", source_ip);
    if (action) q = q.eq("action", action);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { logs: data ?? [] },
    };
  },
});
