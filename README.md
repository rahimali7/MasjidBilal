# Masjid Bilal Islamic Center — Website

The website for Masjid Bilal Islamic Center in Louisville, Kentucky.

Built with **Next.js 16** (App Router), **Tailwind CSS v4**, and **Motion**
for animation. Every page is statically generated, so the site is fast and
cheap to host.

## Running it locally

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run lint       # eslint
npm run typecheck  # next typegen && tsc --noEmit
```

`typecheck` runs `next typegen` first on purpose: `LayoutProps` and friends are
*generated* types, so `tsc` fails on a clean checkout without it.

Note that Next 16 removed `next lint`, and `next build` no longer runs linting
— so lint is genuinely a separate step, not a redundant one.

## Continuous integration

`.github/workflows/ci.yml` runs typecheck, lint, and build on every pull
request and on pushes to `main`. All three must pass.

## Brand

The colour palette is sampled directly from the masjid's logo artwork:

| Token | Hex | Where it comes from |
| --- | --- | --- |
| `navy-800` | `#001E42` | Emblem outline and wordmark |
| `crimson-700` | `#7D0223` | Star points and the rule under the wordmark |
| `gold-400` | `#D4A75F` | Inner frame and crescent |
| `sand-50` | `#FCFAF5` | Page background |

Typography: **Playfair Display** (display headings), **Inter** (body and UI),
**Cinzel** (small-caps eyebrows and the logo lockup, matching the wordmark),
and **Amiri** (Arabic and Qur'anic text).

Logo files live in `public/brand/`.

## Deploying and updating

See **[DEPLOYING.md](DEPLOYING.md)** for how to put the site online for free
and how to update events and other content from github.com without installing
anything.

## Editing content

Everything a non-developer would want to change lives in `src/data/`. No
component code needs to be touched.

| File | What it controls |
| --- | --- |
| `site.ts` | Name, contact details, Zelle number, locations, navigation |
| — | Set `featured: true` on a location to list it in the footer, contact page and search-engine data. Both masjids always appear in the history. |
| `prayer.ts` | Prayer-time embed URL, fallback table, Jumu'ah times |
| `programs.ts` | Classes and programs |
| `events.ts` | Upcoming events (past ones move to the archive automatically) |
| `services.ts` | Nikah, janazah, shahada, counseling |
| `leadership.ts` | Imams, board, committees |
| `timeline.ts` | The masjid's history (drives the animated timeline) |
| `verses.json` | Qur'anic verses used across the site |
| `faq.ts` | Questions the assistant answers, and the FAQ page |

### Prayer times

Three sources, in order of precedence:

1. **MOHID** — the masjid's own published feed, including iqamah times. Read
   server-side by `/api/prayer-times` (a browser fetch would be blocked by
   CORS) and cached for 15 minutes.
2. **Calculated** — if MOHID does not answer or returns something the parser
   does not recognise, times are computed with `adhan` for the masjid's
   coordinates. Always correct, but without the masjid's iqamah.
3. **Masjidal widget** — overrides everything when `embedHtml` is set.

The MOHID parser rejects any response it cannot fully read rather than showing
a partial or guessed time. See the note at the top of `src/lib/mohid.ts`.

Masjidal remains available as an override:

1. **Widget library** — already wired. `MasjidalWidget.tsx` loads
   `widgets.masjidal.com/timetable/v0/widget.js` on the prayer-times page
   only, so other pages don't pay for a third-party script.
2. **Widget markup** — publish a widget in the Masjidal platform, press
   **Embed**, and paste the markup into `embedHtml` in `src/data/prayer.ts`.

Until step 2 is done, the page shows the manually maintained table in the same
file, so it is never empty.

`embedHtml` is injected as raw HTML. That is safe *because it comes from a
repository file only developers can edit* — never wire that field to user
input, request data, or a URL parameter.

### Environment variables

Copy `.env.example` to `.env.local` (gitignored) and fill in, or set the values
in your host's environment settings.

⚠️ **This repository is public.** Never commit an API key or secret to it.
Anything prefixed `NEXT_PUBLIC_` is inlined into the browser bundle at build
time and is visible to every visitor — correct for a publishable widget key,
wrong for a secret one. A secret must be read server-side only, without that
prefix.

### Qur'anic verses

Arabic text is the Uthmani script from
[The Noble Qur'an Encyclopedia](https://quranenc.com), obtained through the
`quran-json` package (CC BY 4.0) — **not** transcribed by hand, so the
diacritics are correct.

⚠️ The English translation shipped with that dataset does not name its
translator. The wording matches Sahih International, but this is
**unconfirmed**. Have the imam verify the attribution and approve every verse
before launch. See `_source` at the top of `src/data/verses.json`.

## Before launch

Items marked `NEEDS-CONFIRMATION`, `PLACEHOLDER`, or `TODO` in `src/data/`
must be resolved first. The significant ones:

- [ ] Publish the Masjidal widget and paste its embed markup into `prayer.ts`
- [ ] Real Jumu'ah khutbah and prayer times
- [ ] Real leadership names, roles, and biographies
- [ ] Confirm 501(c)(3) status before making any tax-deductibility claim
- [ ] Verify Qur'an translation attribution
- [ ] Photography (see below)
- [ ] Point the production domain at the deployment and update `site.url`

## Photography

The site currently uses geometric panels built from the logo's eight-pointed
star wherever a photo belongs. They look deliberate rather than empty, but
real photography is the single biggest upgrade available to this design.

To add photos: drop files in `public/img/` and pass `src` to `<ImagePanel />`.

## Accessibility

Every animation is wrapped so that visitors who have asked their operating
system to reduce motion get a still site — both in CSS and in JavaScript.
Colour pairings, focus rings, and a skip link are built in.
