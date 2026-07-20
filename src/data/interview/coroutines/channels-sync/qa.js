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
  {
    level: "junior",
    q: "What is a Channel, conceptually, and what are its main operations?",
    a: [
      {
        t: "p",
        text: "A `Channel` is a coroutine-safe *queue* for passing values between coroutines — one or more coroutines `send` values, one or more `receive` them. It's a communication primitive (like a BlockingQueue, but suspending instead of blocking): `send` suspends if the channel is full, `receive` suspends if it's empty. It's *hot* — values flow whether or not anyone is receiving (subject to capacity).",
      },
      {
        t: "code",
        title: "Sender/receiver",
        code: `val channel = Channel<Int>()
launch { for (x in 1..5) channel.send(x); channel.close() }   // producer
launch { for (x in channel) println(x) }                       // consumer (until closed)`,
      },
      {
        t: "list",
        items: [
          "**`send(value)`** — suspends if full; delivers a value.",
          "**`receive()`** — suspends if empty; takes the next value.",
          "**`close()`** — signals no more values; receivers' loop ends.",
          "**Hot & one-to-one delivery** — each value is received by exactly one receiver (unlike a broadcast).",
        ],
      },
      {
        t: "note",
        text: "A Channel is a coroutine-safe suspending queue for passing values between coroutines: send (suspends if full), receive (suspends if empty), close (ends the stream). It's hot and each value goes to exactly ONE receiver (point-to-point), unlike a Flow (cold, per-collector) or SharedFlow (broadcast).",
      },
    ],
  },
  {
    level: "senior",
    q: "What are the Channel buffer/capacity types (RENDEZVOUS, BUFFERED, CONFLATED, UNLIMITED)?",
    a: [
      {
        t: "p",
        text: "A Channel's capacity controls how `send` behaves when there's no ready receiver. The main options trade off backpressure vs buffering: `RENDEZVOUS` (0) makes `send` wait for a receiver; `BUFFERED`/a fixed size buffers up to N then suspends; `CONFLATED` keeps only the latest (drops older); `UNLIMITED` never suspends `send` (unbounded buffer).",
      },
      {
        t: "table",
        headers: ["Capacity", "send behavior", "Use"],
        rows: [
          ["RENDEZVOUS (0)", "waits for a receiver", "tight sync / backpressure"],
          ["BUFFERED / N", "buffers up to N, then suspends", "smoothing bursts"],
          ["CONFLATED", "never suspends; keeps latest only", "latest-value UI/state"],
          ["UNLIMITED", "never suspends; unbounded", "when drops are unacceptable (watch memory)"],
        ],
      },
      {
        t: "list",
        items: [
          "**RENDEZVOUS** — default; `send` suspends until `receive` — natural backpressure.",
          "**BUFFERED (fixed)** — absorbs bursts up to capacity, then applies backpressure.",
          "**CONFLATED** — only the newest value survives; good for progress/state where stale values don't matter.",
          "**UNLIMITED** — never blocks the producer, but risks OOM if the consumer lags.",
          "**onBufferOverflow** — `DROP_OLDEST`/`DROP_LATEST`/`SUSPEND` for finer control.",
        ],
      },
      {
        t: "note",
        text: "Channel capacity controls send when no receiver: RENDEZVOUS(0) waits for a receiver (backpressure), BUFFERED/N buffers then suspends, CONFLATED keeps only the latest (drops older), UNLIMITED never suspends (OOM risk). onBufferOverflow (DROP_OLDEST/DROP_LATEST/SUSPEND) tunes overflow. Pick by backpressure vs latest-value needs.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the produce builder, and how does it create a channel?",
    a: [
      {
        t: "p",
        text: "`produce { }` is a coroutine builder that returns a `ReceiveChannel` and runs a producer coroutine that `send`s into it. It ties the channel's lifecycle to the coroutine (closing it when the block ends and cancelling the producer if the consumer cancels) — a structured, leak-safe way to build a stream of values from a coroutine.",
      },
      {
        t: "code",
        title: "produce a stream",
        code: `fun CoroutineScope.numbers(): ReceiveChannel<Int> = produce {
    for (i in 1..100) { send(i); delay(100) }
}   // channel auto-closed when the block finishes; producer cancelled if consumer cancels

// consume:
val nums = numbers()
for (n in nums) println(n)`,
      },
      {
        t: "list",
        items: [
          "**Returns a `ReceiveChannel`** — consumers `receive`/iterate it.",
          "**Structured** — the producer is a child coroutine; closing/cancelling is handled with the channel's lifecycle.",
          "**Backpressure** — `send` respects the channel capacity, suspending the producer as needed.",
          "**Modern alternative** — for most streaming, `Flow` (cold, more operators) is preferred; `produce`/Channel suit true hot, hand-off pipelines.",
        ],
      },
      {
        t: "note",
        text: "produce { } is a builder returning a ReceiveChannel with a structured producer coroutine that sends into it — auto-closes when done and cancels if the consumer cancels (leak-safe). send respects capacity (backpressure). For most streaming prefer Flow (cold, richer operators); use produce/Channel for genuine hot hand-off pipelines.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the actor pattern, and how does it manage shared state?",
    a: [
      {
        t: "p",
        text: "An *actor* is a coroutine that owns some private state and processes messages from an incoming `Channel` one at a time. Because only the actor coroutine touches the state, and it handles messages serially, there are *no data races* — synchronization is achieved by message-passing and single-coroutine confinement rather than locks.",
      },
      {
        t: "code",
        title: "A counter actor",
        code: `sealed class Msg
object Inc : Msg()
class Get(val response: CompletableDeferred<Int>) : Msg()

fun CoroutineScope.counterActor() = actor<Msg> {
    var count = 0                       // private state, only this coroutine touches it
    for (msg in channel) when (msg) {   // one message at a time -> no races
        is Inc -> count++
        is Get -> msg.response.complete(count)
    }
}`,
      },
      {
        t: "list",
        items: [
          "**State confined to one coroutine** — no concurrent access, so no locks needed.",
          "**Serial message processing** — messages handled one at a time from the channel.",
          "**Request/response** — use `CompletableDeferred` in a message to get a value back.",
          "**Note** — `actor` is experimental/less common now; `Mutex` or single-thread confinement are more typical, but the actor model is a clean conceptual answer for state management.",
        ],
      },
      {
        t: "note",
        text: "An actor is a coroutine owning private state, processing messages serially from a Channel — no data races because only it touches the state and it handles one message at a time (synchronization via message-passing, not locks). Use CompletableDeferred for request/response. actor is experimental; Mutex/single-thread confinement are more common today.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does a Mutex differ from synchronized, and why use withLock?",
    a: [
      {
        t: "p",
        text: "A coroutine `Mutex` provides mutual exclusion that *suspends* instead of *blocking* — when the lock is held, a waiting coroutine suspends (freeing its thread) rather than blocking a thread like `synchronized`. Crucially, `mutex.withLock { }` can safely contain suspend calls, whereas holding a `synchronized` lock across a suspension point is dangerous (you'd block a thread while suspended, and the lock is thread-bound).",
      },
      {
        t: "code",
        title: "Mutex.withLock",
        code: `val mutex = Mutex()
var balance = 0
suspend fun deposit(amount: Int) = mutex.withLock {
    balance += amount            // safe: only one coroutine in here at a time
    // can even call suspend functions inside withLock
}`,
      },
      {
        t: "list",
        items: [
          "**Suspends, doesn't block** — waiting coroutines don't tie up threads.",
          "**`withLock { }`** — acquires and releases the lock even on exception (like `synchronized` but suspend-friendly).",
          "**Not reentrant** — a coroutine holding the lock re-acquiring it deadlocks (unlike `synchronized`).",
          "**vs `synchronized`** — the latter is thread-based, blocks, and must not span suspension points.",
        ],
      },
      {
        t: "note",
        text: "Mutex suspends waiters instead of blocking threads (like synchronized), and withLock { } can safely span suspend calls (synchronized can't — it's thread-bound and would block a suspended thread). Caveat: Mutex is NOT reentrant (re-locking deadlocks). Use withLock for guaranteed release on exceptions.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why can incrementing a shared variable from multiple coroutines lose updates?",
    a: [
      {
        t: "p",
        text: "`count++` is not atomic — it's read, add, write. If two coroutines (on different threads) do it concurrently, they can both read the same old value, both add one, and both write back the same result, so one increment is lost (a data race). Coroutines don't magically make shared mutable state safe; concurrent access still needs protection.",
      },
      {
        t: "code",
        title: "The race and fixes",
        code: `var count = 0
// RACE: concurrent count++ can lose updates
repeat(1000) { launch(Dispatchers.Default) { count++ } }

// Fixes:
val counter = AtomicInteger(0); counter.incrementAndGet()   // atomic
// or Mutex.withLock { count++ }                              // mutual exclusion
// or single-thread confinement (limitedParallelism(1))`,
      },
      {
        t: "list",
        items: [
          "**`++` is read-modify-write** — not atomic; interleavings lose updates.",
          "**Fixes** — `AtomicInteger`/atomics, `Mutex.withLock`, or single-thread confinement.",
          "**Immutable state** — better still, avoid shared mutable state (immutable state + StateFlow updates).",
          "**Visibility too** — without synchronization, threads may not see each other's writes.",
        ],
      },
      {
        t: "note",
        text: "count++ is read-modify-write (not atomic), so concurrent coroutines on different threads can lose updates (data race). Fix with atomics (AtomicInteger), Mutex.withLock, or single-thread confinement (limitedParallelism(1)) — or avoid shared mutable state entirely (immutable state + StateFlow). Coroutines don't make shared state thread-safe.",
      },
    ],
  },
  {
    level: "senior",
    q: "When should you use atomics vs a Mutex for shared state?",
    a: [
      {
        t: "p",
        text: "Use *atomics* (`AtomicInteger`, `AtomicReference`, `update { }`) for simple single-variable operations (counters, flags, compare-and-set) — they're lock-free and fast. Use a `Mutex` when you must protect a *compound* operation (multiple fields changed together, an invariant across several variables) that can't be expressed as one atomic step.",
      },
      {
        t: "list",
        items: [
          "**Atomics** — single-variable, lock-free; `incrementAndGet`, `compareAndSet`, `updateAndGet`. Fast, no suspension.",
          "**`Mutex`** — protects a *critical section* spanning multiple operations/fields or suspend calls.",
          "**Single-thread confinement** — an alternative for complex state: route all access through one dispatcher.",
          "**Prefer immutability** — often the cleanest: replace whole immutable state atomically (e.g. `MutableStateFlow.update`).",
        ],
      },
      {
        t: "code",
        title: "Atomic vs Mutex",
        code: `val counter = AtomicInteger()          // simple single value
counter.incrementAndGet()

val mutex = Mutex()                     // compound invariant across fields
mutex.withLock { from -= n; to += n }   // must be atomic together`,
      },
      {
        t: "note",
        text: "Atomics (AtomicInteger/compareAndSet/update) for simple single-variable ops — lock-free, fast, no suspension. Mutex for compound critical sections (multiple fields/invariants or suspend calls together). Single-thread confinement is another option for complex state. Often best: immutable state replaced atomically (StateFlow.update).",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you safely share and update state in a ViewModel across coroutines?",
    a: [
      {
        t: "p",
        text: "Use `MutableStateFlow` and its atomic `update { }` function, which applies a change to immutable state as a compare-and-set loop — safe under concurrent coroutines without explicit locks. Because the state is immutable and replaced atomically, there's no data race, and collectors always see a consistent snapshot.",
      },
      {
        t: "code",
        title: "Atomic state update",
        code: `private val _state = MutableStateFlow(UiState())
val state = _state.asStateFlow()

fun addItem(item: Item) {
    _state.update { it.copy(items = it.items + item) }   // atomic, race-free
}`,
      },
      {
        t: "list",
        items: [
          "**`MutableStateFlow.update { }`** — atomic compare-and-set update of immutable state; safe from concurrent coroutines.",
          "**Immutable state** — `copy()` produces a new snapshot; no in-place mutation.",
          "**Avoid `value = value.copy(...)`** in concurrent contexts — a read-then-write can race; `update { }` retries.",
          "**No manual locks** — the atomic update handles concurrency.",
        ],
      },
      {
        t: "note",
        text: "Use MutableStateFlow with update { it.copy(...) } — an atomic compare-and-set on immutable state, race-free across coroutines without locks. Prefer update{} over value = value.copy(...) (which can race on read-then-write). Immutable state + atomic replacement is the idiomatic safe-state pattern.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is a Semaphore, and how does it differ from a Mutex?",
    a: [
      {
        t: "p",
        text: "A `Semaphore` allows up to *N* coroutines into a section at once (N permits), whereas a `Mutex` allows exactly *one* (it's essentially a semaphore with one permit). Use a `Semaphore` to *limit concurrency* — e.g. at most 4 simultaneous uploads — rather than for mutual exclusion of a single critical section.",
      },
      {
        t: "code",
        title: "Bounding concurrency",
        code: `val semaphore = Semaphore(permits = 4)   // at most 4 at once
suspend fun upload(file: File) = semaphore.withPermit {
    api.upload(file)                     // 5th coroutine suspends until a permit frees
}`,
      },
      {
        t: "list",
        items: [
          "**`Semaphore(n)`** — up to `n` concurrent holders; `withPermit { }` acquires/releases.",
          "**`Mutex`** — exactly one holder (mutual exclusion); `Semaphore(1)` is similar.",
          "**Use** — rate-limiting, bounding parallel network/DB operations, protecting a pool of N resources.",
          "**Suspends, doesn't block** — waiters suspend until a permit is available.",
        ],
      },
      {
        t: "note",
        text: "A Semaphore permits up to N concurrent coroutines (withPermit acquires/releases); a Mutex permits exactly one (mutual exclusion, ~Semaphore(1)). Use Semaphore to LIMIT concurrency (max 4 uploads, resource pools, rate limits) — it suspends waiters until a permit frees. Mutex protects a single critical section.",
      },
    ],
  },
  {
    level: "senior",
    q: "When would you use a Channel vs a Flow?",
    a: [
      {
        t: "p",
        text: "Use a `Flow` for *streams of data* that are cold (re-run per collector) and declarative (operators) — the default for data pipelines. Use a `Channel` for *hot, one-time-delivery communication* between coroutines where each value goes to exactly one consumer — like a work queue or hand-off. The key distinctions: cold vs hot, multi-collector vs single-delivery.",
      },
      {
        t: "table",
        headers: ["", "Flow", "Channel"],
        rows: [
          ["Temperature", "cold (per collector)", "hot"],
          ["Delivery", "each collector gets all values", "each value to ONE receiver"],
          ["Operators", "rich (map/filter/…)", "minimal"],
          ["Use", "data streams, transforms", "work queues, coroutine hand-off"],
        ],
      },
      {
        t: "list",
        items: [
          "**`Flow`** — data streams, transformations, cold reproducible pipelines (the common choice).",
          "**`Channel`** — distribute work among consumers, fan-out/fan-in, point-to-point hand-off.",
          "**Events** — a `Channel` (or `SharedFlow`) for one-off events (each delivered once).",
          "**Bridge** — `channel.receiveAsFlow()` / `channel.consumeAsFlow()` to expose a channel as a Flow.",
        ],
      },
      {
        t: "note",
        text: "Flow = cold, per-collector, operator-rich — the default for data streams/transforms. Channel = hot, each value to exactly one receiver — for work queues, fan-out/fan-in, coroutine hand-off, and one-off events. Bridge a channel to a Flow with receiveAsFlow()/consumeAsFlow().",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you implement fan-out (multiple consumers) and fan-in (multiple producers) with channels?",
    a: [
      {
        t: "p",
        text: "*Fan-out*: multiple consumer coroutines `receive` from the *same* channel — each value goes to exactly one of them, distributing work (a worker pool). *Fan-in*: multiple producer coroutines `send` to the same channel, merging their outputs into one stream. Channels support both because they're multi-producer/multi-consumer safe.",
      },
      {
        t: "code",
        title: "Fan-out worker pool",
        code: `val tasks = Channel<Task>()
repeat(4) { worker ->                         // fan-out: 4 consumers
    launch { for (task in tasks) process(task) }   // each task handled by one worker
}
launch { jobs.forEach { tasks.send(it) }; tasks.close() }   // producer
// Fan-in: several producers all send into one channel`,
      },
      {
        t: "list",
        items: [
          "**Fan-out** — N consumers on one channel share the load; each item processed once.",
          "**Fan-in** — N producers into one channel merge streams.",
          "**Backpressure** — the channel capacity paces producers to consumer speed.",
          "**Closing** — close when producers are done; consumers' loops end.",
        ],
      },
      {
        t: "note",
        text: "Fan-out: multiple consumers receive from one channel (worker pool — each value to one worker, distributing load). Fan-in: multiple producers send to one channel (merged stream). Channels are multi-producer/multi-consumer safe; capacity provides backpressure; close when producers finish so consumer loops end.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the select expression, and when is it useful?",
    a: [
      {
        t: "p",
        text: "`select { }` lets a coroutine *wait on multiple suspending operations simultaneously* and proceed with whichever is ready first — receiving from whichever of several channels has a value, awaiting whichever `Deferred` completes first, or timing out. It's the coroutine analog of `select`/`epoll`: multiplexing several possible events into one.",
      },
      {
        t: "code",
        title: "select over channels",
        code: `select<Unit> {
    channelA.onReceive { value -> handleA(value) }
    channelB.onReceive { value -> handleB(value) }
    onTimeout(1000) { handleTimeout() }
}`,
      },
      {
        t: "list",
        items: [
          "**Multiplexes** — wait on several `onReceive`/`onAwait`/`onSend`/`onTimeout` clauses; the first ready wins.",
          "**First-wins racing** — combine with `async` to take the fastest result (cache vs network).",
          "**`onTimeout`** — add a timeout branch.",
          "**Advanced** — powerful but relatively rare; often a well-structured Flow (`merge`, `combine`) is clearer.",
        ],
      },
      {
        t: "note",
        text: "select { } waits on multiple suspending operations at once (onReceive/onAwait/onSend/onTimeout) and proceeds with the first ready — coroutine multiplexing. Uses: racing sources (fastest wins), merging channels, adding a timeout branch. Powerful but rare; Flow's merge/combine is often clearer for streams.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you convert a Channel to a Flow, and why would you?",
    a: [
      {
        t: "p",
        text: "Use `channel.receiveAsFlow()` (or `consumeAsFlow()`) to expose a hot channel as a `Flow`, so consumers get Flow operators and lifecycle-aware collection while you keep channel semantics for delivery. This is common for one-off events: a ViewModel holds a `Channel`, exposes `receiveAsFlow()`, and the UI collects it.",
      },
      {
        t: "code",
        title: "Channel as event Flow",
        code: `private val _events = Channel<UiEvent>()
val events = _events.receiveAsFlow()          // expose as Flow
fun onDone() { viewModelScope.launch { _events.send(UiEvent.NavigateBack) } }
// UI collects events like any Flow`,
      },
      {
        t: "list",
        items: [
          "**`receiveAsFlow()`** — each event delivered to a single collector (fan-out-safe across time, not broadcast).",
          "**`consumeAsFlow()`** — consumes the channel; can only be collected once.",
          "**Why** — get Flow operators and `collectAsStateWithLifecycle`/`repeatOnLifecycle` while keeping exactly-once delivery.",
          "**Events use case** — the standard pattern for navigation/snackbar events (vs a state flag that re-fires).",
        ],
      },
      {
        t: "note",
        text: "channel.receiveAsFlow() (or consumeAsFlow(), collect-once) exposes a hot channel as a Flow — keeping exactly-once delivery while gaining Flow operators and lifecycle-aware collection. Standard for one-off events (navigation/snackbar): ViewModel holds a Channel, exposes receiveAsFlow(), UI collects it.",
      },
    ],
  },
  {
    level: "junior",
    q: "What happens if you send to a closed channel or receive from an empty closed channel?",
    a: [
      {
        t: "p",
        text: "Sending to a *closed* channel throws a `ClosedSendChannelException`. Receiving from a channel that's closed *and empty* throws a `ClosedReceiveChannelException` (or `receiveCatching`/the `for` loop ends gracefully). Closing signals 'no more values'; the iteration idiom (`for (x in channel)`) handles the end cleanly.",
      },
      {
        t: "list",
        items: [
          "**`send` after close** — throws `ClosedSendChannelException`.",
          "**`receive` when closed & empty** — throws `ClosedReceiveChannelException`; use `receiveCatching()` to get a result instead.",
          "**`for (x in channel)`** — the loop ends normally when the channel is closed and drained.",
          "**Close with a cause** — `close(exception)` propagates that exception to receivers.",
        ],
      },
      {
        t: "code",
        title: "Graceful consumption",
        code: `for (x in channel) process(x)     // ends when closed & drained
val result = channel.receiveCatching()   // returns a ChannelResult (no throw)`,
      },
      {
        t: "note",
        text: "send to a closed channel throws ClosedSendChannelException; receive from a closed & empty channel throws ClosedReceiveChannelException (or use receiveCatching() for a non-throwing ChannelResult). The for (x in channel) loop ends gracefully when closed & drained. close(cause) propagates that exception to receivers.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is single-thread confinement, and how does it compare to locking?",
    a: [
      {
        t: "p",
        text: "Single-thread confinement means routing all access to a piece of mutable state through *one* thread (a single-threaded dispatcher or `limitedParallelism(1)`), so only one coroutine touches it at a time — no data races, no locks. It's an alternative to `Mutex`: instead of locking around each access, you *move* the access to a dedicated thread.",
      },
      {
        t: "code",
        title: "Confinement",
        code: `private val confine = Dispatchers.Default.limitedParallelism(1)
private val cache = mutableMapOf<String, Data>()
suspend fun put(k: String, v: Data) = withContext(confine) { cache[k] = v }
suspend fun get(k: String): Data? = withContext(confine) { cache[k] }`,
      },
      {
        t: "list",
        items: [
          "**One thread owns the state** — serial access, no races, no locks.",
          "**vs `Mutex`** — confinement moves work to one place; a `Mutex` locks in place on any thread. Both correct; pick per situation.",
          "**Coarse** — all access serializes; simple but can bottleneck if access is hot.",
          "**`limitedParallelism(1)`** — cheap confinement without a dedicated thread.",
        ],
      },
      {
        t: "note",
        text: "Single-thread confinement routes all state access through one thread (Dispatchers.X.limitedParallelism(1)) so only one coroutine touches it — no races, no locks. vs Mutex: confinement moves access to one place, Mutex locks in place on any thread. Confinement is simple but serializes all access (can bottleneck if hot).",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you compare produce/actor, Mutex, and confinement for managing shared state?",
    a: [
      {
        t: "p",
        text: "These are three strategies for the same goal — safe concurrent state — with different trade-offs. `Mutex` locks around critical sections (familiar, fine-grained). Single-thread confinement serializes all access via one dispatcher (simple, no explicit locks). The actor/`produce` model owns state in a coroutine processing messages (message-passing, no shared state at all). Modern app code most often uses immutable state + `StateFlow.update` or a `Mutex`.",
      },
      {
        t: "table",
        headers: ["Approach", "Mechanism", "Best for"],
        rows: [
          ["Mutex.withLock", "lock critical section", "compound invariants, occasional access"],
          ["Confinement", "one dispatcher owns access", "complex state, simple model"],
          ["Actor/produce", "coroutine + message channel", "encapsulated state machines"],
          ["Immutable + StateFlow", "atomic replace", "UI state (most common)"],
        ],
      },
      {
        t: "list",
        items: [
          "**Mutex** — fine-grained locking; watch for non-reentrancy and holding across suspension.",
          "**Confinement** — no locks, but serializes all access.",
          "**Actor** — clean encapsulation via messages; more ceremony, `actor` is experimental.",
          "**Immutable + `StateFlow.update`** — usually the simplest and safest for app state.",
        ],
      },
      {
        t: "note",
        text: "Four strategies: Mutex.withLock (lock critical sections — compound invariants), single-thread confinement (one dispatcher owns access — simple model), actor/produce (message-passing, no shared state — encapsulated machines), and immutable state + StateFlow.update (atomic replace — most common for UI state). Prefer immutable+StateFlow or Mutex in typical app code.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why are coroutines not automatically thread-safe for shared state?",
    a: [
      {
        t: "p",
        text: "Coroutines can run on multiple threads (via multi-threaded dispatchers and thread-hopping across suspension points), so two coroutines accessing the same mutable object can genuinely run in parallel — the same race conditions as threads apply. The 'sequential' feel of a single coroutine doesn't extend to shared state touched by *multiple* coroutines.",
      },
      {
        t: "list",
        items: [
          "**Multi-threaded execution** — `Dispatchers.Default`/`IO` run coroutines on many threads, so concurrent access is real.",
          "**Thread-hopping** — a coroutine can resume on a different thread, so even 'one' coroutine isn't thread-pinned.",
          "**Same hazards** — lost updates, visibility issues, torn reads — like classic threading.",
          "**Protect shared state** — atomics, `Mutex`, confinement, or (best) immutable state + atomic replacement.",
        ],
      },
      {
        t: "note",
        text: "Coroutines run on multiple threads (multi-threaded dispatchers, thread-hopping across suspension points), so multiple coroutines touching shared mutable state race exactly like threads (lost updates, visibility). A single coroutine's sequential feel doesn't cover shared state. Protect it: atomics/Mutex/confinement, or immutable state + atomic replace.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are the risks of an UNLIMITED or large channel buffer?",
    a: [
      {
        t: "p",
        text: "An `UNLIMITED` (or very large) buffer means `send` never suspends — which removes *backpressure*. If the producer outpaces the consumer, the buffer grows without bound, consuming memory and eventually causing `OutOfMemoryError`. Backpressure (a bounded buffer or RENDEZVOUS) is usually desirable: it paces the producer to the consumer's speed.",
      },
      {
        t: "list",
        items: [
          "**No backpressure** — the producer runs unthrottled; a slow consumer can't slow it down.",
          "**Unbounded memory** — the buffer grows with the backlog, risking OOM.",
          "**Latency** — items may sit in the buffer long before being consumed (stale data).",
          "**Prefer bounded** — a fixed buffer with `onBufferOverflow` (SUSPEND/DROP), or CONFLATED for latest-only, gives predictable behavior.",
        ],
      },
      {
        t: "note",
        text: "UNLIMITED/large buffers make send never suspend — removing backpressure. If the producer outpaces the consumer, the buffer grows unbounded (OOM) and items get stale. Prefer a bounded buffer with onBufferOverflow (SUSPEND applies backpressure, DROP_OLDEST/LATEST caps memory) or CONFLATED for latest-only.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you build a producer-consumer pipeline with channels?",
    a: [
      {
        t: "p",
        text: "Chain stages where each stage is a coroutine that consumes from an input channel and produces to an output channel — like Unix pipes. `produce { }` builds each stage returning a `ReceiveChannel`, and the next stage iterates it. This gives concurrent, backpressured processing where each stage runs in parallel with the others.",
      },
      {
        t: "code",
        title: "A two-stage pipeline",
        code: `fun CoroutineScope.produceNumbers() = produce { for (i in 1..100) send(i) }
fun CoroutineScope.square(nums: ReceiveChannel<Int>) = produce {
    for (n in nums) send(n * n)
}
val squares = square(produceNumbers())
for (s in squares) println(s)   // stages run concurrently, paced by backpressure`,
      },
      {
        t: "list",
        items: [
          "**Stages as `produce` coroutines** — each consumes one channel, produces another.",
          "**Concurrent** — stages run in parallel; backpressure paces them.",
          "**Composable** — add stages (filter, transform) by chaining.",
          "**Flow alternative** — for most pipelines, `Flow` operators (`map`/`filter`) are cleaner; channels suit true hot, multi-consumer stages.",
        ],
      },
      {
        t: "note",
        text: "Pipeline = chained produce { } stages, each consuming an input ReceiveChannel and producing an output one (like Unix pipes) — stages run concurrently with backpressure pacing them. Composable by adding stages. For most data pipelines Flow operators are cleaner; use channel pipelines for hot, multi-consumer processing.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is CompletableDeferred, and when is it useful?",
    a: [
      {
        t: "p",
        text: "`CompletableDeferred<T>` is a `Deferred` you complete *manually* by calling `complete(value)` (or `completeExceptionally(e)`), rather than via an `async` block. It's useful for bridging callback/event APIs into a suspendable result, or for request/response patterns (as in the actor example) where one coroutine awaits a value another will provide.",
      },
      {
        t: "code",
        title: "Manual completion",
        code: `val deferred = CompletableDeferred<User>()
someCallback.onResult { user -> deferred.complete(user) }   // completed externally
val user = deferred.await()                                  // suspends until completed`,
      },
      {
        t: "list",
        items: [
          "**Manually completed** — `complete(value)`/`completeExceptionally(e)` from anywhere.",
          "**`await()`** — suspends until completed, like any `Deferred`.",
          "**Uses** — request/response over a channel (actor), bridging one-shot callbacks, coordinating between coroutines.",
          "**vs `suspendCancellableCoroutine`** — the latter is often better for pure callback bridging (supports cancellation cleanup).",
        ],
      },
      {
        t: "note",
        text: "CompletableDeferred<T> is a Deferred you complete manually (complete(value)/completeExceptionally(e)) rather than via async; await() suspends until then. Uses: request/response over a channel (actor), bridging one-shot callbacks, coordinating coroutines. For pure callback bridging, suspendCancellableCoroutine is often better (cancellation support).",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you avoid deadlocks with Mutex in coroutines?",
    a: [
      {
        t: "p",
        text: "The main coroutine-`Mutex` deadlock risk is *non-reentrancy*: a coroutine that holds the lock and then calls code that tries to acquire the *same* lock will deadlock (unlike `synchronized`, which is reentrant). Avoid it by not re-entering `withLock` while already holding it, keeping locked sections small, and never holding a lock across a call that might re-acquire it.",
      },
      {
        t: "list",
        items: [
          "**Non-reentrant** — don't call a function that locks the same `Mutex` from within `withLock`.",
          "**Keep sections small** — minimize what runs under the lock; avoid arbitrary suspend calls that could loop back.",
          "**Consistent lock ordering** — if using multiple locks, always acquire them in the same order to avoid classic deadlocks.",
          "**Prefer alternatives** — atomics/confinement/immutable state avoid locking pitfalls entirely for many cases.",
        ],
      },
      {
        t: "note",
        text: "Coroutine Mutex is NOT reentrant — re-acquiring the same lock you already hold deadlocks (unlike synchronized). Avoid by not re-entering withLock while holding it, keeping locked sections small, and using consistent lock ordering with multiple locks. Often better: atomics/confinement/immutable state to sidestep locking.",
      },
    ],
  },
  {
    level: "junior",
    q: "What's the difference between a rendezvous channel and a buffered one for backpressure?",
    a: [
      {
        t: "p",
        text: "A *rendezvous* channel (capacity 0, the default) makes `send` suspend until a receiver is ready — producer and consumer meet in lockstep, giving the strongest backpressure. A *buffered* channel lets the producer send up to N values ahead before suspending, smoothing bursts but weakening backpressure. The choice is about how much the producer may run ahead of the consumer.",
      },
      {
        t: "list",
        items: [
          "**Rendezvous (0)** — `send` waits for `receive`; no buffering; tightest coupling and backpressure.",
          "**Buffered (N)** — producer runs up to N ahead, then suspends; absorbs bursts.",
          "**Trade-off** — buffering improves throughput for bursty producers but uses memory and can hide a slow consumer.",
          "**Choose** — rendezvous for strict pacing; a small buffer for smoothing; avoid huge/unlimited (loses backpressure).",
        ],
      },
      {
        t: "note",
        text: "Rendezvous (capacity 0, default): send waits for a receiver — lockstep, strongest backpressure. Buffered (N): producer runs up to N ahead then suspends — smooths bursts but weaker backpressure and uses memory. Pick rendezvous for strict pacing, a small buffer for smoothing; avoid unlimited (no backpressure).",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you use volatile and @Volatile in Kotlin, and when is it insufficient?",
    a: [
      {
        t: "p",
        text: "`@Volatile` guarantees *visibility* — a write to the field is immediately visible to other threads (no stale cached value) — but it does *not* provide atomicity for compound operations. So `@Volatile var count` makes reads/writes visible, but `count++` is still a race (read-modify-write isn't atomic). Use it for a simple flag read/written by different threads; use atomics/locks for anything compound.",
      },
      {
        t: "code",
        title: "Volatile visibility vs atomicity",
        code: `@Volatile private var running = true    // OK: simple flag, visibility guaranteed
fun stop() { running = false }           // other threads see it promptly

@Volatile private var count = 0
count++   // STILL a race — not atomic; use AtomicInteger or Mutex`,
      },
      {
        t: "list",
        items: [
          "**Guarantees visibility** — writes seen promptly across threads; no stale reads.",
          "**Not atomic** — compound ops (`++`, check-then-act) still race.",
          "**Good for** — a `stop`/`isReady` flag toggled by one thread and read by others.",
          "**Insufficient for** — counters, invariants across fields — use atomics/`Mutex`/confinement.",
        ],
      },
      {
        t: "note",
        text: "@Volatile guarantees visibility (writes seen promptly, no stale cached reads) but NOT atomicity — count++ is still a race. Use it for a simple flag (running/isReady) toggled by one thread and read by others. For counters/compound ops use AtomicInteger/Mutex/confinement.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you broadcast one event to multiple collectors — Channel or SharedFlow?",
    a: [
      {
        t: "p",
        text: "A `Channel` delivers each value to *one* receiver, so it can't broadcast to multiple collectors. For broadcasting the same event/value to *many* collectors, use a `SharedFlow` (hot, multicast). `SharedFlow(replay, extraBufferCapacity, onBufferOverflow)` lets every active collector receive each emission; `StateFlow` is the special case that always holds/broadcasts the latest value.",
      },
      {
        t: "code",
        title: "SharedFlow broadcast",
        code: `private val _events = MutableSharedFlow<Event>(extraBufferCapacity = 1)
val events = _events.asSharedFlow()          // many collectors each get every event
fun emit(e: Event) { _events.tryEmit(e) }
// StateFlow for latest-value broadcast (e.g. UI state)`,
      },
      {
        t: "list",
        items: [
          "**`Channel`** — point-to-point; one receiver per value. Not for broadcast.",
          "**`SharedFlow`** — multicast; every active collector gets each emission; configurable replay/buffer.",
          "**`StateFlow`** — always broadcasts the current value to all collectors (conflated, replay=1).",
          "**Events vs state** — one-off events (each once) fit a `Channel` (single consumer) or `SharedFlow` (multiple); persistent latest state fits `StateFlow`.",
        ],
      },
      {
        t: "note",
        text: "A Channel delivers each value to ONE receiver — can't broadcast. For one-to-many, use SharedFlow (hot multicast; every active collector gets each emission, configurable replay/buffer) or StateFlow (always broadcasts the latest value). Channel for single-consumer hand-off/events; SharedFlow for multi-collector broadcast.",
      },
    ],
  },
];

export default qa;
