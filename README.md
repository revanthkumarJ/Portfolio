# Revanth Kumar Jilakara — Portfolio

Personal portfolio of **Revanth Kumar Jilakara** ([revanthkumarJ](https://github.com/revanthkumarJ)) — SDE 1 · Android Developer at **Swipe (YC S21)**, Kotlin Multiplatform developer, and open-source mentor at the **Mifos Initiative**.

Live on Vercel, deployed from `main`.

> **This README is the content source of truth** — identity, numbers, timeline, projects, testimonial and links.
> **[CLAUDE.md](CLAUDE.md) is the engineering source of truth** — commands, code layout, conventions and the publishing rules.
> Read both before making changes, and update them after.

---

## Stack

Vite 6 · React 18 · Tailwind CSS 4 (`@tailwindcss/vite`, CSS-first config) · Framer Motion · Lenis smooth-scroll · react-router-dom · react-icons · react-pdf. `playwright-core` (dev) drives the installed Chrome for interaction and screenshot checks.

```bash
npm run dev      # :5173
npm run build    # the only real validation — content.js imports images, so plain node can't run it
npm run preview
```

---

## Routes

| Route | What it is |
|---|---|
| `/` | Single-page scroll with a scroll-spy sticky nav |
| `/apps/:slug` | Play Store app case studies — `pockettunes`, `statussaver`, `expensetrackr` |
| `/experience/:slug` | Company case studies — `swipe`, `mifos-initiative`, `mobile-byte-sensei` |
| `/interview_preparation` | Android/Kotlin interview notes — 16 categories, 80 topics |
| `/interview_preparation/:categoryId/:topicId` | A single topic |

`vercel.json` rewrites everything to `index.html`, so new routes need no config.

### Home page section order

Hero → About → **Play Store apps** → **Experience** → **Work** → Writing → Achievements → Testimonial → Why hire me → Contact

Apps come before the writeups deliberately: the first thing after About should be something a visitor can download. Section headings are numbered `01`–`08` and **must be renumbered by hand if the order changes**.

---

## Company case studies

Each company has two artefacts:

1. **A detailed record**, kept in a separate private repository — the long-form version, written as interview preparation that stands on its own. Not in this repo, and it should stay that way.
2. **A published page** at `/experience/:slug` — the short, scrubbed version.

To add one: create `src/data/experience/<company>.js`, register it in `src/data/experience/index.js`, and add `detailPath` to the matching entry in `content.js`. Several entries can share one page — both Swipe roles point at `/experience/swipe`, both Mifos roles at `/experience/mifos-initiative`.

`ExperienceCaseStudy.jsx` renders two table shapes from one component, chosen by whether the rows carry a `url`:

- **Public source repo** (Mifos) — a row per pull request, linked, with its Jira ticket
- **Private source repo** (Swipe) — rows are work areas, with no reference to any individual change

**Publishing rules live in [CLAUDE.md](CLAUDE.md)** and are not optional. In short: never publish pull request links, numbers or titles, internal identifiers, API versioning or partner names from a private repository; lead with impact rather than PR counts; and never narrate what is being withheld. Public repos are exempt — link everything there.

---

## Owner content (source of truth)

### Identity

- **Name:** Revanth Kumar Jilakara · **Monogram:** RJ
- **Headline:** *"I build production Android & Kotlin Multiplatform apps used by thousands of businesses."*
- **Subline:** SDE 1 @ Swipe (YC S21) · Mifos open-source mentor
- Andhra Pradesh, India. B.Tech CSE, RGUKT RK Valley. Qualified **GATE CS 2025**.
- Status: **open to opportunities** — show prominently.

### Numbers (re-verified 2026-09-17 from the GitHub API)

| Metric | Verified value |
|---|---|
| Merged PRs in the Mifos org (`openMF`) | **111** of 123 authored |
| PRs reviewed in `openMF` | **365** |
| PRs reviewed across all orgs | 534 |
| Merged PRs across all non-personal repos | 593 of 665 authored |
| Merge rate (all non-personal repos) | **~89%** |
| DSA | 1000+ problems · LeetCode Knight · GFG institute rank 1 · CodeChef 3★ · HackerRank 5★ |

> ⚠️ **The hero stat strip in `content.js` currently claims a 98% merge rate.** The measured figure is ~89–90% however it is sliced. It also says "300+ contributor PRs reviewed", which is understated — `openMF` alone is 365. Both are worth correcting.

Counts that reach the site must be **derived from real data, not estimated**, and where a total is shown its parts should sum to it.

### Experience timeline

| Role | Org | Period |
|---|---|---|
| SDE 1 – Android Developer | Swipe (YC S21) | Jun 15, 2026 – Present |
| Android Developer Intern | Swipe (YC S21) | Dec 2025 – Jun 14, 2026 |
| Mentor (GSoC / C4GT interviews, PR reviews, standups) | Mifos Initiative | Mar 2026 – Present |
| Open Source Mobile Developer | Mifos Initiative | Nov 2024 – Present |
| Mifos Summer of Code 2025 Intern ($2,500 stipend) | Mifos Initiative | Jun 2025 – Sep 2025 |
| Mobile Development Intern (KMP & CMP) | Mobile Byte Sensei | Apr 2025 – Nov 2025 |
| Software Development Intern | TLDE Technologies | Nov 2025 – Dec 2025 |
| Frontend Team Lead + Social Media | Abhiyanth 2K25 | Dec 2024 – Mar 2025 |
| Open Source Contributor – React | DevDisplay | Jan 2025 – Feb 2025 |
| Campus Ambassador | GeeksforGeeks | Apr 2024 – Apr 2025 |

Leadership/volunteer: SRC DSA Coordinator & Mentor, Dept. Social Media Manager, NSS Unit Coordinator, Class Representative.

### Featured projects

1. **ExpenseTrackr** *(flagship)* — privacy-first, offline personal finance tracker. KMP + CMP, one codebase → Android, iOS, Desktop. MVI, 16 Gradle modules, 18 screens, 24 languages, Room (KMP), Koin, DataStore, convention plugins, R8, PIN + biometric lock, CSV backup, Material 3 dynamic color. MIT. — [GitHub](https://github.com/revanthkumarJ/ExpenseTrackr) · Play Store link is a **commented-out placeholder** in the data; uncomment when public.
2. **Mifos Mobile KMP migration** — [GitHub](https://github.com/openMF/mifos-mobile) · [Play Store](https://play.google.com/store/apps/details?id=org.mifos.mobile)
3. **Field Officer App KMP migration** — production banking app, my MSoC 2025 project. Repo was renamed from `android-client` to [`mifos-x-field-officer-app`](https://github.com/openMF/mifos-x-field-officer-app) · [Play Store](https://play.google.com/store/apps/details?id=com.mifos.mifosxdroid)
4. **Abhiyanth Fest website** — frontend team lead; React, Redux, Firebase, Material UI, CashFree. [GitHub](https://github.com/revanthkumarJ/abhiyanth-client)

Compact grid: Meme Studio, Swipe assignment app, KisanConnect, Finance client+API, Sports Auction, Departmental Resource Management, Instagram/Netflix UI clones.

### Testimonial (approved)

From **Rajan Maurya** — *Engineering Manager | Kotlin Multiplatform Expert*:

> "I highly recommend Jilakara Revanth Kumar as a Kotlin Multiplatform Developer who consistently delivers high-quality, scalable solutions. […] One of his standout strengths is his debugging ability — he has a sharp eye for identifying complex issues and resolving them with clarity and precision."

Full text lives in `content.js`. Proof: [LinkedIn recommendations](https://www.linkedin.com/in/jilakararevanthkumar/details/recommendations/)

### Contact

Email <jrevanth101@gmail.com> · [LinkedIn](https://www.linkedin.com/in/jilakararevanthkumar/) · [GitHub](https://github.com/revanthkumarJ) · [Instagram](https://www.instagram.com/revanth_kumar_j) · **no Twitter/X**. Resume PDF in `src/Assets/`.

---

## Placeholder images

The site still ships some placeholder imagery. Every slot is a single entry in a data file, marked with a 🖼️ comment — keep it that way and never bury image paths in components. `ImageSlot` renders a labelled placeholder when `src` is `null`.

Real assets wanted: high-res personal photo, Compose screens, before/after migration shots, device-framed mockups.

---

## For future editors (human or AI)

1. Read this file and [CLAUDE.md](CLAUDE.md) before changing anything.
2. The content facts above are user-confirmed. Don't "fix" them from older code — the old code is outdated.
3. Numbers must be derived from real data. If you can't verify it, don't publish it.
4. Follow the publishing rules for anything sourced from a private repository.
5. `npm run build` is the validation step. Verify interactions with `playwright-core` against real Chrome — plain `chrome --headless` freezes Framer Motion mid-animation and screenshots counters at the wrong value.
6. Update the "Codebase status" date stamps and these docs after major changes.

**Last updated:** 2026-09-17 — added `/experience/:slug` case studies, reordered the home page to lead with apps, re-verified the contribution numbers.
