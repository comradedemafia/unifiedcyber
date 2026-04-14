import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface ValidationRequest {
  resource_type: string;
  action: string;
  data: Record<string, any>;
  user_id?: string;
  ip_address?: string;
}

interface ValidationResponse {
  valid: boolean;
  errors: string[];
  warnings: string[];
  resource_id?: string;
}

// Validation rules for different resource types
const VALIDATION_RULES: Record<string, Record<string, any>> = {
  security_incidents: {
    incident_type: { required: true, minLength: 3, maxLength: 100 },
    severity: { required: true, enum: ["low", "medium", "high", "critical"] },
    source_ip: { required: false, pattern: /^(\d{1,3}\.){3}\d{1,3}$/ },
    description: { required: false, maxLength: 1000 },
    status: { required: true, enum: ["detected", "investigating", "resolved", "false_positive"] },
  },
  firewall_logs: {
    source_ip: { required: true, pattern: /^(\d{1,3}\.){3}\d{1,3}$/ },
    destination_ip: { required: false, pattern: /^(\d{1,3}\.){3}\d{1,3}$/ },
    port: { required: false, min: 1, max: 65535, type: "number" },
    protocol: { required: true, enum: ["TCP", "UDP", "ICMP"] },
    action: { required: true, enum: ["allowed", "blocked"] },
    threat_type: { required: false, maxLength: 100 },
  },
  threat_alerts: {
    alert_type: { required: true, minLength: 3, maxLength: 100 },
    severity: { required: true, enum: ["low", "medium", "high", "critical"] },
    source_ip: { required: false, pattern: /^(\d{1,3}\.){3}\d{1,3}$/ },
    message: { required: true, minLength: 5, maxLength: 500 },
    status: { required: true, enum: ["active", "acknowledged", "resolved"] },
  },
  blocked_ips: {
    ip_address: { required: true, pattern: /^(\d{1,3}\.){3}\d{1,3}$/, unique: true },
    reason: { required: false, maxLength: 500 },
    is_permanent: { required: false, type: "boolean" },
    expires_at: { required: false, type: "date" },
  },
};

// Validate individual field against rule
function validateField(
  field: string,
  value: any,
  rule: Record<string, any>
): string | null {
  // Check required
  if (rule.required && (value === undefined || value === null || value === "")) {
    return `${field} is required`;
  }

  if (value === undefined || value === null) {
    return null;
  }

  // Check type
  if (rule.type && typeof value !== rule.type) {
    return `${field} must be of type ${rule.type}`;
  }

  // Check enum
  if (rule.enum && !rule.enum.includes(value)) {
    return `${field} must be one of: ${rule.enum.join(", ")}`;
  }

  // Check pattern
  if (rule.pattern && !rule.pattern.test(String(value))) {
    return `${field} format is invalid`;
  }

  // Check minLength
  if (rule.minLength && String(value).length < rule.minLength) {
    return `${field} must be at least ${rule.minLength} characters`;
  }

  // Check maxLength
  if (rule.maxLength && String(value).length > rule.maxLength) {
    return `${field} must be at most ${rule.maxLength} characters`;
  }

  // Check min value
  if (rule.min !== undefined && Number(value) < rule.min) {
    return `${field} must be at least ${rule.min}`;
  }

  // Check max value
  if (rule.max !== undefined && Number(value) > rule.max) {
    return `${field} must be at most ${rule.max}`;
  }

  return null;
}

// Check if value already exists in database (for unique constraints)
async function checkUnique(
  resourceType: string,
  field: string,
  value: any
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from(resourceType)
      .select(`${field}`)
      .eq(field, value)
      .limit(1);

    if (error) throw error;
    return data && data.length > 0;
  } catch (error) {
    console.error(`Error checking unique constraint for ${field}`, error);
    return false;
  }
}

// Main validation function
async function validateRequest(req: ValidationRequest): Promise<ValidationResponse> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const rules = VALIDATION_RULES[req.resource_type];
  if (!rules) {
    errors.push(`Unknown resource type: ${req.resource_type}`);
    return { valid: false, errors, warnings };
  }

  // Validate each field
  for (const [field, rule] of Object.entries(rules)) {
    const value = req.data[field];
    const fieldError = validateField(field, value, rule);

    if (fieldError) {
      errors.push(fieldError);
    }

    // Check unique constraint
    if (rule.unique && value !== undefined) {
      const exists = await checkUnique(req.resource_type, field, value);
      if (exists) {
        errors.push(`${field} already exists`);
      }
    }
  }

  // Additional cross-field validations
  if (req.resource_type === "blocked_ips" && req.data.expires_at) {
    const expiresAt = new Date(req.data.expires_at);
    if (expiresAt <= new Date()) {
      errors.push("expires_at must be in the future");
    }
  }

  // Additional warnings for data quality
  if (req.resource_type === "security_incidents" && req.data.description) {
    if (req.data.description.length < 10) {
      warnings.push("Consider providing a more detailed description");
    }
  }

  // Log validation event
  try {
    const { error: logError } = await supabase
      .from("security_logs")
      .insert({
        user_id: req.user_id || null,
        event_type: "validation",
        action: req.action,
        resource_type: req.resource_type,
        severity: errors.length > 0 ? "critical" : "info",
        status: errors.length > 0 ? "failed" : "success",
        details: {
          validation_errors: errors,
          validation_warnings: warnings,
          data: req.data,
        },
        ip_address: req.ip_address,
        source_system: "validation-api",
      });

    if (logError) {
      console.error("Error logging validation event:", logError);
    }
  } catch (error) {
    console.error("Error in validation logging:", error);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const body = await req.json();
    const clientIp = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Extract user ID from auth header if present
    const authHeader = req.headers.get("authorization");
    let userId: string | undefined;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const { data, error: jwtError } = await supabase.auth.getUser(token);
        if (!jwtError && data.user) {
          userId = data.user.id;
        }
      } catch (error) {
        console.error("Error verifying token:", error);
      }
    }

    const result = await validateRequest({
      ...body,
      user_id: userId,
      ip_address: clientIp,
    });

    return new Response(JSON.stringify(result), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      status: result.valid ? 200 : 400,
    });
  } catch (error) {
    console.error("Validation error:", error);
    return new Response(
      JSON.stringify({
        valid: false,
        errors: ["Internal server error"],
        warnings: [],
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        status: 500,
      }
    );
  }
});
