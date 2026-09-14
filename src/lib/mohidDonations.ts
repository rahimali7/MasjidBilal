/**
 * Reading the masjid's donation categories out of MOHID's website-integration
 * feed.
 *
 * Unlike the prayer feed, this one's shape IS known — it was inspected from a
 * build log rather than guessed:
 *
 *   {
 *     "donations": { "<id>": { "category_name": "…", "link": "https://…" } },
 *     "membership":    { "sign_up": "…", "login": "…" },
 *     "program":       { "registration": "…" },
 *     "fundraiser":    { "tickets": "…", "pledge": "…" },
 *     "bulletinboard": { "link": "…" }
 *   }
 *
 * `donations` is an OBJECT keyed by category id, not an array — ids are not
 * contiguous (the live feed returns 1, 3, 4), so they cannot be treated as
 * indices. Arrays are accepted too, in case MOHID changes that.
 *
 * Only the donation links are read here. The membership, program, fundraiser
 * and bulletin-board links exist in the same payload and can be surfaced
 * later; they are deliberately out of scope for now rather than half-built.
 */

export type DonationCategory = {
  /** MOHID's own category id, used only as a stable React key. */
  id: string;
  name: string;
  url: string;
};

/**
 * Hosts whose links may be rendered as donation buttons.
 *
 * This matters more than it looks. These links are fetched from a third party
 * at runtime and then presented to visitors as the masjid's own way to give
 * money. Without a check, anything that ever appeared in that field — a
 * `javascript:` URL, a look-alike payment domain — would be rendered as a
 * trusted donate button on the masjid's site. An allowlist means the worst a
 * changed feed can do is make the section disappear.
 */
const ALLOWED_HOST = /(^|\.)mohid\.co$/i;

/** Keeps a pathological feed from flooding the page. */
const MAX_CATEGORIES = 24;
const MAX_NAME_LENGTH = 80;

function safeUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    // Relative or malformed: not something to point a donor at.
    return null;
  }

  if (parsed.protocol !== "https:") return null;
  if (!ALLOWED_HOST.test(parsed.hostname)) return null;

  return parsed.toString();
}

function readName(entry: Record<string, unknown>): string | null {
  // `category_name` is what the live feed uses; `name` is accepted because the
  // sibling donationcatagories feed spells it that way.
  const raw = entry.category_name ?? entry.name;
  if (typeof raw !== "string") return null;

  const cleaned = raw.trim().replace(/\s+/g, " ");
  if (!cleaned) return null;

  return cleaned.length > MAX_NAME_LENGTH
    ? `${cleaned.slice(0, MAX_NAME_LENGTH).trimEnd()}…`
    : cleaned;
}

/**
 * Extract donation categories from a MOHID website-integration response.
 *
 * Returns null when nothing usable is present, so the caller can fall back to
 * the offline giving instructions rather than rendering an empty section.
 * Individual malformed entries are dropped; one bad row does not discard the
 * rest.
 */
export function parseDonationLinks(payload: unknown): DonationCategory[] | null {
  let root = payload;

  // The feed is served as text/html and may arrive double-encoded.
  for (let attempt = 0; attempt < 2 && typeof root === "string"; attempt += 1) {
    const text = root;
    try {
      root = JSON.parse(text) as unknown;
    } catch {
      return null;
    }
  }

  if (root === null || typeof root !== "object") return null;

  const donations = (root as Record<string, unknown>).donations;
  if (donations === null || typeof donations !== "object") return null;

  // Object keyed by id, or an array — Object.entries handles both, and for an
  // array the key is the index, which is still a usable React key.
  const entries = Object.entries(donations as Record<string, unknown>);

  const categories: DonationCategory[] = [];
  for (const [id, value] of entries) {
    if (value === null || typeof value !== "object" || Array.isArray(value)) continue;

    const entry = value as Record<string, unknown>;
    const name = readName(entry);
    const url = safeUrl(entry.link ?? entry.url);
    if (!name || !url) continue;

    categories.push({ id, name, url });
    if (categories.length >= MAX_CATEGORIES) break;
  }

  return categories.length > 0 ? categories : null;
}
