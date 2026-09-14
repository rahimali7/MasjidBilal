/**
 * Prayer times.
 *
 * The daily adhan times on the site are CALCULATED, not typed in by hand and
 * not fetched from a third party. They are computed in the browser with the
 * `adhan` library (batoulapps/adhan-js, MIT) from the coordinates and
 * calculation method below, so they are correct for every day of the year
 * with nothing to maintain.
 *
 * Two things are still the masjid's own decisions and must be entered here:
 *   1. `method` and `madhab` — these must match what the masjid actually
 *      follows, or the printed times will differ from the board by minutes.
 *   2. `iqamah` — the congregation times. These are not astronomy; they are
 *      set by the masjid. Leave a prayer null and the site shows a dash for
 *      it rather than inventing a time.
 */

/** Calculation conventions supported by the adhan library. */
export type MethodName =
  | "MuslimWorldLeague"
  | "Egyptian"
  | "Karachi"
  | "UmmAlQura"
  | "Dubai"
  | "MoonsightingCommittee"
  | "NorthAmerica"
  | "Kuwait"
  | "Qatar"
  | "Singapore"
  | "Tehran"
  | "Turkey";

export type MadhabName = "shafi" | "hanafi";

export const prayerConfig: {
  coordinates: { latitude: number; longitude: number };
  timeZone: string;
  method: MethodName;
  madhab: MadhabName;
  methodLabel: string;
} = {
  /**
   * Masjid Bilal South Side, 6200 S 3rd Street, Louisville, KY 40214.
   *
   * Approximate to the neighbourhood rather than surveyed — within a single
   * city the difference is under a minute. To make it exact: open the address
   * in Google Maps, right-click the building, and copy the coordinates.
   */
  coordinates: { latitude: 38.1553, longitude: -85.783 },

  timeZone: "America/Kentucky/Louisville",

  /**
   * ISNA, the convention most commonly followed in North America.
   * Other options: MuslimWorldLeague, Egyptian, Karachi, UmmAlQura, Dubai,
   * MoonsightingCommittee, Kuwait, Qatar, Singapore, Tehran, Turkey.
   * CONFIRM this with the imam — it changes Fajr and Isha by several minutes.
   */
  method: "NorthAmerica",

  /** "shafi" (earlier Asr) or "hanafi" (later Asr). CONFIRM with the imam. */
  madhab: "shafi",

  /** Human-readable label shown under the table. */
  methodLabel: "ISNA",
};

import type { IqamahRule } from "@/lib/iqamah";

export type PrayerKey = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

export const prayerNames: {
  key: PrayerKey;
  name: string;
  arabic: string;
}[] = [
  { key: "fajr", name: "Fajr", arabic: "الفجر" },
  { key: "dhuhr", name: "Dhuhr", arabic: "الظهر" },
  { key: "asr", name: "Asr", arabic: "العصر" },
  { key: "maghrib", name: "Maghrib", arabic: "المغرب" },
  { key: "isha", name: "Isha", arabic: "العشاء" },
];

/**
 * Congregation (iqamah) times, as the masjid sets them.
 *
 * These are RULES rather than a list of times, so nothing has to be retyped
 * as the adhan drifts through the year. Three shapes are available — see
 * `src/lib/iqamah.ts`:
 *
 *   offset   — a fixed number of minutes after the adhan
 *   fixed    — the same clock time every day
 *   seasonal — one clock time under daylight saving, another in winter
 *
 * To change a time, edit the value here; nothing else needs touching.
 */
export const iqamahRules: Record<PrayerKey, IqamahRule> = {
  /** Always 20 minutes after the adhan. */
  fajr: { kind: "offset", minutes: 20 },

  /**
   * A fixed time that switches with the season, NOT an offset.
   *
   * The masjid gave two examples: adhan around 1:40 pm with iqamah at 2:00 pm,
   * and adhan around 12:42 pm in winter with iqamah at 1:00 pm. Those are the
   * summer and winter Dhuhr adhans for Louisville, so the underlying rule is a
   * fixed congregation time per season. Confirmed with the masjid.
   *
   * Keyed off the time zone's real daylight-saving offset rather than the
   * adhan minute: the calculated adhan drifts a minute or two either way, so
   * matching "exactly 1:40 pm" would almost never fire.
   */
  dhuhr: { kind: "seasonal", daylightSaving: "2:00 PM", standard: "1:00 PM" },

  /**
   * Currently pinned to 5:30 PM by the masjid rather than following the adhan.
   * EDIT THE TIME when the season turns.
   *
   * `mustPrecede` is a safety net, not a schedule. From roughly 16 November to
   * 27 December in Louisville, Maghrib arrives at 5:30 PM or earlier, so a
   * pinned 5:30 PM Asr would sit at or after sunset — outside Asr's window,
   * and not a valid time to pray it. On those days the site falls back to the
   * masjid's own underlying rule (adhan + 15) rather than publishing a time
   * nobody can pray at. If the pinned time is updated before then, the
   * fallback never fires.
   */
  asr: {
    kind: "fixed",
    time: "5:30 PM",
    mustPrecede: "maghrib",
    fallback: { kind: "offset", minutes: 15 },
  },

  /** Always 6 minutes after the adhan. */
  maghrib: { kind: "offset", minutes: 6 },

  /** Always 10 minutes after the adhan. */
  isha: { kind: "offset", minutes: 10 },
};

/** True while any prayer has a congregation time to show. */
export function hasIqamah(): boolean {
  return Object.values(iqamahRules).some((rule) => rule.kind !== "none");
}

export type JumuahService = {
  label: string;
  location: string;
  khutbah: string | null;
  prayer: string | null;
};

/**
 * Friday congregation, as given by the masjid.
 *
 * Fixed times rather than rules: Jumu'ah replaces Dhuhr and is scheduled by
 * the clock, so it does not move with the adhan.
 *
 * NEEDS-CONFIRMATION: an adhan time of 1:15 PM was mentioned before these
 * times were corrected, which cannot sit between a 1:00 PM khutbah and a
 * 1:45 PM prayer. It is deliberately NOT published until the masjid confirms
 * it — a wrong Friday time is the one most likely to make someone miss the
 * prayer entirely.
 */
export const jumuah: JumuahService[] = [
  {
    label: "Jumu'ah",
    location: "Masjid Bilal South Side",
    khutbah: "1:00 PM",
    prayer: "1:45 PM",
  },
];

/**
 * Optional Masjidal widget override.
 *
 * Publish a widget in the Masjidal platform, press "Embed", and paste the
 * markup into `embedHtml`. When set, it replaces the calculated table
 * entirely, and the loader script below is added to the prayer-times page.
 *
 * `embedHtml` is injected as raw HTML. That is safe only because it comes
 * from this repository file, which only developers can edit — never wire it
 * to user input, request data, or a URL parameter.
 */
export const mohid = {
  /**
   * The masjid's MOHID feed. This is the AUTHORITATIVE source: it carries the
   * times the masjid itself publishes, including iqamah, so when it responds
   * it takes precedence over the calculated times below.
   *
   * Read server-side by /api/prayer-times — never fetched straight from the
   * browser, which CORS would usually block.
   *
   * VERIFIED 2026-09-14: this endpoint answers HTTP 200 with an empty array,
   * `[]`. It is reachable and it is not erroring — it simply carries no
   * timetable. Nothing in the parser can change that; the masjid has to
   * publish its timetable to this feed in MOHID before it will return data.
   * Until then /api/prayer-times reports "unrecognised-shape" and the page
   * falls back to calculated times, which is the correct behaviour.
   */
  feedUrl:
    "https://us.mohid.co/ky/louisville/masjidbilalsouthside/masjid/widget/api/index/?m=vfrlist/json",
} as const;

/**
 * Optional Masjidal widget override.
 *
 * Publish a widget in the Masjidal platform, press "Embed", and paste the
 * markup into `embedHtml`. When set, it replaces everything else on the page.
 *
 * `embedHtml` is injected as raw HTML. That is safe only because it comes
 * from this repository file, which only developers can edit — never wire it
 * to user input, request data, or a URL parameter.
 */
export const masjidal = {
  scriptSrc: "https://widgets.masjidal.com/timetable/v0/widget.js",
  embedHtml: null as string | null,
  /** Read from the environment; never committed. See .env.example. */
  apiKey: process.env.NEXT_PUBLIC_MASJIDAL_API_KEY ?? null,
};

export function hasMasjidalWidget(): boolean {
  return Boolean(masjidal.embedHtml);
}
