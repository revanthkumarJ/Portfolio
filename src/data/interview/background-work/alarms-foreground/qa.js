// AlarmManager & Foreground Services — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What is AlarmManager used for, and how does it differ from WorkManager?",
    a: [
      {
        t: "p",
        text: "**AlarmManager schedules work to run at a *specific, exact time* (or after a precise delay), even waking the device — it's the tool for exact timing.** Use it for things that must fire at a precise moment: an alarm clock, a calendar reminder at 9:00 AM, a medication reminder.",
      },
      {
        t: "p",
        text: "**The difference from WorkManager is *exact timing vs deferrable*.** WorkManager runs work when *convenient* under constraints (network, charging) — it's deferrable and battery-friendly, and doesn't guarantee a precise fire time. AlarmManager fires at an *exact* time you specify. So the decision is: does the work need to happen at a precise moment the user expects (reminder, alarm)? → AlarmManager. Can it run 'sometime soon under the right conditions' (sync, upload)? → WorkManager. AlarmManager fires a `PendingIntent` (usually to a BroadcastReceiver) when the time arrives; since `onReceive` must be fast, the receiver typically hands off real work to WorkManager or a foreground service. One more note: exact alarms are increasingly restricted (they wake the device and drain battery), requiring special permission on modern Android, so you should only use them when exact timing is genuinely essential.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a foreground service and when do you use one?",
    a: [
      {
        t: "p",
        text: "**A foreground service runs ongoing work that the user is *aware of*, showing a persistent (non-dismissible) notification. It's for tasks that must run continuously *right now* and that the user knows about** — music playback, turn-by-turn navigation, fitness/location tracking, an active call, a large ongoing download.",
      },
      {
        t: "list",
        items: [
          "**The mandatory notification is the point** — it tells the user the service is running and consuming resources, which is *why* the OS permits a foreground service to run when ordinary background services (since Android 8) can't.",
          "**You must call `startForeground(...)` promptly** (within seconds of starting) with a notification, or the system kills the service and throws.",
          "**Foreground service types** (Android 10+) — you declare a type like `location`, `mediaPlayback`, `camera`, `dataSync` in the manifest, and Android 14 requires the type to match the actual work.",
          "**It still runs on the main thread by default** — like any service, you must move the actual work to a background thread/coroutine.",
        ],
      },
      {
        t: "p",
        text: "You use it specifically for *ongoing, immediate, user-visible* work — not deferrable work (that's WorkManager) and not exact-time triggers (AlarmManager). A useful nuance: for guaranteed work that's *also* immediate and user-visible (a large upload that must complete), a *WorkManager foreground worker* (`setForeground`) is often better than a raw foreground service, because you get the notification plus WorkManager's persistence and retries. Use a raw foreground service for genuinely continuous tasks like media or navigation that aren't a discrete unit of work.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why are exact alarms restricted on modern Android?",
    a: [
      {
        t: "p",
        text: "**Because exact alarms wake the device at a precise time — potentially from a low-power Doze state — which drains battery, and apps were overusing them.** Firing exact alarms frequently, or using them for things that don't truly need exact timing (like periodic polling), was a significant battery cost across the ecosystem. So Android progressively restricted them to protect battery life.",
      },
      {
        t: "list",
        items: [
          "**Android 12+**: using exact alarms requires the `SCHEDULE_EXACT_ALARM` permission. On Android 13+/14, for most apps this became a *special* permission the user must grant in Settings — you can't just declare it and use it freely.",
          "**Genuine alarm/calendar apps** can use `USE_EXACT_ALARM` (granted at install) since exact timing is their core purpose, but general apps must justify and request `SCHEDULE_EXACT_ALARM` or avoid exact alarms.",
          "**Even exact alarms respect Doze** unless you use `setExactAndAllowWhileIdle`, which is itself rate-limited (you can't fire these too often).",
        ],
      },
      {
        t: "p",
        text: "The guidance that follows: only use exact alarms when the feature *fundamentally requires* firing at an exact, user-expected time — an alarm clock, a specific reminder. For anything deferrable — background sync, periodic tasks, notifications that don't need a precise second — use WorkManager, which is battery-friendly and needs no special permission. This is the same theme as the broader background restrictions: the OS steers you away from battery-draining precise wakeups toward deferrable, batched, constraint-based work, and reserves exact timing for the narrow cases that genuinely need it.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the relationship between AlarmManager, BroadcastReceiver, and doing actual work?",
    a: [
      {
        t: "p",
        text: "**AlarmManager fires a `PendingIntent` (typically targeting a `BroadcastReceiver`) at the scheduled time; the receiver's `onReceive` runs briefly to *react*, but because `onReceive` must be fast, it hands off any real work to WorkManager or a foreground service.** These three pieces form the common exact-time work pattern.",
      },
      {
        t: "list",
        items: [
          "**AlarmManager** — schedules the trigger (the *when*), firing a PendingIntent at the exact time.",
          "**BroadcastReceiver** — receives the fired intent in `onReceive`. But `onReceive` runs on the main thread with a ~10-second limit, so it's only for a quick reaction (show a notification, enqueue work) — *not* for actual heavy work.",
          "**WorkManager / foreground service** — where the real work goes. If the alarm needs to trigger a sync or a substantial task, the receiver enqueues a WorkManager job or starts a foreground service, which does the work properly off the main thread.",
        ],
      },
      {
        t: "p",
        text: "So a medication reminder at an exact time might be: AlarmManager fires at the time → BroadcastReceiver's `onReceive` runs → it posts a notification (quick, fine to do in onReceive) or, if it needs to fetch data first, enqueues a WorkManager job to do that and then notify. The key rule is *don't do slow work in onReceive* — it's a trigger, and heavier work belongs in WorkManager (deferrable) or a foreground service (immediate/ongoing). This mirrors the general principle that BroadcastReceivers are lightweight reaction points, not places to do the actual work.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are the restrictions on starting foreground services from the background, and why do they exist?",
    a: [
      {
        t: "p",
        text: "**Since Android 12, apps generally cannot start a foreground service while the app is in the background — attempting to throws a `ForegroundServiceStartNotAllowedException`. This exists to stop apps from silently launching foreground services (and their persistent, resource-consuming work) when the user isn't actively engaging with the app.** It's part of the same battery-and-privacy tightening as the background service and exact-alarm restrictions.",
      },
      {
        t: "list",
        items: [
          "**The problem it addresses**: before this, an app could wake up in the background (via a broadcast, a job) and start a foreground service to do ongoing work, effectively bypassing background limits. Multiplied across many apps, this drained battery and let apps run persistent work the user didn't initiate. The restriction closes that loophole.",
          "**The exceptions (allowed background starts)**: you *can* start a foreground service from the background in specific sanctioned cases — in response to a *user action* (even recent), from a *high-priority FCM message* (so a genuinely time-sensitive push, like an incoming call, can start a service), from an *exact alarm* the user set, from a `BOOT_COMPLETED` receiver for certain types, when the app is granted certain permissions (like a device admin), etc. The common thread: there's a legitimate, user-relevant trigger.",
          "**Android 13+/14 further tightening**: added per-type requirements and, in 14, requires that the declared foreground service type genuinely matches the work, with runtime enforcement — using `location` type without actually needing location, for example, is rejected.",
        ],
      },
      {
        t: "list",
        items: [
          "**How to work within it**: for time-sensitive server-driven work, use a *high-priority FCM message* (which is an allowed trigger and can start a foreground service or expedited work). For deferrable work, use WorkManager (which can escalate to a foreground *worker* under its own rules). For truly user-initiated ongoing tasks, start the foreground service *from the user's action* while the app is foregrounded. The general strategy is to tie foreground-service starts to a legitimate trigger rather than trying to run one from arbitrary background code.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: the background-start restriction reflects Android's consistent philosophy — persistent, resource-consuming work should be *tied to user awareness or a legitimate, user-relevant trigger*, not started silently whenever the app happens to wake up. The exceptions are precisely the 'user-relevant' cases (user action, high-priority push, user-set alarm). So the right mental model isn't 'how do I bypass this' but 'what legitimate trigger justifies this foreground work' — usually a user action or an FCM push. Understanding the *why* (preventing silent background resource use) and the sanctioned triggers (rather than fighting the restriction) is what demonstrates you're building within Android's modern background-execution model, which is exactly what these questions probe.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do bound services and IPC (AIDL) work, and when would you need them?",
    a: [
      {
        t: "p",
        text: "**A bound service exposes an interface that other components `bindService()` to and call methods on — a client-server relationship where the service lives while bound. When the client and service are in *different processes*, this cross-process method calling is IPC (Inter-Process Communication), implemented with AIDL (Android Interface Definition Language) on top of Android's Binder mechanism.** You need them for genuinely multi-process scenarios, which most apps don't have — but they come up in depth questions and specific architectures.",
      },
      {
        t: "list",
        items: [
          "**Bound service basics**: the client calls `bindService()`, gets back an `IBinder` (via `onServiceConnected`), and casts it to an interface to call the service's methods. The service runs as long as at least one client is bound (`unbindService` releases it). Within a single process, the binder is just a direct object reference — simple method calls.",
          "**Cross-process → AIDL**: when the service is in a *different process* (another app, or your own app's separate process via `android:process`), you can't share object references — the call must be *marshalled* (serialized) across the process boundary. AIDL is a small interface definition language; you write a `.aidl` file describing the methods, and the build generates the stub/proxy code that marshals arguments and return values across processes. AIDL supports concurrent calls (multi-threaded) — the reason to use it over the simpler `Messenger`.",
          "**Binder is the underlying transport**: all Android IPC (AIDL, Messenger, ContentProviders, even Intents to a degree) ultimately goes through the kernel Binder driver, which has the ~1MB per-transaction limit (the source of `TransactionTooLargeException`). AIDL/Messenger/ContentProvider are higher-level APIs over Binder.",
          "**Simpler alternative — `Messenger`**: if you don't need concurrent cross-process calls, `Messenger` provides message-based IPC (serialized through a single Handler, so calls are queued) — much simpler than AIDL. Use AIDL only when you need a full concurrent interface across processes.",
        ],
      },
      {
        t: "list",
        items: [
          "**When you'd actually need this**: exposing a service to *other apps* (a shared platform service), an app deliberately split into *multiple processes* (isolating a memory-heavy or crash-prone component that must still communicate with the main process), or communicating with certain *system services*. For the vast majority of apps — single process, no cross-app service — you never write AIDL; you use normal method calls, coroutines, and shared repositories.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: bound services and AIDL solve *cross-boundary communication* — one process calling methods in another — which Android handles by marshalling calls over Binder. AIDL generates the marshalling code for a concurrent interface; Messenger is the simpler serialized alternative; both sit on Binder (with its transaction-size limit). The honest note is that these are *specialized* tools for multi-process or cross-app scenarios that most apps don't have, so the mature answer is knowing what they're *for* and that Binder underlies all IPC, while recognizing that reaching for AIDL in a normal single-process app would be a serious over-complication — you'd use a shared repository and coroutines instead.",
      },
    ],
  },
];

export default qa;
