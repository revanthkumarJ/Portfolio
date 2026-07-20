// Play Console: Tracks, Rollouts & In-App Updates — Content tab. Teaching-first.

const content = [
  {
    heading: "The Play Console and testing tracks",
    blocks: [
      {
        t: "p",
        text: "The **Play Console** is Google's web dashboard for publishing and managing your app on the Play Store — uploading releases, managing testers, monitoring quality (Android Vitals), reading reviews, and configuring the store listing. A core concept is **testing tracks**: a staged pipeline of release channels that let you test with progressively larger audiences before reaching all users, catching problems early with limited blast radius.",
      },
      {
        t: "table",
        headers: ["Track", "Audience", "Purpose"],
        rows: [
          ["Internal testing", "up to ~100 trusted testers (your team)", "fast (minutes), for quick internal verification of a build"],
          ["Closed testing", "a defined list / group of testers (alpha)", "broader QA with a controlled group before going wider"],
          ["Open testing", "anyone who opts in (beta)", "public beta — real-world feedback from volunteers before production"],
          ["Production", "all users on the Play Store", "the live release everyone gets"],
        ],
      },
      {
        t: "list",
        items: [
          "**Internal testing** — the fastest track (a build is available in minutes), for a small trusted group. Use it for quick verification and to test the real Play-delivered/signed artifacts.",
          "**Closed testing (alpha)** — a controlled group of testers you invite (by email list or Google Group), for wider QA before public exposure.",
          "**Open testing (beta)** — anyone can opt in via a link, giving you real-world feedback and crash data at scale before production.",
          "**Production** — the full release. The progression internal → closed → open → production lets you catch bugs with a small audience first, reducing the risk of a bad release reaching everyone.",
        ],
      },
    ],
  },
  {
    heading: "Staged rollouts",
    blocks: [
      {
        t: "p",
        text: "A **staged (or phased) rollout** releases a new production version to a *percentage* of users gradually, rather than everyone at once. You might roll out to 5% of users, monitor for crashes/ANRs/bad reviews, then increase to 20%, 50%, 100% over days — or **halt/rollback** if you detect a problem. This limits the damage of a bad release: a crash-causing bug affects 5% of users, not 100%, and you can stop it before it spreads.",
      },
      {
        t: "list",
        items: [
          "**Why stage**: even with testing, some bugs only surface at scale or on specific devices in the field. A staged rollout is a safety net — you watch real production metrics (Android Vitals: crash rate, ANR rate) on a small slice before committing everyone.",
          "**Halt and resume**: if metrics degrade at 5%, you *halt* the rollout (no more users get it) and can fix the issue. Existing users on the new version stay, but you stop the spread.",
          "**Rollback caveat**: you can halt a staged rollout, but you generally *can't* force users already on the new version back to the old one (they'd need a new higher-versionCode release with the fix). So staged rollout limits *exposure*, and the fix is a new patched release — which is why catching it early (at 5%) matters.",
          "**Best practice**: stage significant releases (start small, monitor Vitals, ramp up), and pair with good crash monitoring (Crashlytics/Vitals) so you *see* problems during the ramp. This is standard release hygiene for any app with a meaningful user base.",
        ],
      },
    ],
  },
  {
    heading: "In-app updates",
    blocks: [
      {
        t: "p",
        text: "The **In-App Updates API** lets your app prompt users to update *without leaving the app* — useful for pushing important updates (a critical fix, a required minimum version) to users who might not update via the Play Store on their own. There are two flavors:",
      },
      {
        t: "list",
        items: [
          "**Flexible update** — a *non-blocking* update: the user can keep using the app while the update downloads in the background, then you prompt to restart to apply it. Use for optional/recommended updates where you don't want to interrupt the user. It's the gentle option.",
          "**Immediate update** — a *blocking, full-screen* update flow the user must complete (or exit the app) before continuing. Use for *critical* updates — a security fix, a breaking backend change that makes old versions unusable, enforcing a minimum supported version. It's forceful, so reserve it for genuinely mandatory updates.",
          "**How it works**: you check for an available update (`AppUpdateManager`), and if one exists (and meets your criteria, e.g. priority or staleness), you trigger the flexible or immediate flow. Play provides the update priority (you set it when publishing) and how many days it's been available, so you can decide when to prompt or force.",
          "**Why use it**: many users don't update apps promptly; in-app updates let you *drive* adoption of an important version, reducing the long tail of users stuck on old, buggy versions — which matters for support burden and for retiring old API contracts.",
        ],
      },
    ],
  },
  {
    heading: "Store listing, review, and other Console features",
    blocks: [
      {
        t: "list",
        items: [
          "**Store listing** — the app's Play Store page: title, description, screenshots, feature graphic, icon. Optimizing this (App Store Optimization) affects discoverability and conversion. Play also supports *custom store listings* and *store listing experiments* (A/B testing listing assets).",
          "**Review process** — new apps and updates go through Google's review before going live. Review times vary (hours to days); policy violations (permissions misuse, content, deceptive behavior) cause rejections. Sensitive permissions and data practices require declarations (the Data Safety section).",
          "**Pre-launch report** — when you upload to a testing track, Play automatically runs your app on real devices (crawling the UI) and reports crashes, performance issues, accessibility problems, and security vulnerabilities *before* release — a free automated QA pass.",
          "**Android Vitals** — production quality metrics (crash rate, ANR rate, excessive wakeups, slow/frozen frames, battery) across real users. Google uses these for Play ranking/visibility, and they're your window into real-world quality — the 'is there a problem?' signal that complements local profiling.",
          "**Other** — pricing/monetization (in-app purchases, subscriptions via Play Billing), release management, user feedback/reviews (with the ability to reply), and analytics.",
        ],
      },
      {
        t: "note",
        text: "Play Console: the publishing/management dashboard. Testing tracks (internal → closed → open → production) test with progressively larger audiences before full release. Staged rollout releases to a % of users gradually — monitor Vitals, halt if bad (limits blast radius; can't force-downgrade, so catch early). In-app updates: flexible (non-blocking background download) for optional updates, immediate (blocking full-screen) for critical/mandatory ones. Also: store listing (+ experiments), review process, pre-launch report (auto device testing), Android Vitals (production quality metrics for ranking).",
      },
    ],
  },
];

export default content;
