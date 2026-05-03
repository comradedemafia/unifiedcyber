import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { toast } from "sonner";
import {
  setChannelStatus,
  recordPayload,
  type RealtimeMode,
} from "./realtimeStatus";

type Filter = {
  schema?: string;
  table: string;
  event?: "*" | "INSERT" | "UPDATE" | "DELETE";
};

interface Options<T> {
  channelName: string;
  filter: Filter;
  /** Called for every change (realtime payload OR a polled row). */
  onChange: (row: T, source: "websocket" | "polling") => void;
  /** Polling interval used when WS is blocked. Default 5s. */
  pollIntervalMs?: number;
  /** Optional ordering column for polling (default 'created_at'). */
  orderBy?: string;
  /**
   * Show a one-time "data received" toast after the first payload (health-check).
   * Default true.
   */
  healthCheckToast?: boolean;
}

/**
 * Subscribe to Supabase Realtime; if the WebSocket can't connect
 * (CSP, proxy, firewall) within a short window, fall back to periodic
 * polling so the UI keeps receiving updates instead of going silent.
 *
 * - Reports status (mode + lastUpdate) to the global realtimeStatus store.
 * - Shows a one-time "data received" toast after the first payload.
 * - Surfaces a "Retry realtime" action in the polling toast (no page reload).
 *
 * Returns a teardown function.
 */
export function subscribeWithFallback<T = Record<string, unknown>>(
  opts: Options<T>
): () => void {
  const {
    channelName,
    filter,
    onChange,
    pollIntervalMs = 5000,
    orderBy = "created_at",
    healthCheckToast = true,
  } = opts;

  let channel: RealtimeChannel | null = null;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let lastSeen: string | null = null;
  let firstPayloadSeen = false;
  let mode: RealtimeMode = "connecting";
  let safetyTimer: ReturnType<typeof setTimeout> | null = null;
  let torn = false;

  const setMode = (m: RealtimeMode, reason?: string) => {
    mode = m;
    setChannelStatus(channelName, { mode: m, reason });
  };

  const handlePayload = (row: T, source: "websocket" | "polling") => {
    recordPayload(channelName);
    if (!firstPayloadSeen && healthCheckToast) {
      firstPayloadSeen = true;
      toast.success("Realtime healthy: data received", {
        description: `${channelName} · via ${source}`,
        duration: 4000,
      });
    }
    onChange(row, source);
  };

  const stopPolling = () => {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  };

  const startPolling = (reason: string) => {
    if (mode === "polling" || torn) return;
    setMode("polling", reason);
    console.warn(`[realtime] Falling back to polling for ${filter.table}: ${reason}`);

    toast.warning("Realtime unavailable — using polling", {
      description: `${filter.table}: ${reason}`.slice(0, 160),
      duration: 8000,
      action: {
        label: "Retry realtime",
        onClick: () => retryRealtime("user requested"),
      },
    });

    const tick = async () => {
      try {
        let q = supabase
          .from(filter.table as never)
          .select("*")
          .order(orderBy, { ascending: false })
          .limit(20);
        if (lastSeen) q = q.gt(orderBy, lastSeen) as typeof q;
        const { data, error } = await q;
        if (error) {
          console.error("[realtime/polling] query error", error);
          return;
        }
        const rows = (data ?? []) as Array<Record<string, unknown>>;
        for (const r of rows.reverse()) {
          const ts = r[orderBy] as string | undefined;
          if (ts && (!lastSeen || ts > lastSeen)) lastSeen = ts;
          handlePayload(r as T, "polling");
        }
      } catch (err) {
        console.error("[realtime/polling] tick failed", err);
      }
    };
    void tick();
    pollTimer = setInterval(tick, pollIntervalMs);
  };

  const tryConnectRealtime = () => {
    setMode("connecting");
    try {
      channel = supabase
        .channel(channelName)
        .on(
          // @ts-expect-error - postgres_changes is valid at runtime
          "postgres_changes",
          {
            event: filter.event ?? "*",
            schema: filter.schema ?? "public",
            table: filter.table,
          },
          (payload: { new: T }) => {
            if (payload?.new) handlePayload(payload.new, "websocket");
          }
        )
        .subscribe((status) => {
          console.info(`[realtime] ${channelName} status:`, status);
          if (status === "SUBSCRIBED") {
            setMode("websocket");
          } else if (
            status === "CHANNEL_ERROR" ||
            status === "TIMED_OUT" ||
            status === "CLOSED"
          ) {
            startPolling(`channel ${status}`);
          }
        });
    } catch (err) {
      startPolling((err as Error)?.message || "WebSocket setup failed");
    }

    if (safetyTimer) clearTimeout(safetyTimer);
    safetyTimer = setTimeout(() => {
      if (mode === "connecting") startPolling("WebSocket handshake timeout");
    }, 4000);
  };

  const retryRealtime = (reason: string) => {
    if (torn) return;
    console.info(`[realtime] retrying ${channelName}: ${reason}`);
    toast.info("Retrying realtime…", { description: channelName, duration: 3000 });
    stopPolling();
    if (channel) {
      try {
        supabase.removeChannel(channel);
      } catch {
        /* noop */
      }
      channel = null;
    }
    tryConnectRealtime();
  };

  // Register channel + retry handle in store so the UI status panel can call it
  setChannelStatus(channelName, {
    mode: "connecting",
    lastUpdate: null,
    firstPayloadAt: null,
    filter: {
      event: filter.event ?? "*",
      schema: filter.schema ?? "public",
      table: filter.table,
    },
    retry: () => retryRealtime("user requested"),
  });

  tryConnectRealtime();

  return () => {
    torn = true;
    if (safetyTimer) clearTimeout(safetyTimer);
    stopPolling();
    if (channel) supabase.removeChannel(channel);
    setChannelStatus(channelName, { mode: "error", reason: "torn down" });
  };
}
