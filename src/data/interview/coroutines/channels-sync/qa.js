// Channels & Synchronization — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What is a Channel and how is it different from a Flow?",
    a: [
      {
        t: "p",
        text: "**The concept**: a `Channel` passes values *between* coroutines — one coroutine `send`s, another `receive`s, with both operations suspending (send suspends if full, receive suspends if empty). It's like a coroutine-friendly queue with non-blocking operations. It's used for actual communication/hand-off between coroutines, like a work queue or a pipe.",
      },
      {
        t: "list",
        items: [
          "**Channel is hot; Flow is cold**: a Channel exists and holds/transfers values independent of consumers; a Flow is a recipe that runs per collector.",
          "**Channel: one value → one receiver**: each value sent is received by exactly one receiver (fan-out). A `SharedFlow`, by contrast, broadcasts each value to *all* collectors. This is the key behavioral difference.",
          "**Flow is for observing a stream** (declarative, operators, cold); **Channel is for communication between coroutines** (hot, each value consumed once).",
        ],
      },
      {
        t: "p",
        text: "Rule of thumb: if you're modeling 'a stream of data I want to observe and transform', use a Flow. If you're modeling 'coroutine A hands work items to coroutine B', use a Channel. In app code you often use Channels indirectly — e.g. `callbackFlow` and one-shot event delivery are built on channels — while using Flows for the observable-stream cases.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a Mutex and how is it different from a synchronized block?",
    a: [
      {
        t: "p",
        text: "**The concept**: a `Mutex` (mutual exclusion) is a lock that ensures only one coroutine executes a critical section at a time — you wrap the section in `mutex.withLock { }`. It protects shared mutable state from concurrent access, just like a lock in thread-based code.",
      },
      {
        t: "p",
        text: "**The key difference from `synchronized`**: a `synchronized` block (or `ReentrantLock`) *blocks the thread* while waiting to acquire the lock. Inside a coroutine, that blocks a valuable dispatcher thread — defeating the point of coroutines. A `Mutex.withLock` *suspends* the coroutine while waiting, freeing the thread to run other coroutines. So in coroutine code you should prefer `Mutex` over `synchronized`.",
      },
      {
        t: "code",
        title: "Mutex protecting a counter",
        code: `val mutex = Mutex()
var count = 0
suspend fun inc() = mutex.withLock { count++ }`,
      },
      {
        t: "p",
        text: "One important gotcha: `Mutex` is **not reentrant** — a coroutine that already holds the lock cannot acquire it again (doing so deadlocks), unlike `ReentrantLock`. And you should keep critical sections short and avoid long suspensions while holding the lock, since other coroutines wait the whole time. Better still, where possible, avoid shared mutable state entirely (immutable data + `StateFlow.update`) so you don't need a lock at all.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you safely update shared state from multiple coroutines?",
    a: [
      {
        t: "p",
        text: "**The concept**: coroutines run concurrently, so multiple coroutines mutating the same variable causes race conditions — data corruption, lost updates. You need a synchronization strategy. In rough order of preference:",
      },
      {
        t: "list",
        items: [
          "**Avoid shared mutable state (best)**: use immutable data and a single owner. A `StateFlow` updated via `_state.update { it.copy(...) }` is atomic (compare-and-set), so concurrent updates don't lose writes — no explicit lock needed. This is the idiomatic Android answer.",
          "**`Mutex.withLock { }`**: a suspending lock for a genuine critical section — one coroutine at a time, suspends (doesn't block) while waiting.",
          "**Atomics** (`AtomicInteger`, atomicfu): lock-free and fast for a *single* variable (a counter, a flag), but only for single-variable operations.",
          "**Single-threaded confinement**: run all access on one dedicated dispatcher (`limitedParallelism(1)`), serializing operations by construction — no explicit locking.",
        ],
      },
      {
        t: "p",
        text: "The key insight interviewers want: the *best* solution is usually to *not share mutable state* — confine it or make it immutable. `StateFlow.update { }` covers most Android cases (it's atomic), and you drop to `Mutex`/atomics/confinement only when you have genuinely shared mutable state that can't be restructured. Reaching straight for a lock when `StateFlow.update` would do is a mild red flag.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a Semaphore used for in coroutines?",
    a: [
      {
        t: "p",
        text: "**The concept**: a `Semaphore` is like a `Mutex` but allows up to *N* coroutines into the critical section at once, instead of just one. You create it with a number of permits and wrap work in `semaphore.withPermit { }`; a coroutine suspends until a permit is available. It's used to **limit concurrency** to a fixed number.",
      },
      {
        t: "code",
        title: "Limiting parallel network requests to 4",
        code: `val semaphore = Semaphore(permits = 4)

suspend fun fetchAll(urls: List<String>) = coroutineScope {
    urls.map { url ->
        async {
            semaphore.withPermit {   // at most 4 run concurrently
                api.fetch(url)
            }
        }
    }.awaitAll()
}`,
      },
      {
        t: "p",
        text: "The classic use is rate-limiting parallel work: you want to fetch 100 URLs but not open 100 simultaneous connections, so a `Semaphore(4)` caps it at 4 in flight. It's suspending (doesn't block threads while waiting for a permit), which makes it coroutine-friendly. A related modern alternative for the same goal is `Dispatchers.IO.limitedParallelism(4)`, which gives a view of the IO pool capped at 4 concurrent coroutines — often simpler when the limit is about dispatcher usage rather than a specific critical section.",
      },
    ],
  },
  {
    level: "senior",
    q: "When would you use a Channel vs a SharedFlow for passing events between coroutines?",
    a: [
      {
        t: "p",
        text: "**The decision hinges on delivery semantics: one-receiver hand-off vs broadcast, and guaranteed delivery vs best-effort.** A `Channel` delivers each value to *exactly one* receiver and `send` *suspends until the value is received* (with default capacity) — so values aren't lost even if the receiver is momentarily absent. A `SharedFlow` *broadcasts* each value to *all* current collectors and drops values emitted while no one is collecting (with replay 0).",
      },
      {
        t: "list",
        items: [
          "**Use a `Channel` when**: each event should be handled *once* by a single consumer, and you can't afford to lose events across brief gaps in collection. This is exactly why `Channel(BUFFERED).receiveAsFlow()` is the common choice for one-shot UI events (navigation, snackbars) — `send` waits through the lifecycle gap during a config change, so the event isn't dropped, and it's consumed once.",
          "**Use a `SharedFlow` when**: multiple independent collectors each need to see *every* event (a true broadcast) — e.g. several components reacting to the same app-wide signal. Configure `replay`/buffer as needed. But accept that events emitted with no active collector (replay 0) are lost.",
          "**The fan-out trap**: if you use a `Channel` but accidentally have *two* collectors, each event goes to only *one* of them (whichever receives first) — a source of 'half my events disappear' bugs. If you need every listener to get every event, that's a SharedFlow, not a Channel.",
          "**Guaranteed-once vs broadcast is the crux**: Channel = 'exactly one consumer, delivery waits'; SharedFlow = 'all consumers, best-effort'. For navigation/snackbar events (one handler, must not drop), Channel wins; for broadcasting state changes to many observers, SharedFlow (or StateFlow) wins.",
        ],
      },
      {
        t: "p",
        text: "**Neither fully solves process death** — a killed process loses buffered channel items and un-replayed SharedFlow emissions alike; truly durable one-shot outcomes should be modeled as persisted state. But for in-process event delivery, the Channel-vs-SharedFlow choice is precisely about one-receiver-guaranteed vs all-receivers-best-effort.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the select expression and when is it useful?",
    a: [
      {
        t: "p",
        text: "**The concept**: `select { }` lets a coroutine wait on *multiple* suspending sources at once and proceed with whichever becomes ready *first*, running that clause and abandoning the rest. It's like a `switch`/`when` over asynchronous events — the coroutine equivalent of `select()` in Go or a multiplexing wait.",
      },
      {
        t: "code",
        title: "Racing sources",
        code: `val winner = select<String> {
    fastReplica.onAwait { "fast: $it" }     // whichever Deferred finishes first
    slowReplica.onAwait { "slow: $it" }
    timeoutChannel.onReceive { "timed out" }
}`,
      },
      {
        t: "list",
        items: [
          "**Uses**: racing redundant requests and taking the fastest (hedged requests); implementing a custom timeout by racing work against a `delay`; multiplexing several channels into one consumer (proceed with whichever has data); building higher-level combinators.",
          "**Clauses**: `onAwait` (for `Deferred`), `onReceive`/`onReceiveCatching` (for channels), `onSend` (for sending when a channel is ready), `onTimeout` — you list the alternatives and `select` picks the first ready one.",
          "**It's a low-level primitive**: most app code uses higher-level tools built on similar ideas — `withTimeout` (race against a deadline), `merge` (combine flows), `combine`. You reach for raw `select` when you need custom 'first of several' logic those don't express.",
          "**Fairness and atomicity caveats**: `select` chooses among ready clauses and the non-selected clauses are not consumed; care is needed with channels so you don't accidentally drop values (use `onReceiveCatching` and understand which clause 'wins').",
        ],
      },
      {
        t: "p",
        text: "**When to bring it up**: `select` appears in senior questions about implementing timeouts, hedged/racing requests, or channel multiplexing from scratch. Knowing it exists and what it does (await the first-ready of several sources) — even while noting you'd usually prefer `withTimeout`/`merge` — demonstrates depth beyond the everyday coroutine API.",
      },
    ],
  },
  {
    level: "senior",
    q: "Compare using produce/actor, Mutex, and single-threaded confinement for managing shared state.",
    a: [
      {
        t: "p",
        text: "**These are three different philosophies for safe concurrent state, and the 'best' depends on the shape of the problem.** They range from lock-based to message-based to confinement-based.",
      },
      {
        t: "list",
        items: [
          "**`Mutex` (lock-based)**: protect a critical section so one coroutine mutates at a time. Simple and direct for guarding a small piece of shared state. Downsides: you must remember to lock *every* access, it's non-reentrant (deadlock risk), and holding it across suspensions serializes coroutines. Good for a few well-defined critical sections; error-prone if state is accessed from many places.",
          "**`actor` (message-based / actor model)**: a single coroutine owns the state and processes incoming messages from a channel *one at a time*. Other coroutines don't touch the state — they *send messages*. Because the owner processes sequentially, there's no concurrent access and thus no locks. Excellent for state with complex operations and many mutators (a cache, a connection manager); the tradeoff is more ceremony (define a message type) and it's somewhat legacy in Kotlin now.",
          "**Single-threaded confinement**: run all access to the state on one dedicated dispatcher (`limitedParallelism(1)` or `newSingleThreadContext`). Operations are serialized by the dispatcher, so no locks and no message types — you just `withContext(stateDispatcher) { mutate() }`. Clean when the state is naturally 'owned' by one context; the cost is every access must hop to that dispatcher.",
        ],
      },
      {
        t: "list",
        items: [
          "**How to choose**: for *simple* shared state, prefer *avoiding* the problem — immutable data + `StateFlow.update` (atomic) or a single atomic — over any of these. For a *critical section* guarding modest state accessed in a few places, `Mutex`. For state with *rich operations and many concurrent mutators*, the actor pattern (or confinement) reads better than scattering locks. For state that *conceptually belongs to one owner*, single-threaded confinement is the cleanest.",
          "**The unifying principle**: the safest concurrent state is *no shared mutable state* — confine ownership to one place (one coroutine, one dispatcher, or one atomic holder) so concurrency can't corrupt it. Locks are the fallback when you genuinely have shared mutation you can't restructure away.",
        ],
      },
    ],
  },
];

export default qa;
