/**
 * Reading prayer times out of the masjid's MOHID feed.
 *
 * The exact JSON shape MOHID returns could not be inspected while this was
 * written, so this deliberately does NOT assume a schema. It walks the whole
 * response looking for prayer names paired with time-like values, wherever
 * they sit and whatever the surrounding keys are called.
 *
 * The important property is the validation gate at the end: unless all five
 * daily prayers are found with plausible times, `parseMohid` returns null and
 * the caller falls back to the calculated times. A masjid's website showing a
 * WRONG prayer time is far worse than showing a calculated one, so a partial
 * or unrecognised response is treated as no response at all.
 */

export type MohidTimes = {
  fajr: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
};

export type MohidResult = {
  /** Beginning of each prayer window. */
  adhan: MohidTimes;
  /** Congregation times, when the feed carries them. */
  iqamah: Partial<MohidTimes>;
};

type PrayerKey = keyof MohidTimes;

/** Spellings MOHID and similar feeds use, mapped to our canonical keys. */
const NAME_TO_KEY: [RegExp, PrayerKey][] = [
  [/^(fajr|fajar|fadjr|subh|sobh|dawn)$/i, "fajr"],
  [/^(dhuhr|duhr|zuhr|zohr|dhur|luhr|noon)$/i, "dhuhr"],
  [/^(asr|asar|assr)$/i, "asr"],
  [/^(maghrib|magrib|maghreb|sunset)$/i, "maghrib"],
  [/^(isha|esha|ishaa|isya|night)$/i, "isha"],
];

/** Keys whose presence marks a value as a congregation (iqamah) time. */
const IQAMAH_HINT = /(iqam|iqaa?ma|jamaa?t|jamaah|congregation)/i;
/** Keys that are definitely not a prayer time we want. */
const NOT_A_TIME = /(sunrise|shuruq|shurooq|ishraq|duha|chasht|midnight|qiyam|tahajjud|imsak|zawal)/i;

function canonicalKey(raw: string): PrayerKey | null {
  const cleaned = raw
    .replace(/[_\-\s]+/g, " ")
    .replace(/(iqam\w*|adhan|azan|athan|begin\w*|start\w*|time|salah|salat|prayer)/gi, " ")
    .trim();
  for (const [pattern, key] of NAME_TO_KEY) {
    if (pattern.test(cleaned)) return key;
  }
  return null;
}

/**
 * Normalise a time value to "h:mm AM/PM".
 * Accepts "05:12", "5:12 am", "17:12", "5:12:00 PM". Rejects anything else.
 */
export function normaliseTime(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const raw = String(value).trim();
  if (!raw) return null;

  const m = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([AaPp][Mm])?$/);
  if (!m) return null;

  let hour = Number(m[1]);
  const minute = Number(m[2]);
  const suffix = m[3]?.toLowerCase();

  if (minute > 59) return null;
  if (suffix) {
    if (hour < 1 || hour > 12) return null;
    if (suffix === "pm" && hour !== 12) hour += 12;
    if (suffix === "am" && hour === 12) hour = 0;
  } else if (hour > 23) {
    return null;
  }

  const display = hour % 12 === 0 ? 12 : hour % 12;
  const period = hour < 12 ? "AM" : "PM";
  return `${display}:${String(minute).padStart(2, "0")} ${period}`;
}

/**
 * Walk any JSON structure collecting prayer-name → time pairs.
 *
 * Handles both shapes a feed might use: a key that names the prayer
 * ({ "fajr": "5:12" }), and an object that carries the name in one field and
 * the time in another ({ "name": "Fajr", "time": "5:12" }).
 */
function collect(
  node: unknown,
  adhan: Partial<MohidTimes>,
  iqamah: Partial<MohidTimes>,
  inheritedIqamah = false,
): void {
  if (node === null || typeof node !== "object") return;

  if (Array.isArray(node)) {
    for (const item of node) collect(item, adhan, iqamah, inheritedIqamah);
    return;
  }

  const record = node as Record<string, unknown>;

  // Shape B: the prayer name lives in a value, not a key.
  const nameField = ["name", "prayer", "salah", "salat", "title", "label"]
    .map((k) => record[k])
    .find((v) => typeof v === "string" && canonicalKey(v as string));
  if (typeof nameField === "string") {
    const key = canonicalKey(nameField);
    if (key) {
      for (const [field, value] of Object.entries(record)) {
        if (NOT_A_TIME.test(field)) continue;
        const time = normaliseTime(value);
        if (!time) continue;
        const target = IQAMAH_HINT.test(field) ? iqamah : adhan;
        if (!target[key]) target[key] = time;
      }
    }
  }

  // Shape A: the key names the prayer.
  for (const [field, value] of Object.entries(record)) {
    if (NOT_A_TIME.test(field)) continue;

    const key = canonicalKey(field);
    if (key) {
      const time = normaliseTime(value);
      if (time) {
        const isIqamah = inheritedIqamah || IQAMAH_HINT.test(field);
        const target = isIqamah ? iqamah : adhan;
        if (!target[key]) target[key] = time;
        continue;
      }
    }

    // Recurse, remembering whether we are inside an "iqamah" branch.
    collect(value, adhan, iqamah, inheritedIqamah || IQAMAH_HINT.test(field));
  }
}

const REQUIRED: PrayerKey[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

/**
 * Extract prayer times from a MOHID response.
 * Returns null unless all five daily prayers were found — see the note at the
 * top of this file for why partial data is rejected outright.
 */
export function parseMohid(payload: unknown): MohidResult | null {
  const adhan: Partial<MohidTimes> = {};
  const iqamah: Partial<MohidTimes> = {};

  let root = payload;
  if (typeof root === "string") {
    try {
      root = JSON.parse(root);
    } catch {
      return null;
    }
  }

  collect(root, adhan, iqamah);

  if (!REQUIRED.every((k) => adhan[k])) return null;

  return { adhan: adhan as MohidTimes, iqamah };
}
