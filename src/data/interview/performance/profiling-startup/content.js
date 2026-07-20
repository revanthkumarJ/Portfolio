// Profiling, Startup & Baseline Profiles — Content tab. Teaching-first.

const content = [
  {
    heading: "Profile, don't guess — the golden rule",
    blocks: [
      {
        t: "p",
        text: "The single most important principle of performance work: **measure before optimizing**. Developers' intuitions about *where* an app is slow are frequently wrong — the actual bottleneck is often somewhere you didn't expect. **Profiling** means measuring your app's real behavior (CPU time, memory, frame timing, network, energy) with tools, to find the *actual* bottleneck, then optimizing that specific thing and *measuring again* to confirm the fix. Optimizing without profiling wastes effort on things that don't matter and can even make things worse.",
      },
      {
        t: "list",
        items: [
          "**The cost of guessing**: you spend time 'optimizing' code that wasn't the bottleneck (no user-visible improvement), while the real problem stays. Or you add complexity (caching, micro-optimizations) that isn't needed, making code harder to maintain for no benefit.",
          "**The workflow**: reproduce the problem → profile to find the bottleneck → fix that specific thing → profile again to confirm improvement → repeat. Measurement bookends every optimization.",
          "**Always profile release builds** — debug builds have no R8 and JIT-compile during use, so their performance is unrepresentative. Optimizing based on debug numbers is optimizing the wrong thing.",
        ],
      },
    ],
  },
  {
    heading: "The Android Studio Profiler",
    blocks: [
      {
        t: "list",
        items: [
          "**CPU Profiler** — records what methods run and how long they take (method traces, or sampled/system traces). Use it to find *where* CPU time goes — the expensive method causing jank or slow startup. It shows call stacks and time attribution.",
          "**Memory Profiler** — tracks allocations and heap usage over time; capture *heap dumps* to inspect all live objects, their retained sizes, and reference chains (for leak hunting and reducing memory footprint).",
          "**Energy Profiler** — shows what's consuming battery (CPU, network, GPS, wakelocks) — for diagnosing battery drain.",
          "**Network Profiler** — inspects network requests/responses, timing, and payload sizes — for finding slow or oversized requests.",
          "**Choosing**: match the tool to the symptom — slow/janky → CPU profiler + Perfetto; growing memory/OOM → Memory profiler; battery drain → Energy profiler; slow loading → Network profiler.",
        ],
      },
    ],
  },
  {
    heading: "Perfetto / systrace — system-level tracing",
    blocks: [
      {
        t: "p",
        text: "**Perfetto** (the modern successor to systrace) captures a detailed *system-level* trace — a timeline showing what every thread (including the main thread and the system) is doing, frame by frame, with your own custom trace markers. It's the primary tool for diagnosing **jank and startup** because it shows *exactly* which frame overran and what work (which method, which thread contention, which lock, which GC pause) caused it, in context.",
      },
      {
        t: "list",
        items: [
          "**Why it's better than the CPU profiler for jank/startup**: it shows the *whole system timeline* — the main thread's frame work, background threads, the system compositor, GC events — so you see not just 'this method is slow' but *why a specific frame missed its budget* (a lock wait, a GC pause, main-thread I/O) in the full context.",
          "**Custom trace markers** — you add `trace(\"myOperation\") { }` markers in your code so they appear on the timeline, letting you measure and locate your own operations precisely.",
          "**Use it for**: jank (which frames drop and why), startup (what happens during launch, on the critical path), thread contention, and general 'where does the time go' at a system level.",
        ],
      },
    ],
  },
  {
    heading: "Benchmarking: Micro and Macro",
    blocks: [
      {
        t: "list",
        items: [
          "**Microbenchmark** (Jetpack) — measures the performance of a *small piece of code* (a function, an algorithm) in isolation, running it many times and reporting precise timing. Use it to compare implementations (is this sort faster?) or catch performance regressions in a specific hot function. It handles warmup and runs on-device for realistic numbers.",
          "**Macrobenchmark** (Jetpack) — measures *whole user journeys* on a *release build* — app startup, scrolling a list — reporting metrics like `StartupTimingMetric` (cold/warm start times) and `FrameTimingMetric` (jank). This is the tool for *realistic, reproducible* performance numbers on the things users actually experience, and for tracking them over time / catching regressions in CI.",
          "**Why Macrobenchmark matters**: it measures on release builds with real journeys, giving objective numbers you can optimize against and regression-test. It's also how you *generate baseline profiles*.",
        ],
      },
    ],
  },
  {
    heading: "App startup and Baseline Profiles",
    blocks: [
      {
        t: "p",
        text: "**Startup time** is a critical metric — users judge an app by how fast it launches, especially cold start. Cold start does the most work (create the process, run `Application.onCreate`, inflate and draw the first frame). The two biggest levers are a *lean startup path* and *baseline profiles*.",
      },
      {
        t: "list",
        items: [
          "**Cold vs warm vs hot start** — cold (process created from scratch, slowest), warm (process alive, Activity recreated), hot (Activity in memory, fastest). Optimize *cold* start — it's the worst and what users judge.",
          "**Lean `Application.onCreate`** — it runs on the main thread on every cold start, so heavy work there directly slows launch. Defer/lazy-init non-critical libraries; use the **App Startup** library to consolidate and order initializers (instead of each library adding its own ContentProvider, each adding cost).",
          "**Baseline Profiles — the biggest single win**: Android ships apps as bytecode that must be compiled to native code; without help, the startup (and first-scroll) code path is *JIT-compiled during* the user's first launch, causing lag. A **Baseline Profile** is a shipped list of hot methods/classes that get *ahead-of-time (AOT) compiled at install time*, so the critical paths are already native on first run. Real impact: commonly **20-40% faster cold startup** and much smoother first scroll.",
          "**Generating one** — a Macrobenchmark test with `BaselineProfileRule` exercises the critical journeys (startup, scroll), recording the hot paths into a `baseline-prof.txt` bundled with the app; the Baseline Profile Gradle plugin automates it. Compose *libraries* ship their own, but your *app's* screens need your own profile.",
          "**Other startup levers** — avoid work before the first frame (show a skeleton, load async), keep the initial layout simple, use the SplashScreen API, and measure startup with `Macrobenchmark`/`adb shell am start -W`.",
        ],
      },
      {
        t: "note",
        text: "Profiling: measure before optimizing (intuitions are often wrong) — profile → fix the real bottleneck → re-measure, on release builds. Tools: Android Studio Profiler (CPU/Memory/Energy/Network), Perfetto/systrace (system timeline — the primary jank/startup tool, shows why a frame overran), Microbenchmark (isolated code) and Macrobenchmark (whole journeys on release — StartupTimingMetric/FrameTimingMetric). Startup: optimize cold start (lean Application.onCreate, App Startup lib) and use Baseline Profiles (AOT-compile the hot path at install → 20-40% faster cold start), generated via Macrobenchmark.",
      },
    ],
  },
];

export default content;
