# Interview Preparation — How this section works

This folder powers everything under the `/interview_preparation` route. It is a
self-contained "site within the site" for **Android & KMP developer interview
preparation**. This document is the contract for how it is structured and how
new material must be added.

## Build roadmap (what's done, what's pending)

Goal: cover **every** Android/KMP SDE1 interview area at "walk into Uber/any MNC
and pass" depth — basics through advanced. Answer style is **teaching-first**:
explain the concept plainly → direct answer → code → edge cases (not terse
interview-speak). Built category by category across sessions; the site is always
shippable between categories.

## Expansion pass — 30+ questions per topic

A second pass raises every topic to a **minimum of 30 questions** (target 40+),
spanning basic definitions, "how it works internally", comparisons, practical/
code, edge cases & gotchas, senior/architecture, and real-world scenarios. Every
answer follows the teaching-first structure (plain-English concept → direct
answer → annotated code where applicable → caveats/mistakes → one-line interview
tip via a `note` block). Category-by-category status:

- ✅ **Architecture** — expanded (MVC 30, MVP 31, MVVM 43, MVI 30, Clean 30,
  Modularization 31). Every topic ≥ 30 questions, teaching-first answers.
- ✅ **Jetpack Compose** — expanded (Fundamentals 30, State 31, Modifiers &
  Layout 30, Lazy Lists 31, Side Effects 31, Performance & Stability 31, Theming &
  Animation 31, Navigation/Interop/Testing 31). Every topic ≥ 30 questions,
  teaching-first answers.
- ✅ **Coroutines** — expanded (Basics 31, Builders & Scopes 31, Structured
  Concurrency 31, Dispatchers 32, Cancellation 31, Exception Handling 31, Channels
  & Synchronization 31). Every topic ≥ 30 questions, teaching-first answers.
- ⬜ Flows, Kotlin, Android Core, Data & Storage, Networking,
  DI, Background Work, Testing, Performance, Distribution, Firebase, KMP, System
  Design — pending expansion (many topics already ≥ 30; audit and top up).

**Completed**
- ✅ **Architecture** — MVC, MVP, MVVM, MVI, Clean Architecture, Modularization
- ✅ **Jetpack Compose (UI)** — Fundamentals, State & Recomposition, Modifiers &
  Layout, Lazy Lists, Side Effects, Performance & Stability, Theming & Animation,
  Navigation/Interop/Testing
- ✅ **Kotlin Flows** — Basics & Cold Flows, Operators, StateFlow & SharedFlow,
  Buffering/Conflation/Backpressure, Context/flowOn/Conversions, Error Handling &
  Testing
- ✅ **Coroutines** — Basics & Suspend, Builders & Scopes, Structured Concurrency
  & Jobs, Dispatchers & Context, Cancellation, Exception Handling, Channels &
  Synchronization
- ✅ **Kotlin Language** — Null Safety & Types, Classes & Objects, Functions/
  Lambdas/Scope Functions, Collections & Sequences, Generics & Variance,
  Delegation & Advanced
- ✅ **Android Core** — Activity Lifecycle & State, Fragments & Lifecycle,
  Intents/Tasks/Launch Modes, Services/Receivers/Providers, Context/Processes/
  App Startup, Threading/Handler-Looper/Permissions
- ✅ **Data & Storage** — Room & SQLite Fundamentals, Room Relations & Migrations,
  DataStore & SharedPreferences, Caching & Offline-First, Paging 3
- ✅ **Networking** — HTTP & REST Fundamentals, Retrofit & OkHttp, JSON
  Serialization, Error Handling & Auth, Ktor & WebSockets
- ✅ **Dependency Injection** — DI Fundamentals & Concepts, Dagger Fundamentals,
  Hilt (Android DI), Koin/KMP DI & Testing
- ✅ **Background Work** — WorkManager Fundamentals, WorkManager Advanced,
  AlarmManager & Foreground Services, Doze/Battery & Choosing the Right Tool
- ✅ **Testing** — Testing Strategy & the Pyramid, Unit Testing (JUnit/Fakes/
  Mocks), Coroutine & Flow Testing, Android & Compose Testing
- ✅ **Performance & Memory** — Memory Leaks & Management, ANRs/Jank/Rendering,
  Profiling/Startup/Baseline Profiles, App Size & Battery
- ✅ **Build, Distribution & Play Store** — Gradle & the Build System, Signing/R8/
  Versioning, AAB/APK & Play App Signing, Play Console (tracks/rollouts/updates)
- ✅ **Firebase** — Cloud Messaging (FCM), Crashlytics & Analytics, Remote Config/
  A-B Testing/App Distribution, Auth & Databases
- ✅ **Kotlin Multiplatform** — KMP Fundamentals, iOS Interop, Libraries &
  Compose Multiplatform
- ✅ **Mobile System Design** — Approaching Mobile System Design, Design an
  Image-Loading Library, Design Offline-First Sync, Design a Feed & Chat

**🎉 Roadmap complete — all 16 planned categories are built.**

The full plan (Kotlin, Architecture, Android Core, Compose, Coroutines, Flows,
Data & Storage, Networking, DI, Background Work, Testing, Performance,
Distribution, Firebase, KMP, System Design) is done — ~70 topics, each with a
teaching-first Content tab and a Junior/Senior Q&A tab, all registered in
`src/data/interview/index.js` and rendered by the hub/topic routes.

Future work is *deepening* existing categories (more edge-case questions, more
worked examples) or adding new areas (e.g. RxJava legacy, hardware APIs like
camera/Bluetooth/location, CI/CD deep-dive) — add them the same way: a folder
per topic (`content.js` + `qa.js` + `index.js`), a category `index.js`, and one
line in the registry.

Each pending category is a folder under `src/data/interview/<category>/` with one
folder per topic (`content.js` + `qa.js` + `index.js`), a category `index.js`,
and one line added to the registry in `src/data/interview/index.js` — same schema
described below.

## Page structure

```
/interview_preparation                      → InterviewHome (the hub)
/interview_preparation/:category/:topic     → TopicPage (one subtopic)
anything else                               → redirects to /
```

### 1. The hub (`InterviewHome.jsx`)

- Top of the page shows the mission statement: *"This page is dedicated to all
  information regarding preparing for Android and KMP developer interviews."*
- Below it, one section **per category** (e.g. **Architecture**). Each category
  renders its name, a short description, and a row of **topic buttons**
  (e.g. **MVVM**).
- Clicking a topic button navigates to that topic's dedicated page
  (`/interview_preparation/<categoryId>/<topicId>`).
- The hub renders entirely from the registry in `src/data/interview/index.js`.
  **Never hardcode a category or topic in the JSX** — add it to the registry
  and the hub picks it up.

### 2. The topic page (`TopicPage.jsx`)

Every topic page has **tabs**. The two standard tabs are:

| Tab | Purpose |
| --- | --- |
| **Content** | Everything you need to *learn* the topic: explanations, diagrams-in-text, code snippets, comparison tables, edge cases, best practices, anti-patterns. |
| **Interview Prep** | Question & answer drill. Answers are **hidden by default**; clicking a question expands it (accordion / dropdown). Questions are tagged **Junior** or **Senior** and can be filtered. |

More tabs may be added per topic later (e.g. "Cheat Sheet", "System Design") —
add a new key to the topic data and a tab entry in `TopicPage.jsx`.

## Data model

All material lives in `src/data/interview/`, one folder per category, one
folder per topic:

```
src/data/interview/
  index.js                        ← registry: categories + topic lookup
  architecture/
    mvvm/
      index.js                    ← topic meta (id, title, tagline, tags)
      content.js                  ← Content tab sections
      qa.js                       ← Interview Prep questions
```

### Topic meta (`<topic>/index.js`)

```js
export default {
  id: "mvvm",              // used in the URL — kebab-case
  title: "MVVM",
  tagline: "one-line description shown under the title",
  tags: ["Android", "KMP", ...],
  content,                  // from content.js
  qa,                       // from qa.js
};
```

### Content sections (`content.js`)

`content` is an array of sections: `{ heading, blocks }`. A block is one of:

| Block | Shape | Renders as |
| --- | --- | --- |
| paragraph | `{ t: "p", text }` | prose paragraph |
| sub-heading | `{ t: "h3", text }` | small heading inside a section |
| bullet list | `{ t: "list", items: [str] }` | bulleted list |
| code | `{ t: "code", title, code }` | code block with a title bar |
| table | `{ t: "table", headers, rows }` | comparison table |
| callout | `{ t: "note", text }` | highlighted "interview tip" box |

Inline markdown inside any `text`/`items` string: `` `code` `` and `**bold**`.

### Q&A (`qa.js`)

An array of `{ level: "junior" | "senior", q, a }` where `a` is an array of the
same blocks as above. Rules:

- Answers must be **complete enough to say out loud in an interview** — not a
  one-liner, not an essay. State the direct answer first, then the "why", then
  edge cases.
- Tag by the level at which the question is realistically asked. Senior
  questions should probe internals, trade-offs, and failure modes.
- Aim for exhaustive coverage: fundamentals, internals, edge cases,
  anti-patterns, testing, and KMP angles for every topic.

## Adding a new topic (checklist)

1. Create `src/data/interview/<category>/<topic>/` with `index.js`,
   `content.js`, `qa.js` following the schema above.
2. Register it in `src/data/interview/index.js` (add the category first if it
   is new: `{ id, name, description, topics: [...] }`).
3. That's it — the hub button and the topic route work automatically. Unknown
   category/topic ids on the topic route redirect back to the hub.

## Style rules

- Pages reuse the portfolio's dark theme tokens (`bg-ink`, `text-body`,
  `text-bright`, `glass`, `text-gradient`, `font-display`) — do not introduce
  new colors.
- Kotlin is the default language for snippets; Swift only when showing iOS
  consumption of KMP code.
- Content is written for **both junior and senior** roles: every topic must
  cover basics AND internals/edge cases (config change, process death,
  threading, testing, multiplatform differences).
