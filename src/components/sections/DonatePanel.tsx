"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { CopyButton } from "@/components/ui/CopyButton";
import { Diamond } from "@/components/ui/StarFrame";
import { donations } from "@/data/site";
import { useMohidDonations } from "@/lib/useMohidDonations";
import { cn } from "@/lib/cn";

const TIERS = [25, 50, 100, 250, 500, 1000];

/**
 * Designations offered when MOHID's category feed is unavailable.
 *
 * Deliberately generic. An earlier version of this list named specific funds
 * ("Masjid Maintenance", "Youth Programs", …) that were placeholders rather
 * than the masjid's actual funds — MOHID reports three categories, not six.
 * When the feed answers, its categories replace this entirely; this is only
 * the fallback, so it names nothing the masjid would not recognise.
 */
const FALLBACK_FUNDS = ["General donation", "Zakat", "Sadaqah"] as const;

/** "a, b and c" — Intl handles the comma and conjunction placement. */
function formatList(items: readonly string[]): string {
  return new Intl.ListFormat("en", { style: "long", type: "conjunction" }).format(items);
}

/**
 * Builds a Zelle payment instruction from the visitor's selections.
 *
 * Zelle has no public payment-request URL scheme, so this cannot hand off to
 * the bank app directly — it prepares the exact details to enter instead.
 * When a card processor is added later, this panel is where it plugs in.
 */
export function DonatePanel() {
  const [amount, setAmount] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const [frequency, setFrequency] = useState<"one-time" | "monthly">("one-time");
  const [fund, setFund] = useState<string | null>(null);

  const online = useMohidDonations();

  // The masjid's own categories when MOHID answers, generic ones otherwise.
  const fundOptions: readonly string[] =
    online.status === "ready" ? online.categories.map((c) => c.name) : FALLBACK_FUNDS;

  /**
   * Whether the categories are genuinely separate destinations.
   *
   * MOHID currently returns the same donation URL for every category — it
   * names the funds without deep-linking to them. Rendering three buttons
   * that all land on the same page would imply a choice the links do not
   * actually make, and that matters most for the one category where it is not
   * merely cosmetic: someone choosing Zakah expects their gift designated as
   * zakat. One honest button, with the funds named as text, beats three
   * buttons making a promise the URLs do not keep.
   *
   * If MOHID starts returning per-category links, the separate buttons come
   * back on their own.
   */
  const distinctUrls =
    online.status === "ready" ? new Set(online.categories.map((c) => c.url)).size : 0;
  const linksAreDistinct = distinctUrls > 1;

  // The list can change under the selection when the feed resolves, so never
  // trust the stored value on its own — fall back to the first live option.
  const activeFund = fund !== null && fundOptions.includes(fund) ? fund : fundOptions[0];

  const customValue = Number.parseFloat(custom);
  const effective =
    custom.trim() !== "" && Number.isFinite(customValue) && customValue > 0
      ? customValue
      : amount;

  const ready = effective !== null && effective > 0;
  const formatted = ready
    ? effective.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: effective % 1 === 0 ? 0 : 2,
      })
    : null;

  const memo = `${activeFund}${frequency === "monthly" ? " — monthly" : ""}`;

  return (
    <div className="rounded-2xl border border-navy-800/10 bg-white p-8 shadow-[0_1px_2px_rgba(0,30,66,0.04),0_24px_60px_-40px_rgba(0,30,66,0.45)] sm:p-10">
      <p className="eyebrow">Make a donation</p>

      {/* Online giving, when the masjid's MOHID portal reports categories.
          Rendered only once the feed has answered: nothing is shown while
          loading or on failure, so a visitor never sees a dead donate button
          or an empty section. */}
      <AnimatePresence>
        {online.status === "ready" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-7">
              <p className="text-sm leading-relaxed text-muted">
                Give online through the masjid&rsquo;s secure MOHID portal.
                {!linksAreDistinct && (
                  <>
                    {" "}
                    You can choose your fund — {formatList(fundOptions)} — on
                    the donation page.
                  </>
                )}
              </p>

              {linksAreDistinct ? (
                <ul className="mt-4 space-y-3">
                  {online.categories.map((category) => (
                    <li key={category.id}>
                      <a
                        href={category.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between gap-4 rounded-xl border border-navy-800/15 px-5 py-4 text-navy-800 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-gold-500 hover:bg-gold-400/10"
                      >
                        <span className="min-w-0 truncate font-display text-lg">
                          {category.name}
                        </span>
                        <ArrowUpRight
                          aria-hidden
                          className="h-4 w-4 shrink-0 text-muted transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gold-600"
                        />
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <a
                  href={online.categories[0].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group mt-4 flex items-center justify-center gap-2.5 rounded-xl bg-navy-800 px-6 py-4 font-sans text-sm font-medium tracking-wide text-sand-50 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-navy-700 hover:shadow-lg hover:shadow-navy-900/15 active:scale-[0.98]"
                >
                  Give online
                  <ArrowUpRight
                    aria-hidden
                    className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </a>
              )}

              <div className="mt-8 flex items-center gap-4">
                <span className="h-px flex-1 bg-navy-800/10" />
                <span className="eyebrow text-muted/70">or give by Zelle</span>
                <span className="h-px flex-1 bg-navy-800/10" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Amount tiers */}
      <fieldset className="mt-7">
        <legend className="sr-only">Choose an amount</legend>
        <div className="grid grid-cols-3 gap-3">
          {TIERS.map((tier) => {
            const selected = amount === tier && custom.trim() === "";
            return (
              <button
                key={tier}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  setAmount(tier);
                  setCustom("");
                }}
                className={cn(
                  "h-14 rounded-xl border font-display text-xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  selected
                    ? "border-gold-500 bg-gold-400/15 text-navy-800"
                    : "border-navy-800/15 text-navy-800/80 hover:border-navy-800/40 hover:bg-sand-50",
                )}
              >
                ${tier}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Custom amount */}
      <div className="mt-4">
        <label htmlFor="custom-amount" className="sr-only">
          Custom amount in US dollars
        </label>
        <div className="relative">
          <span
            aria-hidden
            className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-muted"
          >
            $
          </span>
          <input
            id="custom-amount"
            type="number"
            inputMode="decimal"
            min="1"
            step="1"
            placeholder="Custom amount"
            value={custom}
            onChange={(e) => {
              setCustom(e.target.value);
              if (e.target.value.trim() !== "") setAmount(null);
            }}
            className="h-14 w-full rounded-xl border border-navy-800/15 bg-transparent pl-10 pr-5 text-navy-800 outline-none transition-colors placeholder:text-muted/60 focus:border-gold-500"
          />
        </div>
      </div>

      {/* Frequency */}
      <fieldset className="mt-4">
        <legend className="sr-only">Giving frequency</legend>
        <div className="grid grid-cols-2 gap-3">
          {(["one-time", "monthly"] as const).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={frequency === f}
              onClick={() => setFrequency(f)}
              className={cn(
                "h-13 rounded-xl border py-4 text-sm transition-all duration-300",
                frequency === f
                  ? "border-gold-500 bg-gold-400/15 text-navy-800"
                  : "border-navy-800/15 text-navy-800/70 hover:border-navy-800/40",
              )}
            >
              {f === "one-time" ? "One-time" : "Monthly"}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Designation */}
      <div className="mt-7">
        <label
          htmlFor="fund"
          className="eyebrow block"
        >
          Designate your gift
        </label>
        <select
          id="fund"
          value={activeFund}
          onChange={(e) => setFund(e.target.value)}
          // min-w-0 matters: a <select> is sized by its longest option, which
          // would otherwise force the whole grid wider than a small viewport.
          className="mt-3 h-14 w-full min-w-0 rounded-xl border border-navy-800/15 bg-transparent px-5 text-navy-800 outline-none transition-colors focus:border-gold-500"
        >
          {fundOptions.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>

      {/* Zelle instructions */}
      <div className="mt-8 rounded-xl bg-navy-800 p-7 text-sand-50">
        <div className="flex items-center gap-2.5">
          <Diamond className="h-1.5 w-1.5 text-gold-400" />
          <p className="eyebrow text-gold-300">Send with Zelle</p>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-sand-200/85">
          Open your banking app, choose Zelle, and send
          {formatted ? (
            <>
              {" "}
              <span className="font-display text-lg text-gold-300">
                {formatted}
              </span>
            </>
          ) : (
            " your gift"
          )}{" "}
          to the number below.
        </p>

        <div className="mt-6 space-y-4">
          <Row
            label="Zelle number"
            value={donations.zelle.phone}
            copyValue={donations.zelle.raw}
          />
          <Row label="Recipient" value={donations.zelle.recipientName} />
          <Row label="Memo" value={memo} copyValue={memo} />
        </div>

        <AnimatePresence>
          {frequency === "monthly" && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden text-sm leading-relaxed text-sand-200/70"
            >
              <span className="mt-5 block">
                For monthly giving, set up a recurring Zelle payment in your
                banking app — most banks offer this under &ldquo;repeat&rdquo;
                or &ldquo;recurring&rdquo; payments.
              </span>
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <p className="mt-6 text-xs leading-relaxed text-muted">
        Zelle transfers go directly between banks and are not reversible, so
        please double-check the number before sending.
        {/* Only promise other methods when online giving is NOT on the page.
            "Card coming soon" directly beneath a working online donation
            button reads as a mistake. */}
        {online.status !== "ready" &&
          ` More payment options are coming soon: ${donations.comingSoon.join(", ")}.`}
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  copyValue,
}: {
  label: string;
  value: string;
  copyValue?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-sand-50/10 pb-4 last:border-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-[0.6875rem] uppercase tracking-[0.18em] text-sand-200/50">
          {label}
        </p>
        <p className="mt-1.5 truncate font-display text-lg text-sand-50">
          {value}
        </p>
      </div>
      {copyValue && (
        <CopyButton
          value={copyValue}
          className="shrink-0 border-sand-50/25 text-sand-50 hover:border-sand-50/60 hover:bg-sand-50/10"
        />
      )}
    </div>
  );
}
