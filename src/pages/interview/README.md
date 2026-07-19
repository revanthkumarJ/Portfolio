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

**Completed**
- ✅ **Architecture** — MVC, MVP, MVVM, MVI, Clean Architecture, Modularization
- ✅ **Jetpack Compose (UI)** — Fundamentals, State & Recomposition, Modifiers &
  Layout, Lazy Lists, Side Effects, Performance & Stability, Theming & Animation,
  Navigation/Interop/Testing

**Pending (planned order — resume here)**
1. **Flows** — cold vs hot, operators, StateFlow vs SharedFlow, buffering/
   conflation/backpressure, flowOn, stateIn/shareIn, callbackFlow, error handling,
   testing (Turbine)
2. **Coroutines** — suspend internals, builders, structured concurrency,
   dispatchers, scopes, cancellation, exception handling, channels, select/mutex
3. **Kotlin Language** — null safety, data/sealed/value classes, functions &
   lambdas, scope functions, collections/sequences, generics & variance,
   delegates, lateinit/lazy, Java interop
4. **Android Core** — Activity/Fragment lifecycle, Intents, tasks/back stack/
   launch modes, Services, BroadcastReceivers, ContentProviders, Context,
   processes, Handler/Looper, permissions, RecyclerView/ViewBinding
5. **Data & Storage** — Room, DataStore vs SharedPreferences, SQLite, scoped
   storage, caching, Paging 3
6. **Networking** — HTTP/REST, Retrofit + OkHttp, Ktor (KMP), JSON serialization,
   error handling/retries, caching/offline, auth token refresh, WebSockets
7. **Dependency Injection** — DI concept, Dagger fundamentals, Hilt
   (components/scopes/modules/VM injection), Koin & KMP DI, testing with DI
8. **Background Work** — WorkManager (constraints, chaining, unique, expedited,
   CoroutineWorker), AlarmManager, foreground services, Doze/App Standby,
   choosing the right tool
9. **Testing** — test pyramid, JUnit, fakes vs mocks (MockK), coroutine/flow
   testing, ViewModel/Room tests, Compose UI tests, Espresso, Robolectric, CI
10. **Performance & Memory** — leaks & LeakCanary, ANRs, profiling, app startup &
    baseline profiles, jank/rendering, APK/AAB size, battery
11. **Build, Distribution & Play Store** — Gradle variants/flavors, signing,
    **AAB vs APK** & split APKs, R8/ProGuard, Play Console tracks & staged
    rollouts, Play App Signing, versioning, in-app updates, pre-launch reports
12. **Firebase** — Crashlytics, Analytics, **FCM** (token lifecycle, data vs
    notification messages), Remote Config/A-B, **App Distribution**, Auth,
    Firestore/RTDB, Performance Monitoring
13. **KMP** — expect/actual & source sets, targets, sharing strategies, iOS
    interop (SKIE), common libs (Ktor, SQLDelight, Room KMP), Compose
    Multiplatform, umbrella framework
14. **Mobile System Design** — approach, image-loading library, offline-first
    sync, pagination/infinite feed, chat app, analytics/logging SDK

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
