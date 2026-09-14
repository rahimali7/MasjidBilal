"use client";

import { useEffect, useState } from "react";
import type { DonationCategory } from "@/lib/mohidDonations";

export type DonationsState =
  | { status: "loading" }
  | { status: "ready"; categories: DonationCategory[] }
  | { status: "unavailable" };

/**
 * Loads the masjid's donation categories from our own /api/donations proxy.
 *
 * Starts as "loading" on both server and client so the markup matches during
 * hydration, then settles. Any failure resolves to "unavailable" rather than
 * throwing: the donate page then shows the offline giving instructions, so
 * someone trying to give is never left with an error or an empty panel.
 */
export function useMohidDonations(): DonationsState {
  const [state, setState] = useState<DonationsState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/donations", { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (body?.ok && Array.isArray(body.categories) && body.categories.length > 0) {
          setState({ status: "ready", categories: body.categories });
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
