import { NextResponse } from "next/server";
import { describeShape, parseMohid } from "@/lib/mohid";
import { mohid } from "@/data/prayer";

/**
 * Server-side proxy for the masjid's MOHID prayer-time feed.
 *
 * Fetched here rather than from the browser for two reasons: a third-party
 * feed will not usually send CORS headers a browser accepts, and going
 * through our own origin lets the response be cached so MOHID is not hit once
 * per visitor.
 *
 * Always responds 200. A failure is reported in the body as
 * `{ ok: false }` so the page can quietly fall back to calculated times
 * rather than treating it as a broken request.
 */
export const revalidate = 900; // re-fetch at most every 15 minutes

export async function GET() {
  if (!mohid.feedUrl) {
    return NextResponse.json({ ok: false, reason: "not-configured" });
  }

  try {
    const response = await fetch(mohid.feedUrl, {
      headers: { Accept: "application/json, text/plain, */*" },
      next: { revalidate },
    });

    if (!response.ok) {
      return NextResponse.json({ ok: false, reason: `upstream-${response.status}` });
    }

    // The feed may label itself text/plain; read as text and let the parser
    // deal with it rather than trusting the content type.
    const body = await response.text();
    const parsed = parseMohid(body);
    if (!parsed) {
      // Log the SHAPE, with values masked, so a feed we failed to read can be
      // diagnosed from the server log. The response body stays deliberately
      // terse — nothing about the upstream payload is exposed to the browser.
      console.warn(
        `[prayer-times] MOHID responded but no mapping matched. Shape:\n${describeShape(body)}`,
      );
      return NextResponse.json({ ok: false, reason: "unrecognised-shape" });
    }

    return NextResponse.json({ ok: true, ...parsed });
  } catch {
    return NextResponse.json({ ok: false, reason: "fetch-failed" });
  }
}
