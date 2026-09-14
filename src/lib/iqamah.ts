/**
 * Working out iqamah (congregation) times from the masjid's own rules.
 *
 * Some are a fixed offset from the adhan, some are a fixed clock time, and
 * Dhuhr is a fixed clock time that changes with the season. Rules live in
 * `src/data/prayer.ts`; this file only applies them.
 *
 * Everything here works on the adhan time as DISPLAYED, so the same rules
 * apply whether the adhan came from the calculation or from the masjid's
 * published feed — the two must never disagree about what "15 minutes after
 * the adhan" means.
 */

export type IqamahRule =
  /** A fixed number of minutes after the adhan. */
  | { kind: "offset"; minutes: number }
  /** The same clock time every day, whatever the adhan does. */
  | {
      kind: "fixed";
      time: string;
      /**
       * A prayer this congregation must start before, and what to do if it
       * would not — see the note on `guard` below. Both or neither.
       */
      mustPrecede?: GuardPrayer;
      fallback?: IqamahRule;
    }
  /**
   * A fixed clock time that switches with the season — one value while
   * daylight saving is in effect, another during standard time.
   */
  | {
      kind: "seasonal";
      daylightSaving: string;
      standard: string;
      mustPrecede?: GuardPrayer;
      fallback?: IqamahRule;
    }
  /** No congregation time published for this prayer. */
  | { kind: "none" };

/** Prayers a fixed congregation time can be required to fall before. */
export type GuardPrayer = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

/**
 * Minutes since midnight from a displayed time.
 *
 * Accepts "1:40 PM", "1:40pm" and 24-hour "13:40". The whitespace class is
 * deliberately wide: `toLocaleTimeString("en-US")` separates the time from
 * AM/PM with U+202F (narrow no-break space) in current browsers, not a plain
 * space, and matching only " " here would silently fail on every row.
 */
export function parseClockTime(display: string): number | null {
  const cleaned = display.replace(/[\s  ]+/g, " ").trim();
  const match = cleaned.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([AaPp][Mm])?$/);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const suffix = match[3]?.toLowerCase();

  if (minute > 59) return null;

  if (suffix) {
    if (hour < 1 || hour > 12) return null;
    if (suffix === "pm" && hour !== 12) hour += 12;
    if (suffix === "am" && hour === 12) hour = 0;
  } else if (hour > 23) {
    return null;
  }

  return hour * 60 + minute;
}

/** "1:55 PM" from minutes since midnight, wrapping safely past midnight. */
export function formatClockTime(minutes: number): string {
  const wrapped = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const hour24 = Math.floor(wrapped / 60);
  const minute = wrapped % 60;
  const hour = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const period = hour24 < 12 ? "AM" : "PM";
  return `${hour}:${String(minute).padStart(2, "0")} ${period}`;
}

/** A time zone's offset from UTC, in minutes, at a given instant. */
function zoneOffsetMinutes(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  // en-US with hour12:false renders midnight as "24"; fold it back to 0.
  const hour = get("hour") % 24;

  const asUTC = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    hour,
    get("minute"),
    get("second"),
  );

  return Math.round((asUTC - date.getTime()) / 60000);
}

/**
 * Whether daylight saving is in effect in `timeZone` on `date`.
 *
 * Derived from the zone's own offsets rather than from month numbers or a
 * hard-coded switchover date, so it stays correct if the rules change and
 * works for zones that do not observe DST at all (their January and July
 * offsets match, so nothing ever counts as daylight saving).
 */
export function isDaylightSaving(date: Date, timeZone: string): boolean {
  const year = Number(
    new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric" }).format(date),
  );

  const january = zoneOffsetMinutes(new Date(Date.UTC(year, 0, 1, 12)), timeZone);
  const july = zoneOffsetMinutes(new Date(Date.UTC(year, 6, 1, 12)), timeZone);
  // Whichever is smaller is standard time — true either side of the equator.
  const standard = Math.min(january, july);

  return zoneOffsetMinutes(date, timeZone) > standard;
}

/**
 * The iqamah time to display, or null when there is nothing to show.
 *
 * A rule that cannot be applied — an unparseable adhan, a typo in a config
 * time — returns null so the table shows a dash. Showing no congregation time
 * is recoverable; showing a wrong one sends people to the masjid late.
 */
export function resolveIqamah(
  rule: IqamahRule,
  adhanDisplay: string | null,
  date: Date,
  timeZone: string,
  /**
   * The adhan of the prayer named by the rule's `mustPrecede`, as displayed.
   *
   * A pinned congregation time goes stale as the year turns: 5:30 PM for Asr
   * is sensible in September, but from mid-November Maghrib in Louisville
   * arrives at 5:30 PM or earlier, so the same pinned time would sit at or
   * after sunset — outside Asr's window altogether. Rather than publish a time
   * a person cannot validly pray at, the rule falls back when that happens.
   */
  guard?: string | null,
): string | null {
  switch (rule.kind) {
    case "none":
      return null;

    case "fixed":
    case "seasonal": {
      const time =
        rule.kind === "fixed"
          ? rule.time
          : isDaylightSaving(date, timeZone)
            ? rule.daylightSaving
            : rule.standard;
      // Round-trip through the parser so a malformed config value shows a
      // dash rather than being printed to visitors verbatim.
      const minutes = parseClockTime(time);
      if (minutes === null) return null;

      if (rule.mustPrecede && guard) {
        const limit = parseClockTime(guard);
        if (limit !== null && minutes >= limit) {
          return rule.fallback
            ? resolveIqamah(rule.fallback, adhanDisplay, date, timeZone)
            : null;
        }
      }

      return formatClockTime(minutes);
    }

    case "offset": {
      if (!adhanDisplay) return null;
      const minutes = parseClockTime(adhanDisplay);
      return minutes === null ? null : formatClockTime(minutes + rule.minutes);
    }
  }
}
