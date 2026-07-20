// ANRs, Jank & Rendering — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What is jank and what causes it?",
    a: [
      {
        t: "p",
        text: "**Jank is visible stuttering or hitching in the UI, caused by dropped frames — when a frame takes longer to produce than the display's refresh budget, the display can't show a new frame in time and repeats the old one, which the user perceives as a stutter.** For a smooth 60Hz display, every frame's work (running your code, measuring, laying out, drawing) must finish within ~16ms; miss that budget and you drop frames.",
      },
      {
        t: "list",
        items: [
          "**Heavy work on the main thread during a frame** — expensive computation, JSON parsing, sorting a large list, synchronous I/O, or bitmap decoding happening in a bind/composable/click handler eats the frame budget.",
          "**Complex layouts / overdraw** — deeply nested view hierarchies (expensive to measure/layout) and painting the same pixels multiple times (stacked opaque backgrounds).",
          "**Expensive list item binds** — each RecyclerView item binds *on the frame* as you scroll; heavy work there drops frames at the scroll edge.",
          "**Excessive recomposition (Compose)** or **main-thread I/O** (reading a file/DB/SharedPreferences synchronously) or **GC pauses** from churning allocations.",
        ],
      },
      {
        t: "p",
        text: "The unifying cause is *too much work on the main thread within a frame's time budget*. The main fix is to move slow work off the main thread (coroutines with IO/Default dispatchers) and keep per-frame main-thread work cheap (cheap binds, precomputed data, flat layouts). Jank is a performance problem, not a crash — but it's exactly what users mean when they say an app feels 'slow' or 'laggy', so it directly affects perceived quality.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is an ANR and how do you prevent it?",
    a: [
      {
        t: "p",
        text: "**An ANR (Application Not Responding) is when the main thread is blocked for so long that the app can't respond to input, and the system shows the 'App isn't responding' dialog. It's the extreme version of jank — where jank is a frame or two over budget, an ANR is the main thread blocked for *seconds*.** The main triggers: the main thread unresponsive to input for ~5 seconds, a BroadcastReceiver's `onReceive` taking more than ~10 seconds, or a Service not completing in time.",
      },
      {
        t: "p",
        text: "**The cause is always the same: a long synchronous operation blocking the main thread** — a network call on the main thread, a huge database query, heavy computation, or a deadlock (the main thread waiting on a lock another thread holds). **The prevention is also always the same: never do slow work on the main thread** — move all networking, disk/database I/O, and heavy computation to background threads via coroutines (`Dispatchers.IO` for I/O, `Dispatchers.Default` for CPU work), keeping the main thread free to handle input and rendering. This is *the* reason Android emphasizes coroutines and background threading so heavily — every 'don't block the main thread' rule exists to prevent ANRs (and jank). ANRs are also a Play-tracked quality metric (in Android Vitals), so a high ANR rate hurts your app's Play Store ranking, making them a business concern, not just a UX one.",
      },
    ],
  },
  {
    level: "junior",
    q: "How are jank and ANRs related?",
    a: [
      {
        t: "p",
        text: "**They're the same fundamental problem — a blocked or overloaded main thread — at different severities. Jank is the main thread taking a bit too long (missing a frame's ~16ms budget by milliseconds, dropping a frame or two → a visible stutter). An ANR is the main thread blocked for *seconds*, so long that the app can't respond to input at all → the 'not responding' dialog.**",
      },
      {
        t: "p",
        text: "The mechanism connects them: the main thread runs a loop processing work (rendering, input) one item at a time. If one item takes 30ms, the next frame's rendering is delayed → a dropped frame (jank). If one item takes 5 seconds (a synchronous network call), input events sit unprocessed for that whole time → an ANR. So it's a continuum: a little too much main-thread work causes jank; a lot causes an ANR. This is why the *fix* is identical for both — move slow work off the main thread and keep main-thread work short — and why understanding them as one problem (main-thread starvation) at different timescales is more useful than treating them as separate issues. It also tells you how to *diagnose* both: find the long-running main-thread operation (via Perfetto/systrace), whether it's a 30ms bind causing jank or a 5-second call causing an ANR.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you diagnose a janky screen?",
    a: [
      {
        t: "list",
        items: [
          "**First, test on a *release* build** — debug builds have no R8 optimization and JIT-compile code during use, so they're *expected* to be janky. A huge fraction of 'my screen is janky' reports disappear on release. Always measure performance on release (minified) builds, ideally with baseline profiles.",
          "**Use Perfetto / systrace** — system-level tracing that shows exactly what the main thread does frame by frame, so you can *see* which frames overran the budget and what operation caused it. This is the primary tool — it pinpoints the expensive work on the timeline.",
          "**Use the Android Studio CPU Profiler** — capture a method trace to find which methods consume main-thread time during the janky interaction.",
          "**Use JankStats / FrameMetrics** — Jetpack APIs that report per-frame durations at runtime, so you can measure and log jank in the field.",
          "**Use Macrobenchmark with FrameTimingMetric** — measures real jank on release builds for a specific journey (scrolling the feed), giving objective, reproducible numbers.",
        ],
      },
      {
        t: "p",
        text: "The workflow: confirm it's real (release build), then find *which* frames drop and *what* work caused them (Perfetto shows the timeline; the profiler shows expensive methods). Once you know the culprit — a heavy bind, a main-thread I/O call, excessive recomposition, an expensive layout — the fix is usually to move that work off the main thread or reduce it. For production, Android Vitals in the Play Console tells you *whether* you have a jank/ANR problem across real users and on which devices, complementing the local diagnosis of *what*. The key discipline is measurement-driven: find the actual expensive operation with tools rather than guessing.",
      },
    ],
  },
  {
    level: "senior",
    q: "Explain the frame budget and why it matters for high-refresh-rate displays.",
    a: [
      {
        t: "p",
        text: "**The frame budget is the maximum time all the work to produce one frame can take while still keeping the UI smooth, and it's determined by the display's refresh rate. At 60Hz, the display refreshes every ~16.6ms, so *all* the per-frame work — running your code (recomposition/binding), measuring, laying out, drawing — must finish within ~16ms. Exceed it and the display has no new frame to show, so it repeats the old one: a dropped frame, perceived as jank.**",
      },
      {
        t: "list",
        items: [
          "**The math**: budget = 1000ms ÷ refresh rate. 60Hz → ~16.6ms; 90Hz → ~11.1ms; 120Hz → ~8.3ms. Higher refresh rate = *smaller* budget per frame. (In practice a portion of the budget is reserved for the system's own compositing, so your usable budget is somewhat less than the full interval.)",
          "**Why high-refresh displays make it harder**: modern phones increasingly ship 90Hz and 120Hz displays, which halve the budget (from ~16ms to ~8ms). Work that comfortably fit a 60Hz frame might *overrun* a 120Hz frame — so an app that was smooth on 60Hz devices can jank on 120Hz ones. The higher the refresh rate, the less main-thread time you can afford per frame, and the more disciplined you must be about keeping per-frame work minimal.",
          "**The consistency requirement**: it's not just *average* frame time that matters — a single frame that overruns causes a visible hitch. So you need *every* frame to fit the budget, not just most. Occasional expensive frames (a heavy bind when a complex item scrolls in, a GC pause, a large recomposition) cause perceptible stutters even if the average is fine. This is why jank is often intermittent — tied to specific expensive operations rather than constant slowness.",
        ],
      },
      {
        t: "list",
        items: [
          "**The implications for how you build**: keep per-frame main-thread work minimal and *predictable* — move all heavy/variable work off the main thread (so no frame is at the mercy of a slow operation), precompute render-ready data (so binds/composables are cheap), reduce allocations (so GC doesn't pause a frame), and profile against the *tightest* budget your users' devices demand (test on 120Hz devices, not just 60Hz). Adaptive refresh rate adds nuance — the system may lower the rate for static content and raise it for scrolling/animation, so your smooth-scroll path specifically must hit the high-refresh budget.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: the frame budget is the fundamental constraint behind all UI performance — 'smooth' literally means 'every frame's work fits the budget', and 'janky' means 'some frames don't'. High-refresh displays matter because they *shrink* the budget (16ms → 8ms), so they expose performance problems that 60Hz hid, and they raise the bar for how little main-thread work you can afford. The practical consequence is that you optimize for the *tightest* budget and for *consistency* (every frame, not the average), which drives the core disciplines — off-main-thread work, cheap per-frame operations, minimal allocations. Understanding that the budget is refresh-rate-dependent and shrinking (as devices move to 120Hz) — and that consistency across frames, not average performance, is what the user perceives — is the systems-level understanding these questions probe.",
      },
    ],
  },
  {
    level: "senior",
    q: "A list scrolls smoothly in your testing but users report janky scrolling. Walk through diagnosing and fixing it.",
    a: [
      {
        t: "list",
        items: [
          "**1. Rule out the debug-build artifact first**: 'smooth in my testing' — was that a *debug* build? Debug builds are janky by nature (no R8, JIT during use). But the *reverse* here (smooth for you, janky for users) suggests a real difference — likely device (users on lower-end/higher-refresh devices), data (users with more/larger items), or build. Confirm you're testing a *release* build on a *representative* (mid-range, and high-refresh) device with realistic data, not a flagship with a tiny test dataset.",
          "**2. Reproduce with realistic conditions**: use a lower-end device (or an emulator throttled to match), a large/real dataset, and real images (not placeholders). Jank often only appears with production-scale data on slower hardware — the gap between your testing and users' experience.",
          "**3. Measure with the right tools**: run a Macrobenchmark with `FrameTimingMetric` scrolling the list on a release build to get objective jank numbers; use Perfetto/systrace to see *which* frames drop during scroll and *what* work causes them on the timeline. This turns 'users say it's janky' into 'these specific frames overran doing this specific work'.",
          "**4. Check the usual list-jank causes in order of likelihood**: (a) *expensive item binds* — heavy work in `onBindViewHolder`/the item composable (formatting, computation, synchronous image decode) that runs on the frame as items scroll in; (b) *image loading* — decoding full-size bitmaps into small views (should use Coil/Glide with downsampling and caching); (c) *Compose instability* — item composables recomposing unnecessarily due to unstable parameters or missing keys (check the compiler reports / Layout Inspector recomposition counts); (d) *no baseline profile* — first-scroll jank from JIT-compiling the scroll path (baseline profiles precompile it); (e) *main-thread work triggered by scroll* — loading more data synchronously, or over-fetching.",
          "**5. Fix based on the finding**: move formatting/computation out of binds into the ViewModel (so the UI gets render-ready data); route images through a caching loader with proper sizing; fix Compose stability (immutable item models, stable keys) so items skip recomposition; add a *baseline profile* for the scroll journey (often the single biggest win for first-scroll jank); ensure pagination/loading is off the main thread. Keep item binds/composables *cheap and cheap-to-skip*.",
          "**6. Verify with the same measurement**: re-run the Macrobenchmark on the representative device and confirm frame timings improved; check Android Vitals over the following release to confirm real-user 'slow/frozen frames' metrics drop.",
        ],
      },
      {
        t: "list",
        items: [
          "**The key insight about the 'smooth for me, janky for users' gap**: it almost always comes down to *testing conditions* — better hardware, smaller data, or a debug-vs-release/baseline-profile difference. Your flagship dev device with 10 test items and a debug build hides jank that a mid-range 120Hz device with 500 real items and a release build exposes. So the *first* move is closing that gap (representative device, data, release build), which often reveals the problem your testing masked.",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: the scenario tests two things — knowing the *specific* causes of list jank (expensive binds, unoptimized images, Compose instability, missing baseline profiles) and the diagnostic discipline (measure on release + representative device/data with Perfetto/Macrobenchmark, don't guess). But the sharpest insight is recognizing that 'smooth for me, janky for users' is a *testing-representativeness* problem — the fix starts by reproducing under realistic conditions (device, data, build), because you can't fix what you can't reproduce. Naming the ordered list-jank causes, the measurement tools, *and* the testing-gap insight — plus verifying with the same metrics and Android Vitals — is the comprehensive, senior answer that connects local diagnosis to real-user impact.",
      },
    ],
  },
];

export default qa;
