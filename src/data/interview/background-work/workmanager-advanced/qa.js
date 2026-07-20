// WorkManager Advanced — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What are constraints in WorkManager and why are they useful?",
    a: [
      {
        t: "p",
        text: "**Constraints are conditions that must be true before WorkManager runs your work — like requiring network connectivity, charging, or the battery not being low.** WorkManager holds the work until all constraints are satisfied, then runs it, making background work battery- and data-friendly.",
      },
      {
        t: "list",
        items: [
          "**Network** — `CONNECTED` (any) or `UNMETERED` (Wi-Fi only). Use `UNMETERED` for large uploads/downloads so you don't consume the user's cellular data.",
          "**Charging / battery not low** — run heavy or non-urgent work only while charging or when the battery is healthy, so you don't drain the user's battery.",
          "**Device idle / storage not low** — run only when the device isn't actively used, or only if there's enough storage.",
        ],
      },
      {
        t: "code",
        title: "Adding constraints",
        code: `val constraints = Constraints.Builder()
    .setRequiredNetworkType(NetworkType.UNMETERED)
    .setRequiresCharging(true)
    .build()`,
      },
      {
        t: "p",
        text: "Why they matter: they let you be a good citizen with the user's resources. A photo-backup app that syncs gigabytes should require Wi-Fi and charging, so it never eats mobile data or battery. WorkManager also *re-evaluates* constraints during execution — if a required constraint is violated mid-run (charger unplugged), it stops the worker and retries when conditions return, so your worker should handle being interrupted gracefully.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you ensure only one instance of a background task runs at a time?",
    a: [
      {
        t: "p",
        text: "**You use *unique work* — `enqueueUniqueWork` with a unique name and an `ExistingWorkPolicy` that decides what happens if work with that name already exists.** This prevents duplicate work from being queued when the same task is triggered multiple times.",
      },
      {
        t: "code",
        title: "Unique work with KEEP",
        code: `WorkManager.getInstance(context).enqueueUniqueWork(
    "sync",                        // unique name
    ExistingWorkPolicy.KEEP,       // if "sync" already exists, ignore the new one
    syncRequest,
)`,
      },
      {
        t: "list",
        items: [
          "**`ExistingWorkPolicy.KEEP`** — if work with this name is already scheduled/running, ignore the new request. This is the common choice for 'ensure exactly one sync is scheduled' — repeated triggers don't pile up.",
          "**`REPLACE`** — cancel the existing work and enqueue the new one (use when the new request supersedes the old).",
          "**`APPEND` / `APPEND_OR_REPLACE`** — chain the new work after the existing one.",
          "**For periodic work**, use `enqueueUniquePeriodicWork` with `KEEP` or `UPDATE`.",
        ],
      },
      {
        t: "p",
        text: "This solves a real, common problem: without unique work, actions like pull-to-refresh or launching the app repeatedly would each enqueue a *new* sync, resulting in many duplicate (and possibly concurrent, racing) syncs — wasteful and buggy. With `enqueueUniqueWork(..., KEEP, ...)`, only one is ever scheduled regardless of how many times it's triggered. It's a frequent interview point because duplicate background work is such a common mistake.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you run multiple background tasks in sequence with WorkManager?",
    a: [
      {
        t: "p",
        text: "**You chain them with `beginWith(...).then(...).then(...)`, and WorkManager guarantees the ordering and passes each step's output to the next.** This models multi-step background pipelines where later steps depend on earlier ones.",
      },
      {
        t: "code",
        title: "A chain (with a parallel first step)",
        code: `WorkManager.getInstance(context)
    .beginWith(listOf(downloadA, downloadB))  // run in PARALLEL
    .then(mergeWorker)                         // after BOTH finish
    .then(uploadWorker)                        // then upload
    .enqueue()`,
      },
      {
        t: "list",
        items: [
          "**`beginWith(worker)`** starts the chain; **`.then(worker)`** adds a step that runs after the previous succeeds. Passing a *list* to `beginWith` or `then` runs those workers in *parallel*, and the next `.then` waits for all of them.",
          "**Data flows through automatically** — a worker's `Result.success(outputData)` becomes the next worker's `inputData` (merged if there are multiple predecessors).",
          "**Failure stops the chain** — if a worker returns `failure()`, the dependent (later) work is cancelled; a `retry()` retries just that step before continuing.",
        ],
      },
      {
        t: "p",
        text: "The whole chain is *guaranteed* like any WorkManager work — it survives app kills and reboots, resuming where it left off. So a 'compress → upload → notify server' pipeline runs reliably to completion even if the app is closed partway through. Use chaining when you have genuinely dependent multi-step background work; for independent tasks, just enqueue them separately.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a backoff policy in WorkManager?",
    a: [
      {
        t: "p",
        text: "**A backoff policy controls how long WorkManager waits before retrying work that returned `Result.retry()`, and how that delay grows with repeated failures.** It prevents a failing task from retrying in a tight loop that would waste battery and hammer a struggling server.",
      },
      {
        t: "list",
        items: [
          "**`BackoffPolicy.EXPONENTIAL`** — the delay doubles with each retry (e.g. 10s, 20s, 40s…). This is usually preferred because it backs off aggressively from a persistently failing operation, giving a struggling server room to recover.",
          "**`BackoffPolicy.LINEAR`** — the delay increases by a fixed amount each time.",
          "**Minimum backoff is 10 seconds** — you can't retry faster than that.",
        ],
      },
      {
        t: "code",
        title: "Setting exponential backoff",
        code: `OneTimeWorkRequestBuilder<SyncWorker>()
    .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 10, TimeUnit.SECONDS)
    .build()`,
      },
      {
        t: "p",
        text: "It's the same principle as retry logic in networking — retry transient failures, but with *increasing* delays so you don't overwhelm a failing system or drain the battery with rapid retries. WorkManager applies the backoff automatically whenever `doWork()` returns `Result.retry()`, so you just return `retry()` for transient failures and configure the policy. The default is exponential with a 30-second initial delay, which is sensible for most cases.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is expedited work and a long-running (foreground) worker, and when do you use each?",
    a: [
      {
        t: "p",
        text: "**Both escalate work beyond plain deferrable execution, but for different needs. *Expedited work* is for important work that should run *as soon as possible* (not deferred) while remaining guaranteed and brief. A *long-running / foreground worker* is for guaranteed work that takes a *long time* and should be visible to the user with a notification.**",
      },
      {
        t: "list",
        items: [
          "**Expedited work** (`setExpedited(...)`): tells WorkManager 'run this quickly, don't defer it', while still giving you WorkManager's guarantee and constraint handling. On newer Android it runs using a foreground-service quota; if the quota is exhausted it falls back to a regular (deferred) job. Use it for *user-initiated, important, short* work that shouldn't wait — e.g. the user taps 'send' on a message, or 'process' on an action; you want it to happen now, reliably, but it's brief. It's the middle ground between fully deferrable work and an immediate foreground service.",
          "**Long-running / foreground worker** (`setForeground(ForegroundInfo(...))` inside `doWork`): promotes the worker to run as a *foreground service*, showing a mandatory notification and preventing the OS from killing it during long execution. Use it for guaranteed work that runs for a while and that the user should see — a large file download or upload, exporting a big dataset. This combines WorkManager's *reliability* (persisted, survives kill/reboot, retries) with a foreground service's *immediacy and user-visibility* (runs now, shows progress).",
        ],
      },
      {
        t: "list",
        items: [
          "**The decision**: is it *important and brief* and shouldn't wait? → expedited. Is it *long-running and user-visible*? → foreground worker. Is it fine to *defer* (run under constraints whenever convenient)? → plain WorkManager. All three are guaranteed; they differ in *urgency* and *visibility*.",
          "**Why not just a foreground service directly for the long case?** Because a raw foreground service doesn't survive process death/reboot or get automatic retries — a WorkManager foreground worker does, so you get reliability *plus* the foreground behavior. That's the advantage of `setForeground` over a standalone service.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: WorkManager isn't only for 'run later when convenient' — it spans a spectrum. Expedited work handles 'run now-ish, important, short'; foreground workers handle 'run now, long, visible'; and both keep the guarantee (persistence, retries, reboot survival) that raw services and coroutines lack. Knowing that WorkManager can escalate to immediate and to foreground — and *why* you'd use `setForeground` over a plain foreground service (to keep the guarantee) — shows you understand WorkManager as the unified reliable-work solution, not just a deferred-task scheduler.",
      },
    ],
  },
  {
    level: "senior",
    q: "Design a reliable photo-upload feature with WorkManager: what constraints, uniqueness, chaining, and failure handling would you use?",
    a: [
      {
        t: "p",
        text: "**I'd design it as a guaranteed, constraint-aware, deduplicated pipeline that survives app death and handles failures with retries and backoff — using WorkManager's chaining, unique work, constraints, and (for large files) a foreground worker.** Here's the concrete design and the reasoning behind each choice:",
      },
      {
        t: "list",
        items: [
          "**Local-first, then enqueue**: when the user picks a photo, immediately save a local record marking it 'pending upload' (in Room), so the UI shows it instantly and the intent is durable. Then enqueue the upload work. This decouples the user action from the network and makes the queue survive process death (the offline-write pattern).",
          "**Constraints**: `setRequiredNetworkType(UNMETERED)` if you want to respect data plans (or `CONNECTED` with a user setting), and optionally `setRequiresBatteryNotLow(true)` for large batches. This ensures uploads don't burn cellular data or drain a low battery — being a good resource citizen.",
          "**Unique work per photo, or a unique queue**: use `enqueueUniqueWork` keyed by the photo id (or a single named upload queue with `APPEND`) so the same photo isn't uploaded twice if the user retries, and duplicate triggers don't create duplicate uploads. `KEEP` or a per-id name prevents duplication.",
          "**Chaining for multi-step processing**: if the photo needs processing, chain `beginWith(compressWorker).then(uploadWorker).then(notifyServerWorker)` — each step's output (the compressed file URI, the upload result) flows to the next, and the whole pipeline is guaranteed. If compression fails permanently, the upload won't run (dependent work is cancelled).",
          "**Foreground worker for large files**: for a big upload, call `setForeground(ForegroundInfo(notification))` so it runs as a foreground service showing progress (`setProgress` → observed via `WorkInfo` in the UI), won't be killed mid-upload, and still keeps WorkManager's guarantee.",
          "**Failure handling**: in `doWork`, return `Result.retry()` for transient failures (network errors, 5xx) with `EXPONENTIAL` backoff so retries don't hammer the server; return `Result.failure()` for permanent failures (invalid file, 400) so it doesn't loop forever. On permanent failure, update the local record to 'failed' so the UI can show an error and offer manual retry.",
          "**Idempotency**: give each upload a client-generated id sent to the server, so a retried upload (WorkManager may retry after a network drop that actually succeeded server-side) doesn't create a duplicate on the backend — the server dedupes by the id.",
          "**Observe for UI**: the ViewModel observes each work's `WorkInfo` Flow to show queued/uploading/progress/done/failed states, keeping the UI responsive while the actual upload is decoupled from any screen's lifetime.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: the design combines several WorkManager features to hit the real requirements — *guarantee* (survives kill/reboot via persistence), *deduplication* (unique work), *resource-friendliness* (constraints), *user visibility* (foreground worker + progress), *resilience* (retry with backoff, idempotency keys), and *responsive UX* (local-first record + WorkInfo observation). The key insight is that reliable upload is a *distributed-systems* problem (ambiguous failures, duplicates, offline queueing), and WorkManager provides exactly the primitives to handle it correctly — which is why it's the right tool over a plain coroutine or service. Being able to assemble these pieces into a coherent, failure-aware design is what the question is really testing.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the OutOfQuotaPolicy for expedited work?",
    a: [
      {
        t: "p",
        text: "Expedited work runs against a system *quota* (limited to prevent abuse). `OutOfQuotaPolicy` decides what happens when the quota is exhausted: `RUN_AS_NON_EXPEDITED_WORK_REQUEST` (fall back to normal deferred work — the safe default) or `DROP_WORK_REQUEST` (cancel it). Set it in `setExpedited(policy)` so your important work degrades gracefully rather than failing when quota runs out.",
      },
      {
        t: "code",
        title: "OutOfQuotaPolicy",
        code: `.setExpedited(OutOfQuotaPolicy.RUN_AS_NON_EXPEDITED_WORK_REQUEST)  // fall back if no quota`,
      },
      {
        t: "list",
        items: [
          "**Quota** — expedited work is rate-limited.",
          "**`RUN_AS_NON_EXPEDITED_WORK_REQUEST`** — fall back to deferred (safe).",
          "**`DROP_WORK_REQUEST`** — cancel when out of quota.",
          "**Graceful degradation** — important work still runs, just deferred.",
        ],
      },
      {
        t: "note",
        text: "Expedited work has a system quota; OutOfQuotaPolicy sets the fallback when exhausted: RUN_AS_NON_EXPEDITED_WORK_REQUEST (fall back to normal deferred — safe default) or DROP_WORK_REQUEST (cancel). Set it in setExpedited so important work degrades gracefully rather than failing.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you run a long-running Worker as a foreground service?",
    a: [
      {
        t: "p",
        text: "For work that takes a while (a large download), make it a *long-running worker* by calling `setForeground(getForegroundInfo())` — WorkManager runs it as a foreground service with a notification, so the system doesn't kill it and the user sees progress. Override `getForegroundInfo()` to supply the notification. This combines WorkManager's guarantees with foreground-service longevity.",
      },
      {
        t: "code",
        title: "Foreground worker",
        code: `override suspend fun doWork(): Result {
    setForeground(getForegroundInfo())   // becomes a foreground service
    download()
    return Result.success()
}
override suspend fun getForegroundInfo() = ForegroundInfo(1, buildNotification())`,
      },
      {
        t: "list",
        items: [
          "**`setForeground`** — run as a foreground service.",
          "**`getForegroundInfo`** — supply the notification.",
          "**Not killed** — foreground priority; user sees progress.",
          "**Long work** — large downloads/uploads.",
        ],
      },
      {
        t: "note",
        text: "For long work (large downloads), call setForeground(getForegroundInfo()) to run the Worker as a foreground service (notification, not killed, user sees progress); override getForegroundInfo() for the notification. Combines WorkManager's guarantees with foreground-service longevity.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you chain work with parallel and sequential steps?",
    a: [
      {
        t: "p",
        text: "Use `beginWith(...)`/`then(...)` to build a `WorkContinuation` — sequential steps run one after another (each starts when the prior succeeds), and you can run steps in *parallel* by passing a *list* of requests. Combine parallel results into a next step (WorkManager merges their output `Data` via an `InputMerger`). This models complex pipelines (compress 3 images in parallel, then upload).",
      },
      {
        t: "code",
        title: "Chaining",
        code: `WorkManager.getInstance(ctx)
    .beginWith(listOf(compress1, compress2, compress3))   // parallel
    .then(upload)                                          // after all succeed
    .then(cleanup)
    .enqueue()`,
      },
      {
        t: "list",
        items: [
          "**`beginWith`/`then`** — build a chain.",
          "**Parallel** — pass a list of requests.",
          "**Sequential** — `then` runs after the prior succeeds.",
          "**`InputMerger`** — merges parallel outputs into the next input.",
        ],
      },
      {
        t: "note",
        text: "Chain with beginWith(...).then(...) → a WorkContinuation: sequential steps run after the prior succeeds; pass a list for parallel steps. WorkManager merges parallel outputs (InputMerger) into the next step's input. Models pipelines (compress N images in parallel, then upload, then cleanup). A failure fails the chain.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is an InputMerger, and when do you need one?",
    a: [
      {
        t: "p",
        text: "When multiple parallel workers feed into a single next worker, WorkManager combines their output `Data` into the next worker's input using an `InputMerger`. The default `OverwritingInputMerger` overwrites same keys; `ArrayCreatingInputMerger` collects same-key values into arrays. Set it with `setInputMerger` on the merging request — needed when parallel steps produce data the next step must combine.",
      },
      {
        t: "list",
        items: [
          "**Combines parallel outputs** — into the next worker's input.",
          "**`OverwritingInputMerger`** — default; same keys overwrite.",
          "**`ArrayCreatingInputMerger`** — collect same-key values into arrays.",
          "**`setInputMerger`** — on the merging request.",
        ],
      },
      {
        t: "note",
        text: "An InputMerger combines multiple parallel workers' output Data into the next worker's input: OverwritingInputMerger (default — same keys overwrite) or ArrayCreatingInputMerger (collect same-key values into arrays). Set via setInputMerger on the merging request when parallel steps produce data the next must combine.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you limit retries and give up after too many attempts?",
    a: [
      {
        t: "p",
        text: "WorkManager retries indefinitely by default (per backoff) — to *cap* retries, check `runAttemptCount` inside `doWork()` and return `Result.failure()` after a threshold. This prevents infinite retry loops for work that keeps failing (a permanently-bad request). Combine with distinguishing transient (`retry()`) from permanent (`failure()`) errors.",
      },
      {
        t: "code",
        title: "Capping retries",
        code: `override suspend fun doWork(): Result {
    return try { sync(); Result.success() }
    catch (e: IOException) {
        if (runAttemptCount >= 3) Result.failure() else Result.retry()
    }
}`,
      },
      {
        t: "list",
        items: [
          "**`runAttemptCount`** — how many times this ran.",
          "**Cap** — `failure()` after a threshold.",
          "**Avoid infinite loops** — for permanently-failing work.",
          "**Transient vs permanent** — retry vs fail deliberately.",
        ],
      },
      {
        t: "note",
        text: "WorkManager retries indefinitely by default; cap it by checking runAttemptCount in doWork() and returning Result.failure() after a threshold — preventing infinite loops for permanently-failing work. Combine with distinguishing transient errors (retry()) from permanent (failure()).",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you ensure unique periodic work isn't duplicated?",
    a: [
      {
        t: "p",
        text: "Use `enqueueUniquePeriodicWork(name, ExistingPeriodicWorkPolicy.KEEP, request)` — with `KEEP`, if periodic work with that name already exists, the new request is ignored (no duplicate schedule). Use `UPDATE`/`REPLACE` to change the existing one. This is essential because enqueueing periodic work on every app start would otherwise create multiple schedules.",
      },
      {
        t: "code",
        title: "Unique periodic",
        code: `WorkManager.getInstance(ctx).enqueueUniquePeriodicWork(
    "sync", ExistingPeriodicWorkPolicy.KEEP, syncRequest)`,
      },
      {
        t: "list",
        items: [
          "**`enqueueUniquePeriodicWork(name, policy, request)`** — named periodic work.",
          "**`KEEP`** — ignore new if one exists (no duplicate).",
          "**`UPDATE`/`REPLACE`** — change the existing schedule.",
          "**Essential** — avoid multiple schedules from repeated enqueues.",
        ],
      },
      {
        t: "note",
        text: "Use enqueueUniquePeriodicWork(name, ExistingPeriodicWorkPolicy.KEEP, request) — KEEP ignores the new request if periodic work with that name exists (no duplicate). UPDATE/REPLACE changes it. Essential because enqueueing periodic work on every app start would otherwise create multiple schedules.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between KEEP, REPLACE, and APPEND work policies?",
    a: [
      {
        t: "p",
        text: "For `enqueueUniqueWork`: `KEEP` ignores the new request if one is pending (dedupe); `REPLACE` cancels the existing and enqueues the new (latest wins); `APPEND` adds the new work to run *after* the existing chain (queue). `APPEND_OR_REPLACE` appends unless the existing failed/cancelled. Choose by whether duplicates should be ignored, replaced, or queued.",
      },
      {
        t: "list",
        items: [
          "**`KEEP`** — ignore new if pending (dedupe).",
          "**`REPLACE`** — cancel existing, enqueue new (latest wins).",
          "**`APPEND`** — queue after the existing chain.",
          "**`APPEND_OR_REPLACE`** — append unless the existing failed.",
        ],
      },
      {
        t: "note",
        text: "enqueueUniqueWork policies: KEEP (ignore new if pending — dedupe), REPLACE (cancel existing + enqueue new — latest wins), APPEND (queue after the existing chain), APPEND_OR_REPLACE (append unless existing failed/cancelled). Choose by whether duplicates should be ignored, replaced, or queued.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle failures in a work chain?",
    a: [
      {
        t: "p",
        text: "If any worker in a chain returns `Result.failure()`, the *entire chain stops* — dependent workers are marked `FAILED` and don't run. So return `retry()` for transient failures (WorkManager retries that worker with backoff) and `failure()` only for permanent errors. Design chains so a recoverable step retries rather than failing the whole pipeline, and observe the terminal `WorkInfo` for the outcome.",
      },
      {
        t: "list",
        items: [
          "**Failure stops the chain** — dependents marked FAILED.",
          "**`retry()`** — for transient (retries that step with backoff).",
          "**`failure()`** — permanent only.",
          "**Observe** — the chain's terminal WorkInfo for the outcome.",
        ],
      },
      {
        t: "note",
        text: "A Result.failure() in a chain stops the whole chain (dependents marked FAILED, don't run). Return retry() for transient failures (WorkManager retries that worker with backoff), failure() only for permanent errors. Design so recoverable steps retry, not fail the pipeline; observe the terminal WorkInfo for the outcome.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you design a reliable data-sync-on-reconnect feature?",
    a: [
      {
        t: "p",
        text: "Queue changes locally (an outbox/pending table) as the user makes them offline, and enqueue a *unique* sync `Worker` with a `NetworkType.CONNECTED` constraint — WorkManager runs it when connectivity returns. The worker sends pending changes to the server (with idempotency keys for safe retries), marks them synced, and retries transient failures with backoff. Observe `WorkInfo` to show sync status.",
      },
      {
        t: "list",
        items: [
          "**Local outbox** — queue offline changes in the DB.",
          "**Unique worker + network constraint** — runs on reconnect.",
          "**Idempotency keys** — safe retries; mark synced on success.",
          "**Backoff + WorkInfo** — retry transient failures; show status.",
        ],
      },
      {
        t: "note",
        text: "Sync-on-reconnect: queue offline changes in a local outbox/pending table, enqueue a unique sync Worker with a NetworkType.CONNECTED constraint (runs when online), send pending changes with idempotency keys (safe retries), mark synced on success, retry transient failures with backoff, and observe WorkInfo for status.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you observe the final result of a chained work sequence?",
    a: [
      {
        t: "p",
        text: "Enqueue the chain with a *unique name*, then observe `getWorkInfosForUniqueWorkLiveData(name)` (or by the last worker's id) — it gives the `WorkInfo` list for the chain, from which you read the terminal state and the final worker's output `Data`. Since a chain succeeds only when all steps succeed, watch for the last worker's `SUCCEEDED` (or any `FAILED`) to know the overall outcome.",
      },
      {
        t: "list",
        items: [
          "**Unique name** — reference the whole chain.",
          "**`getWorkInfosForUniqueWork`** — the chain's WorkInfos.",
          "**Terminal state** — last worker SUCCEEDED / any FAILED.",
          "**Final output** — the last worker's output Data.",
        ],
      },
      {
        t: "note",
        text: "Observe a chain via a unique name: getWorkInfosForUniqueWorkLiveData(name) (or the last worker's id) gives the chain's WorkInfos — read the terminal state and the final worker's output. A chain succeeds only when all steps do, so watch the last worker's SUCCEEDED (or any FAILED) for the outcome.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do constraints interact with Doze mode and battery optimization?",
    a: [
      {
        t: "p",
        text: "WorkManager constraints (network, charging) already defer work to appropriate conditions, but *Doze mode* (deep sleep) further batches and delays deferrable work into maintenance windows — so constrained work may wait longer when the device is idle. WorkManager respects these OS restrictions (it's designed to be battery-friendly). Expedited/foreground work bypasses some deferral for urgent tasks.",
      },
      {
        t: "list",
        items: [
          "**Constraints defer** — to appropriate conditions.",
          "**Doze batches** — deferrable work into maintenance windows.",
          "**Longer waits** — when idle; WorkManager respects this.",
          "**Expedited/foreground** — bypass some deferral for urgent work.",
        ],
      },
      {
        t: "note",
        text: "WorkManager constraints defer work to good conditions, and Doze further batches/delays deferrable work into maintenance windows (longer waits when idle) — WorkManager respects these battery restrictions. Expedited/foreground work bypasses some deferral for urgent tasks.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you migrate periodic work to run more frequently than 15 minutes?",
    a: [
      {
        t: "p",
        text: "WorkManager's periodic minimum is 15 minutes (a battery constraint). For more frequent execution, you can: chain *one-time* work that re-enqueues itself with a shorter `setInitialDelay` (though the system may still throttle), use a *foreground service* with your own loop for genuinely continuous work, or reconsider the need (frequent polling drains battery — prefer *push*/FCM). There's no way to make *periodic* work faster than 15 minutes.",
      },
      {
        t: "list",
        items: [
          "**15-min minimum** — a hard limit for periodic work.",
          "**Self-rescheduling one-time work** — shorter delays (still throttled).",
          "**Foreground service** — for continuous work with your own loop.",
          "**Prefer push** — FCM over frequent polling (battery).",
        ],
      },
      {
        t: "note",
        text: "Periodic work's 15-min minimum is a hard battery limit. For faster: chain self-rescheduling one-time work with a short setInitialDelay (system may throttle), or a foreground service with your own loop for continuous work. Better: use FCM push over frequent polling (battery). Periodic can't go below 15 min.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between constraints and initial delay?",
    a: [
      {
        t: "p",
        text: "A *constraint* is a *condition* that must be true for work to run (network connected, charging) — WorkManager waits indefinitely until it's met. An *initial delay* is a *time* offset — the earliest the work can run after enqueue. They combine: work runs when *both* the delay has passed *and* all constraints are satisfied. Constraints are about device state; delay is about timing.",
      },
      {
        t: "list",
        items: [
          "**Constraint** — a condition (network/charging); waits until met.",
          "**Initial delay** — earliest run time after enqueue.",
          "**Combined** — both delay elapsed AND constraints met.",
          "**State vs timing** — constraints = device state, delay = time.",
        ],
      },
      {
        t: "note",
        text: "A constraint is a condition that must hold for work to run (network/charging — WorkManager waits until met); an initial delay is the earliest run time after enqueue. Work runs when both the delay has elapsed AND all constraints are satisfied. Constraints = device state; delay = timing.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you cancel a running Worker gracefully and clean up?",
    a: [
      {
        t: "p",
        text: "When a Worker is cancelled (by id/tag or constraint loss), a `CoroutineWorker`'s coroutine is *cancelled* — so cooperative suspend calls throw `CancellationException` and stop. Handle cleanup in a `try/finally` (release resources, close streams, revert partial state), using `withContext(NonCancellable)` for suspend cleanup that must finish. For a synchronous `Worker`, check `isStopped` in loops to exit early.",
      },
      {
        t: "list",
        items: [
          "**Cancellation** — CoroutineWorker's coroutine is cancelled.",
          "**`try/finally`** — clean up (resources, streams, partial state).",
          "**`NonCancellable`** — for suspend cleanup that must complete.",
          "**Sync Worker** — check `isStopped` in loops.",
        ],
      },
      {
        t: "note",
        text: "On cancellation, a CoroutineWorker's coroutine is cancelled (cooperative suspend calls throw CancellationException). Clean up in try/finally (resources, streams, revert partial state), using withContext(NonCancellable) for must-finish suspend cleanup. A synchronous Worker checks isStopped in loops to exit early.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you schedule work that syncs data efficiently?",
    a: [
      {
        t: "p",
        text: "For periodic sync: a `PeriodicWorkRequest` (unique, KEEP) with network constraints, syncing to the DB (source of truth) with retry/backoff. For *event-driven* freshness, trigger a *one-time* expedited sync from an FCM data message. Combine: periodic baseline sync + push-triggered immediate sync. Use delta sync (changes since last) to minimize data, and constraints to run on good networks.",
      },
      {
        t: "list",
        items: [
          "**Periodic baseline** — unique periodic work + network constraint.",
          "**Push-triggered** — FCM → one-time expedited sync for freshness.",
          "**Write to the DB** — source of truth; retry/backoff.",
          "**Delta sync** — changes since last, to minimize data.",
        ],
      },
      {
        t: "note",
        text: "Efficient sync: a unique PeriodicWorkRequest (KEEP) with network constraints as a baseline, plus FCM-triggered one-time expedited sync for event-driven freshness. Write to the DB (source of truth) with retry/backoff, use delta sync (changes since last) to minimize data, and constraints to run on good networks.",
      },
    ],
  },
  {
    level: "junior",
    q: "What states can work be in, and what do they mean?",
    a: [
      {
        t: "p",
        text: "`WorkInfo.State`: `ENQUEUED` (scheduled, waiting for constraints/delay), `RUNNING` (executing), `SUCCEEDED` (finished with `success()`), `FAILED` (finished with `failure()`), `BLOCKED` (waiting for prerequisite work in a chain), and `CANCELLED`. SUCCEEDED/FAILED/CANCELLED are terminal for one-time work; periodic work returns to ENQUEUED after each run.",
      },
      {
        t: "list",
        items: [
          "**ENQUEUED** — scheduled, waiting.",
          "**RUNNING** — executing now.",
          "**SUCCEEDED/FAILED** — terminal outcomes.",
          "**BLOCKED/CANCELLED** — waiting on prerequisites / cancelled.",
        ],
      },
      {
        t: "note",
        text: "WorkInfo.State: ENQUEUED (waiting for constraints/delay), RUNNING, SUCCEEDED (success()), FAILED (failure()), BLOCKED (waiting on chain prerequisites), CANCELLED. Terminal for one-time work; periodic work returns to ENQUEUED after each run. Observe these for UI progress/completion.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle work that depends on user authentication?",
    a: [
      {
        t: "p",
        text: "If work needs a valid token (upload requires auth), handle expiry *inside* the Worker: refresh the token via your auth flow, and if refresh fails (session truly expired), return `Result.failure()` (don't retry indefinitely) and signal the app to prompt re-login. Don't retry auth-failed work forever. Consider whether the work should be *cancelled on logout* (cancel by tag/name when the user logs out).",
      },
      {
        t: "list",
        items: [
          "**Refresh in the Worker** — get a valid token before the request.",
          "**Refresh fails → `failure()`** — don't retry forever; prompt re-login.",
          "**Cancel on logout** — cancel pending auth-dependent work.",
          "**Don't loop** — distinguish transient from permanent auth failure.",
        ],
      },
      {
        t: "note",
        text: "For auth-dependent work: refresh the token inside the Worker before the request; if refresh fails (session expired), return Result.failure() (don't retry forever) and signal the app to prompt re-login. Cancel pending auth-dependent work on logout (by tag/name). Distinguish transient (retry) from permanent auth failure.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the execution time limit for a Worker, and how do you handle long work?",
    a: [
      {
        t: "p",
        text: "A Worker has roughly a *10-minute* execution window (from the underlying JobScheduler) before the system may stop it. For work that can exceed this, run it as a *long-running/foreground worker* (`setForeground`) which isn't subject to the same limit and shows a notification, or *break the work into smaller chunks* across multiple workers (chaining or self-rescheduling). Don't assume unlimited runtime in a normal Worker.",
      },
      {
        t: "list",
        items: [
          "**~10-minute limit** — the system may stop a Worker after it.",
          "**Foreground worker** — `setForeground` for longer work.",
          "**Chunk it** — split across workers (chain/reschedule).",
          "**Don't assume unlimited** — in a normal Worker.",
        ],
      },
      {
        t: "note",
        text: "A Worker has ~10 minutes of execution (from JobScheduler) before the system may stop it. For longer work, run a foreground worker (setForeground — not subject to the limit, shows a notification) or chunk the work across multiple workers (chaining/self-reschedule). Don't assume unlimited runtime.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you debug and inspect WorkManager?",
    a: [
      {
        t: "p",
        text: "Use Android Studio's *Background Task Inspector* to see enqueued/running work, their states, constraints, and chains visually. From the command line, `adb shell dumpsys jobscheduler` shows scheduled jobs. Enable WorkManager's verbose logging (via `Configuration.setMinimumLoggingLevel`) for detailed logs. Observing `WorkInfo` in code also helps trace states.",
      },
      {
        t: "list",
        items: [
          "**Background Task Inspector** — visualize work, states, chains.",
          "**`adb shell dumpsys jobscheduler`** — scheduled jobs.",
          "**Verbose logging** — `setMinimumLoggingLevel`.",
          "**`WorkInfo`** — observe states in code.",
        ],
      },
      {
        t: "note",
        text: "Debug WorkManager with Android Studio's Background Task Inspector (visualize work/states/constraints/chains), adb shell dumpsys jobscheduler (scheduled jobs), WorkManager verbose logging (Configuration.setMinimumLoggingLevel), and observing WorkInfo in code.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does a Worker notify the user or update the UI when it finishes?",
    a: [
      {
        t: "p",
        text: "A Worker can post a *notification* directly (for user-facing completion, like 'upload done'). To update the *UI*, don't touch views from the Worker — instead write results to the *DB* (which the UI observes) or observe the Worker's `WorkInfo` in the ViewModel/UI (`getWorkInfoByIdLiveData`) and react to `SUCCEEDED`/output. The Worker runs in the background, so communicate via persisted state or WorkInfo, not direct UI calls.",
      },
      {
        t: "list",
        items: [
          "**Notification** — for user-facing completion.",
          "**Write to DB** — the UI observes it (single source of truth).",
          "**Observe `WorkInfo`** — react to SUCCEEDED/output in the UI.",
          "**No direct UI** — the Worker is background; use persisted state/WorkInfo.",
        ],
      },
      {
        t: "note",
        text: "A Worker can post a notification for user-facing completion. To update the UI, write results to the DB (UI observes it) or observe the Worker's WorkInfo (getWorkInfoByIdLiveData) in the ViewModel and react to SUCCEEDED/output — don't touch views from the background Worker.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you schedule work for a specific time of day?",
    a: [
      {
        t: "p",
        text: "WorkManager isn't for exact times, but you can *approximate* a daily task: compute the delay until the target time and use `setInitialDelay`, then re-enqueue for the next day on completion (or use periodic work with a ~24h interval, accepting the flex window). For a *precise* time (an alarm at 8:00 AM), use `AlarmManager` with `setExactAndAllowWhileIdle` instead — WorkManager only guarantees eventual, deferrable execution.",
      },
      {
        t: "list",
        items: [
          "**Approximate** — `setInitialDelay` to the target time; re-enqueue daily.",
          "**Periodic ~24h** — accept the flex window (not exact).",
          "**Exact time** — use `AlarmManager` (`setExactAndAllowWhileIdle`).",
          "**WorkManager** — eventual/deferrable, not precise timing.",
        ],
      },
      {
        t: "note",
        text: "WorkManager isn't for exact times: approximate a daily task with setInitialDelay to the target and re-enqueue daily (or periodic ~24h, accepting the flex window). For a precise time (8:00 AM alarm), use AlarmManager (setExactAndAllowWhileIdle). WorkManager guarantees eventual, deferrable execution only.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle very large or resumable file uploads?",
    a: [
      {
        t: "p",
        text: "For large uploads, run a *foreground worker* (avoiding the ~10-min limit) and use a *resumable/chunked* upload protocol (e.g. tus, or the server's multipart resumable API) — upload in chunks, track the offset, and on interruption/retry resume from the last confirmed offset rather than restarting. Report progress via `setProgress`, use network constraints, and persist upload state so a retry continues where it left off.",
      },
      {
        t: "list",
        items: [
          "**Foreground worker** — avoid the time limit; show progress.",
          "**Resumable/chunked** — upload in chunks, track offset.",
          "**Resume on retry** — from the last confirmed offset.",
          "**Persist state + constraints** — continue after interruption.",
        ],
      },
      {
        t: "note",
        text: "Large/resumable uploads: run a foreground worker (avoid the ~10-min limit, show progress) with a resumable/chunked protocol (tus/server resumable API) — upload chunks, track the offset, resume from the last confirmed offset on retry (don't restart). Persist upload state, use network constraints, report progress via setProgress.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between setForeground work and a standalone foreground service?",
    a: [
      {
        t: "p",
        text: "A `setForeground` *worker* is WorkManager running your work as a foreground service temporarily — it gets WorkManager's guarantees (persistence, constraints, retry) *plus* foreground longevity for that task. A *standalone* foreground service is a component *you* manage directly (start/stop, notification, lifecycle) for ongoing user-visible work (music, navigation). Use the foreground worker for guaranteed background *tasks* that happen to be long; a standalone service for continuous user-facing features.",
      },
      {
        t: "list",
        items: [
          "**Foreground worker** — WorkManager guarantees + foreground longevity for a task.",
          "**Standalone service** — you manage it; ongoing user-visible work.",
          "**Worker** — for guaranteed background tasks that are long.",
          "**Service** — for continuous features (music/nav).",
        ],
      },
      {
        t: "note",
        text: "A setForeground worker is WorkManager running your task as a foreground service temporarily — WorkManager's guarantees (persistence/constraints/retry) plus foreground longevity. A standalone foreground service is a component you manage directly for ongoing user-visible work (music/nav). Worker for guaranteed long tasks; service for continuous features.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you observe work across app restarts?",
    a: [
      {
        t: "p",
        text: "Because WorkManager persists work with stable *unique names*/*ids*, you can re-observe it after an app restart by name: `getWorkInfosForUniqueWorkLiveData(name)` (or by id if you persisted the id). On app launch, query the state of ongoing work (an in-progress upload) and restore the UI accordingly. Use unique names so you can reliably reference work whose id you didn't persist.",
      },
      {
        t: "list",
        items: [
          "**Unique names** — reference persisted work reliably after restart.",
          "**`getWorkInfosForUniqueWork`** — re-observe by name.",
          "**On launch** — query ongoing work, restore UI.",
          "**Persist the id** — or use a unique name to find it.",
        ],
      },
      {
        t: "note",
        text: "WorkManager persists work with stable unique names/ids, so re-observe after restart via getWorkInfosForUniqueWorkLiveData(name) (or by persisted id). On launch, query ongoing work (an in-progress upload) and restore the UI. Use unique names to reference work whose id you didn't persist.",
      },
    ],
  },
];

export default qa;
