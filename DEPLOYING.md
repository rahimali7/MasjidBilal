# Deploying and updating the site

Two separate things, and the second is the one you'll do often:

1. **Deploy once** — connect the repo to a host. After that it is automatic.
2. **See and test it** — Vercel gives every branch its own preview URL.
3. **Update content** — edit a file on GitHub. The site rebuilds itself.

---

## 1. Deploying (one-time setup)

### Recommended: Vercel

Vercel is built by the same team as Next.js, so there is nothing to configure.

1. Go to [vercel.com](https://vercel.com) and **Sign up with GitHub**.
2. Authorize Vercel. You can grant access to **only this repository** rather
   than all of them — pick "Only select repositories".
3. **Add New → Project**, choose this repository, press **Deploy**.
4. Vercel detects Next.js on its own. Do not change the build settings.

That's it. You get a URL like `masjid-bilal.vercel.app` in about a minute.

**Yes, GitHub needs to be connected.** That connection is what makes updates
automatic: every time the repository changes, Vercel rebuilds and publishes.
Without it you would have to upload files by hand each time.

#### Environment variables

If a value is ever needed (such as the Masjidal API key), add it under
**Project → Settings → Environment Variables**, not in a file. See
`.env.example`.

#### Custom domain

**Project → Settings → Domains**, add `bilalislamiccenter.org`, then set the
DNS records Vercel gives you at whoever the domain is registered with. HTTPS is
issued automatically and free.

#### One thing to check before relying on the free tier

Vercel's free plan is called **Hobby**, and its terms describe it as being for
personal, non-commercial use. Plenty of small nonprofits run on it, but a
masjid is an organization rather than a personal project, so this is worth
reading rather than assuming. Vercel does have a nonprofit/open-source
program — worth asking them directly.

I could not verify Vercel's current terms from this environment, so please
confirm on their pricing page rather than taking this as settled.

### Alternatives, all genuinely free

Every page of this site is prerendered — there is no server-side code at
runtime — so it can also be exported as plain static files and hosted almost
anywhere. Verified working with:

```ts
// next.config.ts
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
};
```

Then `npm run build` writes a complete site to `out/`.

| Host | Notes |
| --- | --- |
| **Cloudflare Pages** | Generous free tier with no non-commercial restriction. Connects to GitHub the same way. |
| **Netlify** | Free tier, GitHub integration, very similar to Vercel. |
| **GitHub Pages** | Free, already where the code lives. Needs the static export above plus a small Actions workflow. |

Two trade-offs with static export. `next/image` optimization is turned off
(`unoptimized: true`), so images are served at full size. And the
`/api/prayer-times` route cannot run, so the prayer page falls back to its
calculated times instead of the masjid's published MOHID times — accurate,
but without the masjid's own iqamah. That matters
once real photography is added — not while the site uses the geometric
placeholder panels.

**Recommendation:** start on Vercel. It is the least work and the best fit for
Next.js. If the Hobby terms turn out to be a problem, Cloudflare Pages is the
strongest free alternative and moving is a small change.

---

## 2. Seeing and testing the site

### The easy way: Vercel preview links

Once the repo is connected to Vercel (step 1 above), Vercel builds **every
branch and every pull request automatically** and gives each one its own URL.

That means PR #1 gets a live preview link posted right on the pull request, and
every time you edit a file the preview updates. Nothing to install, and it is
the real site — the same build that would go live.

This is also the safest way to check a content change before it reaches
visitors: edit on a branch, look at the preview, then merge.

### The local way: run it on your own computer

Only needed if you want to work offline or make code changes.

1. Install [Node.js](https://nodejs.org) version 20 or newer (the LTS build).
2. Download the code — on the repo page, **Code → Download ZIP**, or if you
   use git: `git clone https://github.com/rahimali7/masjidbilal.git`
3. In a terminal, inside the project folder:

```bash
npm install     # first time only, takes a minute
npm run dev
```

4. Open <http://localhost:3000>.

Edits to files under `src/data/` appear in the browser immediately.

To check exactly what visitors would get, build the production version instead:

```bash
npm run build
npm run start   # then open http://localhost:3000
```

### What to click through

The automated checks catch broken code, not wrong content. These are the things
worth a human eye:

- [ ] Every link in the top navigation opens the right page
- [ ] **Donate** — pick an amount, switch to Monthly, choose a fund; the Zelle
      number, recipient and memo update, and both **Copy** buttons work
- [ ] The phone number opens the dialer and the email address opens mail
- [ ] **Contact** — "Open in Maps" lands on the right building
- [ ] **About** — scroll slowly; the gold line should fill and each milestone
      light up as you reach it
- [ ] On a phone: the menu button opens and closes, and nothing is cut off at
      the right edge
- [ ] **Prayer Times** shows the fallback table — expected until the Masjidal
      embed markup is added

### What has already been verified

Against a production build in a real browser:

- All 8 pages load with no JavaScript or console errors
- Nothing overflows sideways at 320, 390, 768, 1024, 1440 or 1920px wide
- The same holds with the operating system set to "reduce motion"
- Typecheck, lint and build all pass from a clean install

That says the site *works*. It does not say the content is *right* — the
placeholder programs, Jumu'ah times and leadership names still need real
values, and no automated check can know that.

### Reading the automated check

Every commit gets a mark on GitHub:

- **Green ✓** — the site builds and will deploy.
- **Red ✗** — something is broken. Click it to see which step failed. The
  currently published site is unaffected and stays up.

A green check means the code is valid. It does not mean a prayer time is
correct.

---

## 3. Updating content

**You do not need to install anything.** Everything editable lives in
`src/data/`, and GitHub lets you edit files in the browser.

### The routine

1. Go to the repository on github.com.
2. Open `src/data/` and click the file you want (see the table below).
3. Click the **pencil icon** (Edit this file).
4. Make your change.
5. Scroll down, write a short note like "Added October iftar", and click
   **Commit changes**.

Vercel rebuilds automatically. The live site updates in roughly a minute.

### Which file to edit

| To change… | Edit |
| --- | --- |
| Events | `src/data/events.ts` |
| Programs and classes | `src/data/programs.ts` |
| Prayer times / Jumu'ah | `src/data/prayer.ts` |
| Imams, board, committees | `src/data/leadership.ts` |
| Phone, email, addresses, Zelle number | `src/data/site.ts` |
| Nikah, janazah, counseling | `src/data/services.ts` |
| The history timeline | `src/data/timeline.ts` |
| Qur'an verses used on the site | `src/data/verses.json` |

### Example: adding an event

In `src/data/events.ts`, copy an existing block and change the values:

```ts
  {
    slug: "eid-al-fitr-prayer",          // short id, lowercase, dashes only
    title: "Eid al-Fitr Prayer",
    date: "2027-03-20",                  // ALWAYS YYYY-MM-DD
    time: "8:00 AM",                     // free text
    category: "Community",               // Community | Youth | Education | Fundraising
    location: "Main Hall — Masjid Bilal South Side",
    summary: "Eid prayer followed by breakfast. All families welcome.",
  },
```

Keep the comma at the end of the block. Past events drop off the upcoming
list and move to the archive on their own — you do not need to delete them.

### Rules that will save you a broken build

- Keep the **quotes** around text and the **commas** between entries.
- If text contains an apostrophe, either use a curly `'` or escape it: `\'`.
- Dates must be `YYYY-MM-DD`. `2027-03-20`, not `March 20`.
- `category` must be one of the four listed above, spelled exactly.

If you get it wrong, **nothing breaks on the live site.** The CI check fails,
GitHub shows a red ✗ on your commit, and the currently published version stays
up until it is fixed. That safety net is the reason the check exists.

### If this becomes a chore

If several people end up updating the site regularly, a proper CMS (a login
and a form, no code at all) is worth adding. Sanity has a free tier that suits
a masjid's volume. Ask, and it can be wired into these same files.
