// Buffering, Conflation & Backpressure — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What is backpressure, and how does Kotlin Flow handle it?",
    a: [
      {
        t: "p",
        text: "**The concept**: backpressure is what happens when a producer emits values *faster* than the collector can consume them. Without a strategy, values pile up (unbounded memory) or get lost. In RxJava this required special reactive types and explicit strategies.",
      },
      {
        t: "p",
        text: "**How Flow handles it — for free, by default:** through **suspension**. `emit` is a suspend function, and flows are sequential, so producing the next value can't begin until the current value has been fully processed downstream. If the collector is slow, `emit` simply *suspends the producer* until the collector is ready. The producer automatically runs at the collector's pace — nothing is dropped, memory stays bounded, and there's no special API to learn. The only cost is latency: the producer idles while the collector works (their times add up serially). When that serial cost matters, you opt into `buffer` to let them run concurrently.",
      },
    ],
  },
  {
    level: "junior",
    q: "What does the buffer() operator do?",
    a: [
      {
        t: "p",
        text: "**The concept**: by default a flow runs the producer and collector in lockstep — the producer waits for the collector to finish each value. `buffer()` inserts a channel between them so they run **concurrently**: the producer emits into the buffer and keeps going without waiting, while the collector drains the buffer at its own speed. This overlaps their work and improves throughput when the producer has idle time between emissions (e.g. it does I/O).",
      },
      {
        t: "code",
        title: "The speedup",
        code: `flow { repeat(3) { delay(100); emit(it) } }   // 100ms per item
  .buffer()
  .collect { delay(300) }                     // 300ms per item
// Without buffer: serial -> (100+300)*3 = 1200ms
// With buffer: overlapped -> ~1000ms (producer works ahead)`,
      },
      {
        t: "p",
        text: "The tradeoff is **memory for latency** — you hold buffered values so neither side blocks the other. You can bound the buffer (`buffer(capacity)`) and set an overflow policy (`SUSPEND`, `DROP_OLDEST`, `DROP_LATEST`) for when it fills. Without a bound, a fast producer feeding a slow collector grows the buffer indefinitely, so bound it or use a drop policy in that scenario.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between buffer() and conflate()?",
    a: [
      {
        t: "p",
        text: "**Both let the producer run ahead of the collector, but they handle the backlog differently.** `buffer()` **keeps all** the values — the collector eventually processes every one, just later. `conflate()` **keeps only the latest** — when the collector is slow, intermediate values are dropped, and when it's ready for the next value it gets the most recent one the producer emitted.",
      },
      {
        t: "list",
        items: [
          "Use **`buffer`** when every value matters and you just want throughput — e.g. processing a stream of items each of which must be handled.",
          "Use **`conflate`** when the collector only cares about the *current/latest* value and intermediates are pointless — e.g. a live price ticker or progress indicator, where rendering every intermediate frame the collector was too slow to see would be wasted work.",
          "Memory-wise, `conflate` is bounded (it holds at most the latest value); `buffer` holds as many as its capacity allows.",
        ],
      },
      {
        t: "p",
        text: "A neat way to remember it: `conflate()` is essentially `buffer` with a 'drop oldest, keep newest' overflow policy and minimal capacity. And it's exactly why `StateFlow` behaves the way it does — state only cares about 'now', so it's conflated by design.",
      },
    ],
  },
  {
    level: "junior",
    q: "If Flow handles backpressure automatically, when do you actually need buffer or conflate?",
    a: [
      {
        t: "p",
        text: "**The default (suspension) is correct most of the time** — it's safe (nothing lost) and memory-bounded. You reach for `buffer`/`conflate` only to address the default's one downside: because producer and collector run serially, their times add up, which can be too slow.",
      },
      {
        t: "list",
        items: [
          "**Add `buffer`** when the producer and collector each take real time and running them *concurrently* would meaningfully speed things up — and you need every value. Example: a flow that reads pages from disk (producer) and parses them (collector); buffering lets the next page load while the current one parses.",
          "**Add `conflate` (or `collectLatest`)** when the collector can't keep up *and* only the latest value is relevant — a fast sensor stream feeding a UI that just shows the current reading. Here you *want* to skip the backlog.",
          "**Leave it alone** when values arrive slowly relative to processing (the common case) — adding buffering does nothing useful and only adds memory/complexity.",
        ],
      },
      {
        t: "p",
        text: "So the honest answer is: usually you don't need them. They're targeted optimizations for 'producer and collector are both slow, and I either want to overlap them (buffer) or only care about the latest (conflate)'.",
      },
    ],
  },
  {
    level: "senior",
    q: "Explain the difference between conflate() and collectLatest(). When would you choose each?",
    a: [
      {
        t: "p",
        text: "**Both give you 'latest wins' behavior for a slow collector, but at different points.** `conflate()` acts *before* processing: it drops intermediate values so the collector's block only ever *starts* with values it can keep up with — and once a block starts, it **runs to completion**. `collectLatest()` acts *during* processing: it starts the block for *every* value, but **cancels** the in-progress block if a newer value arrives, so only the latest value's processing survives.",
      },
      {
        t: "code",
        title: "The behavioral difference",
        code: `// conflate: some values skipped, but each STARTED block finishes
flow.conflate().collect { writeToDb(it) }        // every write that starts, completes

// collectLatest: every value starts, superseded ones are CANCELLED mid-way
flow.collectLatest { writeToDb(it) }             // an in-progress write may be cancelled`,
      },
      {
        t: "list",
        items: [
          "**Choose `conflate`** when the per-value work must not be interrupted once begun — a DB write, a file operation, anything where a half-done cancellation is bad. You accept that some values are never processed, but the ones that are, complete cleanly.",
          "**Choose `collectLatest`/`flatMapLatest`** when the work is *cancellable and worth abandoning* when stale — search-as-you-type, recomputing an expensive result for the newest input. The whole point is that finishing outdated work is wasteful and possibly harmful (stale-result race), so cancelling it is desirable.",
          "**The subtle senior point**: `conflate` never cancels — it's about *delivery* (which values reach the collector). `collectLatest` is about *cancellation* (which in-progress work survives). If your processing has side effects that shouldn't be interrupted, that distinction decides correctness, not just performance.",
        ],
      },
    ],
  },
  {
    level: "senior",
    q: "How does buffer() interact with flowOn, and how do multiple buffer stages behave in a pipeline?",
    a: [
      {
        t: "p",
        text: "**They're deeply related — both introduce a channel between stages.** `flowOn(dispatcher)` changes the context of the *upstream* and, to do so, it must run upstream in a different coroutine, which requires a channel to hand values across — so `flowOn` *implicitly buffers*. That means adding `flowOn` already decouples the upstream from the downstream (they run concurrently on different dispatchers), giving you a throughput benefit similar to `buffer` as a side effect.",
      },
      {
        t: "list",
        items: [
          "**Each `buffer`/`flowOn` boundary is a concurrency stage**: values cross a channel, and the stages on either side run in parallel. So a pipeline `A.map{}.flowOn(io).buffer().collect{}` has the `io`-dispatched upstream, a buffer, and the collector all potentially running concurrently — a small pipeline of overlapping stages.",
          "**Multiple buffers compound**: each `buffer()` adds another channel and another capacity, so `flow.buffer().map{}.buffer().collect{}` creates two decoupled stages. This can help (more overlap) or hurt (more memory, more latency between first emission and first collection) — measure rather than sprinkle.",
          "**Adjacent buffers may be fused**: the Flow implementation fuses consecutive `buffer`/`flowOn`/`conflate` operators where possible (e.g. `buffer(); buffer()` becomes one channel with combined capacity; `conflate(); buffer()` resolves per rules), so you don't always pay for every operator literally — but relying on fusion is fragile; write the intent you mean.",
          "**Practical rule**: you rarely need explicit `buffer` if you already have a `flowOn` boundary where the expensive work happens — the `flowOn` gives you the concurrency. Add explicit `buffer` only when producer and collector are on the *same* context but you still want them overlapped, or to set a specific capacity/overflow policy.",
        ],
      },
      {
        t: "p",
        text: "**The mental model to convey**: think of `buffer`, `flowOn`, and `conflate` as all placing a channel between pipeline stages — that's why they share capacity/overflow parameters and why they interact. Understanding that they're the *same underlying mechanism* (a channel handoff) is what separates surface knowledge from real understanding here.",
      },
    ],
  },
  {
    level: "senior",
    q: "A flow producing values rapidly is causing memory growth or UI lag. Walk through diagnosing and choosing a backpressure strategy.",
    a: [
      {
        t: "list",
        items: [
          "**1. Identify the mismatch**: confirm it's producer-faster-than-collector. Profile where time goes — is the *collector* slow (heavy per-value work: parsing, DB writes, recomposition) or is the *producer* flooding (a high-frequency sensor/socket)? The fix differs.",
          "**2. Decide: do you need every value?** This is the pivotal question. If yes → keep-all strategies (`buffer`, fix the slow collector). If no, only latest matters → drop strategies (`conflate`, `collectLatest`, `sample`, `debounce`).",
          "**3. If every value matters and memory is growing**: an unbounded buffer somewhere (explicit `buffer()` with no cap, or a `channelFlow`/`callbackFlow` with unlimited capacity) is queuing faster than draining. Bound it (`buffer(capacity)`), and if the collector simply can't keep up long-term, that's a design problem — move work off the hot path, batch, or apply `sample` to reduce rate deliberately.",
          "**4. If only the latest matters (typical UI case)**: `conflate()` (skip intermediates, keep newest) for a stream you render, or `collectLatest`/`flatMapLatest` if the per-value work is cancellable and stale computations should be abandoned. For time-based thinning, `sample(interval)` (regular snapshots) or `debounce(timeout)` (wait for quiet) cut the rate at the source.",
          "**5. If the collector is slow due to threading**: ensure the collector isn't doing heavy work on the main thread — move it with `flowOn` on the upstream heavy stage, or process off-main, so the UI isn't the bottleneck.",
          "**6. Verify with numbers**: re-profile memory and frame timing after the change — backpressure fixes are easy to cargo-cult; confirm the buffer is bounded and the UI keeps up.",
        ],
      },
      {
        t: "p",
        text: "**The framing**: the entire decision reduces to 'must I process every value, or only the latest?' plus 'where is the actual bottleneck?'. Rapid producer + UI that shows current state → `conflate`/`sample`. Rapid producer + must-process-all → bounded `buffer` and a faster or off-loaded collector. Naming that decision tree, and bounding any unbounded buffer, is the senior-level answer.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is backpressure, in plain terms?",
    a: [
      {
        t: "p",
        text: "Backpressure is the problem of a *producer emitting faster than a consumer can process*. Without a strategy, the excess values pile up (growing memory) or the consumer falls behind. 'Backpressure handling' means the system pushes back on the producer (slow it down) or manages the overflow (buffer, drop, conflate) so it stays stable.",
      },
      {
        t: "list",
        items: [
          "**The mismatch** — fast producer, slow consumer; values accumulate or the consumer lags.",
          "**Strategies** — slow the producer (suspension), buffer, drop, or keep only the latest (conflate).",
          "**Goal** — bounded memory and predictable behavior under load.",
          "**Examples** — sensor data at 100Hz feeding a UI, rapid DB updates, a fast network stream to a slow parser.",
        ],
      },
      {
        t: "note",
        text: "Backpressure = a producer emitting faster than the consumer can handle, causing pile-up or lag. Handling it means pushing back on the producer (suspension) or managing overflow (buffer/drop/conflate) to keep memory bounded and behavior stable — e.g. 100Hz sensor data into a slow UI.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does Flow's suspension-based backpressure differ from RxJava's strategies?",
    a: [
      {
        t: "p",
        text: "Kotlin Flow handles backpressure *automatically via suspension*: because `emit` is a suspend function, if the collector is slow, `emit` simply suspends until the collector is ready — the producer naturally waits, no explicit strategy needed. RxJava (Flowable) requires you to choose a `BackpressureStrategy` (BUFFER, DROP, LATEST, etc.) explicitly, and Observable has no backpressure at all.",
      },
      {
        t: "list",
        items: [
          "**Flow** — `emit` suspends when the collector is busy; backpressure is built into the suspension model (no config for the basic case).",
          "**RxJava `Flowable`** — explicit `BackpressureStrategy`; `Observable` ignores backpressure (can overflow).",
          "**Opt into more** — Flow adds `buffer`/`conflate`/`collectLatest` only when you *want* to decouple or drop.",
          "**Simpler default** — Flow's sequential suspension 'just works' for the common case.",
        ],
      },
      {
        t: "note",
        text: "Flow handles backpressure automatically via suspension — emit suspends when the collector is slow, so the producer waits (no config needed). RxJava requires an explicit BackpressureStrategy on Flowable (Observable has none). Flow adds buffer/conflate/collectLatest only when you want to decouple or drop.",
      },
    ],
  },
  {
    level: "senior",
    q: "What does conflate() do precisely, and what does it drop?",
    a: [
      {
        t: "p",
        text: "`conflate()` keeps only the *latest* value when the collector is slower than the producer — intermediate values emitted while the collector was busy are dropped. It decouples producer and collector (like `buffer`) but with a capacity-1 conflating buffer: the collector always processes the most recent value, skipping stale ones. Great when only the newest value matters.",
      },
      {
        t: "code",
        title: "conflate keeps the latest",
        code: `fastProducer
    .conflate()               // drop intermediates; collector gets the newest available
    .collect { slowRender(it) }   // if 1,2,3 emitted during a render, next sees 3`,
      },
      {
        t: "list",
        items: [
          "**Keeps latest** — drops values the collector missed while busy.",
          "**Decouples** — producer isn't slowed to the collector's speed (unlike default).",
          "**Capacity-1 conflating** — always the most recent value survives.",
          "**Use** — progress bars, live position, UI state where stale intermediates are useless.",
        ],
      },
      {
        t: "note",
        text: "conflate() keeps only the latest value when the collector lags — intermediates emitted while it was busy are dropped (capacity-1 conflating buffer), and the producer isn't slowed. Use it when only the newest value matters (progress, live position, latest state). StateFlow is inherently conflated.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is collectLatest, and how does it handle a slow collector?",
    a: [
      {
        t: "p",
        text: "`collectLatest { }` *cancels the collector block* when a new value arrives and restarts it with the newest value. Unlike `conflate` (which lets the current processing finish and just skips intermediates), `collectLatest` actively abandons in-progress work for a superseded value. Ideal when processing a value is cancellable and only the latest should complete (search, rendering the latest state).",
      },
      {
        t: "code",
        title: "collectLatest cancels stale work",
        code: `queryFlow.collectLatest { query ->
    val results = repository.search(query)   // cancelled if a new query arrives mid-search
    render(results)
}`,
      },
      {
        t: "list",
        items: [
          "**Cancel-and-restart** — a new value cancels the running block and starts fresh.",
          "**vs `conflate`** — conflate lets current processing finish (skips intermediates); collectLatest cancels it.",
          "**Best when work is cancellable** — the abandoned processing is genuinely stopped (suspending work).",
          "**Uses** — search, rendering only the latest state, any 'only the newest matters and processing is cancellable' case.",
        ],
      },
      {
        t: "note",
        text: "collectLatest { } cancels the collector block when a new value arrives and restarts with the latest — actively abandoning stale processing (vs conflate, which lets current work finish and just skips intermediates). Use it when processing is cancellable and only the newest value should complete (search, latest-state rendering).",
      },
    ],
  },
  {
    level: "senior",
    q: "What buffer overflow strategies does buffer() support?",
    a: [
      {
        t: "p",
        text: "`buffer(capacity, onBufferOverflow)` lets you choose what happens when the buffer fills: `SUSPEND` (default — the producer waits, preserving all values with backpressure), `DROP_OLDEST` (discard the oldest buffered value), or `DROP_LATEST` (discard the incoming value). You can also pass special capacities like `Channel.CONFLATED` or `Channel.UNLIMITED`.",
      },
      {
        t: "code",
        title: "buffer with overflow policy",
        code: `flow.buffer(capacity = 64, onBufferOverflow = BufferOverflow.DROP_OLDEST)
flow.buffer(Channel.CONFLATED)      // == conflate()
flow.buffer(Channel.UNLIMITED)      // never suspends producer (OOM risk)`,
      },
      {
        t: "list",
        items: [
          "**SUSPEND (default)** — producer waits when full; no loss, backpressure applied.",
          "**DROP_OLDEST** — keep the newest values (drop oldest buffered).",
          "**DROP_LATEST** — keep buffered values, drop new ones under pressure.",
          "**Special capacities** — `CONFLATED` (latest only), `UNLIMITED` (unbounded — memory risk), `RENDEZVOUS` (no buffer).",
        ],
      },
      {
        t: "note",
        text: "buffer(capacity, onBufferOverflow): SUSPEND (default — producer waits, no loss), DROP_OLDEST (keep newest), DROP_LATEST (keep buffered). Special capacities: CONFLATED (==conflate), UNLIMITED (OOM risk), RENDEZVOUS (no buffer). Choose by whether values can be dropped and which to keep.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why is a Flow sequential by default, with no buffering?",
    a: [
      {
        t: "p",
        text: "By default the producer and collector run in the *same coroutine*, so emitting a value directly invokes the collector and waits for it to finish before producing the next. There's no buffer — the producer is paced by the collector (natural backpressure). You add `buffer()` only when you want the producer and collector to run *concurrently* (overlap production with consumption).",
      },
      {
        t: "list",
        items: [
          "**Same coroutine** — emit → collect → resume producer, one value at a time.",
          "**Natural backpressure** — a slow collector slows the producer; no unbounded pile-up.",
          "**No concurrency by default** — production and consumption don't overlap.",
          "**`buffer()`** — decouples them so the producer can work ahead while the collector processes.",
        ],
      },
      {
        t: "note",
        text: "By default producer and collector share one coroutine — emit invokes the collector and waits, so it's sequential with natural backpressure (slow collector paces the producer, no pile-up). Add buffer() to run producer and collector concurrently (producer works ahead while the collector processes).",
      },
    ],
  },
  {
    level: "senior",
    q: "How does buffer() improve throughput by decoupling stages?",
    a: [
      {
        t: "p",
        text: "`buffer()` inserts a channel between the producer and collector so they run *concurrently* in separate coroutines — the producer keeps emitting into the buffer while the collector processes at its own pace. This overlaps their work, so the total time approaches the *slower* of the two stages rather than their sum, improving throughput when both stages take real time.",
      },
      {
        t: "code",
        title: "Concurrent stages",
        code: `flow {
    repeat(3) { emit(produce(it)); }   // e.g. 100ms each
}
.buffer()                              // producer and collector run concurrently
.collect { consume(it) }               // e.g. 100ms each
// Without buffer: ~600ms (serial). With buffer: ~400ms (overlapped)`,
      },
      {
        t: "list",
        items: [
          "**Concurrent execution** — producer and collector run in parallel coroutines via a channel.",
          "**Overlap** — production of the next value overlaps consumption of the current.",
          "**Throughput** — total time ≈ the slower stage, not the sum.",
          "**Cost** — memory for the buffer and some coordination overhead.",
        ],
      },
      {
        t: "note",
        text: "buffer() puts a channel between producer and collector so they run concurrently — the producer emits ahead while the collector processes. Work overlaps, so total time ≈ the slower stage (not the sum), improving throughput when both stages take real time. Cost: buffer memory + coordination.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does flowOn relate to buffering?",
    a: [
      {
        t: "p",
        text: "`flowOn(dispatcher)` changes the upstream's dispatcher, and because upstream and downstream now run on *different threads*, it introduces a *channel* (buffer) between them — so `flowOn` inherently adds concurrency/buffering at the boundary. Adjacent `flowOn` and `buffer` operators are *fused* by the runtime into a single efficient channel rather than stacking buffers.",
      },
      {
        t: "list",
        items: [
          "**`flowOn` implies a boundary** — upstream on one dispatcher, downstream on another, connected by a channel.",
          "**Implicit buffer** — that channel provides some decoupling between the stages.",
          "**Operator fusion** — consecutive `flowOn`/`buffer` merge into one channel with the combined config (no redundant buffers).",
          "**Implication** — you rarely need `buffer()` right next to a `flowOn`; tune the fused capacity instead.",
        ],
      },
      {
        t: "note",
        text: "flowOn(dispatcher) runs upstream on another thread, introducing a channel (buffer) at the boundary — so it inherently adds concurrency. Adjacent flowOn/buffer operators are FUSED into one efficient channel (no stacked buffers). So you rarely need buffer() right beside a flowOn; adjust the fused capacity instead.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the cost of buffering, and how do you choose a capacity?",
    a: [
      {
        t: "p",
        text: "Buffering trades *memory* and *latency* for *throughput*. A larger buffer lets the producer run further ahead (better throughput, smoother bursts) but uses more memory and can increase latency (values sit in the buffer longer) and hide a slow consumer. Choose the smallest capacity that smooths your bursts; avoid `UNLIMITED` (risks OOM by removing backpressure).",
      },
      {
        t: "list",
        items: [
          "**Memory** — the buffer holds up to N values; larger = more RAM.",
          "**Latency** — buffered values wait before consumption; large buffers add delay.",
          "**Throughput** — larger buffers absorb bursts and keep the producer busy.",
          "**Choosing** — small buffer for smoothing; measure; never `UNLIMITED` for unbounded producers (OOM).",
        ],
      },
      {
        t: "note",
        text: "Buffering trades memory + latency for throughput: bigger buffers smooth bursts and keep the producer busy but use more RAM, add latency (values wait), and can hide a slow consumer. Choose the smallest capacity that smooths your bursts; avoid UNLIMITED (removes backpressure → OOM risk).",
      },
    ],
  },
  {
    level: "senior",
    q: "How do backpressure and cancellation relate in collectLatest?",
    a: [
      {
        t: "p",
        text: "`collectLatest`/`mapLatest`/`flatMapLatest` handle backpressure by *cancelling* rather than buffering or suspending: when a new value arrives, the current (cancellable) processing is cancelled and restarted. This only helps if the processing is genuinely cancellable (has suspension points) — a non-suspending CPU block won't be interrupted, so `collectLatest` won't drop it mid-way.",
      },
      {
        t: "list",
        items: [
          "**Cancel-based backpressure** — supersede stale work by cancelling it.",
          "**Requires cancellable work** — suspension points let the cancellation take effect.",
          "**Non-cancellable blocks** — a tight CPU loop won't be interrupted; add `ensureActive`/`yield`.",
          "**vs suspend/buffer** — those preserve values; the *Latest operators discard in-progress work.",
        ],
      },
      {
        t: "note",
        text: "The *Latest operators (collectLatest/mapLatest/flatMapLatest) handle backpressure by cancelling in-progress processing when a new value arrives — but only if that processing is cancellable (has suspension points). A non-suspending CPU block won't be interrupted; add ensureActive/yield. Unlike suspend/buffer, they discard stale work rather than preserve it.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you decide between buffer, conflate, and collectLatest for a fast producer?",
    a: [
      {
        t: "p",
        text: "It comes down to whether you must process *every* value, only the *latest*, and whether processing is *cancellable*. `buffer` keeps all values (throughput, bounded memory); `conflate` keeps only the latest and lets current processing finish; `collectLatest` keeps only the latest and cancels in-progress processing.",
      },
      {
        t: "table",
        headers: ["Operator", "Keeps", "In-progress work"],
        rows: [
          ["buffer(n)", "all (up to n)", "runs to completion"],
          ["conflate", "latest only", "current finishes, intermediates skipped"],
          ["collectLatest", "latest only", "cancelled and restarted"],
        ],
      },
      {
        t: "list",
        items: [
          "**`buffer`** — must process every value; overlap producer/consumer.",
          "**`conflate`** — only latest matters; don't cancel current work (non-cancellable render).",
          "**`collectLatest`** — only latest matters AND processing is cancellable (search).",
          "**Decision** — every value? → buffer. Latest only? → conflate (keep current) or collectLatest (cancel current).",
        ],
      },
      {
        t: "note",
        text: "buffer(n): keep all values, run each to completion (throughput). conflate: keep latest, let current work finish, skip intermediates. collectLatest: keep latest, CANCEL in-progress work. Decide: process every value → buffer; only latest → conflate (don't cancel) or collectLatest (cancel, if work is cancellable).",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you handle a burst of high-frequency sensor or scroll data?",
    a: [
      {
        t: "p",
        text: "For high-frequency streams (accelerometer, scroll offset), you usually don't need every sample — apply *rate reduction*: `sample(interval)` to take the latest value every N ms, `conflate()` to always process the newest, or `debounce` if you want to react only after motion stops. This protects the UI from a flood of updates and unnecessary recompositions.",
      },
      {
        t: "code",
        title: "Rate-reducing a sensor stream",
        code: `sensorFlow
    .sample(100)                    // at most 10 updates/sec (latest each 100ms)
    .conflate()                     // or always process the newest available
    .collect { updateUi(it) }`,
      },
      {
        t: "list",
        items: [
          "**`sample(t)`** — periodic snapshots of the latest value (steady UI update rate).",
          "**`conflate()`** — always process the most recent, skip the backlog.",
          "**`debounce(t)`** — react only after the stream pauses (e.g. scroll settle).",
          "**Move off main** — `flowOn` for any heavy processing, keep UI updates on Main.",
        ],
      },
      {
        t: "note",
        text: "For high-frequency data (sensors, scroll), reduce the rate: sample(t) (latest every N ms — steady update rate), conflate() (always newest, skip backlog), or debounce (react after it stops). Protects the UI from update floods/recomposition storms. Process heavy work with flowOn, update UI on Main.",
      },
    ],
  },
  {
    level: "senior",
    q: "Fast Room updates are causing UI jank. How do you diagnose and choose a strategy?",
    a: [
      {
        t: "p",
        text: "First confirm the cause: a Room `Flow` re-emits on every table change, so frequent writes cause rapid emissions and recompositions. Then reduce pressure at the right layer: `distinctUntilChanged` to skip no-op emissions, `conflate`/`sample` to cap the UI update rate, `debounce` if updates cluster, and ensure heavy mapping runs on `flowOn(Default)` — not on the main thread.",
      },
      {
        t: "list",
        items: [
          "**Diagnose** — is the Flow emitting more than the UI can render? Check emission frequency and mapping cost.",
          "**`distinctUntilChanged`** — drop emissions that didn't actually change the rendered data.",
          "**`conflate`/`sample`** — cap the UI update rate to what's perceivable (e.g. sample(16) ≈ per-frame).",
          "**`flowOn(Default)`** — move expensive mapping off the main thread.",
          "**Batch writes** — reduce the source frequency (transaction batching) if you control the writes.",
        ],
      },
      {
        t: "note",
        text: "Room Flows re-emit on every write, so rapid writes → emission/recomposition storms. Diagnose emission rate + mapping cost, then: distinctUntilChanged (drop no-ops), conflate/sample (cap UI update rate), debounce (clustered updates), flowOn(Default) for heavy mapping, and batch writes at the source if possible.",
      },
    ],
  },
  {
    level: "junior",
    q: "What happens when the consumer is faster than the producer?",
    a: [
      {
        t: "p",
        text: "Then there's *no backpressure problem* — the consumer simply waits (suspends) for the next value. In a default sequential flow, the collector's `collect` suspends until the producer emits again. No buffering, dropping, or conflation is needed; backpressure operators only matter when the *producer* outpaces the *consumer*.",
      },
      {
        t: "list",
        items: [
          "**Consumer waits** — `collect` suspends until the next emission.",
          "**No overflow** — nothing accumulates; the producer sets the pace.",
          "**No special operators** — `buffer`/`conflate` are unnecessary here.",
          "**Symmetry** — backpressure is only about a fast producer / slow consumer.",
        ],
      },
      {
        t: "note",
        text: "If the consumer is faster, there's no backpressure issue — the collector just suspends waiting for the next emission (producer sets the pace, nothing accumulates). buffer/conflate/collectLatest matter only when the PRODUCER outpaces the consumer.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do StateFlow and SharedFlow handle backpressure?",
    a: [
      {
        t: "p",
        text: "`StateFlow` handles it by *conflation* — it holds one value, so a slow collector just sees the latest (intermediates dropped), and emitters never suspend. `SharedFlow` handles it via its buffer + `onBufferOverflow`: SUSPEND applies backpressure (emitters wait), or DROP_OLDEST/DROP_LATEST drop values. So both hot flows avoid unbounded growth, but with different guarantees.",
      },
      {
        t: "list",
        items: [
          "**StateFlow** — conflated; latest-only; setting `.value` never suspends.",
          "**SharedFlow** — buffer + overflow policy: SUSPEND (backpressure) or DROP (loss).",
          "**No unbounded growth** — hot flows don't pile up indefinitely (unlike an UNLIMITED buffer).",
          "**Implication** — StateFlow is lossy for intermediates by design; SharedFlow you configure.",
        ],
      },
      {
        t: "note",
        text: "StateFlow: conflation — one value, slow collectors see the latest, emitters never suspend (lossy for intermediates by design). SharedFlow: buffer + onBufferOverflow — SUSPEND (backpressure) or DROP_OLDEST/LATEST (loss). Both avoid unbounded growth, with different guarantees you choose for SharedFlow.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is operator fusion, and how does it optimize buffer/flowOn chains?",
    a: [
      {
        t: "p",
        text: "The Flow runtime *fuses* adjacent context-changing and buffering operators (`flowOn`, `buffer`, `conflate`) into a single channel with the combined configuration, instead of creating a separate channel/coroutine per operator. This avoids redundant buffers and coroutine hops, making a chain like `.flowOn(IO).buffer()` as efficient as one boundary.",
      },
      {
        t: "list",
        items: [
          "**Fusion** — consecutive `flowOn`/`buffer`/`conflate` merge into one channel with merged config.",
          "**Avoids overhead** — no stacked buffers or extra coroutine boundaries.",
          "**Config wins** — the effective capacity/overflow is the combination (e.g. a later `conflate` overrides buffering).",
          "**Practical** — don't over-add buffering operators; the runtime already optimizes adjacent ones.",
        ],
      },
      {
        t: "note",
        text: "Operator fusion merges adjacent flowOn/buffer/conflate into a single channel with combined config — no stacked buffers or extra coroutine hops. So .flowOn(IO).buffer() is one efficient boundary. Don't pile on buffering operators expecting more buffers; the runtime fuses them.",
      },
    ],
  },
  {
    level: "junior",
    q: "When is dropping values acceptable, and when must you keep them all?",
    a: [
      {
        t: "p",
        text: "Drop values when only the *current state* matters and intermediates are meaningless — UI state, progress, live position, sensor readings (conflate/collectLatest/sample). Keep every value when each represents a discrete *event or data item* you can't lose — transactions, messages, analytics events, items in a processing pipeline (buffer with SUSPEND, or a Channel).",
      },
      {
        t: "list",
        items: [
          "**Drop OK** — latest-state scenarios: UI state, progress, cursor position, sensor value.",
          "**Keep all** — discrete events/items: messages, transactions, analytics, work items.",
          "**Operators** — conflate/collectLatest/sample (drop) vs buffer(SUSPEND)/Channel (keep).",
          "**Ask** — 'if I skip an intermediate, does anything break?' If no, drop; if yes, keep.",
        ],
      },
      {
        t: "note",
        text: "Drop values when only the current state matters (UI state, progress, position, sensors — conflate/collectLatest/sample). Keep every value when each is a discrete event/item you can't lose (messages, transactions, analytics, work items — buffer(SUSPEND)/Channel). Ask: 'does skipping an intermediate break anything?'",
      },
    ],
  },
  {
    level: "senior",
    q: "How does buffer capacity relate to Channel capacity?",
    a: [
      {
        t: "p",
        text: "`buffer()` is implemented with a `Channel` under the hood, so its capacity and overflow semantics *are* the channel's: `buffer(64)` uses a 64-capacity channel, `buffer(Channel.CONFLATED)` a conflated channel, `buffer(Channel.UNLIMITED)` an unlimited one, and the default `buffer()` uses a small default buffer. Understanding channels explains buffer behavior exactly.",
      },
      {
        t: "list",
        items: [
          "**Same primitive** — `buffer` inserts a `Channel` between producer and collector.",
          "**Capacities map** — `RENDEZVOUS`/`CONFLATED`/`UNLIMITED`/`BUFFERED` all valid.",
          "**`conflate()` = `buffer(CONFLATED)`** — a convenience for the conflated channel.",
          "**Overflow** — the channel's `onBufferOverflow` (SUSPEND/DROP_*) drives buffer behavior.",
        ],
      },
      {
        t: "note",
        text: "buffer() is backed by a Channel — its capacity/overflow ARE the channel's: buffer(64)=64-capacity, buffer(CONFLATED)=conflate(), buffer(UNLIMITED)=unbounded, default=small buffer; onBufferOverflow is the channel's overflow policy. Knowing channels explains buffer semantics exactly.",
      },
    ],
  },
  {
    level: "junior",
    q: "What's the difference between conflate() and sample()?",
    a: [
      {
        t: "p",
        text: "Both reduce a fast stream to fewer values, but by different triggers. `conflate()` is *demand-driven* — it emits the latest value whenever the collector is ready (skipping whatever piled up while it was busy). `sample(interval)` is *time-driven* — it emits the latest value on a fixed timer, regardless of collector readiness. Use `sample` for a steady update rate; `conflate` to always give the collector the freshest value as fast as it can take them.",
      },
      {
        t: "list",
        items: [
          "**`conflate`** — emits latest when the collector is free (paced by the collector).",
          "**`sample(t)`** — emits latest every `t` (paced by a timer).",
          "**Rate** — `sample` gives a predictable cadence; `conflate` is as-fast-as-consumed.",
          "**Choose** — steady periodic UI updates → sample; freshest value ASAP → conflate.",
        ],
      },
      {
        t: "note",
        text: "conflate() is demand-driven — emits the latest whenever the collector is ready (skips the backlog). sample(t) is time-driven — emits the latest every t regardless of the collector. sample for a steady cadence; conflate for the freshest value as fast as the collector can consume.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you rate-limit an event stream to protect the UI?",
    a: [
      {
        t: "p",
        text: "Pick the operator matching the desired behavior: `debounce(t)` (act after the burst stops — search input), `sample(t)` (steady snapshots — live counters), `throttleFirst` (act immediately then ignore — button clicks, not built-in), or `conflate` (always latest). The goal is to convert a flood of events into a manageable, UI-friendly rate without blocking the producer.",
      },
      {
        t: "list",
        items: [
          "**`debounce(t)`** — one emission after the stream is quiet for `t` (typing, resize).",
          "**`sample(t)`** — periodic latest value (progress, telemetry).",
          "**throttle-first** — immediate then cooldown (clicks); implement manually.",
          "**`conflate`** — always process the newest as fast as the UI can.",
          "**Keep the producer unblocked** — these drop/reduce rather than suspend the source.",
        ],
      },
      {
        t: "note",
        text: "Rate-limit events by intent: debounce(t) (after the burst stops — search/resize), sample(t) (steady snapshots — telemetry), throttle-first (immediate + cooldown — clicks, manual), conflate (always latest). Convert a flood into a UI-friendly rate without blocking the producer.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are the signs you have a backpressure problem?",
    a: [
      {
        t: "p",
        text: "Watch for growing memory (a buffer or list accumulating unprocessed values), UI lag or ANRs (the collector can't keep up while the producer floods it), or stale/laggy UI (updates arriving long after the underlying data changed). These symptoms mean the producer is outpacing the consumer and you need a backpressure strategy.",
      },
      {
        t: "list",
        items: [
          "**Rising memory** — an unbounded buffer/queue growing over time.",
          "**UI jank/ANR** — the main-thread collector overwhelmed by rapid emissions.",
          "**Laggy/stale UI** — buffered values consumed late, so the UI trails reality.",
          "**Diagnose** — measure emission rate vs processing time; check for `UNLIMITED` buffers and heavy per-value work.",
        ],
      },
      {
        t: "note",
        text: "Backpressure symptoms: growing memory (accumulating unprocessed values), UI jank/ANR (collector overwhelmed), and stale/laggy UI (values consumed late). Diagnose by comparing emission rate to processing time and checking for UNLIMITED buffers or heavy per-value work; then apply conflate/sample/buffer/collectLatest.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does buffering interact with flow completion and exceptions?",
    a: [
      {
        t: "p",
        text: "With `buffer()`, the producer runs ahead in its own coroutine, so completion and exceptions are delivered *through the buffer* — the collector processes buffered values first, then sees completion or the exception in order. A producer exception cancels the buffer and propagates downstream; already-buffered values may or may not be consumed depending on timing, so don't rely on exact delivery counts under failure.",
      },
      {
        t: "list",
        items: [
          "**Ordered through the buffer** — the collector drains buffered values, then receives completion/exception.",
          "**Producer exception** — propagates downstream (catchable with `catch`), cancelling the buffer.",
          "**Timing-dependent** — under failure, how many buffered values were consumed isn't guaranteed.",
          "**`catch` placement** — a `catch` after `buffer` handles upstream (including producer) exceptions.",
        ],
      },
      {
        t: "note",
        text: "With buffer(), the producer runs ahead, so the collector drains buffered values then receives completion/exception in order. A producer exception propagates downstream (catch after buffer handles it) and cancels the buffer; exact consumed counts under failure are timing-dependent — don't rely on them.",
      },
    ],
  },
  {
    level: "junior",
    q: "Do you always need a backpressure operator when using Flow?",
    a: [
      {
        t: "p",
        text: "No — Flow handles backpressure automatically via suspension, so for most cases you add *nothing*. You only reach for `buffer`/`conflate`/`sample`/`collectLatest` when you have a *specific* need: to overlap producer/consumer for throughput, to drop stale values, to cap an update rate, or to cancel superseded work. Adding them without a reason can cause unnecessary memory use or dropped data.",
      },
      {
        t: "list",
        items: [
          "**Default is fine** — sequential suspension handles the common case with natural backpressure.",
          "**Add operators for a reason** — throughput (`buffer`), latest-only (`conflate`/`collectLatest`), rate-limit (`sample`/`debounce`).",
          "**Don't over-apply** — needless buffers use memory; needless dropping loses data.",
          "**Measure first** — confirm a real producer/consumer mismatch before optimizing.",
        ],
      },
      {
        t: "note",
        text: "No — Flow's suspension-based backpressure handles most cases with nothing added. Reach for buffer/conflate/sample/collectLatest only for a specific need (throughput, latest-only, rate-limit, cancel-stale). Adding them without cause wastes memory or drops data — measure for a real mismatch first.",
      },
    ],
  },
];

export default qa;
