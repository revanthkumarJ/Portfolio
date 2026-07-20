// Buffering, Conflation & Backpressure — Content tab. Teaching-first.

const content = [
  {
    heading: "Backpressure — what happens when the producer is faster than the collector",
    blocks: [
      {
        t: "p",
        text: "**Backpressure** is the problem of a producer emitting values faster than the collector can process them. In RxJava this needed special types (`Flowable`) and strategies. Kotlin Flow solves it *by default and for free* through **suspension**: because `emit` is a suspend function and flows are sequential, when the collector is busy, `emit` simply **suspends the producer** until the collector is ready for the next value. No buffer overflows, no dropped values, no special API — the producer naturally slows to the collector's pace.",
      },
      {
        t: "code",
        title: "Default: producer waits for the collector",
        code: `flow {
    for (i in 1..3) {
        println("emitting $i")
        emit(i)                 // SUSPENDS here until collector finishes with i
    }
}.collect { value ->
    delay(1000)                 // slow collector
    println("collected $value")
}
// emitting 1 -> (1s) -> collected 1 -> emitting 2 -> ...
// Producer and collector run in lockstep; total ~3s`,
      },
      {
        t: "list",
        items: [
          "Because a flow is **sequential**, producing value N+1 can't start until value N has been fully processed downstream — the producer is automatically throttled to the collector's speed.",
          "This is the safest default: nothing is lost, memory stays bounded (no unbounded queue), and the two sides self-synchronize. The cost is *latency* — the producer idles while the collector works, so total time is roughly producer time + collector time added serially.",
          "When that serial cost hurts, you opt into concurrency between producer and collector with **`buffer`** — trading memory for throughput.",
        ],
      },
    ],
  },
  {
    heading: "buffer() — decouple producer and collector for throughput",
    blocks: [
      {
        t: "p",
        text: "`buffer(capacity)` inserts a channel between producer and collector so they run **concurrently**: the producer emits into the buffer without waiting for the collector, and the collector drains the buffer at its own pace. This overlaps their work, improving throughput when the producer has idle time (e.g. it does I/O between emissions).",
      },
      {
        t: "code",
        title: "buffer overlaps production and consumption",
        code: `flow {
    for (i in 1..3) { delay(100); emit(i) }   // producer: 100ms each
}
.buffer()                                     // run producer & collector concurrently
.collect { delay(300) }                       // collector: 300ms each

// WITHOUT buffer: (100+300)*3 = 1200ms (serial)
// WITH buffer: producer runs ahead while collector works -> ~1000ms`,
      },
      {
        t: "list",
        items: [
          "`buffer()` takes an optional capacity and an `onBufferOverflow` policy (SUSPEND/DROP_OLDEST/DROP_LATEST) — the same knobs as SharedFlow.",
          "The tradeoff is **memory for latency**: you hold buffered values in exchange for the two sides not blocking each other. With an unbounded producer and a slow collector, an unbounded buffer grows without limit — so bound it, or use a drop policy.",
          "`buffer` is also what several other operators are built on — `flowOn`, `conflate`, and `produceIn` all involve a channel between stages.",
        ],
      },
    ],
  },
  {
    heading: "conflate() — keep only the latest, drop intermediates",
    blocks: [
      {
        t: "p",
        text: "`conflate()` is a buffering strategy that says: **if the collector is slow, skip intermediate values and give it the latest**. When the collector finishes and asks for the next value, it gets the *most recent* one the producer emitted, and everything in between is dropped. It's `buffer(onBufferOverflow = DROP_OLDEST)` with capacity that keeps only the newest.",
      },
      {
        t: "code",
        title: "conflate drops values the collector was too slow to see",
        code: `flow {
    for (i in 1..100) { delay(10); emit(i) }   // fast producer
}
.conflate()
.collect { value ->
    delay(100)                                  // slow collector
    println(value)                              // prints latest: e.g. 1, 15, 31, ... 100
}`,
      },
      {
        t: "list",
        items: [
          "**When to use**: the collector only cares about the *latest* state, not every value — progress indicators, live sensor/price displays, UI that renders current state. Showing every intermediate would be pointless and wasteful.",
          "**When NOT to use**: every value matters (each must be processed/logged/persisted) — conflation silently loses data. Use `buffer` (keeps all) instead.",
          "This is exactly why `StateFlow` is conflated — state cares only about 'now'. `conflate()` gives any flow that same 'latest-wins' semantics.",
        ],
      },
    ],
  },
  {
    heading: "collectLatest / mapLatest — cancel in-progress work on new values",
    blocks: [
      {
        t: "p",
        text: "`conflate` drops intermediate values *before* the collector starts processing them. `collectLatest` (and `mapLatest`/`flatMapLatest`) take a different approach: they **start** processing every value, but **cancel** the in-progress processing if a newer value arrives. The difference matters when the per-value work is cancellable and you want the latest value's work to actually run to completion.",
      },
      {
        t: "code",
        title: "conflate vs collectLatest",
        code: `// conflate: collector processes some values fully, skips others entirely
flow.conflate().collect { process(it) }         // process() always completes

// collectLatest: collector starts every value, cancels if superseded
flow.collectLatest { value ->
    process(value)                              // CANCELLED mid-way if new value arrives
}`,
      },
      {
        t: "list",
        items: [
          "**`conflate`** — never cancels; it just doesn't deliver skipped values. Good when the processing itself isn't cancellable or you want each delivered value fully handled.",
          "**`collectLatest`** — cancels the block for the previous value when a new one arrives; only the latest value's processing survives to completion. Good when processing is expensive/cancellable and stale work should be abandoned (search-as-you-type).",
          "Subtle but real distinction interviewers probe: with `conflate`, an already-started `process()` finishes; with `collectLatest`, it gets cancelled. If `process()` writes to a DB, `conflate` completes the write, `collectLatest` might cancel it half-done — choose accordingly.",
        ],
      },
    ],
  },
  {
    heading: "The decision guide",
    blocks: [
      {
        t: "table",
        headers: ["Situation", "Tool", "Effect"],
        rows: [
          ["Default; every value matters, don't overwhelm memory", "(nothing — suspension)", "producer waits for collector; nothing lost"],
          ["Producer & collector both slow; overlap them", "`buffer()`", "concurrent; all values kept; uses memory"],
          ["Collector only needs the latest value", "`conflate()`", "skip intermediates; keep newest"],
          ["Per-value work is cancellable; only latest should complete", "`collectLatest` / `flatMapLatest`", "cancel in-progress work on new value"],
          ["Bounded buffer with explicit drop policy", "`buffer(n, onBufferOverflow = ...)`", "control exactly what happens when full"],
        ],
      },
      {
        t: "note",
        text: "Interview one-liner: \"Flow handles backpressure by default through suspension — the producer waits for the collector, so nothing is dropped and memory is bounded. When I need throughput I add `buffer` (keep all, use memory); when I only want the latest I use `conflate` (drop intermediates) or `collectLatest` (cancel in-progress work).\"",
      },
    ],
  },
];

export default content;
