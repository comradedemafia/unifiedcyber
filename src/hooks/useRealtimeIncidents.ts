import { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";

/**
 * Custom hook to fetch and subscribe to real-time security incidents.
 * Use this in components like GeoThreatMap and IncidentResponse.
 */
export const useRealtimeIncidents = (limit = 50) => {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Initial fetch
    const fetchInitialIncidents = async () => {
      const { data, error } = await supabase
        .from('security_incidents')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching incidents:", error);
      } else {
        setIncidents(data || []);
      }
      setLoading(false);
    };

    fetchInitialIncidents();

    // 2. Real-time subscription
    // Generate a unique channel name to avoid collisions when multiple 
    // components use this hook.
    const channel = supabase
      .channel(`incidents-realtime-${Math.random().toString(36).substring(7)}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'security_incidents' },
        (payload) => {
          setIncidents((current) => [payload.new, ...current].slice(0, limit));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [limit]);

  return { incidents, loading };
};