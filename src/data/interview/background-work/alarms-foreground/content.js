// AlarmManager & Foreground Services — Content tab. Teaching-first.

const content = [
  {
    heading: "AlarmManager — exact-time execution",
    blocks: [
      {
        t: "p",
        text: "**AlarmManager** schedules work to run at a *specific time* (or after a specific delay), even waking the device if needed. It's the tool for **exact timing** — a calendar reminder at 9:00 AM, an alarm clock, a medication reminder — where the work must fire at a precise moment. This is the key difference from WorkManager: WorkManager is *deferrable* (runs when convenient under constraints), while AlarmManager is about *when*, precisely.",
      },
      {
        t: "code",
        title: "Scheduling an alarm",
        code: `val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
val pendingIntent = PendingIntent.getBroadcast(
    context, requestCode, Intent(context, AlarmReceiver::class.java),
    PendingIntent.FLAG_IMMUTABLE,
)

// Exact alarm at a specific time (fires even in Doze with ...AllowWhileIdle)
alarmManager.setExactAndAllowWhileIdle(
    AlarmManager.RTC_WAKEUP,        // wall-clock time, wake the device
    triggerTimeMillis,
    pendingIntent,
)`,
      },
      {
        t: "list",
        items: [
          "**It fires a `PendingIntent`** — usually to a `BroadcastReceiver` — when the time arrives. The receiver's `onReceive` runs briefly; for real work, it hands off to WorkManager or a foreground service (onReceive must be fast).",
          "**Alarm types**: `RTC_WAKEUP` (wall-clock time, wakes the device) / `RTC` (doesn't wake); `ELAPSED_REALTIME_WAKEUP` / `ELAPSED_REALTIME` (time since boot). Choose based on whether you need wall-clock time and whether to wake a sleeping device.",
          "**Exact vs inexact**: `setExact`/`setExactAndAllowWhileIdle` fire at a precise time (the latter even during Doze); `set`/`setInexactRepeating` let the system batch them to save battery (fire *around* the time). Use exact only when precision genuinely matters.",
          "**Survives reboot with a boot receiver**: alarms are cleared on reboot, so you register a `BOOT_COMPLETED` receiver to re-schedule them — the same pattern WorkManager does internally.",
        ],
      },
    ],
  },
  {
    heading: "Exact alarm restrictions",
    blocks: [
      {
        t: "list",
        items: [
          "**Exact alarms are increasingly restricted** because they wake the device and drain battery. Since Android 12, using exact alarms requires the `SCHEDULE_EXACT_ALARM` permission (and on Android 13+/14, for many apps this is a *special* permission the user must grant in Settings, or you use `USE_EXACT_ALARM` only if your app is a genuine alarm-clock/calendar app).",
          "**The guidance**: only use exact alarms when the feature *fundamentally requires* firing at an exact time that the user is aware of (an alarm clock, a precise reminder). For anything else — periodic sync, deferrable notifications — use WorkManager, which is battery-friendly and doesn't need the permission.",
          "**Doze interaction**: even exact alarms are subject to Doze unless you use `setExactAndAllowWhileIdle` (which is rate-limited — you can't fire these too frequently). This reflects the OS's ongoing push to limit battery-draining wakeups.",
        ],
      },
    ],
  },
  {
    heading: "Foreground services — ongoing, user-visible work",
    blocks: [
      {
        t: "p",
        text: "A **foreground service** runs ongoing work that the user is *aware of*, showing a persistent notification. It's for tasks that must run *continuously right now* and that the user knows about — music playback, turn-by-turn navigation, fitness/location tracking, an active call, a large ongoing download. The mandatory notification is the deal: the user sees the service is running (and can't dismiss it), which is why the OS lets it run when background services can't.",
      },
      {
        t: "code",
        title: "Starting a foreground service",
        code: `class LocationService : Service() {
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = buildNotification()      // required
        startForeground(NOTIFICATION_ID, notification, FOREGROUND_SERVICE_TYPE_LOCATION)
        // do the ongoing work (on a background thread/coroutine)
        return START_STICKY
    }
    override fun onBind(intent: Intent?) = null
}
// Start it:
ContextCompat.startForegroundService(context, Intent(context, LocationService::class.java))`,
      },
      {
        t: "list",
        items: [
          "**Must call `startForeground(...)` promptly** (within ~5-10 seconds of starting) with a notification, or the system kills it (and throws). The notification is not optional — it's what makes it a 'foreground' service.",
          "**Foreground service types** (Android 10+): you declare a type (`location`, `mediaPlayback`, `camera`, `microphone`, `dataSync`, etc.) in the manifest and pass it to `startForeground`. Android 14 tightened this — each type has requirements and the type must match the actual work.",
          "**Still runs on the main thread by default** — like any service, a foreground service doesn't automatically use a background thread; you move the actual work to a coroutine/thread.",
          "**vs a WorkManager foreground worker**: for guaranteed *and* immediate *and* user-visible work (a large upload that must complete), a WorkManager foreground worker (`setForeground`) is often better — you get the notification *plus* WorkManager's persistence and retries. Use a raw foreground service for truly ongoing continuous tasks (media, navigation) that aren't a discrete unit of work.",
        ],
      },
    ],
  },
  {
    heading: "Foreground service restrictions (Android 12+)",
    blocks: [
      {
        t: "list",
        items: [
          "**You can't start a foreground service from the background** (Android 12+) — there are restrictions on launching foreground services while your app is in the background, to prevent abuse. There are exceptions (from a high-priority FCM message, a user action, an exact alarm, etc.), but generally you start foreground services in response to user interaction or an allowed trigger.",
          "**Android 14 requires declared types with justification** — each foreground service type has specific use-case requirements, and using the wrong type or an unjustified one can cause rejection. This is part of the ongoing tightening of what apps can do in the background.",
          "**The trend**: like background services and receivers, foreground services are increasingly governed to protect battery and privacy. The sanctioned uses are genuinely user-visible ongoing tasks; for deferrable guaranteed work, WorkManager (which can escalate to a foreground worker when needed) is preferred.",
        ],
      },
    ],
  },
  {
    heading: "Bound services and IPC (briefly)",
    blocks: [
      {
        t: "list",
        items: [
          "**Bound services** — a component `bindService()`s to a service to get an interface and call its methods (a client-server relationship), and the service lives while bound. Used for an in-app API surface or, across processes, **IPC via AIDL** (Android Interface Definition Language, which generates the marshalling code for cross-process method calls).",
          "**IPC (Inter-Process Communication)** — how separate processes/apps communicate: `Messenger` (simpler, message-based, serialized through a Handler), `AIDL` (full interface-based, supports concurrent calls, more complex), or higher-level mechanisms (ContentProviders, broadcasts, `BroadcastReceiver`). The underlying transport is Binder.",
          "**When it comes up**: multi-process apps, a service exposed to other apps, or communicating with a system service. Most apps don't need bound services / AIDL, but knowing they exist (and that Binder underlies IPC) is useful for depth questions.",
        ],
      },
      {
        t: "note",
        text: "AlarmManager & foreground services: AlarmManager = exact-time execution (fires a PendingIntent at a precise moment, waking the device) — for alarms/reminders; increasingly restricted (SCHEDULE_EXACT_ALARM permission), so use only when exact timing is essential, WorkManager otherwise. Foreground service = ongoing user-visible work with a mandatory notification (music, navigation, tracking); must call startForeground promptly with a declared type; restricted from background starts (Android 12+). For guaranteed+immediate+visible work, prefer a WorkManager foreground worker. Bound services/AIDL handle IPC.",
      },
    ],
  },
];

export default content;
