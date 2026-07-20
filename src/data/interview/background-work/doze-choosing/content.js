// Doze, Battery & Choosing the Right Tool — Content tab. Teaching-first.

const content = [
  {
    heading: "Doze mode — the OS batching background work",
    blocks: [
      {
        t: "p",
        text: "**Doze mode** (introduced in Android 6, strengthened since) is a power-saving state the system enters when the device is *unused* (screen off, stationary, unplugged for a while). In Doze, the OS *defers* apps' background activity — network access, jobs, alarms, wakelocks — and batches them into periodic **maintenance windows**, so the device can stay in a deep low-power state most of the time instead of constantly waking for background work. This dramatically improves standby battery life, and it's a major reason background work is 'deferrable, not immediate'.",
      },
      {
        t: "list",
        items: [
          "**What Doze restricts**: network access is suspended, `AlarmManager` alarms are deferred (except `setExactAndAllowWhileIdle`, which is rate-limited), `JobScheduler`/WorkManager jobs are deferred, wakelocks are ignored, and syncs are paused — all batched to maintenance windows that grow further apart the longer the device is idle.",
          "**Maintenance windows**: periodically, Doze briefly lifts to let deferred work run, then the device returns to Doze. The intervals lengthen over time (a device idle overnight has very infrequent windows).",
          "**Deep Doze vs light Doze**: light Doze (screen off but device recently used) applies milder restrictions sooner; deep Doze (long idle, stationary) applies the full set.",
          "**High-priority FCM is the escape**: a *high-priority* Firebase Cloud Messaging message can wake the app from Doze immediately (for genuinely time-sensitive things like a message or call) — which is why push is the right pattern for real-time delivery instead of polling.",
        ],
      },
    ],
  },
  {
    heading: "App Standby and standby buckets",
    blocks: [
      {
        t: "list",
        items: [
          "**App Standby** — the system limits background activity of apps the user *hasn't used recently*, independent of Doze. An app you haven't opened in weeks gets less background freedom than one you use daily.",
          "**App Standby Buckets** (Android 9+) — the OS classifies each app into a bucket based on usage: **Active** (in use now), **Working set** (used regularly), **Frequent**, **Rare**, and **Restricted** (rarely used or misbehaving). The bucket determines how much background work, how many jobs/alarms, and how much network the app gets — more usage = more freedom.",
          "**The implication**: you can't assume your background work runs promptly if the user rarely opens your app — it'll be throttled. Design for eventual, not immediate, execution, and rely on push (FCM) for anything the user must be notified about promptly regardless of bucket.",
        ],
      },
    ],
  },
  {
    heading: "Battery optimizations and the trend",
    blocks: [
      {
        t: "list",
        items: [
          "**Battery optimization exemptions** — users (or the app, with a request) can exempt an app from some restrictions via 'ignore battery optimizations'. But requesting this is discouraged and Play has policies against unjustified use — Google's stance is that a well-designed app shouldn't need it. Only genuine always-on use cases (a companion app for a medical device) justify it.",
          "**The overarching trend**: every Android version since 6 has *tightened* background execution — Doze, App Standby, background service limits (8), background location limits (10), foreground service and exact alarm restrictions (12+), foreground service types (14). The direction is unmistakable: unrestricted background work is a battery/privacy problem, so the OS keeps constraining it.",
          "**What this means for developers**: stop thinking 'run in the background whenever I want' and start thinking 'declare *what* work I need and *under what conditions*, and let the OS schedule it efficiently' (WorkManager), or 'let the server tell me when there's something to do' (push/FCM). Fighting the battery model (wakelocks, exact alarms for polling, exemptions) is fragile and user-hostile; working *with* it is the correct approach.",
        ],
      },
    ],
  },
  {
    heading: "Choosing the right tool — the decision table",
    blocks: [
      {
        t: "p",
        text: "This is the single most important background-work interview question: given a task, which mechanism? The decision comes down to four axes — *deferrable vs immediate*, *guaranteed vs best-effort*, *exact-timing vs flexible*, and *user-visible vs invisible*.",
      },
      {
        t: "table",
        headers: ["The task", "Use"],
        rows: [
          ["Load data for the current screen (immediate, UI-tied)", "Coroutine in viewModelScope"],
          ["Deferrable, guaranteed work (sync, upload, backup) surviving kill/reboot", "WorkManager"],
          ["Important, guaranteed, should run soon (user tapped 'send')", "WorkManager expedited work"],
          ["Guaranteed, long-running, user-visible (large download)", "WorkManager foreground worker (setForeground)"],
          ["Ongoing, continuous, user-visible (music, navigation, live tracking)", "Foreground service"],
          ["Exact-time trigger (alarm, precise reminder)", "AlarmManager (exact alarm)"],
          ["React to server data promptly / real-time (chat, notifications)", "Push (FCM high-priority) — not polling"],
          ["In-app client-server / cross-process communication", "Bound service (AIDL for IPC)"],
        ],
      },
      {
        t: "list",
        items: [
          "**The mental flowchart**: Is it tied to a screen and immediate? → coroutine. Must it be *guaranteed* and can it be *deferred*? → WorkManager (expedited if urgent, foreground worker if long/visible). Must it run *continuously now* and is user-visible? → foreground service. Does it need an *exact time*? → AlarmManager. Does the *server* know when there's work? → push (FCM). This flowchart answers virtually every 'which background tool' question.",
          "**The most common mistake**: reaching for WorkManager for immediate UI work (adds overhead/latency), or trying to use a background service / polling for something that should be push or WorkManager. Match the tool to the four axes.",
        ],
      },
      {
        t: "note",
        text: "Doze/battery essentials: Doze batches background work into maintenance windows when the device is idle (deferring network/jobs/alarms) to save battery; App Standby buckets throttle rarely-used apps; the whole trend since Android 6 is tightening background execution. Design for deferrable, not immediate, and use push (FCM high-priority) for real-time — it escapes Doze. Choosing the tool: coroutine (immediate/UI), WorkManager (deferrable/guaranteed, expedited/foreground variants), foreground service (ongoing/visible), AlarmManager (exact time), FCM (server-driven/real-time).",
      },
    ],
  },
];

export default content;
