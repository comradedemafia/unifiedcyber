import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { toast } from "sonner";

type Filter = {
  schema?: string;
  table: string;
  event?: "*" | "INSERT" | "UPDATE" | "DELETE";
};

interface Options<T> {
  channelName: string;
  filter: Filter;
  /** Called for every change (realtime payload OR a polled row). */
  onChange: (row: T, source: "realtime" | "polling") => void;
  /** Polling interval used when WS is blocked. Default 5s. */
  pollIntervalMs?: number;
  /** Optional ordering column for polling (default 'created_at'). */
  orderBy?: string;
}

/**
 * Subscribe to Supabase Realtime; if the WebSocket can't connect
 * (CSP, proxy, firewall) within a short window, fall back to periodic
 * polling so the UI keeps receiving updates instead of going silent.
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
  } = opts;

  let channel: RealtimeChannel | null = null;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let lastSeen: string | null = null;
  let mode: "connecting" | "realtime" | "polling" = "connecting";

  const startPolling = (reason: string) => {
    if (mode === "polling") return;
    mode = "polling";
    console.warn(`[realtime] Falling back to polling for ${filter.table}: ${reason}`);
    toast.warning("Realtime unavailable — using polling", {
      description: `${filter.table}: ${reason}`.slice(0, 160),
      duration: 6000,
    });

    const tick = async () => {
      try {
        let q = supabase.from(filter.table as never).select("*").order(orderBy, { ascending: false }).limit(20);
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
          onChange(r as T, "polling");
        }
      } catch (err) {
        console.error("[realtime/polling] tick failed", err);
      }
    };
    void tick();
    pollTimer = setInterval(tick, pollIntervalMs);
  };

  // Try realtime first
  try {
    channel = supabase
      .channel(channelName)
      .on(
        // @ts-expect-error - postgres_changes is valid at runtime
        "postgres_changes",
        { event: filter.event ?? "*", schema: filter.schema ?? "public", table: filter.table },
        (payload: { new: T }) => {
          mode = "realtime";
          if (payload?.new) onChange(payload.new, "realtime");
        }
      )
      .subscribe((status) => {
        console.info(`[realtime] ${channelName} status:`, status);
        if (status === "SUBSCRIBED") {
          mode = "realtime";
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

  // Safety net: if we never reach SUBSCRIBED in 4s, start polling.
  const safety = setTimeout(() => {
    if (mode === "connecting") startPolling("WebSocket handshake timeout");
  }, 4000);

  return () => {
    clearTimeout(safety);
    if (pollTimer) clearInterval(pollTimer);
    if (channel) supabase.removeChannel(channel);
  };
}
