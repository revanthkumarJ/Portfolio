// Crashlytics & Analytics — Content tab. Teaching-first.

const content = [
  {
    heading: "Crashlytics — production crash reporting",
    blocks: [
      {
        t: "p",
        text: "**Firebase Crashlytics** is a crash-reporting tool: it automatically captures crashes (and non-fatal errors) that happen on real users' devices in production, and reports them to a dashboard with the *stack trace*, device/OS info, and context. You can't reproduce every crash yourself — Crashlytics is how you *find out* what's crashing for real users, *how often*, and *on which devices*, so you can prioritize and fix. It's essentially a requirement for any production app; shipping without crash reporting means flying blind.",
      },
      {
        t: "list",
        items: [
          "**Automatic crash capture** — it hooks into the app and records unhandled exceptions/crashes with full stack traces, sending them when the app next has connectivity. You add the SDK, and crashes are reported with no per-crash code.",
          "**Grouping** — it intelligently *groups* identical crashes into a single issue (with a count of affected users/occurrences), so you see 'this crash affects 500 users' rather than 500 separate reports — letting you prioritize by impact.",
          "**Context** — each report includes device model, OS version, app version, and a *breadcrumb log* of events leading up to the crash (you can log custom keys/events), which helps diagnose *why* it happened.",
          "**Non-fatal reporting** — you can also record *handled* exceptions (`recordException`) — errors you caught but want to track (a failed API call, a recoverable error) — to monitor issues that don't crash the app.",
        ],
      },
    ],
  },
  {
    heading: "Crashlytics and R8 — the mapping file",
    blocks: [
      {
        t: "p",
        text: "A critical integration point: release builds are *obfuscated* by R8 (class/method names renamed to `a`, `b`, `c`), so raw crash stack traces from production are *unreadable*. Crashlytics de-obfuscates them using the **R8 mapping file** — but only if the mapping file is uploaded for that build.",
      },
      {
        t: "list",
        items: [
          "**The Crashlytics Gradle plugin automatically uploads the mapping file** for each release build, so Crashlytics can translate obfuscated stack traces back to real class/method names — making crash reports readable.",
          "**If the mapping isn't uploaded** (misconfiguration), crash reports show obfuscated names (`a.b.c()`) and are useless — you can't tell what crashed. So verifying the mapping upload is part of a correct Crashlytics setup.",
          "**Per-build mapping** — R8 obfuscates differently per build, so each version's mapping de-obfuscates only that version's crashes; the plugin handles associating the right mapping with the right build automatically.",
          "This is the same mapping-file concept from the R8/distribution topic, applied to crash reporting — the mapping is what makes obfuscated production crashes debuggable.",
        ],
      },
    ],
  },
  {
    heading: "Firebase Analytics — understanding user behavior",
    blocks: [
      {
        t: "p",
        text: "**Firebase Analytics** (Google Analytics for Firebase) tracks *what users do* in your app — which screens they visit, which features they use, where they drop off — by logging *events*. It answers product questions: which features are used, where users abandon a flow, what drives engagement/retention. It's about *behavior* (product/business insight), distinct from Crashlytics (*stability*) and performance monitoring (*speed*).",
      },
      {
        t: "code",
        title: "Logging events",
        code: `val analytics = Firebase.analytics

// Log a custom event with parameters
analytics.logEvent("add_to_cart") {
    param("item_id", itemId)
    param("item_name", itemName)
    param("value", price)
}

// Automatic events (screen views, first open, session) are logged for you
// Set user properties for segmentation:
analytics.setUserProperty("subscription_tier", "premium")`,
      },
      {
        t: "list",
        items: [
          "**Events** — the core unit: something the user did (`add_to_cart`, `level_complete`, `search`), optionally with *parameters* (item id, value). Some events are *automatic* (screen views, first open, sessions); you add *custom* events for your app's specific actions.",
          "**User properties** — attributes for *segmenting* users (subscription tier, user type, region), so you can analyze behavior by segment ('do premium users use this feature more?').",
          "**Funnels & retention** — analyze multi-step flows (how many complete checkout vs abandon at each step) and how users return over time — key product metrics.",
          "**Integration** — Analytics feeds *audiences* used by other Firebase tools (Remote Config targeting, A/B testing, FCM campaigns), and can export raw data to BigQuery for deep analysis.",
        ],
      },
    ],
  },
  {
    heading: "Performance Monitoring and the observability picture",
    blocks: [
      {
        t: "list",
        items: [
          "**Firebase Performance Monitoring** — tracks *how fast* your app is in the field: automatic traces for app startup time, screen rendering (slow/frozen frames), and network request timing (success rate, latency, payload size), plus custom traces you define. It's the *performance* pillar — telling you real-world speed across devices, complementing local profiling (which tells you *why*).",
          "**The three observability pillars** — a well-instrumented app tracks: **stability** (Crashlytics — what's crashing), **behavior** (Analytics — what users do), and **performance** (Performance Monitoring — how fast). Together they tell you the real-world health of your app across millions of devices you'll never touch.",
          "**Why it matters**: production is the ultimate test environment — real devices, real networks, real usage at scale reveal issues your testing can't. Observability tools are your eyes into that, turning 'users complain it's buggy/slow' into specific, prioritizable, actionable data (this crash affects X users, this screen is slow on these devices, users abandon at this step).",
          "**Privacy considerations** — analytics and crash data must respect user privacy: comply with consent requirements (GDPR), don't log PII (personally identifiable info) in events/crash logs, and honor the Play Data Safety declarations. Handle data collection responsibly.",
        ],
      },
      {
        t: "note",
        text: "Crashlytics: automatic production crash reporting (stack traces, device context, grouped by issue with impact counts; also non-fatal recordException). Needs the R8 mapping file uploaded (the Gradle plugin does it) to de-obfuscate release crashes — else reports are unreadable. Analytics: track user behavior via events (+ params) and user properties (segmentation); funnels/retention; feeds audiences for Remote Config/A-B/FCM; exports to BigQuery. Performance Monitoring: real-world speed (startup, rendering, network). Together = the observability pillars (stability, behavior, performance). Respect privacy (consent, no PII).",
      },
    ],
  },
];

export default content;
