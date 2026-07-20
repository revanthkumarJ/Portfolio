// Threading, Handler/Looper & Permissions — Content tab. Teaching-first.

const content = [
  {
    heading: "The main thread and the single-threaded UI rule",
    blocks: [
      {
        t: "p",
        text: "Android UI is **single-threaded**: all UI updates must happen on the **main thread** (a.k.a. the UI thread). This is a hard rule — touching a View from a background thread throws `CalledFromWrongThreadException`. Conversely, the main thread must *never* be blocked (doing network, disk, or heavy work on it freezes the UI and causes an ANR after ~5 seconds). These two rules together — 'update UI only on main, do heavy work only off main' — are the source of all Android threading patterns.",
      },
      {
        t: "list",
        items: [
          "**Why single-threaded UI**: making the UI toolkit thread-safe (locks on every view operation) would be slow and deadlock-prone; a single UI thread avoids that entirely, at the cost of you managing the boundary.",
          "**The boundary you constantly cross**: do work on a background thread → deliver the result to the main thread to update the UI. Coroutines make this clean (`withContext(IO)` for work, resume on Main), but it's built on lower-level machinery: the Handler/Looper/MessageQueue.",
        ],
      },
    ],
  },
  {
    heading: "Handler, Looper, and MessageQueue — how the main thread works",
    blocks: [
      {
        t: "p",
        text: "The main thread isn't magic — it's a normal thread running an infinite **message loop**. Three pieces make it work: a **`Looper`** (runs the loop), a **`MessageQueue`** (a queue of work to do), and **`Handler`**s (used to post work onto the queue and process it). This is the foundation beneath everything — the coroutine `Dispatchers.Main`, `runOnUiThread`, `View.post`, all sit on top of it.",
      },
      {
        t: "list",
        items: [
          "**`Looper`** — an object that runs an infinite loop (`Looper.loop()`) pulling messages off a queue and dispatching them, one at a time. The main thread has a Looper set up for you (`Looper.getMainLooper()`); background threads don't by default.",
          "**`MessageQueue`** — the queue of `Message`s/`Runnable`s waiting to be processed, ordered by time. The Looper takes the next one when its time arrives.",
          "**`Handler`** — bound to a Looper; you use it to *post* work onto that thread's queue (`handler.post { }`, `handler.postDelayed({ }, 1000)`). A Handler on the main Looper is how a background thread delivers a result to the main thread: it posts a Runnable that the main Looper picks up and runs *on the main thread*.",
          "**The whole model**: the main thread loops forever, processing queued messages (input events, UI updates, posted Runnables) one by one. That's why UI work is serialized and why blocking any single message (a long operation) stalls everything behind it — the loop can't advance.",
        ],
      },
      {
        t: "code",
        title: "Posting to the main thread (the classic pre-coroutine pattern)",
        code: `// Background thread doing work, delivering result to main:
val mainHandler = Handler(Looper.getMainLooper())
thread {
    val result = doHeavyWork()
    mainHandler.post {           // runs on the main thread
        textView.text = result   // safe to touch UI here
    }
}
// Modern coroutine equivalent:
lifecycleScope.launch {
    val result = withContext(Dispatchers.IO) { doHeavyWork() }
    textView.text = result       // back on Main automatically
}`,
      },
      {
        t: "note",
        text: "Interview-ready: the main thread runs a Looper that pulls from a MessageQueue; Handlers post work onto a thread's queue. `Dispatchers.Main` (coroutines), `runOnUiThread`, `View.post`, LiveData delivery — all use this machinery to run work on the main thread. Blocking the loop (a long task) stalls all queued UI work → jank/ANR. Coroutines are the modern abstraction over this, but the Handler/Looper model is what's underneath.",
      },
    ],
  },
  {
    heading: "The evolution of Android threading",
    blocks: [
      {
        t: "table",
        headers: ["Era", "Tool", "Status"],
        rows: [
          ["Early", "Thread + Handler, AsyncTask", "AsyncTask deprecated (leak-prone, lifecycle-blind)"],
          ["Middle", "Loaders, IntentService, RxJava", "Loaders/IntentService deprecated; RxJava still used"],
          ["Modern", "Kotlin Coroutines + Flow, WorkManager", "current standard"],
        ],
      },
      {
        t: "list",
        items: [
          "**`AsyncTask`** (deprecated) — the old way to do background work with UI callbacks; deprecated because it leaked Activities, ignored lifecycle, and had error-prone threading. Know it exists (legacy code) but never use it in new code.",
          "**Coroutines are the modern answer** — structured, lifecycle-aware (via scopes), cancellable, and readable. They replaced AsyncTask/Loaders/most manual Handler use.",
          "You still occasionally touch `Handler`/`Looper` directly for things like a periodic UI update loop or `postDelayed`, but coroutines (`delay`, `withContext`) cover almost all cases more cleanly.",
        ],
      },
    ],
  },
  {
    heading: "Permissions — the model",
    blocks: [
      {
        t: "p",
        text: "Android **permissions** gate access to sensitive data and capabilities (location, camera, contacts, microphone). There are two broad types by *protection level*:",
      },
      {
        t: "list",
        items: [
          "**Normal permissions** — low-risk (internet, vibrate, set alarm). Declared in the manifest and granted *automatically* at install; no user prompt.",
          "**Dangerous (runtime) permissions** — access sensitive data/capabilities (location, camera, contacts, storage, microphone). Declared in the manifest *and* must be requested *at runtime*, with the user explicitly granting or denying via a system dialog. Introduced in Android 6 (Marshmallow) — before that, all permissions were granted at install.",
          "**Special permissions** — a few high-risk ones (display over other apps, modify system settings, exact alarms, all-files access) require the user to toggle them in a dedicated Settings screen, not a simple dialog.",
        ],
      },
    ],
  },
  {
    heading: "Requesting runtime permissions",
    blocks: [
      {
        t: "code",
        title: "The modern Activity Result API",
        code: `// Register a launcher (in an Activity/Fragment)
val requestPermission = registerForActivityResult(
    ActivityResultContracts.RequestPermission()
) { granted ->
    if (granted) startLocationUpdates()
    else showRationaleOrDeniedUi()
}

// Request when needed:
when {
    checkSelfPermission(ACCESS_FINE_LOCATION) == PERMISSION_GRANTED ->
        startLocationUpdates()                       // already have it
    shouldShowRequestPermissionRationale(ACCESS_FINE_LOCATION) ->
        showRationaleDialog()                         // explain why, then request
    else ->
        requestPermission.launch(ACCESS_FINE_LOCATION) // ask
}`,
      },
      {
        t: "list",
        items: [
          "**The flow**: check if already granted → if not, show a rationale if appropriate (`shouldShowRequestPermissionRationale` returns true after a previous denial) → request via the launcher → handle the result.",
          "**Use the Activity Result API** (`registerForActivityResult`) — the modern replacement for the old `onRequestPermissionsResult` callback (which was verbose and error-prone). It handles the plumbing and works with the lifecycle.",
          "**Handle denial gracefully**: the user can deny, deny-with-'don't ask again' (after which the system won't show the dialog and you should guide them to Settings), or grant. Design for all outcomes — never assume you'll get the permission.",
          "**Request in context, with rationale**: ask for a permission *when the feature needs it* (not all upfront at launch), and explain *why* — this dramatically improves grant rates and is required for sensitive permissions on modern Android.",
          "**Newer nuances**: location has *coarse vs fine* and *background* location (background requires a separate, harder-to-get grant); Android 13+ added granular media permissions (photos vs video vs audio instead of broad storage) and a `POST_NOTIFICATIONS` runtime permission.",
        ],
      },
    ],
  },
];

export default content;
