// Threading, Handler/Looper & Permissions — Interview Prep tab. Teaching-first.

const qa = [
  {
    level: "junior",
    q: "Why can't you update the UI from a background thread?",
    a: [
      {
        t: "p",
        text: "**Because Android's UI toolkit is single-threaded — all UI updates must happen on the main (UI) thread.** Touching a View from any other thread throws `CalledFromWrongThreadException`. The reason is a deliberate design choice: making the entire UI toolkit thread-safe would require locking on every view operation, which would be slow and prone to deadlocks. Instead, Android confines all UI work to one thread, which is simpler and faster — at the cost of you having to manage the boundary between background work and UI updates.",
      },
      {
        t: "p",
        text: "So the pattern is always: do heavy work (network, disk, computation) on a *background* thread, then *deliver the result to the main thread* to update the UI. The flip side is equally important — you must *not block* the main thread either, because it's responsible for rendering and input; blocking it freezes the UI and causes an ANR after ~5 seconds. Coroutines make crossing this boundary clean: `withContext(Dispatchers.IO) { work() }` runs off-main and automatically resumes on Main to update the UI. Underneath, this uses the Handler/Looper machinery to post the result back to the main thread.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are Handler, Looper, and MessageQueue?",
    a: [
      {
        t: "p",
        text: "**Together they're the machinery that makes a thread able to process a stream of work — and it's what the main thread is built on.** The main thread isn't special magic; it's a normal thread running an infinite message loop made of these three pieces:",
      },
      {
        t: "list",
        items: [
          "**`Looper`** — runs an infinite loop that pulls messages off a queue one at a time and dispatches them. The main thread has one set up automatically (`Looper.getMainLooper()`); regular background threads don't.",
          "**`MessageQueue`** — the queue of pending work (`Message`s / `Runnable`s), ordered by time, that the Looper pulls from.",
          "**`Handler`** — bound to a specific Looper; you use it to *post* work onto that thread's queue (`handler.post { }`, `postDelayed`). A Handler tied to the main Looper is how a background thread hands a result to the main thread.",
        ],
      },
      {
        t: "code",
        title: "Delivering a result to the main thread",
        code: `val main = Handler(Looper.getMainLooper())
thread {
    val result = heavyWork()
    main.post { textView.text = result }   // runs on the main thread
}`,
      },
      {
        t: "p",
        text: "The model: the main thread loops forever, processing queued messages (input events, UI updates, posted Runnables) sequentially. This is why UI work is serialized, and why a single long operation on the main thread stalls everything behind it (jank/ANR) — the loop can't advance until each message finishes. Higher-level tools all sit on this: `Dispatchers.Main`, `runOnUiThread`, `View.post`, and LiveData delivery all ultimately post to the main Looper via a Handler. Coroutines are the modern abstraction, but Handler/Looper is the foundation.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between normal and dangerous (runtime) permissions?",
    a: [
      {
        t: "p",
        text: "**They differ by risk level and how they're granted.** *Normal* permissions are low-risk (internet access, vibrate, set an alarm) — you declare them in the manifest and the system grants them *automatically at install* with no user prompt. *Dangerous* (runtime) permissions guard sensitive user data or capabilities (location, camera, contacts, microphone, storage) — you declare them in the manifest *and* must request them *at runtime*, where the user sees a system dialog and explicitly grants or denies.",
      },
      {
        t: "list",
        items: [
          "**Normal** — internet, network state, vibrate, bluetooth (basic). Granted at install, no runtime code needed.",
          "**Dangerous** — anything touching private data or hardware that could harm privacy: fine/coarse location, camera, microphone, contacts, calendar, SMS, media/storage. Must be requested at runtime (since Android 6 Marshmallow; before that all permissions were install-time).",
          "**Special** — a few high-risk ones (draw over other apps, modify system settings, exact alarms, all-files access) require the user to enable them in a dedicated Settings screen rather than a simple dialog.",
        ],
      },
      {
        t: "p",
        text: "The runtime model exists so users control access to sensitive data *contextually* — they can grant camera access to a camera app but deny it to a game, and revoke it later. As an app developer this means you must *check* whether you have a dangerous permission before using the feature, *request* it if not (ideally with a rationale explaining why), and *handle denial gracefully* — never assume you have it.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you request a runtime permission in a modern Android app?",
    a: [
      {
        t: "p",
        text: "**You use the Activity Result API (`registerForActivityResult`) with a permission contract, following a check → rationale → request → handle-result flow.** This is the modern replacement for the old, verbose `onRequestPermissionsResult` callback.",
      },
      {
        t: "code",
        title: "The pattern",
        code: `val launcher = registerForActivityResult(
    ActivityResultContracts.RequestPermission()
) { granted -> if (granted) useFeature() else showDenied() }

when {
    checkSelfPermission(CAMERA) == PERMISSION_GRANTED -> useFeature()
    shouldShowRequestPermissionRationale(CAMERA) -> showRationale()  // then launch
    else -> launcher.launch(CAMERA)
}`,
      },
      {
        t: "list",
        items: [
          "**Check first**: `checkSelfPermission` — if already granted, just use the feature; don't re-ask.",
          "**Show rationale when appropriate**: `shouldShowRequestPermissionRationale` returns true if the user previously denied (but not permanently) — explain *why* you need it before re-requesting, which improves grant rates.",
          "**Request via the launcher**: `launcher.launch(permission)` shows the system dialog; the result callback tells you granted or denied.",
          "**Handle all outcomes**: granted, denied, or denied-permanently ('don't ask again'). After a permanent denial the dialog won't show again, so you guide the user to app Settings. Design the feature to degrade gracefully if denied — never assume you'll get it.",
        ],
      },
      {
        t: "p",
        text: "Best practice: request permissions *in context* — right when the feature needs it, not all at launch — and only ask for what you truly need. Modern Android also has finer-grained permissions (coarse vs fine location, background location as a separate grant, granular media permissions on Android 13+, and a runtime `POST_NOTIFICATIONS` permission), so request the *least* powerful permission that satisfies the feature.",
      },
    ],
  },
  {
    level: "senior",
    q: "Why was AsyncTask deprecated, and how do coroutines solve its problems?",
    a: [
      {
        t: "p",
        text: "**`AsyncTask` was the old API for running background work with UI callbacks (`doInBackground` on a background thread, `onPostExecute` on the main thread). It was deprecated because it had several serious, structural problems that made it a frequent source of bugs — problems coroutines solve by design.**",
      },
      {
        t: "list",
        items: [
          "**Memory leaks**: AsyncTasks were often inner classes holding an implicit reference to the Activity. If the Activity was destroyed (rotation!) while the task was still running, the task kept the Activity alive — a leak — and then tried to update a destroyed UI. Coroutines tied to a lifecycle scope (`viewModelScope`, `lifecycleScope`) are *cancelled* when the scope dies, so they don't leak or update dead UI.",
          "**Lifecycle-blindness**: AsyncTask had no awareness of the Activity/Fragment lifecycle — it just ran to completion regardless, causing crashes when `onPostExecute` touched a gone Activity. Coroutine scopes are lifecycle-aware, so work is cancelled at the right time automatically.",
          "**No structured concurrency / poor cancellation**: cancelling an AsyncTask was cooperative and awkward, and there was no clean way to compose multiple tasks or propagate errors. Coroutines have structured concurrency — a parent-child tree with proper cancellation and error propagation.",
          "**Threading pitfalls & serial executor confusion**: AsyncTasks shared a single serial executor by default (so parallel tasks unexpectedly queued), and configuring parallelism was error-prone. Coroutines make threading explicit and correct via dispatchers.",
          "**Verbose, callback-based, hard to read**: nested AsyncTasks (task after task) became callback hell. Coroutines let you write sequential-looking async code (`val a = fetchA(); val b = fetchB(a)`), far more readable.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: AsyncTask's failures all trace to the same root — it treated background work as *unstructured* and *lifecycle-unaware*, so the developer had to manually manage leaks, cancellation, and threading, and usually got at least one wrong. Coroutines invert this: work is *structured* (bound to a scope with automatic cancellation), *lifecycle-aware* (via `viewModelScope`/`lifecycleScope`), *cancellation-cooperative* by default, and *readable* (sequential style). That's why the entire ecosystem moved to coroutines, and why AsyncTask, Loaders, and IntentService were all deprecated in favor of coroutines + WorkManager.",
      },
    ],
  },
  {
    level: "senior",
    q: "What happens if you block the main thread's Looper, and how does this connect to jank and ANRs?",
    a: [
      {
        t: "p",
        text: "**The main thread runs a single `Looper` that processes messages from its `MessageQueue` one at a time, sequentially. If you block the processing of any one message with a long operation, the loop cannot advance to the next message — so every queued UI update, input event, and animation frame behind it is stalled.** This is the mechanical root of both jank and ANRs.",
      },
      {
        t: "list",
        items: [
          "**How rendering works via the Looper**: the system schedules a 'draw' message roughly every 16ms (at 60Hz) via the Choreographer, which posts frame callbacks to the main thread's queue. For smooth UI, each frame's work (measure, layout, draw, plus any of your main-thread code) must complete within that ~16ms budget so the next frame's draw message can be processed on time.",
          "**Jank** happens when a message takes *longer than the frame budget* — say your `onBindViewHolder` or a recomposition does 30ms of work. The draw message for that frame is delayed, the frame is dropped, and the user sees a stutter. It's not a crash, just a missed frame, but repeated jank feels broken.",
          "**ANR** happens when a message blocks the loop for *seconds* — a synchronous network call or a huge database query on the main thread holds the loop, so input events (taps) sit unprocessed in the queue. After ~5 seconds of unresponsiveness to input, the system shows the 'Application Not Responding' dialog. Same mechanism as jank, just a much longer block.",
          "**Why it's all one problem**: jank and ANR are the *same* phenomenon — the Looper being unable to process pending messages promptly — at different severities. A 20ms block drops a frame; a 5s block triggers an ANR.",
        ],
      },
      {
        t: "p",
        text: "**The fix and the framing**: keep every unit of main-thread work *short*. Move anything slow (I/O, computation, large queries) off the main thread with coroutines/dispatchers, so the main thread's Looper only ever handles quick UI operations and can keep processing frames and input on time. This is *why* 'never block the main thread' is drilled so hard — it's not an abstract rule, it's about keeping the message loop flowing so frames render and taps respond. Understanding that jank and ANR are the same Looper-starvation problem at different timescales is the senior-level insight; it also tells you how to *diagnose* them (find the long-running main-thread message via Perfetto/systrace).",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the main thread, and what runs on it?",
    a: [
      {
        t: "p",
        text: "The main thread (a.k.a. the UI thread) is where Android runs your app's UI rendering, lifecycle callbacks, input event handling, and the message loop (`Looper`). Because it's single-threaded and drives the UI, any slow work on it freezes the app. All UI updates *must* happen here; all heavy work must happen *off* it.",
      },
      {
        t: "list",
        items: [
          "**UI + lifecycle + input** — all run on the main thread.",
          "**`Looper`/message queue** — the main thread processes messages continuously.",
          "**Single-threaded** — slow work blocks rendering (jank/ANR).",
          "**Rule** — UI only on main; heavy work off main (coroutines).",
        ],
      },
      {
        t: "note",
        text: "The main (UI) thread runs UI rendering, lifecycle callbacks, input handling, and the Looper message loop. It's single-threaded, so slow work freezes the UI (jank/ANR). All UI updates must happen here; all heavy/blocking work must go off it (coroutines/executors).",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between synchronized, @Volatile, and atomic types?",
    a: [
      {
        t: "p",
        text: "These solve different aspects of thread safety. `synchronized` provides *mutual exclusion* (a lock) around a block/method so only one thread runs it at a time. `@Volatile` guarantees *visibility* (writes are seen by other threads immediately) but not atomicity. Atomic types (`AtomicInteger`, `AtomicReference`) provide *lock-free atomic operations* (compare-and-set) for single variables.",
      },
      {
        t: "code",
        title: "Three tools",
        code: `@Synchronized fun update() { shared++ }         // mutual exclusion (lock)
@Volatile var running = true                     // visibility only (flag)
val counter = AtomicInteger(0); counter.incrementAndGet()   // atomic single-var op`,
      },
      {
        t: "list",
        items: [
          "**`synchronized`** — mutual exclusion; for compound critical sections.",
          "**`@Volatile`** — visibility only; for a simple flag (not `count++`).",
          "**Atomics** — lock-free atomic ops on one variable (counters, CAS).",
          "**Coroutines** — prefer `Mutex`/immutable state + `StateFlow.update` in coroutine code.",
        ],
      },
      {
        t: "note",
        text: "synchronized = mutual exclusion (lock, compound sections); @Volatile = visibility only (a flag — count++ is still a race); atomics (AtomicInteger/Reference) = lock-free atomic ops on one variable (CAS). In coroutine code prefer Mutex or immutable state + StateFlow.update over these Java primitives.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the POST_NOTIFICATIONS runtime permission (API 33+)?",
    a: [
      {
        t: "p",
        text: "On Android 13 (API 33), posting notifications requires the `POST_NOTIFICATIONS` *runtime* permission — declare it and request it from the user (previously notifications needed no permission). Without it, your notifications are silently *not shown*. Request in context (when the user enables a notifying feature) and handle denial gracefully.",
      },
      {
        t: "code",
        title: "Notification permission",
        code: `<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
if (Build.VERSION.SDK_INT >= 33) launcher.launch(Manifest.permission.POST_NOTIFICATIONS)`,
      },
      {
        t: "list",
        items: [
          "**API 33+ runtime permission** — notifications now require user grant.",
          "**Silently dropped** — without it, notifications don't appear.",
          "**Request in context** — when enabling a notifying feature.",
          "**Below 33** — implicitly granted (declare it; no prompt).",
        ],
      },
      {
        t: "note",
        text: "Android 13 (API 33) made POST_NOTIFICATIONS a runtime permission — declare and request it, or notifications are silently dropped (before 33, none needed). Request in context; handle denial gracefully. On <33 it's implicitly granted.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is permission auto-reset for unused apps?",
    a: [
      {
        t: "p",
        text: "Android automatically *revokes* runtime permissions from apps the user hasn't opened in a few months (auto-reset, Android 11+, Play-backported). So a permission you were granted may be *gone* when the user returns — always re-check permissions (never cache 'granted' permanently) and re-request if needed.",
      },
      {
        t: "list",
        items: [
          "**Auto-reset** — unused apps lose runtime permissions after months.",
          "**Re-check every time** — don't assume a past grant still holds.",
          "**Re-request** — as normal if revoked.",
          "**`isAutoRevokeWhitelisted`** — check/prompt to exempt only if justified.",
        ],
      },
      {
        t: "note",
        text: "Android auto-resets (revokes) runtime permissions for apps unused for months (API 11+, Play-backported) — so always re-check permissions each time (never cache 'granted' permanently) and re-request if revoked. Prompt to disable auto-reset only if genuinely justified.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle 'don't ask again' / permanently denied permissions?",
    a: [
      {
        t: "p",
        text: "When a user denies a permission and checks 'don't ask again' (or denies twice on modern Android), the system won't show the dialog again — `shouldShowRequestPermissionRationale` returns `false` *and* it's not granted. Detect this state and direct the user to *App Settings* (via an intent to `ACTION_APPLICATION_DETAILS_SETTINGS`) to grant it manually, with an explanation of why it's needed.",
      },
      {
        t: "code",
        title: "Send to settings",
        code: `if (!granted && !shouldShowRequestPermissionRationale(permission)) {
    // permanently denied -> guide to settings
    startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
        Uri.fromParts("package", packageName, null)))
}`,
      },
      {
        t: "list",
        items: [
          "**Permanently denied** — not granted AND `shouldShowRationale` false.",
          "**Can't re-prompt** — the system won't show the dialog.",
          "**Guide to settings** — `ACTION_APPLICATION_DETAILS_SETTINGS` with rationale.",
          "**Degrade gracefully** — offer reduced functionality if they decline.",
        ],
      },
      {
        t: "note",
        text: "Permanently denied = not granted AND shouldShowRequestPermissionRationale returns false — the system won't re-prompt. Detect it and send the user to App Settings (ACTION_APPLICATION_DETAILS_SETTINGS) with an explanation. Degrade gracefully if they still decline.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do location permissions work (foreground, background, coarse/fine)?",
    a: [
      {
        t: "p",
        text: "Location is tiered: `ACCESS_COARSE_LOCATION` (approximate) and `ACCESS_FINE_LOCATION` (precise) are foreground permissions requested together (users can grant only coarse on Android 12+). `ACCESS_BACKGROUND_LOCATION` is a *separate* request that must come *after* foreground is granted, and routes through settings ('Allow all the time'). Request the minimum you need and only when needed.",
      },
      {
        t: "list",
        items: [
          "**Coarse vs fine** — approximate vs precise; users may grant only coarse (API 31+).",
          "**Foreground first** — request coarse/fine together while in use.",
          "**Background separately** — `ACCESS_BACKGROUND_LOCATION` after foreground, via settings.",
          "**Minimize** — request the least precision/scope needed, in context.",
        ],
      },
      {
        t: "note",
        text: "Location tiers: COARSE (approximate) + FINE (precise) requested together as foreground (users may grant only coarse on API 31+); BACKGROUND_LOCATION is a separate request AFTER foreground, routed through settings ('Allow all the time'). Request the minimum precision/scope, in context, and handle coarse-only grants.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the Choreographer, and how does it relate to jank?",
    a: [
      {
        t: "p",
        text: "The `Choreographer` coordinates the app's work with the display's *vsync* signal — it schedules input, animation, and draw callbacks to run once per frame (~16.6ms at 60Hz). If your main-thread work for a frame exceeds the budget, the frame is *dropped* (jank). Tools like `FrameMetrics` and the Choreographer's frame callbacks help measure per-frame timing.",
      },
      {
        t: "list",
        items: [
          "**Vsync-driven** — schedules per-frame input/animation/draw callbacks.",
          "**Frame budget** — ~16.6ms (60Hz), ~8.3ms (120Hz); exceed it = dropped frame (jank).",
          "**Measure** — `FrameMetrics`, JankStats, Perfetto per-frame timing.",
          "**Cause of jank** — heavy main-thread work stealing the frame budget.",
        ],
      },
      {
        t: "note",
        text: "The Choreographer syncs the app's input/animation/draw work to the display's vsync, once per frame (~16.6ms at 60Hz). Main-thread work exceeding the frame budget drops the frame (jank). Measure with FrameMetrics/JankStats/Perfetto. Jank = heavy main-thread work stealing the frame budget.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between blocking and suspending on Android?",
    a: [
      {
        t: "p",
        text: "A *blocking* call (`Thread.sleep`, synchronous network/disk) *occupies its thread* until it returns — on the main thread that freezes the UI; on a pool thread it ties up a worker. A *suspending* call (`delay`, a suspend network call) *releases the thread* while waiting, so the thread runs other work. Coroutines make waiting non-blocking, which is why they scale and keep the UI responsive.",
      },
      {
        t: "list",
        items: [
          "**Blocking** — holds the thread until done (freezes UI on main; ties up a worker).",
          "**Suspending** — frees the thread while waiting; resumes later.",
          "**`delay` vs `Thread.sleep`** — suspend vs block; use `delay` in coroutines.",
          "**Main-safety** — suspend functions offload blocking internally (withContext).",
        ],
      },
      {
        t: "note",
        text: "Blocking (Thread.sleep, sync I/O) holds its thread until done (freezes the UI on main, ties up a worker). Suspending (delay, suspend I/O) releases the thread while waiting and resumes later. Use delay over Thread.sleep in coroutines; suspend functions offload blocking work internally (main-safety).",
      },
    ],
  },
  {
    level: "junior",
    q: "What thread does UI work happen on, and how do you get back to it?",
    a: [
      {
        t: "p",
        text: "All UI updates must happen on the main thread — touching a View from a background thread throws `CalledFromWrongThreadException`. To get back to the main thread: with coroutines, `withContext(Dispatchers.Main)` (or just launch on `Dispatchers.Main`); with Views, `runOnUiThread { }`, `view.post { }`, or a main-thread `Handler`. With `StateFlow`/Compose, update state from any thread and let the UI collect on main.",
      },
      {
        t: "list",
        items: [
          "**UI on main only** — off-thread View access throws.",
          "**Coroutines** — `withContext(Dispatchers.Main)` / launch on Main.",
          "**Views** — `runOnUiThread`, `view.post`, main `Handler`.",
          "**StateFlow/Compose** — update state anywhere, collect on main.",
        ],
      },
      {
        t: "note",
        text: "UI updates must be on the main thread (off-thread View access throws CalledFromWrongThreadException). Get back via coroutines (withContext(Dispatchers.Main)), or Views (runOnUiThread/view.post/main Handler). With StateFlow/Compose, update state from any thread and let the UI collect on main.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between concurrency approaches: Thread, Executor, Coroutines?",
    a: [
      {
        t: "p",
        text: "Raw `Thread` is low-level (manual creation, no pooling, easy to leak). `ExecutorService`/`ThreadPoolExecutor` pool threads and queue tasks (better resource use, callbacks/Futures). *Coroutines* are the modern default: lightweight (multiplexed on a pool), structured (lifecycle-scoped cancellation), sequential-looking, with easy thread switching. Use coroutines for app code; executors when integrating Java libraries; raw threads almost never.",
      },
      {
        t: "table",
        headers: ["", "Thread", "Executor", "Coroutines"],
        rows: [
          ["Pooling", "no", "yes", "yes (dispatchers)"],
          ["Cancellation", "manual", "Future.cancel", "structured/automatic"],
          ["Style", "callbacks", "Futures/callbacks", "sequential"],
          ["Weight", "heavy", "medium", "light"],
        ],
      },
      {
        t: "list",
        items: [
          "**`Thread`** — low-level, no pooling; avoid directly.",
          "**`ExecutorService`** — pooled, queued; Java-friendly.",
          "**Coroutines** — lightweight, structured, sequential; the modern default.",
          "**Interop** — `Executor.asCoroutineDispatcher()` bridges them.",
        ],
      },
      {
        t: "note",
        text: "Thread: low-level, no pooling (avoid). Executor/ThreadPoolExecutor: pooled, queued, Java-friendly (Futures). Coroutines: lightweight (multiplexed), structured (lifecycle cancellation), sequential — the modern default for app code. Use executors for Java-library interop (Executor.asCoroutineDispatcher bridges), raw threads almost never.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you declare and check a permission in the manifest and code?",
    a: [
      {
        t: "p",
        text: "Declare every permission with `<uses-permission android:name=\"...\"/>` in the manifest (both install-time and runtime). For runtime permissions, also check at runtime with `ContextCompat.checkSelfPermission(context, permission) == PERMISSION_GRANTED` before using the protected API, and request it if not granted.",
      },
      {
        t: "code",
        title: "Declare + check",
        code: `<uses-permission android:name="android.permission.CAMERA" />
// In code:
if (ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA)
    == PackageManager.PERMISSION_GRANTED) { useCamera() }`,
      },
      {
        t: "list",
        items: [
          "**Manifest** — `<uses-permission>` for every permission.",
          "**`checkSelfPermission`** — runtime check before using the API.",
          "**Request if missing** — via the Activity Result API.",
          "**Handle revocation** — permissions can be revoked while the app runs.",
        ],
      },
      {
        t: "note",
        text: "Declare all permissions with <uses-permission> in the manifest. For runtime permissions, check ContextCompat.checkSelfPermission(...) == PERMISSION_GRANTED before using the protected API, and request via the Activity Result API if missing. Permissions can be revoked at runtime — always check, don't assume.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is scoped storage, and how did it change file access permissions?",
    a: [
      {
        t: "p",
        text: "Scoped storage (Android 10+) restricts broad file access: apps get their own sandboxed directory (no permission needed) and access to *media* via `MediaStore` (with granular media permissions on API 33+: `READ_MEDIA_IMAGES/VIDEO/AUDIO`), while `READ/WRITE_EXTERNAL_STORAGE` is largely deprecated. For arbitrary files, use the Storage Access Framework (user picks). The broad `MANAGE_EXTERNAL_STORAGE` is heavily restricted on Play.",
      },
      {
        t: "list",
        items: [
          "**App-specific storage** — no permission for your own sandboxed dir.",
          "**Media via `MediaStore`** — granular `READ_MEDIA_*` permissions (API 33+).",
          "**`READ/WRITE_EXTERNAL_STORAGE` deprecated** — broad access gone.",
          "**SAF for arbitrary files** — user picks; `MANAGE_EXTERNAL_STORAGE` Play-restricted.",
        ],
      },
      {
        t: "note",
        text: "Scoped storage (Android 10+): apps get a permission-free sandboxed dir and media via MediaStore (granular READ_MEDIA_IMAGES/VIDEO/AUDIO on API 33+); READ/WRITE_EXTERNAL_STORAGE is largely deprecated. Use SAF for arbitrary files (user picks). MANAGE_EXTERNAL_STORAGE (all files) is heavily Play-restricted.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are HandlerThread and the main-thread message barrier?",
    a: [
      {
        t: "p",
        text: "A `HandlerThread` is a thread with its own `Looper`, so you can post work to it via a `Handler` and it runs serially off the main thread — useful for a dedicated background worker with ordered execution (e.g. sensor/camera callbacks). It's a lower-level tool; coroutines with a single-threaded dispatcher usually replace it in modern code.",
      },
      {
        t: "list",
        items: [
          "**`HandlerThread`** — a background thread with a `Looper`; post via a `Handler`.",
          "**Serial execution** — ordered work off the main thread.",
          "**Uses** — dedicated worker for camera/sensor callbacks, ordered background tasks.",
          "**Modern** — a single-threaded coroutine dispatcher usually replaces it.",
        ],
      },
      {
        t: "note",
        text: "A HandlerThread is a background thread with its own Looper — post work via a Handler for serial off-main execution (dedicated worker for camera/sensor callbacks, ordered tasks). Lower-level; a single-threaded coroutine dispatcher (limitedParallelism(1)) usually replaces it in modern code.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between a permission group and an individual permission?",
    a: [
      {
        t: "p",
        text: "Dangerous permissions belong to *groups* (Location, Contacts, Camera, etc.). Historically, granting one permission in a group auto-granted others in it, but modern Android requires requesting each permission and shows per-permission dialogs. You still declare and request individual permissions (e.g. `ACCESS_FINE_LOCATION`), and the group mainly affects how the system presents them.",
      },
      {
        t: "list",
        items: [
          "**Permission groups** — Location, Contacts, Camera, Microphone, etc.",
          "**Request individual permissions** — declare/request each specific one.",
          "**Per-permission dialogs** — modern Android prompts individually.",
          "**Group context** — affects settings grouping and presentation.",
        ],
      },
      {
        t: "note",
        text: "Dangerous permissions belong to groups (Location/Contacts/Camera…). Modern Android requires requesting each individual permission (e.g. ACCESS_FINE_LOCATION) with per-permission dialogs; the group mainly affects how the system groups/presents them in settings. Don't assume one grant covers a group.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you switch threads with coroutines instead of Handlers?",
    a: [
      {
        t: "p",
        text: "Instead of posting between threads with `Handler`s, use `withContext(dispatcher)` to move a block of work: `withContext(Dispatchers.IO) { }` for blocking I/O, `Dispatchers.Default` for CPU work, and the coroutine automatically returns to its original (Main) dispatcher after. This replaces the error-prone Handler-posting pattern with clean sequential code.",
      },
      {
        t: "code",
        title: "withContext replaces Handler posting",
        code: `viewModelScope.launch {                     // Main
    val data = withContext(Dispatchers.IO) { loadFromDisk() }   // background
    render(data)                            // back on Main automatically
}`,
      },
      {
        t: "list",
        items: [
          "**`withContext(IO/Default)`** — move a block to a background dispatcher.",
          "**Auto-return** — resumes on the original dispatcher (Main) after.",
          "**No `Handler` juggling** — sequential, readable.",
          "**Main-safe repos** — push `withContext` into the data layer.",
        ],
      },
      {
        t: "note",
        text: "Use withContext(Dispatchers.IO/Default) to move a block off main; the coroutine auto-returns to its original (Main) dispatcher after — replacing Handler.post thread-switching with clean sequential code. Push withContext into main-safe repository functions so the ViewModel stays on Main.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a race condition, and how do you avoid it on Android?",
    a: [
      {
        t: "p",
        text: "A race condition happens when two threads access shared mutable state concurrently and the result depends on timing — causing lost updates or corruption (e.g. two threads incrementing a counter). Avoid it by: confining state to one thread (main thread / single dispatcher), using atomics (`AtomicInteger`) or a `Mutex` for critical sections, or — best — using immutable state updated atomically (`StateFlow.update`).",
      },
      {
        t: "list",
        items: [
          "**Race** — concurrent access to shared mutable state; timing-dependent bugs.",
          "**Confinement** — keep state on one thread (main / single dispatcher).",
          "**Atomics/Mutex** — for shared counters/critical sections.",
          "**Immutable + atomic update** — `StateFlow.update { it.copy() }` (preferred).",
        ],
      },
      {
        t: "note",
        text: "A race condition = concurrent access to shared mutable state with timing-dependent results (lost updates/corruption). Avoid via thread confinement (single thread/dispatcher), atomics (AtomicInteger)/Mutex for critical sections, or best: immutable state updated atomically (StateFlow.update { it.copy() }).",
      },
    ],
  },
  {
    level: "senior",
    q: "What special permissions require a settings-screen grant rather than a dialog?",
    a: [
      {
        t: "p",
        text: "Some high-impact permissions can't be granted via the normal dialog — the user must toggle them in a dedicated Settings screen. Examples: `SYSTEM_ALERT_WINDOW` (draw over other apps), `MANAGE_EXTERNAL_STORAGE` (all files access), `SCHEDULE_EXACT_ALARM` (exact alarms on API 31+), `POST_NOTIFICATIONS` is a normal runtime one but notification-listener access is special, and 'ignore battery optimizations'. You send the user there with a specific settings Intent.",
      },
      {
        t: "list",
        items: [
          "**`SYSTEM_ALERT_WINDOW`** — overlay; `ACTION_MANAGE_OVERLAY_PERMISSION`.",
          "**`MANAGE_EXTERNAL_STORAGE`** — all files; Play-restricted.",
          "**`SCHEDULE_EXACT_ALARM`** — exact alarms (API 31+).",
          "**Route via Intent** — a specific settings screen, not a runtime dialog.",
        ],
      },
      {
        t: "note",
        text: "Special/high-impact permissions use a Settings-screen toggle, not a dialog: SYSTEM_ALERT_WINDOW (overlay), MANAGE_EXTERNAL_STORAGE (all files, Play-restricted), SCHEDULE_EXACT_ALARM (API 31+), ignore-battery-optimizations. Route the user via a specific settings Intent (e.g. ACTION_MANAGE_OVERLAY_PERMISSION).",
      },
    ],
  },
  {
    level: "senior",
    q: "What is thread starvation, and how can coroutine dispatchers cause it?",
    a: [
      {
        t: "p",
        text: "Thread starvation is when work can't proceed because all threads in a pool are occupied (often blocked). It happens if you run *blocking* code on a dispatcher not meant for it — e.g. blocking I/O on `Dispatchers.Default` (few, core-count threads), so a burst of blocking calls exhausts them and other CPU work stalls. Fix by using `Dispatchers.IO` for blocking work (or `limitedParallelism`), and never blocking a scarce pool.",
      },
      {
        t: "list",
        items: [
          "**Starvation** — no free thread to run ready work.",
          "**Cause** — blocking calls on a small pool (`Default`) tie up its threads.",
          "**Fix** — blocking I/O on `Dispatchers.IO` (large pool); CPU on `Default`.",
          "**Bound** — `limitedParallelism` to cap concurrency for a resource.",
        ],
      },
      {
        t: "note",
        text: "Thread starvation = no free thread to run ready work, often because blocking calls occupy a small pool. Blocking I/O on Dispatchers.Default (core-count threads) can starve CPU work. Fix: run blocking work on Dispatchers.IO (large pool), CPU on Default; use limitedParallelism to bound a resource without starving.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you explain to the user why you need a permission (rationale)?",
    a: [
      {
        t: "p",
        text: "Show a *rationale* — a brief in-app explanation of *why* the feature needs the permission — *before* (or after a first denial of) the system dialog, gated by `shouldShowRequestPermissionRationale`. Request permissions *in context* (when the user triggers the feature), not upfront at launch, so the reason is obvious and grant rates are higher.",
      },
      {
        t: "list",
        items: [
          "**Rationale UI** — explain the benefit before the system prompt.",
          "**`shouldShowRequestPermissionRationale`** — true after a denial (or to preempt).",
          "**In-context requests** — ask when the feature is used, not at launch.",
          "**Graceful denial** — offer reduced functionality if declined.",
        ],
      },
      {
        t: "note",
        text: "Show a rationale (why the feature needs the permission) before/after-first-denial, gated by shouldShowRequestPermissionRationale, and request in context (when the user triggers the feature) — not upfront at launch. Contextual requests with clear rationale get higher grant rates; degrade gracefully on denial.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does structured concurrency prevent the leaks that plagued AsyncTask?",
    a: [
      {
        t: "p",
        text: "`AsyncTask` leaked because it wasn't tied to a lifecycle — an inner-class task held the Activity and kept running after it was destroyed. Structured concurrency fixes this: coroutines launched in `viewModelScope`/`lifecycleScope` are *owned* by that scope and *cancelled* when it ends, so the work stops and references are released. You can't accidentally leave orphaned work holding a dead screen.",
      },
      {
        t: "list",
        items: [
          "**AsyncTask leak** — inner class holding the Activity, no lifecycle cancellation.",
          "**Scoped coroutines** — owned by `viewModelScope`/`lifecycleScope`.",
          "**Auto-cancellation** — work stops when the scope ends; references freed.",
          "**No orphans** — structure prevents work outliving its owner.",
        ],
      },
      {
        t: "note",
        text: "AsyncTask leaked because it wasn't lifecycle-tied (inner class holding the Activity, running past destruction). Structured concurrency: coroutines in viewModelScope/lifecycleScope are owned by the scope and cancelled when it ends, so work stops and references are freed — no orphaned work holding a dead screen.",
      },
    ],
  },
  {
    level: "junior",
    q: "Which dispatcher should you use for network, database, and image processing?",
    a: [
      {
        t: "p",
        text: "Match the dispatcher to the workload: `Dispatchers.IO` for *waiting* work (network, disk, database reads) — it has many threads for concurrent blocking calls; `Dispatchers.Default` for *CPU-bound* work (image processing, JSON parsing, sorting) — sized to CPU cores; `Dispatchers.Main` only for UI updates. Room/Retrofit suspend functions are already main-safe, so you don't wrap those.",
      },
      {
        t: "table",
        headers: ["Work", "Dispatcher"],
        rows: [
          ["Network / disk / DB (waiting)", "IO"],
          ["Image/JSON/CPU computation", "Default"],
          ["UI updates", "Main"],
        ],
      },
      {
        t: "list",
        items: [
          "**`IO`** — waiting work (network/disk/DB); large pool.",
          "**`Default`** — CPU work (image/parse/sort); core-count pool.",
          "**`Main`** — UI only.",
          "**Don't wrap main-safe libs** — Room/Retrofit suspend functions already switch.",
        ],
      },
      {
        t: "note",
        text: "IO for waiting work (network/disk/DB — large pool), Default for CPU-bound work (image/JSON/sort — core-count pool), Main for UI. Room/Retrofit suspend functions are already main-safe (don't wrap them). Wrong dispatcher causes starvation/thrash.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test permission-gated flows?",
    a: [
      {
        t: "p",
        text: "Abstract permission checking behind an interface (e.g. `PermissionChecker`) that you can *fake* in tests — so unit/ViewModel tests don't touch the real permission system. For instrumented tests, use `GrantPermissionRule` to grant permissions automatically, or UIAutomator to interact with the system dialog. Testing through an abstraction keeps logic tests fast and deterministic.",
      },
      {
        t: "code",
        title: "Testable permission checking",
        code: `interface PermissionChecker { fun has(permission: String): Boolean }
// Test: FakePermissionChecker(granted = false) -> assert the 'request' path

// Instrumented:
@get:Rule val grant = GrantPermissionRule.grant(Manifest.permission.CAMERA)`,
      },
      {
        t: "list",
        items: [
          "**Abstract behind an interface** — fake it in unit/ViewModel tests.",
          "**`GrantPermissionRule`** — auto-grant for instrumented tests.",
          "**UIAutomator** — interact with the real system dialog if needed.",
          "**Deterministic** — the abstraction avoids depending on device state.",
        ],
      },
      {
        t: "note",
        text: "Abstract permission checks behind an interface (PermissionChecker) to fake in unit/ViewModel tests (assert request vs use paths). For instrumented tests, GrantPermissionRule auto-grants, or UIAutomator drives the system dialog. The abstraction keeps logic tests fast and deterministic.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are the camera and microphone privacy indicators (Android 12+)?",
    a: [
      {
        t: "p",
        text: "Android 12 added *privacy indicators* — a small dot in the status bar (green) that appears whenever an app is *actively using* the camera or microphone, plus toggles in Quick Settings to disable camera/mic access globally. This means users can see and cut off access in real time, so your app should only access these sensors while genuinely needed and handle the case where access is toggled off.",
      },
      {
        t: "list",
        items: [
          "**Indicator dot** — shows active camera/mic use.",
          "**Quick Settings toggles** — user can disable camera/mic globally.",
          "**Handle revocation** — access can be cut off mid-use.",
          "**Use minimally** — access sensors only when needed; release promptly.",
        ],
      },
      {
        t: "note",
        text: "Android 12+ privacy indicators show a status-bar dot when an app actively uses the camera/mic, plus Quick Settings toggles to disable them globally. Users see and can cut off access in real time — access these sensors only when needed, release promptly, and handle mid-use revocation gracefully.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle runtime permissions in a Compose screen?",
    a: [
      {
        t: "p",
        text: "Use `rememberLauncherForActivityResult(RequestPermission())` for the raw API, or Accompanist Permissions' `rememberPermissionState(permission)` / `rememberMultiplePermissionsState(...)` which expose the permission *status* (granted, denied, needs-rationale) as observable state you drive UI from. Request in response to a user action, show rationale, and route to settings if permanently denied.",
      },
      {
        t: "code",
        title: "Compose permission state",
        code: `val cameraState = rememberPermissionState(Manifest.permission.CAMERA)
when {
    cameraState.status.isGranted -> CameraUi()
    cameraState.status.shouldShowRationale -> RationaleUi { cameraState.launchPermissionRequest() }
    else -> Button(onClick = { cameraState.launchPermissionRequest() }) { Text("Enable camera") }
}`,
      },
      {
        t: "list",
        items: [
          "**`rememberLauncherForActivityResult`** — the raw Result API in Compose.",
          "**Accompanist `rememberPermissionState`** — status as observable state.",
          "**Branch on status** — granted / needs-rationale / denied.",
          "**Request on action** — plus rationale and settings-redirect for permanent denial.",
        ],
      },
      {
        t: "note",
        text: "Compose: rememberLauncherForActivityResult(RequestPermission()) for the raw API, or Accompanist rememberPermissionState/rememberMultiplePermissionsState exposing status (granted/denied/shouldShowRationale) as observable state. Branch UI on status, request on a user action, show rationale, and route to settings on permanent denial.",
      },
    ],
  },
];

export default qa;
