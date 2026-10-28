"use client";

import { useEffect, useState } from "react";
import { createClient, type RealtimeChannel } from "@supabase/supabase-js";
import type { DashboardModel } from "@/domain/dashboards/view-model";

const REFRESH_MS = 5000;
let browser: ReturnType<typeof createClient> | null = null;

function publicBrowser() {
  if (browser) return browser;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  browser = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      storageKey: "pqvst-public-dashboard",
    },
  });
  return browser;
}

export function usePublicDashboard(initial: DashboardModel) {
  const [model, setModel] = useState(initial);

  useEffect(() => {
    let stopped = false;

    async function pull() {
      try {
        const response = await fetch("/api/transparencia", { cache: "no-store" });
        if (!response.ok || stopped) return;
        const next = (await response.json()) as DashboardModel;
        if (!stopped) setModel(next);
      } catch {
        // Mantém a última publicação lida se a rede falhar.
      }
    }

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void pull();
    }, REFRESH_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void pull();
    };
    document.addEventListener("visibilitychange", onVisible);

    const supabase = publicBrowser();
    let channel: RealtimeChannel | null = null;
    if (supabase) {
      channel = supabase
        .channel(`public-aggregate-snapshots-${crypto.randomUUID()}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "aggregate_snapshots" }, () => {
          void pull();
        })
        .subscribe();
    }

    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      if (supabase && channel) void supabase.removeChannel(channel);
    };
  }, []);

  return model;
}
