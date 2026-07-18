# Revanth Kumar Jilakara — Portfolio

Personal portfolio of **Revanth Kumar Jilakara** (GitHub: [revanthkumarJ](https://github.com/revanthkumarJ)) — SDE 1 · Android Developer at **Swipe (YC S21)**, Kotlin Multiplatform specialist, and open-source mentor at the **Mifos Initiative**.

> **⚠️ This README is the single source of truth for the project's context, content, and design decisions.**
> If you (human or AI assistant) are editing this project in the future, read this file first and keep it updated after major changes.

---

## 🎯 Project Goal

Rebuild this portfolio from a generic template into a **top-tier, awwwards-level developer portfolio**. Decisions were finalized on **2026-07-18**.

### Locked design decisions

| Decision | Choice |
|---|---|
| Approach | **Full modern rebuild** — replace the old CRA + react-bootstrap + tsparticles template entirely |
| Target stack | **Vite + React 18 + Tailwind CSS + Framer Motion** (+ Lenis smooth-scroll) |
| Aesthetic | **Bold / expressive dark** — gradients, glow, depth, cinematic motion, 3D tilt cards, animated counters |
| Structure | **Single-page scroll**: Hero → About → Experience → Projects → Achievements → Contact, with scroll-spy sticky nav |
| Quality bar | Awwwards-tier (Bruno Simon / Brittany Chiang level) |
| Deploy | Vercel (existing pipeline; old site stays live until new one is ready) |
| Logo | Custom **"RJ" monogram**, designed in-house |
| Domain | No custom domain for now |

### Section blueprint

- **Hero** — kinetic typography, gradient mesh/glow background (no tsparticles), magnetic CTAs, live stat ticker (120+ PRs · 98% merge · 230+ reviewed)
- **About** — split editorial layout, count-up stat counters on scroll, interactive tech-stack display
- **Experience** — scroll-driven vertical timeline with a progress line that draws as you scroll; slide-in detail panels
- **Projects** — 4 large cinematic featured cards + compact grid for the rest; 3D tilt + glow-on-hover; **Play Store links on every published app**
- **Achievements** — trophy wall with staggered reveals; coding profiles as badges
- **Contact** — bold closing statement, oversized email link, socials, "open to opportunities" status
- **Global** — page-load reveal sequence, custom cursor accent, 90+ Lighthouse target, full mobile polish, OG image

---

## 👤 Owner Content (source of truth)

### Identity

- **Name:** Revanth Kumar Jilakara (Jilakara Revanth Kumar)
- **Hero one-liner (chosen):** *"I build production Android & Kotlin Multiplatform apps used by thousands of businesses."*
- **Sub-line:** SDE 1 @ Swipe (YC S21) · Mifos open-source mentor
- From Andhra Pradesh, India. B.Tech CSE, RGUKT RK Valley. Qualified **GATE CS 2025**.

### Key numbers (verified 2026-07-18)

- **120+ merged open-source PRs** (older copies of the site said 110+ — outdated)
- **98% PR merge rate**
- **230+ contributor PRs reviewed**
- 1000+ DSA problems · LeetCode Knight · GFG institute rank 1 · CodeChef 3★ · HackerRank 5★

### Experience timeline (corrected dates)

| Role | Org | Period |
|---|---|---|
| SDE 1 – Android Developer | Swipe (YC S21) | **Jun 15, 2026 – Present** |
| Android Developer Intern | Swipe (YC S21) | Dec 2025 – **Jun 14, 2026** |
| Mentor (GSoC / C4GT interviews, PR reviews, standups) | Mifos Initiative | Mar 2026 – Present |
| Open Source Mobile Developer | Mifos Initiative | Nov 2024 – Present |
| Mifos Summer of Code 2025 Intern ($2,500 stipend) | Mifos Initiative | Jun 2025 – Sep 2025 |
| Mobile Development Intern (KMP & CMP) | Mobile Byte Sensei | Apr 2025 – Nov 2025 |
| Software Development Intern | TLDE Technologies | Nov 2025 – Dec 2025 |
| Frontend Team Lead + Social Media | Abhiyanth 2K25 | Dec 2024 – Mar 2025 |
| Open Source Contributor – React | DevDisplay | Jan 2025 – Feb 2025 |
| Campus Ambassador | GeeksforGeeks | Apr 2024 – Apr 2025 |

Leadership/volunteer: SRC DSA Coordinator & Mentor, Dept. Social Media Manager, NSS Unit Coordinator, Class Representative (all data + LinkedIn proof links live in the old `src/components/Experience/ProffessionalExperience.js`).

### Featured projects (the big 4, in order)

1. **💰 ExpenseTrackr** *(flagship)* — privacy-first, offline personal finance tracker. Kotlin Multiplatform + Compose Multiplatform; one codebase → Android, iOS, Desktop. Clean MVI, 16 Gradle modules, 18 screens, 15 ViewModels, **24 languages** with in-app switcher, Room (KMP), Koin, DataStore, custom Gradle convention plugins, R8, PIN (SHA-256) + biometric app-lock, CSV backup/restore, Material 3 dynamic color. Android feature-complete, **Play Store closed testing** (public soon). MIT license.
   - GitHub: <https://github.com/revanthkumarJ/ExpenseTrackr>
   - Play Store: **placeholder — link is commented out in code; uncomment when the app goes public**
2. **📱 Mifos-Mobile KMP migration** — 39 merged PRs, 7 modules migrated to KMP/CMP (Android, iOS, Web/WASM, Desktop). [GitHub](https://github.com/openMF/mifos-mobile) · [Play Store](https://play.google.com/store/apps/details?id=org.mifos.mobile)
3. **🏦 Android-Client KMP migration** — 52 merged PRs, 5 modules migrated, production banking app. [GitHub](https://github.com/openMF/android-client) · [Play Store](https://play.google.com/store/apps/details?id=com.mifos.mifosxdroid)
4. **🎪 Abhiyanth Fest website** — frontend team lead; React, Redux, Firebase, Material UI, CashFree payments. [GitHub](https://github.com/revanthkumarJ/abhiyanth-client)

**Compact grid projects:** Meme Studio (KMP/CMP), Swipe assignment app, KisanConnect (client/API/app), Finance client+API, Sports Auction, Departmental Resource Management app, Instagram UI clone, Netflix UI clone — data lives in the old `src/components/Projects/Projects.js`.

### Testimonial (approved for use)

From **Rajan Maurya** — *Engineering Manager | Kotlin Multiplatform Expert | Scaling Cross-Platform Teams | Driving Mobile Innovation*:

> "I highly recommend Jilakara Revanth Kumar as a Kotlin Multiplatform Developer who consistently delivers high-quality, scalable solutions. Revanth brings strong expertise in Kotlin Multiplatform development, with a deep understanding of building efficient, cross-platform architectures. His approach to system design and architecture is thoughtful, well-structured, and aligned with best practices, ensuring maintainable and future-ready codebases. One of his standout strengths is his debugging ability — he has a sharp eye for identifying complex issues and resolving them with clarity and precision. He approaches challenges methodically and remains solution-oriented, even in high-pressure situations. Beyond his technical skills, Revanth is reliable, proactive, and a great collaborator, making him a valuable asset to any development team. I strongly recommend him for any role requiring expertise in Kotlin Multiplatform and robust software architecture."

Proof: <https://www.linkedin.com/in/jilakararevanthkumar/details/recommendations/>

### Contact & socials

- Status: **"Open to opportunities"** — show prominently
- Email: <jrevanth101@gmail.com>
- LinkedIn: <https://www.linkedin.com/in/jilakararevanthkumar/>
- Instagram: <https://www.instagram.com/revanth_kumar_j>
- GitHub: <https://github.com/revanthkumarJ>
- **No Twitter/X.**
- Resume PDF: `src/Assets/Revanth_final_version.pdf` (current as of 2026-07-18)

---

## 🖼️ Placeholder Images — IMPORTANT

The rebuild ships with **dummy/placeholder images everywhere** (hero photo, project screenshots, device frames). Revanth will replace them later with real assets:

- Every placeholder slot must be **clearly marked and easy to swap** (one obvious file path or data entry per image).
- ✅ ExpenseTrackr featured image is REAL (`src/Assets/images/expense_tracker.png`, added 2026-07-18).
- Wanted real assets eventually: high-res personal photo; Swipe Compose screens; Mifos before/after migration shots; ExpenseTrackr screens; device-framed mockups.
- **ExpenseTrackr Play Store link:** keep as a **commented-out placeholder** in the project data — uncomment when the app is public.

---

## 🏗️ Codebase Status

### Old site (pre-rebuild)

- Create React App (react-scripts 5, React 17) + react-bootstrap + react-tsparticles + typewriter-effect — the widely-used "Soumyajit" purple template, customized.
- Structure: `src/components/{Home,About,Experience,Projects,Achievements,Certificates,Resume}` + `style.css` (743 lines).
- Known quirks: `Home.js` stacked Experience/Achievements/Resume on the home route *and* they existed as separate routes (duplicated content); Certificates route commented out.
- **All old content data files remain the reference for copy/links** until fully ported.

### New site (rebuilt 2026-07-18) ✅

- **Stack:** Vite 6 + React 18 + Tailwind CSS 4 (`@tailwindcss/vite`, CSS-first config) + Framer Motion + Lenis smooth-scroll + react-icons. `playwright-core` (dev) for screenshot verification against installed Chrome.
- **Layout of the code:**
  - `src/data/content.js` — **ALL site content and image imports live here.** Edit this file to change copy, links, stats, projects. Placeholder images are marked with 🖼️ comments; ExpenseTrackr Play Store link is a commented block here.
  - `src/index.css` — design tokens in `@theme` (colors: `ink`, `bright`, `body`, `violet`, `fuchsia`, `cyan`, `emerald`, `amber`; fonts: Space Grotesk display / Inter body) + utilities (`.glass`, `.glow-card`, `.text-gradient`, `.noise`, `.blob`, `.pulse-dot`).
  - `src/ui/primitives.jsx` — `Reveal`, `Counter`, `TiltCard`, `Magnetic`, `SectionHeading`, `Monogram` (the RJ logo, drawn in SVG), `ImageSlot` (renders a labeled placeholder when `src` is null), `Chip`.
  - `src/sections/` — `Nav` (scroll-spy + mobile menu), `Hero`, `About` (incl. live GitHub contribution calendar via `react-github-calendar`, username in `content.js`), `Experience` (scroll-drawn timeline + "Deep dive" expanders), `Projects` (4 featured tilt cards + grid), `Achievements`, `Writing` (Medium posts — update the `blog.posts` list in `content.js` when new articles publish; feed: medium.com/feed/@jrevanth101), `Testimonial`, `Contact`, `Footer`.
  - `src/App.jsx` — Lenis setup + section order. `index.html` at repo root (Vite convention; fonts + OG meta here).
- **Build:** `npm run dev` / `npm run build` (outputs `dist/`; Vercel auto-detects Vite). Verified: production build clean, zero console errors, nav/deep-dive/mobile-menu interactions tested via headless Chrome.
- Old template assets remain in `src/Assets/` — several serve as project-card placeholder images until real screenshots arrive.

---

## 🧭 For Future Editors (AI or human)

1. Read this README fully before changing anything.
2. Content facts above (dates, numbers, links, testimonial) are **user-confirmed** — don't "fix" them from older code, the old code is outdated.
3. Keep placeholder image slots swappable; never bury image paths deep in components.
4. Play Store links: show for every published app; ExpenseTrackr's stays commented until told otherwise.
5. After major changes, update the "Codebase Status" section and the date stamps here.
