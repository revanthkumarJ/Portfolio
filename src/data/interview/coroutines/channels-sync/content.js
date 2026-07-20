// Channels & Synchronization — Content tab. Teaching-first.

const content = [
  {
    heading: "Channels — communication between coroutines",
    blocks: [
      {
        t: "p",
        text: "A **`Channel`** is a coroutine primitive for passing values *between* coroutines — conceptually a coroutine-friendly `BlockingQueue`, but with *suspending* operations instead of blocking ones. One coroutine `send`s values, another `receive`s them. Unlike a Flow (a cold, per-collector stream), a Channel is **hot** and each value goes to exactly **one** receiver — it's a hand-off pipe, not a broadcast.",
      },
      {
        t: "code",
        title: "A basic channel",
        code: `val channel = Channel<Int>()

launch {                       // producer
    for (x in 1..5) channel.send(x)   // suspends if channel is full
    channel.close()            // signal no more values
}

launch {                       // consumer
    for (x in channel) {       // receives until closed; suspends if empty
        println(x)
    }
}`,
      },
      {
        t: "list",
        items: [
          "**`send` and `receive` suspend**: `send` suspends if the channel is full (backpressure); `receive` suspends if it's empty (waits for a value). No blocking.",
          "**One value → one receiver**: if multiple coroutines receive from a channel, each value goes to only one of them (fan-out). This is fundamentally different from a `SharedFlow`, which broadcasts each value to *all* collectors.",
          "**`close()`** signals completion — receivers' `for` loops end. A closed channel throws on further `send`.",
          "**Flow vs Channel**: use a **Flow** for a stream you observe (cold, declarative, operators); use a **Channel** for actual *communication/hand-off* between coroutines (hot, each value consumed once) — like a work queue or a pipe between a producer and a worker.",
        ],
      },
    ],
  },
  {
    heading: "Channel capacity and buffering",
    blocks: [
      {
        t: "table",
        headers: ["Capacity", "Behavior"],
        rows: [
          ["`RENDEZVOUS` (default, 0)", "send suspends until a receiver is ready — direct hand-off"],
          ["`BUFFERED` (default size)", "send doesn't suspend until the buffer is full"],
          ["`CONFLATED`", "keeps only the latest value; send never suspends, old value dropped"],
          ["`UNLIMITED`", "unbounded buffer; send never suspends (watch memory)"],
          ["a specific number", "buffer of that size, with an onBufferOverflow policy"],
        ],
      },
      {
        t: "list",
        items: [
          "**Rendezvous (0)** is the default — sender and receiver must 'meet': `send` waits for a `receive`. Tightest synchronization, no buffering.",
          "**Conflated** — like `StateFlow`'s conflation: only the latest value is kept, useful when the consumer only cares about the newest.",
          "**Unlimited** — never suspends `send`, but an unbounded buffer can grow without limit if the consumer is slow (memory risk).",
          "You can also set `onBufferOverflow` (SUSPEND / DROP_OLDEST / DROP_LATEST) — the same knobs as SharedFlow, because they share machinery.",
        ],
      },
    ],
  },
  {
    heading: "produce and actor — structured channel patterns",
    blocks: [
      {
        t: "code",
        title: "produce — a channel-backed producer coroutine",
        code: `fun CoroutineScope.produceNumbers(): ReceiveChannel<Int> = produce {
    var n = 0
    while (true) { send(n++); delay(100) }
}   // channel is closed automatically when the coroutine ends/cancels

val numbers = produceNumbers()
launch { for (n in numbers) println(n) }`,
      },
      {
        t: "list",
        items: [
          "**`produce { }`** — a builder that creates a coroutine bound to a `ReceiveChannel`; the channel closes automatically when the coroutine completes or is cancelled (structured — no leaked channel). The idiomatic way to make a producer.",
          "**`actor { }`** — the inverse: a coroutine with an incoming channel that processes messages one at a time. Because it processes messages sequentially, it's a way to *safely manage state without locks* — send it messages, it handles them in order (the actor model). (Now somewhat legacy in favor of other patterns, but conceptually important.)",
          "**Channels are hot and stateful** — a `produce` channel starts producing as soon as it's created and a receiver pulls; unlike a cold Flow, it doesn't restart per consumer.",
        ],
      },
    ],
  },
  {
    heading: "Shared mutable state — the problem and the tools",
    blocks: [
      {
        t: "p",
        text: "Coroutines run concurrently, so multiple coroutines touching the same mutable variable causes **race conditions** — the same data corruption threads have. `var counter = 0` incremented from 100 coroutines won't reach 100 without synchronization. Kotlin offers several tools, in rough order of preference:",
      },
      {
        t: "list",
        items: [
          "**Avoid shared mutable state (best)**: prefer immutable data and confine state to one place — e.g. a `StateFlow` updated only via atomic `update { }`, or confining mutations to a single coroutine/dispatcher. No shared mutation, no races.",
          "**`Mutex`** — a *suspending* lock (mutual exclusion). `mutex.withLock { ... }` ensures only one coroutine executes the critical section at a time, and it *suspends* rather than blocks while waiting (unlike a `synchronized` block, which blocks a thread).",
          "**Atomics** — `AtomicInteger`, `atomic()` (kotlinx-atomicfu) for simple counters/flags: lock-free, fast, but only for single-variable operations.",
          "**Single-threaded confinement** — run all access to the state on one dedicated dispatcher (`newSingleThreadContext` or `limitedParallelism(1)`), so operations are serialized by construction — no explicit locking needed.",
        ],
      },
      {
        t: "code",
        title: "Mutex — suspending mutual exclusion",
        code: `val mutex = Mutex()
var counter = 0

suspend fun increment() {
    mutex.withLock {          // suspends (not blocks) if another coroutine holds it
        counter++             // critical section — one coroutine at a time
    }
}`,
      },
    ],
  },
  {
    heading: "Mutex vs synchronized, and Semaphore",
    blocks: [
      {
        t: "list",
        items: [
          "**`Mutex` vs `synchronized`/`ReentrantLock`**: a `synchronized` block *blocks the thread* while waiting for the lock — inside a coroutine that blocks a valuable dispatcher thread. `Mutex.withLock` *suspends* the coroutine while waiting, freeing the thread. In coroutine code, prefer `Mutex`. Also, `Mutex` is **not reentrant** (a coroutine can't re-acquire a lock it already holds — that deadlocks), unlike `ReentrantLock`.",
          "**`Semaphore`** — like a Mutex but allows *N* concurrent holders instead of 1. `Semaphore(permits = 4).withPermit { }` limits concurrency — e.g. cap parallel network requests to 4. Suspending, coroutine-friendly.",
          "**Never hold a lock across arbitrary suspension points carelessly** — if you suspend for a long operation while holding a `Mutex`, other coroutines wait the whole time; keep critical sections short.",
        ],
      },
    ],
  },
  {
    heading: "select — awaiting the first of several",
    blocks: [
      {
        t: "p",
        text: "**`select { }`** lets a coroutine await *multiple* suspending sources simultaneously and proceed with whichever is ready *first* — like a coroutine `switch` over async events. Useful for racing operations, timeouts, or multiplexing channels.",
      },
      {
        t: "code",
        title: "Racing two sources with select",
        code: `val result = select<String> {
    deferredA.onAwait { "A won: $it" }      // whichever completes first
    deferredB.onAwait { "B won: $it" }
    channel.onReceive { "channel: $it" }
}`,
      },
      {
        t: "list",
        items: [
          "`select` picks the *first* clause to become ready and runs it, ignoring the rest. Common uses: implement a timeout by racing work against a `delay`, pick the fastest of redundant requests, or merge several channels.",
          "It's an advanced primitive — most app code uses higher-level tools (`withTimeout`, `combine`, `merge`), but `select` is the building block underneath and appears in deeper interview questions.",
        ],
      },
      {
        t: "note",
        text: "Summary of the synchronization toolbox: prefer *avoiding* shared mutable state (immutability + StateFlow.update or single-thread confinement); for real critical sections use `Mutex.withLock` (suspending, non-reentrant) over `synchronized` (blocking); use `Semaphore` to limit concurrency to N; use `select` to await the first of several sources. Channels are for coroutine-to-coroutine hand-off (hot, one-value-one-receiver), distinct from Flows (cold, observed streams).",
      },
    ],
  },
];

export default content;
