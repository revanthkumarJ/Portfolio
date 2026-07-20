// Doze, Battery & Choosing the Right Tool — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What is Doze mode?",
    a: [
      {
        t: "p",
        text: "**Doze mode is a power-saving state Android enters when the device is unused — screen off, stationary, and unplugged for a while. In Doze, the OS defers apps' background activity (network access, jobs, alarms, wakelocks) and batches it into periodic *maintenance windows*, so the device can stay in a deep low-power state most of the time instead of constantly waking for background work.** This greatly improves standby battery life.",
      },
      {
        t: "list",
        items: [
          "**What's deferred in Doze**: network access is suspended, WorkManager/JobScheduler jobs and standard alarms are delayed, wakelocks are ignored, and syncs pause — all held until a maintenance window.",
          "**Maintenance windows**: periodically Doze briefly lifts to let deferred work run, then the device goes back to sleep. These windows get *further apart* the longer the device stays idle, so overnight your background work runs very infrequently.",
          "**The escape hatch**: a *high-priority FCM (push) message* can wake the app from Doze immediately for genuinely time-sensitive things (an incoming message or call).",
        ],
      },
      {
        t: "p",
        text: "Doze is a big reason background work is described as 'deferrable, not immediate' — you can't assume your background task runs promptly when the device is idle. The practical takeaway: design background work to run *eventually* under the OS's batching (WorkManager handles this correctly), and use push notifications for anything that must reach the user in real time, since push is what can wake the device from Doze.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are App Standby Buckets?",
    a: [
      {
        t: "p",
        text: "**App Standby Buckets are a system classification (Android 9+) that limits an app's background activity based on how recently and frequently the user uses it. The less you use an app, the less background freedom it gets.** It's a complement to Doze — where Doze restricts *all* apps when the device is idle, App Standby restricts *individual* apps based on their usage, regardless of device state.",
      },
      {
        t: "list",
        items: [
          "**The buckets** (most to least freedom): **Active** (app in use right now), **Working set** (used regularly), **Frequent** (used somewhat often), **Rare** (rarely used), and **Restricted** (barely used or misbehaving — the tightest limits).",
          "**What the bucket affects**: how much background work the app can do, how many jobs and alarms it can run, and how much network access it gets. A 'Rare' app has its background jobs deferred much longer than an 'Active' one.",
          "The system moves apps between buckets automatically based on usage patterns (and OEMs/ML may influence it).",
        ],
      },
      {
        t: "p",
        text: "The implication for developers: you *cannot* assume your background work runs promptly if the user rarely opens your app — it'll be throttled into a lower bucket. So design for eventual (not immediate) execution, and for anything the user must be notified about regardless of how often they use the app, rely on *push (FCM)* rather than background polling — push delivery isn't subject to the same bucket throttling. This reinforces the general principle: don't depend on frequent, prompt background execution; use the OS-friendly mechanisms (WorkManager for deferrable work, push for real-time).",
      },
    ],
  },
  {
    level: "junior",
    q: "Which background tool would you use to sync data with a server?",
    a: [
      {
        t: "p",
        text: "**WorkManager — because syncing is deferrable, guaranteed work that should run reliably (surviving app kill and reboot) but doesn't need to happen at an exact instant.** It's the textbook WorkManager use case.",
      },
      {
        t: "list",
        items: [
          "You'd typically use a `PeriodicWorkRequest` (for regular background sync, minimum 15-minute interval) or a `OneTimeWorkRequest` (for a sync triggered by an event like pull-to-refresh or a push notification).",
          "Add **constraints** — `NetworkType.CONNECTED` (or `UNMETERED` for large syncs to save cellular data) — so it only runs when there's a network.",
          "Use **unique work** (`enqueueUniqueWork`/`enqueueUniquePeriodicWork` with `KEEP`) so repeated triggers don't create duplicate concurrent syncs.",
          "Return `Result.retry()` (with exponential backoff) on transient failures so a failed sync retries reliably.",
        ],
      },
      {
        t: "p",
        text: "The reasoning: sync must be *guaranteed* (it should eventually complete even if the app is closed), it's *deferrable* (running a few minutes later under the right conditions is fine), and it should be *battery-friendly* (constraints, respecting Doze) — exactly WorkManager's strengths. You would *not* use a plain coroine (it dies with the process, no guarantee), a background service (killed by Android 8+ limits), or AlarmManager (that's for exact timing, not deferrable work). For *real-time* server-driven updates, you'd pair WorkManager with push: an FCM message tells the app there's new data, and the app enqueues a one-time WorkManager sync to fetch it — far more efficient than frequent polling.",
      },
    ],
  },
  {
    level: "junior",
    q: "You need to notify the user of new server data in real time. Polling with WorkManager or something else?",
    a: [
      {
        t: "p",
        text: "**Use push notifications (Firebase Cloud Messaging), not polling.** Polling — repeatedly asking the server 'anything new?' on a timer — is the wrong approach for real-time updates: WorkManager's minimum periodic interval is 15 minutes (too slow for real-time), and even that runs on the system's schedule (deferred by Doze/App Standby), so polling is both *laggy* and *battery-wasteful* (most polls return 'nothing new', burning battery and data for no result).",
      },
      {
        t: "p",
        text: "**The right pattern inverts the model from *poll* to *push*:** instead of the app constantly asking, the *server* sends a push (FCM) message the moment there's new data. This is efficient (the app does nothing until there's genuinely something to deliver), real-time (the message arrives promptly — a *high-priority* FCM message can even wake the app from Doze), and battery-friendly (no wasted polling). When the push arrives, the app typically shows a notification and/or enqueues a WorkManager job to fetch the new data. So the architecture is: server → high-priority FCM push → app reacts (notify + sync). This is *the* answer to 'how do I get real-time updates', and knowing to reject polling in favor of push — and *why* (Doze/App Standby make polling both slow and wasteful, while push escapes Doze) — is exactly what the question tests.",
      },
    ],
  },
  {
    level: "senior",
    q: "Walk through how you'd choose the right background execution mechanism for a given task.",
    a: [
      {
        t: "p",
        text: "**I evaluate the task along four axes — immediate vs deferrable, guaranteed vs best-effort, exact-timing vs flexible, and user-visible vs invisible — and that determines the mechanism. Here's the decision flow:**",
      },
      {
        t: "list",
        items: [
          "**Is it immediate and tied to a screen?** (loading data to display) → a *coroutine in `viewModelScope`/`lifecycleScope`*. No need for background scheduling — it runs now, cancels when the screen is gone. Using WorkManager here would add overhead and latency for nothing.",
          "**Is it deferrable and must be guaranteed** (survive kill/reboot)? → *WorkManager*. This covers sync, uploads, backups, prefetch. Then refine: if it's *important and should run soon* (user tapped send) → WorkManager *expedited* work; if it's *long-running and user-visible* (large download) → WorkManager *foreground worker* (`setForeground`), which keeps the guarantee plus shows a notification.",
          "**Is it ongoing, continuous, and user-visible** (music, navigation, live location tracking)? → a *foreground service* with its mandatory notification. This is for a continuous task the user is aware of, not a discrete unit of work.",
          "**Does it need to fire at an exact time** (alarm, precise reminder)? → *AlarmManager* (exact alarm) — but only if exact timing is genuinely essential, given the restrictions; otherwise WorkManager.",
          "**Is it server-driven / needs to reach the user in real time** (chat message, breaking news)? → *push (FCM high-priority)*, not polling. The server notifies the app; the app reacts (notify + optionally a WorkManager sync).",
          "**Is it cross-process / in-app client-server communication**? → a *bound service* (AIDL for cross-process IPC) — rare, for multi-process apps.",
        ],
      },
      {
        t: "list",
        items: [
          "**The four-axis summary**: *immediate + UI* → coroutine; *deferrable + guaranteed* → WorkManager (with expedited/foreground variants for urgency/visibility); *ongoing + visible* → foreground service; *exact time* → AlarmManager; *server-driven/real-time* → FCM. Nearly every task maps cleanly onto one of these.",
          "**Common mistakes to call out**: using WorkManager for immediate UI work (unnecessary overhead); using a background service or polling for something that should be WorkManager or push (fights the OS restrictions, drains battery); using exact alarms for polling (battery abuse, needs special permission). The modern battery model rewards matching the tool precisely to the need.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: this is *the* core background-work competency, because Android's whole background story is about picking the mechanism that fits the task's *actual* requirements rather than defaulting to 'run something in the background'. The OS has progressively removed the ability to run arbitrary background work precisely to force this discipline. So the mature answer isn't a single tool — it's the *decision framework* (the four axes) plus knowing that the OS-friendly path for real-time is push and for reliable deferrable work is WorkManager. Demonstrating the flowchart, and *why* each restriction pushes you toward it, is what separates someone who understands modern Android background execution from someone who reaches for a service or a polling loop.",
      },
    ],
  },
  {
    level: "senior",
    q: "Why has Android progressively restricted background execution, and how should this shape your app's architecture?",
    a: [
      {
        t: "p",
        text: "**Android has tightened background execution in nearly every release since Android 6 because unrestricted background work was the primary cause of poor battery life and a significant privacy concern — apps running constantly, waking the device, accessing location and network in the background, draining battery the user attributed to 'Android being bad'. The OS took control of background execution to protect the user's battery and privacy, and the trend is only continuing.**",
      },
      {
        t: "list",
        items: [
          "**The progression**: Doze + App Standby (6, batch/throttle background work when idle or app unused); background service limits (8, kill background services shortly after the app leaves foreground); background location limits (10, restrict location access when not in use); foreground service + exact alarm restrictions (12, can't start FG services from background freely, exact alarms need permission); foreground service types with enforcement (14). Each step removes a way apps could run unrestricted background work.",
          "**The consistent principle**: background work must be either *deferrable and scheduled by the OS* (so it can be batched efficiently), *tied to genuine user awareness* (a foreground service with a notification), or *triggered by a legitimate, time-sensitive event* (a high-priority push). Silent, arbitrary, continuous background execution is being systematically eliminated.",
        ],
      },
      {
        t: "list",
        items: [
          "**How it shapes architecture**: (1) *Declare what and when, don't imperatively run* — use WorkManager to declare deferrable work with constraints and let the OS schedule it, rather than spinning up services. (2) *Invert polling to push* — for real-time/server-driven needs, use FCM so the server notifies the app, instead of the app polling (which the OS throttles anyway). (3) *Tie continuous work to user awareness* — use foreground services (with notifications) only for genuinely user-visible ongoing tasks. (4) *Persist and recover* — assume your process can be killed anytime (offline-first, save state), and use WorkManager's guarantees for work that must complete. (5) *Don't fight the model* — avoid wakelocks, battery-optimization exemptions, and exact-alarm-for-polling hacks; they're fragile, user-hostile, and increasingly blocked by Play policies.",
          "**The payoff**: an app designed *with* the battery model — deferrable work via WorkManager, real-time via push, continuous work via foreground services, resilient to process death — is more reliable *and* a better citizen, and it won't break with the next Android version's restrictions (which will only tighten further). An app that fights the model breaks repeatedly and drains battery.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: the restrictions aren't obstacles to route around — they're the OS enforcing a fundamentally better model where background work is *scheduled, justified, and battery-conscious* rather than *arbitrary and continuous*. The architectural response is to embrace that: declare deferrable work (WorkManager), react to pushes instead of polling (FCM), tie continuous work to user-visible foreground services, and build for process death. Being able to articulate the *why* (battery/privacy at the OS level), the *trajectory* (each version tightens further), and the *architectural implications* (push over poll, declare over imperatively-run, persist over assume-alive) is exactly the systems-level understanding these questions probe — it's the difference between knowing the APIs and understanding the platform's direction.",
      },
    ],
  },
];

export default qa;
