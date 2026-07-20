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
];

export default qa;
