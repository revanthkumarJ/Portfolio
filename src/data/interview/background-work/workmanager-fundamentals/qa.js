// WorkManager Fundamentals — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What is WorkManager and what is it used for?",
    a: [
      {
        t: "p",
        text: "**WorkManager is Jetpack's library for deferrable, guaranteed background work — tasks that must run reliably (even if the app is killed or the device reboots) but can wait for the right conditions.** Its defining feature is *guaranteed execution*: it persists work requests in an internal database, so the work survives the app being killed, the process dying, and even a reboot — something a plain coroutine or background service can't promise.",
      },
      {
        t: "list",
        items: [
          "**Use cases**: syncing data with a server, uploading photos or logs, periodic backups, prefetching content, sending queued analytics — work that must reliably complete but doesn't need to run *this instant* or block the UI.",
          "**Constraint-aware**: work runs when conditions are met (network available, charging, battery not low), respecting the OS's battery-saving rules (Doze).",
          "**Backward-compatible**: it internally uses `JobScheduler` on newer Android and older mechanisms on older versions, so you write one API that works everywhere.",
        ],
      },
      {
        t: "p",
        text: "The mental model: you *describe* what work to do and under what conditions, `enqueue` it, and WorkManager takes over — guaranteeing it eventually runs, retrying on failure, and surviving whatever happens to the app. It replaced a fragmented set of older, deprecated background APIs with one reliable, modern solution.",
      },
    ],
  },
  {
    level: "junior",
    q: "When should you NOT use WorkManager?",
    a: [
      {
        t: "list",
        items: [
          "**Not for immediate work tied to the UI** — loading data for the current screen belongs in a coroutine in `viewModelScope`. WorkManager has scheduling overhead and may defer the work, so it's wrong for 'fetch this now to show it'.",
          "**Not for exact-timing work** — a precise alarm or reminder at a specific time (9:00 AM) is `AlarmManager`'s job (exact alarms). WorkManager is deferrable by design and won't fire at an exact moment.",
          "**Not for ongoing, user-visible tasks that must run continuously right now** — music playback or active turn-by-turn navigation is a *foreground service*.",
        ],
      },
      {
        t: "p",
        text: "The decision heuristic: ask 'is this work *deferrable*, and must it be *guaranteed* to eventually run (surviving app death/reboot)?' If yes → WorkManager. If it's immediate and UI-tied → coroutine in a lifecycle scope. If it needs an exact time → AlarmManager. If it's ongoing and user-visible → foreground service. A common mistake is reaching for WorkManager for a quick screen-scoped network call — that just adds overhead and latency for no benefit. WorkManager earns its complexity specifically when reliability across process death matters.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are the possible results a Worker can return?",
    a: [
      {
        t: "p",
        text: "**A Worker's `doWork()` returns one of three results, and returning the right one is important for correct retry behavior:**",
      },
      {
        t: "list",
        items: [
          "**`Result.success()`** — the work finished successfully; WorkManager marks it done and won't retry. Can include small output data (`Result.success(outputData)`).",
          "**`Result.retry()`** — a *transient* failure occurred (a network blip, a temporary server error), and WorkManager should retry the work later according to its backoff policy. Use this for failures that might succeed on a later attempt.",
          "**`Result.failure()`** — a *permanent* failure (invalid input, a non-recoverable error); WorkManager should give up and not retry. Use this when retrying would fail identically.",
        ],
      },
      {
        t: "code",
        title: "Choosing the right result",
        code: `override suspend fun doWork(): Result = try {
    upload(); Result.success()
} catch (e: IOException) {
    Result.retry()        // transient — try again later
} catch (e: Exception) {
    Result.failure()      // permanent — give up
}`,
      },
      {
        t: "p",
        text: "The distinction mirrors network error handling: retry transient failures (network, 5xx), give up on permanent ones (bad input, 4xx). Returning `retry()` for a genuinely permanent failure wastes battery looping forever; returning `failure()` for a transient one loses work that would have succeeded. So map the failure type to the right result, just as you would for retry logic elsewhere.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between OneTimeWorkRequest and PeriodicWorkRequest?",
    a: [
      {
        t: "p",
        text: "**`OneTimeWorkRequest` runs the work once (with retries if it fails transiently); `PeriodicWorkRequest` repeats it on an interval.** You choose based on whether the work is a single action or a recurring one.",
      },
      {
        t: "list",
        items: [
          "**`OneTimeWorkRequest`** — for a single task: uploading a specific photo, a one-off sync, processing a queued action. It runs once when its constraints are met (retrying on `Result.retry()`).",
          "**`PeriodicWorkRequest`** — for recurring tasks: syncing every few hours, a nightly backup. The important constraint is a **minimum interval of 15 minutes** — the system enforces this to protect battery, so you *cannot* schedule periodic work more frequently than every 15 minutes.",
        ],
      },
      {
        t: "p",
        text: "A key nuance about periodic work: it is *not precisely timed*. The system batches periodic work into maintenance windows (respecting Doze and battery optimization), so 'every 6 hours' means 'approximately every 6 hours, when convenient for the system', not exactly on the clock. If you need exact timing you'd use AlarmManager instead. Also, for frequent syncs (more often than 15 minutes) you'd need a different approach — periodic work can't do it, and that frequency usually indicates you want push (FCM) or a foreground service instead. So: OneTime for single actions, Periodic for recurring work at 15-minutes-or-longer intervals, understanding that periodic timing is approximate.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does WorkManager guarantee that work survives app kill and device reboot?",
    a: [
      {
        t: "p",
        text: "**WorkManager persists every enqueued work request in an internal database (Room, under the hood), and it registers with the OS's job-scheduling infrastructure so the system will run the work on WorkManager's behalf even when the app process is dead — including re-scheduling everything after a reboot.** The guarantee comes from *durability* (the request is stored on disk, not held in memory) plus *delegation to the OS scheduler* (the system, not your app, is responsible for actually triggering the work).",
      },
      {
        t: "list",
        items: [
          "**Persistence**: when you `enqueue` a request, WorkManager writes it to its database with its constraints, state, and input data. So the request exists independently of your app's process memory — killing the app doesn't lose it.",
          "**Delegation to the OS scheduler**: WorkManager schedules the work with the platform's job scheduler (`JobScheduler` on API 23+, or `AlarmManager` + a broadcast receiver on older versions). The *OS* holds the schedule and wakes up / restarts your app's process to run the worker when constraints are met — so the work runs even if your app was killed in the meantime.",
          "**Reboot survival**: WorkManager registers a `BOOT_COMPLETED` broadcast receiver. After a reboot (which clears all scheduled jobs), this receiver fires, WorkManager reads its database of pending work, and *re-schedules* everything with the OS scheduler. This is how work survives a reboot — it's re-registered from the persisted database on boot.",
          "**State machine & retries**: the database also tracks each work's state (enqueued/running/succeeded/failed) and retry/backoff info, so an interrupted worker (process killed mid-run) is retried, and chains resume correctly.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: the guarantee isn't magic — it's *durability + OS delegation*. By persisting requests to disk and handing scheduling to the OS-level job scheduler (which survives your process), plus re-registering everything on `BOOT_COMPLETED`, WorkManager ensures the work outlives any app or device lifecycle event. This is precisely what a plain coroutine (dies with the process) or a background service (killed by Android 8+ restrictions, gone on reboot) *cannot* do, and it's the concrete reason WorkManager is the answer for guaranteed background work. Contrast with AlarmManager, which also survives reboot (via a boot receiver you write) but is about *exact timing*, not constraint-based deferrable work.",
      },
    ],
  },
  {
    level: "senior",
    q: "Why is periodic work limited to a 15-minute minimum interval, and what do you do if you need more frequent execution?",
    a: [
      {
        t: "p",
        text: "**The 15-minute minimum is a deliberate battery-protection constraint imposed by the platform's job scheduler, which WorkManager builds on. Waking the device and running work frequently is a major battery drain, so Android caps how often periodic background work can run — and batches it into maintenance windows rather than running it precisely on schedule.** You cannot bypass this with WorkManager; a `PeriodicWorkRequest` with a shorter interval is silently clamped to 15 minutes.",
      },
      {
        t: "list",
        items: [
          "**Why the limit exists**: each background execution potentially wakes the device from Doze, uses CPU and network, and drains battery. If apps could run periodic work every minute, a device with many apps would have terrible battery life. The 15-minute floor (plus batching into maintenance windows and Doze deferral) is the OS enforcing collective battery discipline — the same philosophy behind the Android 8+ background restrictions.",
          "**Also, periodic timing is approximate**: even at 15+ minutes, the exact fire time isn't guaranteed — the system batches periodic jobs to run together in maintenance windows to minimize wakeups. So you can't rely on periodic work for precise timing at all.",
        ],
      },
      {
        t: "list",
        items: [
          "**If you need more frequent, or exactly-timed, or immediate execution, WorkManager is the wrong tool — choose based on the actual need**:",
          "**Server-driven updates → Push (FCM)**: instead of polling frequently, have the server *push* a notification when there's new data, and the app reacts (often kicking off a one-time WorkManager job to sync). This is far more battery-efficient than frequent polling and gives near-real-time updates — the correct pattern for 'the app needs fresh data promptly'.",
          "**Exact-time task → AlarmManager** (exact alarms) for something that must fire at a precise moment (a calendar reminder).",
          "**Ongoing/continuous work → foreground service** (with its notification) for something that must run continuously right now (a live tracking session).",
          "**Chained one-time work** — if you need something 'roughly every few minutes' during active use, you can self-schedule one-time work that re-enqueues itself, but this is discouraged (it fights the battery model); the frequent-updates need almost always points to push instead.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: the 15-minute floor is the OS telling you 'frequent background polling is a battery anti-pattern' — so the *right* answer to 'I need updates more often than 15 minutes' is usually to *invert the model* from polling to push (FCM), letting the server notify the app when there's genuinely something to do. Fighting the limit (self-rescheduling loops, exact alarms abused for polling) works against the battery model and against the user. Recognizing that the constraint is pushing you toward a better architecture (push over poll) rather than being an obstacle to route around is the mature response — it's the same 'the OS restriction is guiding you to the efficient design' theme as the broader background-execution limits.",
      },
    ],
  },
];

export default qa;
