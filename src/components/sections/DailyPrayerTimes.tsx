"use client";

import { useMemo } from "react";
import {
  CalculationMethod,
  Coordinates,
  Madhab,
  PrayerTimes,
  type CalculationParameters,
} from "adhan";
import { useNow } from "@/lib/useNow";
import { useMohidTimes } from "@/lib/useMohidTimes";
import { cn } from "@/lib/cn";
import {
  hasIqamah,
  iqamahRules,
  prayerConfig,
  prayerNames,
  type PrayerKey,
} from "@/data/prayer";
import { resolveIqamah } from "@/lib/iqamah";

function params(): CalculationParameters {
  const p = CalculationMethod[prayerConfig.method]();
  p.madhab = prayerConfig.madhab === "hanafi" ? Madhab.Hanafi : Madhab.Shafi;
  return p;
}

function fmtTime(d: Date): string {
  return d.toLocaleTimeString("en-US", {
    timeZone: prayerConfig.timeZone,
    hour: "numeric",
    minute: "2-digit",
  });
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    timeZone: prayerConfig.timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/**
 * Today's prayer times, calculated in the browser for the masjid's location.
 *
 * Nothing is fetched and nothing is hand-maintained, so the table is correct
 * every day. Iqamah times are the masjid's own and come from config; a prayer
 * without one shows a dash rather than a guess.
 */
export function DailyPrayerTimes() {
  const now = useNow();
  const feed = useMohidTimes();

  // The masjid's own published times win when the feed answers; the
  // calculated times are the fallback, so the table is never empty.
  const published = feed.status === "ready" ? feed.data : null;
  const feedIqamah = published?.iqamah ?? {};
  const showIqamah = Object.keys(feedIqamah).length > 0 || hasIqamah();

  /**
   * The masjid's congregation time for one prayer.
   *
   * Needs `now` for the seasonal rules (whether daylight saving is in effect),
   * so it yields nothing until the clock is known on the client — the same
   * moment the adhan times themselves appear.
   */
  const adhanFor = (key: PrayerKey): string | null =>
    published ? published.adhan[key] : times ? fmtTime(times[key]) : null;

  const computedIqamah = (key: PrayerKey, adhanDisplay: string | null) => {
    if (!now) return null;
    const rule = iqamahRules[key];
    // A pinned time may be required to fall before another prayer's adhan;
    // hand that prayer's time over so the rule can check it.
    const guard =
      (rule.kind === "fixed" || rule.kind === "seasonal") && rule.mustPrecede
        ? adhanFor(rule.mustPrecede)
        : null;
    return resolveIqamah(rule, adhanDisplay, now, prayerConfig.timeZone, guard);
  };

  const { times, nextKey } = useMemo(() => {
    if (!now) return { times: null, nextKey: null };
    const t = new PrayerTimes(
      new Coordinates(
        prayerConfig.coordinates.latitude,
        prayerConfig.coordinates.longitude,
      ),
      now,
      params(),
    );
    // adhan returns "none" once Isha has passed for the day.
    const next = t.nextPrayer();
    return {
      times: t,
      nextKey: (["fajr", "dhuhr", "asr", "maghrib", "isha"] as PrayerKey[]).includes(
        next as PrayerKey,
      )
        ? (next as PrayerKey)
        : null,
    };
  }, [now]);

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="eyebrow">Today</p>
        {/* suppressHydrationWarning: the date is intentionally client-only. */}
        <p className="text-sm text-muted" suppressHydrationWarning>
          {now ? fmtDate(now) : " "}
        </p>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-navy-800/10">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">
            Today&rsquo;s prayer times at Masjid Bilal Islamic Center
          </caption>
          <thead>
            <tr className="bg-navy-800 text-sand-50">
              <th scope="col" className="px-6 py-5 text-xs font-medium uppercase tracking-[0.16em] sm:px-8">
                Prayer
              </th>
              <th scope="col" className="px-6 py-5 text-xs font-medium uppercase tracking-[0.16em] sm:px-8">
                Adhan
              </th>
              {showIqamah && (
                <th scope="col" className="px-6 py-5 text-xs font-medium uppercase tracking-[0.16em] sm:px-8">
                  Iqamah
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {prayerNames.map((p, i) => {
              const isNext = nextKey === p.key;
              // The adhan exactly as shown, so an offset rule such as
              // "15 minutes after the adhan" is measured against the time the
              // visitor can actually see in the row.
              const adhanDisplay = adhanFor(p.key);
              return (
                <tr
                  key={p.key}
                  className={cn(
                    "transition-colors duration-500",
                    isNext
                      ? "bg-gold-400/15"
                      : i % 2 === 0
                        ? "bg-white"
                        : "bg-sand-50",
                  )}
                >
                  <th scope="row" className="px-6 py-6 font-normal sm:px-8">
                    <span className="flex items-center gap-3">
                      <span className="font-display text-xl text-navy-800">
                        {p.name}
                      </span>
                      {isNext && (
                        <span className="rounded-full bg-gold-400 px-2.5 py-0.5 text-[0.625rem] font-medium uppercase tracking-[0.14em] text-navy-900">
                          Next
                        </span>
                      )}
                    </span>
                    <span lang="ar" dir="rtl" className="mt-1 block text-lg text-gold-600">
                      {p.arabic}
                    </span>
                  </th>
                  <td
                    className="px-6 py-6 font-display text-2xl text-navy-800 tabular-nums sm:px-8"
                    suppressHydrationWarning
                  >
                    {adhanDisplay ?? "—"}
                  </td>
                  {showIqamah && (
                    <td
                      className="px-6 py-6 font-display text-2xl text-crimson-700 tabular-nums sm:px-8"
                      suppressHydrationWarning
                    >
                      {feedIqamah[p.key] ?? computedIqamah(p.key, adhanDisplay) ?? "—"}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 space-y-2 text-sm text-muted">
        <p suppressHydrationWarning>
          {published ? (
            <>Times published by the masjid, updated automatically.</>
          ) : (
            <>
              Adhan times are calculated for the masjid&rsquo;s location using
              the {prayerConfig.methodLabel} method
              {prayerConfig.madhab === "hanafi" ? " (Hanafi Asr)" : ""}, and
              update automatically each day.
            </>
          )}
        </p>
        {!showIqamah && (
          <p>
            Iqamah times are set by the masjid and are not yet listed here —
            please call to confirm congregation times.
          </p>
        )}
      </div>
    </div>
  );
}
