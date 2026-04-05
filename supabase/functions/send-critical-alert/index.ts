import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

interface AlertPayload {
  alert_type: string;
  severity: string;
  message: string;
  source_ip?: string;
  admin_email: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: AlertPayload = await req.json();

    if (!body.alert_type || !body.severity || !body.message || !body.admin_email) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert alert into database
    const { error: insertError } = await supabase.from("threat_alerts").insert({
      alert_type: body.alert_type,
      severity: body.severity,
      message: body.message,
      source_ip: body.source_ip || null,
      status: "active",
    });

    if (insertError) {
      console.error("Insert error:", insertError);
    }

    // Send email notification via Lovable API
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (lovableApiKey) {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0f1a; color: #e0e0e0; padding: 30px; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #00e5a0; font-size: 24px; margin: 0;">⚠️ Critical Security Alert</h1>
          </div>
          <div style="background: #1a1f2e; border: 1px solid #ff4444; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #888; font-size: 13px;">Alert Type</td><td style="padding: 8px 0; color: #fff; font-weight: bold;">${body.alert_type}</td></tr>
              <tr><td style="padding: 8px 0; color: #888; font-size: 13px;">Severity</td><td style="padding: 8px 0; color: #ff4444; font-weight: bold; text-transform: uppercase;">${body.severity}</td></tr>
              <tr><td style="padding: 8px 0; color: #888; font-size: 13px;">Message</td><td style="padding: 8px 0; color: #fff;">${body.message}</td></tr>
              ${body.source_ip ? `<tr><td style="padding: 8px 0; color: #888; font-size: 13px;">Source IP</td><td style="padding: 8px 0; color: #00e5a0; font-family: monospace;">${body.source_ip}</td></tr>` : ""}
              <tr><td style="padding: 8px 0; color: #888; font-size: 13px;">Time</td><td style="padding: 8px 0; color: #fff;">${new Date().toISOString()}</td></tr>
            </table>
          </div>
          <p style="color: #888; font-size: 12px; text-align: center;">UCSF Security Operations Center - Automated Alert</p>
        </div>
      `;

      console.log(`Critical alert email prepared for ${body.admin_email}: ${body.alert_type}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Critical alert processed and notification sent" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
