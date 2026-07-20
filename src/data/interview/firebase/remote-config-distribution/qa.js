// Remote Config, A/B Testing & App Distribution — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What is Firebase Remote Config and what can you use it for?",
    a: [
      {
        t: "p",
        text: "**Remote Config lets you define values (feature flags, config parameters, content) on the server that your app fetches at runtime, so you can change your app's behavior *without shipping an update*.** You set values in the Firebase console, the app fetches them, and the change reaches users on their next fetch — no new release, no Play review, no waiting for users to update.",
      },
      {
        t: "list",
        items: [
          "**Feature flags** — ship a feature *behind a flag* (off by default), then enable it remotely, gradually or for specific segments. This decouples *deploying code* from *releasing a feature*.",
          "**Kill switch** — if a feature causes problems in production, disable it via the flag *instantly, without an app release* — the fastest way to mitigate a bad feature.",
          "**Gradual rollout / targeting** — serve different values to different users by segment, app version, country, or percentage, so you can roll a feature out to 10% of users, or turn it on only for beta users.",
          "**Config without a release** — adjust thresholds, URLs, promotional text, or settings server-side.",
        ],
      },
      {
        t: "p",
        text: "The power is the ability to *change behavior server-side without going through the whole build-release-review-adopt cycle*. You set *local defaults* (so the app works on first run and offline), then `fetchAndActivate` pulls the server values (cached/throttled — you don't fetch every launch). This is transformative for release safety: shipping risky features behind flags means you can enable them gradually and *turn them off instantly* if they misbehave — a kill switch that needs no release. It's why Remote Config is one of the near-universal Firebase tools worth knowing well.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is Firebase A/B Testing?",
    a: [
      {
        t: "p",
        text: "**Firebase A/B Testing lets you run experiments — serve different variants of a feature or config to different groups of users and measure which performs better against a goal (conversion, retention, engagement) — so you make data-driven product decisions instead of guessing.** It builds on Remote Config (to deliver the variants) and Analytics (to measure the outcome).",
      },
      {
        t: "list",
        items: [
          "**How it works**: you define variants as Remote Config values (variant A = current design, variant B = new design), assign each to a portion of users, and pick a *goal metric* (an Analytics event, e.g. purchases). Firebase splits users, serves the variants, measures the goal, and reports which variant improved it with statistical confidence.",
          "**Why**: rather than shipping a change to everyone and hoping it helps, you *test* it on a controlled slice first and let the data decide. This catches changes that *seem* better but actually hurt (a redesign that lowers conversion).",
          "**Combines the tools**: Remote Config (delivers variants), Analytics (measures + segments), and the experiment framework (splits users, computes significance).",
        ],
      },
      {
        t: "p",
        text: "It's the 'measure before committing' principle applied to product features — the same data-driven discipline as profiling before optimizing, but for product decisions. Instead of debates about which design or flow is better, you run an experiment and the metrics answer. Once a winning variant is proven, you roll it out to everyone (via Remote Config). This reduces the risk of large product changes and grounds decisions in evidence rather than opinion — valuable for any feature where you're uncertain of the impact.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is Firebase App Distribution and how does it differ from Play testing tracks?",
    a: [
      {
        t: "p",
        text: "**Firebase App Distribution is a service for distributing pre-release builds (debug/staging/beta APKs or AABs) to your testers — QA, stakeholders, beta users — *outside* the Play Store. You upload a build (often from CI), add testers, and they get a link to install it.** It's for getting builds into testers' hands quickly during development, without going through Play's tracks or review.",
      },
      {
        t: "list",
        items: [
          "**App Distribution** — distributes *outside* Play, directly to testers you specify. Fast and simple: upload a build, add tester emails/groups, they install via a link/notification. No Play review, no tie to your Play listing. Great for frequent dev/QA iteration and ad-hoc sharing.",
          "**Play testing tracks** (internal/closed/open) — distribute *through* Play, using the real Play delivery and signing pipeline, tied to your Play listing. Slower to set up but they validate the *actual* Play-delivered, Play-signed artifacts and the release process itself.",
        ],
      },
      {
        t: "p",
        text: "So the distinction is *dev/QA iteration* vs *pre-production validation of the real thing*. Use App Distribution during active development to share the latest builds with testers rapidly (typically wired into CI so every build is distributed automatically, tightening the dev→test loop). Use Play testing tracks when you're closer to release and want to verify the genuine Play-generated APKs and delivery mechanics before production. They're complementary — App Distribution for fast internal iteration, Play tracks for validating the real release pipeline. A common workflow: CI distributes every build via App Distribution for QA, and release candidates go to Play internal testing before promoting toward production.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does Remote Config enable safer releases, and what are the pitfalls to watch for?",
    a: [
      {
        t: "p",
        text: "**Remote Config enables safer releases primarily by *decoupling deploying code from releasing a feature* — you ship features behind flags (off by default) and enable them server-side gradually, with the ability to instantly disable (kill-switch) a problematic feature *without an app release*. This transforms release risk: the riskiest changes become reversible in minutes, not a multi-day release cycle. But there are real pitfalls in defaults, fetch behavior, and flag hygiene.**",
      },
      {
        t: "list",
        items: [
          "**Decoupling deploy from release**: ship the feature code in the app binary but gated behind a flag defaulting to *off*. The binary reaches users (via normal release), but the feature stays dark until you enable the flag server-side. Then you can enable it *gradually* (10% → 50% → 100% via percentage targeting), for *specific segments* (beta users first), and *monitor* (Crashlytics/Analytics) as you ramp — catching problems at low exposure, just like a staged rollout but at the *feature* level and *without* needing a new binary.",
          "**Kill switch — the standout safety benefit**: if an enabled feature causes crashes or issues, flip the flag *off* and users' apps disable it on their next config fetch — the *fastest* production mitigation available (minutes, no release, no review). This is why 'ship risky features behind a flag' is a core release-safety practice: it turns 'critical bug at 100%' from a hotfix scramble into a config toggle.",
          "**Experimentation and targeted rollout**: combined with A/B testing, you validate a feature on a slice before full rollout, and targeting lets you enable features per version/segment/region — reducing the blast radius of any change.",
        ],
      },
      {
        t: "list",
        items: [
          "**Pitfall 1 — defaults and offline/first-run**: the app must have sensible *local defaults* (in-app fallback values) because before the first successful fetch (first launch, offline), Remote Config returns the defaults. If your defaults are wrong (a feature defaulting *on* that should be off, or unsafe values), users get bad behavior until a fetch succeeds. Always set safe local defaults — typically new features default *off* — so the pre-fetch state is safe.",
          "**Pitfall 2 — fetch timing and caching**: Remote Config *caches* values and *throttles* fetches (you can't fetch every launch — there are minimum fetch intervals to avoid hammering the server). So a flag change *doesn't* reach all users instantly — it propagates as their apps fetch (which may be minutes to hours depending on your fetch interval and app usage). For a kill switch you want a *short* fetch interval so disabling reaches users fast, but too short wastes resources — a real tradeoff. And a user who never opens the app won't get the change. So Remote Config is *not* instant for everyone; understand the propagation delay.",
          "**Pitfall 3 — flag rot / complexity**: flags accumulate. A codebase littered with stale flags (features fully rolled out but never cleaned up, dead code behind permanently-off flags) becomes hard to reason about — every flag is a branch, and N flags = 2^N possible states, most untested. Discipline: *remove flags* once a feature is fully rolled out and stable (clean up the flag *and* the code path), and don't gate everything behind flags — reserve them for genuinely risky or gradually-rolled-out features.",
          "**Pitfall 4 — testing the combinations**: because flags create branching behavior, you must test *both* states of important flags (on and off), and the app must behave correctly for *any* combination of flag values the server might send (including unexpected ones). A feature that only works with a specific flag combination is fragile.",
          "**Pitfall 5 — security/trust**: don't put secrets in Remote Config (it's fetched to the client, not secret), and validate/sanitize values (a malformed server value shouldn't crash the app — hence robust defaults and type-safe reads).",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: Remote Config's release-safety value comes from *decoupling code deployment from feature activation* — ship dark, enable gradually server-side, and kill instantly if needed — which makes the riskiest changes reversible without a release, the single most powerful safety mechanism for a large app. But it's not magic: the safety depends on *safe defaults* (for the pre-fetch/offline state), understanding *propagation delay* (it's not instant — flags reach users as they fetch, so a kill switch has a short-but-nonzero lag and misses inactive users), and *flag hygiene* (removing stale flags to avoid combinatorial complexity and dead code). The mature perspective is that flags are a powerful *operational* tool with a real *maintenance cost* — use them deliberately for risky/gradual features, default new features off, tune fetch intervals for your kill-switch responsiveness needs, and *retire* flags after rollout. Demonstrating both the decouple-and-kill-switch benefit *and* the defaults/propagation/flag-rot pitfalls — rather than treating Remote Config as a free instant control — is the balanced senior answer.",
      },
    ],
  },
  {
    level: "senior",
    q: "When would you choose Firebase for a project, and what are the tradeoffs?",
    a: [
      {
        t: "p",
        text: "**Firebase is an integrated suite of backend/infrastructure services that lets you ship fast without building common infrastructure yourself — I'd choose it when speed-to-market and standard needs (push, crashes, analytics, flags, auth, a database) outweigh the desire for full control, which is true for most startups, MVPs, and standard apps. The tradeoffs are vendor lock-in, cost at scale, and less control than a custom backend.**",
      },
      {
        t: "list",
        items: [
          "**What Firebase gives you**: FCM (push), Crashlytics (crashes), Analytics (behavior), Performance (speed), Remote Config (flags/config), A/B Testing (experiments), App Distribution (test builds), Auth (sign-in with many providers), Firestore/Realtime DB (databases with real-time sync and offline support), Cloud Functions (serverless), Storage (files). These cover a huge fraction of what a typical app backend needs, pre-built and interconnected.",
          "**Why choose it — speed and integration**: you avoid building and operating infrastructure (a push service, crash pipeline, analytics, auth, a real-time database with offline sync). For a small team or an MVP, this is enormous leverage — you focus on the app, not the backend. And the pieces *interconnect* (Analytics audiences → Remote Config/A-B/FCM targeting; Crashlytics + Performance + Analytics = observability), so the whole is more than the parts. Near-universal needs — crash reporting, analytics, push, feature flags — are genuinely well-served and worth adopting almost regardless.",
        ],
      },
      {
        t: "list",
        items: [
          "**Tradeoff 1 — vendor lock-in**: your app becomes coupled to Google's ecosystem — Firestore's data model, Auth's flows, FCM's mechanics. Migrating off later is costly. Mitigate by *abstracting* Firebase behind your own interfaces (a repository over Firestore, an auth abstraction) so the coupling is contained, and by being deliberate about which services you deeply depend on (crash/analytics/push are easy to swap; a Firestore-centric data model is not).",
          "**Tradeoff 2 — cost at scale**: Firebase's pricing (especially Firestore reads/writes, Cloud Functions, and bandwidth) can become expensive as you grow — usage-based pricing that's cheap at small scale can surprise you at large scale. A cost model that's fine for an MVP might favor a custom backend at millions of users. Evaluate the cost trajectory, not just the starting price.",
          "**Tradeoff 3 — less control and flexibility**: managed services do things *their* way. Firestore's query capabilities are limited compared to a full SQL database (no complex joins, restricted queries); Auth's flows are prescribed; you can't tune the infrastructure. For apps with unusual requirements (complex data relationships, specific compliance/data-residency needs, heavy custom backend logic), the constraints chafe, and a custom backend gives control the managed service can't.",
          "**Tradeoff 4 — data and compliance**: your data lives on Google's infrastructure, which raises data-residency, privacy, and compliance considerations (GDPR, region requirements) that some organizations can't accept.",
        ],
      },
      {
        t: "list",
        items: [
          "**A pragmatic middle path**: use Firebase's *observability and operational* tools (Crashlytics, Analytics, Performance, Remote Config, FCM) almost universally — they're low-lock-in, high-value, and hard to justify building yourself — while being more *deliberate* about the *data/backend* services (Firestore, Auth, Functions) where lock-in and cost are higher and a custom or hybrid backend may be warranted as you scale. Abstract the deeper dependencies behind interfaces to preserve optionality.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: the Firebase decision is a classic *buy vs build* / *managed vs custom* tradeoff — you're trading *control, long-term cost, and flexibility* for *speed, reduced operational burden, and integration*. For most apps early on, that trade strongly favors Firebase: shipping fast with proven infrastructure beats building your own, and the observability tools (crashes, analytics, push, flags) are near-universal wins. The nuance is recognizing *which* services carry more lock-in/cost risk (data-layer: Firestore, Auth, Functions) versus which are low-risk high-value (Crashlytics, Analytics, FCM, Remote Config), and *architecting to contain the deeper dependencies* (abstractions/repositories) so you keep optionality as scale and requirements evolve. The immature answer is 'Firebase is great, use it for everything' or 'never use it, build your own'; the mature answer is a *differentiated* view — adopt the low-lock-in operational tools freely, be deliberate and abstraction-guarded about the data-layer services, and re-evaluate the cost/control tradeoff as you scale. Demonstrating that buy-vs-build framing with the specific lock-in/cost/control tradeoffs and the service-differentiated, abstraction-guarded strategy is the comprehensive senior answer.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does Remote Config fetch, cache, and activate values?",
    a: [
      {
        t: "p",
        text: "Remote Config has a two-step model: *fetch* downloads the latest values from the server into a *pending cache*, and *activate* makes them the *active* values your app reads. This separation lets you fetch in the background but *apply changes at a safe moment* (e.g. next launch, not mid-session). A *minimum fetch interval* throttles server calls (default ~12h in production; lower for dev). Values are *cached locally*, so the app has usable config offline. Common pattern: `fetchAndActivate()` on startup, then read config.",
      },
      {
        t: "list",
        items: [
          "**Fetch** — download to a pending cache.",
          "**Activate** — promote pending → active (read by app).",
          "**Separation** — apply changes at a safe moment.",
          "**Fetch interval** — throttles calls (~12h prod); cached offline.",
        ],
      },
      {
        t: "note",
        text: "Remote Config: fetch downloads latest values to a pending cache; activate promotes them to active (what the app reads) — so you apply changes at a safe moment (next launch), not mid-session. A minimum fetch interval throttles calls (~12h prod). Values cache locally (works offline). Common: fetchAndActivate() on startup, then read.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are default values in Remote Config, and why set them?",
    a: [
      {
        t: "p",
        text: "*In-app defaults* (`setDefaultsAsync`) are the values the app uses *before any successful fetch* — on first launch, offline, or if the fetch fails. Setting sensible defaults ensures the app *always has valid config* and behaves correctly without the network. Best practice: defaults should represent the *safe/baseline* behavior, and server values override them when available. Never rely on a fetch having succeeded to have usable config — always ship defaults matching your intended baseline.",
      },
      {
        t: "list",
        items: [
          "**Defaults** — used before/without a successful fetch.",
          "**Cover** — first launch, offline, fetch failure.",
          "**Safe baseline** — server overrides when available.",
          "**Always ship them** — never assume a fetch succeeded.",
        ],
      },
      {
        t: "note",
        text: "In-app defaults (setDefaultsAsync) are used before any successful fetch — first launch, offline, or fetch failure — so the app always has valid config. Make them the safe/baseline behavior; server values override when available. Never rely on a fetch having succeeded; always ship defaults matching your intended baseline.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are Remote Config conditions, and how do you target segments?",
    a: [
      {
        t: "p",
        text: "*Conditions* let a parameter serve *different values to different users* based on rules: app version, platform, language/country, user *Analytics audience*, a *percentage* of users (random), or a user property. So you can enable a feature for 10% of users, or only on app version ≥ X, or only for 'premium' audience. This powers *gradual rollouts*, *targeting*, and *A/B tests* without a new app release. Conditions are evaluated server-side per fetch, so the same parameter resolves per-user.",
      },
      {
        t: "list",
        items: [
          "**Conditions** — rules serving different values per user.",
          "**Criteria** — version, platform, country, audience, %.",
          "**Enables** — gradual rollout, targeting, A/B tests.",
          "**Server-evaluated** — per user, per fetch.",
        ],
      },
      {
        t: "note",
        text: "Remote Config conditions serve different parameter values by rules — app version, platform, country/language, Analytics audience, a random percentage, or user property. Enable a feature for 10%, or only version ≥ X, or 'premium' audience — powering gradual rollouts, targeting, and A/B tests without a release. Evaluated server-side per user per fetch.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you implement a feature flag / kill switch with Remote Config?",
    a: [
      {
        t: "p",
        text: "Add a boolean parameter (e.g. `new_checkout_enabled`), gate the feature on it (`if (config.getBoolean(\"new_checkout_enabled\")) ...`), and ship the feature *off by default*. You can then *turn it on* (globally or for a % / audience) *without a release*, and — crucially — *turn it off instantly* if it misbehaves (a *kill switch*), which is vital since you can't roll back an app version. Fetch/activate at startup so the flag is current; consider `realtime Remote Config` for near-instant propagation of a kill.",
      },
      {
        t: "code",
        title: "Flag-gated feature",
        code: `// default false; enable server-side gradually, kill instantly if broken\nif (Firebase.remoteConfig.getBoolean("new_checkout_enabled")) {\n  showNewCheckout()\n} else {\n  showLegacyCheckout()\n}`,
      },
      {
        t: "note",
        text: "Feature flag/kill switch: a boolean parameter gating the feature, shipped off by default — turn it on gradually (%/audience) without a release and turn it off instantly if broken (kill switch, vital since apps can't roll back). Fetch/activate at startup so it's current; use realtime Remote Config for near-instant kill propagation.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is realtime Remote Config, and when is it useful?",
    a: [
      {
        t: "p",
        text: "*Realtime Remote Config* lets the app *subscribe* (`addOnConfigUpdateListener`) and be *notified within seconds* when config changes on the server, then fetch/activate — instead of waiting for the next periodic fetch. Useful for *fast kill switches* (disable a broken feature and have live users pick it up quickly), live-event toggles, or urgent config changes. Handle updates carefully (apply at a safe point, not disruptively mid-flow). It complements the throttled periodic model with a push channel for urgency.",
      },
      {
        t: "list",
        items: [
          "**Realtime** — subscribe; notified in seconds of changes.",
          "**Then** — fetch/activate immediately.",
          "**Useful** — fast kill switch, live toggles, urgent changes.",
          "**Apply carefully** — at a safe point, not mid-flow.",
        ],
      },
      {
        t: "note",
        text: "Realtime Remote Config lets the app subscribe (addOnConfigUpdateListener) and get notified within seconds of server changes, then fetch/activate — instead of waiting for the periodic fetch. Useful for fast kill switches, live-event toggles, urgent changes. Apply updates at a safe point (not disruptively mid-flow). A push channel complementing the throttled periodic model.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is Firebase A/B Testing, and how does it relate to Remote Config?",
    a: [
      {
        t: "p",
        text: "*A/B Testing* builds on Remote Config (and/or Notifications): you define *variants* (different Remote Config values), Firebase *randomly assigns* users to variants, and it measures a *goal metric* (via Analytics — conversion, retention, revenue) with *statistical significance*, telling you which variant wins. So Remote Config *delivers* the variant values; A/B Testing *orchestrates the experiment and analysis*. Use it to make *data-driven* decisions (does the new onboarding actually improve retention?) rather than guessing.",
      },
      {
        t: "list",
        items: [
          "**Built on** — Remote Config variants.",
          "**Firebase** — randomizes users, measures a goal via Analytics.",
          "**Significance** — tells you the winning variant.",
          "**Data-driven** — decisions vs guessing.",
        ],
      },
      {
        t: "note",
        text: "Firebase A/B Testing builds on Remote Config: define variants (different config values), Firebase randomly assigns users and measures a goal metric via Analytics with statistical significance to find the winner. Remote Config delivers variant values; A/B Testing orchestrates the experiment/analysis — data-driven decisions (does new onboarding improve retention?) instead of guessing.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you run a statistically valid A/B test?",
    a: [
      {
        t: "p",
        text: "Define *one clear hypothesis* and a *primary goal metric* upfront, *randomize* users into control + variant(s), size the experiment for enough *sample/duration* to reach *significance* (don't peek and stop early — that inflates false positives), and change *one variable* so you know what caused the result. Guard against *novelty effects* (run long enough) and *seasonality*. Only ship the winner if the lift is significant *and* meaningful. Firebase computes significance; your job is a sound design and honest interpretation.",
      },
      {
        t: "list",
        items: [
          "**One hypothesis + primary metric** — defined upfront.",
          "**Randomize** — control + variants; change one variable.",
          "**Sufficient sample/duration** — for significance; don't peek.",
          "**Guard** — novelty/seasonality; ship only significant + meaningful.",
        ],
      },
      {
        t: "note",
        text: "Valid A/B test: one hypothesis + a primary goal metric upfront, randomize into control + variant(s), run long enough for significance (don't peek/stop early — inflates false positives), change one variable. Guard against novelty effects/seasonality; ship the winner only if the lift is significant AND meaningful. Firebase computes significance; you own sound design + honest interpretation.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is Firebase App Distribution, and how does it differ from Play testing tracks?",
    a: [
      {
        t: "p",
        text: "*App Distribution* distributes *pre-release builds* (APK or AAB) to a chosen list of *testers* directly (via email invite / a tester app), *without going through Play review* — so it's *fast and flexible* for internal/QA/stakeholder builds. Play *testing tracks* go through Play's pipeline (review-lite, Play delivery) and are a step toward production. Use App Distribution for quick dogfooding and ad-hoc test builds (even debuggable ones); use Play tracks for structured pre-release testing on the path to release.",
      },
      {
        t: "table",
        headers: ["", "App Distribution", "Play tracks"],
        rows: [
          ["Review", "None", "Play pipeline"],
          ["Speed", "Fast, ad-hoc", "Slower, structured"],
          ["Use", "Dogfooding/QA builds", "Pre-release toward prod"],
        ],
      },
      {
        t: "note",
        text: "Firebase App Distribution sends pre-release builds (APK/AAB) directly to a tester list (email/tester app) without Play review — fast, flexible for internal/QA/stakeholder builds. Play testing tracks go through Play's pipeline toward production. Use App Distribution for quick dogfooding/ad-hoc builds; Play tracks for structured pre-release testing on the release path.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does Remote Config enable safer releases, and what are the pitfalls?",
    a: [
      {
        t: "p",
        text: "It *decouples feature launch from app release*: ship code dark (flag off), enable gradually (%/audience), and kill instantly if broken — so a bad feature doesn't require an app rollback (impossible anyway). Pitfalls: *fetch throttling* means changes aren't instant (mitigate with realtime/lower interval and applying on next launch), *stale/inconsistent state* if you activate mid-session, *default drift* (defaults must match a safe baseline), *too many flags* (config sprawl/tech debt — remove stale flags), and forgetting that *offline* users run on defaults. Also test *both* flag states.",
      },
      {
        t: "list",
        items: [
          "**Decouples** — launch from release; gradual + kill switch.",
          "**Pitfalls** — throttling delay, mid-session activation, default drift.",
          "**Flag sprawl** — remove stale flags (tech debt).",
          "**Test** — both states; offline runs on defaults.",
        ],
      },
      {
        t: "note",
        text: "Remote Config decouples feature launch from release (ship dark, enable gradually, kill instantly — no app rollback needed). Pitfalls: fetch throttling (changes not instant — use realtime/apply on launch), mid-session activation causing inconsistency, default drift (must be a safe baseline), flag sprawl (remove stale flags), offline users on defaults. Test both flag states.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you clean up feature flags and avoid config debt?",
    a: [
      {
        t: "p",
        text: "Flags are *temporary* by intent but rot into permanent complexity if left. Practice: *name and document* each flag with an owner and an *expiry/removal plan*, remove the flag *and the dead code path* once a feature is fully rolled out (or killed), audit flags periodically, and distinguish *release flags* (short-lived, delete after rollout) from *operational* toggles (long-lived kill switches). Too many stale flags create untested combinations and confusing branching. Treat flag removal as part of finishing a feature.",
      },
      {
        t: "list",
        items: [
          "**Document** — owner + expiry/removal plan per flag.",
          "**Remove** — flag AND dead path after full rollout.",
          "**Distinguish** — short-lived release flags vs long-lived toggles.",
          "**Audit** — periodically; stale flags = untested combos.",
        ],
      },
      {
        t: "note",
        text: "Flags are meant to be temporary but rot into complexity. Document each with an owner + removal plan, delete the flag AND its dead code path after full rollout/kill, distinguish short-lived release flags from long-lived operational kill switches, and audit periodically. Stale flags create untested combinations. Treat flag removal as part of finishing a feature.",
      },
    ],
  },
  {
    level: "junior",
    q: "What parameter types and value sources does Remote Config support?",
    a: [
      {
        t: "p",
        text: "Parameters can be read as *boolean*, *long*, *double*, *string*, or *JSON/byte array* (`getString` then parse for complex config). The *value source* for a read is: *remote* (fetched+activated server value), *default* (your in-app default), or *static* (the type's zero value if neither exists) — you can check the source to know whether a real value was applied. Use JSON strings for structured config (a list of items, a settings object) parsed on-device. Keep types consistent with server definitions.",
      },
      {
        t: "list",
        items: [
          "**Types** — boolean, long, double, string, JSON/bytes.",
          "**Sources** — remote, default, static (zero).",
          "**JSON string** — for structured/complex config.",
          "**Check source** — know if a real value applied.",
        ],
      },
      {
        t: "note",
        text: "Remote Config reads as boolean, long, double, string, or JSON/byte array (parse for complex config). Value source is remote (fetched+activated), default (in-app), or static (type zero if neither) — checkable to know if a real value applied. Use JSON strings for structured config parsed on-device. Keep types consistent with server definitions.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you avoid a Remote Config change breaking older app versions?",
    a: [
      {
        t: "p",
        text: "Old app versions still fetch config, so a value or a *new required parameter* can break them if they don't handle it. Guard with *app-version conditions* (serve certain values only to versions ≥ X), keep *backward-compatible defaults and parsing* (tolerate missing/unknown fields in JSON config), never make a new flag *required* for old clients, and test config changes against *supported old versions*. Treat Remote Config like a *server API contract*: changes must be compatible with every app version still in the wild.",
      },
      {
        t: "list",
        items: [
          "**Old versions** — still fetch; can break on new values.",
          "**Version conditions** — scope values to versions ≥ X.",
          "**Tolerant parsing** — handle missing/unknown fields.",
          "**Contract** — compatible with all live versions; test them.",
        ],
      },
      {
        t: "note",
        text: "Old app versions still fetch config, so a value/new parameter can break them. Guard with app-version conditions (values only for versions ≥ X), backward-compatible defaults and tolerant JSON parsing (handle missing/unknown fields), never require a new flag for old clients, and test against supported old versions. Treat Remote Config like a server API contract — compatible with every live version.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the minimum fetch interval, and why does it matter?",
    a: [
      {
        t: "p",
        text: "The *minimum fetch interval* is the shortest time between successful server fetches — default ~*12 hours* in production (to limit server load/battery). Fetching more often than this returns *cached* values (no server call) unless you lower the interval. In *development* you set it low (or 0) to see changes immediately; in *production* keep it reasonable (or use *realtime* Remote Config for urgent changes). Misunderstanding this causes 'my config change isn't showing up' — it's throttled, not broken.",
      },
      {
        t: "list",
        items: [
          "**Interval** — shortest gap between server fetches (~12h prod).",
          "**Within interval** — returns cache, no server call.",
          "**Dev** — set low/0 for instant changes.",
          "**Urgent prod** — use realtime Remote Config.",
        ],
      },
      {
        t: "note",
        text: "The minimum fetch interval is the shortest gap between successful fetches — ~12h in production (limits server load/battery). Fetching sooner returns cached values unless you lower it. Set it low/0 in dev for instant changes; keep reasonable in prod (or use realtime for urgent). Explains 'my config change isn't showing' — it's throttled, not broken.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does Remote Config personalization differ from A/B testing?",
    a: [
      {
        t: "p",
        text: "*A/B testing* finds the *single best variant for everyone* (then you roll it out). *Remote Config Personalization* uses *machine learning* to *automatically choose the best value per user* to optimize a goal — different users may get different values that maximize the objective (e.g. engagement). So A/B is *experiment → pick one winner*; Personalization is *continuous per-user optimization*. Use A/B to learn, Personalization to auto-optimize when the best value genuinely varies by user. Both build on Remote Config parameters.",
      },
      {
        t: "list",
        items: [
          "**A/B testing** — find one best variant for all.",
          "**Personalization** — ML picks the best value per user.",
          "**A/B** — experiment then pick a winner.",
          "**Personalization** — continuous per-user optimization.",
        ],
      },
      {
        t: "note",
        text: "A/B testing finds the single best variant for everyone (then roll out). Remote Config Personalization uses ML to automatically choose the best value per user to optimize a goal (different users get different values). A/B = experiment → one winner; Personalization = continuous per-user optimization. Use A/B to learn, Personalization when the best value varies by user.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do testers get and install builds from App Distribution?",
    a: [
      {
        t: "p",
        text: "You upload a build (via the console, Gradle plugin, `firebase` CLI, or CI) and assign it to *tester groups*. Testers receive an *email invite*, accept, and install via the *App Tester* app (or a link) — which also *notifies them of new builds*. No Play account or review needed. You can attach *release notes* and see *who installed*. It's ideal for CI-driven dogfooding: every merge pushes a build testers can grab minutes later. Testers must enroll their device once.",
      },
      {
        t: "list",
        items: [
          "**Upload** — console/Gradle/CLI/CI; assign tester groups.",
          "**Testers** — email invite → App Tester app/link.",
          "**Notifies** — of new builds; shows who installed.",
          "**CI-driven** — every merge → a grabbable build.",
        ],
      },
      {
        t: "note",
        text: "Upload a build (console/Gradle plugin/firebase CLI/CI) and assign tester groups; testers get an email invite and install via the App Tester app or a link (notified of new builds), no Play account/review. Attach release notes; see who installed. Ideal for CI-driven dogfooding — every merge pushes a grabbable build. Testers enroll their device once.",
      },
    ],
  },
  {
    level: "senior",
    q: "When would you choose Remote Config over a custom config endpoint?",
    a: [
      {
        t: "p",
        text: "*Remote Config* gives you targeting/conditions, A/B testing, gradual rollout, caching/offline, and a console — *for free*, no backend to build. Choose it for feature flags, UI/values tuning, and experiments. A *custom endpoint* is better when you need *highly dynamic/large/frequently-changing* data, *complex server logic*, *tight coupling to your data model*, *sub-second freshness beyond realtime's guarantees*, or you already have config infra. Many apps use *both*: Remote Config for flags/experiments, your API for domain config. Match the tool to freshness/complexity needs.",
      },
      {
        t: "list",
        items: [
          "**Remote Config** — flags, targeting, A/B, offline, no backend.",
          "**Custom endpoint** — dynamic/large data, complex logic, tight coupling.",
          "**Both** — Config for flags, API for domain config.",
          "**Match** — freshness/complexity to the tool.",
        ],
      },
      {
        t: "note",
        text: "Remote Config gives targeting, A/B, gradual rollout, caching/offline, and a console free (no backend) — choose it for flags, value tuning, experiments. A custom endpoint suits highly dynamic/large/frequently-changing data, complex server logic, or tight data-model coupling. Many apps use both: Config for flags/experiments, your API for domain config. Match freshness/complexity to the tool.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a rollout in Remote Config, and how does it differ from a Play staged rollout?",
    a: [
      {
        t: "p",
        text: "A Remote Config *rollout* gradually enables a *parameter change* (a feature flag) to an increasing % of users — *without shipping a new app version* (the code is already installed, just flag-gated). A Play *staged rollout* gradually delivers a *new app binary* to a % of users. They operate at different layers: Play rolls out *code*; Remote Config rolls out *behavior* within already-shipped code. Combine them — ship the binary via a Play staged rollout, then enable its new feature via a Remote Config rollout for finer control.",
      },
      {
        t: "list",
        items: [
          "**Config rollout** — enable a flag to a growing %; no new binary.",
          "**Play rollout** — deliver a new binary to a %.",
          "**Layers** — Config = behavior; Play = code.",
          "**Combine** — Play ships code, Config enables the feature.",
        ],
      },
      {
        t: "note",
        text: "A Remote Config rollout gradually enables a parameter/flag change to more users without a new app version (code already installed, flag-gated). A Play staged rollout delivers a new binary to a % of users. Config rolls out behavior; Play rolls out code. Combine: Play ships the binary, Config enables its feature — finer control.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you keep Remote Config and A/B experiments from skewing analytics?",
    a: [
      {
        t: "p",
        text: "Log an *experiment/variant identifier* (as a user property or event param) so analytics can be *segmented by variant* (otherwise a variant's behavior is mixed into aggregate metrics, hiding effects). Ensure *consistent assignment* (a user stays in one variant) so their data isn't split. Be aware experiments *change behavior*, so compare *within the experiment's control vs variant*, not against pre-experiment baselines. Clean up: stop logging an experiment's props after it ends. This keeps both the experiment analysis and general analytics interpretable.",
      },
      {
        t: "list",
        items: [
          "**Log variant id** — segment analytics by variant.",
          "**Consistent assignment** — user stays in one variant.",
          "**Compare** — control vs variant within the experiment.",
          "**Clean up** — stop logging after it ends.",
        ],
      },
      {
        t: "note",
        text: "Keep experiments from skewing analytics: log a variant identifier (user property/param) to segment by variant (else effects hide in aggregates), ensure consistent assignment (user stays in one variant), compare control vs variant within the experiment (not vs pre-experiment baselines), and stop logging after it ends. Keeps both experiment and general analytics interpretable.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are Remote Config templates, and how do you manage changes safely?",
    a: [
      {
        t: "p",
        text: "The full set of parameters/conditions is a *template*. Firebase *versions* templates — you can see *change history*, *who changed what*, and *roll back* to a previous template if a change breaks things. Manage safely: use the *staging vs production* separation where possible, *review* changes (treat config like code), *publish deliberately*, and *roll back* fast on problems. The *Remote Config REST API* lets you automate/validate template changes in CI. Versioning + rollback is your safety net for config mistakes.",
      },
      {
        t: "list",
        items: [
          "**Template** — the full parameter/condition set.",
          "**Versioned** — history, author, rollback.",
          "**Manage** — review changes, publish deliberately.",
          "**REST API** — automate/validate in CI.",
        ],
      },
      {
        t: "note",
        text: "The full parameter/condition set is a template; Firebase versions it — change history, author, and rollback to a previous template if something breaks. Manage safely: review changes (config-as-code), publish deliberately, roll back fast on problems, and use the Remote Config REST API to automate/validate in CI. Versioning + rollback is your safety net for config mistakes.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test a feature behind a Remote Config flag?",
    a: [
      {
        t: "p",
        text: "Test *both flag states* (on and off) — an unshipped-but-present code path is still code that must work. In tests, *inject the flag value* (wrap Remote Config behind an interface / provide a fake config) so unit/UI tests can force each state deterministically, rather than depending on a real fetch. Manually QA both paths on a build (use a low fetch interval / debug override to flip the flag). For experiments, verify each *variant* renders/behaves correctly. Never ship a flag you've only tested in one state.",
      },
      {
        t: "list",
        items: [
          "**Both states** — on and off; both are live code.",
          "**Inject the flag** — interface/fake config for deterministic tests.",
          "**Manual QA** — flip via low interval/debug override.",
          "**Experiments** — verify each variant.",
        ],
      },
      {
        t: "note",
        text: "Test a flagged feature in both states (on/off — both are live code). Wrap Remote Config behind an interface / inject a fake config so unit/UI tests force each state deterministically (no real fetch). Manually QA both paths (low fetch interval/debug override to flip). For experiments, verify each variant. Never ship a flag tested in only one state.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between App Distribution and internal app sharing / TestFlight?",
    a: [
      {
        t: "p",
        text: "*Firebase App Distribution* is *cross-platform* (Android + iOS) pre-release distribution to a tester list, integrated with Firebase/CI. *Play internal app sharing* is Android-only, quick ad-hoc sharing via Play (generates the real delivered build). *TestFlight* is Apple's equivalent for iOS. If you build for both platforms, App Distribution gives *one* tool/flow for both; if you're Android-only and want Play-accurate delivery, internal app sharing is handy. They overlap but differ in platform reach and integration.",
      },
      {
        t: "list",
        items: [
          "**App Distribution** — cross-platform (Android+iOS), Firebase/CI.",
          "**Internal app sharing** — Android-only, Play-accurate, ad-hoc.",
          "**TestFlight** — Apple's iOS equivalent.",
          "**Choose** — by platform reach + integration.",
        ],
      },
      {
        t: "note",
        text: "Firebase App Distribution: cross-platform (Android+iOS) pre-release distribution to testers, Firebase/CI-integrated. Play internal app sharing: Android-only, ad-hoc, Play-accurate delivery. TestFlight: Apple's iOS equivalent. For both platforms App Distribution gives one flow; for Android-only Play-accurate builds, internal app sharing. Overlap but differ in reach/integration.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle Remote Config activation timing to avoid UI inconsistency?",
    a: [
      {
        t: "p",
        text: "If you *activate* new values *mid-session*, the UI can show *inconsistent state* (part of the screen on old config, part on new) or change under the user's feet. Best practice: *fetch* in the background anytime, but *activate at a safe boundary* — typically *next app launch* (fetch this session, activate on the next), or a clean navigation point. For urgent kills, activate immediately but ensure the affected UI *re-reads* config cleanly. Decide per parameter whether it can change live or must wait for a restart.",
      },
      {
        t: "list",
        items: [
          "**Mid-session activate** — risks inconsistent/changing UI.",
          "**Fetch anytime** — activate at a safe boundary.",
          "**Typical** — activate on next launch.",
          "**Urgent kill** — activate now but re-read cleanly.",
        ],
      },
      {
        t: "note",
        text: "Activating new config mid-session risks inconsistent UI (part old, part new) or changing under the user. Best practice: fetch anytime, activate at a safe boundary — usually next launch (fetch now, activate next), or a clean navigation point. For urgent kills, activate immediately but ensure affected UI re-reads cleanly. Decide per parameter: live-changeable vs restart-required.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you architect a testable feature-flag layer around Remote Config?",
    a: [
      {
        t: "p",
        text: "Don't call `Firebase.remoteConfig` directly throughout the app — wrap it behind a *`FeatureFlags` interface* (e.g. `fun isNewCheckoutEnabled(): Boolean`) with a Remote Config-backed implementation and a *fake* for tests. Centralize flag *keys and defaults* in one place, expose flags as *typed* accessors (not raw string lookups scattered around), and optionally as *Flows* so UI reacts to changes. This gives testability (inject the fake), a single source of truth, refactor safety, and decoupling from the Firebase SDK (swappable). It's the clean-architecture way to consume config.",
      },
      {
        t: "list",
        items: [
          "**Wrap** — `FeatureFlags` interface + Remote Config impl + fake.",
          "**Centralize** — keys/defaults; typed accessors, not raw lookups.",
          "**Optionally Flows** — UI reacts to changes.",
          "**Benefits** — testable, single source, SDK-decoupled.",
        ],
      },
      {
        t: "note",
        text: "Wrap Remote Config behind a FeatureFlags interface (typed accessors like isNewCheckoutEnabled()) with a real impl + a fake for tests; centralize keys/defaults in one place; optionally expose flags as Flows so UI reacts. Benefits: testability (inject fake), single source of truth, refactor safety, decoupling from the Firebase SDK. The clean way to consume config.",
      },
    ],
  },
  {
    level: "junior",
    q: "What happens to Remote Config when the app is offline?",
    a: [
      {
        t: "p",
        text: "Remote Config *caches the last activated values locally*, so an offline app *keeps using the most recently fetched/activated config* — and if it never fetched successfully, it uses your *in-app defaults*. Fetches simply fail silently offline (you keep the cached/default values). This is why shipping sensible defaults matters and why the app must never *block* on a fetch. When connectivity returns, the next fetch updates the cache (activated per your timing). Design so the app is fully functional on cached/default config.",
      },
      {
        t: "list",
        items: [
          "**Cached values** — used offline (last activated).",
          "**No prior fetch** — falls back to in-app defaults.",
          "**Fetch fails silently** — keep cached/defaults.",
          "**Design** — never block on a fetch; work on defaults.",
        ],
      },
      {
        t: "note",
        text: "Offline, Remote Config uses the last activated cached values (or in-app defaults if it never fetched successfully); fetches fail silently and you keep cached/default values. So ship sensible defaults and never block on a fetch. Reconnection triggers the next fetch (activated per your timing). Design the app to be fully functional on cached/default config.",
      },
    ],
  },
  {
    level: "junior",
    q: "What metrics do you track to evaluate a feature rollout via Remote Config?",
    a: [
      {
        t: "p",
        text: "Track *stability* (crash-free rate for flag-on vs flag-off cohorts — did enabling it introduce crashes?), the *target behavior metric* (did the feature improve the intended KPI — conversion, engagement, retention?), *performance* (startup/jank if relevant), and *guardrail metrics* (did anything else regress — e.g. did a new feature hurt an unrelated funnel?). Compare *on vs off* cohorts (Analytics segmented by the flag). Roll forward only if stability holds and the target metric improves without guardrail regressions.",
      },
      {
        t: "list",
        items: [
          "**Stability** — crash-free: flag-on vs flag-off cohorts.",
          "**Target metric** — the intended KPI improvement.",
          "**Guardrails** — nothing else regressed.",
          "**Compare** — on vs off cohorts; roll forward if healthy.",
        ],
      },
      {
        t: "note",
        text: "Evaluate a Remote Config rollout with: stability (crash-free for flag-on vs flag-off cohorts), the target behavior metric (intended KPI — conversion/engagement/retention), performance if relevant, and guardrail metrics (nothing else regressed). Compare on-vs-off cohorts (Analytics segmented by flag). Roll forward only if stability holds and the target improves without guardrail regressions.",
      },
    ],
  },
];

export default qa;
