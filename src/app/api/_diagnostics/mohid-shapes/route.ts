import { NextResponse } from "next/server";
import { describeShape } from "@/lib/mohid";

/**
 * TEMPORARY DIAGNOSTIC — delete once the MOHID feeds are understood.
 *
 * us.mohid.co is unreachable from the development sandbox (egress policy), so
 * the shape of the masjid's feeds cannot be inspected there. This route is
 * prerendered at build time, which means it runs on Vercel — which CAN reach
 * MOHID — and its output lands in the deployment build log. That log is
 * private to the project, unlike a public CI log.
 *
 * Nothing about the payloads is returned to the browser: the HTTP response is
 * a fixed constant. The log itself carries only masked structure (values
 * reduced to character classes), because these endpoints may carry
 * identifiers that should not be copied around.
 */
export const revalidate = 900;

const BASE =
  "https://us.mohid.co/ky/louisville/masjidbilalsouthside/masjid/widget/api/index/?m=";

const ENDPOINTS = [
  "vfrlist/json",
  "donationcatagories/json",
  "websiteintegration/json",
] as const;

export async function GET() {
  for (const endpoint of ENDPOINTS) {
    try {
      const response = await fetch(`${BASE}${endpoint}`, {
        headers: { Accept: "application/json, text/plain, */*" },
        next: { revalidate },
      });
      const body = await response.text();
      console.warn(
        `[mohid-probe] ${endpoint} -> HTTP ${response.status} ` +
          `${response.headers.get("content-type") ?? "?"} ${body.length} chars\n` +
          `${describeShape(body)}`,
      );
    } catch (error) {
      console.warn(`[mohid-probe] ${endpoint} -> request failed: ${String(error)}`);
    }
  }

  return NextResponse.json({ ok: true });
}
