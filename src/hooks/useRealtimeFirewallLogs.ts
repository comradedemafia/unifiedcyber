import { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";

export type FirewallLog = {
  id: string;
  direction: "inbound" | "outbound";
  source_ip: string;
  destination_ip: string;
  port: number;
  protocol: string;
  action: "allowed" | "blocked";
  reason: string;
  threat_type?: string;
  bytes_transferred: number;
  created_at: string; // From DB
};

/**
 * Custom hook to fetch and subscribe to real-time firewall logs.
 */
export const useRealtimeFirewallLogs = (limit = 50) => {
  const [logs, setLogs] = useState<FirewallLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInitialLogs = async () => {
      const { data, error } = await supabase
        .from('firewall_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) console.error("Error fetching firewall logs:", error);
      else setLogs(data || []);
      setLoading(false);
    };

    fetchInitialLogs();

    const channel = supabase.channel('firewall-logs-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'firewall_logs' }, (payload) => {
        setLogs((current) => [payload.new as FirewallLog, ...current].slice(0, limit));
      }).subscribe();

    return () => supabase.removeChannel(channel);
  }, [limit]);

  return { logs, loading };
};