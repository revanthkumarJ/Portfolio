// Remote Config, A/B Testing & App Distribution — Content tab. Teaching-first.

const content = [
  {
    heading: "Remote Config — change behavior without a release",
    blocks: [
      {
        t: "p",
        text: "**Firebase Remote Config** lets you define values (feature flags, config parameters, content) *on the server* that your app fetches at runtime — so you can change your app's behavior *without shipping an app update*. This is powerful: you can toggle features on/off, adjust settings, change UI text or thresholds, or roll out features gradually, all from the Firebase console, and the change reaches users on their next config fetch — no new release, no review, no waiting for users to update.",
      },
      {
        t: "code",
        title: "Using Remote Config",
        code: `val remoteConfig = Firebase.remoteConfig
remoteConfig.setDefaultsAsync(R.xml.remote_config_defaults)  // local fallback defaults

// Fetch and activate the server values
remoteConfig.fetchAndActivate().addOnCompleteListener {
    val newCheckoutEnabled = remoteConfig.getBoolean("new_checkout_enabled")
    val maxItems = remoteConfig.getLong("max_items")
    val bannerText = remoteConfig.getString("promo_banner")
    // Use the values to drive behavior
}`,
      },
      {
        t: "list",
        items: [
          "**Feature flags** — the killer use: ship a feature *behind a flag* (disabled by default), then enable it remotely — gradually (to a % of users), for specific segments, or instantly. This *decouples deploying code from releasing a feature*: the code is in the app, but the feature is off until you flip the flag server-side.",
          "**Kill switch** — if a feature causes problems in production, *disable it via the flag* instantly, *without an app release* — the fastest possible mitigation for a bad feature (covered in the release-safety topic). This is a huge operational advantage.",
          "**Targeting** — you can serve different values to different *conditions*: user segments (audiences from Analytics), app version, country, percentage (for gradual rollout / A/B). So a feature can be on for beta users, off for everyone else, or on for 10% of users.",
          "**Defaults & fetch** — you set *local defaults* (used before/without a fetch, so the app works offline and on first run), then `fetchAndActivate` pulls server values (throttled/cached — you don't fetch every launch). The app reads the active values.",
        ],
      },
    ],
  },
  {
    heading: "A/B Testing",
    blocks: [
      {
        t: "p",
        text: "**Firebase A/B Testing** builds on Remote Config and Analytics to run *experiments*: serve different variants of a feature/config to different user groups and measure which performs better against a goal (conversion, retention, engagement). Instead of guessing whether a new checkout flow or button color is better, you *test it* on a slice of users and let the data decide.",
      },
      {
        t: "list",
        items: [
          "**How it works**: you define variants via Remote Config values (variant A = old flow, variant B = new flow), assign each to a portion of users, and pick a *goal metric* (Analytics event — e.g. purchases). Firebase splits users, serves the variants, and reports which variant improved the metric with statistical confidence.",
          "**Why**: data-driven product decisions. Rather than shipping a change to everyone and hoping it helps (or hurts), you validate it on a controlled experiment first — reducing the risk of a change that *seems* good but actually decreases conversion.",
          "**Combines the tools**: Remote Config (delivers variants), Analytics (measures the goal + segments users), and the experiment framework (splits users, computes significance). It's the 'measure before committing' principle applied to product features.",
        ],
      },
    ],
  },
  {
    heading: "App Distribution — getting builds to testers",
    blocks: [
      {
        t: "p",
        text: "**Firebase App Distribution** is a service for distributing *pre-release* builds (debug/staging/beta APKs or AABs) to your *testers* — QA, stakeholders, beta users — *outside* the Play Store. It's for getting a build into testers' hands quickly during development, without going through Play's tracks/review. You upload a build (manually or from CI), and testers get a notification/link to install it.",
      },
      {
        t: "list",
        items: [
          "**The problem it solves**: during development you need to share builds with testers *fast* and *frequently* — before they're ready for even Play's internal track, or for people/builds you don't want on Play at all. App Distribution makes this easy: upload a build, add tester emails/groups, they install via a link.",
          "**vs Play testing tracks**: Play's internal/closed/open tracks distribute through Play (real Play delivery/signing, tied to your Play listing). App Distribution is *outside* Play — simpler and faster for early dev builds and ad-hoc sharing, but not the real Play delivery pipeline. Use App Distribution for *dev/QA iteration*, Play tracks for *pre-production validation of the real artifacts*.",
          "**CI integration** — you typically wire App Distribution into CI so every merge/build is automatically distributed to testers, giving continuous access to the latest build. Combined with a tester feedback channel, it tightens the dev→test loop.",
          "**Tester management** — organize testers into groups (QA, design, stakeholders) and control who gets which builds.",
        ],
      },
    ],
  },
  {
    heading: "The Firebase ecosystem — how it fits together",
    blocks: [
      {
        t: "list",
        items: [
          "**Firebase is a suite** of backend/infrastructure services that save you building common things: FCM (push), Crashlytics (crashes), Analytics (behavior), Performance (speed), Remote Config (dynamic config/flags), A/B Testing (experiments), App Distribution (test builds), Auth (sign-in), Firestore/Realtime DB (databases), Cloud Functions (serverless backend), Storage (files), and more.",
          "**They interconnect**: Analytics builds *audiences* that Remote Config, A/B Testing, and FCM campaigns target; Remote Config powers A/B tests; Crashlytics + Performance + Analytics form observability. The value is an integrated toolkit where the pieces reinforce each other.",
          "**When to use Firebase**: it's excellent for shipping fast without building infrastructure — great for startups, MVPs, and standard app needs (push, crashes, analytics, flags are near-universal). The tradeoffs: vendor lock-in (Google), cost at scale, and less control than a custom backend. For an Android engineer, the near-universal ones — Crashlytics, Analytics, FCM, Remote Config — are worth knowing deeply; the rest are situational.",
          "**Remote Config's operational power is the standout**: the ability to flip features and configuration server-side without a release is transformative for release safety (kill switches, gradual rollout, decoupling deploy from release) — which is why it recurs in the release-safety discussion.",
        ],
      },
      {
        t: "note",
        text: "Remote Config: server-defined values (flags, config, content) the app fetches → change behavior WITHOUT a release. Feature flags decouple deploy from release; kill switch disables a bad feature instantly; targeting by segment/version/%/country; local defaults + fetchAndActivate. A/B Testing: run experiments (variants via Remote Config, goal via Analytics) — data-driven decisions. App Distribution: share pre-release builds with testers outside Play (fast dev/QA iteration, CI-integrated) — vs Play tracks for real-artifact validation. Firebase is an integrated suite; the near-universal ones (Crashlytics, Analytics, FCM, Remote Config) are worth knowing well.",
      },
    ],
  },
];

export default content;
