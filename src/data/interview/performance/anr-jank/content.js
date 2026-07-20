// ANRs, Jank & Rendering — Content tab. Teaching-first.

const content = [
  {
    heading: "The frame budget — the root of smooth UI",
    blocks: [
      {
        t: "p",
        text: "A smooth UI depends on rendering each frame *fast enough*. Displays refresh at a fixed rate — 60Hz means a new frame every **~16.6ms** (120Hz = ~8.3ms). For the UI to be smooth, *all* the work to produce a frame — running your code (recomposition/binding), measuring, laying out, drawing — must finish within that budget. When a frame takes *longer* than the budget, the display can't show a new frame in time, so it repeats the old one: a dropped frame, which the user perceives as a **stutter or jank**. Smooth UI = consistently hitting the frame budget; jank = missing it.",
      },
      {
        t: "list",
        items: [
          "**60fps ≈ 16ms per frame** is the classic target; modern high-refresh displays (90/120Hz) demand even less (~11ms/~8ms). The exact number matters less than the principle: every frame's work must fit the budget.",
          "**Jank** = one or more frames took too long, so frames were dropped → visible stutter, hitchy scrolling, laggy animations. It's a *performance* problem, not a crash — but it's what users *feel* as 'the app is slow/janky'.",
          "**Everything runs on the main thread** for UI, so anything slow on the main thread (in the frame's work *or* blocking it) eats into the budget and causes jank.",
        ],
      },
    ],
  },
  {
    heading: "What causes jank",
    blocks: [
      {
        t: "list",
        items: [
          "**Heavy work on the main thread during a frame** — expensive computation, JSON parsing, sorting a big list, synchronous I/O, or bitmap decoding done in `onBindViewHolder`/a composable/a click handler. Move it off the main thread (coroutines + IO/Default dispatcher).",
          "**Over-drawing / complex layouts** — deeply nested view hierarchies (expensive measure/layout), overdraw (painting the same pixel many times with stacked opaque backgrounds), and unnecessary invalidations. Flatten layouts, remove redundant backgrounds.",
          "**Excessive recomposition (Compose)** — a composable recomposing far more than needed (unstable parameters, reading fast-changing state high up) burns frame time. Fix with stability, keys, and deferring reads (covered in the Compose performance topic).",
          "**Long RecyclerView bind / expensive list items** — each item binds *on the frame* as you scroll; heavy work there (image decode, formatting) drops frames at the scroll edge. Keep binds cheap, use a caching image loader, precompute.",
          "**Main-thread I/O** — reading a file, a database, or SharedPreferences synchronously on the main thread (SharedPreferences' first load is a classic one). Any blocking I/O on the main thread stalls frames.",
          "**GC pauses** — excessive object allocation (churning objects in a tight loop or per-frame) triggers frequent garbage collection, which pauses the app and drops frames. Reduce allocations in hot paths.",
        ],
      },
    ],
  },
  {
    heading: "ANRs — when the main thread blocks too long",
    blocks: [
      {
        t: "p",
        text: "An **ANR (Application Not Responding)** is the extreme case of main-thread blocking: instead of dropping a frame or two (jank), the main thread is blocked so long that the app can't respond to input at all, and the system shows the 'App isn't responding' dialog. **Jank and ANR are the same problem — a blocked/overloaded main thread — at different severities.** Jank is milliseconds over budget; an ANR is *seconds*.",
      },
      {
        t: "list",
        items: [
          "**ANR triggers**: the main thread unresponsive to input for **~5 seconds**; a `BroadcastReceiver`'s `onReceive` taking more than ~10s; a Service not completing in time; or (Android 11+) a slow `ContentProvider` or a deadlock detected in a foreground app.",
          "**The cause is always main-thread blocking** — a long synchronous operation (network on the main thread, a huge database query, heavy computation, a deadlock, waiting on a lock held by another thread). The fix is the same as jank: move slow work off the main thread.",
          "**Deadlocks** are a subtle ANR cause — the main thread waiting on a lock that another thread holds indefinitely. Careful with synchronization involving the main thread.",
          "**Where you see ANRs in production**: Play Console's **Android Vitals** reports your ANR rate (a Play-monitored metric — a high rate hurts your Play ranking and visibility). ANRs are a key quality signal Google tracks.",
        ],
      },
    ],
  },
  {
    heading: "Diagnosing jank and ANRs",
    blocks: [
      {
        t: "list",
        items: [
          "**Systrace / Perfetto** — system-level tracing that shows exactly what the main thread is doing frame by frame, so you can *see* which frames overran and what work caused it. The primary tool for diagnosing jank — it pinpoints the expensive operation on the timeline.",
          "**Android Studio Profiler** — CPU profiler (method traces to find expensive methods), plus the frame-rendering view. Find *what* is taking main-thread time.",
          "**Jank detection APIs** — `FrameMetrics`/`JankStats` (Jetpack) report per-frame durations at runtime, so you can measure and log jank in the field.",
          "**Macrobenchmark + `FrameTimingMetric`** — measures real jank (frame durations) on release builds for specific journeys (scroll the feed), giving objective, reproducible numbers to optimize against and track over time.",
          "**Android Vitals (Play Console)** — production ANR and 'excessive frozen/slow frames' metrics across real users' devices — tells you *whether* you have a problem and on which devices, complementing the local diagnosis of *what*.",
          "**The debug-build caveat** (again): judge rendering performance on *release* builds — debug builds have no R8 and JIT-compile during use, so they're expected to be janky. Measure on release, ideally with baseline profiles applied.",
        ],
      },
    ],
  },
  {
    heading: "Fixing jank — the toolkit",
    blocks: [
      {
        t: "list",
        items: [
          "**Move work off the main thread** — the #1 fix. Network, disk, database, heavy computation → coroutines with `Dispatchers.IO`/`Default`. The main thread should only do UI work, kept short.",
          "**Reduce main-thread work per frame** — cheap RecyclerView binds / composables, precompute/format data off the main thread (in the ViewModel/repository, so the UI receives render-ready data), avoid synchronous I/O.",
          "**Optimize layouts** — flatten view hierarchies (ConstraintLayout in Views, or the single-pass measurement of Compose), remove overdraw (eliminate redundant opaque backgrounds), avoid unnecessary invalidations.",
          "**Optimize rendering** — use a caching image loader (Coil/Glide) with proper downsampling (never decode a huge bitmap into a small view); use `RecyclerView` (or LazyColumn) for large lists instead of loading everything.",
          "**Reduce allocations in hot paths** — avoid creating objects per frame / per bind / in tight loops to cut GC pressure and its pauses.",
          "**Compose-specific** — stability (immutable/stable params), keys in lazy lists, defer high-frequency state reads to layout/draw (lambda modifiers, `graphicsLayer`), and baseline profiles (covered in the Compose performance topic).",
        ],
      },
      {
        t: "note",
        text: "Jank & ANRs: every frame's work (code + measure + layout + draw) must fit the frame budget (~16ms at 60Hz); exceeding it drops frames → jank (stutter). ANR is the extreme — main thread blocked ~5s → 'not responding' dialog (a Play-tracked Vitals metric). Both = an overloaded/blocked main thread at different severities. Causes: heavy work/I/O on the main thread, overdraw/complex layouts, excessive recomposition, expensive list binds, GC pauses. Diagnose with Perfetto/systrace, the profiler, JankStats, Macrobenchmark, and Android Vitals. Fix by moving work off the main thread and reducing per-frame work. Measure on release builds.",
      },
    ],
  },
];

export default content;
