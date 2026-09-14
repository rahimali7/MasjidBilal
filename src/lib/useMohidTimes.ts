"use client";

import { useEffect, useState } from "react";
import type { MohidResult } from "@/lib/mohid";

export type MohidState =
  | { status: "loading" }
  | { status: "ready"; data: MohidResult }
  | { status: "unavailable" };

/**
 * Loads the masjid's published prayer times from our own /api/prayer-times
 * proxy.
 *
 * Starts as "loading" on both server and client so hydration matches, then
 * settles. Any failure resolves to "unavailable" rather than throwing — the
 * caller shows calculated times instead, so the page is never empty and never
 * shows an error to a visitor who just wants to know when Maghrib is.
 */
export function useMohidTimes(): MohidState {
  const [state, setState] = useState<MohidState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/prayer-times", { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (body?.ok) {
          setState({ status: "ready", data: { adhan: body.adhan, iqamah: body.iqamah ?? {} } });
        } else {
          setState({ status: "unavailable" });
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: "unavailable" });
      });

    return () => controller.abort();
  }, []);

  return state;
}
