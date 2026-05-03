import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  setChannelStatus,
  recordPayload,
  type RealtimeMode,
} from "@/utils/realtimeStatus";

type RealtimeEvent = "INSERT" | "UPDATE" | "DELETE";

interface RealtimeSubscription {
  event: RealtimeEvent;
  schema: string;
  table: string;
  callback: (payload: { new?: any; old?: any; eventType?: string }) => void;
  filter?: string;
}

/**
 * Subscribe to one Supabase Realtime channel with multiple postgres_changes
 * bindings. Reports status (websocket/connecting/error) to the global store,
 * shows a one-time "data received" health-check toast on first payload,
 * and exposes a retry handle so the UI can re-attempt without page reload.
 */
export const useSupabaseRealtime = (
  channelName: string,
  subscriptions: RealtimeSubscription[],
  deps: unknown[] = []
) => {
  const firstPayloadSeen = useRef(false);

  useEffect(() => {
    let torn = false;
    let channel = supabase.channel(channelName);

    const setMode = (mode: RealtimeMode, reason?: string) =>
      setChannelStatus(channelName, { mode, reason });

    const wrapCallback =
      (cb: RealtimeSubscription["callback"]) =>
      (payload: { new?: any; old?: any; eventType?: string }) => {
        recordPayload(channelName);
        if (!firstPayloadSeen.current) {
          firstPayloadSeen.current = true;
          toast.success("Realtime healthy: data received", {
            description: `${channelName} · via websocket`,
            duration: 4000,
          });
        }
        cb(payload);
      };

    const bind = () => {
      subscriptions.forEach(({ event, schema, table, filter, callback }) => {
        (channel as any).on(
          "postgres_changes",
          filter ? { event, schema, table, filter } : { event, schema, table },
          wrapCallback(callback)
        );
      });
    };

    const connect = () => {
      if (torn) return;
      setMode("connecting");
      bind();
      channel.subscribe((status) => {
        console.info(`[useSupabaseRealtime] ${channelName} status:`, status);
        if (status === "SUBSCRIBED") setMode("websocket");
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          setMode("error", `channel ${status}`);
        }
      });
    };

    const retry = () => {
      if (torn) return;
      toast.info("Retrying realtime…", { description: channelName, duration: 3000 });
      try {
        supabase.removeChannel(channel);
      } catch { /* noop */ }
      channel = supabase.channel(channelName);
      connect();
    };

    const filterMeta = subscriptions[0]
      ? {
          event: subscriptions.map((s) => s.event).join(","),
          schema: subscriptions[0].schema,
          table: subscriptions.map((s) => s.table).join(","),
        }
      : undefined;

    setChannelStatus(channelName, {
      mode: "connecting",
      lastUpdate: null,
      firstPayloadAt: null,
      filter: filterMeta,
      retry,
    });

    connect();

    return () => {
      torn = true;
      supabase.removeChannel(channel);
      setChannelStatus(channelName, { mode: "error", reason: "unmounted" });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};
