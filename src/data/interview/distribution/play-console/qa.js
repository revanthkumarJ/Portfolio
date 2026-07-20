// Play Console: Tracks, Rollouts & In-App Updates — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What are the testing tracks in the Play Console?",
    a: [
      {
        t: "p",
        text: "**Testing tracks are a staged pipeline of release channels that let you test your app with progressively larger audiences before it reaches all users, catching problems early with a limited blast radius.** The progression is internal → closed → open → production.",
      },
      {
        t: "list",
        items: [
          "**Internal testing** — the fastest track (a build is available in minutes), for up to ~100 trusted testers (your team). Use it for quick internal verification and to test the real Play-delivered, Play-signed artifacts.",
          "**Closed testing (alpha)** — a controlled group of testers you invite by email list or Google Group, for broader QA before public exposure.",
          "**Open testing (beta)** — anyone can opt in via a link, giving you real-world feedback and crash data at scale before production.",
          "**Production** — the full release that all Play Store users get.",
        ],
      },
      {
        t: "p",
        text: "The value of the progression is *risk reduction*: you catch bugs with a small, controlled audience first, so a problem is found by testers or beta users rather than your entire user base. Each track widens the audience, so you gain confidence at each stage before promoting to the next. A build can be promoted up the tracks (or you upload directly to a track). This staged approach — combined with staged rollouts *within* production — is standard release hygiene, letting you ship with confidence and limited exposure to any given release's risks.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a staged rollout and why use one?",
    a: [
      {
        t: "p",
        text: "**A staged (or phased) rollout releases a new production version to a *percentage* of users gradually — say 5%, then 20%, 50%, 100% over days — rather than to everyone at once, so you can monitor for problems on a small slice and halt if something's wrong before it reaches all users.** It limits the damage of a bad release.",
      },
      {
        t: "list",
        items: [
          "**Why**: even with thorough testing, some bugs only surface at scale or on specific devices in the real world. A staged rollout is a safety net — you watch production metrics (Android Vitals: crash rate, ANR rate) and reviews on a small percentage first. If a crash-causing bug slipped through, it affects 5% of users, not 100%.",
          "**Halt if bad**: if metrics degrade during the ramp, you *halt* the rollout — no more users get the new version — and fix the issue. This stops the spread.",
          "**Ramp up if healthy**: if metrics look good at each stage, you increase the percentage until reaching 100%.",
        ],
      },
      {
        t: "p",
        text: "An important caveat: you can *halt* a staged rollout to stop *new* users from getting the bad version, but you generally *can't* force users already on the new version back to the old one (Android's same-or-higher versionCode rule for updates). So the fix for those users is a *new patched release* with a higher versionCode. This is exactly why catching problems *early* (at 5%) matters — the fewer users on the bad version, the less impact before your fix ships. Staged rollouts pair with good crash monitoring (Crashlytics/Vitals) so you actually *see* problems during the ramp. It's standard practice for any app with a meaningful user base — ship gradually, watch, and stop if needed.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between a flexible and an immediate in-app update?",
    a: [
      {
        t: "p",
        text: "**The In-App Updates API lets you prompt users to update *without leaving your app*. A *flexible* update is non-blocking (the user keeps using the app while the update downloads in the background); an *immediate* update is blocking (a full-screen flow the user must complete before continuing).** You choose based on how critical the update is.",
      },
      {
        t: "list",
        items: [
          "**Flexible update** — non-blocking. The update downloads in the background while the user continues using the app, and you prompt them to restart to apply it when it's ready. Use for *optional/recommended* updates where you don't want to interrupt the user. It's the gentle option.",
          "**Immediate update** — blocking. A full-screen flow the user must complete (or exit the app) before they can continue. Use for *critical* updates — a security fix, or a breaking backend change that makes old app versions unusable, or enforcing a minimum supported version. It's forceful, so reserve it for genuinely mandatory updates.",
        ],
      },
      {
        t: "p",
        text: "The reason in-app updates exist is that many users don't update apps promptly on their own, leaving a long tail stuck on old, buggy versions — which increases support burden and prevents you from retiring old API contracts. In-app updates let you *drive* adoption of an important version from within the app. The decision between flexible and immediate is about *how much you can interrupt the user*: recommended update → flexible (non-intrusive); must-update (security/breaking change) → immediate (blocking). You check for an available update with `AppUpdateManager`, and Play tells you the update's priority (which you set when publishing) and how long it's been available, so you can decide when to prompt (flexible) or force (immediate).",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the Play pre-launch report?",
    a: [
      {
        t: "p",
        text: "**The pre-launch report is an automated QA pass Play runs when you upload your app to a testing track — Play installs and runs your app on a range of *real* devices, automatically crawls through the UI, and reports crashes, performance issues, accessibility problems, and security vulnerabilities it finds, *before* your release goes live.** It's a free automated test on real hardware you might not have.",
      },
      {
        t: "list",
        items: [
          "**What it catches**: crashes on specific device/OS combinations, performance issues, accessibility problems (missing content descriptions, contrast), and security vulnerabilities — surfaced automatically without you writing tests or owning the devices.",
          "**How it works**: Play's crawler navigates your app's screens on various real devices (different manufacturers, OS versions, screen sizes) and records what it finds — screenshots, crash traces, and issues per device.",
          "**When it runs**: automatically after you upload to a testing track (before promoting to production), so you see problems early.",
        ],
      },
      {
        t: "p",
        text: "It's valuable because it tests on *real devices across the fragmented Android ecosystem* — manufacturers and OS versions you likely don't have on hand — catching device-specific crashes and issues that your own testing (on a few devices) would miss. It complements your own test suite: your tests verify *known* behavior deterministically, while the pre-launch report *explores* your app broadly on hardware you don't own, finding surprises. It's essentially free extra QA, so reviewing it before promoting a release to production is good release hygiene — especially for catching the device-fragmentation issues that are hard to test otherwise.",
      },
    ],
  },
  {
    level: "senior",
    q: "How would you design a safe release process for an app with millions of users?",
    a: [
      {
        t: "p",
        text: "**I'd build a *staged, monitored* pipeline that progressively widens exposure while watching quality metrics at each step — combining testing tracks, staged production rollout, robust crash/quality monitoring, and the ability to halt and hotfix — so any bad release is caught with the smallest possible blast radius and can be responded to quickly.** With millions of users, even a small crash rate means many affected people, so limiting exposure and reacting fast is paramount.",
      },
      {
        t: "list",
        items: [
          "**1. Pre-release validation**: thorough automated tests (the pyramid) run in CI on every change; test the *release* (minified) build to catch R8 issues; validate the real AAB artifacts (bundletool / internal testing). Review the *pre-launch report* for device-fragmentation issues. This catches problems before any user sees the release.",
          "**2. Testing tracks — progressive audiences**: promote through *internal* (team, minutes) → *closed* (broader QA group) → *open beta* (volunteers at scale, real-world crash data) before production. Each stage exposes the build to more real usage/devices with feedback, catching issues a controlled test wouldn't.",
          "**3. Staged production rollout — the key safety mechanism**: never release to 100% at once. Start at a small percentage (1-5%), *monitor Android Vitals* (crash rate, ANR rate) and Crashlytics in real time, and only ramp up (10% → 25% → 50% → 100%) if metrics stay healthy over enough time to gather signal. At millions of users, even 1% is a large, statistically meaningful sample — so problems surface fast at low exposure.",
          "**4. Robust monitoring with alerting**: Crashlytics (real-time crash reporting with de-obfuscated traces via the mapping file) and Android Vitals (crash/ANR rates, and Play's *release-over-release* comparison) — with *alerts* on regressions (a spike in crash rate for the new version). You must *see* problems during the ramp, ideally automatically, not by manually checking dashboards. Compare the new version's metrics against the previous version's baseline.",
          "**5. Halt-and-hotfix capability**: if metrics regress during the ramp, *halt* the staged rollout immediately (stops new users getting the bad version). Since you can't force-downgrade users already on it, prepare a *hotfix* — a new higher-versionCode release with the fix — and roll *that* out (staged again). For critical issues, consider *feature flags / remote config* to disable the broken feature server-side *without* a new release (the fastest mitigation), and *in-app immediate updates* to push the hotfix to users on the bad version.",
          "**6. Feature flags decouple release from rollout**: ship risky features *behind a remote flag* (Firebase Remote Config), disabled by default, then enable them gradually server-side *after* the binary is out and stable. This separates *deploying code* from *enabling a feature*, so you can turn a problematic feature off instantly without any app release — a crucial safety layer at scale.",
        ],
      },
      {
        t: "list",
        items: [
          "**The overarching principles**: *progressive exposure* (tracks + staged rollout — never everyone at once), *fast detection* (real-time monitoring + alerts + release comparison), *fast response* (halt, feature-flag kill switch, hotfix + immediate in-app update), and *decoupling deploy from release* (feature flags). Together these ensure that at millions of users, a bad release affects the fewest people for the shortest time.",
          "**Also**: maintain the ability to reproduce and debug production issues (keep every release's mapping file for de-obfuscation), and have a documented incident-response runbook so the team reacts consistently under pressure.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: at scale, the release process is fundamentally about *risk management* — you assume some bad releases will slip through testing (they always do), so you design to *limit their blast radius* and *respond fast*. The mechanisms compound: testing tracks and staged rollout *limit exposure* (progressive audiences, then a small production percentage), real-time monitoring with release-comparison and alerts *detects fast* (a statistically meaningful sample at 1% of millions surfaces problems quickly), and halting + feature-flag kill switches + hotfixes with immediate in-app updates enable *fast response*. The most powerful pattern is *decoupling deploy from release* via feature flags — shipping code dark and enabling it server-side gradually — because it makes the riskiest changes reversible *without* an app release. A process that ships to 100% at once with only manual monitoring is the anti-pattern; the mature approach treats every production release as a *monitored experiment* that can be halted and rolled forward (with a fix), never a fire-and-forget event. Demonstrating this layered, risk-managed pipeline — and specifically the feature-flag decoupling and the halt/hotfix/kill-switch response toolkit — is the comprehensive, senior-level answer.",
      },
    ],
  },
  {
    level: "senior",
    q: "You discover a critical crash in a version that's already at 100% rollout. What are your options?",
    a: [
      {
        t: "p",
        text: "**Since the bad version is already fully rolled out and you can't force-downgrade users, the options are, in order of speed: (1) disable the broken feature server-side via a feature flag / remote config if it's flag-gated (instant, no release), (2) fix a server-side cause if the crash is backend-triggered, and (3) ship a hotfix release (staged, then pushed via immediate in-app update). The right response depends on what's causing the crash and whether you have kill-switch infrastructure.**",
      },
      {
        t: "list",
        items: [
          "**First — assess and mitigate immediately, before the full fix**: how severe (crash rate, which users/devices), and what's the *fastest* way to *stop the bleeding*? The fastest mitigations don't require a new app release:",
          "**Option 1 — Feature flag / Remote Config kill switch (instant, if available)**: if the crashing feature is gated behind a remote flag (Firebase Remote Config), *turn it off server-side*. Users' apps fetch the config and disable the feature *without any app update* — the crash stops within minutes/hours for everyone, including those on the bad version. This is why shipping risky features behind flags is so valuable: it makes them killable without a release. If you have this, it's almost always the first move.",
          "**Option 2 — Server-side fix (if the crash is backend-triggered)**: if the crash is caused by something the *backend* sends (a malformed response, a new field the old code chokes on, a bad config), fixing it on the *server* resolves it for all clients without an app release. Many 'app crashes' are actually triggered by server changes and are fixable server-side — check this early.",
          "**Option 3 — Hotfix release (the real fix, but slower)**: prepare a new version with the fix and a *higher versionCode*, test it (release build!), and roll it out — ideally *staged* again (start small to confirm the fix works and introduces no new issues), then ramp up. To *accelerate adoption* among users on the bad version, use the **In-App Updates API with an *immediate* (blocking) update** and high update priority, prompting/forcing users to update to the fixed version. This drives the fix out faster than waiting for organic updates. (Play review time can delay this, which is another reason the server-side mitigations matter for immediate relief.)",
        ],
      },
      {
        t: "list",
        items: [
          "**What you *can't* do**: force users already on the bad version back to the previous version — Android only allows same-or-higher versionCode updates, so 'rolling back' means rolling *forward* to a fixed higher version. This is the key constraint that makes the instant mitigations (flags, server fix) so important — they're the only way to help affected users *quickly* without waiting for a hotfix release cycle.",
          "**Halt is irrelevant here** (it's already at 100%) — halting a staged rollout only helps *before* full exposure. This scenario is precisely why you *stage* rollouts in the first place: to avoid ever being in this 'already at 100%' position. The lesson feeds back into process: stage rollouts and gate risky features behind flags so this situation is both rarer and more recoverable.",
          "**Communication & monitoring**: notify stakeholders, monitor the crash rate as mitigations take effect (confirm the flag kill / hotfix actually reduces it), and do a post-incident review — was this catchable in a staged rollout? Should the feature have been flag-gated? — to improve the process.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: the scenario tests whether you understand the *constraint* (no force-downgrade — you can only roll forward) and therefore prioritize *release-free mitigations* first. The fastest response is a *feature-flag kill switch* (disable the broken feature server-side, no app update needed) or a *server-side fix* (if the crash is backend-triggered) — both help affected users in minutes without a release. Only then does the *hotfix* (staged forward-roll + immediate in-app update to drive adoption) provide the permanent fix, accepting that it's slower (build, test, Play review, propagation). The meta-lesson is that this situation is *far better prevented* — staged rollouts (so you never hit 100% with a bad build) and feature flags (so risky code is killable without a release) are the infrastructure that turns a 'critical crash at 100%' catastrophe into a 'flip a flag' non-event. Demonstrating the constraint-awareness (roll forward, not back), the *ordered* mitigation toolkit (flag kill → server fix → hotfix + immediate update), and the preventive-infrastructure insight (stage + feature-flag) is the complete, senior answer.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between internal, closed, and open testing tracks?",
    a: [
      {
        t: "p",
        text: "Play's testing tracks escalate audience/visibility: *internal* — up to ~100 named testers, near-instant availability (no review delay), for quick QA; *closed* — a larger controlled group (email lists or Google Groups), still invite-only, for beta with a broader set; *open* — anyone with the link can join (public beta), largest reach. You *promote* the same build up the ladder (internal → closed → open → production) as confidence grows. Choose the track by how wide and controlled you want testers.",
      },
      {
        t: "table",
        headers: ["Track", "Audience", "Use"],
        rows: [
          ["Internal", "~100 named testers, instant", "Quick QA"],
          ["Closed", "Controlled group (lists/groups)", "Broader beta"],
          ["Open", "Anyone with the link", "Public beta"],
          ["Production", "All users", "Live release"],
        ],
      },
      {
        t: "note",
        text: "Testing tracks escalate: internal (~100 named testers, instant, quick QA), closed (controlled invite-only group — email lists/Google Groups, broader beta), open (anyone with the link, public beta), production (all users). Promote the same build up the ladder as confidence grows. Choose by how wide/controlled you want testers.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a staged (percentage) rollout, and why use one?",
    a: [
      {
        t: "p",
        text: "A *staged rollout* releases a new version to a *percentage* of production users (e.g. 1% → 5% → 20% → 50% → 100%) instead of everyone at once. This limits *blast radius*: if the release has a crash/regression, only a small fraction is affected, and you can *halt or roll back* before it spreads. You watch vitals (crashes, ANRs) at each stage and increase the percentage as it proves stable. Standard practice for any app with meaningful user numbers.",
      },
      {
        t: "list",
        items: [
          "**Percentage release** — 1% → … → 100% of production.",
          "**Limits blast radius** — few users hit a bad build.",
          "**Halt/rollback** — before a problem spreads.",
          "**Watch vitals** — increase % as stability proves out.",
        ],
      },
      {
        t: "note",
        text: "A staged rollout releases to a percentage of production users (1% → 5% → 20% → … → 100%) instead of all at once — limiting blast radius so a crash/regression hits few users and you can halt/roll back before it spreads. Watch vitals at each stage and increase % as it proves stable. Standard for apps with meaningful scale.",
      },
    ],
  },
  {
    level: "senior",
    q: "What can and can't you do when halting or rolling back a staged rollout?",
    a: [
      {
        t: "p",
        text: "You *can* **halt** a staged rollout (stop increasing %, freezing exposure) at any point, and *resume* later. You *cannot truly 'un-install'* a bad version from users who already got it — 'rollback' means *halting the bad rollout and releasing a new higher-versionCode build* (a fix, or a re-release of the previous code with a new code) to supersede it. Since `versionCode` can't go backward, the fix always ships as a *new, higher* version. So plan releases so you can quickly build/ship a forward fix.",
      },
      {
        t: "list",
        items: [
          "**Halt** — freeze the rollout %; resume later.",
          "**Can't un-install** — from users who already updated.",
          "**Rollback** — halt + ship a new higher-versionCode fix.",
          "**No going backward** — versionCode only increases.",
        ],
      },
      {
        t: "note",
        text: "You can halt a staged rollout (freeze %) and resume later, but you can't un-install a bad version from users who got it. 'Rollback' = halt the bad rollout + release a new higher-versionCode build (a fix or re-released prior code with a new code). versionCode only increases, so the fix always ships as a new version — plan for a fast forward fix.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are release notes, and how are they localized?",
    a: [
      {
        t: "p",
        text: "*Release notes* ('What's new') describe changes in a version, shown to users on the store and in the update prompt. You provide them per *locale* (localized strings), and they're attached to a *release* (versionCode range). Keep them concise and user-facing (what improved), not internal changelog. Play requires them for each release; you can reuse/copy across releases. Good release notes can nudge users to update and communicate value.",
      },
      {
        t: "list",
        items: [
          "**'What's new'** — per-version change description.",
          "**Localized** — provided per locale.",
          "**User-facing** — value/changes, not internal changelog.",
          "**Per release** — attached to a versionCode.",
        ],
      },
      {
        t: "note",
        text: "Release notes ('What's new') describe a version's changes, shown on the store and update prompt, provided per locale (localized). Keep them concise and user-facing (what improved), not an internal changelog. Play requires them per release; they can nudge users to update and communicate value.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does update priority work with in-app updates?",
    a: [
      {
        t: "p",
        text: "When you roll out a release you can set an *update priority* (0–5) via the Play Developer API. Your app reads it from `AppUpdateInfo.updatePriority()` and *decides the flow*: high priority → trigger the *immediate* (blocking) update; medium → *flexible*; low → maybe just a subtle prompt or ignore for now. Priority lets you *classify releases* (critical vs routine) and drive the in-app update UX accordingly, without hardcoding per-version logic. Combine with `clientVersionStalenessDays` to escalate over time.",
      },
      {
        t: "list",
        items: [
          "**Priority 0–5** — set per release via the Developer API.",
          "**App reads** — `updatePriority()` to choose the flow.",
          "**High → immediate** — low → flexible/subtle.",
          "**+ staleness** — escalate as the update ages.",
        ],
      },
      {
        t: "note",
        text: "Update priority (0–5, set per release via the Play Developer API) is read by the app from AppUpdateInfo.updatePriority() to choose the in-app update flow: high → immediate (blocking), medium → flexible, low → subtle/ignore. It classifies releases (critical vs routine) driving UX without per-version hardcoding. Combine with clientVersionStalenessDays to escalate over time.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are Android vitals, and which metrics matter most?",
    a: [
      {
        t: "p",
        text: "*Android vitals* is the Play Console's production quality dashboard, aggregating real-device metrics: *crash rate* and *ANR rate* (the core stability metrics — Google sets *bad-behavior thresholds* that can hurt discoverability if exceeded), plus *excessive wakeups*, *stuck partial wakelocks*, *slow/frozen frames*, and startup times. Watch crash-free and ANR-free rates closely during rollouts. Vitals is your *production* signal — it catches issues real users hit across devices you can't test locally.",
      },
      {
        t: "list",
        items: [
          "**Core** — crash rate + ANR rate (thresholds affect discoverability).",
          "**Also** — wakeups, wakelocks, slow/frozen frames, startup.",
          "**Watch** — during rollouts.",
          "**Production signal** — real-user issues across devices.",
        ],
      },
      {
        t: "note",
        text: "Android vitals is Play's production quality dashboard of real-device metrics: crash rate and ANR rate (core — Google's bad-behavior thresholds can hurt discoverability), plus excessive wakeups/wakelocks, slow/frozen frames, startup times. Watch crash-free/ANR-free rates during rollouts. It catches issues real users hit on devices you can't test.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the app review process, and how long does it take?",
    a: [
      {
        t: "p",
        text: "Play *reviews* new apps and updates for *policy compliance* (content, permissions, data safety, restricted features) before they go live. Review times vary — often hours to a few days (new apps and sensitive permissions take longer; updates are usually faster). A release stays 'In review'/'Pending publication' until approved. Plan releases with buffer, don't schedule a hard launch for the instant you upload, and avoid last-minute policy-sensitive changes that trigger longer review.",
      },
      {
        t: "list",
        items: [
          "**Reviews** — policy compliance (content, permissions, data safety).",
          "**Time** — hours to days; new/sensitive apps longer.",
          "**Status** — 'In review' until approved.",
          "**Plan** — buffer; avoid launch-instant-on-upload assumptions.",
        ],
      },
      {
        t: "note",
        text: "Play reviews new apps and updates for policy compliance (content, permissions, data safety, restricted features) before going live — often hours to a few days (new/sensitive apps longer, updates faster). Releases stay 'In review' until approved. Plan with buffer; don't assume instant publish, and avoid last-minute policy-sensitive changes that lengthen review.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the Data Safety section, and why does it matter?",
    a: [
      {
        t: "p",
        text: "The *Data Safety* form (in the Play Console) is a mandatory declaration of *what data your app collects/shares*, why, whether it's encrypted in transit, and whether users can request deletion — shown to users on your store listing. It must *accurately match your app's actual behavior* (including third-party SDKs' data practices). Inaccurate declarations are a *policy violation* that can get the app removed. Audit your SDKs' data collection to fill it correctly; update it when data practices change.",
      },
      {
        t: "list",
        items: [
          "**Declares** — data collected/shared, purpose, encryption, deletion.",
          "**Shown to users** — on the store listing.",
          "**Must match** — actual behavior incl. third-party SDKs.",
          "**Inaccurate** — policy violation → possible removal.",
        ],
      },
      {
        t: "note",
        text: "The Data Safety form declares what data your app collects/shares, why, encryption-in-transit, and deletion options — shown on your store listing. It must accurately match actual behavior including third-party SDKs. Inaccurate declarations are a policy violation risking removal. Audit SDK data collection to fill it correctly and update on changes.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you design a safe release process for an app with millions of users?",
    a: [
      {
        t: "p",
        text: "Ladder builds through *internal → closed → open* testing, review the *pre-launch report*, then a *staged production rollout* (1% → grow) while monitoring *vitals* (crash/ANR-free) and *Crashlytics* at each stage. Gate features behind *Remote Config/feature flags* so you can disable a bad feature *without a new release*. Keep releases *small and frequent* (easier to diagnose), always retain *mapping.txt*, and have a *forward-fix* plan (since you can't roll back). Automate with CI + the Play Developer API.",
      },
      {
        t: "list",
        items: [
          "**Ladder** — internal → closed → open → staged production.",
          "**Monitor** — vitals + Crashlytics at each stage.",
          "**Feature flags** — disable bad features without a release.",
          "**Forward-fix ready** — small frequent releases, keep mapping.txt.",
        ],
      },
      {
        t: "note",
        text: "Safe release at scale: ladder internal→closed→open, review the pre-launch report, staged production rollout (1%→) monitoring vitals + Crashlytics at each stage; gate features behind Remote Config/flags (disable without a release); keep releases small/frequent, retain mapping.txt, and plan forward-fixes (no rollback). Automate via CI + Play Developer API.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle a critical crash discovered at 100% rollout?",
    a: [
      {
        t: "p",
        text: "You can't recall the version, so: (1) if the bad feature is *flag-gated*, disable it via *Remote Config* immediately (fastest, no release); (2) *halt* any ongoing rollout; (3) build and ship a *forward-fix* as a *new higher-versionCode* release, expedited (consider a staged rollout that ramps quickly while watching vitals); (4) for the most severe cases, ship a *fix release* and monitor Crashlytics for the crash-free rate recovering. Post-incident: add a test/guard and a kill-switch to prevent recurrence.",
      },
      {
        t: "list",
        items: [
          "**Flag-gated?** — disable via Remote Config instantly.",
          "**Halt** — any ongoing rollout.",
          "**Forward-fix** — new higher-versionCode release, expedited.",
          "**Monitor + prevent** — Crashlytics recovery; add kill-switch/test.",
        ],
      },
      {
        t: "note",
        text: "Critical crash at 100%: you can't recall it — if flag-gated, disable via Remote Config instantly (no release); halt ongoing rollouts; ship a forward-fix as a new higher-versionCode release (expedited, watch vitals); monitor Crashlytics for recovery. Post-incident: add a kill-switch and a test/guard to prevent recurrence.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between managed publishing and timed publishing?",
    a: [
      {
        t: "p",
        text: "By default an approved release *publishes automatically*. *Managed publishing* lets you *hold* approved changes and release them *when you choose* (click 'Publish'), so you can align a store update with a marketing moment or coordinate multiple changes. It separates *review approval* from *going live*. Use it when timing matters (a coordinated launch) or to batch approved changes and publish together. Turn it on in the Console's Publishing overview.",
      },
      {
        t: "list",
        items: [
          "**Default** — approved releases publish automatically.",
          "**Managed publishing** — hold approved changes, publish on click.",
          "**Separates** — approval from going live.",
          "**Use** — coordinated launches, batching changes.",
        ],
      },
      {
        t: "note",
        text: "By default approved releases publish automatically. Managed publishing lets you hold approved changes and publish them when you choose (separating review approval from going live) — for coordinated launches or batching multiple approved changes to publish together. Enable it in the Console's Publishing overview.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the Play Developer API, and how do you automate releases?",
    a: [
      {
        t: "p",
        text: "The *Play Developer (Publishing) API* lets you automate release tasks programmatically — upload an AAB, assign it to a track, set rollout percentage, update listing/metadata, and manage testers — using a *service account* with granted permissions. Tools like *fastlane (supply)* and the *Gradle Play Publisher* plugin wrap it. This enables CI/CD: a merge triggers a build that uploads to internal testing (or a staged production rollout) with no manual Console steps — faster, repeatable, less error-prone releases.",
      },
      {
        t: "list",
        items: [
          "**Automates** — upload AAB, set track/rollout, metadata, testers.",
          "**Auth** — a service account with permissions.",
          "**Tools** — fastlane supply, Gradle Play Publisher.",
          "**Enables** — CI/CD releases without manual Console steps.",
        ],
      },
      {
        t: "note",
        text: "The Play Developer (Publishing) API automates release tasks — upload an AAB, assign a track, set rollout %, update metadata/testers — via a service account. Tools like fastlane (supply) and Gradle Play Publisher wrap it. Enables CI/CD: a merge builds and uploads to a track (or staged rollout) with no manual Console steps — faster, repeatable, less error-prone.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a store listing, and what affects install conversion?",
    a: [
      {
        t: "p",
        text: "The *store listing* is your app's Play page: title, short/full description, icon, screenshots, feature graphic, and (optionally) a promo video. These drive *install conversion* (visitors → installers): a clear icon, compelling screenshots showing real value, a concise benefit-led description, and good ratings. Play lets you run *store listing experiments (A/B tests)* on these assets to measure conversion. Also, *download size* and *ratings/reviews* strongly affect conversion. Treat the listing as an optimizable funnel.",
      },
      {
        t: "list",
        items: [
          "**Listing** — title, description, icon, screenshots, graphic, video.",
          "**Conversion** — icon/screenshots/description/ratings drive it.",
          "**A/B test** — store listing experiments on assets.",
          "**Also** — download size and reviews affect conversion.",
        ],
      },
      {
        t: "note",
        text: "The store listing (title, descriptions, icon, screenshots, feature graphic, video) drives install conversion (visitors → installers) — clear icon, value-showing screenshots, benefit-led description, good ratings. Play offers store listing experiments (A/B tests) to measure asset changes. Download size and reviews also affect conversion. Treat the listing as an optimizable funnel.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are store listing experiments (A/B testing on the Play page)?",
    a: [
      {
        t: "p",
        text: "*Store listing experiments* let you A/B test listing assets (icon, screenshots, description, feature graphic) on *real Play traffic* — Play shows variants to different user segments and measures which yields higher *install conversion* (with statistical significance), then you apply the winner. It's the data-driven way to optimize the top of your acquisition funnel, separate from optimizing the app itself. Run one variable at a time for clear signal, and let it run long enough for significance.",
      },
      {
        t: "list",
        items: [
          "**A/B test** — icon/screenshots/description on real traffic.",
          "**Measures** — install conversion with significance.",
          "**Apply the winner** — data-driven listing optimization.",
          "**Best practice** — one variable at a time, sufficient duration.",
        ],
      },
      {
        t: "note",
        text: "Store listing experiments A/B test listing assets (icon, screenshots, description, feature graphic) on real Play traffic — Play serves variants to segments, measures install conversion with significance, and you apply the winner. The data-driven way to optimize the acquisition funnel. Test one variable at a time, run long enough for significance.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle a policy violation or app suspension?",
    a: [
      {
        t: "p",
        text: "Read the *violation notice* carefully to understand the exact policy and offending element (permission misuse, deceptive behavior, data-safety mismatch, restricted content). *Fix the issue* (remove the offending code/permission, correct the declaration), then *appeal* via the Console with a clear explanation of the remediation. To *avoid* violations: review policies before using sensitive permissions/features, keep Data Safety accurate, and test against Play's requirements. Repeated violations risk account termination, so treat notices seriously and promptly.",
      },
      {
        t: "list",
        items: [
          "**Understand** — the exact policy and offending element.",
          "**Fix** — remove/correct the violating behavior.",
          "**Appeal** — via the Console explaining remediation.",
          "**Prevent** — review policies, accurate Data Safety, test.",
        ],
      },
      {
        t: "note",
        text: "On a policy violation/suspension: read the notice to pinpoint the exact policy and offending element (permission misuse, deception, data-safety mismatch), fix it (remove/correct), then appeal via the Console explaining the remediation. Prevent by reviewing policies before sensitive features, keeping Data Safety accurate, and testing. Repeated violations risk account termination — act promptly.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between a production release and a testing release?",
    a: [
      {
        t: "p",
        text: "A *testing release* (internal/closed/open track) goes only to *testers* and doesn't affect your public rating or general users — safe to iterate. A *production release* goes to *all users* on the Play Store, counts toward your public rating and vitals, and is what most people install. You *promote* a validated build from testing to production (often via a staged rollout). Never push straight to production without testing-track validation and a pre-launch report.",
      },
      {
        t: "list",
        items: [
          "**Testing release** — testers only; safe to iterate.",
          "**Production release** — all users; public rating + vitals.",
          "**Promote** — validated build testing → production.",
          "**Never** — skip testing-track validation.",
        ],
      },
      {
        t: "note",
        text: "A testing release (internal/closed/open) goes only to testers — no public-rating impact, safe to iterate. A production release goes to all users (counts toward rating/vitals). Promote a validated build from testing to production (often via staged rollout). Never push straight to production without testing-track validation and a pre-launch report.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you use Remote Config / feature flags with releases?",
    a: [
      {
        t: "p",
        text: "Ship features *disabled behind a flag* (Firebase Remote Config or your own), then *enable them remotely* — decoupling *code deployment* from *feature launch*. Benefits: turn a feature on gradually (or for a segment), *kill-switch* a broken feature *without a new release* (critical since you can't roll back an app version), run staged feature exposure independent of app rollout, and A/B test behaviors. Best practice for any risky feature: dark-launch it behind a flag so you retain control post-release.",
      },
      {
        t: "list",
        items: [
          "**Decouples** — code deployment from feature launch.",
          "**Kill-switch** — disable a broken feature without a release.",
          "**Gradual/segmented** — enable per rollout or audience.",
          "**Dark-launch** — risky features behind a flag.",
        ],
      },
      {
        t: "note",
        text: "Ship features disabled behind a flag (Remote Config/own) and enable remotely — decoupling code deployment from feature launch. You can kill-switch a broken feature without a new release (vital since apps can't roll back), enable gradually/per-segment, and A/B test. Dark-launch any risky feature behind a flag to keep post-release control.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are ratings and reviews' impact, and how do you request reviews well?",
    a: [
      {
        t: "p",
        text: "Ratings/reviews affect *store ranking* and *install conversion* (users trust higher-rated apps). To gather them well, use the *In-App Review API* — it shows a *native review card in-context* (no leaving the app) and Play controls frequency to avoid spamming. Trigger it at a *positive moment* (after a success/completion), *never* gate features on leaving a review or nag repeatedly (a policy violation). Respond to reviews to improve sentiment. Good in-app moments raise both volume and average rating.",
      },
      {
        t: "list",
        items: [
          "**Impact** — ranking + install conversion.",
          "**In-App Review API** — native in-context card, frequency-capped.",
          "**Trigger** — at a positive moment; never nag or gate.",
          "**Respond** — to reviews to improve sentiment.",
        ],
      },
      {
        t: "note",
        text: "Ratings/reviews affect ranking and install conversion. Use the In-App Review API (native in-context card, Play-frequency-capped) triggered at a positive moment (after success) — never gate features on reviewing or nag repeatedly (policy violation). Respond to reviews to improve sentiment. Good in-app timing raises both volume and average rating.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you manage multiple app versions across tracks simultaneously?",
    a: [
      {
        t: "p",
        text: "Play lets each track hold its own active release, so you might have (say) v10 at 20% in production, v11 in open testing, and v12 in internal — progressing independently. Manage this by keeping *versionCodes strictly increasing across all tracks* (a testing build must out-number production), *promoting* builds up the ladder rather than rebuilding, and being careful that a *higher-versionCode testing build isn't accidentally offered to production users* (Play handles track eligibility, but coordinate codes). Use the Console's release dashboard to see all tracks at a glance.",
      },
      {
        t: "list",
        items: [
          "**Per-track releases** — different versions progress independently.",
          "**Increasing versionCodes** — across all tracks.",
          "**Promote** — up the ladder, don't rebuild.",
          "**Dashboard** — view all tracks; coordinate codes.",
        ],
      },
      {
        t: "note",
        text: "Each track holds its own release (e.g. v10 at 20% production, v11 open, v12 internal) progressing independently. Keep versionCodes strictly increasing across all tracks (testing out-numbers production), promote builds up the ladder rather than rebuild, and coordinate codes so track eligibility stays correct. Use the Console release dashboard to view all tracks.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between an update and a fresh install for users?",
    a: [
      {
        t: "p",
        text: "An *update* replaces the installed app *in place* — user data, preferences, and databases persist (same signing key required), and it can happen automatically (auto-update) or via the In-App Updates API. A *fresh install* is a new user getting the app for the first time (no prior data), or a user who *uninstalled and reinstalled* (data gone unless backed up). Updates must preserve data (test migrations!); fresh installs go through onboarding. Play distinguishes these in acquisition metrics.",
      },
      {
        t: "list",
        items: [
          "**Update** — in-place; data persists; same signing key.",
          "**Fresh install** — first-time or reinstall; no prior data.",
          "**Updates** — must preserve data (test migrations).",
          "**Fresh** — onboarding path.",
        ],
      },
      {
        t: "note",
        text: "An update replaces the app in place — data/preferences/databases persist (same signing key), auto or via In-App Updates. A fresh install is a first-time user (or reinstall, data gone unless backed up). Updates must preserve data (test Room migrations!); fresh installs hit onboarding. Play separates these in acquisition metrics.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you monitor a release's health in the first hours?",
    a: [
      {
        t: "p",
        text: "Immediately after (and during) a rollout, watch *Crashlytics* for new/spiking crashes on the new versionCode (velocity alerts), *Android vitals* for crash/ANR-free rates dipping, and *reviews* for sudden negative feedback. Compare the new version's metrics against the prior version at the *same rollout stage*. Keep the rollout *small initially* so problems surface at 1% not 100%. If metrics degrade, *halt* and *forward-fix* (or flag-disable). Have alerting so you're notified rather than polling.",
      },
      {
        t: "list",
        items: [
          "**Crashlytics** — new/spiking crashes on the new versionCode.",
          "**Vitals** — crash/ANR-free rate dips.",
          "**Compare** — vs prior version at the same stage.",
          "**Degrade → halt + forward-fix**; alerting, not polling.",
        ],
      },
      {
        t: "note",
        text: "Post-release, watch Crashlytics for new/spiking crashes on the new versionCode (velocity alerts), Android vitals for crash/ANR-free dips, and reviews for sudden negatives — comparing against the prior version at the same rollout stage. Keep the initial % small so issues surface early. Degrade → halt + forward-fix/flag-disable. Set alerts, don't poll.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between forced updates and recommended updates?",
    a: [
      {
        t: "p",
        text: "A *recommended* (flexible) update *suggests* the user update but lets them continue on the old version — good for routine improvements. A *forced* (immediate) update *blocks* app use until updated — reserve it for genuinely necessary cases: a critical security/data bug, a broken API contract, or a legal requirement, since forcing interrupts users. Implement forcing via the *In-App Updates immediate flow* (using update *priority*/staleness) or a *server-driven minimum version* check that gates the app. Overusing forced updates frustrates users.",
      },
      {
        t: "list",
        items: [
          "**Recommended** — suggest; user can keep using old version.",
          "**Forced** — block until updated; for critical cases only.",
          "**Implement** — immediate In-App Update / min-version gate.",
          "**Overuse** — frustrates users; reserve for necessity.",
        ],
      },
      {
        t: "note",
        text: "Recommended (flexible) updates suggest updating but let users continue; forced (immediate) updates block use until updated — reserve for critical security/data bugs, broken API contracts, or legal needs. Implement via the immediate In-App Update flow (priority/staleness) or a server-driven minimum-version gate. Overusing forced updates frustrates users.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle target API level requirement deadlines from Play?",
    a: [
      {
        t: "p",
        text: "Play *raises the required `targetSdkVersion`* each year — after the deadline, you *can't submit updates* (and eventually new installs may be restricted on newer devices) unless you target a recent API level. Plan ahead: bump `targetSdk` well before the deadline, *handle that level's behavior changes* (permissions, background limits, scoped storage, etc.), and test thoroughly (behavior changes can break things silently). Existing apps get an extension window but shouldn't rely on it. Treat the annual target bump as scheduled maintenance.",
      },
      {
        t: "list",
        items: [
          "**Annual bump** — Play raises required targetSdk yearly.",
          "**After deadline** — can't submit updates without it.",
          "**Handle** — that level's behavior changes; test thoroughly.",
          "**Plan ahead** — treat as scheduled maintenance.",
        ],
      },
      {
        t: "note",
        text: "Play raises the required targetSdkVersion yearly — after the deadline you can't submit updates (and new installs may be restricted on newer devices) without targeting a recent level. Bump targetSdk ahead of the deadline, handle that level's behavior changes (permissions, background limits, scoped storage), and test thoroughly. Treat the annual bump as scheduled maintenance.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is Play Console's release dashboard and 'release with confidence' flow?",
    a: [
      {
        t: "p",
        text: "The Console guides a structured release: create a release on a track, upload the AAB, add *release notes*, review the *pre-launch report* and any *errors/warnings* Play flags (missing mapping file, oversized, policy issues), set the *rollout percentage*, and confirm. It surfaces *pre-release checks* (deobfuscation file, target API level, permissions) before you publish. Following this flow (not skipping the warnings) prevents common release mistakes. The dashboard shows each track's current release and rollout state.",
      },
      {
        t: "list",
        items: [
          "**Guided flow** — track → AAB → notes → checks → rollout %.",
          "**Pre-release checks** — mapping file, target API, permissions.",
          "**Heed warnings** — don't skip flagged errors.",
          "**Dashboard** — per-track release + rollout state.",
        ],
      },
      {
        t: "note",
        text: "The Console guides releases: create a release on a track, upload the AAB, add release notes, review the pre-launch report and Play's warnings (missing mapping file, oversized, target API, permissions), set rollout %, confirm. Heeding these pre-release checks prevents common mistakes. The dashboard shows each track's current release and rollout state.",
      },
    ],
  },
];

export default qa;
