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
  {
    level: "junior",
    q: "How do you schedule an alarm with AlarmManager?",
    a: [
      {
        t: "p",
        text: "Get the `AlarmManager` system service and call `setExactAndAllowWhileIdle`/`setAndAllowWhileIdle`/`setWindow` with a trigger time and a `PendingIntent` (usually to a `BroadcastReceiver`). The alarm fires the PendingIntent at the scheduled time, even from the background — for exact/time-critical scheduling. Choose the method by how precise/battery-friendly you need it.",
      },
      {
        t: "code",
        title: "Scheduling an alarm",
        code: `val pi = PendingIntent.getBroadcast(ctx, 0, Intent(ctx, AlarmReceiver::class.java),
    PendingIntent.FLAG_IMMUTABLE)
alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pi)`,
      },
      {
        t: "list",
        items: [
          "**`AlarmManager` service** — `getSystemService`.",
          "**`set*`** — `setExactAndAllowWhileIdle`/`setWindow`/`setAndAllowWhileIdle`.",
          "**`PendingIntent`** — usually to a `BroadcastReceiver`.",
          "**RTC vs ELAPSED_REALTIME** — wall-clock vs boot-relative time.",
        ],
      },
      {
        t: "note",
        text: "Schedule with AlarmManager.set*/setExactAndAllowWhileIdle(type, triggerMillis, pendingIntent) — the PendingIntent (usually to a BroadcastReceiver) fires at the time, even from the background. RTC_WAKEUP = wall-clock + wake device; ELAPSED_REALTIME = boot-relative. Choose exact vs inexact by precision/battery needs.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between exact and inexact alarms?",
    a: [
      {
        t: "p",
        text: "*Exact* alarms (`setExact`/`setExactAndAllowWhileIdle`) fire at a precise time — for alarms/clocks/calendar reminders. *Inexact* alarms (`set`/`setWindow`/`setInexactRepeating`) fire *around* a time, letting the system batch them for battery efficiency. Exact alarms are *restricted* (need permission on modern Android) because they wake the device precisely, hurting battery — use inexact unless the exact time genuinely matters to the user.",
      },
      {
        t: "list",
        items: [
          "**Exact** — precise time; for user-critical timing (alarm clock).",
          "**Inexact** — approximate; batched for battery.",
          "**Exact restricted** — needs permission (`SCHEDULE_EXACT_ALARM`).",
          "**Prefer inexact** — unless exact time matters to the user.",
        ],
      },
      {
        t: "note",
        text: "Exact alarms (setExact*) fire at a precise time (alarm clock, reminders) but are restricted (need SCHEDULE_EXACT_ALARM on modern Android — battery). Inexact alarms (set/setWindow/setInexactRepeating) fire around a time, batched for battery. Prefer inexact unless the exact time genuinely matters to the user.",
      },
    ],
  },
  {
    level: "senior",
    q: "What permission do exact alarms require on modern Android?",
    a: [
      {
        t: "p",
        text: "On Android 12+ (API 31), exact alarms require the `SCHEDULE_EXACT_ALARM` permission (or `USE_EXACT_ALARM` on API 33+ for calendar/alarm-clock apps). `SCHEDULE_EXACT_ALARM` is a *special* permission the user grants in Settings (and it can be revoked); `USE_EXACT_ALARM` is granted at install but only for apps whose *core function* is alarms/reminders. Check `canScheduleExactAlarms()` before scheduling and fall back gracefully.",
      },
      {
        t: "list",
        items: [
          "**`SCHEDULE_EXACT_ALARM` (API 31+)** — special permission, user-granted in Settings.",
          "**`USE_EXACT_ALARM` (API 33+)** — install-granted, only for alarm/calendar apps.",
          "**`canScheduleExactAlarms()`** — check before scheduling.",
          "**Fall back** — to inexact if not permitted.",
        ],
      },
      {
        t: "note",
        text: "Exact alarms need SCHEDULE_EXACT_ALARM (API 31+, a special Settings-granted permission that can be revoked) or USE_EXACT_ALARM (API 33+, install-granted only for apps whose core function is alarms/reminders). Check canScheduleExactAlarms() before scheduling and fall back to inexact gracefully.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do foreground services show a notification, and what types are there?",
    a: [
      {
        t: "p",
        text: "A foreground service *must* show a persistent notification (via `startForeground(id, notification)`) so the user knows it's running. Since Android 10+ you declare a `foregroundServiceType` in the manifest (`location`, `mediaPlayback`, `dataSync`, `camera`, `microphone`, `phoneCall`, etc.), and API 34+ enforces the type and its required permissions. The type communicates *why* the service runs in the foreground.",
      },
      {
        t: "list",
        items: [
          "**Mandatory notification** — `startForeground(id, notification)`.",
          "**`foregroundServiceType`** — location/mediaPlayback/dataSync/camera/etc.",
          "**API 34+** — type + permissions enforced.",
          "**Communicates purpose** — why it's in the foreground.",
        ],
      },
      {
        t: "note",
        text: "A foreground service must show a persistent notification (startForeground(id, notification)). Declare a foregroundServiceType (location/mediaPlayback/dataSync/camera/mic/phoneCall) in the manifest (Android 10+); API 34+ enforces the type and its required permissions. The type communicates why the service runs in the foreground.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you create and manage a notification channel?",
    a: [
      {
        t: "p",
        text: "Since Android 8 (API 26), every notification must belong to a `NotificationChannel` (created once, e.g. at app start) with an importance level; users control each channel's behavior (sound, vibration) in Settings. You build a channel with `NotificationManager.createNotificationChannel`, set the channel id on the notification, and the importance determines how intrusive it is (high = heads-up).",
      },
      {
        t: "code",
        title: "Notification channel",
        code: `val channel = NotificationChannel("uploads", "Uploads", NotificationManager.IMPORTANCE_LOW)
notificationManager.createNotificationChannel(channel)
val notif = NotificationCompat.Builder(ctx, "uploads")...build()`,
      },
      {
        t: "list",
        items: [
          "**`NotificationChannel` (API 26+)** — required; created once.",
          "**Importance** — controls intrusiveness (high = heads-up).",
          "**User control** — per-channel settings (sound/vibration).",
          "**Channel id** — set on the notification.",
        ],
      },
      {
        t: "note",
        text: "Since API 26, notifications need a NotificationChannel (created once, e.g. at startup) with an importance level (high = heads-up); users control each channel's behavior in Settings. Create via createNotificationChannel, set the channel id on the notification. Foreground services and reminders both need a channel.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is goAsync() in a BroadcastReceiver, and when do you use it?",
    a: [
      {
        t: "p",
        text: "`onReceive` normally must finish quickly (the receiver is considered done and can be killed when it returns). `goAsync()` returns a `PendingResult` that keeps the receiver alive for a *short* additional window (~10s) so you can do brief async work on a background thread, calling `finish()` when done. Use it for a quick task that doesn't warrant a full WorkManager job — but for anything substantial, enqueue work instead.",
      },
      {
        t: "code",
        title: "goAsync",
        code: `override fun onReceive(ctx: Context, intent: Intent) {
    val result = goAsync()
    scope.launch { doQuickWork(); result.finish() }   // brief background work
}`,
      },
      {
        t: "list",
        items: [
          "**`goAsync()`** — keeps the receiver alive ~10s for async work.",
          "**`PendingResult.finish()`** — call when done.",
          "**Brief tasks only** — not a substitute for WorkManager.",
          "**Substantial work** — enqueue WorkManager instead.",
        ],
      },
      {
        t: "note",
        text: "onReceive must finish fast; goAsync() returns a PendingResult keeping the receiver alive ~10s for brief background work (call finish() when done). Use it for quick tasks not warranting a WorkManager job — for anything substantial, enqueue work instead.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between RTC and ELAPSED_REALTIME alarm types?",
    a: [
      {
        t: "p",
        text: "`RTC`/`RTC_WAKEUP` schedule based on *wall-clock time* (`System.currentTimeMillis()`) — for alarms at a specific real-world time (8:00 AM), but affected by clock/timezone changes. `ELAPSED_REALTIME`/`ELAPSED_REALTIME_WAKEUP` schedule based on time *since boot* (`SystemClock.elapsedRealtime()`) — for relative delays ('30 min from now'), unaffected by clock changes. The `_WAKEUP` variants wake the device; without it, the alarm waits until the device is awake.",
      },
      {
        t: "list",
        items: [
          "**`RTC`** — wall-clock time; specific real-world times.",
          "**`ELAPSED_REALTIME`** — since boot; relative delays.",
          "**`_WAKEUP`** — wakes the device; else waits for wake.",
          "**Clock changes** — affect RTC, not ELAPSED_REALTIME.",
        ],
      },
      {
        t: "note",
        text: "RTC/RTC_WAKEUP: wall-clock time (System.currentTimeMillis) for specific real-world times (affected by clock/timezone). ELAPSED_REALTIME/_WAKEUP: since boot (SystemClock.elapsedRealtime) for relative delays (unaffected by clock). _WAKEUP wakes the device; without it, the alarm waits until awake.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you build a reminder/notification-at-a-time feature reliably?",
    a: [
      {
        t: "p",
        text: "Use `AlarmManager.setExactAndAllowWhileIdle` (with `SCHEDULE_EXACT_ALARM`/`USE_EXACT_ALARM` and permission checks) targeting a `BroadcastReceiver` that posts the notification. Persist the reminders (DB) and *re-register* all alarms on `BOOT_COMPLETED` (alarms are lost on reboot). For repeating reminders, re-schedule the next one after each fires. Handle permission revocation gracefully (fall back / prompt).",
      },
      {
        t: "list",
        items: [
          "**`setExactAndAllowWhileIdle`** — precise, fires in Doze; needs the permission.",
          "**Receiver posts notification** — the reminder.",
          "**Persist + re-register on BOOT_COMPLETED** — alarms lost on reboot.",
          "**Repeating** — reschedule the next after each fires.",
        ],
      },
      {
        t: "note",
        text: "Reminders: AlarmManager.setExactAndAllowWhileIdle (with SCHEDULE_EXACT_ALARM/USE_EXACT_ALARM + permission checks) → a BroadcastReceiver that posts the notification. Persist reminders and re-register alarms on BOOT_COMPLETED (lost on reboot); reschedule the next after each repeat fires. Handle permission revocation gracefully.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is setAlarmClock, and how does it differ from other alarm methods?",
    a: [
      {
        t: "p",
        text: "`setAlarmClock` schedules a *user-visible alarm* (like a physical alarm clock) — it's treated as high-priority, fires even in Doze, and shows in the system's next-alarm UI. It's meant for *actual alarm-clock functionality*, so it bypasses most restrictions. Regular `setExact`/`setWindow` are for app-internal scheduling and are more constrained. Use `setAlarmClock` only for genuine user alarms.",
      },
      {
        t: "list",
        items: [
          "**`setAlarmClock`** — user-visible, high-priority alarm.",
          "**Fires in Doze** — treated like a real alarm clock.",
          "**Next-alarm UI** — shown in the system.",
          "**Genuine alarms only** — not for general scheduling.",
        ],
      },
      {
        t: "note",
        text: "setAlarmClock schedules a user-visible, high-priority alarm (like a physical alarm clock) — fires even in Doze, shows in the system next-alarm UI, and bypasses most restrictions. Use it only for genuine user alarm-clock functionality, not general app scheduling (use setExact/WorkManager for that).",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you stop a foreground service?",
    a: [
      {
        t: "p",
        text: "Call `stopSelf()` (from within) or `stopService()` (from outside) to stop the service, and `stopForeground(STOP_FOREGROUND_REMOVE)` to remove the notification. For a foreground service doing finite work (an upload), stop it when the work completes. Leaving a foreground service running needlessly drains battery and annoys users with a persistent notification.",
      },
      {
        t: "list",
        items: [
          "**`stopSelf()`/`stopService()`** — stop the service.",
          "**`stopForeground(STOP_FOREGROUND_REMOVE)`** — remove the notification.",
          "**On work complete** — stop finite-work services.",
          "**Don't linger** — needless foreground drains battery.",
        ],
      },
      {
        t: "note",
        text: "Stop a foreground service with stopSelf() (inside) or stopService() (outside), and stopForeground(STOP_FOREGROUND_REMOVE) to remove the notification. Stop it when finite work completes — a lingering foreground service drains battery and shows a persistent notification. WorkManager foreground workers stop automatically.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are the foreground service type restrictions on Android 14?",
    a: [
      {
        t: "p",
        text: "Android 14 (API 34) requires every foreground service to *declare its type* (`foregroundServiceType`) in the manifest AND hold the corresponding *permission* (e.g. `dataSync` type, `location` type + location permission). The system rejects starting a foreground service without a valid type/permission. Types like `dataSync` and `mediaProcessing` also have *time limits*. This tightens foreground-service use to legitimate, declared purposes.",
      },
      {
        t: "list",
        items: [
          "**Type + permission required** — API 34 enforces both.",
          "**Rejected without them** — can't start the service.",
          "**Time limits** — some types (dataSync) are time-bound.",
          "**Legitimate use** — types must match the actual purpose.",
        ],
      },
      {
        t: "note",
        text: "Android 14 (API 34) requires each foreground service to declare its foregroundServiceType AND hold the matching permission (e.g. location type + location permission); starting without a valid type/permission is rejected. Some types (dataSync/mediaProcessing) have time limits. Tightens foreground-service use to declared, legitimate purposes.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle repeating alarms efficiently?",
    a: [
      {
        t: "p",
        text: "For *inexact* repeating, `setInexactRepeating` lets the system batch alarms (battery-friendly). For *exact* repeating (rare, user-facing), *don't* use exact repeating APIs (they're removed/discouraged) — instead re-schedule the next single exact alarm after each fires. For most *periodic background work*, use `WorkManager` periodic work instead of alarms (it's designed for battery-efficient recurring tasks).",
      },
      {
        t: "list",
        items: [
          "**`setInexactRepeating`** — batched, battery-friendly.",
          "**Exact repeating** — reschedule the next after each fires.",
          "**Periodic work** — use WorkManager for recurring background tasks.",
          "**Avoid tight exact repeats** — battery drain.",
        ],
      },
      {
        t: "note",
        text: "Repeating alarms: setInexactRepeating for batched, battery-friendly recurrence; for exact repeating, reschedule the next single exact alarm after each fires (exact repeating APIs are discouraged). For periodic background work, prefer WorkManager periodic work — designed for battery-efficient recurring tasks.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a PendingIntent, and why do alarms and notifications use it?",
    a: [
      {
        t: "p",
        text: "A `PendingIntent` wraps an `Intent` so *another process* (the system's AlarmManager or NotificationManager) can execute it *as your app* later. Alarms and notifications fire outside your app's immediate execution, so they need a PendingIntent to launch your Activity/Service/Receiver when triggered. Since API 31 you must specify mutability (`FLAG_IMMUTABLE` by default for security).",
      },
      {
        t: "list",
        items: [
          "**Wraps an Intent** — executed by another process as your app.",
          "**Deferred execution** — alarms/notifications fire it later.",
          "**Types** — `getActivity`/`getService`/`getBroadcast`.",
          "**`FLAG_IMMUTABLE`** — required mutability (API 31+).",
        ],
      },
      {
        t: "note",
        text: "A PendingIntent wraps an Intent so another process (AlarmManager/NotificationManager) can execute it as your app later — needed because alarms/notifications fire outside your app's execution. Types: getActivity/getService/getBroadcast. Since API 31, specify mutability (FLAG_IMMUTABLE default for security).",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you keep a foreground service alive for a phone-call-like feature?",
    a: [
      {
        t: "p",
        text: "For a must-stay-running feature (VoIP call, active navigation, live tracking), use a foreground service with the appropriate `foregroundServiceType` (`phoneCall`, `location`) and its permissions — it runs with high priority and a persistent notification, so the system won't kill it while active. Handle reconnection and lifecycle carefully, and stop it promptly when the feature ends. This is the legitimate use of long-lived foreground services.",
      },
      {
        t: "list",
        items: [
          "**Foreground service + type** — `phoneCall`/`location`; high priority.",
          "**Persistent notification** — user-visible; not killed while active.",
          "**Reconnection/lifecycle** — handle carefully.",
          "**Stop promptly** — when the feature ends.",
        ],
      },
      {
        t: "note",
        text: "For a must-stay-running feature (VoIP call, active navigation), use a foreground service with the right foregroundServiceType (phoneCall/location) + permissions — high priority, persistent notification, not killed while active. Handle reconnection/lifecycle and stop promptly when done. The legitimate use of long-lived foreground services.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test alarms and foreground services?",
    a: [
      {
        t: "p",
        text: "For alarms, abstract `AlarmManager` behind an interface you can fake in unit tests (assert the scheduling call), or use `adb shell` to trigger/inspect. For the receiver logic, test it directly. For foreground services, test the *work logic* (extracted into testable classes) separately, and verify notification/lifecycle behavior with instrumented tests. Abstracting the framework APIs is key to testing this.",
      },
      {
        t: "list",
        items: [
          "**Abstract `AlarmManager`** — fake it; assert scheduling.",
          "**Test receiver logic** — directly.",
          "**Extract work logic** — test it separately from the service.",
          "**Instrumented** — notification/lifecycle behavior.",
        ],
      },
      {
        t: "note",
        text: "Test alarms by abstracting AlarmManager behind an interface (fake it, assert the scheduling call) and testing receiver logic directly. For foreground services, extract the work logic into testable classes and test it separately; verify notification/lifecycle with instrumented tests. Abstracting framework APIs is key.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you promote a started service to a foreground service?",
    a: [
      {
        t: "p",
        text: "Start the service (`startForegroundService` from the background, or `startService` from the foreground), then within ~5 seconds call `startForeground(id, notification)` to promote it — otherwise the system throws (`ANR`/crash). On modern Android you must also declare the `foregroundServiceType` and hold its permission. Promote when the work becomes user-visible/long-running; you can later `stopForeground` to demote.",
      },
      {
        t: "list",
        items: [
          "**`startForegroundService`** — then `startForeground` within ~5s.",
          "**Miss the window** — the system crashes it.",
          "**Type + permission** — declared for modern Android.",
          "**`stopForeground`** — to demote back.",
        ],
      },
      {
        t: "note",
        text: "Start the service (startForegroundService from background / startService from foreground), then call startForeground(id, notification) within ~5s to promote it (or the system crashes it). Declare foregroundServiceType + permission on modern Android. Promote when work becomes user-visible/long; stopForeground to demote.",
      },
    ],
  },
  {
    level: "senior",
    q: "Why do exact alarms and foreground services face increasing restrictions?",
    a: [
      {
        t: "p",
        text: "Both can *drain battery* and be *abused* — exact alarms wake the device precisely (defeating Doze batching), and foreground services run with high priority indefinitely. Android restricts them (permissions, types, background-start limits) to protect battery life and prevent apps from running unnecessarily. The guidance: use the *most deferrable* mechanism that meets your need (WorkManager over foreground service over exact alarm) and only escalate when genuinely required.",
      },
      {
        t: "list",
        items: [
          "**Battery + abuse** — exact alarms defeat Doze; foreground services run indefinitely.",
          "**Restrictions** — permissions, types, background-start limits.",
          "**Use most-deferrable** — WorkManager > foreground service > exact alarm.",
          "**Escalate only when needed** — for genuine urgency/precision.",
        ],
      },
      {
        t: "note",
        text: "Exact alarms (wake the device precisely, defeat Doze) and foreground services (high-priority, indefinite) drain battery and are abusable — so Android restricts them (permissions, types, background-start limits). Use the most-deferrable mechanism that meets your need (WorkManager > foreground service > exact alarm); escalate only for genuine urgency/precision.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you cancel a scheduled alarm?",
    a: [
      {
        t: "p",
        text: "Call `alarmManager.cancel(pendingIntent)` with a `PendingIntent` *equivalent* to the one used to schedule it (same requestCode, action, and component — Android matches PendingIntents by these). So keep a consistent PendingIntent (or recreate an equal one) to cancel. For repeating reminders, cancel when the user removes them.",
      },
      {
        t: "code",
        title: "Cancel an alarm",
        code: `val pi = PendingIntent.getBroadcast(ctx, requestCode, intent, PendingIntent.FLAG_IMMUTABLE)
alarmManager.cancel(pi)   // matches by requestCode/action/component`,
      },
      {
        t: "list",
        items: [
          "**`alarmManager.cancel(pendingIntent)`** — cancel by equivalent PendingIntent.",
          "**Matching** — same requestCode/action/component.",
          "**Consistent PendingIntent** — keep or recreate an equal one.",
          "**Uses** — user removes a reminder; reschedule changes.",
        ],
      },
      {
        t: "note",
        text: "Cancel with alarmManager.cancel(pendingIntent) using a PendingIntent equivalent to the scheduling one (Android matches by requestCode/action/component) — so keep or recreate an equal PendingIntent. Cancel repeating reminders when the user removes them or reschedules.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does the POST_NOTIFICATIONS permission affect foreground services and reminders?",
    a: [
      {
        t: "p",
        text: "On Android 13+ (API 33), posting notifications requires the `POST_NOTIFICATIONS` runtime permission. If it's *denied*, your foreground service still runs but its notification *isn't shown* (a foreground service without a visible notification), and reminder notifications are silently dropped. Request the permission in context, and design for the case where the user denies it (the service works but the user won't see the notification).",
      },
      {
        t: "list",
        items: [
          "**API 33+ runtime permission** — for showing notifications.",
          "**Denied** — foreground service runs but notification hidden; reminders dropped.",
          "**Request in context** — when enabling a notifying feature.",
          "**Design for denial** — the service works without a visible notification.",
        ],
      },
      {
        t: "note",
        text: "Android 13+ requires POST_NOTIFICATIONS (runtime) to show notifications. If denied, a foreground service still runs but its notification isn't shown, and reminders are silently dropped. Request in context; design for denial (the service functions without a visible notification).",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you add actions like reply or dismiss to a notification?",
    a: [
      {
        t: "p",
        text: "Add `NotificationCompat.Action`s with a label and a `PendingIntent` (to a `BroadcastReceiver`/Activity that handles the action). For inline reply, use `RemoteInput` attached to an action so the user types directly in the notification. The receiver reads the input and updates state (e.g. sends the reply). Actions make notifications interactive without opening the app.",
      },
      {
        t: "code",
        title: "Notification action",
        code: `val replyAction = NotificationCompat.Action.Builder(icon, "Reply", replyPendingIntent)
    .addRemoteInput(RemoteInput.Builder("key_reply").build()).build()
builder.addAction(replyAction)`,
      },
      {
        t: "list",
        items: [
          "**`NotificationCompat.Action`** — label + `PendingIntent`.",
          "**`RemoteInput`** — inline text reply.",
          "**Receiver handles it** — reads input, updates state.",
          "**Interactive** — act without opening the app.",
        ],
      },
      {
        t: "note",
        text: "Add NotificationCompat.Actions (label + PendingIntent to a receiver/Activity); for inline reply attach a RemoteInput so the user types in the notification. The receiver reads the input and acts (send reply). Actions make notifications interactive without opening the app.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between AlarmManager and JobScheduler?",
    a: [
      {
        t: "p",
        text: "`AlarmManager` triggers at a *specific time* (wall-clock or elapsed) — for time-based scheduling (alarms, reminders). `JobScheduler` runs deferrable jobs when *conditions* are met (network, charging, idle) — for background work, batched for battery. They serve different needs: exact timing (AlarmManager) vs conditional deferrable work (JobScheduler, which WorkManager wraps). For most background work, use WorkManager (over JobScheduler); for exact time, AlarmManager.",
      },
      {
        t: "list",
        items: [
          "**AlarmManager** — time-based triggers (exact/inexact).",
          "**JobScheduler** — condition-based deferrable jobs (network/charging/idle).",
          "**WorkManager wraps JobScheduler** — the recommended abstraction.",
          "**Choose** — exact time (Alarm) vs conditional work (Job/WorkManager).",
        ],
      },
      {
        t: "note",
        text: "AlarmManager triggers at a specific time (alarms/reminders); JobScheduler runs deferrable jobs when conditions are met (network/charging/idle — battery-batched). WorkManager wraps JobScheduler as the recommended background-work abstraction. Use AlarmManager for exact time, WorkManager for conditional deferrable work.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you show ongoing progress in a foreground service notification?",
    a: [
      {
        t: "p",
        text: "Use `NotificationCompat.Builder.setProgress(max, current, indeterminate)` and re-post the notification with the same id as work advances (`notificationManager.notify(id, updated)`). For a download, update the progress bar periodically (throttle updates to avoid spamming). Set `setOngoing(true)` so it can't be swiped away while active, and remove it (`stopForeground`) when done.",
      },
      {
        t: "code",
        title: "Progress notification",
        code: `builder.setProgress(100, progress, false).setOngoing(true)
notificationManager.notify(1, builder.build())   // update as progress changes`,
      },
      {
        t: "list",
        items: [
          "**`setProgress(max, current, indeterminate)`** — progress bar.",
          "**Re-post same id** — to update.",
          "**Throttle updates** — avoid spamming.",
          "**`setOngoing(true)`** — non-dismissable while active.",
        ],
      },
      {
        t: "note",
        text: "Show progress with NotificationCompat setProgress(max, current, indeterminate) and re-post the notification with the same id as work advances (throttle updates). setOngoing(true) makes it non-dismissable while active; remove it (stopForeground) when done. Standard for download/upload foreground services.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are notification importance levels, and what is a heads-up notification?",
    a: [
      {
        t: "p",
        text: "A channel's *importance* (HIGH, DEFAULT, LOW, MIN) controls how intrusive its notifications are: HIGH makes sound *and* shows a *heads-up* (a peek that appears over the current screen) — for time-sensitive alerts (messages, calls); DEFAULT makes sound but no peek; LOW/MIN are quiet (ongoing/foreground service notifications). Since API 26, importance is set on the *channel* (not the notification), and users can override it.",
      },
      {
        t: "list",
        items: [
          "**HIGH** — sound + heads-up peek; time-sensitive.",
          "**DEFAULT** — sound, no peek.",
          "**LOW/MIN** — quiet; ongoing/foreground.",
          "**On the channel** — API 26+; user-overridable.",
        ],
      },
      {
        t: "note",
        text: "Channel importance (HIGH/DEFAULT/LOW/MIN) sets intrusiveness: HIGH = sound + heads-up peek (time-sensitive alerts), DEFAULT = sound no peek, LOW/MIN = quiet (foreground/ongoing). Set on the channel (API 26+), user-overridable. Use LOW for a foreground service notification so it's not intrusive.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do exact alarms behave in Doze mode?",
    a: [
      {
        t: "p",
        text: "In *Doze* (deep idle), most alarms are *deferred* to maintenance windows to save battery. To fire during Doze, you need `setExactAndAllowWhileIdle` or `setAndAllowWhileIdle` (the `AllowWhileIdle` variants) — but even these are *rate-limited* in Doze (roughly once every ~9 minutes per app) to prevent abuse. `setAlarmClock` (genuine user alarms) is exempt. So don't rely on frequent exact alarms during Doze.",
      },
      {
        t: "list",
        items: [
          "**Doze defers** — alarms to maintenance windows.",
          "**`AllowWhileIdle` variants** — fire during Doze.",
          "**Rate-limited** — ~once per 9 min per app in Doze.",
          "**`setAlarmClock`** — exempt (genuine user alarms).",
        ],
      },
      {
        t: "note",
        text: "In Doze, most alarms are deferred to maintenance windows (battery). To fire during Doze use setExactAndAllowWhileIdle/setAndAllowWhileIdle — but even these are rate-limited (~once per 9 min per app). setAlarmClock (genuine user alarms) is exempt. Don't rely on frequent exact alarms during Doze.",
      },
    ],
  },
];

export default qa;
