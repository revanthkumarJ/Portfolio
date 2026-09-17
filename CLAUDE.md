# Portfolio — working notes

Personal portfolio for Revanth Kumar Jilakara. Vite 6 + React 18 + Tailwind 4 +
Framer Motion + Lenis, deployed on Vercel.

**This repository is PUBLIC** (`revanthkumarJ/Portfolio`). Everything committed here
is visible to anyone. See *Publishing rules* below before adding content that came
from a private source.

## Commands

```bash
npm run dev      # dev server on :5173
npm run build    # production build — this is the only real validation
npm run preview  # serve dist/
```

`src/data/content.js` imports image assets, so plain `node` cannot execute it. Use
`npm run build` to verify changes to it. Data files without image imports (anything
under `src/data/experience/`) can be checked with
`node -e "..." --input-type=module`.

Interactions and animation are verified with `playwright-core` driving the installed
Google Chrome. Plain `chrome --headless` freezes Framer Motion mid-animation —
counters will screenshot at the wrong value.

## Layout

```
src/
  App.jsx                    Routes
  data/content.js            ALL home-page content — identity, experience, nav, links
  data/apps.js               Play Store app case studies (/apps/:slug)
  data/experience/           Company case studies (/experience/:slug)
  data/interview/            /interview_preparation content tree
  sections/                  Home-page sections
  pages/apps/                App case-study page
  pages/experience/          Company case-study page
  ui/primitives.jsx          Reveal, Counter, Chip, Monogram, TiltCard, SectionHeading
  index.css                  Tailwind theme tokens (--color-ink, -violet, -cyan, …)
```

Routes: `/`, `/apps/:slug`, `/experience/:slug`, `/interview_preparation[/:cat/:topic]`.
`vercel.json` rewrites everything to `index.html`, so any new route works without config.

## Experience case studies

Each company has **two** artefacts:

1. **A detailed record** in the private repo `revanthkumarJ/work-records`
   (cloned at `~/work-records`) — the complete, unscrubbed version, written as
   interview preparation that stands alone if repo access is ever lost. Never
   move these into this repository.
2. **A published page** at `/experience/<slug>` — the brief, scrubbed version.

To add one: create `src/data/experience/<company>.js`, register it in
`src/data/experience/index.js`, and add `detailPath: "/experience/<slug>"` to the
matching entry in `content.js`. `ExperienceCaseStudy.jsx` renders it; nothing else
needs changing.

**Several entries can share one page** — both Swipe roles point at `/experience/swipe`,
and both Mifos roles at `/experience/mifos-initiative`.

Current pages:

| Slug | Company | Source repo | Category tables |
|---|---|---|---|
| `swipe` | Swipe (YC S21) | private | Work areas + counts, no PR references |
| `mifos-initiative` | Mifos Initiative | public | Every PR linked, plus Jira ticket |
| `mobile-byte-sensei` | Mobile Byte Sensei | private | None |

### Category tables

`ExperienceCaseStudy.jsx` renders two table shapes from one component, chosen by
whether the rows carry a `url`:

- **PR table** (`entry.prs`) — public repos. Row per pull request, linked, with its
  Jira ticket. Used by Mifos.
- **Work-area table** (`entry.work`) — private repos. Row per theme with a real PR
  count and period, and no reference to any individual PR. Used by Swipe.

Both are collapsed by default. Columns drop from 5 to 3 below `md` so phones do not
scroll sideways.

## Publishing rules

This site is public, and some of the work behind it is not.

**Never publish, for any private company repository:**

- Pull request links, numbers or titles
- Feature-flag names, service, class or module names
- API versioning, endpoint names, payload field names
- Internal architecture specifics (database versions, telemetry detail)
- Exhaustive proprietary screen enumerations — generalise to flow categories
- Third-party partner names

**Do publish** the legitimate signal: engineering activities (tooling, migrations,
optimisation, crash fixes, releases) and user-facing capability (discounts, filters,
barcode scanning, AI features, plan gating). When unsure, leave it out.

### Lead with impact, not pull request counts

For Swipe specifically, **do not publish PR counts anywhere** — not in the stat tiles,
the category headers, the tables, or the home-page card summaries. Raw PR totals read
as busywork rather than achievement. State the outcome instead:

- feature flows rebuilt, legacy flows and flags deleted
- percentage reduction in build boilerplate
- production crashes resolved

Those numbers must still be derived from the real history, not estimated. The Swipe
page's 23 rebuilt flows, for example, counts distinct surfaces named in the migration
work, deliberately conservative where one change covered several of them.

Count **flows, not screens**. A migrated product or settings flow is several screens
plus its sheets and dialogs, so "screens" both undercounts the work and describes it
wrongly.

Mifos is the exception: it is public, the PRs are linkable, and the counts there are
evidence a reader can check.

### Don't narrate what's being withheld

Scrubbing should be invisible. A portfolio page must never tell the reader that a repo
is private, commercially sensitive, that links were omitted, or that a fuller record
exists elsewhere. That language reads as apology, draws attention to the gap and makes
the work sound smaller than it is.

Write the scrubbed version as though it were the only version: state what was built and
what changed, and simply don't include the links. Same for describing products — "an
AI-agent management tool for the engineering team", not "an internal tool".

Public repos (Mifos / openMF) are exempt — link everything there.

Any published number must be derived from real data, not estimated. Where a count is
shown, verify the parts sum to the whole before publishing it.

The `update-swipe-experience` skill automates refreshing the Swipe entry in
`content.js` from the PR history and restates these rules in more detail. It lives at
`~/.claude/skills/update-swipe-experience/`, **deliberately outside this repo** — it
names a private repository and describes the shape of its internal identifiers, so it
must not be committed here.

## Conventions

- Tailwind classes are **written out in full** so the compiler can see them at build
  time. Accent variants live in `ACCENTS` maps rather than being built by
  interpolation — `text-${color}` will not survive the build.
- Colours come from the theme tokens in `index.css`: `ink`, `ink-2`, `surface`, `line`,
  `body`, `bright`, `violet`, `fuchsia`, `cyan`, `emerald`, `amber`.
- `glass`, `glow-card`, `noise`, `blob` and `text-gradient` are utilities in `index.css`.
- Section headings are numbered per page and computed as the page renders, so sections
  can be conditional without renumbering by hand.

## Not automatic

Do not commit, push or deploy unless asked. Do not touch `dist/` by hand — it is
build output, though it is currently tracked.
