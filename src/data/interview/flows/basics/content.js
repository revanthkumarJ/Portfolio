// Flow Basics & Cold Flows — Content tab. Teaching-first.

const content = [
  {
    heading: "What a Flow is — a suspend-friendly stream",
    blocks: [
      {
        t: "p",
        text: "A **`Flow<T>`** is Kotlin's type for an **asynchronous stream of values** — think of it as the async, coroutine-native cousin of a `List`. A `List<T>` gives you all its values at once, already computed. A `suspend fun` gives you a *single* value, later. A `Flow<T>` gives you *multiple* values, over time, each possibly arriving after a suspend — and it does so cooperatively with coroutines (it can suspend between emissions instead of blocking).",
      },
      {
        t: "table",
        headers: ["You need", "Use"],
        rows: [
          ["One value, now", "a normal function"],
          ["One value, later (async)", "`suspend fun`"],
          ["Many values, now", "`List` / `Sequence`"],
          ["Many values, over time (async)", "`Flow`"],
        ],
      },
      {
        t: "list",
        items: [
          "Examples that are naturally flows: database rows that re-emit when the table changes (Room `Flow` queries), location updates, UI state over time, a stream of search results as the user types, WebSocket messages.",
          "A Flow is built from three roles: a **producer** that emits values (`emit(value)`), zero or more **intermediate operators** that transform the stream (`map`, `filter`), and a **collector** (consumer) that receives the values (`collect { }`).",
          "Flow is part of `kotlinx.coroutines` — it's pure Kotlin (works in KMP, no Android dependency), which is a major reason it replaced LiveData and RxJava in modern Android.",
        ],
      },
    ],
  },
  {
    heading: "Cold flows — the defining property",
    blocks: [
      {
        t: "p",
        text: "Flows are **cold** by default. Cold means: **the producer code does not run until someone collects, and it runs again, from scratch, for every collector.** Building a flow (`flow { ... }`) creates only a *recipe*; nothing executes until a terminal operator like `collect` pulls values through it. Each new `collect` re-executes the whole recipe independently.",
      },
      {
        t: "code",
        title: "Cold in action — nothing runs until collection",
        code: `fun numbers(): Flow<Int> = flow {
    println("Flow started")     // producer body
    for (i in 1..3) {
        delay(100)
        emit(i)                 // hand a value to the collector
    }
}

// Building the flow prints NOTHING:
val f = numbers()

// First collection: prints "Flow started", then 1,2,3
f.collect { println(it) }

// Second collection: prints "Flow started" AGAIN, then 1,2,3 again
f.collect { println(it) }`,
      },
      {
        t: "list",
        items: [
          "**Lazy**: no collector, no work. A flow that hits the network does nothing until collected — no wasted requests.",
          "**Independent per collector**: two collectors each get their own private run of the producer — their own network call, their own sequence from the start. There is no sharing.",
          "**Why this matters for Android**: a `Flow` from a repository is safe to create eagerly and pass around; the expensive work only happens where it's actually observed, and it stops when collection stops (structured concurrency). Contrast **hot** streams (StateFlow/SharedFlow), which emit regardless of collectors and share one stream among all — covered in their own topic.",
        ],
      },
      {
        t: "note",
        text: "The cold/hot distinction is the single most-asked Flow interview question. One-liner: \"Cold flows are lazy recipes that re-run per collector and only while collected; hot flows exist and emit independently of collectors, multicasting one stream to all.\"",
      },
    ],
  },
  {
    heading: "Building flows — the producer side",
    blocks: [
      {
        t: "code",
        title: "The common builders",
        code: `// flow { } — the general builder; can suspend, loop, call suspend fns
flow {
    val page1 = api.load(1); emit(page1)
    val page2 = api.load(2); emit(page2)
}

// flowOf(...) — a fixed set of values
flowOf(1, 2, 3)

// asFlow() — from a collection/sequence/range
listOf("a", "b").asFlow()
(1..100).asFlow()

// channelFlow { } — when emissions come from multiple coroutines
channelFlow {
    launch { send(fetchA()) }
    launch { send(fetchB()) }
}

// callbackFlow { } — bridge a callback-based API into a Flow
callbackFlow {
    val listener = LocationListener { loc -> trySend(loc) }
    manager.register(listener)
    awaitClose { manager.unregister(listener) }
}`,
      },
      {
        t: "list",
        items: [
          "**`flow { }`** is the workhorse: its lambda is a suspend block, so you can `delay`, call other suspend functions, loop, and `emit` as many times as you want.",
          "**Emission must stay in the builder's coroutine**: you can't `emit` from a different coroutine you launched inside `flow { }` — that throws. When you genuinely need concurrent producers, use **`channelFlow`**/`callbackFlow`, which provide a thread-safe `send`/`trySend`.",
          "**`callbackFlow`** is how you turn listener/callback APIs (location, sensors, Firebase listeners) into flows — it must call `awaitClose { }` to unregister when collection stops (covered fully in the callbackFlow topic).",
        ],
      },
    ],
  },
  {
    heading: "Terminal operators — the collector side",
    blocks: [
      {
        t: "p",
        text: "A **terminal operator** is what actually starts the flow and consumes it. Everything else (map, filter) is just describing the pipeline; a terminal operator turns the crank. Terminal operators are `suspend` functions — they suspend the collecting coroutine until the flow completes (or forever, for infinite flows).",
      },
      {
        t: "code",
        title: "Terminal operators",
        code: `// collect — the fundamental one; runs the block per emission
flow.collect { value -> println(value) }

// collectLatest — cancels the block if a NEW value arrives before it finishes
searchQueries.collectLatest { query ->
    val results = repository.search(query)  // cancelled if query changes
    show(results)
}

// Aggregating terminals (they collect internally, then return one value):
val total = flow.reduce { acc, v -> acc + v }
val count = flow.count()
val list  = flow.toList()
val first = flow.first()          // takes one value then cancels the flow
val single = flow.single()

// launchIn — collect in a given scope without a suspend call site
flow.onEach { render(it) }.launchIn(viewModelScope)`,
      },
      {
        t: "list",
        items: [
          "**`collect`** processes every emission in order, waiting for your block to finish before the next value is delivered (backpressure by suspension — the producer waits if the collector is slow).",
          "**`collectLatest`** cancels the *previous* block when a new value arrives — essential for 'only the latest matters' cases (search-as-you-type: abandon the in-flight search when the query changes).",
          "**`launchIn(scope)`** = `scope.launch { flow.collect() }` — a convenient way to start collection in a scope (paired with `onEach` for the per-value logic). Common in ViewModels.",
          "**`first()`/`take(n)`** cancel the flow early once they have what they need — cancellation propagates back to the producer (which stops emitting), a nice property of structured flows.",
        ],
      },
    ],
  },
  {
    heading: "Flows are sequential, and respect cancellation",
    blocks: [
      {
        t: "list",
        items: [
          "**Sequential by default**: within a single collection, values are produced and processed one at a time, in order — `emit` suspends until the collector's block (and downstream operators) finish with that value. There's no concurrency unless you explicitly add it (`buffer`, `flatMapMerge`, `channelFlow`).",
          "**Context preservation**: a flow's producer runs in the collector's coroutine context by default — you don't switch threads implicitly. Changing the producer's context requires `flowOn` (its own topic); emitting from a different context without it throws (a safety check).",
          "**Cancellation-cooperative**: because collection happens in a coroutine, cancelling that coroutine cancels the collection, which cancels the producer. Flow builders check for cancellation at each `emit`, so a cancelled flow stops promptly. (Tight CPU loops that never emit/suspend still need manual `ensureActive()`/`isActive` checks — same as any coroutine.)",
          "**Exceptions propagate downward**: an exception in the producer or an operator surfaces at the collector, and can be handled with the `catch` operator or a try/catch around `collect` (error handling has its own topic).",
        ],
      },
    ],
  },
];

export default content;
