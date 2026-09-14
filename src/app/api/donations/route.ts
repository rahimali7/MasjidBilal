import { NextResponse } from "next/server";
import { describeShape } from "@/lib/mohid";
import { parseDonationLinks } from "@/lib/mohidDonations";
import { donations } from "@/data/site";

/**
 * Server-side proxy for the masjid's MOHID donation categories.
 *
 * Same reasoning as /api/prayer-times: a third-party feed will not usually
 * send CORS headers a browser accepts, and going through our own origin means
 * MOHID is hit once per revalidation window rather than once per visitor.
 *
 * Always responds 200, reporting failure in the body, so the donate page can
 * fall back to the offline giving instructions instead of showing an error to
 * someone trying to give.
 */
export const revalidate = 900; // re-fetch at most every 15 minutes

export async function GET() {
  if (!donations.integrationUrl) {
    return NextResponse.json({ ok: false, reason: "not-configured" });
  }

  try {
    const response = await fetch(donations.integrationUrl, {
      headers: { Accept: "application/json, text/plain, */*" },
      next: { revalidate },
    });

    if (!response.ok) {
      return NextResponse.json({ ok: false, reason: `upstream-${response.status}` });
    }

    // Served as text/html despite being JSON, so read as text and parse.
    const body = await response.text();
    const categories = parseDonationLinks(body);

    if (!categories) {
      // Shape only, values masked, to the server log — see describeShape.
      console.warn(
        `[donations] MOHID responded but no usable categories were found. Shape:\n${describeShape(body)}`,
      );
      return NextResponse.json({ ok: false, reason: "no-categories" });
    }

    return NextResponse.json({ ok: true, categories });
  } catch {
    return NextResponse.json({ ok: false, reason: "fetch-failed" });
  }
}
