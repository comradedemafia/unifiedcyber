import { supabase } from "@/integrations/supabase/client";

export type SecurityEvent = {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source_ip: string;
  description: string;
  location?: {
    lat: number;
    lng: number;
    city?: string;
    country?: string;
  };
};

/**
 * Logs a security event directly to Supabase.
 * Replaces old localStorage-based logging.
 */
export const logSecurityEvent = async (event: SecurityEvent) => {
  const { data, error } = await supabase
    .from('security_incidents')
    .insert([{
      type: event.type,
      severity: event.severity,
      source_ip: event.source_ip,
      description: event.description,
      location_lat: event.location?.lat,
      location_lng: event.location?.lng,
      city: event.location?.city,
      country: event.location?.country,
      timestamp: new Date().toISOString(),
      status: 'active'
    }]);

  if (error) {
    console.error("Error logging security event:", error);
  }
  return { data, error };
};