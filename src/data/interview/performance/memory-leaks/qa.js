// Memory Leaks & Management — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What is a memory leak and why are they especially bad on Android?",
    a: [
      {
        t: "p",
        text: "**A memory leak is when an object that's no longer needed can't be garbage-collected because something still holds a reference to it — so it stays in memory, wasting it.** The garbage collector reclaims objects that are no longer *reachable* from a long-lived anchor (a GC root); if a dead object is still reachable through some reference chain, GC can't collect it, and it leaks.",
      },
      {
        t: "p",
        text: "**On Android, the classic and worst case is a leaked Activity.** When an Activity is destroyed (which happens often — every rotation), it *should* be collected. But if some longer-lived object still references it, the entire Activity stays in memory — and because an Activity holds its whole view hierarchy (and views hold large bitmaps), leaking one Activity can leak megabytes. Rotate the screen a few times with a leak and you accumulate multiple leaked Activities. The consequences compound: growing memory usage triggers more frequent garbage collection (which pauses the app, causing jank), and eventually the app runs out of memory and crashes with `OutOfMemoryError`. So leaks degrade performance gradually (via GC pressure) before they crash — which is why they're especially damaging on memory-constrained mobile devices, and why detecting them (with LeakCanary) is standard practice.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are common causes of memory leaks in Android?",
    a: [
      {
        t: "list",
        items: [
          "**Static references to a Context, View, or Activity** — static fields live for the whole process, so anything they reference can *never* be collected. Storing an Activity or View in a `companion object`/static field pins it forever.",
          "**Non-static inner classes** — an inner class (including anonymous ones: listeners, Handlers, old AsyncTasks) *implicitly* holds a reference to its outer class (often an Activity). If the inner object outlives the Activity (a pending Handler message, a running background task), it leaks the Activity.",
          "**Unregistered listeners/callbacks** — registering a BroadcastReceiver, sensor listener, or callback on a long-lived object (a singleton, a system service) and forgetting to unregister keeps the registrant (usually an Activity) alive.",
          "**Handlers with delayed messages** — a `postDelayed` message holds the Handler (which if inner holds the Activity) until the delay elapses.",
          "**Activity context in a singleton** — giving a long-lived singleton an Activity context (instead of the application context) pins the Activity.",
          "**Uncancelled coroutines/threads** — a `GlobalScope` coroutine or raw thread capturing an Activity keeps it alive until the work finishes.",
        ],
      },
      {
        t: "p",
        text: "The common thread in all of them is a **long-lived object holding a reference to a short-lived one** (usually an Activity/View/Context). The fixes follow: use the application context (not Activity) for long-lived objects, unregister listeners in the mirror lifecycle callback, make inner classes static (or use WeakReference), remove delayed Handler messages, and use lifecycle-scoped coroutines (`viewModelScope`) that auto-cancel rather than `GlobalScope`. Modern architecture (ViewModels that never reference Views, lifecycle scopes, lifecycle-aware observation) prevents most of these automatically.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is LeakCanary and how do you use it?",
    a: [
      {
        t: "p",
        text: "**LeakCanary is the standard library for automatically detecting memory leaks in debug builds. You add it as a debug-only dependency and it works with no code — it monitors destroyed Activities, Fragments, ViewModels, and views, and when one that should have been garbage-collected wasn't, it detects the leak and shows you the exact reference chain keeping it alive.**",
      },
      {
        t: "code",
        title: "Adding it — that's the whole setup",
        code: `debugImplementation("com.squareup.leakcanary:leakcanary-android:2.x")`,
      },
      {
        t: "list",
        items: [
          "**How it works**: it holds *weak references* to destroyed objects, forces a garbage collection after they should be collectible, and if they're still in memory, it dumps the heap and computes the *shortest strong-reference path* from a GC root to the leaked object — telling you precisely what is holding it.",
          "**Reading the result**: it notifies you with a leak trace showing the chain, e.g. the Activity being held by a static field or an inner Handler — pointing directly at the culprit so you know what reference to break.",
          "**Debug-only** — you use `debugImplementation` so it never ships in release (it's heavy: heap dumps and monitoring would hurt production performance).",
        ],
      },
      {
        t: "p",
        text: "The value is that leaks are otherwise *invisible* until they crash — LeakCanary surfaces them during development, automatically, with the exact cause. For leaks it doesn't auto-catch, or for general memory investigation, the Android Studio Memory Profiler lets you capture heap dumps manually and inspect object retention and reference chains. But for the common Activity/Fragment/ViewModel leaks, LeakCanary's zero-setup automatic detection is the go-to tool.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a WeakReference and when would you use one?",
    a: [
      {
        t: "p",
        text: "**A `WeakReference` lets you reference an object *without* keeping it alive — unlike a normal (strong) reference, a weak reference doesn't prevent garbage collection, so the object can be collected even while weakly referenced (after which the weak reference returns null).** It's a tool for referencing something without pinning it in memory.",
      },
      {
        t: "list",
        items: [
          "**The contrast**: a *strong* reference (the default) keeps an object alive as long as it exists — this is what causes leaks (a long-lived object strongly referencing a short-lived one). A *weak* reference doesn't, so GC can reclaim the target when nothing *strongly* references it.",
          "**Classic use**: a `Handler` that needs to reference its Activity can hold a `WeakReference<Activity>` instead of a strong one, so a pending delayed message doesn't leak the Activity — when the Activity is destroyed, GC can collect it and the weak reference just returns null (which the Handler checks before using).",
          "**`SoftReference`** is related — collected only when memory is *low* (more lenient than weak), historically used for memory-sensitive caches.",
        ],
      },
      {
        t: "p",
        text: "The important nuance for an interview: `WeakReference` is a *targeted tool*, not the first resort. Usually the *better* fix for a leak is to remove the strong reference at the right lifecycle moment — unregister the listener, cancel the coroutine, null out the reference in `onDestroy`, use the application context — rather than weakly holding it. Reaching for `WeakReference` everywhere is a code smell that hides the real problem (a reference that shouldn't exist at that lifetime). Use it specifically when an object *legitimately* needs to reference a shorter-lived one without pinning it and there's no clean lifecycle point to clear the reference. Modern architecture (lifecycle scopes, ViewModels without View refs) makes explicit WeakReference use rarely necessary.",
      },
    ],
  },
  {
    level: "senior",
    q: "Why must a ViewModel never hold a reference to a View or Activity, in terms of memory?",
    a: [
      {
        t: "p",
        text: "**Because a ViewModel *outlives* the Activity/View — it survives configuration changes — so if it holds a reference to one, that Activity/View can't be garbage-collected when it's destroyed, leaking it (and its entire view hierarchy). This is a structural leak guaranteed by the ViewModel's lifecycle, not an accidental one.**",
      },
      {
        t: "list",
        items: [
          "**The lifetime mismatch**: a ViewModel is retained across configuration changes — when the Activity is destroyed and recreated on rotation, the *same* ViewModel instance persists (that's its whole purpose). So the ViewModel lives *longer* than any single Activity instance. If it holds a reference to the destroyed Activity (or a View, or an Activity `Context`), that Activity can't be collected — it's pinned by the surviving ViewModel until the ViewModel itself is cleared. On rotation, you'd leak the old Activity every time.",
          "**The magnitude**: leaking an Activity means leaking its entire view tree, all its bitmaps, and everything those hold — potentially megabytes per leaked instance. And it happens on *every* rotation, so it accumulates fast.",
          "**Why it's structural**: this isn't a subtle bug you might avoid — the ViewModel's longer lifetime makes *any* View/Activity reference in it a leak by construction. That's why the rule is absolute: a ViewModel must be framework-free, referencing no View, Activity, Fragment, or Activity Context.",
        ],
      },
      {
        t: "list",
        items: [
          "**How the architecture avoids it**: the ViewModel exposes *state* (via `StateFlow`/`LiveData`) that the View *observes* — the View references the ViewModel, never the reverse. So data flows to the UI without the ViewModel holding the UI. If the ViewModel needs application-level context (rare — usually a sign work belongs elsewhere), it uses the *application* context (a process-lifetime singleton, safe) via `AndroidViewModel` or DI's `@ApplicationContext`, never an Activity context.",
          "**The general principle it illustrates**: memory leaks come from *long-lived objects referencing short-lived ones*. The ViewModel-View rule is the cleanest example — the framework deliberately gives the ViewModel a longer lifetime (to survive rotation), which is exactly why it must not reference the shorter-lived UI. Understanding *why* (the lifetime relationship) rather than just memorizing the rule is what distinguishes real understanding.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: this rule is the intersection of the ViewModel's config-change-survival benefit and memory safety — the very property that makes ViewModels useful (outliving the Activity) is what makes referencing the Activity a guaranteed leak. So the architecture is designed around one-directional references (View → ViewModel → data, never back) and framework-free ViewModels precisely to make this class of leak *impossible by construction*. It's a great example of how good architecture prevents whole categories of bugs — follow the pattern (observe state, never reference the View) and the leak can't happen; violate it and you leak an Activity on every rotation. Being able to explain the lifetime mismatch and connect it to the general 'long-lived references short-lived' leak principle is the complete answer.",
      },
    ],
  },
  {
    level: "senior",
    q: "How would you investigate and fix a memory leak in a production app?",
    a: [
      {
        t: "p",
        text: "**I'd combine automated detection (LeakCanary in debug), heap analysis (Memory Profiler / heap dumps), and production signals (crash reports, memory metrics), then trace the reference chain to the root cause and break the offending reference — verifying the fix with the same tools.** Here's the systematic approach:**",
      },
      {
        t: "list",
        items: [
          "**1. Detect and reproduce**: in *debug*, LeakCanary automatically catches leaked Activities/Fragments/ViewModels and shows the reference chain — often the fastest path to the cause. Reproduce the leak by exercising the suspect flow (rotate the screen repeatedly, navigate in and out of a screen) and watch memory/LeakCanary. For leaks that only show in production, use *crash reports* (OutOfMemoryError frequency) and *memory metrics* (Play Console's Android Vitals reports excessive memory usage; custom memory logging) to identify which screens/flows correlate with growth.",
          "**2. Capture a heap dump**: use the Android Studio *Memory Profiler* to capture a heap dump at the moment of suspected leak (e.g. after navigating away from a screen and forcing GC). Look for *retained* instances that shouldn't still exist — e.g. multiple `MainActivity` instances when there should be one (a smoking gun for an Activity leak).",
          "**3. Trace the reference chain**: for a leaked object, find the *shortest strong-reference path from a GC root* to it (LeakCanary computes this automatically; the profiler lets you navigate references manually). This chain tells you *exactly what is holding what* — e.g. `Activity ← inner Handler ← pending message`, or `Activity ← static field`, or `Activity ← listener registered on a singleton`.",
          "**4. Identify the root cause pattern**: map the chain to a known leak pattern — static context, inner class, unregistered listener, Activity context in a singleton, uncancelled coroutine, wrong lifecycle owner in a Fragment (`this` instead of `viewLifecycleOwner`). The chain points at the specific bad reference.",
          "**5. Fix by breaking the reference at the right lifecycle point**: unregister the listener in `onDestroy`/`onStop` (or `onDispose` in Compose); use the application context instead of Activity context for the long-lived holder; cancel the coroutine (use a lifecycle scope, not GlobalScope); remove delayed Handler messages; make an inner class static + WeakReference; null out a ViewBinding in `onDestroyView`; use `viewLifecycleOwner` for Fragment observation. Choose the fix that removes the reference at the correct lifetime rather than papering over it.",
          "**6. Verify**: re-run the reproduction with LeakCanary/profiler and confirm the object is now collected (no retained instances, no leak notification). Add the fix and, where possible, a test or lint rule to prevent regression.",
        ],
      },
      {
        t: "list",
        items: [
          "**Prevention going forward**: adopt the architecture that prevents leaks structurally (ViewModels without View refs, lifecycle-scoped coroutines, lifecycle-aware observation, `viewLifecycleOwner` in Fragments, application context in singletons), and keep LeakCanary in debug so new leaks are caught during development, not in production.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: leak investigation is fundamentally about *finding what's holding a reference that shouldn't exist* — the whole game is tracing the reference chain from a GC root to the leaked object, which tells you the culprit. LeakCanary automates this in debug (and is the first tool to reach for); the Memory Profiler and heap dumps handle deeper or production-informed investigation; and production signals (OOM crashes, memory vitals) tell you *where* to look. The fix is always to break the offending reference *at the right lifecycle moment*, and the durable solution is architecture that makes the reference impossible in the first place. Being able to lay out this detect → dump → trace-chain → identify-pattern → fix → verify workflow, and connect the fixes to the leak patterns and preventive architecture, is the comprehensive, senior-level answer.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between a memory leak and high memory usage?",
    a: [
      {
        t: "p",
        text: "*High memory usage* is legitimately holding a lot of memory you're using (big caches, bitmaps) — it can be fine or intentional. A *memory leak* is holding memory you *no longer need* because a stale reference prevents GC. High usage plateaus; a leak *grows unboundedly* over time (each leaked instance accumulates), eventually causing `OutOfMemoryError`. The tell of a leak is monotonic growth without a corresponding increase in actual work.",
      },
      {
        t: "list",
        items: [
          "**High usage** — legitimately holding memory you use; may plateau.",
          "**Leak** — holding memory you no longer need; grows unboundedly.",
          "**Tell of a leak** — monotonic growth without more actual work.",
          "**Endgame of a leak** — `OutOfMemoryError`.",
        ],
      },
      {
        t: "note",
        text: "High memory usage = legitimately holding memory you use (may plateau, can be fine). A leak = holding memory you no longer need (stale reference blocks GC) — grows unboundedly, eventually OOM. The tell of a leak is monotonic growth without a matching increase in work.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does a static reference cause a memory leak?",
    a: [
      {
        t: "p",
        text: "A `static` field lives for the *entire process lifetime* (it's a GC root via the class). If it references an Activity, View, or Context — directly or through a chain — that object can never be collected while the process lives, even after the Activity is destroyed. Classic example: a `static` variable holding a Context, or a static list/cache that accumulates objects tied to Activities. Fix: don't store Contexts/Views statically; use the Application Context if you truly need a long-lived Context.",
      },
      {
        t: "code",
        title: "A static leak",
        code: `object Cache {\n    // BAD: static holds Activity Context for the whole process\n    var context: Context? = null\n}\n// setting Cache.context = this (an Activity) leaks the Activity forever\n// FIX: store applicationContext, or don't store Context at all`,
      },
      {
        t: "note",
        text: "A static field is a GC root living for the whole process — if it references an Activity/View/Context (directly or via a chain), that object never gets collected (leak). Classic: static Context or a static cache accumulating Activity-tied objects. Fix: never store Contexts/Views statically; use applicationContext if a long-lived Context is truly needed.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do non-static inner classes and anonymous classes cause leaks?",
    a: [
      {
        t: "p",
        text: "A non-static inner class (and any anonymous class / lambda that captures) holds an *implicit reference to its outer instance*. If such an object (a `Handler`, `Runnable`, listener, callback) outlives the Activity — e.g. it's posted with a delay, or held by a long-lived object — it keeps the *entire outer Activity* alive → leak. Fix: use `static`/top-level classes with a `WeakReference` to the Activity, or cancel/remove the callback in `onDestroy`, or use lifecycle-aware scopes.",
      },
      {
        t: "code",
        title: "Leaky anonymous Runnable",
        code: `// BAD: anonymous Runnable captures the Activity; posted delayed → leaks it\nhandler.postDelayed({ updateUi() }, 60_000)\n// FIX: remove callbacks in onDestroy, or use lifecycleScope which auto-cancels\noverride fun onDestroy() { handler.removeCallbacksAndMessages(null); super.onDestroy() }`,
      },
      {
        t: "note",
        text: "Non-static inner/anonymous classes (and capturing lambdas) hold an implicit reference to the outer instance — if such an object (Handler/Runnable/listener) outlives the Activity, it keeps the whole Activity alive (leak). Fix: static class + WeakReference, remove callbacks in onDestroy, or lifecycle-aware scopes (lifecycleScope) that auto-cancel.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do unregistered listeners and receivers cause leaks?",
    a: [
      {
        t: "p",
        text: "When an Activity/Fragment registers a callback with a *longer-lived* object (a `BroadcastReceiver`, `LocationListener`, `SensorEventListener`, an event bus, a singleton observer), that object holds a reference to the listener (often the Activity). If you don't *unregister* it in the matching lifecycle callback (`onStop`/`onDestroy`), the Activity leaks. Rule: every `register` needs a matching `unregister`; every `add(listener)` needs a `remove`. Lifecycle-aware components (`lifecycleScope`, `repeatOnLifecycle`, `LiveData`) handle this automatically.",
      },
      {
        t: "list",
        items: [
          "**Long-lived object holds the listener** — often the Activity.",
          "**No unregister** → Activity leaks.",
          "**Rule** — every register/add needs an unregister/remove.",
          "**Lifecycle-aware** — LiveData/repeatOnLifecycle handle it automatically.",
        ],
      },
      {
        t: "note",
        text: "Registering a callback with a longer-lived object (receiver, sensor/location listener, event bus, singleton) makes it hold the listener (often the Activity) — no unregister in onStop/onDestroy → leak. Rule: every register/add needs a matching unregister/remove. Lifecycle-aware components (LiveData, repeatOnLifecycle) handle it automatically.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between Activity Context and Application Context for leaks?",
    a: [
      {
        t: "p",
        text: "The *Activity Context* is tied to the Activity's lifecycle — holding it beyond the Activity's life leaks the whole Activity (and its views). The *Application Context* lives for the entire process, so it's safe to hold long-term (in singletons). Rule of thumb: for anything that *outlives* an Activity (a singleton, a cache, a long-lived manager), use `applicationContext`; use the Activity Context only for UI things (inflating views, showing dialogs) that are inherently Activity-scoped.",
      },
      {
        t: "list",
        items: [
          "**Activity Context** — Activity-lifecycle-scoped; holding it long leaks the Activity.",
          "**Application Context** — process-lifetime; safe to hold long-term.",
          "**Long-lived** — use `applicationContext` (singletons/caches/managers).",
          "**Activity Context** — only for UI (inflation, dialogs, themed views).",
        ],
      },
      {
        t: "note",
        text: "Activity Context is Activity-lifecycle-scoped — holding it beyond the Activity leaks it (+ views). Application Context lives for the whole process — safe for singletons/caches. Rule: anything outliving an Activity uses applicationContext; use the Activity Context only for UI (inflation, dialogs, themed views).",
      },
    ],
  },
  {
    level: "senior",
    q: "How can coroutines cause memory leaks?",
    a: [
      {
        t: "p",
        text: "A coroutine launched in a scope that *isn't cancelled* keeps its captured references (Activity, View) alive while it runs — e.g. `GlobalScope.launch { ... }` capturing an Activity, or a scope you never cancel. If the coroutine is long-running/suspended and the Activity is destroyed, the Activity leaks until the coroutine completes. Fix: use *lifecycle-aware scopes* (`viewModelScope`, `lifecycleScope`) that auto-cancel, and never use `GlobalScope` for UI-tied work.",
      },
      {
        t: "list",
        items: [
          "**Uncancelled scope** — keeps captured Activity/View alive while running.",
          "**`GlobalScope`** — never cancelled; classic leak source.",
          "**Fix** — `viewModelScope`/`lifecycleScope` auto-cancel.",
          "**Never** — `GlobalScope` for UI-tied work.",
        ],
      },
      {
        t: "note",
        text: "A coroutine in an uncancelled scope keeps its captured references (Activity/View) alive while running — GlobalScope.launch capturing an Activity, or a never-cancelled scope, leaks a destroyed Activity until it completes. Fix: lifecycle-aware scopes (viewModelScope/lifecycleScope) that auto-cancel; never GlobalScope for UI work.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a GC root, and why does it matter for leaks?",
    a: [
      {
        t: "p",
        text: "A *GC root* is an always-reachable anchor the garbage collector starts from — static fields, active threads, the stack of running methods, JNI references. An object is *reachable* (not collectable) if there's a reference chain from *some GC root* to it. A leak is exactly this: a dead object still reachable from a GC root via some chain. To *fix* a leak you find and break that chain — which is why leak tools show you the *reference chain from a GC root* to the leaked object.",
      },
      {
        t: "list",
        items: [
          "**GC root** — always-reachable anchor (statics, threads, stacks, JNI).",
          "**Reachable** — a chain from a root exists → not collectable.",
          "**Leak** — dead object still reachable from a root.",
          "**Fix** — break the reference chain (tools show it).",
        ],
      },
      {
        t: "note",
        text: "A GC root is an always-reachable anchor (static fields, threads, method stacks, JNI). An object is reachable (not collectable) if a chain from some GC root reaches it. A leak = a dead object still reachable from a root. Fixing means breaking that chain — why leak tools show the reference chain from a GC root.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between SoftReference, WeakReference, and PhantomReference?",
    a: [
      {
        t: "p",
        text: "All are references that don't prevent collection as strongly as a normal (*strong*) reference. A *WeakReference* is collected at the next GC once no strong refs remain (good for caches/back-references you want gone promptly). A *SoftReference* is kept until the JVM needs memory (collected under memory pressure — a memory-sensitive cache, though `LruCache` is usually preferred). A *PhantomReference* is for cleanup actions after collection (advanced, rarely used in app code).",
      },
      {
        t: "table",
        headers: ["Reference", "Collected when", "Use"],
        rows: [
          ["Strong", "Never (while referenced)", "Normal references"],
          ["Soft", "Under memory pressure", "Memory-sensitive cache"],
          ["Weak", "Next GC (no strong refs)", "Back-references, canonical maps"],
          ["Phantom", "After finalization", "Post-collection cleanup (rare)"],
        ],
      },
      {
        t: "note",
        text: "Weak: collected at next GC once no strong refs (back-refs, prompt-clear caches). Soft: kept until memory pressure (memory-sensitive cache, though LruCache is usually better). Phantom: post-collection cleanup (rare). All allow collection that a strong reference would prevent.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does LeakCanary detect leaks under the hood?",
    a: [
      {
        t: "p",
        text: "LeakCanary hooks into lifecycle to know when objects *should* be gone (destroyed Activities/Fragments, cleared ViewModels). It holds a `WeakReference` to each and, after they should be collected, triggers a GC and checks whether the weak reference was cleared. If the object is *still retained*, LeakCanary dumps the heap, analyzes it (using Shark) to find the *shortest strong reference chain from a GC root* to the leaked object, and reports that chain — telling you exactly what's holding it.",
      },
      {
        t: "list",
        items: [
          "**Watches** — destroyed Activities/Fragments, cleared ViewModels.",
          "**WeakReference + GC** — checks if the object was collected.",
          "**Still retained** → heap dump + Shark analysis.",
          "**Reports** — shortest strong reference chain from a GC root.",
        ],
      },
      {
        t: "note",
        text: "LeakCanary watches objects that should die (destroyed Activities/Fragments, cleared ViewModels) via WeakReference; after they should be collected it GCs and checks if the ref cleared. Still retained → heap dump + Shark analysis → reports the shortest strong reference chain from a GC root to the leak.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you read a heap dump to find a leak?",
    a: [
      {
        t: "p",
        text: "Capture a heap dump (Memory Profiler → 'Dump Java heap', or LeakCanary/MAT). Look for instances that *shouldn't exist* (multiple leaked Activities of the same type after rotations) and inspect the *reference chain (path to GC root)* for one — it shows the exact field/object holding it (a static, a Handler, a listener). That chain names the culprit; break it (unregister, use WeakReference, clear the static). Grouping by class and sorting by *retained size* finds the biggest offenders.",
      },
      {
        t: "list",
        items: [
          "**Capture** — Memory Profiler / LeakCanary / MAT.",
          "**Find** — instances that shouldn't exist (duplicate Activities).",
          "**Reference chain to GC root** — names the culprit field/object.",
          "**Retained size** — sort to find the biggest offenders.",
        ],
      },
      {
        t: "note",
        text: "Capture a heap dump (Memory Profiler 'Dump Java heap' / LeakCanary / MAT), find instances that shouldn't exist (duplicate leaked Activities after rotations), inspect the reference chain (path to GC root) — it names the culprit (static/Handler/listener). Break that chain. Sort by retained size for the biggest offenders.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do bitmaps cause memory problems, and how do you avoid them?",
    a: [
      {
        t: "p",
        text: "Bitmaps are *large* (a full-screen photo can be tens of MB decoded) and dominate an app's memory. Loading full-resolution images into small views wastes memory and risks `OutOfMemoryError`; holding decoded bitmaps in static/long-lived references leaks a lot at once. Avoid by using an image library (Coil/Glide) that downsamples to the target size, caches with size limits (`LruCache`), and recycles/releases. Never keep large bitmaps in static fields.",
      },
      {
        t: "list",
        items: [
          "**Large** — a full-screen photo is tens of MB decoded.",
          "**Downsample** — to the target view size (Coil/Glide).",
          "**Cache with limits** — `LruCache`; don't hold statically.",
          "**Risk** — OOM from full-res decode / static bitmaps.",
        ],
      },
      {
        t: "note",
        text: "Bitmaps are large (a full-screen photo = tens of MB decoded) and dominate app memory — full-res decode into a small view risks OOM; static bitmaps leak a lot. Use Coil/Glide to downsample to target size and cache with size limits (LruCache). Never hold large bitmaps in static fields.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between Java heap and native memory on Android?",
    a: [
      {
        t: "p",
        text: "The *Java (managed) heap* holds Kotlin/Java objects, GC-managed, capped by the per-app heap limit (visible in the Memory Profiler). *Native memory* is allocated by C/C++ (via NDK, some framework internals, older bitmap storage) — not GC-tracked, and native leaks don't show in the Java heap dump. Total app memory (RSS/PSS) includes both plus graphics and code. A growing native footprint (NDK code, native leaks) needs different tools (Native Memory Profiler, `malloc` debug) than Java-heap leak tools.",
      },
      {
        t: "list",
        items: [
          "**Java heap** — managed objects, GC'd, per-app cap.",
          "**Native memory** — C/C++ allocations, not GC-tracked.",
          "**Native leaks** — invisible in Java heap dumps.",
          "**Tools** — Native Memory Profiler for native growth.",
        ],
      },
      {
        t: "note",
        text: "Java (managed) heap: Kotlin/Java objects, GC'd, per-app capped (Memory Profiler). Native memory: C/C++ allocations (NDK, framework internals), not GC-tracked — native leaks don't appear in Java heap dumps. Total RSS/PSS includes both + graphics + code. Native growth needs the Native Memory Profiler, not Java-heap tools.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are onTrimMemory and onLowMemory for?",
    a: [
      {
        t: "p",
        text: "The system calls `onTrimMemory(level)` (and legacy `onLowMemory`) to tell your app the device is under memory pressure or your app went to the background — a hint to *release memory you can rebuild* (caches, bitmaps, non-critical buffers). Responding well reduces the chance the system kills your process to reclaim memory (improving the odds your process survives in the background). The `level` indicates severity (e.g. `TRIM_MEMORY_UI_HIDDEN` when your UI is hidden, up to `TRIM_MEMORY_COMPLETE`).",
      },
      {
        t: "list",
        items: [
          "**Memory-pressure signal** — release rebuildable memory (caches/bitmaps).",
          "**`level`** — severity (UI hidden → complete).",
          "**Benefit** — less likely the process is killed.",
          "**Respond** — trim caches proportionally to the level.",
        ],
      },
      {
        t: "note",
        text: "onTrimMemory(level) (and legacy onLowMemory) signal memory pressure / backgrounding — release rebuildable memory (caches/bitmaps) proportional to the level (UI_HIDDEN → COMPLETE). Responding well lowers the chance the system kills your process to reclaim memory.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you build a cache that doesn't leak?",
    a: [
      {
        t: "p",
        text: "Use a *bounded* cache with an eviction policy — `LruCache` (size-limited by count or bytes, evicts least-recently-used) — rather than an unbounded `HashMap` that grows forever. Cache *values* that don't reference Activities/Views (or use the Application Context). For memory-sensitive caches, `LruCache` sized to a fraction of available heap is standard. Avoid `SoftReference`-based caches (unpredictable GC behavior). Clear/trim caches in `onTrimMemory`.",
      },
      {
        t: "code",
        title: "A bounded LruCache",
        code: `// size = 1/8 of available memory, in KB\nval maxKb = (Runtime.getRuntime().maxMemory() / 1024 / 8).toInt()\nval cache = object : LruCache<String, Bitmap>(maxKb) {\n    override fun sizeOf(key: String, value: Bitmap) = value.byteCount / 1024\n}`,
      },
      {
        t: "note",
        text: "Non-leaking cache: bounded with eviction — LruCache (size-limited by count/bytes, evicts LRU) not an unbounded HashMap. Cache values that don't reference Activities/Views (or use appContext). Size LruCache to a fraction of heap; trim in onTrimMemory. Avoid SoftReference caches (unpredictable).",
      },
    ],
  },
  {
    level: "junior",
    q: "What is memory churn, and how does it relate to GC?",
    a: [
      {
        t: "p",
        text: "*Memory churn* is rapidly allocating and discarding many short-lived objects (e.g. in a loop, `onDraw`, or per-frame code). It's not a leak — the objects *are* collected — but the constant allocation triggers *frequent garbage collection*, and GC pauses cause jank. Reduce churn by allocating outside hot paths, reusing objects, avoiding autoboxing, and using primitive arrays. The Memory Profiler's allocation tracking shows churn as a sawtooth memory graph.",
      },
      {
        t: "list",
        items: [
          "**Churn** — rapid allocate/discard of short-lived objects.",
          "**Not a leak** — but triggers frequent GC → jank.",
          "**Reduce** — allocate outside hot paths, reuse, avoid boxing.",
          "**Sign** — sawtooth memory graph in the profiler.",
        ],
      },
      {
        t: "note",
        text: "Memory churn = rapidly allocating/discarding short-lived objects (loops, onDraw, per-frame). Not a leak (they're collected) but triggers frequent GC → jank. Reduce: allocate outside hot paths, reuse objects, avoid autoboxing, use primitive arrays. Shows as a sawtooth graph in the Memory Profiler.",
      },
    ],
  },
  {
    level: "senior",
    q: "How can a Fragment leak, and what is the Fragment view-lifecycle pitfall?",
    a: [
      {
        t: "p",
        text: "A Fragment can outlive its *view* — the Fragment instance survives (e.g. on the back stack) while its view is destroyed and recreated. Holding view references (or binding) in Fragment fields past `onDestroyView` leaks the old view hierarchy. Fix: null out the binding in `onDestroyView`, and observe with `viewLifecycleOwner` (not the Fragment) so observers are removed when the view dies. Also, a Fragment held by a longer-lived object (or a leaked Activity) leaks like any object.",
      },
      {
        t: "code",
        title: "Safe Fragment view binding",
        code: `private var _binding: FooBinding? = null\nprivate val binding get() = _binding!!\noverride fun onCreateView(...) = FooBinding.inflate(inflater).also { _binding = it }.root\noverride fun onDestroyView() { _binding = null; super.onDestroyView() } // avoid leaking the view`,
      },
      {
        t: "note",
        text: "A Fragment outlives its view (survives on back stack while the view is recreated) — holding view refs/binding past onDestroyView leaks the old hierarchy. Fix: null the binding in onDestroyView; observe with viewLifecycleOwner (not the Fragment) so observers clear when the view dies.",
      },
    ],
  },
  {
    level: "junior",
    q: "What tools besides LeakCanary help find memory issues?",
    a: [
      {
        t: "p",
        text: "The *Android Studio Memory Profiler* shows live memory, allocation tracking, and captures Java heap dumps to inspect instances and reference chains. *Perfetto* traces memory over time. *MAT (Eclipse Memory Analyzer)* does deep heap-dump analysis (dominator tree, retained sizes). For native memory, the *Native Memory Profiler*. Play vitals reports *excessive memory* / OOM crashes in production. LeakCanary is best for *automatic* detection in debug; these others for *investigation* and native/production insight.",
      },
      {
        t: "list",
        items: [
          "**Memory Profiler** — live memory, allocations, heap dumps.",
          "**MAT** — deep heap analysis (dominator tree, retained size).",
          "**Native Memory Profiler** — native allocations.",
          "**Play vitals** — production OOM/excessive-memory reports.",
        ],
      },
      {
        t: "note",
        text: "Beyond LeakCanary (automatic debug detection): Memory Profiler (live memory, allocation tracking, heap dumps + reference chains), MAT (deep heap analysis — dominator tree, retained size), Native Memory Profiler (native), Perfetto (memory over time), Play vitals (production OOM). LeakCanary for detection; others for investigation.",
      },
    ],
  },
  {
    level: "senior",
    q: "Why is a ViewModel a safe place for state across config changes but a dangerous place for a Context?",
    a: [
      {
        t: "p",
        text: "A `ViewModel` *survives* configuration changes (it's retained across the Activity recreation and only cleared in `onCleared` when the scope is truly gone) — perfect for UI state. But that very survival makes holding an *Activity Context or View* dangerous: after a rotation the old Activity is destroyed but the ViewModel (holding it) lives on → leaked Activity. Rule: ViewModels hold *state and app-scoped dependencies* (use `AndroidViewModel`'s Application if you need a Context), never Activity/View references.",
      },
      {
        t: "list",
        items: [
          "**Survives config changes** — great for UI state.",
          "**That survival** — makes holding an Activity/View a leak.",
          "**After rotation** — old Activity destroyed, ViewModel lives → leak.",
          "**Rule** — state + app-scoped deps only; Application Context via `AndroidViewModel`.",
        ],
      },
      {
        t: "note",
        text: "A ViewModel survives config changes (cleared only in onCleared) — ideal for UI state, but that survival makes holding an Activity Context/View a leak (post-rotation the old Activity is destroyed while the ViewModel lives). Rule: ViewModels hold state + app-scoped deps only; use AndroidViewModel's Application if a Context is needed.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do RxJava/Flow subscriptions leak, and how do you prevent it?",
    a: [
      {
        t: "p",
        text: "A subscription (RxJava `Disposable`, a `Flow` collection) that isn't cancelled keeps its downstream (often capturing a View/Activity) alive as long as the upstream lives. In RxJava, not disposing subscriptions in `onDestroy` (or not using a `CompositeDisposable`) leaks. In Flow, collecting in a non-lifecycle scope, or not using `repeatOnLifecycle`/`flowWithLifecycle`, keeps collecting (and holding the collector) after the view is gone. Fix: tie subscriptions to lifecycle (`CompositeDisposable.clear()` in `onDestroy`; `repeatOnLifecycle` for Flow).",
      },
      {
        t: "list",
        items: [
          "**Uncancelled subscription** — keeps the capturing collector alive.",
          "**RxJava** — dispose via `CompositeDisposable` in `onDestroy`.",
          "**Flow** — collect with `repeatOnLifecycle`/`flowWithLifecycle`.",
          "**Root cause** — subscription outliving the view.",
        ],
      },
      {
        t: "note",
        text: "An uncancelled subscription (Rx Disposable, Flow collection) keeps its downstream (capturing a View/Activity) alive while upstream lives. RxJava: clear a CompositeDisposable in onDestroy. Flow: collect with repeatOnLifecycle/flowWithLifecycle. Always tie subscription lifetime to the view's lifecycle.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between a memory leak and OutOfMemoryError?",
    a: [
      {
        t: "p",
        text: "A *memory leak* is a cause; `OutOfMemoryError` (OOM) is a possible *consequence*. A leak slowly consumes memory that can't be reclaimed; when the app's heap fills (from leaks, or from a single huge allocation like a giant bitmap), the next allocation throws `OutOfMemoryError` and typically crashes. But OOM isn't always a leak — it can be one legitimately-too-large allocation. So on an OOM, check both: leaks (gradual growth) and oversized allocations (bitmaps, huge lists).",
      },
      {
        t: "list",
        items: [
          "**Leak** — a cause (unreclaimable memory grows).",
          "**OOM** — a consequence (heap full → allocation fails).",
          "**Not always a leak** — can be one huge allocation.",
          "**On OOM** — check gradual growth AND oversized allocations.",
        ],
      },
      {
        t: "note",
        text: "A leak is a cause; OutOfMemoryError is a consequence — the heap fills (from leaks or a single huge allocation like a giant bitmap) and the next allocation throws OOM (crash). OOM isn't always a leak. On OOM, investigate both gradual growth (leaks) and oversized allocations (bitmaps/huge lists).",
      },
    ],
  },
  {
    level: "senior",
    q: "How does a Handler/Looper leak, and how do you prevent it?",
    a: [
      {
        t: "p",
        text: "A `Handler` created on the main thread posts `Message`s/`Runnable`s to the main `Looper`'s queue. A delayed message holds a reference to its `Runnable` (and, if that's an inner class, to the outer Activity) *until it runs* — so a message posted with a long delay keeps the Activity alive after it's destroyed. Prevent it: use a `static` Handler subclass with a `WeakReference` to the Activity, and always `removeCallbacksAndMessages(null)` in `onDestroy`.",
      },
      {
        t: "code",
        title: "Clearing Handler callbacks",
        code: `override fun onDestroy() {\n    handler.removeCallbacksAndMessages(null) // drop pending messages holding this Activity\n    super.onDestroy()\n}`,
      },
      {
        t: "note",
        text: "A Handler posts messages/Runnables to the Looper's queue; a delayed message holds its Runnable (and, if inner, the outer Activity) until it runs — a long delay keeps a destroyed Activity alive. Prevent: static Handler subclass + WeakReference, and removeCallbacksAndMessages(null) in onDestroy.",
      },
    ],
  },
  {
    level: "junior",
    q: "Does a memory leak always crash the app?",
    a: [
      {
        t: "p",
        text: "Not necessarily — a small or slow leak may never fill the heap during a typical session, so the app doesn't crash but still suffers: higher memory use, more frequent GC (jank), and a greater chance the *system kills the process* in the background (losing state). Large or fast-accumulating leaks (leaking Activities with big bitmaps on every rotation) do reach `OutOfMemoryError`. So leaks degrade experience even without a crash — worth fixing regardless.",
      },
      {
        t: "list",
        items: [
          "**Small/slow leak** — may not crash but degrades (GC jank, memory).",
          "**Background kill** — more likely; loses state.",
          "**Large/fast leak** — reaches OutOfMemoryError.",
          "**Fix regardless** — leaks hurt experience even without a crash.",
        ],
      },
      {
        t: "note",
        text: "Not always — a small/slow leak may never fill the heap in a session (no crash) but still causes higher memory, more GC (jank), and a greater chance the system kills the backgrounded process (lost state). Large/fast leaks do reach OOM. Leaks degrade UX even without crashing, so fix them regardless.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you confirm you've actually fixed a leak?",
    a: [
      {
        t: "p",
        text: "Reproduce the leak scenario (e.g. open/close the screen or rotate several times), then verify the object is *gone*: with LeakCanary, no leak is reported; in the Memory Profiler, capture a heap dump and confirm there are *no lingering instances* of the class (e.g. zero old Activities), and that memory returns to baseline after GC. Automate a regression guard where feasible. Don't rely on 'memory looks lower' — confirm the specific instances no longer exist via a heap dump.",
      },
      {
        t: "list",
        items: [
          "**Reproduce** — repeat the leak scenario (open/close, rotate).",
          "**LeakCanary** — no leak reported.",
          "**Heap dump** — zero lingering instances of the class.",
          "**Confirm** — memory returns to baseline after GC; guard against regression.",
        ],
      },
      {
        t: "note",
        text: "Confirm a leak fix by reproducing the scenario (open/close, rotate several times), then verifying the object is gone: LeakCanary reports nothing, and a heap dump shows zero lingering instances of the class with memory returning to baseline after GC. Don't trust 'memory looks lower' — confirm the specific instances via heap dump; add a regression guard.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you prevent leaks in a long-lived singleton or manager?",
    a: [
      {
        t: "p",
        text: "Singletons live for the whole process, so *anything they reference lives forever*. Rules: (1) never store Activity/View/Fragment references or Activity Contexts — use `applicationContext`; (2) if a singleton must hold transient callbacks/listeners, use `WeakReference` or require explicit register/unregister tied to lifecycle; (3) bound any internal caches. A singleton holding a Context is the single most common singleton leak — inject the Application Context, not an Activity.",
      },
      {
        t: "list",
        items: [
          "**Process-lifetime** — its references live forever.",
          "**No Activity/View/Fragment refs** — use `applicationContext`.",
          "**Callbacks** — `WeakReference` or lifecycle-tied register/unregister.",
          "**Bound caches** — inside the singleton.",
        ],
      },
      {
        t: "note",
        text: "A singleton lives for the whole process, so anything it references lives forever. Never store Activity/View/Fragment refs or an Activity Context (use applicationContext); hold callbacks via WeakReference or lifecycle-tied register/unregister; bound internal caches. The classic singleton leak is holding an Activity Context — inject the Application.",
      },
    ],
  },
];

export default qa;
