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
  {
    level: "junior",
    q: "What is a Worker, and what does doWork() do?",
    a: [
      {
        t: "p",
        text: "A `Worker` is the class that defines the *task* WorkManager runs — you subclass it and implement `doWork()`, which contains the work and returns a `Result` (`success`/`retry`/`failure`). WorkManager instantiates and runs it on a background thread when the work's constraints are met. It's the unit of background work.",
      },
      {
        t: "code",
        title: "A Worker",
        code: `class UploadWorker(ctx: Context, params: WorkerParameters) : CoroutineWorker(ctx, params) {
    override suspend fun doWork(): Result = try {
        uploadPhotos()
        Result.success()
    } catch (e: IOException) { Result.retry() }
}`,
      },
      {
        t: "list",
        items: [
          "**`Worker` subclass** — defines the task.",
          "**`doWork()`** — the work; returns a `Result`.",
          "**Background thread** — WorkManager runs it off the main thread.",
          "**`Result`** — `success()`/`retry()`/`failure()`.",
        ],
      },
      {
        t: "note",
        text: "A Worker defines the background task — subclass it and implement doWork() (the work, returning Result.success/retry/failure). WorkManager instantiates and runs it on a background thread when constraints are met. It's the unit of background work; CoroutineWorker's doWork() is suspend.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between Worker, CoroutineWorker, and RxWorker?",
    a: [
      {
        t: "p",
        text: "They differ by threading/async model. `Worker`'s `doWork()` runs *synchronously* on a background thread (blocking). `CoroutineWorker`'s `doWork()` is a *suspend* function running in a coroutine — the modern default for Kotlin, integrating with coroutines/Flow. `RxWorker` returns a `Single<Result>` for RxJava codebases. Use `CoroutineWorker` in Kotlin apps.",
      },
      {
        t: "list",
        items: [
          "**`Worker`** — synchronous `doWork()` on a background thread.",
          "**`CoroutineWorker`** — suspend `doWork()`; coroutine-based (preferred).",
          "**`RxWorker`** — `Single<Result>` for RxJava.",
          "**Kotlin** — use `CoroutineWorker`.",
        ],
      },
      {
        t: "note",
        text: "Worker: synchronous doWork() on a background thread. CoroutineWorker: suspend doWork() in a coroutine — modern Kotlin default (integrates coroutines/Flow). RxWorker: Single<Result> for RxJava. Use CoroutineWorker in Kotlin apps.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you build and enqueue a WorkRequest?",
    a: [
      {
        t: "p",
        text: "Build a `OneTimeWorkRequestBuilder<YourWorker>()` (or `PeriodicWorkRequestBuilder`), configure it (constraints, input data, backoff, tags), then enqueue it with `WorkManager.getInstance(context).enqueue(request)`. WorkManager persists and schedules it. For deduplication, use `enqueueUniqueWork`.",
      },
      {
        t: "code",
        title: "Enqueue work",
        code: `val request = OneTimeWorkRequestBuilder<UploadWorker>()
    .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
    .setInputData(workDataOf("photoId" to id))
    .addTag("upload")
    .build()
WorkManager.getInstance(context).enqueue(request)`,
      },
      {
        t: "list",
        items: [
          "**`OneTimeWorkRequestBuilder`/`PeriodicWorkRequestBuilder`** — build the request.",
          "**Configure** — constraints, input data, backoff, tags.",
          "**`enqueue(request)`** — schedule and persist it.",
          "**`enqueueUniqueWork`** — for deduplication.",
        ],
      },
      {
        t: "note",
        text: "Build a OneTimeWorkRequestBuilder<Worker>() (or Periodic), configure (constraints/input/backoff/tags), and enqueue with WorkManager.getInstance(context).enqueue(request) — it persists and schedules the work. Use enqueueUniqueWork for deduplication.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you pass input to a Worker and return output?",
    a: [
      {
        t: "p",
        text: "Pass input via a `Data` object (`workDataOf(\"key\" to value)`) set on the request with `setInputData`; read it in the Worker with `inputData.getString(...)`. Return output by including a `Data` in the `Result` (`Result.success(workDataOf(...))`), which is available to the next chained worker or via `WorkInfo`. `Data` holds only small primitives/arrays (like a Bundle) — pass ids, not large blobs.",
      },
      {
        t: "code",
        title: "Input/output Data",
        code: `// Enqueue: .setInputData(workDataOf("url" to url))
// In Worker:
val url = inputData.getString("url")!!
return Result.success(workDataOf("resultId" to id))`,
      },
      {
        t: "list",
        items: [
          "**Input** — `setInputData(workDataOf(...))`; read via `inputData`.",
          "**Output** — `Result.success(workDataOf(...))`.",
          "**Small only** — primitives/arrays (like a Bundle); pass ids.",
          "**Chaining** — output feeds the next worker's input.",
        ],
      },
      {
        t: "note",
        text: "Input: setInputData(workDataOf(\"key\" to value)), read via inputData.getString(...). Output: Result.success(workDataOf(...)) — available to the next chained worker or via WorkInfo. Data holds only small primitives/arrays (like a Bundle) — pass ids, not large blobs.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you observe the status of enqueued work?",
    a: [
      {
        t: "p",
        text: "Observe `WorkInfo` — via `getWorkInfoByIdLiveData(id)`, `getWorkInfosByTagLiveData(tag)`, or the Flow variants. `WorkInfo` gives the `State` (ENQUEUED, RUNNING, SUCCEEDED, FAILED, BLOCKED, CANCELLED), progress, and output `Data`. The UI can show progress/completion by collecting this. WorkManager also supports `setProgress` inside a Worker to report intermediate progress.",
      },
      {
        t: "code",
        title: "Observing WorkInfo",
        code: `WorkManager.getInstance(context)
    .getWorkInfoByIdLiveData(request.id)
    .observe(owner) { info ->
        when (info?.state) { WorkInfo.State.SUCCEEDED -> show(info.outputData); else -> {} }
    }`,
      },
      {
        t: "list",
        items: [
          "**`WorkInfo`** — state, progress, output.",
          "**By id/tag/unique name** — LiveData or Flow.",
          "**States** — ENQUEUED/RUNNING/SUCCEEDED/FAILED/BLOCKED/CANCELLED.",
          "**`setProgress`** — report intermediate progress from the Worker.",
        ],
      },
      {
        t: "note",
        text: "Observe WorkInfo (getWorkInfoByIdLiveData/getWorkInfosByTagLiveData or Flow variants) — it exposes State (ENQUEUED/RUNNING/SUCCEEDED/FAILED/BLOCKED/CANCELLED), progress, and output Data. Use setProgress in the Worker for intermediate progress; the UI collects it for progress/completion.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you cancel enqueued or running work?",
    a: [
      {
        t: "p",
        text: "Cancel by *id* (`cancelWorkById(id)`), by *tag* (`cancelAllWorkByTag(tag)`), by *unique name* (`cancelUniqueWork(name)`), or all (`cancelAllWork()`). Cancellation stops pending work and signals running work (the Worker's `isStopped`/coroutine cancellation) to stop cooperatively. Handle cancellation in the Worker (release resources, don't leave partial state).",
      },
      {
        t: "list",
        items: [
          "**`cancelWorkById(id)`** — one request.",
          "**`cancelAllWorkByTag(tag)`** — by tag.",
          "**`cancelUniqueWork(name)`** — a unique chain.",
          "**Cooperative** — running Workers get `isStopped`/coroutine cancellation.",
        ],
      },
      {
        t: "note",
        text: "Cancel work by id (cancelWorkById), tag (cancelAllWorkByTag), unique name (cancelUniqueWork), or all (cancelAllWork). Pending work is cancelled; running Workers are signaled (isStopped / coroutine cancellation) to stop cooperatively — handle it (release resources, avoid partial state).",
      },
    ],
  },
  {
    level: "senior",
    q: "What does WorkManager use under the hood?",
    a: [
      {
        t: "p",
        text: "WorkManager is an *abstraction* over the platform's scheduling mechanisms — it picks the best one for the API level: `JobScheduler` on API 23+, and (historically) a combination of `AlarmManager` + `BroadcastReceiver` on older versions. It stores work in a `Room` database for persistence. You don't deal with these directly; WorkManager handles compatibility and guarantees.",
      },
      {
        t: "list",
        items: [
          "**Abstraction** — picks the best scheduler per API level.",
          "**`JobScheduler`** — API 23+.",
          "**AlarmManager + Receiver** — legacy fallback.",
          "**Room DB** — persists work for reboot survival.",
        ],
      },
      {
        t: "note",
        text: "WorkManager abstracts the platform schedulers — JobScheduler on API 23+ (AlarmManager + BroadcastReceiver on older), storing work in a Room database for persistence. It handles compatibility/guarantees so you don't touch JobScheduler directly.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does WorkManager survive process death and reboot?",
    a: [
      {
        t: "p",
        text: "WorkManager persists enqueued work (and its constraints/state) in a *Room database* on disk. So if the process is killed or the device reboots, the work isn't lost — WorkManager (via a `BOOT_COMPLETED` receiver and its scheduler) reschedules pending work when the app/device restarts. This *guaranteed execution* is WorkManager's key differentiator from a plain coroutine/service, which die with the process.",
      },
      {
        t: "list",
        items: [
          "**Persisted in Room** — work survives on disk.",
          "**Reschedules on reboot** — via BOOT_COMPLETED.",
          "**Guaranteed execution** — runs even after kill/restart.",
          "**vs coroutine/service** — those die with the process.",
        ],
      },
      {
        t: "note",
        text: "WorkManager persists work + constraints/state in a Room DB, so process kill or reboot doesn't lose it — it reschedules pending work on restart (BOOT_COMPLETED). This guaranteed execution is the key difference from a plain coroutine/service, which die with the process.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is an initial delay, and how do you schedule work for later?",
    a: [
      {
        t: "p",
        text: "`setInitialDelay(duration)` on a `WorkRequest` delays the *earliest* time the work can run (WorkManager may run it later depending on constraints/Doze). WorkManager isn't for *exact* timing — it's for *deferrable* work. For an exact time (an alarm/reminder), use `AlarmManager`; for 'run after ~X, when convenient', use `setInitialDelay`.",
      },
      {
        t: "code",
        title: "Initial delay",
        code: `OneTimeWorkRequestBuilder<Worker>()
    .setInitialDelay(30, TimeUnit.MINUTES)   // earliest run time
    .build()`,
      },
      {
        t: "list",
        items: [
          "**`setInitialDelay`** — earliest run time (not exact).",
          "**Deferrable** — WorkManager may run later (constraints/Doze).",
          "**Not exact timing** — use `AlarmManager` for that.",
          "**Use** — 'run after ~X, when convenient'.",
        ],
      },
      {
        t: "note",
        text: "setInitialDelay(duration) sets the earliest time work can run (WorkManager may run later per constraints/Doze — it's deferrable, not exact). For exact timing (alarms/reminders) use AlarmManager; use setInitialDelay for 'run after ~X, when convenient'.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle a Result.retry, and what triggers it?",
    a: [
      {
        t: "p",
        text: "Return `Result.retry()` from `doWork()` when the work failed *transiently* (network error, temporary server issue) and should be re-attempted. WorkManager then re-runs it according to the request's *backoff policy* (exponential or linear, with a delay). Return `Result.failure()` for permanent failures (won't retry) and `Result.success()` when done. Retry is how WorkManager handles transient failures reliably.",
      },
      {
        t: "list",
        items: [
          "**`Result.retry()`** — transient failure; re-run per backoff.",
          "**`Result.failure()`** — permanent; won't retry.",
          "**`Result.success()`** — done.",
          "**Backoff policy** — controls the retry delay/growth.",
        ],
      },
      {
        t: "note",
        text: "Return Result.retry() for transient failures (network/temporary) — WorkManager re-runs per the backoff policy (exponential/linear). Result.failure() = permanent (no retry); Result.success() = done. Retry + backoff is how WorkManager reliably handles transient failures.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test a Worker?",
    a: [
      {
        t: "p",
        text: "Use `TestListenableWorkerBuilder`/`TestWorkerBuilder` to construct a Worker with test input data and run its `doWork()` directly, asserting the `Result`. For integration testing scheduling/constraints, use `WorkManagerTestInitHelper` with a `SynchronousExecutor` to drive work synchronously and manipulate constraints/delays via the test driver. This tests both the work logic and the scheduling behavior.",
      },
      {
        t: "code",
        title: "Testing a Worker",
        code: `val worker = TestListenableWorkerBuilder<UploadWorker>(context)
    .setInputData(workDataOf("id" to "1")).build()
val result = worker.doWork()   // (or startWork() for ListenableWorker)
assertEquals(Result.success(), result)`,
      },
      {
        t: "list",
        items: [
          "**`TestListenableWorkerBuilder`** — build + run `doWork()` directly.",
          "**Assert `Result`** — success/retry/failure.",
          "**`WorkManagerTestInitHelper`** — drive scheduling synchronously.",
          "**Test driver** — manipulate constraints/delays.",
        ],
      },
      {
        t: "note",
        text: "Test Workers with TestListenableWorkerBuilder/TestWorkerBuilder (build with input data, run doWork() directly, assert Result). For scheduling/constraints, use WorkManagerTestInitHelper with a SynchronousExecutor and its test driver to satisfy constraints/delays. Tests both work logic and scheduling.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between WorkManager and a plain coroutine or service?",
    a: [
      {
        t: "p",
        text: "A *coroutine* (in `viewModelScope`/a scope) runs while the process/scope lives — it's for *in-app, immediate* work tied to the UI. A *foreground service* runs user-visible ongoing work now. *WorkManager* is for *deferrable, guaranteed* background work that must survive app kill/reboot (sync, upload). Use a coroutine for immediate UI-scoped work; WorkManager when the work must complete eventually regardless of app state.",
      },
      {
        t: "table",
        headers: ["", "Coroutine", "Foreground service", "WorkManager"],
        rows: [
          ["When", "immediate, in-app", "immediate, visible", "deferrable"],
          ["Survives kill/reboot", "no", "no", "yes"],
          ["Use", "UI-scoped work", "playback/nav", "sync/upload"],
        ],
      },
      {
        t: "list",
        items: [
          "**Coroutine** — immediate UI-scoped work; dies with the scope.",
          "**Foreground service** — immediate user-visible work.",
          "**WorkManager** — deferrable, guaranteed; survives kill/reboot.",
          "**Choose** — by immediacy, visibility, and durability.",
        ],
      },
      {
        t: "note",
        text: "Coroutine: immediate in-app UI-scoped work (dies with the scope). Foreground service: immediate user-visible work. WorkManager: deferrable, guaranteed work surviving kill/reboot (sync/upload). Use a coroutine for immediate UI work, WorkManager when it must complete eventually regardless of app state.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you inject dependencies into a Worker?",
    a: [
      {
        t: "p",
        text: "Use `@HiltWorker` with an `@AssistedInject` constructor: `Context` and `WorkerParameters` are `@Assisted` (WorkManager provides them), and your dependencies (repository, etc.) are injected by Hilt. Configure `HiltWorkerFactory` in the Application's `Configuration.Provider` (and disable WorkManager's default initializer). Without Hilt, you'd use a custom `WorkerFactory`.",
      },
      {
        t: "code",
        title: "@HiltWorker",
        code: `@HiltWorker
class SyncWorker @AssistedInject constructor(
    @Assisted ctx: Context, @Assisted params: WorkerParameters,
    private val repo: Repository,
) : CoroutineWorker(ctx, params)`,
      },
      {
        t: "list",
        items: [
          "**`@HiltWorker` + `@AssistedInject`** — Hilt injects the Worker.",
          "**`@Assisted`** — Context/WorkerParameters from WorkManager.",
          "**`HiltWorkerFactory`** — in `Configuration.Provider`.",
          "**Without Hilt** — a custom `WorkerFactory`.",
        ],
      },
      {
        t: "note",
        text: "Inject into a Worker with @HiltWorker + @AssistedInject (Context/WorkerParameters @Assisted from WorkManager, your deps injected by Hilt); configure HiltWorkerFactory in the Application's Configuration.Provider (disable the default initializer). Without Hilt, use a custom WorkerFactory.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are work tags, and how do you use them?",
    a: [
      {
        t: "p",
        text: "A *tag* is a string label you attach to a `WorkRequest` (`addTag(\"upload\")`) to group and reference related work. You can then observe all work with a tag (`getWorkInfosByTag`), cancel by tag (`cancelAllWorkByTag`), or query status. Multiple requests can share a tag, and a request can have multiple tags — useful for managing categories of background work.",
      },
      {
        t: "list",
        items: [
          "**`addTag(\"...\")`** — label a request.",
          "**Group work** — many requests can share a tag.",
          "**Query/cancel by tag** — `getWorkInfosByTag`/`cancelAllWorkByTag`.",
          "**Multiple tags** — a request can have several.",
        ],
      },
      {
        t: "note",
        text: "A tag (addTag(\"upload\")) labels a WorkRequest to group/reference related work — observe by tag (getWorkInfosByTag), cancel by tag (cancelAllWorkByTag), or query status. Requests can share tags and have multiple — useful for managing categories of background work.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the flex interval in periodic work?",
    a: [
      {
        t: "p",
        text: "A `PeriodicWorkRequest` runs once per interval (min 15 min), but the *flex interval* defines a window at the *end* of each period during which the work can run (rather than at an exact point) — giving the system flexibility to batch it for battery efficiency. So the work runs sometime in the flex window near the end of each interval, not at a precise time.",
      },
      {
        t: "code",
        title: "Flex interval",
        code: `PeriodicWorkRequestBuilder<SyncWorker>(
    repeatInterval = 1, repeatIntervalTimeUnit = TimeUnit.HOURS,
    flexTimeInterval = 15, flexTimeIntervalUnit = TimeUnit.MINUTES,   // last 15 min window
).build()`,
      },
      {
        t: "list",
        items: [
          "**Interval** — how often (min 15 min).",
          "**Flex interval** — a window at the period's end to run in.",
          "**Battery** — lets the system batch the work.",
          "**Not exact** — runs sometime in the flex window.",
        ],
      },
      {
        t: "note",
        text: "A PeriodicWorkRequest runs once per interval (≥15 min); the flex interval is a window at the END of each period during which it may run — giving the system flexibility to batch for battery. So work runs sometime in the flex window, not at a precise time.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is onStopped, and how do you handle Worker cancellation?",
    a: [
      {
        t: "p",
        text: "When work is cancelled or preempted (constraints no longer met, cancelled, or the system needs to stop it), WorkManager signals the Worker — `onStopped()` is called and `isStopped` becomes true; in a `CoroutineWorker`, the coroutine is *cancelled*. You should stop work cooperatively (check `isStopped`/handle `CancellationException`), release resources, and not leave partial state. Stopped work is typically re-run later.",
      },
      {
        t: "list",
        items: [
          "**`onStopped()`/`isStopped`** — signaled on cancellation/preemption.",
          "**`CoroutineWorker`** — the coroutine is cancelled.",
          "**Cooperative stop** — check `isStopped`/handle cancellation.",
          "**Clean up** — release resources; avoid partial state.",
        ],
      },
      {
        t: "note",
        text: "When cancelled/preempted (constraints lost, cancelled, system stop), WorkManager signals the Worker — onStopped()/isStopped, and a CoroutineWorker's coroutine is cancelled. Stop cooperatively (check isStopped/handle CancellationException), release resources, avoid partial state. Stopped work is usually re-run later.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the guarantee model of WorkManager (deferrable but guaranteed)?",
    a: [
      {
        t: "p",
        text: "WorkManager guarantees your work *will run* (eventually), even across app kills and reboots — but it does *not* guarantee *when* (it's *deferrable*, subject to constraints, Doze, and batching). So it's perfect for work that *must complete* but *doesn't need to run immediately or at an exact time* (syncing, uploading, cleanup). For 'must run now', use a foreground service; for exact time, AlarmManager.",
      },
      {
        t: "list",
        items: [
          "**Guaranteed** — runs eventually, survives kill/reboot.",
          "**Deferrable** — timing not guaranteed (constraints/Doze/batching).",
          "**Perfect for** — must-complete but not-urgent work.",
          "**Not for** — immediate (foreground service) or exact-time (AlarmManager).",
        ],
      },
      {
        t: "note",
        text: "WorkManager guarantees work WILL run eventually (surviving kill/reboot) but NOT WHEN (deferrable — constraints/Doze/batching). Ideal for must-complete-but-not-urgent work (sync/upload/cleanup). Use a foreground service for 'run now', AlarmManager for exact time.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you set constraints so work runs only under certain conditions?",
    a: [
      {
        t: "p",
        text: "Attach a `Constraints` object to the request — WorkManager waits until *all* constraints are met before running. Common constraints: `setRequiredNetworkType` (connected/unmetered), `setRequiresCharging`, `setRequiresBatteryNotLow`, `setRequiresDeviceIdle`, `setRequiresStorageNotLow`. This ensures work runs only when appropriate (e.g. upload photos only on unmetered Wi-Fi while charging).",
      },
      {
        t: "code",
        title: "Constraints",
        code: `val constraints = Constraints.Builder()
    .setRequiredNetworkType(NetworkType.UNMETERED)
    .setRequiresCharging(true)
    .build()
OneTimeWorkRequestBuilder<Worker>().setConstraints(constraints).build()`,
      },
      {
        t: "list",
        items: [
          "**`Constraints`** — conditions that must all be met.",
          "**Network** — connected/unmetered.",
          "**Charging/battery/storage/idle** — device conditions.",
          "**Waits** — WorkManager defers until satisfied.",
        ],
      },
      {
        t: "note",
        text: "Attach Constraints — WorkManager waits until ALL are met: network (connected/unmetered), charging, battery-not-low, device-idle, storage-not-low. Ensures work runs only when appropriate (upload only on unmetered Wi-Fi while charging). WorkManager defers the work until satisfied.",
      },
    ],
  },
  {
    level: "senior",
    q: "What happens to WorkManager work when the user force-stops the app?",
    a: [
      {
        t: "p",
        text: "If the *user* force-stops the app (from Settings), Android puts the app in a *stopped state* — its scheduled work (and alarms, jobs) are *cancelled* and won't run until the user launches the app again. This is a deliberate OS behavior (force-stop means 'stop everything'). So force-stopped is different from a normal process kill (where WorkManager reschedules) — the user explicitly halted the app.",
      },
      {
        t: "list",
        items: [
          "**Force-stop** — user-initiated; app enters a stopped state.",
          "**Work cancelled** — won't run until the app is relaunched.",
          "**Different from process kill** — normal kills reschedule.",
          "**Deliberate** — force-stop means 'stop everything'.",
        ],
      },
      {
        t: "note",
        text: "User force-stop (from Settings) puts the app in a stopped state — scheduled work/alarms/jobs are cancelled and won't run until the user relaunches the app. This differs from a normal process kill (where WorkManager reschedules) — force-stop is a deliberate user 'stop everything'.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you make a Worker's work main-safe and cancellable?",
    a: [
      {
        t: "p",
        text: "In a `CoroutineWorker`, `doWork()` runs on `Dispatchers.Default` by default — do blocking I/O with `withContext(Dispatchers.IO)` (main-safe), and respect cancellation (coroutine cancellation on stop propagates, so cooperative suspend calls stop cleanly). Override `getForegroundInfo` for long-running work. Avoid blocking without a dispatcher switch, and check for cancellation in long loops.",
      },
      {
        t: "list",
        items: [
          "**`CoroutineWorker`** — `doWork()` on `Dispatchers.Default`.",
          "**`withContext(IO)`** — for blocking I/O (main-safe).",
          "**Cancellation** — coroutine cancellation on stop; use suspend calls.",
          "**Long loops** — check `isStopped`/`ensureActive`.",
        ],
      },
      {
        t: "note",
        text: "In CoroutineWorker, doWork() runs on Dispatchers.Default — use withContext(Dispatchers.IO) for blocking I/O (main-safe). Coroutine cancellation on stop propagates, so cooperative suspend calls stop cleanly; check isStopped/ensureActive in long loops. Override getForegroundInfo for long-running work.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you throttle or debounce background work enqueues?",
    a: [
      {
        t: "p",
        text: "To avoid enqueueing the same work repeatedly (e.g. a sync triggered by many events), use `enqueueUniqueWork` with `ExistingWorkPolicy.KEEP` (ignore new requests while one is pending) — deduplicating. For periodic syncing, a `PeriodicWorkRequest` with `KEEP` avoids duplicates. Combine with constraints and backoff so the system batches efficiently rather than running on every trigger.",
      },
      {
        t: "list",
        items: [
          "**`enqueueUniqueWork` + `KEEP`** — dedupe; ignore new while pending.",
          "**`REPLACE`** — cancel and re-enqueue (latest wins) if needed.",
          "**Periodic + `KEEP`** — avoid duplicate periodic work.",
          "**Constraints/backoff** — let the system batch efficiently.",
        ],
      },
      {
        t: "note",
        text: "Dedupe/throttle with enqueueUniqueWork + ExistingWorkPolicy.KEEP (ignore new requests while one is pending) — or REPLACE for latest-wins. Periodic work with KEEP avoids duplicates. Combine with constraints/backoff so the system batches efficiently rather than running on every trigger.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you report progress from a long-running Worker?",
    a: [
      {
        t: "p",
        text: "Call `setProgress(workDataOf(\"percent\" to n))` inside `doWork()` to publish intermediate progress; observers reading `WorkInfo.progress` see it and can update a progress bar. For a `CoroutineWorker`, `setProgress` is a suspend function. Progress is cleared when the work completes. This lets the UI reflect an upload/download's advancement.",
      },
      {
        t: "code",
        title: "setProgress",
        code: `override suspend fun doWork(): Result {
    for (i in 0..100 step 10) { setProgress(workDataOf("percent" to i)); upload(i) }
    return Result.success()
}`,
      },
      {
        t: "list",
        items: [
          "**`setProgress(data)`** — publish intermediate progress.",
          "**`WorkInfo.progress`** — observers read it.",
          "**Cleared on completion** — progress resets.",
          "**Uses** — upload/download progress bars.",
        ],
      },
      {
        t: "note",
        text: "Call setProgress(workDataOf(\"percent\" to n)) in doWork() (suspend in CoroutineWorker) to publish intermediate progress; observers read WorkInfo.progress to update a progress bar. Progress clears on completion. For upload/download advancement in the UI.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does WorkManager interact with app updates?",
    a: [
      {
        t: "p",
        text: "When the app is *updated* (a new APK installed over the old), Android sends `MY_PACKAGE_REPLACED` and WorkManager *reschedules* its persisted work — so enqueued work survives an update (it's stored in the Room DB). A normal app update doesn't put the app in the stopped state (unlike force-stop), so scheduled work continues. This is part of WorkManager's durability guarantee.",
      },
      {
        t: "list",
        items: [
          "**Update survives** — work persisted in Room is rescheduled.",
          "**`MY_PACKAGE_REPLACED`** — triggers rescheduling.",
          "**Not stopped state** — unlike force-stop.",
          "**Durability** — enqueued work continues across updates.",
        ],
      },
      {
        t: "note",
        text: "On app update, Android sends MY_PACKAGE_REPLACED and WorkManager reschedules its persisted (Room-stored) work — so enqueued work survives an update. A normal update doesn't enter the stopped state (unlike force-stop), so scheduled work continues. Part of WorkManager's durability guarantee.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you initialize WorkManager, and what is on-demand initialization?",
    a: [
      {
        t: "p",
        text: "By default WorkManager auto-initializes via a `ContentProvider` at app startup. For custom configuration (a custom `WorkerFactory` for Hilt, a custom executor, logging level), you disable the default initializer in the manifest and have your `Application` implement `Configuration.Provider` — WorkManager then initializes *on demand* with your config the first time it's used. This is required for `@HiltWorker` injection.",
      },
      {
        t: "code",
        title: "Custom config",
        code: `@HiltAndroidApp
class MyApp : Application(), Configuration.Provider {
    @Inject lateinit var workerFactory: HiltWorkerFactory
    override val workManagerConfiguration get() =
        Configuration.Builder().setWorkerFactory(workerFactory).build()
}`,
      },
      {
        t: "list",
        items: [
          "**Default** — auto-init via a ContentProvider.",
          "**Custom** — disable default init + `Configuration.Provider`.",
          "**On-demand** — WorkManager inits with your config on first use.",
          "**Required for** — `@HiltWorker` (custom WorkerFactory).",
        ],
      },
      {
        t: "note",
        text: "WorkManager auto-initializes via a ContentProvider by default. For custom config (HiltWorkerFactory, custom executor, logging), disable the default initializer in the manifest and implement Configuration.Provider in the Application — WorkManager initializes on-demand with your config. Required for @HiltWorker injection.",
      },
    ],
  },
];

export default qa;
