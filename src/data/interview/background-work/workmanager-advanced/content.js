// WorkManager Advanced — Content tab. Teaching-first.

const content = [
  {
    heading: "Constraints — running work only under the right conditions",
    blocks: [
      {
        t: "p",
        text: "**Constraints** tell WorkManager the conditions that must be true before your work runs. WorkManager waits until they're all satisfied, then executes — and if conditions change (network lost) mid-run, it can stop and retry later. This is how you make background work battery- and data-friendly: only sync on Wi-Fi, only do heavy work while charging.",
      },
      {
        t: "code",
        title: "Common constraints",
        code: `val constraints = Constraints.Builder()
    .setRequiredNetworkType(NetworkType.UNMETERED)   // Wi-Fi only (not cellular)
    .setRequiresCharging(true)                         // only while charging
    .setRequiresBatteryNotLow(true)                    // not on low battery
    .setRequiresDeviceIdle(true)                        // device not in active use
    .setRequiresStorageNotLow(true)                    // enough storage
    .build()

val request = OneTimeWorkRequestBuilder<SyncWorker>()
    .setConstraints(constraints)
    .build()`,
      },
      {
        t: "list",
        items: [
          "**Network** — `CONNECTED` (any network), `UNMETERED` (Wi-Fi, to avoid cellular data charges), `METERED`, `NOT_REQUIRED`. Use `UNMETERED` for large uploads/downloads to respect the user's data plan.",
          "**Charging / battery** — run heavy or non-urgent work only while charging or when the battery isn't low, so you don't drain the user's battery.",
          "**Device idle / storage** — run when the device isn't in active use, or only if there's enough storage.",
          "**Behavior**: WorkManager holds the work in a `BLOCKED`/`ENQUEUED` state until constraints are met. If a constraint is violated *during* execution (charger unplugged), WorkManager stops the worker and retries when conditions return — so your worker should handle being interrupted.",
        ],
      },
    ],
  },
  {
    heading: "Chaining work",
    blocks: [
      {
        t: "p",
        text: "You can build **sequences and graphs** of work where the output of one worker feeds the next, and steps run in order (or in parallel). WorkManager guarantees the ordering and passes data between steps. This models multi-step background pipelines: compress → upload → notify, or download several files in parallel then process the combined result.",
      },
      {
        t: "code",
        title: "Sequential and parallel chains",
        code: `WorkManager.getInstance(context)
    .beginWith(listOf(downloadA, downloadB))   // these two run in PARALLEL
    .then(mergeWorker)                          // runs after BOTH finish
    .then(uploadWorker)                         // then this
    .enqueue()

// Output of one becomes input of the next automatically:
// mergeWorker's inputData includes the outputData of downloadA and downloadB`,
      },
      {
        t: "list",
        items: [
          "**`beginWith(...).then(...).then(...)`** — a sequential chain; each step runs after the previous succeeds. `beginWith(listOf(a, b))` runs a and b in *parallel*, and `then(c)` runs c after *both* complete.",
          "**Data flows through the chain** — a worker's `Result.success(outputData)` becomes the next worker's `inputData` (merged if multiple predecessors, via an `InputMerger`).",
          "**Failure propagation** — if any worker in a chain returns `failure()`, the *dependent* work is cancelled (the chain stops). A `retry()` retries just that worker before continuing.",
          "**Use for multi-step pipelines** where steps depend on each other and the whole sequence must be guaranteed — e.g. process a photo (resize → filter → upload) reliably even across app kills.",
        ],
      },
    ],
  },
  {
    heading: "Unique work — preventing duplicates",
    blocks: [
      {
        t: "p",
        text: "Often you want *only one* instance of a particular kind of work — one sync running at a time, not ten queued because the user pulled to refresh repeatedly. **Unique work** enforces this: you give the work a unique name and a policy for what to do if work with that name already exists.",
      },
      {
        t: "code",
        title: "Unique work with a conflict policy",
        code: `WorkManager.getInstance(context).enqueueUniqueWork(
    "sync",                                    // unique name
    ExistingWorkPolicy.KEEP,                   // what to do if "sync" already exists
    syncRequest,
)

// For periodic:
WorkManager.getInstance(context).enqueueUniquePeriodicWork(
    "periodic_sync",
    ExistingPeriodicWorkPolicy.UPDATE,
    periodicSyncRequest,
)`,
      },
      {
        t: "list",
        items: [
          "**`ExistingWorkPolicy` for one-time work**: `KEEP` (if work with this name exists, ignore the new request — the common choice for 'ensure one sync is scheduled'), `REPLACE` (cancel the existing and enqueue the new), `APPEND`/`APPEND_OR_REPLACE` (chain the new after the existing).",
          "**`ExistingPeriodicWorkPolicy` for periodic**: `KEEP` or `UPDATE` (update the existing periodic work's parameters without losing its schedule).",
          "**Why it matters**: without unique work, repeated triggers (pull-to-refresh, multiple app launches) queue *duplicate* work — wasteful and potentially buggy (multiple concurrent syncs racing). Unique work with `KEEP` ensures exactly one is scheduled. This is a very common real-world requirement and a frequent interview point.",
        ],
      },
    ],
  },
  {
    heading: "Expedited work and long-running (foreground) workers",
    blocks: [
      {
        t: "list",
        items: [
          "**Expedited work** (`setExpedited(...)`) — for work that's *important and should run as soon as possible* (not deferred), while still being guaranteed. WorkManager runs it quickly (using a foreground service quota on newer Android, or high-priority job). Use for user-initiated work that shouldn't wait — e.g. sending a message the user just tapped 'send' on. It's the middle ground between deferrable and immediate.",
          "**Long-running / foreground workers** (`setForeground(...)`) — for guaranteed work that takes a *long time* and should show the user a notification (a large file download/upload). The worker calls `setForeground(ForegroundInfo(...))` to run as a foreground service, so the OS won't kill it and the user sees progress. This combines WorkManager's *guarantee* with a foreground service's *immediacy and visibility*.",
          "**The distinction**: expedited = 'run soon, important, brief'; foreground worker = 'run now, long-running, user-visible with a notification'. Both escalate beyond plain deferrable work when needed.",
        ],
      },
    ],
  },
  {
    heading: "Retry, backoff, and cancellation",
    blocks: [
      {
        t: "code",
        title: "Backoff policy",
        code: `val request = OneTimeWorkRequestBuilder<SyncWorker>()
    .setBackoffCriteria(
        BackoffPolicy.EXPONENTIAL,          // or LINEAR
        WorkRequest.MIN_BACKOFF_MILLIS,     // starting delay (10s minimum)
        TimeUnit.MILLISECONDS,
    )
    .build()`,
      },
      {
        t: "list",
        items: [
          "**Backoff policy** — when a worker returns `Result.retry()`, WorkManager waits before retrying, increasing the delay per the policy: `EXPONENTIAL` (doubling — good for avoiding hammering a failing server) or `LINEAR`. Minimum backoff is 10 seconds. This prevents a failing task from retrying in a tight loop.",
          "**Cancellation** — cancel by id (`cancelWorkById`), by unique name (`cancelUniqueWork`), by tag (`cancelAllWorkByTag`), or all (`cancelAllWork`). A cancelled worker's coroutine is cancelled cooperatively (respect cancellation in `doWork`).",
          "**Tags** — `addTag(\"sync\")` groups related work so you can query or cancel by tag.",
          "**Hilt integration** — inject dependencies into workers with `@HiltWorker` + `@AssistedInject` and a `HiltWorkerFactory` (covered in the DI topic).",
        ],
      },
      {
        t: "note",
        text: "WorkManager advanced: constraints (network/charging/battery/idle) gate when work runs — use UNMETERED + charging for heavy work. Chaining (beginWith/then) builds sequential/parallel pipelines with data flowing between steps; failure cancels dependents. Unique work (enqueueUniqueWork + KEEP/REPLACE) prevents duplicate work — a common requirement. Expedited work runs important tasks soon; foreground workers (setForeground) run long, user-visible guaranteed work. Backoff (exponential) spaces retries; cancel by id/name/tag.",
      },
    ],
  },
];

export default content;
