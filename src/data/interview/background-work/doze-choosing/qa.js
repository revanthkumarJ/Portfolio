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
  {
    level: "senior",
    q: "What happens to network and jobs during Doze?",
    a: [
      {
        t: "p",
        text: "In Doze, the system *suspends* network access, *defers* jobs/syncs/alarms to periodic *maintenance windows*, ignores wakelocks, and doesn't fire standard alarms until the window. Maintenance windows occur periodically (less often the longer the device is idle). So background work batches up and runs in bursts during these windows, dramatically reducing battery drain — but delaying your app's background work.",
      },
      {
        t: "list",
        items: [
          "**Network suspended** — no access outside maintenance windows.",
          "**Jobs/syncs/alarms deferred** — to maintenance windows.",
          "**Wakelocks ignored** — can't keep the CPU awake.",
          "**Maintenance windows** — periodic, less frequent over time.",
        ],
      },
      {
        t: "note",
        text: "In Doze, the system suspends network access, defers jobs/syncs/alarms to periodic maintenance windows, and ignores wakelocks — background work batches and runs in bursts during windows (which get less frequent the longer idle). Dramatically saves battery but delays background work. FCM high-priority and AllowWhileIdle alarms are exceptions.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do FCM high-priority messages interact with Doze?",
    a: [
      {
        t: "p",
        text: "*High-priority* FCM messages can *wake the device from Doze* and give your app a brief window to run (e.g. show a notification, fetch data) — they bypass Doze restrictions for time-sensitive delivery (chat messages, calls). *Normal-priority* messages are deferred until the next maintenance window. Use high priority *only* for genuinely time-sensitive, user-visible messages (abuse leads to throttling); this is the recommended way to deliver real-time updates without polling.",
      },
      {
        t: "list",
        items: [
          "**High-priority FCM** — wakes from Doze; brief run window.",
          "**Normal-priority** — deferred to maintenance windows.",
          "**Use sparingly** — only time-sensitive/user-visible (abuse → throttling).",
          "**Real-time** — the way to push updates without polling.",
        ],
      },
      {
        t: "note",
        text: "High-priority FCM messages wake the device from Doze and give a brief run window (notification/fetch) — for time-sensitive delivery (chat/calls), bypassing Doze. Normal-priority is deferred to maintenance windows. Use high priority only for genuinely time-sensitive user-visible messages (abuse → throttling). The recommended real-time delivery without polling.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is battery optimization, and what does 'ignore battery optimizations' do?",
    a: [
      {
        t: "p",
        text: "*Battery optimization* (Doze + App Standby) is applied to apps by default to limit their background activity. The `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` special permission lets an app ask the user to *exempt* it — removing most background restrictions. But Google Play *restricts* this to apps that genuinely need it (alarms, comms, device management); requesting it without justification can get an app rejected. Prefer designing within the restrictions.",
      },
      {
        t: "list",
        items: [
          "**Battery optimization** — Doze + App Standby on by default.",
          "**Ignore/exempt** — special permission removes most restrictions.",
          "**Play-restricted** — only justified use cases (alarms/comms).",
          "**Prefer** — design within the restrictions, not exemption.",
        ],
      },
      {
        t: "note",
        text: "Battery optimization (Doze + App Standby) limits background activity by default. REQUEST_IGNORE_BATTERY_OPTIMIZATIONS lets an app ask to be exempted (removing most restrictions), but Google Play restricts it to genuinely-needing apps (alarms/comms/device management) — misuse risks rejection. Prefer designing within the restrictions.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is adaptive battery, and how does it affect background work?",
    a: [
      {
        t: "p",
        text: "*Adaptive Battery* (Android 9+) uses on-device ML to learn which apps the user uses and *prioritizes* battery/resources accordingly — apps the user rarely opens get more aggressively restricted (placed in lower standby buckets, throttled jobs/FCM). It's dynamic and per-user. The takeaway: background reliability isn't guaranteed and varies by user engagement, so design essential features to work with minimal background dependency.",
      },
      {
        t: "list",
        items: [
          "**Adaptive Battery (API 28+)** — ML-driven resource prioritization.",
          "**Rarely-used apps restricted** — lower buckets, throttled.",
          "**Per-user, dynamic** — varies by engagement.",
          "**Design** — essential features with minimal background dependency.",
        ],
      },
      {
        t: "note",
        text: "Adaptive Battery (Android 9+) uses on-device ML to prioritize resources for apps the user actually uses — rarely-opened apps get more aggressively restricted (lower standby buckets, throttled jobs/FCM). It's dynamic/per-user, so background reliability varies by engagement — design essential features to need minimal background work.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you choose between WorkManager, foreground service, and AlarmManager?",
    a: [
      {
        t: "p",
        text: "Decide by *urgency*, *visibility*, and *timing*: deferrable, guaranteed work → *WorkManager* (sync, upload, cleanup); user-visible, immediate, ongoing work → *foreground service* (music, navigation, active tracking); exact-time trigger → *AlarmManager* (alarm clock, reminder). For real-time server-pushed updates → *FCM* (not polling). Prefer the most deferrable/least intrusive mechanism that meets the need.",
      },
      {
        t: "table",
        headers: ["Need", "Tool"],
        rows: [
          ["Deferrable guaranteed work", "WorkManager"],
          ["Immediate user-visible ongoing", "Foreground service"],
          ["Exact time", "AlarmManager"],
          ["Real-time server push", "FCM"],
        ],
      },
      {
        t: "list",
        items: [
          "**WorkManager** — deferrable/guaranteed (sync/upload).",
          "**Foreground service** — immediate/visible/ongoing.",
          "**AlarmManager** — exact time.",
          "**FCM** — real-time push (not polling).",
        ],
      },
      {
        t: "note",
        text: "Choose by urgency/visibility/timing: WorkManager (deferrable guaranteed — sync/upload), foreground service (immediate user-visible ongoing — music/nav), AlarmManager (exact time — alarms/reminders), FCM (real-time server push, not polling). Prefer the most deferrable/least-intrusive mechanism that meets the need.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why should you use FCM push instead of polling for updates?",
    a: [
      {
        t: "p",
        text: "*Polling* (repeatedly asking the server 'anything new?') wastes battery and data (frequent wakeups/requests), is delayed (updates arrive only on the next poll), and is throttled by Doze/buckets. *FCM push* lets the *server notify the app* when something changes — instant, battery-efficient (the system's single persistent connection serves all apps), and works through Doze (high-priority). Prefer push for real-time updates; use WorkManager for periodic baseline sync.",
      },
      {
        t: "list",
        items: [
          "**Polling** — wasteful, delayed, throttled.",
          "**FCM push** — server notifies; instant, battery-efficient.",
          "**Single connection** — the system shares one for all apps.",
          "**Through Doze** — high-priority messages wake the device.",
        ],
      },
      {
        t: "note",
        text: "Polling wastes battery/data (frequent wakeups), is delayed, and is throttled by Doze/buckets. FCM push lets the server notify the app instantly and efficiently (the system's single persistent connection serves all apps, works through Doze via high-priority). Prefer push for real-time; WorkManager for periodic baseline sync.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle background location updates given the restrictions?",
    a: [
      {
        t: "p",
        text: "Background location is heavily restricted: it needs the separate `ACCESS_BACKGROUND_LOCATION` permission (granted via Settings, after foreground), and continuous updates require a *foreground service* (type `location`) with a visible notification. For occasional background location, use the batched/passive APIs or geofencing (system-managed, battery-efficient). Request the minimum precision/frequency, and be transparent — Play scrutinizes background location use.",
      },
      {
        t: "list",
        items: [
          "**`ACCESS_BACKGROUND_LOCATION`** — separate, Settings-granted permission.",
          "**Continuous** — foreground service (type location) + notification.",
          "**Occasional** — geofencing/passive/batched APIs (efficient).",
          "**Minimize + transparent** — Play scrutinizes background location.",
        ],
      },
      {
        t: "note",
        text: "Background location is restricted: needs ACCESS_BACKGROUND_LOCATION (separate, Settings-granted after foreground); continuous updates require a foreground service (type location) + notification. For occasional needs use geofencing/passive/batched APIs (battery-efficient). Request minimum precision/frequency; Play scrutinizes background location use.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between Doze and App Standby?",
    a: [
      {
        t: "p",
        text: "*Doze* is *device-wide* — triggered when the *whole device* is unused (screen off, stationary, unplugged), deferring all apps' background work into maintenance windows. *App Standby* is *per-app* — an individual app the user hasn't interacted with recently gets its background access restricted (regardless of device state). Doze responds to device idleness; App Standby to per-app inactivity. Both reduce battery drain from background work.",
      },
      {
        t: "list",
        items: [
          "**Doze** — device-wide; whole device idle.",
          "**App Standby** — per-app; individual app unused.",
          "**Trigger** — device idleness vs app inactivity.",
          "**Both** — restrict background work for battery.",
        ],
      },
      {
        t: "note",
        text: "Doze is device-wide (whole device idle — screen off/stationary/unplugged — deferring all apps' background work to maintenance windows); App Standby is per-app (an individual unused app gets restricted regardless of device state). Doze responds to device idleness, App Standby to per-app inactivity. Both save battery.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test how your app behaves in Doze and App Standby?",
    a: [
      {
        t: "p",
        text: "Use `adb` to force these states: `adb shell dumpsys deviceidle force-idle` (enter Doze), `unforce`/`step` to advance, and `adb shell am set-inactive <pkg> true` (App Standby). Then verify your background work behaves correctly (deferred, resumes in maintenance windows, high-priority FCM still delivers). Testing these ensures your app's background features are reliable under real-world battery restrictions.",
      },
      {
        t: "list",
        items: [
          "**`dumpsys deviceidle force-idle`** — force Doze.",
          "**`am set-inactive <pkg> true`** — App Standby.",
          "**Verify** — deferral, maintenance-window resume, FCM delivery.",
          "**Reliability** — under real battery restrictions.",
        ],
      },
      {
        t: "note",
        text: "Force Doze/App Standby with adb: adb shell dumpsys deviceidle force-idle (+unforce/step) and adb shell am set-inactive <pkg> true. Verify background work defers correctly, resumes in maintenance windows, and high-priority FCM still delivers — ensuring reliability under real battery restrictions.",
      },
    ],
  },
  {
    level: "junior",
    q: "When is a persistent WebSocket appropriate versus FCM on mobile?",
    a: [
      {
        t: "p",
        text: "A *persistent WebSocket* is appropriate for *active, foreground* real-time features (a live chat screen open, a trading dashboard, an ongoing call) where low-latency bidirectional communication is needed *while the user is engaged*. But you *can't* keep it alive in the background (Doze/backgrounding kill it) — so for *background* real-time delivery, use *FCM*. The pattern: WebSocket while foregrounded, FCM to wake/notify when backgrounded.",
      },
      {
        t: "list",
        items: [
          "**WebSocket** — active foreground real-time (chat screen, dashboard, call).",
          "**Can't background** — Doze/backgrounding kill it.",
          "**FCM** — background real-time delivery.",
          "**Combine** — WebSocket foreground, FCM background.",
        ],
      },
      {
        t: "note",
        text: "A persistent WebSocket suits active foreground real-time features (open chat screen, dashboard, ongoing call) needing low-latency bidirectional communication while engaged — but can't survive backgrounding/Doze. Use FCM for background real-time delivery. Pattern: WebSocket while foregrounded, FCM to wake/notify when backgrounded.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you architect an offline-first app given background restrictions?",
    a: [
      {
        t: "p",
        text: "Make the *local DB the single source of truth* — the UI always reads from it, so the app works fully offline regardless of background limits. *WorkManager* syncs the DB (deferrable, guaranteed); *FCM* triggers immediate syncs for freshness. Writes queue locally (outbox) and sync when possible. This decouples the app's usability from background execution — the restrictions delay *sync freshness*, not *availability*.",
      },
      {
        t: "list",
        items: [
          "**DB source of truth** — UI reads it; works offline.",
          "**WorkManager sync** — deferrable, guaranteed.",
          "**FCM** — immediate sync triggers.",
          "**Outbox** — queue writes; sync when possible.",
        ],
      },
      {
        t: "note",
        text: "Offline-first given background limits: local DB as single source of truth (UI reads it — works offline regardless of restrictions), WorkManager to sync (deferrable/guaranteed), FCM for immediate sync triggers, an outbox for queued writes. Decouples usability from background execution — restrictions delay freshness, not availability.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the Restricted App Standby bucket, and how do you avoid it?",
    a: [
      {
        t: "p",
        text: "The *Restricted* bucket is the most limited — apps land there for *bad behavior* (excessive background work, wakelocks, battery drain) or user restriction. Restricted apps get *very limited* background jobs, alarms, and FCM. Avoid it by being a *good background citizen*: minimize wakelocks and background work, use WorkManager/FCM appropriately, and don't drain battery. Users can also manually restrict an app.",
      },
      {
        t: "list",
        items: [
          "**Restricted bucket** — most limited; for bad behavior/user restriction.",
          "**Very limited** — jobs/alarms/FCM.",
          "**Avoid** — minimize wakelocks/background work; be efficient.",
          "**Manual** — users can restrict an app too.",
        ],
      },
      {
        t: "note",
        text: "The Restricted App Standby bucket is the most limited (very few jobs/alarms/FCM) — apps land there for bad behavior (excessive background work/wakelocks/battery drain) or user restriction. Avoid it by being a good background citizen (minimize wakelocks/background work, use WorkManager/FCM appropriately). Users can also manually restrict apps.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a wakelock, and why should you avoid holding one?",
    a: [
      {
        t: "p",
        text: "A `WakeLock` keeps the CPU (or screen) awake, preventing the device from sleeping. Holding one drains battery fast and is a common cause of poor battery life — and Doze *ignores* wakelocks anyway. Modern APIs (WorkManager, foreground services) manage wake state for you, so you rarely need a wakelock. If you must, use `PARTIAL_WAKE_LOCK` for the shortest time and always release it.",
      },
      {
        t: "list",
        items: [
          "**`WakeLock`** — keeps CPU/screen awake.",
          "**Battery drain** — a common poor-battery cause; a leak keeps the device awake.",
          "**Ignored in Doze** — anyway.",
          "**Rarely needed** — WorkManager/foreground services manage it.",
        ],
      },
      {
        t: "note",
        text: "A WakeLock keeps the CPU/screen awake (prevents sleep) — holding one drains battery fast (a leak is a common poor-battery cause), and Doze ignores wakelocks anyway. WorkManager/foreground services manage wake state, so you rarely need one; if you must, use PARTIAL_WAKE_LOCK briefly and always release it.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you minimize your app's battery impact from background work?",
    a: [
      {
        t: "p",
        text: "Batch work (constraints, WorkManager batching), defer non-urgent tasks, use FCM push instead of polling, avoid wakelocks and frequent alarms, coalesce network requests, respect Doze/buckets, and use appropriate constraints (charging/unmetered) for heavy work. Profile battery with the *Battery Historian*/Android vitals. The principle: do as little background work as possible, as batched and deferred as possible.",
      },
      {
        t: "list",
        items: [
          "**Batch + defer** — constraints, WorkManager batching.",
          "**Push over polling** — FCM.",
          "**Avoid wakelocks/frequent alarms** — big drainers.",
          "**Constraints for heavy work** — charging/unmetered; profile with vitals.",
        ],
      },
      {
        t: "note",
        text: "Minimize battery impact: batch/defer work (constraints, WorkManager), use FCM push over polling, avoid wakelocks and frequent alarms, coalesce requests, respect Doze/buckets, constrain heavy work to charging/unmetered. Profile with Battery Historian/Android vitals. Principle: as little background work as possible, batched and deferred.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the impact of App Standby buckets on FCM message delivery?",
    a: [
      {
        t: "p",
        text: "App Standby buckets impose a *quota* on how many *normal-priority* FCM messages an app can receive — lower buckets get fewer. *High-priority* messages are generally exempt (delivered promptly) but should be reserved for time-sensitive, user-visible content. So a rarely-used app's normal-priority messages may be delayed/limited. Use high priority judiciously for messages that must arrive immediately.",
      },
      {
        t: "list",
        items: [
          "**Normal-priority quota** — limited by bucket (lower = fewer).",
          "**High-priority** — generally exempt; delivered promptly.",
          "**Rarely-used apps** — normal messages delayed/limited.",
          "**Use high priority** — only for time-sensitive/visible.",
        ],
      },
      {
        t: "note",
        text: "App Standby buckets impose a quota on normal-priority FCM messages (lower buckets = fewer); high-priority messages are generally exempt (prompt delivery) but should be reserved for time-sensitive user-visible content. Rarely-used apps' normal messages may be delayed/limited. Use high priority judiciously.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle a task that must run soon but not exactly now?",
    a: [
      {
        t: "p",
        text: "For 'run reasonably soon but not exact-time' (send a queued message when back online), use *expedited WorkManager work* (`setExpedited`) — it requests immediate execution with a quota and network constraints. It's more urgent than normal deferred work but still battery-aware (unlike an exact alarm or a foreground service). If it's genuinely user-initiated and time-sensitive, expedited work is the sweet spot between deferred and immediate.",
      },
      {
        t: "list",
        items: [
          "**Expedited work** — run ASAP with a quota.",
          "**Between deferred and immediate** — not exact, not ongoing.",
          "**Battery-aware** — unlike alarms/foreground services.",
          "**User-initiated** — send message, immediate sync.",
        ],
      },
      {
        t: "note",
        text: "For 'run soon but not exact-time' (send a queued message on reconnect), use expedited WorkManager work (setExpedited) — immediate-ish execution with a quota and constraints, battery-aware (unlike exact alarms/foreground services). The sweet spot between deferred and immediate for user-initiated time-sensitive tasks.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do aggressive OEM battery managers affect background work?",
    a: [
      {
        t: "p",
        text: "Beyond stock Android, some OEMs (Xiaomi, Huawei, OnePlus, Samsung) add *aggressive* battery managers that kill background processes, restrict auto-start, and ignore standard scheduling even more than stock Doze — so WorkManager/alarms/FCM may not run reliably on those devices. Mitigate by prompting the user to whitelist the app / disable battery restrictions (with guidance), relying on FCM (which OEMs generally respect), and testing on affected devices. The `dontkillmyapp.com` site documents per-OEM behavior.",
      },
      {
        t: "list",
        items: [
          "**Aggressive OEMs** — kill background, restrict auto-start beyond stock.",
          "**Unreliable scheduling** — WorkManager/alarms may not run.",
          "**Mitigate** — prompt to whitelist/disable restrictions; rely on FCM.",
          "**Test on affected devices** — Xiaomi/Huawei/OnePlus/Samsung.",
        ],
      },
      {
        t: "note",
        text: "Some OEMs (Xiaomi/Huawei/OnePlus/Samsung) add aggressive battery managers that kill background processes and restrict auto-start beyond stock Doze — so WorkManager/alarms/FCM may run unreliably. Mitigate: prompt to whitelist/disable restrictions, rely on FCM (generally respected), test on affected devices (see dontkillmyapp.com).",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you diagnose and reduce your app's battery drain?",
    a: [
      {
        t: "p",
        text: "Measure with *Battery Historian* (parse a bug report to see wakeups, wakelocks, jobs, network per app), Android Studio's *Energy Profiler*, and Play Console's *Android vitals* (excessive wakeups, wakelocks, background usage). Identify the culprits (frequent alarms/jobs, held wakelocks, chatty network) and reduce them: batch work, defer, use FCM over polling, release wakelocks, and add constraints. Vitals also flags apps for excessive background battery use.",
      },
      {
        t: "list",
        items: [
          "**Battery Historian / Energy Profiler** — wakeups, wakelocks, jobs, network.",
          "**Android vitals** — excessive wakeups/wakelocks/background usage.",
          "**Reduce** — batch/defer, FCM over polling, release wakelocks, constraints.",
          "**Iterate** — measure, fix the worst offenders, re-measure.",
        ],
      },
      {
        t: "note",
        text: "Diagnose battery drain with Battery Historian (bug report → wakeups/wakelocks/jobs/network), Energy Profiler, and Play Android vitals (excessive wakeups/wakelocks/background). Reduce: batch/defer work, FCM over polling, release wakelocks, add constraints. Vitals flags excessive background battery use — measure, fix, re-measure.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between deferrable and time-critical background work?",
    a: [
      {
        t: "p",
        text: "*Deferrable* work can run *whenever the system finds it convenient* (within battery/Doze constraints) — sync, upload, cleanup — perfectly suited to WorkManager. *Time-critical* work must run at a *specific moment* (an alarm) or *immediately* (a user-visible action). The distinction drives tool choice: deferrable → WorkManager (batched, battery-friendly); time-critical → AlarmManager (exact) or foreground service/FCM (immediate). Most background work is (and should be treated as) deferrable.",
      },
      {
        t: "list",
        items: [
          "**Deferrable** — run when convenient; WorkManager.",
          "**Time-critical** — exact moment (AlarmManager) or immediate (FG service/FCM).",
          "**Drives tool choice** — batched vs precise/urgent.",
          "**Most work** — is/should be deferrable.",
        ],
      },
      {
        t: "note",
        text: "Deferrable work runs when the system finds convenient (within constraints/Doze) — sync/upload/cleanup, ideal for WorkManager. Time-critical work needs an exact moment (AlarmManager) or immediate execution (foreground service/FCM). Most background work is/should be treated as deferrable — it's more battery-friendly and reliable.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do FCM data messages trigger background work?",
    a: [
      {
        t: "p",
        text: "An FCM *data message* delivers a payload to your `FirebaseMessagingService.onMessageReceived`, where you can *enqueue WorkManager* to do the actual work (sync, download) — since `onMessageReceived` runs briefly and, if the app is backgrounded, you have limited time. High-priority data messages wake the device from Doze for this. The pattern: FCM as the *trigger*, WorkManager as the *executor* of guaranteed background work.",
      },
      {
        t: "list",
        items: [
          "**Data message** → `onMessageReceived`.",
          "**Enqueue WorkManager** — for the actual (guaranteed) work.",
          "**High-priority** — wakes from Doze; limited run time.",
          "**FCM = trigger, WorkManager = executor**.",
        ],
      },
      {
        t: "note",
        text: "An FCM data message hits FirebaseMessagingService.onMessageReceived (brief, limited time when backgrounded) — enqueue WorkManager there for the actual work (sync/download). High-priority data messages wake the device from Doze. Pattern: FCM as the trigger, WorkManager as the executor of guaranteed background work.",
      },
    ],
  },
  {
    level: "junior",
    q: "If you must poll, how do you choose a sensible interval?",
    a: [
      {
        t: "p",
        text: "First, prefer push (FCM) over polling. If you must poll, use the *longest* interval that meets the requirement (WorkManager periodic min is 15 min anyway), add constraints (network, maybe charging), use *adaptive* intervals (poll more when the user is active, less when idle), and stop polling when not needed (screen off / backgrounded). Frequent polling drains battery and gets throttled by Doze/buckets — minimize it.",
      },
      {
        t: "list",
        items: [
          "**Prefer push** — FCM over polling.",
          "**Longest acceptable interval** — WorkManager min 15 min.",
          "**Adaptive** — more when active, less when idle.",
          "**Stop when not needed** — screen off/backgrounded.",
        ],
      },
      {
        t: "note",
        text: "Prefer FCM push. If you must poll: use the longest acceptable interval (WorkManager periodic min is 15 min), add constraints (network/charging), poll adaptively (more when active, less when idle), and stop when not needed (screen off/backgrounded). Frequent polling drains battery and is throttled — minimize it.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do constraints, Doze, and standby buckets together determine when work runs?",
    a: [
      {
        t: "p",
        text: "Work runs only when *all* factors align: your *constraints* are satisfied (network/charging), the device isn't restricting it via *Doze* (deferred to maintenance windows if idle), and the app's *standby bucket* quota allows it (lower buckets = less frequent). So the actual run time is the *intersection* of these — 'when my constraints are met AND the system's battery policies permit'. This is why background timing is *never* guaranteed, only eventual.",
      },
      {
        t: "list",
        items: [
          "**Constraints** — your conditions (network/charging).",
          "**Doze** — defers when the device is idle.",
          "**Standby bucket** — quota by app usage.",
          "**Intersection** — runs when all align; timing not guaranteed.",
        ],
      },
      {
        t: "note",
        text: "Work runs at the intersection of: your constraints being met (network/charging), Doze not deferring it (maintenance windows when idle), and the standby bucket quota allowing it (lower buckets = less frequent). Actual timing is 'constraints met AND battery policies permit' — which is why background execution is eventual, never guaranteed-when.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you keep essential features reliable despite background restrictions?",
    a: [
      {
        t: "p",
        text: "Design so essential functionality *doesn't depend on background execution*: offline-first with a local DB source of truth (the app works fully without background sync), FCM for server-pushed updates (respected across restrictions), and refresh-on-open (sync when the user opens the app). Treat background sync as an *optimization* for freshness, not a requirement for the app to function. This makes the app reliable regardless of Doze/buckets/OEMs.",
      },
      {
        t: "list",
        items: [
          "**Offline-first** — local DB source of truth; works without background.",
          "**FCM** — server push, respected across restrictions.",
          "**Refresh-on-open** — sync when the user returns.",
          "**Background = optimization** — not a functional requirement.",
        ],
      },
      {
        t: "note",
        text: "Keep essential features reliable by not depending on background execution: offline-first (local DB source of truth — works without background sync), FCM for pushed updates (respected across restrictions), refresh-on-open (sync when the user returns). Treat background sync as a freshness optimization, not a requirement — reliable regardless of Doze/buckets/OEMs.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the maintenance window in Doze, and how often does it occur?",
    a: [
      {
        t: "p",
        text: "A *maintenance window* is a brief period during Doze when the system *temporarily lifts* restrictions — deferred jobs, syncs, and alarms all run, and network access is restored. Windows occur *periodically* but *progressively less often* the longer the device stays idle (from every hour or so down to once every few hours). So deferred background work batches up and executes in these bursts, then the device returns to deep idle.",
      },
      {
        t: "list",
        items: [
          "**Maintenance window** — restrictions briefly lifted; deferred work runs.",
          "**Periodic** — occurs regularly during Doze.",
          "**Less frequent over time** — longer idle = rarer windows.",
          "**Batched bursts** — work executes, then back to deep idle.",
        ],
      },
      {
        t: "note",
        text: "A Doze maintenance window is a brief period when restrictions lift — deferred jobs/syncs/alarms run and network is restored. Windows occur periodically but progressively less often the longer the device stays idle (hourly down to every few hours). Deferred background work batches and runs in these bursts.",
      },
    ],
  },
];

export default qa;
