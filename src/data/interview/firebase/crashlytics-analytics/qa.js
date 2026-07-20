// Crashlytics & Analytics — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What is Firebase Crashlytics and why is it important?",
    a: [
      {
        t: "p",
        text: "**Crashlytics is a crash-reporting tool that automatically captures crashes happening on real users' devices in production and reports them to a dashboard with the stack trace, device/OS info, and context.** It's important because you can't reproduce every crash yourself — Crashlytics is how you *find out* what's actually crashing for real users, how often, and on which devices, so you can prioritize and fix.",
      },
      {
        t: "list",
        items: [
          "**Automatic capture** — it records unhandled exceptions/crashes with full stack traces and sends them when the app next has connectivity, with no per-crash code (you just add the SDK).",
          "**Grouping by impact** — it groups identical crashes into a single issue with a count of affected users/occurrences, so you see 'this crash affects 500 users' and can prioritize by real impact rather than sifting through duplicates.",
          "**Context** — each report includes device model, OS version, app version, and a breadcrumb log of events before the crash (with custom keys you can log), helping you diagnose *why*.",
          "**Non-fatals** — you can also record *handled* exceptions (`recordException`) to track recoverable errors that don't crash the app.",
        ],
      },
      {
        t: "p",
        text: "It's essentially a requirement for any production app — shipping without crash reporting means flying blind, discovering problems only from user complaints (or not at all). With Crashlytics, production crashes become concrete, prioritized, actionable data. One critical setup detail: since release builds are obfuscated by R8, you must ensure the *mapping file* is uploaded (the Crashlytics Gradle plugin does this) so crash reports are de-obfuscated and readable — otherwise the stack traces show meaningless renamed symbols.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is Firebase Analytics used for?",
    a: [
      {
        t: "p",
        text: "**Firebase Analytics tracks *what users do* in your app — which screens they visit, which features they use, where they drop off — by logging *events*. It answers product and business questions: which features are popular, where users abandon a flow, what drives engagement and retention.** It's about user *behavior*, distinct from Crashlytics (stability) and Performance Monitoring (speed).",
      },
      {
        t: "code",
        title: "Logging an event",
        code: `Firebase.analytics.logEvent("add_to_cart") {
    param("item_id", itemId)
    param("value", price)
}`,
      },
      {
        t: "list",
        items: [
          "**Events** are the core unit — something the user did (`add_to_cart`, `search`, `level_complete`), optionally with parameters. Some events are logged automatically (screen views, first open, sessions); you add custom events for your app's specific actions.",
          "**User properties** segment users (subscription tier, region), so you can analyze behavior by group ('do premium users use this feature more?').",
          "**Funnels and retention** let you see how many users complete a multi-step flow vs abandon at each step, and how users return over time — key product metrics.",
        ],
      },
      {
        t: "p",
        text: "The value is turning intuition into data — instead of guessing which features matter or where users struggle, you *measure* it. Analytics also feeds other Firebase tools: it builds *audiences* used for Remote Config targeting, A/B testing, and FCM campaigns, and raw data can export to BigQuery for deep analysis. Used well, it drives product decisions (which features to invest in, where to fix friction). One responsibility to note: analytics must respect user privacy — comply with consent (GDPR), don't log personally identifiable information in events, and honor Play's Data Safety declarations.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are the different Firebase tools for understanding app health in production?",
    a: [
      {
        t: "p",
        text: "**Firebase provides three tools covering the three pillars of production observability — stability, behavior, and performance:**",
      },
      {
        t: "list",
        items: [
          "**Crashlytics (stability)** — *what's crashing*. Automatic crash and non-fatal error reporting with stack traces, device context, and impact-grouped issues. Tells you your app's reliability in the field.",
          "**Analytics (behavior)** — *what users do*. Event tracking (screen views, feature usage, funnels, retention) and user-property segmentation. Tells you how the app is actually used and where users drop off.",
          "**Performance Monitoring (performance)** — *how fast* the app is. Automatic traces for startup time, screen rendering (slow/frozen frames), and network request timing, plus custom traces. Tells you real-world speed across devices.",
        ],
      },
      {
        t: "p",
        text: "Together they give a complete picture of real-world app health across the millions of devices you'll never physically test on. Production is the ultimate test environment — real hardware, real networks, real usage at scale reveal issues local testing can't — and these tools are your window into it. They turn vague signals ('users say it's buggy/slow') into specific, prioritizable data: *this* crash affects *this many* users, *this* screen is slow on *these* devices, users abandon at *this* step. A well-instrumented app uses all three so problems are detected and prioritized by real impact. (Firebase also has related tools — Remote Config, A/B Testing, App Distribution — but Crashlytics/Analytics/Performance are the core observability trio.)",
      },
    ],
  },
  {
    level: "senior",
    q: "Why do crash reports need the R8 mapping file, and what happens without it?",
    a: [
      {
        t: "p",
        text: "**Because release builds are obfuscated by R8 — class, method, and field names are renamed to short meaningless symbols (`a`, `b`, `c`) — so raw crash stack traces from production show those obfuscated names and are unreadable. The mapping file records the original-name → obfuscated-name translation, and Crashlytics uses it to *de-obfuscate* stack traces back to real names, making crash reports debuggable. Without it, reports are useless.**",
      },
      {
        t: "list",
        items: [
          "**What obfuscation does to a crash**: R8 renames `com.myapp.PaymentProcessor.processPayment()` to something like `a.b.a()`. When that crashes in production, the stack trace reported from users' devices shows `at a.b.a(...)` — which tells you nothing about where or what actually crashed.",
          "**What the mapping file does**: it's the dictionary mapping obfuscated names back to originals. Crashlytics applies it to translate the obfuscated stack trace back into readable `at com.myapp.PaymentProcessor.processPayment()`, so you can actually diagnose the crash.",
          "**How it's uploaded**: the Crashlytics Gradle plugin automatically uploads the mapping file for each release build and associates it with that build, so de-obfuscation just works — provided the plugin is configured correctly.",
        ],
      },
      {
        t: "list",
        items: [
          "**What happens without it**: crash reports show obfuscated symbols (`a.b.c()`), and you *cannot tell what crashed* — the reports are effectively worthless. You'd see that *something* is crashing and how often, but not *what* or *where*, so you can't fix it. For an obfuscated release app, the mapping file is the difference between actionable and useless crash reports.",
          "**It's per-build**: R8 obfuscates *differently* on each build (a code change shifts the renamed symbols), so each version has its own mapping file that only de-obfuscates *that version's* crashes. The plugin handles matching the right mapping to the right build, but the implication is that every release's mapping must be uploaded — if a crash comes from a version whose mapping was never uploaded, it can't be de-obfuscated.",
          "**The verification discipline**: because a misconfigured mapping upload silently produces unreadable reports (the app works, crashes are captured, but they're gibberish), verifying that de-obfuscation is working — checking that crash reports show real names — is part of a correct Crashlytics setup. Discovering during an incident that your crash reports are obfuscated is a painful, common mistake.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: this is the intersection of two mechanisms — R8 obfuscation (shrinks and lightly protects the shipped code by renaming symbols) and crash reporting (which needs *readable* symbols to be useful). The mapping file is what reconciles them: the release stays obfuscated for users, but Crashlytics holds the key to translate its crashes back for *your* debugging. So obfuscation and the mapping file are two halves of one system, and the operational requirement — upload the mapping for *every* release (the Gradle plugin automates it) and *verify* de-obfuscation works — must be baked into the release process, because a crash report you can't read is a bug you can't fix. Understanding that obfuscation makes production crashes unreadable, that the per-build mapping file is what restores readability, and that verifying its upload is essential (a silent failure otherwise) is the practical crash-reporting competence these questions probe — and it connects directly to the same mapping-file concept in the build/distribution topic.",
      },
    ],
  },
  {
    level: "senior",
    q: "How would you instrument an app to make production issues diagnosable and prioritizable?",
    a: [
      {
        t: "p",
        text: "**I'd instrument all three observability pillars — crash/error reporting (Crashlytics), behavioral analytics (Analytics), and performance monitoring (Performance Monitoring) — with rich context (custom keys, breadcrumbs, user/session identifiers) so issues are not just *detected* but *diagnosable* (enough context to understand *why*) and *prioritizable* (impact data to know *what matters most*). Detection alone isn't enough — the goal is actionable signal.**",
      },
      {
        t: "list",
        items: [
          "**Crash & error reporting with context**: Crashlytics for automatic crashes, *plus* `recordException` for handled/non-fatal errors I want to track (failed critical API calls, recoverable errors, caught-but-unexpected states). Add *custom keys* (current screen, feature flags active, user tier, relevant IDs) and *breadcrumb logs* (`Crashlytics.log`) tracing the user's path, so a crash report shows not just the stack trace but the *state and sequence* that led to it — turning 'it crashed here' into 'it crashed here, for premium users, on the checkout screen, after this action'. Ensure the mapping file is uploaded (de-obfuscated traces) and set a user identifier (non-PII) so I can correlate a specific user's crashes if they report an issue.",
          "**Behavioral analytics for impact and funnels**: log key events (feature usage, funnel steps, conversions) with parameters and user properties. This provides the *impact* dimension — how many users hit a feature, where they drop off — which prioritizes both bugs (a crash in a high-traffic flow matters more than one in a rarely-used corner) and product work (invest where usage/friction is). Funnels reveal *where* users abandon, complementing crash data.",
          "**Performance monitoring for speed regressions**: automatic startup/rendering/network traces plus custom traces around critical operations, so I catch performance regressions in the field (a screen that got slow on certain devices, a network endpoint degrading) — which users experience as 'slow/laggy' and which local testing on good devices misses.",
          "**Tie it to releases and alerting**: associate metrics with app *version* so I can compare release-over-release (did this version's crash rate spike? did startup regress?) — essential for staged rollouts (halt if the new version's metrics degrade). Set up *alerts* on regressions (crash-rate spike, new crash affecting many users, ANR increase) so I'm notified proactively, not by manually checking dashboards. Android Vitals (Play Console) complements Firebase with Play-tracked crash/ANR/vitals used for ranking.",
          "**Correlate the three**: the pillars are more powerful together — a *performance* trace showing a slow screen + *analytics* showing high traffic there + *crash* reports on that screen = a clear, high-priority problem. Cross-referencing behavior (impact), stability (crashes), and performance (speed) is how you prioritize accurately.",
        ],
      },
      {
        t: "list",
        items: [
          "**Privacy and hygiene**: no PII in events, crash logs, or custom keys; comply with consent (GDPR) and Play Data Safety; use stable non-PII identifiers for correlation. Don't over-log (noise and cost) — instrument the events and traces that answer real questions, and add custom keys/breadcrumbs strategically around risky or important flows.",
          "**Close the loop**: use the data to *act* — triage crashes by impact (users affected × severity), fix top issues, verify the fix reduced the metric in the next release, and feed learnings back (add a test for a fixed crash, add a breadcrumb where diagnosis was hard). Observability is only valuable if it drives action.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: good instrumentation isn't just 'add Crashlytics' — it's designing for *diagnosability* and *prioritization*. Diagnosability means capturing enough *context* (custom keys, breadcrumbs, non-fatal errors, de-obfuscated traces) that a report tells you *why*, not just *that* something failed. Prioritization means capturing *impact* (analytics for traffic/usage, crash grouping by affected users, version comparison) so you fix what matters most — a crash in a high-traffic flow over one in a dead corner. The three pillars (stability, behavior, performance) are strongest *correlated* — behavior gives impact, stability gives failures, performance gives speed, and together they pinpoint high-priority problems. Wrapping it with release-versioned metrics, proactive alerting, privacy discipline, and a fix-verify feedback loop turns raw telemetry into an engineering advantage: production becomes a source of precise, actionable, prioritized signal rather than vague complaints. Demonstrating the detect → diagnose → prioritize → act framing, with the specific instrumentation choices (context for diagnosis, impact for priority, correlation across pillars, versioning/alerting), is the comprehensive senior answer.",
      },
    ],
  },
];

export default qa;
