// Profiling, Startup & Baseline Profiles — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "Why should you profile before optimizing?",
    a: [
      {
        t: "p",
        text: "**Because developers' intuitions about where an app is slow are frequently wrong — the actual bottleneck is often somewhere you didn't expect — so optimizing without measuring wastes effort on things that don't matter while the real problem stays.** Profiling means measuring your app's real behavior (CPU time, memory, frame timing) with tools to find the *actual* bottleneck, then fixing that specific thing and measuring again to confirm.",
      },
      {
        t: "list",
        items: [
          "**Guessing wastes effort**: you spend time 'optimizing' code that wasn't the bottleneck (no user-visible improvement), while the true problem — which you didn't measure — remains. Or you add unnecessary complexity (caching, micro-optimizations) that makes code harder to maintain for no real gain.",
          "**Optimization can make things worse**: a change that seems faster might not be, or might trade one problem for another. Only measurement tells you whether an optimization actually helped.",
          "**The workflow**: reproduce → profile to find the bottleneck → fix that specific thing → profile again to confirm improvement. Measurement bookends every optimization.",
        ],
      },
      {
        t: "p",
        text: "There's also a critical detail: **profile on release builds**, not debug — debug builds have no R8 optimization and JIT-compile during use, so their performance is unrepresentative, and optimizing based on debug numbers optimizes the wrong thing. The principle is 'measure, don't guess': performance work should be *data-driven*, targeting the proven bottleneck, because the cost of guessing is wasted effort and added complexity with no benefit. This is why every performance answer emphasizes tools (Perfetto, the profiler, Macrobenchmark) — they're how you find the real problem instead of guessing.",
      },
    ],
  },
  {
    level: "junior",
    q: "What tools do you use to profile an Android app?",
    a: [
      {
        t: "list",
        items: [
          "**Android Studio Profiler** — has several views: *CPU* (what methods run and how long — find where CPU time goes), *Memory* (allocations and heap dumps — find leaks and memory usage), *Energy* (battery consumers), and *Network* (request timing and sizes).",
          "**Perfetto / systrace** — captures a system-level trace showing what every thread does frame by frame, with your custom markers. The primary tool for jank and startup — it shows *why* a specific frame overran (a lock wait, GC pause, main-thread I/O) in full system context.",
          "**Macrobenchmark** — measures whole user journeys (startup, scroll) on release builds with objective metrics (`StartupTimingMetric`, `FrameTimingMetric`) — for realistic, reproducible numbers you can track over time.",
          "**Microbenchmark** — measures a small piece of code in isolation, for comparing implementations or catching regressions in a hot function.",
          "**Android Vitals (Play Console)** — production metrics (ANR rate, slow/frozen frames, crashes) across real users' devices — tells you *whether* you have a problem in the field.",
        ],
      },
      {
        t: "p",
        text: "The key is matching the tool to the symptom: slow/janky UI → CPU profiler + Perfetto; growing memory/OOM → Memory profiler + heap dumps + LeakCanary; battery drain → Energy profiler; slow requests → Network profiler; realistic startup/scroll numbers → Macrobenchmark; production reality → Android Vitals. Local tools (profiler, Perfetto) tell you *what* is slow and *why*; Android Vitals tells you *whether and where* (which devices) it matters to real users. A thorough performance investigation uses both — Vitals to find the problem's scope, local profiling to find the cause.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a Baseline Profile and why does it help?",
    a: [
      {
        t: "p",
        text: "**A Baseline Profile is a list of your app's hot code paths (classes and methods) shipped with the app, which the Android runtime *ahead-of-time compiles to native code at install time* — so those critical paths are already fast on the very first run, instead of being JIT-compiled during the user's first launch.** It primarily speeds up cold startup and first-scroll performance.",
      },
      {
        t: "list",
        items: [
          "**The problem it solves**: Android ships apps as bytecode that must be compiled to native code to run fast. Without a baseline profile, the startup and first-scroll code paths are compiled *just-in-time, during* the user's first interaction — causing launch lag and initial jank.",
          "**How it helps**: with a baseline profile listing those hot paths, they're AOT-compiled at *install* time, so they're already native when the user first launches or scrolls. The measured impact is significant — commonly **20-40% faster cold startup** and much smoother first scroll.",
          "**How you generate one**: a Macrobenchmark test with `BaselineProfileRule` exercises the critical journeys (launch the app, scroll the main list), recording the hot methods into a `baseline-prof.txt` that ships with the app.",
        ],
      },
      {
        t: "p",
        text: "It's often the single biggest performance win available, and it's the correct answer to 'the first scroll always stutters but later scrolls are smooth' (that pattern is classic JIT-on-first-use, which baseline profiles fix). One nuance: Compose *libraries* ship their own baseline profiles, so the framework internals are covered — but your *app's* screens aren't, so you must generate a profile for your own critical journeys to get the app-level benefit. Baseline profiles are low-effort (a benchmark test + Gradle plugin) and high-impact, which is why they're strongly recommended for any app where startup and scroll performance matter.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between cold, warm, and hot start, and which do you optimize?",
    a: [
      {
        t: "p",
        text: "**They describe how much work Android must do to bring your app to the foreground, from most to least: cold (the process doesn't exist — create it, run Application.onCreate, create and draw the first Activity — slowest), warm (process alive but the Activity needs recreating — less work), and hot (Activity still in memory, just bring it to front — fastest).** You optimize *cold start* because it does the most work and users judge the app by it, especially on first launch.",
      },
      {
        t: "list",
        items: [
          "**Cold start** — the full launch: fork the process, initialize the runtime, run `Application.onCreate`, then create/inflate/draw the first screen. The slowest and the one to optimize.",
          "**Warm start** — the process is still around but the Activity was destroyed (e.g. in the background); it's recreated. Faster — less to do.",
          "**Hot start** — the Activity is still in memory; the system just brings it forward. Fastest, little to optimize.",
        ],
      },
      {
        t: "p",
        text: "The main levers for cold start: a **lean `Application.onCreate`** (it runs on the main thread on every cold start, so defer/lazy-init non-critical work; use the App Startup library to consolidate initializers rather than each library adding its own ContentProvider); a **Baseline Profile** (AOT-compile the startup path — often the biggest win); and **avoiding work before the first frame** (show a skeleton/placeholder and load data asynchronously, keep the initial layout simple, use the SplashScreen API). You measure cold start with `Macrobenchmark`'s `StartupTimingMetric` or `adb shell am start -W`. Since cold start is the worst case and the first impression, focusing optimization there gives the most user-visible benefit.",
      },
    ],
  },
  {
    level: "senior",
    q: "When would you use Perfetto/systrace versus the CPU profiler?",
    a: [
      {
        t: "p",
        text: "**Use the CPU profiler when you want to know *which methods consume CPU time* (method-level attribution) in your app's code; use Perfetto/systrace when you need to understand *why a specific frame or startup missed its target* in full system context — including thread contention, lock waits, GC pauses, and the system compositor, not just your method timings.** They're complementary, but Perfetto is the primary tool for jank and startup because those problems are often about *what the whole system was doing*, not just one slow method.",
      },
      {
        t: "list",
        items: [
          "**CPU profiler — method-centric**: it records call stacks and time spent per method (via sampling or instrumentation), answering 'where is CPU time going in my code?' It's great for finding a computationally expensive method or an inefficient algorithm — the classic 'this function is hot' investigation. But it's centered on *your app's method execution*.",
          "**Perfetto/systrace — system-timeline-centric**: it captures a *timeline of every thread* (your main thread, background threads, and system threads like the render thread and the surface compositor), with frame boundaries, GC events, lock/monitor contention, binder calls, and your custom trace markers. This answers 'why did *this frame* take 30ms?' — and the answer is often *not* a slow method but a *lock wait* (main thread blocked waiting for a background thread), a *GC pause*, *main-thread I/O*, or *the render thread being overloaded*. The CPU profiler wouldn't clearly show these because they're not about method CPU time — they're about *waiting* and *system-level* events.",
        ],
      },
      {
        t: "list",
        items: [
          "**Concrete decision**: 'this computation is slow' (an algorithm, a parse) → CPU profiler to find and optimize the hot method. 'scrolling drops frames' or 'startup is slow' → Perfetto first, because you need to see *which frames drop, on which thread, and why* (contention, GC, I/O, compositor) in context — then possibly drill into a specific slow method with the CPU profiler.",
          "**Custom markers make Perfetto precise**: adding `trace(\"loadFeed\") { }` markers in your code puts your operations on the system timeline, so you can locate exactly where *your* work sits relative to frame boundaries and system events — bridging 'my code' and 'the whole system'.",
          "**Startup specifically**: Perfetto shows the entire launch sequence across threads — process init, `Application.onCreate`, first inflate/compose, first draw — revealing what's on the *critical path* to the first frame, which is exactly what you need to optimize cold start. The CPU profiler alone wouldn't show the cross-thread launch sequence.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: the distinction is *method CPU time* (CPU profiler) vs *system-level timeline including waiting and system events* (Perfetto). Jank and startup are frequently caused by things the CPU profiler doesn't surface well — lock contention, GC pauses, main-thread I/O, render-thread overload, cross-thread dependencies — because those are about *what the system was doing and waiting on*, not just which method ran. So Perfetto is the primary tool for those problems (it shows *why a frame missed its budget* in full context), while the CPU profiler is for drilling into a specific hot method once you know computation is the issue. Knowing that jank often isn't 'a slow method' but 'the main thread was blocked/waiting/paused' — and that Perfetto is what reveals that — is the depth that distinguishes someone who's actually diagnosed hard performance problems.",
      },
    ],
  },
  {
    level: "senior",
    q: "How would you approach reducing your app's cold startup time?",
    a: [
      {
        t: "p",
        text: "**I'd measure the current startup with Macrobenchmark to establish a baseline and find what's on the critical path (with Perfetto), then attack the biggest contributors in order — a lean Application.onCreate, deferred initialization, a baseline profile, and avoiding work before the first frame — remeasuring after each change.** The measurement-first, critical-path-focused approach is essential because startup has many potential contributors and you want to fix the ones that actually matter.",
      },
      {
        t: "list",
        items: [
          "**1. Measure and find the critical path**: use `Macrobenchmark` with `StartupTimingMetric` on a release build to get a reliable baseline (time to initial display and time to fully drawn), and Perfetto to see the launch timeline across threads — *what's actually on the path to the first frame*. This tells you where the time goes (process init, `Application.onCreate`, first inflate/compose, data loading) rather than guessing.",
          "**2. Slim down `Application.onCreate`**: it runs on the main thread on *every* cold start, so anything heavy there directly adds to launch time. Audit it — move non-critical initialization off the critical path: lazy-initialize libraries (only when first used), defer analytics/non-essential SDKs to after the first frame, and move eager work to background threads. Use the **App Startup** library to consolidate library initializers into one ordered, lazy-capable initializer instead of each library adding its own ContentProvider (each of which adds startup cost).",
          "**3. Add a Baseline Profile**: this is often the single biggest win. Without it, the startup code path is JIT-compiled *during* launch; a baseline profile AOT-compiles it at install, commonly cutting cold start 20-40%. Generate it with a `BaselineProfileRule` Macrobenchmark exercising the launch journey.",
          "**4. Avoid work before the first frame**: don't block the first draw on data loading — show a skeleton/placeholder and load asynchronously (so time-to-first-frame is fast even if content arrives slightly later); keep the initial layout/composition simple (defer complex UI); use the official SplashScreen API (rather than a heavy custom splash Activity that adds a step).",
          "**5. Optimize dependency initialization**: DI graph creation (Hilt), database opening, and network client setup on the startup path should be lazy where possible — don't eagerly build everything the app *might* need before showing the first screen.",
          "**6. Remeasure after each change**: confirm each optimization actually improved the metric (Macrobenchmark), and watch for regressions over time (run the startup benchmark in CI). Also verify against **Android Vitals** in production to confirm real-user startup improved.",
        ],
      },
      {
        t: "list",
        items: [
          "**Prioritize by impact**: the biggest contributors are usually a bloated `Application.onCreate`/eager initialization and the missing baseline profile — attack those first. Micro-optimizing a fast path while a heavy synchronous init sits on the critical path is wasted effort, which is why measuring the critical path first matters.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: cold-start optimization is a *critical-path* problem — the goal is to minimize the work between the user tapping the icon and seeing a usable first frame. So you measure to find what's *on that path* (Macrobenchmark + Perfetto), then remove or defer everything non-essential from it: lean `Application.onCreate` and lazy init (don't do work you don't need before the first frame), a baseline profile (so the path is precompiled, not JIT'd during launch), and asynchronous data loading (so the first frame doesn't wait on content). The measurement discipline — baseline, fix the biggest critical-path contributor, remeasure, and regression-test in CI — is what makes it effective rather than a scattershot of micro-optimizations. Naming the specific high-impact levers (Application.onCreate, App Startup, baseline profiles, first-frame-async) *in priority order*, grounded in critical-path measurement, is the comprehensive answer.",
      },
    ],
  },
];

export default qa;
