// Activity Lifecycle & State — Content tab. Teaching-first.

const content = [
  {
    heading: "What the Activity lifecycle is and why it exists",
    blocks: [
      {
        t: "p",
        text: "An **Activity** is a single screen in an Android app. Because the OS — not your app — controls when screens are shown, hidden, and destroyed (the user switches apps, gets a call, rotates the phone, the system needs memory), Android notifies your Activity of these transitions through **lifecycle callbacks**. Understanding them is fundamental because doing the *right work at the right callback* is what makes an app correct: acquire resources when visible, release them when not, and save state before you might be destroyed.",
      },
      {
        t: "list",
        items: [
          "The lifecycle exists because Android is a **resource-constrained, multitasking OS** that can destroy your Activity at any time to reclaim memory. Your app must cooperate: set up when needed, tear down when not, and be able to recreate itself.",
          "Each callback is a signal about *visibility* and *interactivity*: created, visible, in-foreground-interactive, and the reverse on the way down.",
        ],
      },
    ],
  },
  {
    heading: "The seven callbacks",
    blocks: [
      {
        t: "table",
        headers: ["Callback", "Meaning", "Typical work"],
        rows: [
          ["`onCreate()`", "Activity created (once per instance)", "inflate UI (setContent), init ViewModels, restore state"],
          ["`onStart()`", "becoming visible (not yet interactive)", "start visible-only work (register some observers)"],
          ["`onResume()`", "now in foreground, interactive", "start camera/sensors, resume animations, acquire exclusive resources"],
          ["`onPause()`", "losing focus (partially obscured)", "pause animations, release camera, save critical data quickly (must be fast)"],
          ["`onStop()`", "no longer visible", "release heavier resources, unregister observers, persist state"],
          ["`onDestroy()`", "being destroyed (finish or config change)", "final cleanup"],
          ["`onRestart()`", "coming back to visible after onStop", "re-prepare before onStart"],
        ],
      },
      {
        t: "code",
        title: "The lifecycle flow",
        code: `onCreate -> onStart -> onResume   // launching, now interactive
                                  // ... user uses the screen ...
onPause -> onStop                 // user leaves (another app/screen)
onRestart -> onStart -> onResume  // user returns
onPause -> onStop -> onDestroy    // finishing / system destroys`,
      },
      {
        t: "list",
        items: [
          "**Visible lifetime** = `onStart` → `onStop` (the Activity is at least partially visible). **Foreground lifetime** = `onResume` → `onPause` (has focus, interactive). **Entire lifetime** = `onCreate` → `onDestroy`.",
          "**Pairs**: acquire in one, release in its mirror — `onStart`/`onStop`, `onResume`/`onPause`, `onCreate`/`onDestroy`. Camera in `onResume`, release in `onPause`.",
          "**`onPause` must be fast**: the next Activity can't resume until it returns, so no heavy work there — it briefly blocks the transition. Heavy persistence goes in `onStop`.",
        ],
      },
    ],
  },
  {
    heading: "Configuration changes — the recreation trap",
    blocks: [
      {
        t: "p",
        text: "A **configuration change** (rotation, dark mode toggle, language change, window resize, font size change) by default **destroys and recreates the Activity** — full `onPause → onStop → onDestroy → onCreate → onStart → onResume`. This surprises newcomers: rotating the phone rebuilds your entire screen. Any state held in Activity fields is *lost* unless you preserve it.",
      },
      {
        t: "list",
        items: [
          "**Why recreate?** A different configuration may need different resources (a landscape layout, a different-language string, a larger font) — recreating lets Android load the right resources for the new configuration cleanly.",
          "**What survives**: a `ViewModel` (retained across configuration changes), and small state saved via `onSaveInstanceState`/`rememberSaveable`. What's lost: everything in Activity fields, local variables, non-saved state.",
          "**Common bug**: storing screen data in Activity fields → it vanishes on rotation → the screen resets. The fix is architectural: put state in a ViewModel (survives) and small UI state in saved instance state.",
        ],
      },
    ],
  },
  {
    heading: "onSaveInstanceState / onRestoreInstanceState",
    blocks: [
      {
        t: "p",
        text: "`onSaveInstanceState(Bundle)` is called before an Activity *may* be destroyed (configuration change, or the system killing it in the background to reclaim memory). You write small key-value data into the `Bundle`; it's handed back in `onCreate` (and `onRestoreInstanceState`) when the Activity is recreated. This is how you preserve transient UI state across both configuration changes *and* process death.",
      },
      {
        t: "code",
        title: "Saving and restoring state",
        code: `override fun onSaveInstanceState(outState: Bundle) {
    super.onSaveInstanceState(outState)
    outState.putString("query", currentQuery)   // small, Bundle-able data only
}

override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    val restored = savedInstanceState?.getString("query")
}`,
      },
      {
        t: "list",
        items: [
          "**For small transient UI state only**: scroll position, text input, selected tab. It uses the same `Bundle` mechanism as everything else, so it must be *small* and *Parcelable/Serializable* — the Binder transaction limit (~1MB, shared) means dumping large data causes `TransactionTooLargeException`.",
          "**Not for large data**: screen data (a list of items, a user object) belongs in a ViewModel (config change) and a repository/database (process death). Save *ids* and reload, not the data itself.",
          "**When it's called**: before a *possible* destruction — so it runs on config change and on background process kills, but NOT when the user explicitly finishes the Activity (back press / finish), because then there's nothing to restore.",
          "**Modern equivalents**: `rememberSaveable` in Compose and `SavedStateHandle` in ViewModels both build on this same mechanism — they're the idiomatic ways to use saved instance state today.",
        ],
      },
    ],
  },
  {
    heading: "Configuration change vs process death",
    blocks: [
      {
        t: "table",
        headers: ["", "Configuration change", "Process death (background kill)"],
        rows: [
          ["What happens", "Activity destroyed & recreated; process lives", "entire process killed by the system"],
          ["ViewModel", "survives (retained)", "destroyed — recreated fresh"],
          ["Activity fields / in-memory state", "lost", "lost"],
          ["onSaveInstanceState Bundle", "restored", "restored (this is its main purpose)"],
          ["How to test", "rotate the device", "background app, kill via Android Studio / adb, relaunch"],
        ],
      },
      {
        t: "note",
        text: "Interview essentials to state: the seven callbacks and their pairs; `onPause` must be fast; configuration changes *recreate* the Activity by default (losing field state); `onSaveInstanceState` preserves *small* transient UI state across recreation AND process death; ViewModel survives config change but NOT process death — so the robust pattern is ViewModel (config change) + SavedStateHandle/persistent layer (process death).",
      },
    ],
  },
];

export default content;
