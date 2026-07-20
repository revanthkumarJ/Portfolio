// Memory Leaks & Management — Content tab. Teaching-first.

const content = [
  {
    heading: "What a memory leak is on Android",
    blocks: [
      {
        t: "p",
        text: "A **memory leak** happens when an object that's no longer needed *can't be garbage-collected* because something still holds a reference to it. On Android, the classic and most damaging leak is a **leaked Activity (or Fragment/View)**: the Activity is destroyed, but some longer-lived object still references it, so the entire Activity — and its whole view hierarchy, bitmaps, and everything it holds — stays in memory. Repeat this (rotate the screen a few times) and you leak multiple Activities, growing memory until the app slows down or crashes with `OutOfMemoryError`.",
      },
      {
        t: "list",
        items: [
          "**How GC works**: the garbage collector reclaims objects that are no longer *reachable* from a 'GC root' (a long-lived anchor like a static field, a running thread, the Application). If a dead Activity is still reachable through some chain of references, GC can't collect it — that's the leak.",
          "**Why Activities are the big leak**: an Activity holds its entire view tree, and views hold bitmaps (often large). Leaking one Activity can leak megabytes. And they're leaked easily because they're destroyed/recreated frequently (rotation).",
          "**Consequences**: growing memory usage → more frequent GC (which pauses the app, causing jank) → eventually `OutOfMemoryError` and a crash. Leaks degrade performance gradually before they crash.",
        ],
      },
    ],
  },
  {
    heading: "Common leak patterns",
    blocks: [
      {
        t: "table",
        headers: ["Pattern", "Why it leaks"],
        rows: [
          ["Static reference to a Context/Activity/View", "static fields live for the whole process — they pin the Activity forever"],
          ["Inner/anonymous class holding an implicit outer reference", "a non-static inner class (a Handler, listener, AsyncTask) implicitly holds the Activity; if it outlives the Activity, it leaks it"],
          ["Long-lived listener/callback not unregistered", "registering a listener on a singleton/manager without unregistering keeps the registrant (often an Activity) alive"],
          ["Handler with delayed messages", "a delayed message holds the Handler, which (if inner) holds the Activity, until the delay elapses"],
          ["Singleton holding an Activity Context", "the singleton lives forever; giving it an Activity context pins the Activity"],
          ["Coroutine/thread capturing an Activity, not cancelled", "a running coroutine (GlobalScope) or thread capturing the Activity keeps it alive until it finishes"],
        ],
      },
      {
        t: "list",
        items: [
          "**Static references** — a `companion object` or static field holding a `Context`, `View`, or `Activity`. Statics live for the whole process, so whatever they reference can never be collected. Never store an Activity/View in a static field.",
          "**Inner classes** — a non-static inner class (including anonymous ones — listeners, `Handler`s, old `AsyncTask`s) *implicitly* holds a reference to its outer class. If that inner object outlives the Activity (a pending Handler message, a running background task), it leaks the whole Activity.",
          "**Unregistered listeners** — registering a `BroadcastReceiver`, sensor listener, or callback on a long-lived object (a singleton, a system service) and forgetting to unregister keeps the registrant alive. Always unregister in the mirror lifecycle callback.",
          "**Wrong Context** — giving a long-lived object (a singleton, a cache) an *Activity* context instead of the *application* context pins the Activity. Use `applicationContext` for anything that outlives an Activity.",
        ],
      },
    ],
  },
  {
    heading: "How modern architecture prevents most leaks",
    blocks: [
      {
        t: "list",
        items: [
          "**ViewModels + not referencing Views** — the whole reason a ViewModel must never hold a View/Activity/Context: the ViewModel outlives the Activity (survives rotation), so referencing one leaks it. Keeping ViewModels framework-free eliminates a huge class of leaks.",
          "**Lifecycle-scoped coroutines** — `viewModelScope`/`lifecycleScope` cancel their coroutines when the scope dies, so a coroutine capturing UI can't outlive it. Contrast `GlobalScope`, which keeps captured objects alive until the work finishes — a leak source.",
          "**Lifecycle-aware observation** — `collectAsStateWithLifecycle`/`repeatOnLifecycle` stop observing when the UI is gone, so observers don't leak. And `viewLifecycleOwner` in Fragments ties view observation to the view's life (not the Fragment's), preventing the leaked-view bug.",
          "**Compose** — `DisposableEffect`'s `onDispose` unregisters listeners when a composable leaves; `rememberCoroutineScope` cancels on exit. The declarative model with lifecycle-scoped effects avoids many manual-cleanup leaks.",
          "**The pattern**: modern Android (ViewModel + lifecycle scopes + lifecycle-aware observation) is designed so that following the idioms prevents most leaks automatically. Leaks today usually come from *not* following them (GlobalScope, static contexts, unregistered listeners, referencing views from ViewModels).",
        ],
      },
    ],
  },
  {
    heading: "Detecting leaks: LeakCanary",
    blocks: [
      {
        t: "p",
        text: "**LeakCanary** (by Square) is the standard tool for detecting memory leaks in debug builds. You add it as a debug dependency and it works automatically — no code. It watches destroyed Activities, Fragments, ViewModels, and views; if one *should* have been garbage-collected but wasn't (still reachable after destruction), LeakCanary detects it, analyzes the *reference chain* keeping it alive, and shows you a notification with the exact leak path.",
      },
      {
        t: "code",
        title: "Adding LeakCanary (debug only)",
        code: `dependencies {
    debugImplementation("com.squareup.leakcanary:leakcanary-android:2.x")
    // That's it — no code needed. It auto-installs and monitors.
}`,
      },
      {
        t: "list",
        items: [
          "**How it works**: it holds *weak references* to destroyed objects, triggers GC after they should be collectible, and if they're still around, it dumps the heap and computes the *shortest strong reference path* from a GC root to the leaked object — telling you exactly *what* is holding *what*.",
          "**Reading a leak trace**: it shows the chain, e.g. `MainActivity ← this$0 of MyHandler ← ... ← static field`, pointing at the culprit (here a static field or an inner Handler). You fix the leak by breaking that reference (nulling it, unregistering, using the app context, making the inner class static).",
          "**Debug-only** — never ship LeakCanary in release (it's heavy: heap dumps, monitoring). `debugImplementation` scopes it correctly.",
          "**For deeper analysis** — the Android Studio **Memory Profiler** lets you capture a heap dump manually, see all objects and their retained sizes, and trace references — useful for leaks LeakCanary doesn't auto-catch or for general memory investigation.",
        ],
      },
    ],
  },
  {
    heading: "References: strong, weak, soft",
    blocks: [
      {
        t: "list",
        items: [
          "**Strong reference** (the default) — as long as a strong reference exists, the object is *not* collected. Leaks happen because of unwanted strong references from long-lived objects.",
          "**`WeakReference`** — doesn't prevent collection; the object can be GC'd even while weakly referenced (you get null after). Used to reference something *without* keeping it alive — e.g. a Handler holding a `WeakReference` to its Activity, so it doesn't leak it. A pattern for breaking potential leaks.",
          "**`SoftReference`** — collected only when memory is low (more lenient than weak). Historically used for memory-sensitive caches, though modern caching (LruCache) is usually preferred.",
          "**When to reach for WeakReference**: rarely, and as a targeted fix — when an object legitimately needs to reference a shorter-lived one without pinning it. Usually the *better* fix is to remove the reference at the right lifecycle moment (unregister, cancel, null out) rather than weakly holding it. WeakReference is a tool, not the first resort.",
        ],
      },
      {
        t: "note",
        text: "Memory leaks: an object that can't be GC'd because something still references it — classically a leaked Activity (holds its whole view tree → OOM over time). Common causes: static Context/View refs, inner classes implicitly holding the Activity, unregistered listeners, Handlers with delayed messages, Activity context in singletons, uncancelled coroutines. Modern architecture (ViewModel without View refs, lifecycle scopes, lifecycle-aware observation) prevents most. Detect with LeakCanary (debug — auto-finds leaks + reference chain) and the Memory Profiler. WeakReference references without pinning.",
      },
    ],
  },
];

export default content;
