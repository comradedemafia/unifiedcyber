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
  name: "block_ip",
  title: "Block an IP address",
  description:
    "Add an IP address to the firewall block list. Default expiry is 24 hours; pass is_permanent=true for an indefinite block.",
  inputSchema: {
    ip_address: z.string().min(3).describe("IPv4 or IPv6 address to block."),
    reason: z.string().optional().describe("Human-readable reason for the block."),
    is_permanent: z.boolean().default(false).describe("If true, the block does not expire."),
    hours: z.number().int().min(1).max(720).default(24).describe("Hours to block for when not permanent."),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  handler: async ({ ip_address, reason, is_permanent, hours }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const expires_at = is_permanent
      ? null
      : new Date(Date.now() + hours * 3600 * 1000).toISOString();
    const { data, error } = await supabaseForUser(ctx)
      .from("blocked_ips")
      .insert({
        ip_address,
        reason: reason ?? "Blocked via MCP",
        is_permanent,
        expires_at,
        blocked_by: ctx.getUserId(),
      })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Blocked ${ip_address}` }],
      structuredContent: { blocked: data },
    };
  },
});
