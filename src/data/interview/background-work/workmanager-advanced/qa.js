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
];

export default qa;
