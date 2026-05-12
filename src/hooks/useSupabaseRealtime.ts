import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type RealtimeEvent = "INSERT" | "UPDATE" | "DELETE";

interface RealtimeSubscription {
  event: RealtimeEvent;
  schema: string;
  table: string;
  callback: (payload: { new?: any; old?: any }) => void;
  filter?: string;
}

export const useSupabaseRealtime = (
  channelName: string,
  subscriptions: RealtimeSubscription[],
  deps: unknown[] = []
) => {
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.WebSocket === "undefined") {
      console.warn(
        "[useSupabaseRealtime] WebSocket unavailable in this environment; realtime updates are disabled."
      );
      return;
    }

    const channel = supabase.channel(channelName);

    subscriptions.forEach(({ event, schema, table, filter, callback }) => {
      channel.on(
        "postgres_changes",
        filter ? { event, schema, table, filter } : { event, schema, table },
        callback
      );
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};
