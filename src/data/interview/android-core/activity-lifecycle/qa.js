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
];

export default qa;
