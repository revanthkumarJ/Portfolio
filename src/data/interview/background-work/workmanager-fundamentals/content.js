// WorkManager Fundamentals — Content tab. Teaching-first.

const content = [
  {
    heading: "What WorkManager is and the problem it solves",
    blocks: [
      {
        t: "p",
        text: "**WorkManager** is Jetpack's library for **deferrable, guaranteed background work** — tasks that should run reliably even if the app is killed or the device reboots, and that can wait for the right conditions (network available, charging). Before WorkManager, background work was a mess of fragmented, deprecated APIs (`JobScheduler`, `AlarmManager`, `GcmNetworkManager`, background services) each with different behavior across Android versions and battery restrictions. WorkManager unifies them: you describe *what* work to do and *under what constraints*, and it picks the right underlying mechanism and guarantees the work eventually runs.",
      },
      {
        t: "list",
        items: [
          "**Guaranteed execution** — the killer feature. WorkManager *persists* work requests in an internal database, so the work survives the app being killed, the process dying, and even a device reboot. A plain coroutine or service can't promise that.",
          "**Deferrable & constraint-aware** — work runs when conditions are met (Wi-Fi, charging, battery not low), respecting Doze and battery-optimization rules. It's for work that should happen 'soon, under the right conditions', not 'this exact instant'.",
          "**Backward-compatible** — it internally uses `JobScheduler` on newer Android and `AlarmManager` + broadcast receivers on older, so you write one API and it works across versions.",
          "**The use cases**: syncing data with a server, uploading logs/photos, periodic backups, prefetching content, sending queued analytics — anything that must reliably complete but doesn't need to run *right now* or tie up the UI.",
        ],
      },
    ],
  },
  {
    heading: "What WorkManager is NOT for",
    blocks: [
      {
        t: "list",
        items: [
          "**Not for immediate work tied to the UI** — loading data for a screen belongs in a coroutine in `viewModelScope`, not WorkManager. WorkManager has scheduling overhead and may defer the work.",
          "**Not for exact-timing work** — a precise alarm/reminder at 9:00 AM is `AlarmManager`'s job (exact alarms). WorkManager is deferrable by nature.",
          "**Not for ongoing user-visible tasks that must run continuously right now** — music playback or active navigation is a *foreground service*. (Though WorkManager *can* run as a long-running foreground worker for guaranteed-and-immediate work like a large download.)",
          "**The decision heuristic**: is the work *deferrable* and must it be *guaranteed* to eventually run (surviving app death/reboot)? → WorkManager. Immediate + UI-tied → coroutine. Exact time → AlarmManager. Ongoing + user-visible → foreground service.",
        ],
      },
    ],
  },
  {
    heading: "Defining work: the Worker",
    blocks: [
      {
        t: "code",
        title: "A CoroutineWorker",
        code: `class UploadWorker(
    context: Context,
    params: WorkerParameters,
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val fileUri = inputData.getString("uri") ?: return Result.failure()
        return try {
            uploadFile(fileUri)                    // the actual background work
            Result.success()                        // done — don't retry
        } catch (e: IOException) {
            Result.retry()                          // transient failure — retry later
        } catch (e: Exception) {
            Result.failure()                        // permanent failure — give up
        }
    }
}`,
      },
      {
        t: "list",
        items: [
          "**`CoroutineWorker`** — the modern base class; `doWork()` is a `suspend` function, so you use coroutines directly (and it runs off the main thread). (`Worker` is the older, non-coroutine base with a blocking `doWork()`.)",
          "**Three results**: `Result.success()` (finished, don't retry), `Result.retry()` (transient failure — WorkManager will retry per the backoff policy), `Result.failure()` (permanent failure — don't retry). Returning the right one is important: retry only genuinely transient failures.",
          "**`inputData`** — small key-value data passed *into* the worker (`Data` objects, like a `Bundle` — Bundle-sized limits apply). `Result.success(outputData)` can return small output data too. For large data, pass a reference (a URI, an id) and load it, not the data itself.",
          "**The worker runs in the background** with its own lifecycle — it may run when the app isn't even open, so it can't touch UI or assume the app's state; it should be self-contained.",
        ],
      },
    ],
  },
  {
    heading: "Scheduling work: OneTime vs Periodic",
    blocks: [
      {
        t: "code",
        title: "Enqueuing work requests",
        code: `// One-time work
val uploadRequest = OneTimeWorkRequestBuilder<UploadWorker>()
    .setInputData(workDataOf("uri" to fileUri))
    .setConstraints(
        Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)  // needs network
            .build()
    )
    .build()
WorkManager.getInstance(context).enqueue(uploadRequest)

// Periodic work (minimum interval is 15 minutes)
val syncRequest = PeriodicWorkRequestBuilder<SyncWorker>(
    repeatInterval = 6, TimeUnit.HOURS
).build()
WorkManager.getInstance(context).enqueue(syncRequest)`,
      },
      {
        t: "list",
        items: [
          "**`OneTimeWorkRequest`** — runs once (with retries if it returns `retry`). For a single upload, a one-off sync, a queued action.",
          "**`PeriodicWorkRequest`** — repeats on an interval, with a **minimum of 15 minutes** (the system enforces this to protect battery — you can't schedule periodic work more frequently). For regular background sync/backup. Note: periodic work is *not* precisely timed — the system batches it into maintenance windows.",
          "**`setInputData`** — attach input; **`setConstraints`** — conditions that must be met to run; **`setInitialDelay`** — wait before first run; **`setBackoffCriteria`** — how retries are spaced.",
          "**`enqueue()`** persists the request; WorkManager takes over from there, running it when constraints are met, surviving app kills/reboots.",
        ],
      },
    ],
  },
  {
    heading: "Observing work state",
    blocks: [
      {
        t: "code",
        title: "Tracking progress and result",
        code: `WorkManager.getInstance(context)
    .getWorkInfoByIdFlow(uploadRequest.id)         // observe as a Flow
    .collect { workInfo ->
        when (workInfo?.state) {
            WorkInfo.State.ENQUEUED -> showQueued()
            WorkInfo.State.RUNNING -> showProgress()
            WorkInfo.State.SUCCEEDED -> showDone(workInfo.outputData)
            WorkInfo.State.FAILED -> showError()
            else -> Unit
        }
    }`,
      },
      {
        t: "list",
        items: [
          "**`WorkInfo`** exposes the work's state — `ENQUEUED`, `RUNNING`, `SUCCEEDED`, `FAILED`, `BLOCKED` (waiting on a prerequisite), `CANCELLED` — observable as a `Flow` (or LiveData), so the UI can reflect progress.",
          "**`setProgress()`** inside the worker publishes progress updates the UI can observe (e.g. upload percentage).",
          "**Output data** — a succeeded/failed worker can return small output data, readable from its `WorkInfo`.",
          "This lets you build a responsive UI around guaranteed background work — show 'uploading…', progress, and completion — while the work itself is decoupled from the UI's lifetime.",
        ],
      },
      {
        t: "note",
        text: "WorkManager fundamentals: for deferrable, GUARANTEED background work that survives app kill/reboot (sync, uploads, backups). Define a CoroutineWorker with doWork() returning success/retry/failure; schedule OneTime or Periodic (min 15-min) work requests with input data and constraints; enqueue persists it. Observe state via WorkInfo Flow. NOT for immediate UI work (use coroutines), exact timing (AlarmManager), or ongoing user-visible tasks (foreground service).",
      },
    ],
  },
];

export default content;
