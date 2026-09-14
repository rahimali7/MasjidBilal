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
 * Congregation times set by the masjid. PLACEHOLDER — every value is null,
 * so the site shows a dash. Replace with real times, e.g. "6:15 AM".
 */
export const iqamah: Record<PrayerKey, string | null> = {
  fajr: null,
  dhuhr: null,
  asr: null,
  maghrib: null,
  isha: null,
};

/** True once any iqamah time has been entered. */
export function hasIqamah(): boolean {
  return Object.values(iqamah).some(Boolean);
}

export type JumuahService = {
  label: string;
  location: string;
  khutbah: string | null;
  prayer: string | null;
};

/** PLACEHOLDER — confirm how many khutbahs are held and at what time. */
export const jumuah: JumuahService[] = [
  {
    label: "Jumu'ah",
    location: "Masjid Bilal South Side",
    khutbah: null,
    prayer: null,
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
