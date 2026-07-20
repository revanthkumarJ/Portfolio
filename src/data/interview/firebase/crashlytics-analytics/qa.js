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
  {
    level: "senior",
    q: "How does Crashlytics capture and report a crash under the hood?",
    a: [
      {
        t: "p",
        text: "Crashlytics installs handlers: an *uncaught exception handler* for JVM/Kotlin crashes and *native (NDK) signal handlers* for C/C++ crashes. When a crash occurs, it *writes a minimal report to disk immediately* (the process is dying, so it can't upload then), capturing the stack trace, thread states, device/OS info, and your custom keys/logs. On the *next app launch*, it uploads the stored report to the Firebase backend, which *symbolicates/deobfuscates* it (using your mapping/symbol files) and *groups* similar crashes into issues.",
      },
      {
        t: "list",
        items: [
          "**Handlers** — uncaught exception + native signal handlers.",
          "**On crash** — write a minimal report to disk (process dying).",
          "**Next launch** — upload the stored report.",
          "**Backend** — deobfuscate + group into issues.",
        ],
      },
      {
        t: "note",
        text: "Crashlytics installs an uncaught-exception handler (+ native signal handlers). On a crash it writes a minimal report to disk (the process is dying, can't upload) with stack/threads/device/custom keys, then uploads on the next launch. The backend deobfuscates (mapping/symbol files) and groups similar crashes into issues.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between a crash and a non-fatal (logged) exception?",
    a: [
      {
        t: "p",
        text: "A *crash* (fatal) is an *uncaught* exception/signal that *terminates* the app — Crashlytics captures it automatically. A *non-fatal* is an exception you *caught and handled* but still want visibility into — you *record it manually* (`recordException(e)`) so it shows in Crashlytics (grouped, with trends) without crashing the app. Use non-fatals for handled errors that matter (a failed but recovered network call, an unexpected-but-survivable state) to spot problems that don't crash but degrade experience.",
      },
      {
        t: "code",
        title: "Recording a non-fatal",
        code: `try {\n  riskyOperation()\n} catch (e: IOException) {\n  Firebase.crashlytics.recordException(e) // logged, app keeps running\n  showRetry()\n}`,
      },
      {
        t: "note",
        text: "A crash (fatal) is an uncaught exception terminating the app — captured automatically. A non-fatal is a caught/handled exception you record manually (recordException) for visibility (grouped, trended) without crashing. Use non-fatals for handled-but-important errors (recovered network fail, survivable bad state) to catch degradations that don't crash.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are custom keys and custom logs in Crashlytics?",
    a: [
      {
        t: "p",
        text: "*Custom keys* (`setCustomKey(\"screen\", \"checkout\")`) attach *key-value context* to crash reports — the app's state at crash time (current screen, user tier, feature-flag values) to help diagnose *why* it happened. *Custom logs* (`log(\"tapped pay\")`) add a *breadcrumb trail* of recent actions leading up to the crash. Together they turn a bare stack trace into a *story*: what the user was doing and in what state. Add them at key points so production crashes are actionable, not mysterious.",
      },
      {
        t: "list",
        items: [
          "**Custom keys** — key-value state (screen, tier, flags).",
          "**Custom logs** — breadcrumb trail of recent actions.",
          "**Together** — turn a stack trace into a story.",
          "**Add** — at key points for actionable crashes.",
        ],
      },
      {
        t: "note",
        text: "Custom keys (setCustomKey) attach key-value state (screen, user tier, flags) to a crash — the 'why'. Custom logs (log) add a breadcrumb trail of recent actions — the 'what led here'. Together they turn a bare stack trace into a story of what the user was doing and in what state. Add them at key points to make production crashes actionable.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does Crashlytics group crashes into issues, and why does grouping matter?",
    a: [
      {
        t: "p",
        text: "Crashlytics *groups* crashes with the same root cause (similar stack trace/exception) into a single *issue*, so a crash hitting 10,000 users is *one* issue with a count — not 10,000 separate reports. This lets you *prioritize by impact* (users affected, crash-free rate delta) instead of drowning in individual reports. Grouping isn't perfect (you can *merge* wrongly-split issues or the algorithm may over-group) — but it's what makes triage tractable. Prioritize the issues affecting the most users first.",
      },
      {
        t: "list",
        items: [
          "**Groups** — same-root-cause crashes into one issue.",
          "**Count** — 10k crashes → 1 issue with impact.",
          "**Prioritize** — by users affected, not raw reports.",
          "**Imperfect** — merge/split issues as needed.",
        ],
      },
      {
        t: "note",
        text: "Crashlytics groups same-root-cause crashes (similar stack/exception) into one issue with a count — 10k crashes become one prioritizable issue, not 10k reports. This lets you triage by impact (users affected, crash-free delta) instead of drowning. Grouping is imperfect (merge/split as needed) but makes triage tractable. Fix highest-impact issues first.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the crash-free users metric, and why is it a key KPI?",
    a: [
      {
        t: "p",
        text: "*Crash-free users* is the percentage of users who *didn't experience a crash* in a period (similarly, crash-free sessions). It's a top stability KPI because it directly reflects *how many real users* are affected — a single high-frequency crash can drop it noticeably. Teams set a *target* (e.g. 99.5%+), watch it *during rollouts* (a dip signals a bad release), and gate releases on it. It's more user-centric than raw crash counts (which don't show reach). Track it per version.",
      },
      {
        t: "list",
        items: [
          "**Crash-free users** — % who hit no crash in a period.",
          "**User-centric** — reflects real reach of crashes.",
          "**Target + watch** — e.g. 99.5%+; monitor during rollouts.",
          "**Per version** — a dip flags a bad release.",
        ],
      },
      {
        t: "note",
        text: "Crash-free users = % of users who experienced no crash in a period (also crash-free sessions). A top stability KPI because it reflects real user reach — one frequent crash drops it visibly. Set a target (99.5%+), watch it during rollouts (a dip = bad release), gate releases on it, track per version. More user-centric than raw crash counts.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you ensure Crashlytics reports are deobfuscated with R8 enabled?",
    a: [
      {
        t: "p",
        text: "R8 obfuscates names, so raw crash traces are unreadable — Crashlytics needs the *mapping file* to deobfuscate. The Crashlytics Gradle plugin *automatically uploads `mapping.txt`* per build (ensure `mappingFileUploadEnabled` is on for release). For *native* crashes, upload the *native symbols* (`uploadCrashlyticsSymbolFile`/the NDK plugin). Each build's mapping is unique, so this must happen for *every* release. Verify by checking that production traces show real class/method names, not `a.b.c`.",
      },
      {
        t: "list",
        items: [
          "**Needs mapping** — to deobfuscate R8 traces.",
          "**Plugin uploads** — `mapping.txt` per build automatically.",
          "**Native** — upload symbol files (NDK).",
          "**Verify** — production traces show real names.",
        ],
      },
      {
        t: "note",
        text: "R8 obfuscation makes raw traces unreadable — Crashlytics needs the mapping file. Its Gradle plugin auto-uploads mapping.txt per build (keep mappingFileUploadEnabled on for release); upload native symbols for NDK crashes. Each build's mapping is unique, so it must happen every release. Verify production traces show real class/method names, not a.b.c.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is Firebase Analytics' event and parameter model?",
    a: [
      {
        t: "p",
        text: "Analytics is *event-based*: you log *events* (`logEvent(\"add_to_cart\", params)`) — named actions — each with up to ~25 *parameters* (key-value details like item id, value, screen). Firebase provides *recommended events* (e.g. `screen_view`, `purchase`, `login`) with standard params (which power built-in reports and integrations), plus *custom events* for your app's specific actions. *User properties* describe the user (tier, cohort) for segmentation. Design a consistent event taxonomy so data is analyzable.",
      },
      {
        t: "list",
        items: [
          "**Events** — named actions (`add_to_cart`), ~25 params each.",
          "**Recommended events** — standard names power reports.",
          "**Custom events** — app-specific actions.",
          "**User properties** — user attributes for segmentation.",
        ],
      },
      {
        t: "note",
        text: "Firebase Analytics is event-based: log events (named actions like add_to_cart) with up to ~25 parameters each. Use recommended events (screen_view, purchase) with standard params for built-in reports/integrations, plus custom events for specifics. User properties (tier, cohort) enable segmentation. Design a consistent event taxonomy so data stays analyzable.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between events, user properties, and audiences?",
    a: [
      {
        t: "p",
        text: "*Events* are *actions* (what the user did — `level_up`, `purchase`). *User properties* are *attributes* of the user (persistent traits — subscription tier, favorite genre, app version). *Audiences* are *segments* defined by combinations of events/properties (e.g. 'users who purchased in the last 7 days' or 'free-tier users who opened checkout') — used for targeting in Remote Config, A/B testing, notifications, and analysis. Events feed audiences; properties describe users; audiences group them for action.",
      },
      {
        t: "table",
        headers: ["", "Is", "Example"],
        rows: [
          ["Event", "An action", "purchase, level_up"],
          ["User property", "A user attribute", "tier = premium"],
          ["Audience", "A segment (event+property rules)", "purchased last 7d"],
        ],
      },
      {
        t: "note",
        text: "Events = actions (what the user did — purchase, level_up). User properties = persistent user attributes (tier, genre, version). Audiences = segments defined by event/property rules (purchased last 7d) used to target Remote Config, A/B tests, notifications, and analysis. Events feed audiences, properties describe users, audiences group them for action.",
      },
    ],
  },
  {
    level: "junior",
    q: "How does Firebase Analytics differ from crash reporting?",
    a: [
      {
        t: "p",
        text: "*Analytics* answers *'what are users doing?'* — behavior, funnels, retention, feature usage (product/business insight). *Crashlytics* answers *'what's broken?'* — stability, crashes, non-fatals (engineering/quality insight). They're complementary halves of production observability: Analytics tells you a feature is used a lot (so its bugs matter more), Crashlytics tells you it's crashing. Use Analytics to prioritize by usage and Crashlytics to prioritize by breakage; together they guide where to invest.",
      },
      {
        t: "list",
        items: [
          "**Analytics** — what users do (behavior, funnels, retention).",
          "**Crashlytics** — what's broken (crashes, non-fatals).",
          "**Complementary** — usage + stability.",
          "**Together** — prioritize by usage × breakage.",
        ],
      },
      {
        t: "note",
        text: "Analytics answers 'what are users doing?' (behavior, funnels, retention — product insight); Crashlytics answers 'what's broken?' (crashes, non-fatals — quality insight). Complementary halves of observability: Analytics shows a feature is heavily used (bugs matter more), Crashlytics shows it's crashing. Prioritize by usage × breakage.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is Crashlytics velocity alerting, and how do you respond to it?",
    a: [
      {
        t: "p",
        text: "*Velocity alerts* notify you when a crash issue is *spiking* — affecting a significant, rapidly-growing percentage of sessions (often a new regression in a fresh release). Respond fast: confirm the *version* and *impact*, check if it's *flag-gated* (disable via Remote Config), *halt the rollout* if staged, and ship a *forward-fix*. Velocity alerts are your early-warning during rollouts — wire them to Slack/email/PagerDuty so the on-call sees a regression at 1% rollout, not after it reaches everyone.",
      },
      {
        t: "list",
        items: [
          "**Velocity alert** — a crash spiking across sessions.",
          "**Often** — a new-release regression.",
          "**Respond** — confirm version/impact, flag-disable, halt, forward-fix.",
          "**Wire to** — Slack/PagerDuty for on-call.",
        ],
      },
      {
        t: "note",
        text: "Velocity alerts fire when a crash issue spikes across a growing % of sessions (often a fresh-release regression). Respond fast: confirm version/impact, disable if flag-gated (Remote Config), halt the rollout, ship a forward-fix. Wire alerts to Slack/PagerDuty so on-call catches a regression at 1% rollout, not after it reaches everyone.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you attribute a crash to a specific release and user segment?",
    a: [
      {
        t: "p",
        text: "Crashlytics tags each report with the *app version (versionCode/Name)*, OS, and device — so you can filter an issue by *version* to see if it's new in a release. Add *custom keys* (user tier, experiment variant, feature-flag state) and integrate *Analytics* (BigQuery) to cross-reference the crash with *behavior/segment*. This lets you answer 'does this crash only hit v2.3 on Android 14, premium users, with flag X on?' — pinpointing the trigger and scoping a fix or a targeted flag-disable.",
      },
      {
        t: "list",
        items: [
          "**Auto tags** — version, OS, device per report.",
          "**Filter by version** — is it new in this release?",
          "**Custom keys** — tier, variant, flag state.",
          "**Cross-ref Analytics** — segment/behavior via BigQuery.",
        ],
      },
      {
        t: "note",
        text: "Crashlytics tags each report with app version, OS, device (filter an issue by version to see if it's new). Add custom keys (tier, experiment variant, flag state) and cross-reference Analytics/BigQuery for segment/behavior. Answer 'does this hit only v2.3 on Android 14, premium, flag X on?' — pinpointing the trigger to scope a fix or targeted flag-disable.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is DebugView, and how do you validate analytics during development?",
    a: [
      {
        t: "p",
        text: "*DebugView* (in the Firebase console) shows your Analytics events *in near real-time* for a device in *debug mode* (`adb shell setprop debug.firebase.analytics.app <pkg>`) — so you can verify events fire with the right names/parameters *as you use the app*, instead of waiting ~24h for normal processing. Use it to validate your event taxonomy before shipping (correct names, params present, no typos/duplicates). Catching instrumentation bugs here prevents garbage data in production reports.",
      },
      {
        t: "list",
        items: [
          "**DebugView** — near-real-time events for a debug device.",
          "**Enable** — `setprop debug.firebase.analytics.app`.",
          "**Validate** — names/params fire correctly as you use the app.",
          "**Prevents** — garbage data from bad instrumentation.",
        ],
      },
      {
        t: "note",
        text: "DebugView (Firebase console) shows Analytics events in near-real-time for a debug-mode device (adb setprop debug.firebase.analytics.app <pkg>) — verify events fire with correct names/params as you use the app, vs waiting ~24h. Validate your taxonomy before shipping (no typos/dupes, params present). Catches instrumentation bugs before they pollute production data.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you design an event taxonomy that scales?",
    a: [
      {
        t: "p",
        text: "Define a *consistent naming convention* (snake_case, verb_noun like `checkout_started`), a *documented schema* (each event's meaning + required params), and reuse *recommended events*/params where they exist (for built-in reports). Keep events *purposeful* (tied to a question you'll ask), avoid *over-instrumenting* (noise) and *PII* (don't log personal data), and version/govern changes so the meaning stays stable over time. A shared spec (and a thin logging wrapper enforcing it) prevents the drift that makes analytics unanalyzable.",
      },
      {
        t: "list",
        items: [
          "**Convention** — snake_case verb_noun; documented schema.",
          "**Reuse** — recommended events/params for built-in reports.",
          "**Purposeful** — tied to a question; avoid noise + PII.",
          "**Govern** — a shared spec + logging wrapper enforces it.",
        ],
      },
      {
        t: "note",
        text: "Scalable event taxonomy: consistent naming (snake_case verb_noun like checkout_started), a documented schema (meaning + required params per event), reuse recommended events/params, keep events purposeful (avoid noise and PII), and govern changes so meaning stays stable. A shared spec plus a thin logging wrapper enforcing it prevents the drift that makes analytics unusable.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a funnel, and how does Analytics help you find drop-off?",
    a: [
      {
        t: "p",
        text: "A *funnel* is a sequence of steps toward a goal (e.g. `view_product → add_to_cart → begin_checkout → purchase`). Analytics (via funnel/exploration reports) shows *how many users complete each step* and *where they drop off* — the biggest drop is where you're losing conversions. This turns vague 'sales are low' into a specific 'we lose 60% at checkout', directing where to investigate (a bug? confusing UI?). Instrument each funnel step as an event to make this analysis possible.",
      },
      {
        t: "list",
        items: [
          "**Funnel** — ordered steps toward a goal.",
          "**Shows** — completion + drop-off per step.",
          "**Biggest drop** — where you lose conversions.",
          "**Instrument** — each step as an event.",
        ],
      },
      {
        t: "note",
        text: "A funnel is an ordered sequence toward a goal (view_product → add_to_cart → begin_checkout → purchase). Analytics' funnel/exploration reports show completion and drop-off per step — the biggest drop is where you lose conversions, turning 'sales are low' into 'we lose 60% at checkout' to direct investigation. Instrument each step as an event.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you integrate Firebase data with BigQuery, and why?",
    a: [
      {
        t: "p",
        text: "Firebase can *export raw Analytics (and Crashlytics) data to BigQuery* — giving you *every event, unaggregated*, queryable with SQL. Why: the console's reports are useful but *limited/sampled*; BigQuery lets you run *custom, precise analyses*, join with your own data (backend, CRM), build custom funnels/cohorts, and power dashboards (Looker/Data Studio). It's the path from 'canned reports' to 'answer any question'. Set up the export (daily or streaming) and query with cost-awareness (partition/limit scans).",
      },
      {
        t: "list",
        items: [
          "**Export** — raw Analytics/Crashlytics events to BigQuery.",
          "**Why** — unaggregated, SQL, join with your data.",
          "**Enables** — custom analyses, cohorts, dashboards.",
          "**Beyond** — the console's limited/sampled reports.",
        ],
      },
      {
        t: "note",
        text: "Firebase exports raw Analytics/Crashlytics data to BigQuery — every event, unaggregated, SQL-queryable. Why: console reports are limited/sampled; BigQuery enables custom precise analyses, joins with your backend/CRM data, custom funnels/cohorts, and dashboards (Looker). The path from canned reports to answering any question. Set up daily/streaming export; query cost-aware (partition/limit).",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you respect user privacy and consent with Analytics?",
    a: [
      {
        t: "p",
        text: "Don't log *PII* (names, emails, precise location) as event params/user properties — it violates policy and privacy. Honor *consent*: gate analytics collection on the user's choice (`setAnalyticsCollectionEnabled(false)` until consent), integrate a *Consent Mode* where required (GDPR/CCPA), and disclose collection in your *Data Safety* form and privacy policy. Provide opt-out. Respecting consent isn't just legal — mis-declaring data practices risks Play removal. Collect the minimum needed for your questions.",
      },
      {
        t: "list",
        items: [
          "**No PII** — in events/user properties.",
          "**Consent** — gate collection; Consent Mode for GDPR/CCPA.",
          "**Disclose** — Data Safety + privacy policy; offer opt-out.",
          "**Minimize** — collect only what you need.",
        ],
      },
      {
        t: "note",
        text: "Respect privacy: never log PII (names/emails/precise location) in params/properties; honor consent (gate collection until granted — setAnalyticsCollectionEnabled(false), Consent Mode for GDPR/CCPA); disclose in Data Safety + privacy policy; offer opt-out. Mis-declaring risks Play removal. Collect the minimum needed for your questions.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between Crashlytics and Play Console ANR/crash reporting?",
    a: [
      {
        t: "p",
        text: "*Crashlytics* is *SDK-based* — it captures crashes/non-fatals with your *custom keys/logs* and rich context, reports *quickly* (near real-time), and works for all installs (not just Play). *Play Console vitals* is *platform-level* — it reports crashes AND *ANRs* (which Crashlytics historically captured less well), across all Play users *without an SDK*, and is what Google uses for *discoverability thresholds*. Use both: Crashlytics for fast, detailed engineering triage; Play vitals for ANRs, platform-truth metrics, and the threshold view.",
      },
      {
        t: "table",
        headers: ["", "Crashlytics", "Play vitals"],
        rows: [
          ["Source", "SDK in your app", "Platform (no SDK)"],
          ["Detail", "Custom keys/logs, fast", "Aggregate, incl. ANRs"],
          ["Used for", "Engineering triage", "Discoverability thresholds"],
        ],
      },
      {
        t: "note",
        text: "Crashlytics: SDK-based, rich context (custom keys/logs), fast near-real-time, all installs. Play vitals: platform-level (no SDK), reports crashes AND ANRs across all Play users, drives Google's discoverability thresholds. Use both — Crashlytics for fast detailed triage, Play vitals for ANRs and platform-truth threshold metrics.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you make a production crash reproducible from a report?",
    a: [
      {
        t: "p",
        text: "Enrich reports so a trace becomes reproducible: *custom keys* for state (screen, inputs, flags, experiment), *breadcrumb logs* for the action sequence, *user/session context* (without PII), and *deobfuscated* traces. From those, reconstruct the *exact path and state*, write a *failing test* that reproduces it, then fix. If it's device/OS-specific (tag shows it), reproduce on that config (or Firebase Test Lab). The goal: never guess — the report should carry enough context to recreate the crash deterministically.",
      },
      {
        t: "list",
        items: [
          "**Enrich** — custom keys (state), breadcrumb logs (actions).",
          "**Deobfuscate** — readable traces.",
          "**Reconstruct** — path + state → failing test → fix.",
          "**Device-specific** — reproduce on that config / Test Lab.",
        ],
      },
      {
        t: "note",
        text: "Make crashes reproducible by enriching reports: custom keys (state — screen/inputs/flags), breadcrumb logs (action sequence), session context (no PII), deobfuscated traces. Reconstruct the exact path/state, write a failing test, then fix. Device/OS-specific? Reproduce on that config or Firebase Test Lab. Goal: the report carries enough to recreate the crash deterministically.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between logging to Logcat and to Crashlytics?",
    a: [
      {
        t: "p",
        text: "*Logcat* (`Log.d`) is *local, development-time* logging — visible only on a connected device, gone in production. *Crashlytics logs* (`crashlytics.log(...)`) are *attached to crash reports* and uploaded, so you can see the *breadcrumbs from a real user's crash* you'll never have a device for. Use Logcat for local debugging; use Crashlytics logs for the *context you need after a production crash*. Don't log sensitive data to either in a way that leaks; keep Crashlytics logs concise breadcrumbs.",
      },
      {
        t: "list",
        items: [
          "**Logcat** — local, dev-time; gone in production.",
          "**Crashlytics logs** — attached to reports, uploaded.",
          "**Crashlytics** — breadcrumbs from real users' crashes.",
          "**Neither** — should leak sensitive data.",
        ],
      },
      {
        t: "note",
        text: "Logcat (Log.d) is local dev-time logging — gone in production. Crashlytics logs (crashlytics.log) attach to crash reports and upload, giving breadcrumbs from real users' crashes you'll never have a device for. Logcat for local debugging; Crashlytics logs for post-production-crash context. Don't leak sensitive data to either; keep Crashlytics logs concise.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you monitor and act on a release using Crashlytics + Analytics together?",
    a: [
      {
        t: "p",
        text: "During a staged rollout: watch *Crashlytics* (crash-free rate, new/velocity issues on the new version) for *stability*, and *Analytics* for *behavioral regressions* (did a key funnel's conversion drop? did feature usage crater — a sign something silently broke without crashing?). Stability green but conversion down can mean a *non-crashing* bug (a broken button, a failed silent request). Combine: crash-free confirms it's not crashing; Analytics confirms users can still *do* the thing. Halt/forward-fix on either signal degrading.",
      },
      {
        t: "list",
        items: [
          "**Crashlytics** — crash-free, new/velocity issues (stability).",
          "**Analytics** — funnel/usage regressions (silent breakage).",
          "**Both green** — not crashing AND still usable.",
          "**Either degrades** — halt + forward-fix.",
        ],
      },
      {
        t: "note",
        text: "Monitor a rollout with both: Crashlytics (crash-free rate, new/velocity issues) for stability, Analytics (funnel conversion, feature usage) for behavioral regressions — a silent non-crashing bug (broken button/failed request) shows as dropped conversion, not a crash. Both green = not crashing AND still usable. Halt/forward-fix on either degrading.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is opt-in/opt-out for crash reporting, and when is it needed?",
    a: [
      {
        t: "p",
        text: "You can *disable Crashlytics collection* by default and enable it *only after user consent* (`setCrashlyticsCollectionEnabled(true)`) — needed where privacy regulations or your policy require consent before sending any data (including crash data, which can contain context). Some apps let users toggle 'send diagnostics'. Balance: you want crash data to fix bugs, but must honor consent/regulation. Declare crash-data collection in your *Data Safety* form. Default-on is common but confirm it's compliant for your audience.",
      },
      {
        t: "list",
        items: [
          "**Toggle collection** — `setCrashlyticsCollectionEnabled`.",
          "**Enable after consent** — where regulation/policy requires.",
          "**Declare** — crash-data collection in Data Safety.",
          "**Balance** — bug-fixing data vs consent.",
        ],
      },
      {
        t: "note",
        text: "You can disable Crashlytics collection by default and enable only after consent (setCrashlyticsCollectionEnabled(true)) — needed where regulation/policy requires consent before sending any data (crash reports carry context). Offer a 'send diagnostics' toggle; declare crash-data collection in Data Safety. Default-on is common but confirm compliance for your audience.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you avoid noisy or low-value crash reports drowning real issues?",
    a: [
      {
        t: "p",
        text: "Reduce noise: *don't record expected exceptions as non-fatals* (e.g. routine cancellations), *filter/ignore* known-benign issues in the console, *merge* wrongly-split issues, and *fix or suppress* high-volume-but-cosmetic ones so they don't mask serious crashes. Prioritize by *crash-free impact* and *velocity*, not raw count. Set up *alerts* only for meaningful spikes (not every issue). Keep custom logs *concise* (breadcrumbs, not spam). A curated Crashlytics is actionable; an unfiltered one is ignored.",
      },
      {
        t: "list",
        items: [
          "**Don't record** — expected exceptions as non-fatals.",
          "**Filter/merge** — benign or split issues.",
          "**Prioritize** — by impact/velocity, not raw count.",
          "**Alerts** — only meaningful spikes; concise logs.",
        ],
      },
      {
        t: "note",
        text: "Avoid crash-report noise: don't record expected exceptions (routine cancellations) as non-fatals, filter/ignore known-benign issues, merge split ones, fix/suppress high-volume cosmetic ones that mask real crashes. Prioritize by crash-free impact and velocity (not raw count); alert only on meaningful spikes; keep logs concise breadcrumbs. A curated Crashlytics is actionable; an unfiltered one gets ignored.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a non-fatal versus an ANR versus a crash, for triage?",
    a: [
      {
        t: "p",
        text: "Three distinct production quality signals: a *crash* is the app terminating from an uncaught exception (highest severity — user loses their session). An *ANR* is the app *freezing* (unresponsive main thread) — the user sees 'isn't responding' (bad, sometimes worse-perceived than a crash). A *non-fatal* is a *handled* error you logged — lower severity but a signal of degraded experience. Triage order roughly: crashes and ANRs by user impact first (they break the app), then high-signal non-fatals.",
      },
      {
        t: "list",
        items: [
          "**Crash** — app terminates (uncaught); highest severity.",
          "**ANR** — app freezes (main-thread block); often perceived worse.",
          "**Non-fatal** — handled error; degraded but not broken.",
          "**Triage** — crashes/ANRs by impact, then key non-fatals.",
        ],
      },
      {
        t: "note",
        text: "Crash = app terminates (uncaught exception). ANR = app freezes (unresponsive main thread — 'isn't responding', often perceived worse than a crash). Non-fatal = a handled error you logged (degraded, not broken). Triage crashes and ANRs by user impact first (they break the app), then high-signal non-fatals.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you set up alerting and on-call for production quality?",
    a: [
      {
        t: "p",
        text: "Configure *Crashlytics velocity alerts* and *new-issue* / *regression* alerts routed to *Slack/PagerDuty/email* (via integrations), plus *Play vitals* threshold alerts for crash/ANR rates. Define *thresholds* (crash-free drops below X, a new issue affects >Y sessions) and an *on-call* who triages within a set time. Tie in *rollout monitoring* so a regression at low % pages before wide exposure. Document a *runbook* (assess impact → flag-disable/halt → forward-fix). The goal: humans learn of regressions from alerts, not user reviews.",
      },
      {
        t: "list",
        items: [
          "**Alerts** — velocity/new-issue/regression → Slack/PagerDuty.",
          "**Play vitals** — crash/ANR threshold alerts.",
          "**Thresholds + on-call** — triage within a set time.",
          "**Runbook** — assess → flag-disable/halt → forward-fix.",
        ],
      },
      {
        t: "note",
        text: "Set up Crashlytics velocity/new-issue/regression alerts to Slack/PagerDuty/email, plus Play vitals threshold alerts. Define thresholds (crash-free below X, issue affects >Y sessions) and an on-call who triages promptly; wire rollout monitoring so low-% regressions page early. Keep a runbook (assess → flag-disable/halt → forward-fix). Goal: learn of regressions from alerts, not reviews.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are the limits of Analytics data (sampling, latency, cardinality)?",
    a: [
      {
        t: "p",
        text: "Console reports can be *sampled* (approximated at scale) and *delayed* (standard events process ~a day; DebugView is real-time). *Parameter cardinality* is limited — high-cardinality custom dimensions (e.g. user id) aren't good analytics params (and PII is banned). There are *quotas* on custom events/params/user properties. For precise, unsampled, low-latency analysis, use the *BigQuery export*. Knowing these limits prevents mis-reading reports (e.g. treating sampled numbers as exact or expecting instant data).",
      },
      {
        t: "list",
        items: [
          "**Sampling** — reports approximate at scale.",
          "**Latency** — ~1 day standard (DebugView real-time).",
          "**Cardinality/quotas** — limited params/dimensions; no PII.",
          "**Precise** — use the BigQuery export.",
        ],
      },
      {
        t: "note",
        text: "Analytics limits: console reports may be sampled (approximate at scale) and delayed (~1 day; DebugView real-time); parameter cardinality and custom event/property counts are quota-limited (and no PII/high-cardinality ids). For precise, unsampled, low-latency analysis use the BigQuery export. Knowing these prevents mis-reading sampled numbers as exact or expecting instant data.",
      },
    ],
  },
];

export default qa;
