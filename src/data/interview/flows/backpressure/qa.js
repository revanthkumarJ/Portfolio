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
];

export default qa;
