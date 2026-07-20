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
  {
    level: "senior",
    q: "What is the Choreographer, and how does it relate to jank?",
    a: [
      {
        t: "p",
        text: "The `Choreographer` coordinates the app's frame work with the display's *vsync* signal — it schedules input, animation, and draw callbacks to run once per frame. If your main-thread work for a frame exceeds the budget (~16.6ms at 60Hz), the frame is *dropped* (jank). You can hook `Choreographer.postFrameCallback` to measure per-frame timing, and `FrameMetrics` builds on this.",
      },
      {
        t: "list",
        items: [
          "**Vsync-driven** — schedules per-frame input/animation/draw.",
          "**Frame budget** — exceed it → dropped frame (jank).",
          "**`postFrameCallback`** — measure per-frame timing.",
          "**FrameMetrics** — built on it for detailed timing.",
        ],
      },
      {
        t: "note",
        text: "The Choreographer syncs the app's input/animation/draw work to the display's vsync, once per frame — main-thread work exceeding the budget (~16.6ms @60Hz) drops the frame (jank). postFrameCallback measures per-frame timing; FrameMetrics builds on it. Jank = missing the Choreographer's frame deadline.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are the ANR thresholds for different components?",
    a: [
      {
        t: "p",
        text: "ANRs fire when the *main thread* is blocked too long, with different thresholds: ~5 seconds for *input event* handling (no response to a tap), ~10 seconds (foreground) / ~60s (background) for a `BroadcastReceiver`'s `onReceive`, and foreground-service-start timeouts (~10–20s). Exceeding these triggers the 'App isn't responding' dialog. So keep the main thread free — no blocking I/O, heavy computation, or synchronous IPC.",
      },
      {
        t: "list",
        items: [
          "**Input** — ~5s no response to input.",
          "**`BroadcastReceiver`** — ~10s (foreground) / longer (background).",
          "**Service start** — ~10–20s foreground-service-start timeout.",
          "**Cause** — main-thread blocking (I/O/computation/IPC).",
        ],
      },
      {
        t: "note",
        text: "ANR thresholds: ~5s for input handling, ~10s (foreground)/~60s (background) for a BroadcastReceiver's onReceive, ~10–20s for foreground-service start. Exceeding them triggers 'App isn't responding'. Keep the main thread free — no blocking I/O, heavy computation, or synchronous IPC.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is overdraw, and how do you reduce it?",
    a: [
      {
        t: "p",
        text: "Overdraw is painting the *same pixel multiple times* in one frame (stacked opaque backgrounds, layers over layers) — each extra layer costs GPU time and contributes to jank in the draw phase. Reduce it by removing redundant/nested backgrounds, clipping to the visible area, and flattening layers. Diagnose with 'Debug GPU Overdraw' (developer options), which colors pixels by overdraw count (blue=1×, red=4×+) — aim to reduce red.",
      },
      {
        t: "list",
        items: [
          "**Overdraw** — same pixel painted multiple times per frame.",
          "**Cost** — GPU draw time; contributes to jank.",
          "**Reduce** — remove redundant backgrounds, clip, flatten.",
          "**Diagnose** — 'Debug GPU Overdraw' (blue=1×…red=4×+).",
        ],
      },
      {
        t: "note",
        text: "Overdraw = painting the same pixel multiple times per frame (stacked opaque backgrounds/layers) — a draw-phase GPU cost contributing to jank. Reduce by removing redundant/nested backgrounds, clipping to visible area, flattening. Diagnose with Debug GPU Overdraw (blue=1×…red=4×+); shrink the red.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between the UI thread and the RenderThread?",
    a: [
      {
        t: "p",
        text: "The *UI (main) thread* runs your app code — layout, measure, and *recording* draw commands (a display list). The *RenderThread* (a separate system thread) takes that display list and *executes* the GPU rendering (rasterization) off the main thread, so animations can continue smoothly even if the main thread is briefly busy. Jank can occur on either: main-thread work overrunning the frame, or heavy GPU work on the RenderThread.",
      },
      {
        t: "list",
        items: [
          "**UI thread** — app code, layout/measure, records draw commands.",
          "**RenderThread** — executes GPU rendering off the main thread.",
          "**Smoother animations** — GPU work offloaded.",
          "**Jank on either** — main-thread overrun or heavy GPU.",
        ],
      },
      {
        t: "note",
        text: "The UI (main) thread runs app code + layout/measure + records draw commands (display list); the RenderThread executes GPU rendering (rasterization) off the main thread, keeping animations smooth when main is briefly busy. Jank can come from either — main-thread overrun or heavy GPU work on the RenderThread.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are the three rendering phases?",
    a: [
      {
        t: "p",
        text: "Rendering a frame goes through *measure* (each view/composable computes its size given constraints), *layout* (positions are assigned), and *draw* (pixels are painted). A deep view hierarchy makes measure/layout expensive (multiple passes), and complex drawing (overdraw, custom canvas) makes draw expensive. Understanding which phase is slow guides the fix (flatten layouts vs reduce overdraw).",
      },
      {
        t: "list",
        items: [
          "**Measure** — compute sizes given constraints.",
          "**Layout** — assign positions.",
          "**Draw** — paint pixels.",
          "**Diagnose the slow phase** — layout (flatten) vs draw (overdraw).",
        ],
      },
      {
        t: "note",
        text: "Rendering phases: measure (compute sizes), layout (assign positions), draw (paint pixels). Deep hierarchies make measure/layout expensive (multiple passes); overdraw/complex canvas makes draw expensive. Identify the slow phase to fix it (flatten layouts vs reduce overdraw). Compose has the same three phases.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you measure jank programmatically (FrameMetrics, JankStats)?",
    a: [
      {
        t: "p",
        text: "`FrameMetrics` (API 24+) reports per-frame timing (input, animation, layout, draw, GPU) so you can detect slow frames. The *JankStats* Jetpack library builds on it, providing a simple API to track jank (and attach *state* — which screen was active) and report it (to analytics), so you know *where* jank happens in production. In the lab, use the *Macrobenchmark* library's `FrameTimingMetric` for repeatable jank numbers.",
      },
      {
        t: "list",
        items: [
          "**`FrameMetrics`** — per-frame timing (API 24+).",
          "**JankStats** — tracks jank + attaches state; report to analytics.",
          "**Macrobenchmark `FrameTimingMetric`** — repeatable lab numbers.",
          "**Production insight** — know where jank happens.",
        ],
      },
      {
        t: "note",
        text: "FrameMetrics (API 24+) reports per-frame timing (input/animation/layout/draw/GPU). The JankStats Jetpack library builds on it — tracks jank with attached state (which screen) and reports to analytics (production insight). In the lab, Macrobenchmark's FrameTimingMetric gives repeatable jank numbers.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are slow frames and frozen frames in Play vitals?",
    a: [
      {
        t: "p",
        text: "Play Console's Android vitals tracks two rendering metrics: *slow frames* (frames taking >16ms — visible jank/stutter) and *frozen frames* (frames taking >700ms — the app appears hung, a much worse experience). Google flags apps exceeding thresholds (they can affect discoverability). Frozen frames are especially bad (users perceive a freeze); slow frames are stutters. Both indicate main-thread work overrunning frame budgets.",
      },
      {
        t: "list",
        items: [
          "**Slow frames** — >16ms; visible stutter.",
          "**Frozen frames** — >700ms; app appears hung (worse).",
          "**Play vitals** — flags exceeding thresholds (discoverability).",
          "**Cause** — main-thread work overrunning frame budgets.",
        ],
      },
      {
        t: "note",
        text: "Play vitals rendering metrics: slow frames (>16ms — visible stutter) and frozen frames (>700ms — app appears hung, much worse). Google flags apps exceeding thresholds (affecting discoverability). Both indicate main-thread work overrunning frame budgets. Frozen frames especially hurt UX.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you read an ANR trace to diagnose the cause?",
    a: [
      {
        t: "p",
        text: "When an ANR occurs, the system captures a *trace* (in `/data/anr/`, or Play Console → Android vitals → ANRs) showing the *stack of the main thread at the moment of the freeze* (plus other threads). Read the main thread's stack to see *what it was blocked on* — a synchronous network/DB call, a lock (deadlock), a slow binder call, or heavy computation. That points directly to the code to fix (move off the main thread).",
      },
      {
        t: "list",
        items: [
          "**ANR trace** — `/data/anr/` or Play vitals.",
          "**Main thread stack** — what it was blocked on at the freeze.",
          "**Culprits** — sync I/O, locks/deadlock, slow IPC, computation.",
          "**Fix** — move the blocking work off the main thread.",
        ],
      },
      {
        t: "note",
        text: "An ANR trace (in /data/anr/ or Play vitals → ANRs) shows the main thread's stack at the freeze (plus other threads). Read it to see what main was blocked on — sync network/DB, a lock (deadlock), slow binder, or computation — pointing to the code to move off the main thread.",
      },
    ],
  },
  {
    level: "senior",
    q: "How can a deadlock cause an ANR?",
    a: [
      {
        t: "p",
        text: "If the *main thread* acquires a lock and waits for another lock held by a background thread that's waiting for the main thread's lock (or the main thread waits on a lock a stuck background thread holds), the main thread is *blocked indefinitely* → ANR. Deadlocks show in the ANR trace as the main thread `BLOCKED`/`WAITING` on a monitor. Avoid by minimizing locks on the main thread, consistent lock ordering, and not blocking the main thread on background work (use callbacks/coroutines).",
      },
      {
        t: "list",
        items: [
          "**Deadlock** — main thread blocked on a lock held by a stuck thread.",
          "**Indefinite block** → ANR.",
          "**Trace** — main thread BLOCKED/WAITING on a monitor.",
          "**Avoid** — minimize main-thread locks, consistent ordering, don't block main.",
        ],
      },
      {
        t: "note",
        text: "A deadlock (main thread blocked on a lock held by a stuck/waiting background thread) blocks main indefinitely → ANR. The trace shows main BLOCKED/WAITING on a monitor. Avoid: minimize main-thread locks, use consistent lock ordering, and don't block the main thread on background work (coroutines/callbacks).",
      },
    ],
  },
  {
    level: "senior",
    q: "How can a lazy list (RecyclerView/LazyColumn) cause jank, and how do you fix it?",
    a: [
      {
        t: "p",
        text: "Jank comes from *expensive per-item work* on the main thread during scroll: heavy binding/composition, oversized image decoding, complex layouts, or reading rapidly-changing state. Fix by: keeping item content cheap (precompute in the ViewModel), right-sizing images (Coil/Glide to display size), providing stable keys + contentType (Compose) / DiffUtil (Views), avoiding heavy work in `onBind`/composition, and generating a Baseline Profile. Profile on a release build.",
      },
      {
        t: "list",
        items: [
          "**Expensive per-item work** — binding/composition, image decode, layout.",
          "**Fix** — cheap item content, right-sized images, stable keys/DiffUtil.",
          "**No heavy work** — in onBind/composition; precompute.",
          "**Baseline Profile** — + profile on release.",
        ],
      },
      {
        t: "note",
        text: "Lazy-list jank = expensive per-item main-thread work during scroll (heavy binding/composition, oversized image decode, complex layouts, rapid state reads). Fix: cheap item content (precompute), right-sized images, stable keys + contentType/DiffUtil, no heavy work in onBind/composition, a Baseline Profile. Profile on release.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does image loading cause jank, and how do you prevent it?",
    a: [
      {
        t: "p",
        text: "Decoding a full-resolution image into a small view is expensive (CPU + big allocations → GC pauses) and, if done on the main thread, blocks frames. Prevent it by using an image library (Coil/Glide) that decodes *off the main thread*, *downsamples* to the displayed size (crucial — pass a bounded size), caches (memory + disk), and uses placeholders/crossfade. Never decode bitmaps on the main thread or load full-res into a thumbnail.",
      },
      {
        t: "list",
        items: [
          "**Full-res decode** — CPU + allocations → GC jank; blocks if on main.",
          "**Coil/Glide** — decode off main, downsample to display size.",
          "**Cache + placeholders** — memory/disk; smooth loading.",
          "**Never** — decode on main / load full-res into a thumbnail.",
        ],
      },
      {
        t: "note",
        text: "Image jank: decoding full-res into a small view (CPU + big allocations → GC pauses; blocks frames if on main). Prevent with Coil/Glide — decode off-main, downsample to the displayed size (pass a bounded size), cache (memory+disk), placeholders/crossfade. Never decode bitmaps on main or load full-res into a thumbnail.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does garbage collection cause jank?",
    a: [
      {
        t: "p",
        text: "Excessive object *allocation* (especially in hot paths like scroll or per-frame) fills the heap, triggering *garbage collection* — GC pauses (even short ones) can cause the app to miss a frame (jank). Reduce it by avoiding allocations in hot paths: reuse objects, avoid autoboxing (use `IntArray` over `List<Int>`), don't allocate in `onDraw`/per-frame code, and use object pools where appropriate. Profile allocations with the Memory Profiler.",
      },
      {
        t: "list",
        items: [
          "**Excessive allocation** — fills the heap, triggers GC.",
          "**GC pauses** — can miss a frame (jank).",
          "**Reduce** — reuse objects, avoid boxing, no allocation in hot paths.",
          "**Profile** — Memory Profiler for allocation hotspots.",
        ],
      },
      {
        t: "note",
        text: "Excessive object allocation (in hot paths — scroll/per-frame) fills the heap and triggers GC; even short GC pauses can miss a frame (jank). Reduce: reuse objects, avoid autoboxing (IntArray over List<Int>), no allocation in onDraw/per-frame, object pools. Profile allocations with the Memory Profiler.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do deep view hierarchies hurt rendering, and how do you flatten them?",
    a: [
      {
        t: "p",
        text: "Deeply nested layouts (many `LinearLayout`s inside each other) make *measure/layout* expensive — nested weights can cause *multiple measure passes* (exponential in depth). Flatten with `ConstraintLayout` (one flat hierarchy replacing nesting), remove redundant container views, and use `merge`/`ViewStub`. In *Compose*, the layout system is more efficient (single-pass by default), but avoid unnecessary nesting and intrinsic measurements. Diagnose with Layout Inspector.",
      },
      {
        t: "list",
        items: [
          "**Deep nesting** — expensive measure/layout; nested weights = multiple passes.",
          "**Flatten** — `ConstraintLayout`, remove redundant containers, `merge`.",
          "**Compose** — more efficient; avoid needless nesting/intrinsics.",
          "**Diagnose** — Layout Inspector.",
        ],
      },
      {
        t: "note",
        text: "Deep view hierarchies make measure/layout expensive — nested LinearLayout weights cause multiple measure passes (exponential in depth). Flatten with ConstraintLayout, remove redundant containers, use merge/ViewStub. Compose is more efficient (single-pass) but avoid needless nesting/intrinsics. Diagnose with Layout Inspector.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does Compose recomposition affect jank, and how do you reduce it?",
    a: [
      {
        t: "p",
        text: "Excessive or expensive *recomposition* (re-running composables) on the main thread can jank — especially reading rapidly-changing state high in the tree, unstable parameters preventing skipping, or heavy work in composable bodies. Reduce with: stable/immutable parameters (enable skipping), `derivedStateOf`/lambda deferral for fast-changing state, reading state in the smallest scope, and moving computation out of composition (`remember`/ViewModel). Measure with Layout Inspector recomposition counts.",
      },
      {
        t: "list",
        items: [
          "**Excessive recomposition** — re-running composables janks.",
          "**Causes** — unstable params, high state reads, heavy body work.",
          "**Reduce** — stability/skipping, derivedStateOf, defer reads, move computation out.",
          "**Measure** — Layout Inspector recomposition counts.",
        ],
      },
      {
        t: "note",
        text: "Excessive/expensive Compose recomposition on main can jank (rapid state read high in the tree, unstable params blocking skipping, heavy body work). Reduce: stable/immutable params (skipping), derivedStateOf/lambda deferral, read state in the smallest scope, move computation out (remember/ViewModel). Measure with Layout Inspector recomposition counts.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between input latency and rendering jank?",
    a: [
      {
        t: "p",
        text: "*Input latency* is the delay between the user's touch and the app *responding* (e.g. a button feels slow to react) — often because the main thread is busy when the input arrives. *Rendering jank* is *dropped/stuttering frames* during animation/scroll (the app responds but janks). Both stem from a busy main thread, but they're different symptoms: latency = slow to start reacting; jank = choppy visuals. Both are fixed by keeping the main thread free.",
      },
      {
        t: "list",
        items: [
          "**Input latency** — delay before the app reacts to touch.",
          "**Rendering jank** — dropped/stuttering frames.",
          "**Both** — from a busy main thread.",
          "**Different symptoms** — slow-to-react vs choppy visuals.",
        ],
      },
      {
        t: "note",
        text: "Input latency = delay between touch and the app responding (main thread busy when input arrives). Rendering jank = dropped/stuttering frames during animation/scroll. Both stem from a busy main thread but are different symptoms (slow-to-react vs choppy). Both fixed by keeping main free.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you profile a slow frame in Perfetto/systrace?",
    a: [
      {
        t: "p",
        text: "Capture a *system trace* (Perfetto, via Android Studio's profiler or `perfetto`/`systrace`), find the janky frames (marked in the frame timeline), and *expand* them to see what ran on the main thread and RenderThread during that frame — which functions took long. Custom `Trace.beginSection`/`endSection` markers let you label your own code in the trace. This pinpoints the exact slow operation causing the dropped frame.",
      },
      {
        t: "list",
        items: [
          "**System trace** — Perfetto/systrace via profiler.",
          "**Find janky frames** — marked in the frame timeline.",
          "**Expand** — see main/RenderThread work during the frame.",
          "**`Trace.beginSection`** — label your own code.",
        ],
      },
      {
        t: "note",
        text: "Capture a system trace (Perfetto via Android Studio profiler or perfetto/systrace), find janky frames in the frame timeline, expand them to see main/RenderThread work during that frame (which functions took long). Trace.beginSection/endSection labels your own code. Pinpoints the exact slow operation.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you keep animations smooth at 60/120fps?",
    a: [
      {
        t: "p",
        text: "Animate *cheap, draw-phase* properties (alpha, translation, scale, rotation) rather than layout-affecting ones (which re-run measure/layout each frame). In Compose, use `graphicsLayer`/`offset {}` lambdas so animation reads happen in the draw/layout phase, not recomposition. Keep per-frame work minimal (no allocation/heavy computation), and remember higher refresh rates (120Hz) *halve* the frame budget (~8.3ms), demanding even leaner frames.",
      },
      {
        t: "list",
        items: [
          "**Animate draw-phase props** — alpha/translation/scale/rotation.",
          "**Avoid layout-affecting** — re-runs measure/layout per frame.",
          "**`graphicsLayer`/`offset {}`** — defer reads in Compose.",
          "**120Hz** — halves the budget (~8.3ms); leaner frames.",
        ],
      },
      {
        t: "note",
        text: "Smooth animations: animate cheap draw-phase properties (alpha/translation/scale/rotation), not layout-affecting ones (re-run measure/layout). In Compose use graphicsLayer/offset {} lambdas to defer reads to draw/layout, not recomposition. Keep per-frame work minimal (no allocation). 120Hz halves the budget (~8.3ms) — leaner frames needed.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you avoid ANRs when doing heavy work?",
    a: [
      {
        t: "p",
        text: "Never do blocking/heavy work on the main thread — offload it to a *coroutine* with `withContext(Dispatchers.IO)` (I/O) or `Default` (CPU), and update the UI back on Main. For very heavy computation, chunk it (yield periodically) or use WorkManager for deferrable background work. Also avoid synchronous IPC/binder calls and slow content-provider queries on main. StrictMode (debug) flags main-thread I/O early.",
      },
      {
        t: "list",
        items: [
          "**Offload** — `withContext(IO/Default)`; UI back on Main.",
          "**Chunk heavy computation** — yield periodically.",
          "**WorkManager** — for deferrable background work.",
          "**Avoid** — sync IPC/slow provider queries on main; StrictMode catches I/O.",
        ],
      },
      {
        t: "note",
        text: "Avoid ANRs by never blocking main: offload with withContext(Dispatchers.IO/Default), update UI back on Main; chunk very heavy computation (yield); use WorkManager for deferrable work. Avoid synchronous IPC/slow provider queries on main. StrictMode (debug) flags main-thread I/O early.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle a BroadcastReceiver or Service that causes an ANR?",
    a: [
      {
        t: "p",
        text: "A `BroadcastReceiver`'s `onReceive` and a `Service`'s callbacks run on the *main thread* with time limits (~10s / ~20s) — doing heavy work there causes an ANR. Fix: in `onReceive`, *enqueue WorkManager* or use `goAsync()` for brief work (don't do it inline); in a `Service`, offload to a coroutine (`lifecycleScope`) and don't block the main thread. The receiver/service should be a lightweight *trigger*, not the executor of heavy work.",
      },
      {
        t: "list",
        items: [
          "**Main-thread limits** — ~10s receiver, ~20s service start.",
          "**Receiver** — enqueue WorkManager / `goAsync()` for brief work.",
          "**Service** — offload to a coroutine; don't block main.",
          "**Trigger, not executor** — of heavy work.",
        ],
      },
      {
        t: "note",
        text: "onReceive (~10s) and Service callbacks (~20s) run on main with time limits — heavy work there ANRs. Fix: receiver enqueues WorkManager or goAsync() for brief work; Service offloads to a coroutine (lifecycleScope), never blocking main. The receiver/service is a lightweight trigger, not the executor of heavy work.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between a CPU-bound and GPU-bound janky frame?",
    a: [
      {
        t: "p",
        text: "A *CPU-bound* frame is slow because *main-thread work* (measure/layout, recomposition, computation, allocations) overran the budget — fix by reducing that work. A *GPU-bound* frame is slow because *rendering* (rasterization on the RenderThread) took too long — usually *overdraw*, complex shaders, large/expensive drawing — fix by reducing overdraw and drawing complexity. A system trace shows which: long main-thread work vs long GPU/RenderThread work.",
      },
      {
        t: "list",
        items: [
          "**CPU-bound** — main-thread work overran (layout/recompose/compute).",
          "**GPU-bound** — rendering (rasterization) too long (overdraw/complex draw).",
          "**Trace shows which** — main-thread vs GPU/RenderThread duration.",
          "**Fix accordingly** — reduce main work vs draw complexity.",
        ],
      },
      {
        t: "note",
        text: "CPU-bound frame: main-thread work (measure/layout/recompose/compute/allocations) overran — reduce that. GPU-bound frame: rendering (rasterization) took too long — usually overdraw/complex draw — reduce those. A system trace shows which (long main-thread vs long GPU/RenderThread). Fix the actual bottleneck.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is a frozen frame, and why is it worse than a slow frame?",
    a: [
      {
        t: "p",
        text: "A *slow frame* misses the frame budget (>16ms) — a brief stutter the user may barely notice. A *frozen frame* takes >700ms — the app visibly *hangs* for most of a second, which users perceive as the app being broken (much worse than a stutter). Frozen frames usually indicate a big main-thread block (sync I/O, huge computation, a giant layout) — closer to a mini-ANR. Play vitals tracks both separately; eliminating frozen frames is higher priority.",
      },
      {
        t: "list",
        items: [
          "**Slow frame** — >16ms; brief stutter.",
          "**Frozen frame** — >700ms; app visibly hangs (much worse).",
          "**Cause** — big main-thread block (sync I/O, huge layout).",
          "**Priority** — eliminate frozen frames first.",
        ],
      },
      {
        t: "note",
        text: "Slow frame (>16ms) = brief stutter; frozen frame (>700ms) = the app visibly hangs for most of a second (users read it as broken — much worse, like a mini-ANR). Frozen frames usually mean a big main-thread block. Play vitals tracks both; eliminating frozen frames is higher priority.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle heavy computation without janking the UI?",
    a: [
      {
        t: "p",
        text: "Move it off the main thread — `withContext(Dispatchers.Default)` for CPU-bound work — and post only the result back to Main. If the computation must partly touch the main thread (or produces incremental UI), *chunk* it and `yield()` between chunks so frames can render in between. For truly heavy or repeated work, cache/precompute results. Never run an O(n) loop over a large dataset on the main thread during a frame — it blows the budget.",
      },
      {
        t: "code",
        title: "Offloading + chunking",
        code: `// CPU-bound work off the main thread\nval result = withContext(Dispatchers.Default) { expensiveCompute(data) }\nrender(result) // back on Main\n\n// or chunk long work so frames can render between pieces\nfor (chunk in items.chunked(500)) { process(chunk); yield() }`,
      },
      {
        t: "note",
        text: "Heavy computation: move off main with withContext(Dispatchers.Default), post only the result back to Main. If it must touch main incrementally, chunk it and yield() between chunks so frames render. Cache/precompute repeated work. Never run an O(n) loop over a large dataset on main during a frame — it blows the budget.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between a soft and hard ANR?",
    a: [
      {
        t: "p",
        text: "A *soft* (input-dispatch) ANR fires when the app fails to process an *input event* within ~5s — the user's tap/scroll goes unanswered, triggering the 'App isn't responding' dialog. A *hard* ANR-type situation relates to component timeouts — a `BroadcastReceiver` not finishing `onReceive` in time, or a service/foreground-service-start timeout. The common root cause is the same: the *main thread is blocked*. Both are diagnosed via the ANR trace showing the stuck main thread.",
      },
      {
        t: "list",
        items: [
          "**Soft (input) ANR** — no response to input within ~5s.",
          "**Component timeout** — receiver/service didn't finish in time.",
          "**Common cause** — blocked main thread.",
          "**Diagnose** — ANR trace of the stuck main thread.",
        ],
      },
      {
        t: "note",
        text: "Soft/input ANR: failed to process an input event within ~5s ('App isn't responding'). Component-timeout ANRs: a BroadcastReceiver/service didn't finish in its window. Both share a root cause — a blocked main thread — and are diagnosed via the ANR trace showing the stuck main thread.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is StrictMode, and how does it help catch jank sources?",
    a: [
      {
        t: "p",
        text: "`StrictMode` (debug tool) detects *main-thread policy violations* — disk/network I/O on the UI thread — which are prime jank/ANR causes, and *VM violations* (leaked Activities, unclosed resources). Enable it in debug builds with `penaltyLog`/`penaltyDeath` to catch these mistakes *during development*, before they ship as production jank. It surfaces accidental main-thread I/O you might not notice otherwise.",
      },
      {
        t: "list",
        items: [
          "**Thread policy** — main-thread disk/network I/O detection.",
          "**VM policy** — leaks, unclosed resources.",
          "**Debug only** — `penaltyLog`/`penaltyDeath`.",
          "**Catch early** — accidental main-thread I/O before production.",
        ],
      },
      {
        t: "note",
        text: "StrictMode (debug) detects main-thread I/O (disk/network on the UI thread — prime jank/ANR causes) and VM violations (leaks, unclosed resources). Enable in debug (penaltyLog/penaltyDeath) to catch accidental main-thread I/O during development, before it ships as production jank.",
      },
    ],
  },
];

export default qa;
