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
];

export default qa;
