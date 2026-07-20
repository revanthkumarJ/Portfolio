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
  {
    level: "senior",
    q: "What is a Baseline Profile and how does it work?",
    a: [
      {
        t: "p",
        text: "A *Baseline Profile* is a list of hot code paths (classes/methods) shipped with your app that tells ART to *ahead-of-time compile* them at install time, instead of interpreting/JIT-ing on first run. This speeds up *startup* and *jank-prone paths* (like first scroll) by 20–30%+. You generate it with the Macrobenchmark library by exercising critical journeys, and it ships in the app bundle; Play delivers it so the code is precompiled before the user runs it.",
      },
      {
        t: "list",
        items: [
          "**Hot code list** — classes/methods AOT-compiled at install.",
          "**Speeds** — startup and jank-prone paths (~20–30%+).",
          "**Generate** — Macrobenchmark exercising critical journeys.",
          "**Delivered** — via the app bundle / Play.",
        ],
      },
      {
        t: "note",
        text: "A Baseline Profile lists hot code paths shipped with the app so ART AOT-compiles them at install (instead of interpret/JIT on first run) — speeding startup and jank-prone paths (first scroll) ~20–30%+. Generate with Macrobenchmark exercising critical journeys; it ships in the bundle and Play delivers it precompiled.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the Macrobenchmark library and what does it measure?",
    a: [
      {
        t: "p",
        text: "*Macrobenchmark* measures *whole-app, user-visible* performance on a real device/build — startup time (`StartupTimingMetric`) and rendering/jank (`FrameTimingMetric`) — by launching your app (in a release-like build) and running an interaction, repeatedly, for stable numbers. It's the tool for measuring startup and scroll performance, and for *generating Baseline Profiles*. Contrast with *Microbenchmark* (measures a small code snippet in isolation). Run it on a physical device, on a release/non-debuggable build.",
      },
      {
        t: "list",
        items: [
          "**Whole-app metrics** — `StartupTimingMetric`, `FrameTimingMetric`.",
          "**Release-like build** — launches + interacts repeatedly.",
          "**Generates** — Baseline Profiles.",
          "**vs Microbenchmark** — small isolated code snippets.",
        ],
      },
      {
        t: "note",
        text: "Macrobenchmark measures whole-app user-visible performance (StartupTimingMetric, FrameTimingMetric) by launching a release-like build and running interactions repeatedly for stable numbers — the tool for startup/scroll perf and generating Baseline Profiles. Microbenchmark measures isolated snippets. Run on a physical, non-debuggable build.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between Microbenchmark and Macrobenchmark?",
    a: [
      {
        t: "p",
        text: "*Microbenchmark* measures the speed of a *small piece of code* (a function, an algorithm) in isolation, in a tight loop, warming up the JIT and reporting nanosecond-level timing. *Macrobenchmark* measures *user-visible, whole-app* behavior (startup, scrolling) by driving the real app. Use Micro to compare two implementations of a hot function; use Macro to measure/regression-test startup and jank. Both run on a device, but at very different scopes.",
      },
      {
        t: "table",
        headers: ["", "Microbenchmark", "Macrobenchmark"],
        rows: [
          ["Scope", "One function/algorithm", "Whole app / journey"],
          ["Measures", "ns-level code speed", "Startup, jank"],
          ["Use", "Compare implementations", "Startup/scroll regression"],
          ["Also", "—", "Generates Baseline Profiles"],
        ],
      },
      {
        t: "note",
        text: "Microbenchmark: speed of a small code piece in isolation (tight loop, ns timing) — compare two implementations of a hot function. Macrobenchmark: user-visible whole-app behavior (startup, scroll) by driving the real app — regression-test startup/jank and generate Baseline Profiles. Same device, very different scopes.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between cold, warm, and hot startup?",
    a: [
      {
        t: "p",
        text: "*Cold start*: the process doesn't exist — the system creates it, runs `Application.onCreate`, then the first Activity (slowest; the one to optimize). *Warm start*: the process exists but the Activity must be recreated (some work reused). *Hot start*: the Activity is already in memory, just brought to the foreground (fastest). Optimize *cold* start because it's the worst case and users' first impression; measure it with `StartupTimingMetric`/`reportFullyDrawn`.",
      },
      {
        t: "table",
        headers: ["Type", "State", "Cost"],
        rows: [
          ["Cold", "Process created from scratch", "Slowest (optimize this)"],
          ["Warm", "Process alive, Activity recreated", "Medium"],
          ["Hot", "Activity in memory, foregrounded", "Fastest"],
        ],
      },
      {
        t: "note",
        text: "Cold: process created from scratch (Application.onCreate + first Activity) — slowest, optimize this. Warm: process alive but Activity recreated — medium. Hot: Activity in memory, just foregrounded — fastest. Optimize cold start (worst case + first impression); measure with StartupTimingMetric/reportFullyDrawn.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is Time To Initial Display (TTID) vs Time To Full Display (TTFD)?",
    a: [
      {
        t: "p",
        text: "*TTID* is the time until the *first frame* is drawn (the UI appears, possibly with placeholders). *TTFD* is the time until the app is *fully usable* with real content loaded — you signal it by calling `reportFullyDrawn()` once the meaningful content is ready. TTID measures perceived launch speed; TTFD measures when the user can actually use the screen. Optimizing both matters: show something fast (TTID) and load real data promptly (TTFD).",
      },
      {
        t: "list",
        items: [
          "**TTID** — first frame drawn (UI appears).",
          "**TTFD** — app fully usable; signal via `reportFullyDrawn()`.",
          "**TTID** — perceived launch speed.",
          "**TTFD** — when the user can truly use the screen.",
        ],
      },
      {
        t: "note",
        text: "TTID = time to the first frame drawn (UI appears, maybe placeholders). TTFD = time until fully usable with real content — you signal it with reportFullyDrawn(). TTID = perceived speed; TTFD = actual usability. Optimize both: show something fast, load real data promptly.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does the App Startup library help, and what problem does it solve?",
    a: [
      {
        t: "p",
        text: "Many libraries auto-initialize using a *ContentProvider* at startup (each provider adds overhead, and they run *before* your `Application.onCreate` in an uncontrolled order). The Jetpack *App Startup* library consolidates these into a *single* ContentProvider and lets you define `Initializer`s with explicit *dependencies* and *lazy* initialization — reducing startup cost and giving you control over ordering. It's a common cold-start optimization: fewer providers, deferred non-critical init.",
      },
      {
        t: "list",
        items: [
          "**Problem** — many library ContentProviders each add startup cost.",
          "**App Startup** — one provider + `Initializer`s with dependencies.",
          "**Lazy init** — defer non-critical initialization.",
          "**Benefit** — less cold-start overhead, controlled ordering.",
        ],
      },
      {
        t: "note",
        text: "Libraries auto-initializing via separate ContentProviders each add startup cost and run before Application.onCreate in uncontrolled order. Jetpack App Startup consolidates them into one provider with Initializers (explicit dependencies, lazy init) — a common cold-start win: fewer providers, deferred non-critical init.",
      },
    ],
  },
  {
    level: "senior",
    q: "What work commonly bloats Application.onCreate, and how do you fix it?",
    a: [
      {
        t: "p",
        text: "`Application.onCreate` runs on the main thread *before the first frame* — heavy work here directly delays startup. Common culprits: eagerly initializing analytics/crash/DI/image libraries, reading disk/preferences, network calls. Fix: *defer* non-critical init (lazy, App Startup, or after first frame), move I/O off the main thread, and initialize only what the first screen needs. Measure with a trace to see what's spending time in `onCreate`.",
      },
      {
        t: "list",
        items: [
          "**Runs before first frame** — on main; delays startup.",
          "**Culprits** — eager analytics/DI/image init, disk/network.",
          "**Fix** — defer non-critical (lazy/App Startup/post-frame).",
          "**Only** — init what the first screen needs.",
        ],
      },
      {
        t: "note",
        text: "Application.onCreate runs on main before the first frame — heavy work delays startup. Culprits: eager analytics/crash/DI/image init, disk reads, network. Fix: defer non-critical init (lazy, App Startup, or post-first-frame), move I/O off main, init only what the first screen needs. Trace onCreate to find the cost.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a splash screen's role in perceived startup, and how do you do it right?",
    a: [
      {
        t: "p",
        text: "A splash screen fills the *unavoidable* cold-start gap (process/UI init) with branding so the app doesn't look frozen — it improves *perceived* speed but doesn't make startup faster. Use the official *SplashScreen API* (androidx.core.splashscreen) rather than a fake splash Activity (which *adds* an Activity transition and slows startup). You can keep the splash visible while critical data loads (`setKeepOnScreenCondition`), but keep that brief.",
      },
      {
        t: "list",
        items: [
          "**Fills the cold-start gap** — perceived, not actual, speed.",
          "**Official SplashScreen API** — not a fake splash Activity.",
          "**Fake splash Activity** — adds a transition, slows startup.",
          "**`setKeepOnScreenCondition`** — keep briefly while critical data loads.",
        ],
      },
      {
        t: "note",
        text: "A splash screen fills the unavoidable cold-start gap with branding (perceived, not actual, speed). Use the official SplashScreen API (androidx.core.splashscreen), not a fake splash Activity (which adds a transition and slows startup). Keep it on briefly for critical data via setKeepOnScreenCondition.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you measure startup time reliably?",
    a: [
      {
        t: "p",
        text: "Use `Macrobenchmark`'s `StartupTimingMetric` on a *physical device* with a *release/non-debuggable* build, running many iterations for a stable median (debug builds and emulators mislead). For quick local checks, `adb shell am start -W` reports `TotalTime`. In production, Play Console's Android vitals reports startup times across real devices. Always distinguish cold/warm/hot and report `reportFullyDrawn` (TTFD), not just the first frame.",
      },
      {
        t: "list",
        items: [
          "**Macrobenchmark `StartupTimingMetric`** — physical, release build, many iterations.",
          "**`am start -W`** — quick `TotalTime` locally.",
          "**Play vitals** — production startup across devices.",
          "**Distinguish** — cold/warm/hot; report TTFD.",
        ],
      },
      {
        t: "note",
        text: "Measure startup with Macrobenchmark's StartupTimingMetric on a physical, non-debuggable release build over many iterations (debug/emulator mislead). Quick local check: adb shell am start -W (TotalTime). Production: Play vitals. Distinguish cold/warm/hot and report reportFullyDrawn (TTFD), not just first frame.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between the CPU Profiler and a system trace (Perfetto)?",
    a: [
      {
        t: "p",
        text: "The *CPU Profiler* (method tracing / sampling) shows *your app's* method call stacks and timing — great for finding a slow function inside your code. A *system trace (Perfetto)* shows the *whole system*: all threads, the RenderThread, scheduling, binder calls, frame timeline, and how your app interacts with the OS — great for jank, startup, and cross-thread/system-level issues. Use CPU Profiler for 'which of my methods is slow', Perfetto for 'why is this frame/startup slow overall'.",
      },
      {
        t: "table",
        headers: ["", "CPU Profiler", "System trace (Perfetto)"],
        rows: [
          ["Scope", "Your app's methods", "Whole system, all threads"],
          ["Best for", "Slow function in your code", "Jank, startup, scheduling"],
          ["Shows", "Call stacks + timing", "Frame timeline, binder, RenderThread"],
        ],
      },
      {
        t: "note",
        text: "CPU Profiler (method trace/sampling): your app's call stacks + timing — find a slow function in your code. System trace (Perfetto): whole system — all threads, RenderThread, scheduling, binder, frame timeline — for jank/startup/cross-thread issues. 'Which of my methods is slow' → CPU Profiler; 'why is this frame/startup slow' → Perfetto.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between sampled and instrumented (traced) profiling?",
    a: [
      {
        t: "p",
        text: "*Sampled* profiling periodically captures the call stack (low overhead, may miss very short methods) — good for finding where time is generally spent without distorting timings. *Instrumented/traced* profiling records *every* method entry/exit (exact call counts and timing, but high overhead that can distort the very timings you measure). Start with sampling for realistic hotspots; use instrumentation when you need precise call counts for a narrow section.",
      },
      {
        t: "list",
        items: [
          "**Sampled** — periodic stacks; low overhead; may miss short methods.",
          "**Instrumented** — every entry/exit; exact; high overhead (distorts).",
          "**Sampling** — realistic hotspots first.",
          "**Instrumentation** — precise call counts for a narrow section.",
        ],
      },
      {
        t: "note",
        text: "Sampled profiling: periodically captures stacks — low overhead, realistic hotspots, may miss short methods. Instrumented/traced: records every method entry/exit — exact counts/timing but high overhead that distorts timings. Start with sampling; use instrumentation for precise call counts on a narrow section.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do custom trace markers (Trace.beginSection) help profiling?",
    a: [
      {
        t: "p",
        text: "`Trace.beginSection(\"name\")`/`endSection()` (or `androidx.tracing`'s `trace(\"name\") { }`) add *named markers* to a system trace, so your own operations (e.g. 'loadUser', 'decodeImage') appear as labeled spans in Perfetto — making it far easier to see *your* code's timing amid system activity. Add them around suspected-slow sections. They're cheap and can stay in release (system tracing must be actively capturing to record them).",
      },
      {
        t: "code",
        title: "Custom trace section",
        code: `androidx.tracing.trace("loadUserProfile") {\n    val user = repository.loadUser(id)   // shows as a labeled span in Perfetto\n    render(user)\n}`,
      },
      {
        t: "note",
        text: "Trace.beginSection/endSection (or androidx.tracing trace(\"name\"){}) add named markers to a system trace, so your operations appear as labeled spans in Perfetto — far easier to spot your code's timing amid system activity. Add around suspected-slow sections; cheap enough to leave in (only recorded while tracing is active).",
      },
    ],
  },
  {
    level: "senior",
    q: "How does R8/dex optimization relate to startup performance?",
    a: [
      {
        t: "p",
        text: "R8 shrinks and optimizes code (removing unused classes/methods, inlining) — a smaller, simpler dex means *less code to load and verify* at startup and fewer methods, which can improve cold start and reduce app size. It also enables more effective *class verification* and works with Baseline Profiles. Ensure R8 is on for release; overly broad `keep` rules bloat the dex and can hurt startup. Optimization + Baseline Profiles together give the best startup.",
      },
      {
        t: "list",
        items: [
          "**Smaller/simpler dex** — less to load and verify at startup.",
          "**Fewer methods** — can improve cold start + size.",
          "**Works with** — Baseline Profiles.",
          "**Watch** — broad keep rules bloat dex, hurt startup.",
        ],
      },
      {
        t: "note",
        text: "R8 shrinks/optimizes code (removes unused, inlines) — a smaller/simpler dex means less to load and verify at startup, improving cold start and size. Works with Baseline Profiles. Keep R8 on for release; avoid overly broad keep rules (they bloat dex and hurt startup). R8 + Baseline Profiles = best startup.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why should you profile on a release build and a real device?",
    a: [
      {
        t: "p",
        text: "*Debug* builds are unoptimized (no R8, debuggable, extra checks) and run code differently (more interpretation), so their timings don't reflect what users experience — they can be several times slower and mislead you. *Emulators* have different CPU/GPU/memory characteristics than real phones (especially low-end). Always measure performance on a *release/non-debuggable* build on a *representative physical device* (ideally a low-end one) for numbers that match production.",
      },
      {
        t: "list",
        items: [
          "**Debug builds** — unoptimized, debuggable; misleadingly slow/different.",
          "**Emulators** — different CPU/GPU/memory than real phones.",
          "**Measure** — release/non-debuggable build.",
          "**Device** — representative physical (ideally low-end).",
        ],
      },
      {
        t: "note",
        text: "Debug builds are unoptimized (no R8, debuggable, extra checks, more interpretation) — timings don't reflect users (can be several× slower). Emulators differ from real phones. Always measure on a release/non-debuggable build on a representative physical device (ideally low-end) for production-matching numbers.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is lazy initialization and how does it help startup?",
    a: [
      {
        t: "p",
        text: "Lazy initialization defers creating an object until it's *first used* (`by lazy { }`, or lazy DI providers) rather than at startup. Since startup work directly delays the first frame, deferring anything not needed for the first screen (analytics that can init after launch, heavy singletons, secondary feature managers) speeds cold start. Balance: don't lazily init something on a hot path where the deferred cost causes jank later — defer what's genuinely not needed *early*.",
      },
      {
        t: "code",
        title: "Deferring non-critical work",
        code: `// heavy manager not needed for the first screen — created on first use, not at startup\nval analytics by lazy { AnalyticsManager(appContext) }\n// or initialize after the first frame:\nwindow.decorView.post { initNonCriticalLibraries() }`,
      },
      {
        t: "note",
        text: "Lazy init defers creating an object until first use (by lazy, lazy DI) instead of at startup — deferring anything not needed for the first screen (post-launch analytics, heavy singletons) speeds cold start. Balance: don't defer hot-path work where the later cost causes jank. Defer what's genuinely not needed early.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you profile and optimize a slow list scroll?",
    a: [
      {
        t: "p",
        text: "Capture a *system trace* while scrolling, find janky frames, and expand them to see the expensive main-thread work (binding/composition, image decode, layout, allocations). Then fix the specific cause: cheaper item layouts, right-sized images off the main thread, stable keys/DiffUtil, precomputed data, fewer allocations, and a Baseline Profile. Verify with Macrobenchmark's `FrameTimingMetric` on a release build. Iterate: measure → fix the top cost → re-measure.",
      },
      {
        t: "list",
        items: [
          "**System trace** — find janky frames, expand to see the cost.",
          "**Fix causes** — cheap items, right-sized images, stable keys.",
          "**Baseline Profile** — for the scroll path.",
          "**Verify** — Macrobenchmark `FrameTimingMetric` (release).",
        ],
      },
      {
        t: "note",
        text: "Profile a slow scroll: system trace while scrolling → find janky frames → expand to see expensive main-thread work (binding/composition, image decode, layout, allocations). Fix the specific cause (cheap items, right-sized off-main images, stable keys, precompute, fewer allocations, Baseline Profile). Verify with Macrobenchmark FrameTimingMetric on release.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the flame chart / call chart in the profiler, and how do you read it?",
    a: [
      {
        t: "p",
        text: "A *call chart* (flame chart) visualizes call stacks over time: the x-axis is time, and each bar is a method call with its callees stacked *below* it — a *wide* bar means that method (or its children) took a long time. Read it top-down to find *wide* bars (time sinks). The related *flame graph* aggregates by total time per method (ignoring order) to show cumulative hotspots. Use these to spot which function dominates.",
      },
      {
        t: "list",
        items: [
          "**Call chart** — time on x-axis, callees stacked below.",
          "**Wide bar** — that method/subtree took long.",
          "**Flame graph** — aggregates cumulative time per method.",
          "**Read** — find the widest bars (time sinks).",
        ],
      },
      {
        t: "note",
        text: "A call/flame chart plots call stacks over time (x=time, callees stacked below) — a wide bar means that method/subtree took long; read top-down for the widest bars. A flame graph aggregates cumulative time per method (order-independent) for hotspots. Both find which function dominates.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you regression-test performance in CI?",
    a: [
      {
        t: "p",
        text: "Add *Macrobenchmark* tests (startup, key scrolls) that run on a *physical device* (a Firebase Test Lab device or a self-hosted device farm) and record metrics. Track the numbers over time and *fail/alert on regressions* beyond a threshold. Pair with Baseline Profile generation. Because device numbers are noisy, run multiple iterations and compare medians, and use consistent device models. This catches performance regressions before they ship, like tests catch functional ones.",
      },
      {
        t: "list",
        items: [
          "**Macrobenchmark in CI** — startup + key scrolls.",
          "**Physical device** — Firebase Test Lab / device farm.",
          "**Alert on regression** — beyond a threshold; track over time.",
          "**Noise** — multiple iterations, medians, consistent devices.",
        ],
      },
      {
        t: "note",
        text: "Regression-test perf with Macrobenchmark tests (startup, key scrolls) on physical devices (Firebase Test Lab/device farm), tracking metrics and alerting on regressions beyond a threshold. Handle device noise with multiple iterations/medians and consistent models. Catches perf regressions pre-ship like tests catch functional ones.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between latency and throughput in performance?",
    a: [
      {
        t: "p",
        text: "*Latency* is how long *one* operation takes (a single request's response time, one frame's render time) — it drives perceived responsiveness. *Throughput* is how *many* operations complete per unit time (frames per second, requests per second) — it drives capacity. They can trade off: batching improves throughput but may raise per-item latency. On mobile UI, low per-frame *latency* (staying under the frame budget) is usually the priority for smoothness.",
      },
      {
        t: "list",
        items: [
          "**Latency** — time for one operation (responsiveness).",
          "**Throughput** — operations per unit time (capacity).",
          "**Trade-off** — batching boosts throughput, may raise latency.",
          "**Mobile UI** — low per-frame latency for smoothness.",
        ],
      },
      {
        t: "note",
        text: "Latency = time for one operation (drives perceived responsiveness); throughput = operations per unit time (drives capacity). They trade off (batching boosts throughput but raises per-item latency). On mobile UI, low per-frame latency (under the frame budget) is usually the smoothness priority.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you decide what to optimize (where to focus)?",
    a: [
      {
        t: "p",
        text: "Optimize by *impact* × *frequency*, guided by data: measure first to find the *actual* bottleneck (Amdahl's law — speeding up something that's 5% of the time barely helps), prioritize what users hit most (startup, main scroll, key journeys), and confirm with production telemetry (Play vitals, custom traces) which screens are slow *in the field*. Avoid micro-optimizing cold paths. Set a target (e.g. 'cold start under X ms on low-end'), measure against it, and stop when you meet it.",
      },
      {
        t: "list",
        items: [
          "**Impact × frequency** — measure the actual bottleneck first.",
          "**Amdahl's law** — optimizing a small fraction barely helps.",
          "**Prioritize** — startup, main scroll, hot journeys.",
          "**Target-driven** — set a goal, measure, stop when met.",
        ],
      },
      {
        t: "note",
        text: "Optimize by impact × frequency, data-driven: measure to find the real bottleneck (Amdahl — speeding up 5% of time barely helps), prioritize what users hit most (startup, main scroll), confirm with production telemetry (Play vitals) which screens are slow in the field. Set a target, measure against it, stop when met.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is dex verification / class loading and how does it affect startup?",
    a: [
      {
        t: "p",
        text: "At runtime ART must *load* and *verify* classes before use — on first run (or without AOT compilation) this happens lazily and costs time during startup and first interactions. A *Baseline Profile* pre-compiles the hot classes/methods so this work is done at install; *R8* reduces the number of classes/methods to verify. Excessive classes, reflection, and huge dependency graphs increase this cost. This is a key reason Baseline Profiles help startup so much.",
      },
      {
        t: "list",
        items: [
          "**Load + verify** — ART processes classes before use.",
          "**First run** — happens lazily; costs startup time.",
          "**Baseline Profile** — pre-compiles hot classes at install.",
          "**R8** — fewer classes/methods to verify.",
        ],
      },
      {
        t: "note",
        text: "ART loads and verifies classes before use — on first run (no AOT) this is lazy and costs startup/first-interaction time. Baseline Profiles pre-compile hot classes at install; R8 reduces the count to verify. Excessive classes/reflection/huge graphs increase the cost — a key reason Baseline Profiles help startup.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you profile power/CPU usage over time?",
    a: [
      {
        t: "p",
        text: "Use *Perfetto/systrace* to see CPU scheduling and wakeups over time, `Battery Historian` (from a bug report) to analyze wakelocks, jobs, and battery drain, and the *Energy Profiler* (Android Studio, on supported devices) for a rough power view. Look for *background CPU activity* (busy loops, frequent wakeups, chatty network), and correlate CPU spikes with your operations via trace markers. Excessive CPU when idle is the main power/perf red flag.",
      },
      {
        t: "list",
        items: [
          "**Perfetto** — CPU scheduling, wakeups over time.",
          "**Battery Historian** — wakelocks, jobs, drain (from bug report).",
          "**Energy Profiler** — rough power view.",
          "**Red flag** — background CPU/wakeups when idle.",
        ],
      },
      {
        t: "note",
        text: "Profile power/CPU with Perfetto/systrace (CPU scheduling, wakeups over time), Battery Historian (wakelocks/jobs/drain from a bug report), Energy Profiler (rough power). Look for background CPU (busy loops, frequent wakeups, chatty network); correlate spikes with your ops via trace markers. Idle CPU is the main red flag.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you profile Compose recomposition and performance?",
    a: [
      {
        t: "p",
        text: "Use the *Layout Inspector*'s recomposition counts to see which composables recompose (and how often) — high or unexpected counts point to instability or bad state reads. The *Compose compiler metrics/reports* tell you which composables are *skippable/restartable* and which parameters are *unstable* (why skipping fails). For frame-level timing, use a *system trace* (composition/layout/draw phases are traced). Combine: reports to find instability, Layout Inspector to see counts, trace to measure the cost.",
      },
      {
        t: "list",
        items: [
          "**Layout Inspector** — recomposition counts per composable.",
          "**Compiler metrics/reports** — skippable/restartable, unstable params.",
          "**System trace** — composition/layout/draw phase timing.",
          "**Combine** — reports (why) + counts (where) + trace (cost).",
        ],
      },
      {
        t: "note",
        text: "Profile Compose with Layout Inspector recomposition counts (which composables recompose, how often), the compiler metrics/reports (skippable/restartable + unstable params explaining failed skipping), and a system trace for phase timing. Combine: reports (why unstable) + Inspector (where) + trace (cost).",
      },
    ],
  },
  {
    level: "junior",
    q: "What does 'measure before optimizing' mean in practice?",
    a: [
      {
        t: "p",
        text: "It means never guess where the slowness is — *profile first* to find the real bottleneck, because intuition is often wrong (the slow part is rarely where you'd expect). Get a baseline number, make one change, and *re-measure* to confirm it actually helped (and didn't regress elsewhere). Premature optimization wastes effort on non-bottlenecks and adds complexity. The loop is: measure → identify the top cost → fix it → measure again.",
      },
      {
        t: "list",
        items: [
          "**Profile first** — find the real bottleneck (intuition misleads).",
          "**Baseline** — measure before changing.",
          "**Re-measure** — confirm the change helped, no regression.",
          "**Avoid** — premature optimization of non-bottlenecks.",
        ],
      },
      {
        t: "note",
        text: "Measure before optimizing = profile first to find the real bottleneck (intuition is usually wrong), get a baseline, make one change, re-measure to confirm it helped without regressing. Premature optimization wastes effort and adds complexity. Loop: measure → top cost → fix → measure again.",
      },
    ],
  },
];

export default qa;
