// Activity Lifecycle & State — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "Walk through the Activity lifecycle callbacks.",
    a: [
      {
        t: "list",
        items: [
          "**`onCreate()`** — called once when the Activity is first created. Set up the UI (`setContentView`/`setContent`), initialize ViewModels, restore saved state. This is where one-time initialization goes.",
          "**`onStart()`** — the Activity is becoming *visible* but not yet interactive. Start work that should run while visible.",
          "**`onResume()`** — the Activity is now in the *foreground and interactive*. Acquire resources that need the screen active — camera, sensors, resume animations.",
          "**`onPause()`** — the Activity is losing focus (a dialog appeared, or another Activity is starting). Release exclusive resources (camera) and pause animations. Must be *fast* — the next screen waits for it.",
          "**`onStop()`** — the Activity is no longer visible. Release heavier resources, unregister observers, persist data.",
          "**`onDestroy()`** — the Activity is being destroyed (finished or recreated for a config change). Final cleanup.",
          "**`onRestart()`** — called when a stopped Activity is coming back, before `onStart()`.",
        ],
      },
      {
        t: "p",
        text: "The key mental model is *pairs*: you acquire in one callback and release in its mirror — `onStart`/`onStop`, `onResume`/`onPause`, `onCreate`/`onDestroy`. Launching goes create→start→resume; leaving goes pause→stop; returning goes restart→start→resume; finishing goes pause→stop→destroy. Putting the right work in the right callback (and cleaning up in the mirror) is what makes an Activity behave correctly.",
      },
    ],
  },
  {
    level: "junior",
    q: "What happens to an Activity when you rotate the screen?",
    a: [
      {
        t: "p",
        text: "**By default, the Activity is destroyed and completely recreated.** Rotation is a *configuration change*, and Android's default response is to run the full teardown-and-rebuild cycle: `onPause → onStop → onDestroy`, then a brand-new Activity instance goes `onCreate → onStart → onResume`. Your original Activity object is gone; a new one takes its place.",
      },
      {
        t: "p",
        text: "**Why**: a new configuration (landscape orientation) may require different resources — a landscape layout, different dimensions — and recreating lets Android cleanly load the correct resources for the new configuration. **The consequence**: anything stored in Activity fields or local variables is *lost*. If you kept the screen's data in an Activity property, the screen resets on rotation — a classic bug. What survives is a `ViewModel` (which is retained across configuration changes) and small state written to `onSaveInstanceState`. So the correct approach is architectural: hold screen state in a ViewModel and small transient UI state (scroll position, text input) in saved instance state (`rememberSaveable`/`SavedStateHandle`), never in Activity fields.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is onSaveInstanceState used for?",
    a: [
      {
        t: "p",
        text: "**The concept**: `onSaveInstanceState(Bundle)` is called before the Activity *might* be destroyed — on a configuration change, or when the system kills your app in the background to reclaim memory. You write small pieces of transient UI state into the `Bundle`, and it's returned to you in `onCreate` (and `onRestoreInstanceState`) when the Activity is recreated, so you can restore the screen to how the user left it.",
      },
      {
        t: "list",
        items: [
          "**Use it for small transient UI state**: scroll position, text field contents, which tab was selected, a search query. Things that would annoy the user to lose but aren't the actual screen data.",
          "**Not for large data**: it uses the `Bundle`/Binder mechanism with a ~1MB shared transaction limit, so putting big lists or objects in it risks `TransactionTooLargeException`. Save *ids* and reload the data, not the data itself.",
          "**Screen data belongs elsewhere**: a ViewModel holds it across config changes; a database/repository provides it after process death.",
        ],
      },
      {
        t: "p",
        text: "It's important because it's the *only* mechanism that survives **process death** — when the system kills your backgrounded app entirely, the ViewModel is gone, but the saved-instance-state Bundle is preserved by the system and handed back on relaunch. Modern APIs like `rememberSaveable` (Compose) and `SavedStateHandle` (ViewModel) are built on this exact mechanism and are the idiomatic ways to use it today.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why should onPause be fast, and what should you not do in it?",
    a: [
      {
        t: "p",
        text: "**Because `onPause` runs during a screen transition, and the incoming Activity cannot become interactive (`onResume`) until the outgoing one's `onPause` returns.** So any slow work in `onPause` directly delays the next screen appearing — the user sees a lag or freeze during navigation. It's on the critical path of every transition away from the screen.",
      },
      {
        t: "list",
        items: [
          "**Don't do heavy work in `onPause`**: no database writes of large data, no network calls, no expensive computation. These block the transition.",
          "**Do release exclusive/lightweight resources**: pause animations, release the camera (so another app can use it), unregister a sensor — quick operations that must happen the moment the screen loses focus.",
          "**Put heavier persistence in `onStop`** instead: `onStop` isn't on the transition's critical path in the same way, so saving data or releasing heavier resources belongs there. Historically people over-used `onPause` for saving; modern guidance is to save in `onStop` (or continuously via a ViewModel/repository) and keep `onPause` minimal.",
        ],
      },
      {
        t: "p",
        text: "The rule of thumb: `onPause` is for *quick* 'I'm losing focus' cleanup; `onStop` is for 'I'm no longer visible' work that can afford to take a bit longer. Keeping `onPause` fast keeps navigation snappy.",
      },
    ],
  },
  {
    level: "senior",
    q: "Explain the difference between configuration change and process death, and how you build for both.",
    a: [
      {
        t: "p",
        text: "**They're two different ways your Activity can be torn down, and they preserve different things.** A *configuration change* (rotation, dark mode, locale, resize) destroys and recreates the Activity, but the *process stays alive* — so the ViewModel (which is retained) survives, and only Activity-instance state is lost. *Process death* is when the system kills your entire backgrounded process to reclaim memory — the ViewModel and all in-memory state are gone; only the saved-instance-state Bundle (held by the system) survives.",
      },
      {
        t: "table",
        headers: ["Survives?", "Config change", "Process death"],
        rows: [
          ["ViewModel / in-memory state", "yes / yes", "no / no"],
          ["onSaveInstanceState Bundle", "restored", "restored"],
          ["Activity fields", "lost", "lost"],
        ],
      },
      {
        t: "list",
        items: [
          "**Build strategy — layered**: hold screen state in a **ViewModel** (covers configuration changes for free, in memory, no serialization). Hold the *minimal identity/input* needed to rebuild — selected id, query text, scroll anchor — in **`SavedStateHandle`** (which is backed by saved instance state, so it survives process death too). And treat the **persistent layer** (database/repository) as the source of truth for actual data, reloading it on recreation using the saved id.",
          "**The recreation path is the same for both**: on recreate, the ViewModel reads its id from `SavedStateHandle` and re-subscribes to the repository — identical to first launch, so process-death recovery isn't a special code path. That's the elegance of the pattern.",
          "**Don't over-save**: putting large data in `SavedStateHandle`/`onSaveInstanceState` risks `TransactionTooLargeException` (Binder limit). Save ids and reload; never parcel entire lists.",
          "**Test both distinctly**: rotate to test config changes; to test process death, background the app and kill it via Android Studio's 'Terminate' or `adb shell am kill <pkg>`, then relaunch from recents. Rotation testing alone gives false confidence — it never exercises the ViewModel-is-gone path.",
        ],
      },
      {
        t: "p",
        text: "**The common interview trap**: 'does the ViewModel survive process death?' — *No*. It survives configuration changes only. Candidates frequently get this wrong. The complete answer is the layered strategy: ViewModel for config changes, SavedStateHandle (+ persistent layer) for process death, and reloading data from the source of truth rather than trying to serialize it all.",
      },
    ],
  },
  {
    level: "senior",
    q: "How can you handle configuration changes without the Activity being recreated, and why is that usually discouraged?",
    a: [
      {
        t: "p",
        text: "**You can opt out of automatic recreation by declaring `android:configChanges` in the manifest** — listing the configuration types you'll handle yourself (e.g. `android:configChanges=\"orientation|screenSize|keyboardHidden\"`). When one of those changes, Android does *not* recreate the Activity; instead it calls `onConfigurationChanged(newConfig)`, and you manually update whatever needs updating.",
      },
      {
        t: "list",
        items: [
          "**Why it's usually discouraged**: by handling config changes yourself, you take responsibility for reloading *all* configuration-dependent resources — layouts, dimensions, strings, drawables — for the new configuration. Miss one and you get subtle bugs (a landscape layout that never loads, a string that stays in the old language). The system's recreation does all of this correctly and automatically; opting out means reimplementing it by hand, error-prone.",
          "**It doesn't solve the real problem**: people reach for `configChanges` to 'avoid losing state on rotation', but the *correct* solution to state loss is a ViewModel + saved instance state, which also handles process death (which `configChanges` does nothing for). So `configChanges` treats the symptom while leaving the actual robustness gap.",
          "**Legitimate uses exist**: it's appropriate for specific cases like a full-screen video player or a game rendering with a custom `SurfaceView`/OpenGL context, where recreating would cause a jarring reload or lose a GPU context, and where there are few configuration-dependent resources to manage. Compose also handles many config changes gracefully within a single Activity, reducing the need.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: `configChanges` trades the system's correct-but-recreating behavior for manual control, and it's the *wrong tool* for state preservation (use ViewModel + SavedStateHandle for that). Reserve it for the narrow cases — media/rendering surfaces — where recreation is genuinely undesirable and you can correctly handle the resource updates yourself. Reaching for it to 'fix rotation bugs' is an anti-pattern that hides the real architectural fix.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are onCreate, onStart, and onResume each responsible for?",
    a: [
      {
        t: "p",
        text: "These are the three 'coming to the foreground' callbacks. `onCreate` runs *once* when the Activity is created — inflate the UI, initialize, restore saved state. `onStart` runs when the Activity becomes *visible* (can happen multiple times). `onResume` runs when it becomes the *foreground/interactive* Activity — start things that need focus (camera preview, animations, sensor updates).",
      },
      {
        t: "table",
        headers: ["Callback", "When", "Do"],
        rows: [
          ["onCreate", "created (once)", "inflate UI, init, restore state"],
          ["onStart", "becoming visible", "register visible-only observers"],
          ["onResume", "foreground/interactive", "acquire focus-needing resources"],
        ],
      },
      {
        t: "list",
        items: [
          "**`onCreate(savedInstanceState)`** — one-time setup; `setContentView`/`setContent`; restore state.",
          "**`onStart`** — visible but maybe not focused; can run multiple times.",
          "**`onResume`** — foreground; start camera/sensors/animations; the user can interact.",
          "**Pairing** — `onResume`↔`onPause`, `onStart`↔`onStop`, `onCreate`↔`onDestroy`.",
        ],
      },
      {
        t: "note",
        text: "onCreate: one-time setup (inflate UI, init, restore state). onStart: becoming visible (visible-only observers). onResume: foreground/interactive (acquire focus-needing resources — camera/sensors/animations). They pair with onPause/onStop/onDestroy respectively. onStart/onResume can run multiple times; onCreate once.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between onPause and onStop?",
    a: [
      {
        t: "p",
        text: "`onPause` fires when the Activity *loses focus* but may still be *partially visible* (a dialog or translucent Activity appears on top) — it should be fast. `onStop` fires when the Activity is *no longer visible* at all (fully covered or backgrounded) — a better place for heavier teardown like saving to a database or releasing resources.",
      },
      {
        t: "list",
        items: [
          "**`onPause`** — losing focus, maybe still visible; keep it quick (no heavy I/O).",
          "**`onStop`** — no longer visible; do heavier cleanup (persist data, release resources).",
          "**Partial visibility** — a translucent/dialog Activity triggers `onPause` but *not* `onStop`.",
          "**Ordering** — `onPause` → `onStop` when fully backgrounded.",
        ],
      },
      {
        t: "code",
        title: "Pause vs stop",
        code: `override fun onPause() { super.onPause(); pausePlayback() }   // quick, focus lost
override fun onStop() { super.onStop(); saveDraftToDb() }     // not visible, heavier work`,
      },
      {
        t: "note",
        text: "onPause: losing focus but maybe still visible (dialog/translucent on top) — keep it FAST, no heavy I/O. onStop: no longer visible — do heavier teardown (persist data, release resources). A translucent Activity triggers onPause but not onStop. Fully backgrounding goes onPause → onStop.",
      },
    ],
  },
  {
    level: "junior",
    q: "When is onDestroy called, and when is it NOT called?",
    a: [
      {
        t: "p",
        text: "`onDestroy` runs when the Activity is finishing (user pressed back, `finish()` called) or being destroyed for a configuration change. But it is *not* guaranteed — if the system kills the process (low memory) or force-stops the app, `onDestroy` may *not* run. So never rely on `onDestroy` for critical persistence; save important state earlier (`onStop`/`onPause`) or reactively.",
      },
      {
        t: "list",
        items: [
          "**Called** — on `finish()`/back press, and on configuration change (then recreated).",
          "**Not guaranteed** — process kill (low memory) or force-stop may skip it.",
          "**`isFinishing`** — distinguish real finish from a config-change destroy.",
          "**Don't rely on it** — persist critical state in `onStop`/`onPause`, not `onDestroy`.",
        ],
      },
      {
        t: "note",
        text: "onDestroy runs on finish()/back press and config-change destroy (then recreate), but is NOT guaranteed — a process kill or force-stop can skip it. Use isFinishing to tell a real finish from a config-change destroy. Never rely on onDestroy for critical persistence; save in onStop/onPause.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is onRestart, and what is the full path back to the foreground?",
    a: [
      {
        t: "p",
        text: "When a *stopped* (backgrounded) Activity comes back to the foreground, it doesn't re-run `onCreate` — it goes `onRestart` → `onStart` → `onResume`. `onRestart` runs only in this stopped→visible transition, so it's the place to refresh anything that might have changed while the Activity was hidden.",
      },
      {
        t: "code",
        title: "Return-to-foreground path",
        code: `// Backgrounded then returned:
onPause -> onStop         // going away
onRestart -> onStart -> onResume   // coming back (no onCreate!)`,
      },
      {
        t: "list",
        items: [
          "**`onRestart`** — only when a stopped Activity restarts (not on first create).",
          "**Path back** — `onRestart` → `onStart` → `onResume`.",
          "**No `onCreate`** — the Activity wasn't destroyed, just stopped.",
          "**Use** — refresh data that may have changed while backgrounded.",
        ],
      },
      {
        t: "note",
        text: "A stopped Activity returning to foreground goes onRestart → onStart → onResume (no onCreate — it wasn't destroyed). onRestart runs only on the stopped→visible transition — a place to refresh data that may have changed while hidden.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are lifecycle-aware components and DefaultLifecycleObserver?",
    a: [
      {
        t: "p",
        text: "Lifecycle-aware components observe an owner's `Lifecycle` and react to its state, so they can *self-manage* setup/teardown instead of the Activity/Fragment manually calling them in each callback. Implement `DefaultLifecycleObserver` (override `onStart`/`onStop`/etc.) and register it with `lifecycle.addObserver(...)` — it then follows the owner's lifecycle automatically.",
      },
      {
        t: "code",
        title: "A self-managing component",
        code: `class LocationTracker(private val lifecycle: Lifecycle) : DefaultLifecycleObserver {
    init { lifecycle.addObserver(this) }
    override fun onStart(owner: LifecycleOwner) { startUpdates() }
    override fun onStop(owner: LifecycleOwner) { stopUpdates() }
}`,
      },
      {
        t: "list",
        items: [
          "**`DefaultLifecycleObserver`** — override lifecycle methods; register with `addObserver`.",
          "**Self-managing** — the component starts/stops itself with the owner's lifecycle.",
          "**Avoids boilerplate** — no manual calls in every Activity/Fragment callback.",
          "**Examples** — `lifecycleScope`, `LiveData`, `collectAsStateWithLifecycle` are lifecycle-aware.",
        ],
      },
      {
        t: "note",
        text: "Lifecycle-aware components observe an owner's Lifecycle and self-manage setup/teardown. Implement DefaultLifecycleObserver (onStart/onStop/…) and lifecycle.addObserver(it) — it follows the owner automatically, avoiding manual calls in each Activity/Fragment callback. lifecycleScope/LiveData are built this way.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are Lifecycle.State and Lifecycle.Event?",
    a: [
      {
        t: "p",
        text: "The `Lifecycle` has *states* (`INITIALIZED`, `CREATED`, `STARTED`, `RESUMED`, `DESTROYED`) and *events* (`ON_CREATE`, `ON_START`, `ON_RESUME`, `ON_PAUSE`, `ON_STOP`, `ON_DESTROY`) that move between them. `repeatOnLifecycle(STARTED)` and `collectAsStateWithLifecycle` use the *state* to run work only at/above a given level, restarting on the state transitions.",
      },
      {
        t: "list",
        items: [
          "**States** — INITIALIZED → CREATED → STARTED → RESUMED (and down to DESTROYED).",
          "**Events** — the transitions (`ON_START`, `ON_STOP`, etc.).",
          "**`currentState.isAtLeast(STARTED)`** — check if visible.",
          "**`repeatOnLifecycle(STARTED)`** — run a block while at least STARTED, cancel below it.",
        ],
      },
      {
        t: "note",
        text: "Lifecycle has states (INITIALIZED/CREATED/STARTED/RESUMED/DESTROYED) and events (ON_CREATE/ON_START/ON_RESUME/ON_PAUSE/ON_STOP/ON_DESTROY) between them. repeatOnLifecycle(STARTED)/collectAsStateWithLifecycle use the STATE to run work only while at/above a level, restarting across transitions.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is onNewIntent, and when is it called?",
    a: [
      {
        t: "p",
        text: "`onNewIntent` is called when an *existing* Activity instance receives a new Intent instead of a new instance being created — which happens with launch modes `singleTop` (when it's already on top) or `singleTask`/`singleInstance`. Because the Activity isn't recreated, you must handle the new Intent here (and call `setIntent(intent)` to update `getIntent()`).",
      },
      {
        t: "code",
        title: "onNewIntent",
        code: `override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)          // update getIntent()
    handleDeepLink(intent)     // the Activity wasn't recreated
}`,
      },
      {
        t: "list",
        items: [
          "**Existing instance reused** — no new `onCreate`; `onNewIntent` delivers the new Intent.",
          "**Triggered by** — `singleTop` (already on top), `singleTask`/`singleInstance`.",
          "**`setIntent()`** — update the stored intent so `getIntent()` reflects the new one.",
          "**Uses** — deep links, notifications re-opening an existing screen.",
        ],
      },
      {
        t: "note",
        text: "onNewIntent delivers a new Intent to an EXISTING Activity instance (no new onCreate) — with launch modes singleTop (already on top), singleTask/singleInstance. Call setIntent(intent) so getIntent() reflects it, then handle it. Common for deep links / notifications reopening a live screen.",
      },
    ],
  },
  {
    level: "senior",
    q: "What survives a configuration change, process death, and neither?",
    a: [
      {
        t: "p",
        text: "Three tiers: a *ViewModel* survives configuration changes (kept in memory) but not process death. *`onSaveInstanceState`/`SavedStateHandle`* survive *both* config change and process death (serialized to a Bundle). Plain instance fields survive *neither* (lost on recreation). The robust approach combines them: ViewModel for data + SavedStateHandle for the small state needed to rebuild after process death.",
      },
      {
        t: "table",
        headers: ["Mechanism", "Config change", "Process death"],
        rows: [
          ["ViewModel", "survives", "lost"],
          ["SavedStateHandle / saved instance state", "survives", "survives"],
          ["plain fields", "lost", "lost"],
        ],
      },
      {
        t: "list",
        items: [
          "**ViewModel** — in-memory across config change; cleared on real finish; gone on process death.",
          "**SavedStateHandle** — small Bundle-able state; survives both.",
          "**Combine** — ViewModel holds data; SavedStateHandle holds ids/inputs to re-fetch after process death.",
          "**Plain fields** — reset on any recreation.",
        ],
      },
      {
        t: "note",
        text: "ViewModel survives config change (in memory), not process death. SavedStateHandle/saved instance state survives BOTH (Bundle). Plain fields survive neither. Combine: ViewModel for data + SavedStateHandle for the ids/inputs to rebuild after process death.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is SavedStateHandle, and how does it survive process death?",
    a: [
      {
        t: "p",
        text: "`SavedStateHandle` is a key-value map (injected into a ViewModel) whose contents are saved into the Activity's saved-instance-state `Bundle`, so they survive *process death* (not just config change like the rest of the ViewModel). Use it to persist the small inputs (an id, a query) needed to rebuild the screen's data after the OS kills and restores the process.",
      },
      {
        t: "code",
        title: "SavedStateHandle in a ViewModel",
        code: `class DetailViewModel(private val handle: SavedStateHandle) : ViewModel() {
    private val id: String = handle["itemId"] ?: error("missing id")
    val query = handle.getStateFlow("query", "")   // observable, saved
    fun setQuery(q: String) { handle["query"] = q }
}`,
      },
      {
        t: "list",
        items: [
          "**Injected into the ViewModel** — Hilt/AndroidX provides it.",
          "**Backed by the saved-state Bundle** — survives process death.",
          "**`getStateFlow(key, default)`** — an observable, saved value.",
          "**Store small inputs** — ids/queries to re-fetch, not large objects.",
        ],
      },
      {
        t: "note",
        text: "SavedStateHandle is a ViewModel-injected key-value map backed by the saved-instance-state Bundle, so it survives PROCESS DEATH (the rest of the ViewModel doesn't). Store the small inputs (id/query) needed to rebuild data after restore; getStateFlow(key, default) gives an observable saved value. Bundle-size limits apply.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the Bundle size limit for saved state, and why does it matter?",
    a: [
      {
        t: "p",
        text: "Saved instance state (and `SavedStateHandle`) is serialized into a `Bundle` delivered through a Binder transaction, which has a limit (~1MB shared across the transaction, but practically you should stay well under ~50KB). Exceeding it throws `TransactionTooLargeException`. So you must save only *small* state (ids, scroll position, form inputs) — never large lists, bitmaps, or full objects.",
      },
      {
        t: "list",
        items: [
          "**Bundle → Binder transaction** — limited size (~1MB total, keep well under).",
          "**`TransactionTooLargeException`** — from oversized saved state.",
          "**Save small** — ids, selected tab, scroll position, text input.",
          "**Not for large data** — re-fetch big data from cache/DB using the saved ids.",
        ],
      },
      {
        t: "note",
        text: "Saved instance state/SavedStateHandle serializes into a Bundle over a Binder transaction with a size limit (~1MB total; keep well under ~50KB) — exceeding it throws TransactionTooLargeException. Save only small state (ids, scroll position, inputs); re-fetch large data from cache/DB using the saved ids.",
      },
    ],
  },
  {
    level: "senior",
    q: "When is onSaveInstanceState called, and how does it relate to onRestoreInstanceState?",
    a: [
      {
        t: "p",
        text: "`onSaveInstanceState(bundle)` is called when the system *might* destroy the Activity to reclaim resources — before `onStop` (on modern Android). The saved Bundle is passed back to `onCreate(savedInstanceState)` and to `onRestoreInstanceState(bundle)` (called after `onStart`, only if there was saved state). You can restore in either `onCreate` (check for null) or `onRestoreInstanceState`.",
      },
      {
        t: "list",
        items: [
          "**`onSaveInstanceState`** — called before the Activity may be destroyed (before `onStop`); save small UI state.",
          "**Not on finish** — not called when the user explicitly finishes (state won't be needed).",
          "**Restore in `onCreate`** — `savedInstanceState?.let { }` (null on first launch).",
          "**Or `onRestoreInstanceState`** — after `onStart`, only when there's saved state to restore.",
        ],
      },
      {
        t: "note",
        text: "onSaveInstanceState is called before the Activity might be destroyed (before onStop on modern Android) — not on explicit finish. The Bundle returns to onCreate(savedInstanceState) and onRestoreInstanceState (after onStart, only if state exists). Restore in onCreate (null-check) or onRestoreInstanceState.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the Activity Result API, and why did it replace onActivityResult?",
    a: [
      {
        t: "p",
        text: "The Activity Result API (`registerForActivityResult` / `rememberLauncherForActivityResult` in Compose) is the modern way to start another Activity (or request a permission) and get a result via a typed callback. It replaced the old `startActivityForResult`/`onActivityResult` (with manual request codes and a giant `when`), which was error-prone and hard to modularize.",
      },
      {
        t: "code",
        title: "Activity Result API",
        code: `val launcher = registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
    uri?.let { handleImage(it) }        // typed result callback
}
launcher.launch("image/*")
// Compose: val launcher = rememberLauncherForActivityResult(contract) { result -> }`,
      },
      {
        t: "list",
        items: [
          "**`registerForActivityResult(contract) { result -> }`** — typed contracts + callback.",
          "**No request codes** — the callback is tied to the specific launcher.",
          "**Contracts** — `StartActivityForResult`, `GetContent`, `RequestPermission`, custom.",
          "**Survives recreation** — registered in `onCreate`; robust across process death.",
        ],
      },
      {
        t: "note",
        text: "The Activity Result API (registerForActivityResult(contract){result} / rememberLauncherForActivityResult) starts activities/permission requests and returns a typed result via callback — replacing error-prone startActivityForResult/onActivityResult with request codes. Register in onCreate; contracts include GetContent, RequestPermission, StartActivityForResult, custom.",
      },
    ],
  },
  {
    level: "senior",
    q: "What lifecycle happens when a translucent or dialog Activity appears on top?",
    a: [
      {
        t: "p",
        text: "If a *translucent* Activity or a dialog-themed Activity opens over your Activity, your Activity is still *partially visible*, so it receives `onPause` but *not* `onStop` — it stays in the STARTED state. This is a key reason `onPause` shouldn't be used for teardown you'd want on 'not visible': the Activity may still be showing behind the overlay.",
      },
      {
        t: "list",
        items: [
          "**Partial visibility** — translucent/dialog Activity on top keeps yours visible.",
          "**`onPause` only** — no `onStop` (still STARTED).",
          "**Implication** — don't release visible-only resources in `onPause`.",
          "**Full cover** — a normal opaque Activity triggers `onStop` too.",
        ],
      },
      {
        t: "note",
        text: "A translucent or dialog-themed Activity on top leaves yours partially visible, so you get onPause but NOT onStop (stays STARTED). So don't tear down visible-only resources in onPause — the Activity may still be showing. A full opaque Activity triggers onStop as well.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the lifecycle callback order when Activity A launches Activity B?",
    a: [
      {
        t: "p",
        text: "The transitions interleave: A's `onPause` runs first, then B goes `onCreate` → `onStart` → `onResume` (B is now foreground), and only *then* does A's `onStop` run (A is no longer visible). This ordering is why `onPause` must be fast — B can't fully resume until A's `onPause` returns.",
      },
      {
        t: "code",
        title: "A launches B",
        code: `A.onPause
    B.onCreate -> B.onStart -> B.onResume
A.onStop
// Pressing back from B:
B.onPause -> A.onRestart -> A.onStart -> A.onResume -> B.onStop -> B.onDestroy`,
      },
      {
        t: "list",
        items: [
          "**A.onPause first** — before B starts.",
          "**B fully resumes** — onCreate → onStart → onResume.",
          "**A.onStop last** — after B is visible.",
          "**Why `onPause` fast** — B's resume waits on A's `onPause`.",
        ],
      },
      {
        t: "note",
        text: "A launches B: A.onPause → B.onCreate → B.onStart → B.onResume → A.onStop (A stops only after B is visible). Back from B: B.onPause → A.onRestart/onStart/onResume → B.onStop → B.onDestroy. This interleaving is why onPause must be fast — B's resume waits on it.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are common Activity lifecycle mistakes that cause leaks?",
    a: [
      {
        t: "p",
        text: "The classic mistakes: registering listeners/receivers/observers in one callback but not unregistering in the paired one; holding the Activity `Context` in a static/singleton (leaks the whole Activity); starting background work not tied to the lifecycle; and not releasing resources (camera, sensors) in the matching teardown callback. Always pair setup with teardown.",
      },
      {
        t: "list",
        items: [
          "**Unpaired register/unregister** — register in `onStart`, unregister in `onStop` (or `onResume`/`onPause`).",
          "**Static Activity reference** — a singleton holding the Activity/Context leaks it; use `applicationContext` for long-lived needs.",
          "**Unscoped background work** — use `lifecycleScope`/`viewModelScope` so it cancels.",
          "**Resource release** — release camera/sensors/`MediaPlayer` in the paired callback.",
        ],
      },
      {
        t: "note",
        text: "Lifecycle leak mistakes: register without unregister (pair onStart/onStop etc.), static/singleton holding the Activity Context (use applicationContext), background work not tied to lifecycleScope/viewModelScope, and not releasing resources (camera/sensors/MediaPlayer) in the paired teardown. Always pair setup with teardown.",
      },
    ],
  },
  {
    level: "senior",
    q: "Where should you acquire and release resources like camera or location across the lifecycle?",
    a: [
      {
        t: "p",
        text: "Acquire in `onStart`/`onResume` and release in the *paired* callback (`onStop`/`onPause`), matching the resource's visibility needs. Focus-sensitive resources (camera preview, exclusive audio) belong in `onResume`/`onPause`; visible-but-not-focused ones (location updates, sensor listeners) in `onStart`/`onStop`. Lifecycle-aware components or `repeatOnLifecycle` can automate this.",
      },
      {
        t: "list",
        items: [
          "**Focus-sensitive** — camera, exclusive audio → acquire in `onResume`, release in `onPause`.",
          "**Visible-scoped** — location, sensors → `onStart`/`onStop`.",
          "**Pair them** — every acquire has a matching release.",
          "**Automate** — `DefaultLifecycleObserver` or `repeatOnLifecycle(STARTED)` for flows.",
        ],
      },
      {
        t: "note",
        text: "Acquire/release resources in paired callbacks matched to visibility: focus-sensitive (camera, exclusive audio) in onResume/onPause; visible-scoped (location, sensors) in onStart/onStop. Automate with DefaultLifecycleObserver or repeatOnLifecycle(STARTED) so it follows the lifecycle without manual pairing.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does the Activity lifecycle relate to Compose (setContent)?",
    a: [
      {
        t: "p",
        text: "`setContent { }` in `onCreate` installs a `ComposeView` and starts the composition; the composition is tied to the Activity's lifecycle and disposed when the Activity is destroyed. Compose reads the Activity's `Lifecycle` (via `LocalLifecycleOwner`) so `collectAsStateWithLifecycle` and lifecycle effects work. Configuration changes still recreate the Activity and re-run `setContent` — Compose state uses `rememberSaveable`/ViewModel to survive.",
      },
      {
        t: "list",
        items: [
          "**`setContent` in `onCreate`** — starts the composition; disposed on destroy.",
          "**`LocalLifecycleOwner`** — Compose sees the Activity's lifecycle.",
          "**Config change** — recreates the Activity and re-composes; use `rememberSaveable`/ViewModel.",
          "**Lifecycle-aware Compose** — `collectAsStateWithLifecycle`, `LifecycleResumeEffect`.",
        ],
      },
      {
        t: "note",
        text: "setContent { } in onCreate starts the composition, tied to and disposed with the Activity lifecycle; Compose reads it via LocalLifecycleOwner (so collectAsStateWithLifecycle/lifecycle effects work). Config change recreates the Activity and re-runs setContent — use rememberSaveable/ViewModel to survive.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you simulate and test process death during development?",
    a: [
      {
        t: "p",
        text: "Enable **Developer Options → 'Don't keep activities'** to destroy every Activity as soon as you leave it (simulating aggressive destruction), or use the 'Background process limit'. To simulate true *process death*, background the app and terminate the process from Android Studio's *App Quality Insights*/terminate button (or `adb shell am kill <package>`), then return — the OS restores from saved state.",
      },
      {
        t: "list",
        items: [
          "**'Don't keep activities'** — destroys Activities on leave; catches state-restoration bugs.",
          "**Terminate the process** — Studio's stop/terminate or `adb shell am kill` while backgrounded, then reopen.",
          "**Verify** — the screen restores correctly from `SavedStateHandle`/saved state.",
          "**Not the same as swipe-away** — swiping from Recents finishes the task; process death is OS-initiated.",
        ],
      },
      {
        t: "note",
        text: "Simulate aggressive destruction with Developer Options → 'Don't keep activities'. Simulate true process death by backgrounding the app and terminating the process (Studio terminate or adb shell am kill <pkg>), then reopening — verify restoration from SavedStateHandle. Note swipe-away from Recents finishes the task, which differs from OS-initiated process death.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between the visible and foreground lifecycle states?",
    a: [
      {
        t: "p",
        text: "An Activity is *visible* when it's in the STARTED state (between `onStart` and `onStop`) — the user can see it, possibly behind a dialog. It's in the *foreground* (interactive) when RESUMED (after `onResume`, before `onPause`) — it has focus and the user can interact. The gap (visible but not focused) happens when a dialog/translucent Activity is on top.",
      },
      {
        t: "list",
        items: [
          "**Visible (STARTED)** — seen but maybe not focused; between `onStart`/`onStop`.",
          "**Foreground (RESUMED)** — focused and interactive; between `onResume`/`onPause`.",
          "**In-between** — visible but not focused (dialog on top): STARTED, not RESUMED.",
          "**Choose work by state** — visible-only vs focus-required.",
        ],
      },
      {
        t: "note",
        text: "Visible = STARTED (seen, maybe behind a dialog; onStart↔onStop). Foreground = RESUMED (focused, interactive; onResume↔onPause). The visible-but-not-focused gap happens with a dialog/translucent Activity on top. Scope work by state: visible-only (STARTED) vs focus-required (RESUMED).",
      },
    ],
  },
  {
    level: "junior",
    q: "Why is the ViewModel the right place for data that must survive the lifecycle?",
    a: [
      {
        t: "p",
        text: "A `ViewModel` is scoped to the screen's lifecycle *owner* and survives configuration changes — so data it holds isn't re-fetched on every rotation, and it's cleared only when the screen is truly finished (`onCleared`). This makes it the correct home for UI-related data and in-flight operations, keeping the Activity/Fragment thin and avoiding reload-on-rotation.",
      },
      {
        t: "list",
        items: [
          "**Survives config change** — data persists across rotation (no refetch).",
          "**Cleared on real finish** — `onCleared()` when the owner is gone for good.",
          "**Holds data + operations** — `viewModelScope` work survives rotation too.",
          "**Thin UI** — the Activity/Fragment observes state; logic lives in the ViewModel.",
        ],
      },
      {
        t: "note",
        text: "A ViewModel is scoped to the screen and survives configuration changes (data isn't refetched on rotation), cleared only on true finish (onCleared). It's the right home for UI data and in-flight operations (viewModelScope survives rotation too), keeping the Activity/Fragment thin. Pair with SavedStateHandle for process death.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does lifecycleScope relate to the lifecycle, and when should you use it?",
    a: [
      {
        t: "p",
        text: "`lifecycleScope` is a `CoroutineScope` tied to a `LifecycleOwner` (Activity/Fragment) — its coroutines are cancelled when the lifecycle reaches DESTROYED. Use it for UI-lifecycle work like collecting flows to update views (with `repeatOnLifecycle(STARTED)`), not for data that should survive configuration changes (use `viewModelScope` for that).",
      },
      {
        t: "code",
        title: "lifecycleScope usage",
        code: `lifecycleScope.launch {
    repeatOnLifecycle(Lifecycle.State.STARTED) {
        viewModel.uiState.collect { render(it) }   // cancelled/restarted with visibility
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Tied to the owner** — cancelled at DESTROYED.",
          "**UI-lifecycle work** — collecting flows, view updates.",
          "**Doesn't survive config change** — the Fragment/Activity is recreated.",
          "**vs `viewModelScope`** — use that for data work that must survive rotation.",
        ],
      },
      {
        t: "note",
        text: "lifecycleScope is a CoroutineScope tied to a LifecycleOwner — cancelled at DESTROYED. Use it for UI-lifecycle work (collecting flows to update views, with repeatOnLifecycle(STARTED)); it doesn't survive config change. Use viewModelScope for data work that must survive rotation.",
      },
    ],
  },
  {
    level: "junior",
    q: "What happens to the lifecycle when the user presses Home versus Back?",
    a: [
      {
        t: "p",
        text: "Pressing **Home** *backgrounds* the Activity without finishing it — `onPause` → `onStop`; it stays in memory and returns via `onRestart` → `onStart` → `onResume`. Pressing **Back** (on the root Activity) *finishes* it — `onPause` → `onStop` → `onDestroy` — so returning re-creates it from scratch.",
      },
      {
        t: "list",
        items: [
          "**Home** — background (not finished): onPause → onStop; return via onRestart/onStart/onResume.",
          "**Back** — finish: onPause → onStop → onDestroy; `isFinishing` is true.",
          "**State** — Home keeps the instance; Back destroys it (state via saved-instance/ViewModel).",
          "**Recents swipe** — finishes the task (like back for the whole task).",
        ],
      },
      {
        t: "note",
        text: "Home backgrounds without finishing (onPause → onStop; returns via onRestart/onStart/onResume, instance kept). Back on the root finishes (onPause → onStop → onDestroy, isFinishing true; recreated on return). Recents swipe finishes the task. Use ViewModel/saved state for data across these.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does multi-window / split-screen affect the Activity lifecycle?",
    a: [
      {
        t: "p",
        text: "In multi-window/split-screen, multiple Activities can be *visible* at once, but only *one* is in the RESUMED (focused) state at a time — the others are STARTED (visible but not focused). So an Activity you can still see may be in `onPause`. Don't tie critical 'keep running' work (video playback) strictly to `onResume`/`onPause`; consider `onStart`/`onStop` and declare `resizeableActivity`.",
      },
      {
        t: "list",
        items: [
          "**Multiple visible** — split-screen shows several Activities.",
          "**One focused** — only one RESUMED; others STARTED (paused but visible).",
          "**Implication** — a paused Activity may still be visible; use STARTED-scoped work for visible behavior.",
          "**`resizeableActivity`** — declare support; handle resize as a configuration change.",
        ],
      },
      {
        t: "note",
        text: "In multi-window, multiple Activities are visible but only one is RESUMED (focused) — others are STARTED (visible but paused). So a visible Activity may be in onPause; tie visible behavior (playback) to onStart/onStop, not onResume/onPause. Declare resizeableActivity and handle resize as a config change.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why does the whole Activity recreate on rotation, and how do you keep it smooth?",
    a: [
      {
        t: "p",
        text: "A rotation is a *configuration change* — the system destroys and recreates the Activity so it can load configuration-specific resources (layouts, dimens) for the new orientation. To keep it smooth: hold data in a `ViewModel` (survives recreation, no refetch), save small UI state via `rememberSaveable`/`onSaveInstanceState`, and let the framework re-inflate resources. Avoid `configChanges` hacks unless you have a specific reason.",
      },
      {
        t: "list",
        items: [
          "**Config change → recreate** — to load orientation-specific resources.",
          "**ViewModel** — data survives; no reload on rotate.",
          "**`rememberSaveable`/saved state** — small UI state survives.",
          "**Avoid `android:configChanges`** — handling it yourself skips resource reloading and is error-prone.",
        ],
      },
      {
        t: "note",
        text: "Rotation is a configuration change — the Activity recreates to load orientation-specific resources. Keep it smooth with a ViewModel (data survives, no refetch) + rememberSaveable/onSaveInstanceState (small UI state). Avoid android:configChanges hacks — they skip resource reloading and are error-prone.",
      },
    ],
  },
];

export default qa;
