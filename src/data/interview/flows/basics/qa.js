// Flow Basics & Cold Flows — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What is a Flow and when would you use one?",
    a: [
      {
        t: "p",
        text: "**The concept**: a `Flow<T>` is an asynchronous stream of values — it produces *multiple* values *over time*, cooperatively with coroutines. The easiest way to place it: a normal function returns one value now; a `suspend fun` returns one value later; a `List` gives many values now; a `Flow` gives many values later, as they become available, able to suspend between them instead of blocking.",
      },
      {
        t: "p",
        text: "**When to use it**: anything that's a *stream* rather than a one-shot. Room database queries that should re-emit whenever the data changes; location or sensor updates; a UI state that changes over time; search results updating as the user types; WebSocket messages. If the answer to 'how many values, and when?' is 'several, over time', it's a Flow. If it's 'exactly one, later', it's a plain suspend function. Flow is also pure Kotlin (no Android dependency), which is why modern Android and KMP use it in place of LiveData and RxJava.",
      },
    ],
  },
  {
    level: "junior",
    q: "What does it mean that a Flow is 'cold'?",
    a: [
      {
        t: "p",
        text: "**The concept**: cold means the flow's producer code **doesn't run until someone collects it**, and it **runs again from the start for every collector**. Creating a flow with `flow { ... }` just builds a recipe — nothing executes. Only a terminal operator like `collect` pulls values through, and each separate `collect` triggers its own independent run of the producer.",
      },
      {
        t: "code",
        title: "Two collections = two independent runs",
        code: `val f = flow { println("start"); emit(1); emit(2) }
// nothing printed yet
f.collect { }   // prints "start", emits 1,2
f.collect { }   // prints "start" AGAIN, emits 1,2 again`,
      },
      {
        t: "p",
        text: "**Why it's useful**: laziness means no wasted work — a flow that calls the network does nothing until observed. Independence means each collector gets its own fresh sequence, with no interference. And because collection lives in a coroutine, when the collector's scope is cancelled, the producer stops too. The contrast is a *hot* stream (StateFlow/SharedFlow), which emits whether or not anyone is collecting and shares one stream across all collectors — but that's a separate concept with its own trade-offs.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between an intermediate and a terminal operator?",
    a: [
      {
        t: "p",
        text: "**The concept**: flow operators come in two kinds. **Intermediate operators** (`map`, `filter`, `onEach`, `take`…) transform or configure the stream and return a *new flow* — but they're lazy: they only *describe* work and run nothing by themselves. **Terminal operators** (`collect`, `toList`, `first`, `reduce`, `count`…) actually start the flow, pull values through all the intermediate operators, and consume them. Terminal operators are `suspend` functions because they run over time.",
      },
      {
        t: "p",
        text: "The practical consequence: a chain like `flow.map { }.filter { }` does *absolutely nothing* — no map, no filter — until you attach a terminal operator. This trips people up: 'my map isn't running' almost always means 'nothing is collecting'. Think of intermediate operators as assembling a pipeline and the terminal operator as opening the tap. `launchIn(scope)` is a convenience that packages `scope.launch { collect() }`, so `flow.onEach { }.launchIn(scope)` is the common 'start collecting in this scope' idiom.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you create a Flow? Name a few builders.",
    a: [
      {
        t: "list",
        items: [
          "**`flow { }`** — the general builder. Its lambda is a suspend block, so you can call suspend functions, loop, `delay`, and `emit(value)` as many times as needed. The workhorse for custom producers.",
          "**`flowOf(a, b, c)`** — a flow of a fixed set of values, like `listOf` for flows.",
          "**`.asFlow()`** — turn a collection, sequence, or range into a flow (`(1..10).asFlow()`, `myList.asFlow()`).",
          "**`callbackFlow { }`** — bridge a *callback/listener*-based API (location updates, sensor, Firebase listener) into a Flow; it gives a thread-safe `trySend` and requires `awaitClose { }` to clean up when collection stops.",
          "**`channelFlow { }`** — like `flow { }` but allows emitting from *multiple* coroutines concurrently (via `send`), for when producers are parallel.",
        ],
      },
      {
        t: "p",
        text: "The one rule to remember about `flow { }`: you must `emit` from the builder's own coroutine — you can't launch a child coroutine inside it and emit from there (it throws, to protect flow's sequential context guarantees). When emissions genuinely come from multiple coroutines or a callback, that's exactly what `channelFlow`/`callbackFlow` are for.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between collect and collectLatest?",
    a: [
      {
        t: "p",
        text: "**The concept**: both are terminal operators that consume every emission, but they differ in what happens when a new value arrives *while you're still processing the previous one*. `collect` processes each value to completion before accepting the next — your block runs fully for value 1, then fully for value 2, and so on (the producer waits for you). `collectLatest` **cancels** your still-running block when a newer value arrives and restarts it with the new value.",
      },
      {
        t: "code",
        title: "collectLatest for search-as-you-type",
        code: `queryFlow.collectLatest { query ->
    // If the user types another letter before this search finishes,
    // this block is cancelled and restarted with the new query —
    // no wasted request, no stale results overwriting fresh ones.
    val results = repository.search(query)
    show(results)
}`,
      },
      {
        t: "p",
        text: "**When to use which**: `collect` when every value must be fully handled (processing a queue of events, writing each item to a DB). `collectLatest` when *only the latest value matters* and older in-flight work should be abandoned — the classic case is search-as-you-type or reacting to the newest UI state, where finishing an outdated computation is wasteful and can cause the stale-result race (an old slow response overwriting a newer one). The operator equivalents on the transform side are `mapLatest`/`flatMapLatest`, which apply the same 'cancel previous' idea inside a pipeline.",
      },
    ],
  },
  {
    level: "senior",
    q: "Explain cold vs hot flows in depth. Give concrete Android examples of when to use each.",
    a: [
      {
        t: "p",
        text: "**Cold**: the producer runs *per collector*, starting on collection and stopping when collection stops; each collector gets an independent execution. **Hot**: the stream exists and emits *independently* of collectors, multicasting the same emissions to all current collectors; late collectors miss earlier values (unless replay is configured).",
      },
      {
        t: "list",
        items: [
          "**Use cold** for *pull-based, per-consumer work that should be lazy and cancellable*: a repository function returning `flow { emit(api.fetch()) }` or a Room `Flow` query. Nothing runs until a screen observes it; two screens each get their own execution; navigating away cancels the work. This is the default and the right choice for most data-layer streams.",
          "**Use hot** for *shared state or events that exist regardless of observers*: a `StateFlow` holding UI state (there's one current value, shared by all observers, and it exists whether or not the UI is on screen), or a `SharedFlow` broadcasting events to multiple listeners. Sensor/location streams that should run once and fan out to many collectors are also hot (often a cold `callbackFlow` converted to hot via `shareIn`).",
          "**The bridge**: `stateIn`/`shareIn` convert a cold flow into a hot one — you take an expensive cold upstream (a DB query), collect it *once*, and multicast the result, so two screens don't trigger two DB observations. That's the standard ViewModel pattern (`stateIn(scope, WhileSubscribed(5000), initial)`).",
        ],
      },
      {
        t: "p",
        text: "**The subtle bug this prevents**: if a ViewModel exposes a *cold* flow directly and two things collect it (the UI plus, say, a logger), you get two independent upstream executions — two network calls, two DB observations. Converting to hot with `stateIn` collects once and shares. Conversely, exposing raw mutable *hot* state lets collectors miss events or see stale replays. Knowing which to use where — cold in the data layer, hot for shared UI state, bridged with stateIn/shareIn — is the core competency the cold/hot question tests.",
      },
    ],
  },
  {
    level: "senior",
    q: "Why must you emit only from the flow builder's coroutine, and what do you use when values come from multiple coroutines or a callback?",
    a: [
      {
        t: "p",
        text: "**The reason for the restriction**: `flow { }` guarantees **context preservation** and **sequential emission** — the collector can rely on emissions arriving one at a time, in the collector's context (unless `flowOn` changes the producer's). If you could launch a child coroutine inside `flow { }` and call `emit` from it, emissions could happen concurrently and from a different context, breaking those guarantees. So the flow builder actively detects cross-coroutine emission and throws `IllegalStateException` ('Flow invariant is violated'). `emit` is not thread-safe by design.",
      },
      {
        t: "list",
        items: [
          "**`channelFlow { }`** — use when emissions genuinely originate from *multiple coroutines you launch* (concurrent producers). It backs the flow with a `Channel` and exposes a thread-safe `send`/`trySend` that *is* safe to call from any coroutine, precisely because a channel synchronizes them. You can `launch { send(a) }` and `launch { send(b) }` inside it.",
          "**`callbackFlow { }`** — a `channelFlow` specialized for *callback/listener* APIs (which invoke you on their own threads). Register the listener, `trySend` from its callback, and call `awaitClose { unregister() }` so the listener is removed when collection is cancelled. This is the canonical way to wrap `LocationManager`, sensors, `ValueEventListener`, etc.",
          "**Cost/trade-off**: both use a channel internally, so they're slightly heavier and their emission isn't strictly sequential in the same way `flow { }` is — you use them specifically *because* you need concurrent/external emission, and accept the channel's buffering semantics (configurable capacity, `onBufferOverflow`).",
        ],
      },
      {
        t: "p",
        text: "The mental rule: plain `flow { }` for a single sequential producer (the common case); `channelFlow`/`callbackFlow` the moment emission must cross coroutine or thread boundaries.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does cancellation work with flows, and what's the gotcha with tight loops?",
    a: [
      {
        t: "p",
        text: "**The model**: flow collection happens inside a coroutine, so it's governed by structured concurrency. Cancel the collecting coroutine (its scope is cancelled, the screen leaves, a `take(1)` completes) and the collection is cancelled — which propagates back up: the producer stops, and terminal operators like `first`/`take` cancel the upstream once they have enough. Flow builders are **cancellation-cooperative at each `emit`**: `emit` checks for cancellation, so a flow that emits or calls suspend functions periodically will stop promptly when cancelled, throwing `CancellationException` that unwinds the coroutine normally.",
      },
      {
        t: "list",
        items: [
          "**The gotcha**: cancellation is cooperative — it's only *checked* at suspension points (`emit`, `delay`, other suspend calls). A flow whose producer runs a tight **CPU loop without emitting or suspending** won't notice cancellation and will run to completion even after the collector is gone. Example: `flow { var x = 0L; while (true) { x++ } }` ignores cancellation.",
          "**The fix**: insert cooperative checks — call `currentCoroutineContext().ensureActive()` (throws if cancelled) or check `isActive` in the loop, or use the `.cancellable()` operator which inserts a cancellation check on every emission (useful for flows like `(1..1_000_000).asFlow()` that emit rapidly without other suspension points).",
          "**Related correctness rule**: never `catch` a `CancellationException` and swallow it inside flow operators or `collect` blocks — that breaks cancellation (the coroutine thinks it recovered). Rethrow it, or catch specific exceptions only. The `catch` operator is already cancellation-aware and won't swallow it, but a hand-written `try/catch (e: Exception)` around a suspend call will — a classic bug.",
        ],
      },
    ],
  },
  {
    level: "junior",
    q: "How does a cold Flow work under the hood (the emit/collect handshake)?",
    a: [
      {
        t: "p",
        text: "A cold Flow is essentially a suspend lambda that isn't run until collected. When you call a terminal operator like `collect`, the flow's builder block executes; each `emit(value)` *suspends* the producer and calls the collector's block with the value, then resumes the producer when the collector finishes. It's a cooperative, sequential handshake between producer and consumer — all within coroutines.",
      },
      {
        t: "code",
        title: "emit calls the collector",
        code: `val f = flow {
    emit(1)          // suspends, invokes collector with 1, resumes when done
    emit(2)
}
f.collect { value -> println(value) }   // runs the builder; prints 1 then 2`,
      },
      {
        t: "list",
        items: [
          "**Nothing runs until collected** — the builder is stored, not executed, until a terminal operator.",
          "**`emit` → collector** — emitting suspends the producer and directly invokes the collector's lambda.",
          "**Sequential** — one value flows through fully before the next is emitted (unless you add buffering/concurrency operators).",
          "**Per-collector** — each `collect` runs the builder again (cold).",
        ],
      },
      {
        t: "note",
        text: "A cold Flow is a suspend lambda that runs only when collected: the terminal operator executes the builder, and each emit() suspends the producer, invokes the collector's block with the value, then resumes — a sequential producer/consumer handshake in coroutines. Each collect re-runs the builder (cold).",
      },
    ],
  },
  {
    level: "junior",
    q: "What are the common terminal operators, and what do they do?",
    a: [
      {
        t: "p",
        text: "A terminal operator is what *starts* the flow and consumes its values — it's a suspend function you call at the end of the chain. `collect` is the most general (runs a block per value); others reduce the stream to a single result or a collection.",
      },
      {
        t: "list",
        items: [
          "**`collect { }`** — the fundamental terminal; runs a block for each emission until the flow completes.",
          "**`toList()` / `toSet()`** — gather all emissions into a collection (only for finite flows).",
          "**`first()` / `firstOrNull()`** — take the first (matching) value, then cancel the flow.",
          "**`single()`** — expect exactly one value (throws if zero or more than one).",
          "**`reduce` / `fold`** — aggregate emissions into one result.",
          "**`count()`** — number of emissions; **`launchIn(scope)`** — collect in a scope without a lambda.",
        ],
      },
      {
        t: "code",
        title: "Terminals",
        code: `flow.collect { println(it) }
val all = flow.toList()
val firstEven = flow.first { it % 2 == 0 }
val sum = flow.fold(0) { acc, x -> acc + x }`,
      },
      {
        t: "note",
        text: "Terminal operators start and consume a flow (suspend functions): collect (per-value block), toList/toSet (gather — finite flows), first/firstOrNull (take one, then cancel), single (exactly one), reduce/fold (aggregate), count, and launchIn (collect in a scope). Without a terminal, a flow never runs.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is launchIn, and how does it differ from collect?",
    a: [
      {
        t: "p",
        text: "`launchIn(scope)` collects a flow in the given `CoroutineScope` and returns a `Job` immediately — it's a shorthand for `scope.launch { flow.collect { } }`. Unlike `collect` (a suspend function that blocks the current coroutine until the flow finishes), `launchIn` is fire-and-forget: it starts collection concurrently. You typically pair it with `onEach` to do the per-value work.",
      },
      {
        t: "code",
        title: "launchIn vs collect",
        code: `// collect: suspends here until the flow completes
scope.launch { flow.collect { handle(it) } }

// launchIn: starts collection, returns a Job immediately
flow.onEach { handle(it) }.launchIn(scope)`,
      },
      {
        t: "list",
        items: [
          "**`collect`** — suspend; runs inline until the flow completes.",
          "**`launchIn(scope)`** — launches collection in `scope`, returns a `Job`; non-blocking.",
          "**Pair with `onEach`** — put per-value logic in `onEach` since `launchIn` takes no lambda.",
          "**Multiple flows** — `launchIn` is handy to start collecting several flows without nesting.",
        ],
      },
      {
        t: "note",
        text: "launchIn(scope) = scope.launch { flow.collect { } } — starts collection concurrently and returns a Job (fire-and-forget), unlike collect which suspends inline until the flow finishes. Pair launchIn with onEach for per-value logic. Great for launching several flow collections without nested launch/collect.",
      },
    ],
  },
  {
    level: "junior",
    q: "What's the difference between a Flow and a Sequence?",
    a: [
      {
        t: "p",
        text: "Both are lazy and process elements one at a time, but a `Sequence` is *synchronous/blocking* — its operations run on the calling thread and can't suspend — while a `Flow` is *asynchronous* — it can `suspend` (do I/O, `delay`, switch dispatchers) between emissions. Use a `Sequence` for lazy in-memory computation; use a `Flow` when values arrive over time or involve suspension.",
      },
      {
        t: "list",
        items: [
          "**`Sequence`** — synchronous, blocking; lazy transformations of in-memory data on the current thread.",
          "**`Flow`** — asynchronous; can suspend, do I/O, emit over time, switch context (`flowOn`).",
          "**Timing** — a `Sequence` computes each element on demand synchronously; a `Flow` can wait (network, timers).",
          "**Choose** — `Sequence` for large in-memory pipelines; `Flow` for async streams (DB observations, network, events).",
        ],
      },
      {
        t: "note",
        text: "Sequence = synchronous, blocking lazy pipeline on the current thread (in-memory data). Flow = asynchronous lazy stream that can suspend (I/O, delay, dispatcher switch) and emit over time. Use Sequence for lazy in-memory computation; Flow for values that arrive over time or need suspension.",
      },
    ],
  },
  {
    level: "junior",
    q: "How is a Flow different from a suspend function that returns a List?",
    a: [
      {
        t: "p",
        text: "A suspend function returning a `List` gives you *all the values at once*, after everything is ready — a single result. A `Flow` emits values *one at a time over time*, and can keep emitting (an ongoing stream). Use the list for a one-shot fetch; use a `Flow` when values arrive incrementally or the source keeps producing updates.",
      },
      {
        t: "list",
        items: [
          "**Suspend → `List`** — one-shot; you wait, then get the whole result. Good for a single request.",
          "**`Flow<T>`** — multiple emissions over time; can be infinite (DB changes, location updates, UI events).",
          "**Streaming updates** — a `Flow` from Room re-emits when the table changes; a suspend function would need re-calling.",
          "**Incremental** — a `Flow` can emit results as they arrive (e.g. paging) rather than waiting for all.",
        ],
      },
      {
        t: "code",
        title: "One-shot vs stream",
        code: `suspend fun getUsers(): List<User>            // one result, then done
fun observeUsers(): Flow<List<User>>          // re-emits whenever data changes`,
      },
      {
        t: "note",
        text: "A suspend function returning List gives all values at once (one-shot). A Flow emits values over time and can be ongoing/infinite (DB observations, events, location). Use List for a single fetch; use Flow for incremental results or a source that keeps producing updates (e.g. Room's Flow re-emits on change).",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you convert existing data into a Flow?",
    a: [
      {
        t: "p",
        text: "Use the appropriate builder: `flowOf(a, b, c)` for a fixed set of values, `listOf(...).asFlow()` (or `IntRange.asFlow()`) for a collection/range, and the general `flow { }` builder when you need to emit with logic or suspension. For callbacks, use `callbackFlow`; for a channel, `receiveAsFlow`.",
      },
      {
        t: "code",
        title: "Builders",
        code: `flowOf(1, 2, 3)                      // fixed values
listOf("a", "b").asFlow()           // from a collection
(1..100).asFlow()                    // from a range
flow { repeat(5) { emit(it); delay(1000) } }   // custom, with suspension`,
      },
      {
        t: "list",
        items: [
          "**`flowOf(...)`** — emit a known set of values.",
          "**`.asFlow()`** — turn a collection, range, or sequence into a flow.",
          "**`flow { }`** — general builder for custom emission (loops, I/O, suspension).",
          "**`callbackFlow`/`channelFlow`** — for callback sources or emitting from multiple coroutines.",
        ],
      },
      {
        t: "note",
        text: "flowOf(a,b,c) for fixed values, collection/range .asFlow(), the general flow { } builder for custom/suspending emission, and callbackFlow/channelFlow for callbacks or multi-coroutine emission. Pick the simplest that fits the source.",
      },
    ],
  },
  {
    level: "junior",
    q: "What does it mean that a Flow processes values sequentially?",
    a: [
      {
        t: "p",
        text: "By default a Flow handles one value at a time, start to finish, before the producer emits the next: `emit(1)` → collector processes 1 fully → `emit(2)` → collector processes 2. The producer and collector run in the *same* coroutine, so there's no built-in concurrency between emitting and collecting. Operators like `buffer`, `flatMapMerge`, or `collectLatest` change this.",
      },
      {
        t: "list",
        items: [
          "**One at a time** — each emission is fully collected before the next is produced.",
          "**Same coroutine** — producer and collector share a coroutine by default (no parallelism).",
          "**Implications** — a slow collector slows the producer (natural backpressure).",
          "**Opt into concurrency** — `buffer()` (decouple), `flatMapMerge` (concurrent inner flows), `collectLatest` (cancel-and-restart).",
        ],
      },
      {
        t: "note",
        text: "By default a Flow processes one value fully before emitting the next, with producer and collector in the same coroutine (no built-in concurrency) — so a slow collector paces the producer (natural backpressure). Opt into concurrency with buffer() (decouple stages), flatMapMerge (concurrent inners), or collectLatest.",
      },
    ],
  },
  {
    level: "junior",
    q: "What happens if you collect the same cold flow twice?",
    a: [
      {
        t: "p",
        text: "Each `collect` runs the flow's builder *from scratch* — a cold flow re-executes its entire producer for every collector. So collecting a network-backed flow twice makes two network calls; collecting a `flow { emit(...) }` twice runs the block twice. If you want to *share* one execution among collectors, convert it to a hot flow with `shareIn`/`stateIn`.",
      },
      {
        t: "code",
        title: "Cold = re-run per collector",
        code: `val f = flow { println("fetching"); emit(api.get()) }
f.collect { }   // prints "fetching", one network call
f.collect { }   // prints "fetching" AGAIN, another network call

// Share one execution:
val shared = f.shareIn(scope, SharingStarted.WhileSubscribed(), replay = 1)`,
      },
      {
        t: "list",
        items: [
          "**Re-executes** — the builder runs anew for each collector (independent streams).",
          "**Side effects repeat** — duplicate network/DB calls if multiple collectors.",
          "**Fix for sharing** — `shareIn`/`stateIn` make it hot so collectors share one upstream execution.",
          "**Cold is often desired** — independent, reproducible streams (e.g. each screen its own fetch).",
        ],
      },
      {
        t: "note",
        text: "A cold flow re-runs its whole builder for each collector — collecting twice = two executions (two network calls). To share one upstream execution among collectors, make it hot with shareIn/stateIn. Cold is fine when you want independent streams; share when duplicate work/side effects are the problem.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between first(), single(), and firstOrNull()?",
    a: [
      {
        t: "p",
        text: "These terminals take a value and stop. `first()` returns the first emission (throwing if the flow is empty) and *cancels* the flow after; `firstOrNull()` returns `null` instead of throwing on empty; `single()` expects *exactly one* emission and throws if there are zero or more than one. Each can take a predicate to match a specific value.",
      },
      {
        t: "list",
        items: [
          "**`first()`** — first emission; throws `NoSuchElementException` if empty; cancels upstream after.",
          "**`firstOrNull()`** — first emission or `null` if empty (no throw).",
          "**`single()`** — requires exactly one emission; throws if zero or more than one (use when you expect precisely one value).",
          "**With predicate** — `first { it > 5 }` takes the first match, then cancels.",
        ],
      },
      {
        t: "note",
        text: "first() = first emission (throws if empty), cancels upstream after; firstOrNull() = first or null (no throw); single() = requires exactly one (throws on zero or >1). All accept a predicate (first { }). Use first/firstOrNull to grab one value from a stream, single when exactly one is expected.",
      },
    ],
  },
  {
    level: "junior",
    q: "What thread or context does a Flow run on by default?",
    a: [
      {
        t: "p",
        text: "By default, a Flow runs entirely in the *collector's* coroutine context — whatever dispatcher `collect` is called from. There's no built-in threading; the producer, operators, and collector all run on the collector's thread. To run part of the pipeline on a different dispatcher (e.g. do the upstream I/O on `IO`), use `flowOn(dispatcher)`.",
      },
      {
        t: "code",
        title: "Collector context + flowOn",
        code: `flow { emit(loadFromDisk()) }   // runs on collector's context...
    .map { transform(it) }
    .flowOn(Dispatchers.IO)     // ...but this upstream runs on IO
    .collect { render(it) }     // collector on, say, Main`,
      },
      {
        t: "list",
        items: [
          "**Collector's context** — the whole flow runs where `collect` is called, unless changed.",
          "**`flowOn(dispatcher)`** — changes the context of the *upstream* (operators/producer above it).",
          "**No threading by default** — you must add `flowOn` for background work.",
          "**Downstream unaffected** — `flowOn` only affects upstream; the collector stays on its own context.",
        ],
      },
      {
        t: "note",
        text: "A Flow runs in the collector's context by default (no built-in threading) — producer, operators, and collector all on the collect caller's dispatcher. Use flowOn(dispatcher) to run the UPSTREAM on another dispatcher (e.g. IO for the producer) while the collector stays on Main. flowOn affects only upstream.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is context preservation, and why does emitting from a different context throw?",
    a: [
      {
        t: "p",
        text: "Flow enforces *context preservation*: a flow must emit from the same coroutine context in which the builder runs. If you `withContext(Dispatchers.IO) { emit(x) }` inside a `flow { }`, you're emitting from a different context than the collector expects, so Flow throws an `IllegalStateException` ('Flow invariant is violated'). The correct way to change context is `flowOn`, not `withContext` around `emit`.",
      },
      {
        t: "code",
        title: "Wrong vs right",
        code: `// WRONG: emits from a different context -> throws
flow {
    withContext(Dispatchers.IO) { emit(load()) }   // IllegalStateException
}
// RIGHT: use flowOn to move the whole upstream
flow { emit(load()) }.flowOn(Dispatchers.IO)`,
      },
      {
        t: "list",
        items: [
          "**Invariant** — emissions must happen in the builder's context, not a switched one.",
          "**Why** — it guarantees predictable threading and cancellation for collectors.",
          "**`flowOn`** — the sanctioned way to change upstream context; it moves the producer's context correctly.",
          "**`channelFlow`** — if you genuinely need to emit from multiple coroutines/contexts, use `channelFlow` + `send`.",
        ],
      },
      {
        t: "note",
        text: "Context preservation: a Flow must emit from the builder's context. Wrapping emit in withContext(IO) inside flow{} violates the invariant and throws IllegalStateException. Change context with flowOn (moves the whole upstream) instead. To emit from multiple coroutines/contexts, use channelFlow + send.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you limit a flow with take, drop, and takeWhile?",
    a: [
      {
        t: "p",
        text: "These operators bound how many values you process. `take(n)` collects only the first `n` emissions then cancels the flow; `drop(n)` skips the first `n`; `takeWhile { }`/`dropWhile { }` take/skip while a predicate holds. `take` is especially useful to turn an infinite flow into a finite one.",
      },
      {
        t: "code",
        title: "Bounding a flow",
        code: `infiniteFlow.take(5)                 // first 5, then cancels upstream
flow.drop(2)                         // skip first 2
flow.takeWhile { it < 100 }          // until the predicate fails
flow.dropWhile { it.isBlank() }      // skip leading blanks`,
      },
      {
        t: "list",
        items: [
          "**`take(n)`** — first n emissions, then completes/cancels upstream.",
          "**`drop(n)`** — ignore the first n, emit the rest.",
          "**`takeWhile { }`** — emit until the predicate is false (then stop).",
          "**`dropWhile { }`** — skip while the predicate holds, then emit the rest.",
        ],
      },
      {
        t: "note",
        text: "take(n) = first n then cancel upstream (turns infinite into finite); drop(n) = skip first n; takeWhile { } = emit until predicate fails; dropWhile { } = skip leading matches. take is the common way to bound an otherwise-infinite flow.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you aggregate a flow's values with reduce, fold, and scan?",
    a: [
      {
        t: "p",
        text: "`reduce` and `fold` are *terminal* operators that collapse all emissions into a single result (like their collection counterparts). `scan` is an *intermediate* operator that emits each *intermediate* accumulated value — great for running totals or accumulating state over a stream.",
      },
      {
        t: "code",
        title: "reduce/fold/scan",
        code: `flowOf(1,2,3).reduce { acc, x -> acc + x }        // 6 (terminal)
flowOf(1,2,3).fold(10) { acc, x -> acc + x }      // 16 (terminal, with initial)
flowOf(1,2,3).scan(0) { acc, x -> acc + x }
    .collect { println(it) }                       // emits 0,1,3,6 (running totals)`,
      },
      {
        t: "list",
        items: [
          "**`reduce`** — terminal; combine emissions, no initial value (throws on empty).",
          "**`fold(initial)`** — terminal; like reduce with a seed and a possibly different result type.",
          "**`scan(initial)`** — intermediate; emits each running accumulation (a stream of states).",
          "**Use `scan`** — running totals, accumulating UI state from a stream of events.",
        ],
      },
      {
        t: "note",
        text: "reduce (terminal, no seed) and fold(initial) (terminal, seeded) collapse a flow to one result. scan(initial) is INTERMEDIATE — it emits each running accumulation (0,1,3,6 for sums), ideal for running totals or accumulating state from an event stream.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between flow{} and channelFlow{}?",
    a: [
      {
        t: "p",
        text: "`flow { }` is sequential and must emit from its own single coroutine (context preservation). `channelFlow { }` provides a `ProducerScope` where you `send` values and can do so from *multiple* coroutines / different contexts concurrently — it's backed by a channel. Use `channelFlow` when values come from concurrent sources or callbacks; use `flow` for simple sequential emission.",
      },
      {
        t: "code",
        title: "channelFlow for concurrent emission",
        code: `channelFlow {
    launch { send(fromSourceA()) }   // multiple coroutines can send
    launch { send(fromSourceB()) }
    awaitClose { /* cleanup */ }
}`,
      },
      {
        t: "list",
        items: [
          "**`flow { }`** — sequential, single-coroutine emission; lightest weight.",
          "**`channelFlow { }`** — `send` from multiple coroutines/contexts; backed by a channel (some overhead).",
          "**`callbackFlow`** — a `channelFlow` specialized for callback bridging (with `awaitClose`).",
          "**Choose `channelFlow`** — merging concurrent producers, emitting from launched children, or callbacks.",
        ],
      },
      {
        t: "note",
        text: "flow { } is sequential and must emit from its own coroutine (context preservation). channelFlow { } gives a ProducerScope where you send from MULTIPLE coroutines/contexts concurrently (channel-backed, some overhead). Use channelFlow (or callbackFlow) for concurrent producers/callbacks; flow{} for simple sequential emission.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why do flows need coroutines, and how are they related?",
    a: [
      {
        t: "p",
        text: "Flow is built *on* coroutines: `emit` and `collect` are suspend functions, so a flow can only be collected inside a coroutine, and its emissions suspend/resume like any coroutine work. This is why flows integrate seamlessly with structured concurrency — collecting a flow in `viewModelScope` means it's cancelled when the scope is, and `flowOn` uses dispatchers.",
      },
      {
        t: "list",
        items: [
          "**`collect` is suspend** — you collect inside a coroutine (`launch`/`viewModelScope`).",
          "**`emit` suspends** — flows leverage suspension for backpressure and async work.",
          "**Structured concurrency** — collecting in a scope ties the flow's lifetime to that scope (auto-cancel).",
          "**Dispatchers apply** — `flowOn` uses coroutine dispatchers for threading.",
        ],
      },
      {
        t: "note",
        text: "Flow is built on coroutines: emit/collect are suspend functions, so you collect only inside a coroutine, and flows inherit structured concurrency (collecting in viewModelScope auto-cancels) and dispatchers (flowOn). Flows are the streaming layer over coroutines' one-shot suspend model.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you collect a flow safely tied to a screen's lifecycle?",
    a: [
      {
        t: "p",
        text: "In Compose, use `collectAsStateWithLifecycle()`; in Views, collect inside `repeatOnLifecycle(STARTED)` within `lifecycleScope`. Both stop collecting when the UI is backgrounded (below STARTED) and resume when it returns, avoiding wasted work and updates to an off-screen UI.",
      },
      {
        t: "code",
        title: "Lifecycle-aware collection",
        code: `// Compose
val state by viewModel.uiState.collectAsStateWithLifecycle()

// Views
lifecycleScope.launch {
    repeatOnLifecycle(Lifecycle.State.STARTED) {
        viewModel.uiState.collect { render(it) }
    }
}`,
      },
      {
        t: "list",
        items: [
          "**`collectAsStateWithLifecycle()`** — the Compose default; lifecycle-aware.",
          "**`repeatOnLifecycle(STARTED)`** — the Views pattern; cancels collection on STOP, restarts on START.",
          "**Pairs with `stateIn(WhileSubscribed)`** — so the upstream also stops when there are no collectors.",
          "**Avoid plain `collect` in the UI without lifecycle** — it keeps collecting in the background.",
        ],
      },
      {
        t: "note",
        text: "Compose: collectAsStateWithLifecycle(). Views: repeatOnLifecycle(STARTED) inside lifecycleScope. Both stop collecting when backgrounded and resume on return (no wasted work/off-screen updates). Pair with stateIn(WhileSubscribed) so the upstream also stops with no collectors.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you perform a side effect for each value while collecting?",
    a: [
      {
        t: "p",
        text: "Use `onEach { }` — an intermediate operator that runs a side effect for each emission and passes the value through unchanged. It's ideal for logging, analytics, or triggering effects mid-pipeline, and pairs with `launchIn` to collect without a separate `collect` lambda.",
      },
      {
        t: "code",
        title: "onEach for side effects",
        code: `flow
    .onEach { logAnalytics(it) }        // side effect, value unchanged
    .map { it.toUiModel() }
    .onEach { println("mapped: \$it") }
    .launchIn(viewModelScope)`,
      },
      {
        t: "list",
        items: [
          "**`onEach { }`** — side effect per value; returns the value unchanged (unlike `map`, which transforms).",
          "**Anywhere in the chain** — before/after transformations, for logging or triggering effects.",
          "**With `launchIn`** — `flow.onEach { }.launchIn(scope)` collects without a `collect` block.",
          "**Not for transformation** — use `map`/`transform` to change values.",
        ],
      },
      {
        t: "note",
        text: "onEach { } runs a side effect per emission and passes the value through unchanged (vs map, which transforms) — for logging/analytics/effects mid-pipeline. Pair with launchIn to collect without a separate collect lambda: flow.onEach { }.launchIn(scope).",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you handle an infinite flow that never completes?",
    a: [
      {
        t: "p",
        text: "Many flows are intentionally infinite (a Room `Flow`, a location stream, UI events) — they never call the collector's completion. You bound them by *scope* (collect in a lifecycle scope that cancels) or by *operators* (`take(n)`, `takeWhile`, `first()`) that stop after some condition. You don't 'wait' for them to finish; you cancel them when done.",
      },
      {
        t: "list",
        items: [
          "**Bound by scope** — collect in `viewModelScope`/`lifecycleScope`; cancellation stops the infinite flow.",
          "**Bound by operator** — `take(n)`/`takeWhile`/`first()` complete after a condition.",
          "**Don't use `toList()`** — it never returns on an infinite flow (waits for completion).",
          "**Design** — treat infinite flows as ongoing subscriptions, cancelled via structured concurrency.",
        ],
      },
      {
        t: "note",
        text: "Infinite flows (Room, location, events) never complete — bound them by scope (collect in a lifecycle scope that cancels) or operators (take/takeWhile/first). Never toList() an infinite flow (it waits forever). Treat them as ongoing subscriptions cancelled via structured concurrency.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is transform, and how is it more flexible than map?",
    a: [
      {
        t: "p",
        text: "`map` emits exactly one transformed value per input. `transform { }` is the general operator that can emit *zero, one, or many* values per input (via `emit`) — you use it when a single input should produce a variable number of outputs, or none. Most operators (`map`, `filter`) are actually built on `transform`.",
      },
      {
        t: "code",
        title: "transform emits flexibly",
        code: `flow.transform { value ->
    emit("before \$value")     // can emit multiple
    if (value > 0) emit("positive: \$value")   // or conditionally
}`,
      },
      {
        t: "list",
        items: [
          "**`map`** — 1 input → 1 output.",
          "**`transform`** — 1 input → 0, 1, or many outputs (call `emit` as needed).",
          "**Use `transform`** — expand one value into several, or filter+map in one step.",
          "**Foundation** — `map`/`filter` are implemented via `transform`.",
        ],
      },
      {
        t: "note",
        text: "map is 1→1; transform { } is 1→0/1/many (call emit as needed) — for expanding one input into several outputs or conditional emission. map/filter are built on transform. Reach for transform when a single input should produce a variable number of emissions.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does exception handling flow through a Flow pipeline?",
    a: [
      {
        t: "p",
        text: "Exceptions thrown anywhere upstream (producer or operators) propagate down and can be caught by the `catch { }` operator, which only catches *upstream* exceptions (exception transparency). An exception in the *collector* is not caught by `catch` — wrap the `collect` in `try/catch` for that. This upstream/downstream distinction is why `catch` placement matters.",
      },
      {
        t: "code",
        title: "catch catches upstream only",
        code: `flow
    .map { risky(it) }        // exception here...
    .catch { e -> emit(fallback) }   // ...caught here (upstream)
    .collect { render(it) }   // exception HERE is NOT caught by catch above
`,
      },
      {
        t: "list",
        items: [
          "**`catch { }`** — catches exceptions from *upstream* operators/producer; can `emit` a fallback or rethrow.",
          "**Collector exceptions** — not caught by `catch`; use `try/catch` around `collect`.",
          "**Placement** — put `catch` after the operators whose failures you want to handle; a `catch` at the end won't catch downstream collector errors.",
          "**Exception transparency** — operators shouldn't swallow exceptions implicitly; `catch` makes handling explicit.",
        ],
      },
      {
        t: "note",
        text: "The catch { } operator catches only UPSTREAM exceptions (producer/operators above it) — exception transparency — and can emit a fallback or rethrow. Collector exceptions aren't caught by catch; use try/catch around collect. Placement matters: catch handles failures from operators above it, not below.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is filter, and how do you chain intermediate operators?",
    a: [
      {
        t: "p",
        text: "`filter { }` emits only values matching a predicate — the flow equivalent of `Collection.filter`. Intermediate operators like `filter`, `map`, `onEach` are *lazy* and chainable: each returns a new flow, and nothing runs until a terminal operator collects. You build a declarative pipeline that executes per-value when collected.",
      },
      {
        t: "code",
        title: "A chained pipeline",
        code: `flow
    .filter { it.isActive }        // keep matching
    .map { it.name }               // transform
    .distinctUntilChanged()        // skip consecutive duplicates
    .collect { println(it) }       // terminal starts it all`,
      },
      {
        t: "list",
        items: [
          "**`filter { }`** — emit only values where the predicate is true; `filterNot`, `filterIsInstance` variants.",
          "**Lazy & chainable** — each intermediate operator returns a new flow; nothing runs until a terminal.",
          "**Order matters** — operators apply top-to-bottom per value (filter before map changes what's transformed).",
          "**Readable pipelines** — declarative, like collection operators but async.",
        ],
      },
      {
        t: "note",
        text: "filter { } emits only values matching a predicate (plus filterNot/filterIsInstance). Intermediate operators (filter/map/onEach) are lazy and chainable — each returns a new flow, and nothing runs until a terminal collects. Order matters (filter before map). It reads like collection operators but async.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you emit values from a loop or over time in a flow builder?",
    a: [
      {
        t: "p",
        text: "Inside `flow { }` you can call `emit` as many times as you like, including in loops and after `delay`, because the builder is a suspend lambda. This lets you produce a stream that ticks over time (a timer), polls periodically, or emits a computed sequence.",
      },
      {
        t: "code",
        title: "Emitting over time",
        code: `fun ticker(): Flow<Int> = flow {
    var count = 0
    while (true) {
        emit(count++)     // emit each tick
        delay(1000)       // wait a second (cancellable)
    }
}
fun polls(): Flow<Data> = flow {
    while (true) { emit(api.poll()); delay(5000) }   // periodic polling
}`,
      },
      {
        t: "list",
        items: [
          "**`emit` in loops** — produce many values from a `while`/`for`.",
          "**`delay` between emits** — time-based streams (tickers, polling).",
          "**Cancellable** — `delay`/`emit` are suspension points, so the flow stops when the collector is cancelled.",
          "**Infinite is fine** — bound it with scope or operators (`take`).",
        ],
      },
      {
        t: "note",
        text: "Inside flow { } (a suspend lambda) call emit in loops and after delay to produce streams over time — tickers, periodic polling, computed sequences. delay/emit are suspension points so it's cancellable (stops when the collector is cancelled). Infinite loops are fine; bound with scope or take.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you share a cold flow among multiple collectors without re-running it?",
    a: [
      {
        t: "p",
        text: "Convert it to a *hot* flow with `shareIn` (for a `SharedFlow`) or `stateIn` (for a `StateFlow`). These run the upstream *once* in a given scope and multicast emissions to all collectors, so a network/DB source isn't re-executed per collector. `SharingStarted.WhileSubscribed()` keeps the upstream active only while there are collectors.",
      },
      {
        t: "code",
        title: "Share one upstream execution",
        code: `val shared: SharedFlow<Data> = repository.dataFlow()
    .shareIn(scope, SharingStarted.WhileSubscribed(5000), replay = 1)

val state: StateFlow<UiState> = repository.dataFlow()
    .map { toUiState(it) }
    .stateIn(scope, SharingStarted.WhileSubscribed(5000), UiState.Loading)`,
      },
      {
        t: "list",
        items: [
          "**`shareIn`** — hot `SharedFlow`; multicasts to all collectors; configurable `replay`.",
          "**`stateIn`** — hot `StateFlow` with a current value; ideal for UI state.",
          "**`WhileSubscribed(5000)`** — upstream stops 5s after the last collector leaves (survives config change).",
          "**Prevents duplicate work** — one network/DB subscription shared, not one per collector.",
        ],
      },
      {
        t: "note",
        text: "Make it hot: shareIn (SharedFlow, configurable replay) or stateIn (StateFlow with a current value) runs the upstream once in a scope and multicasts to all collectors — no per-collector re-execution. SharingStarted.WhileSubscribed(5000) keeps upstream alive only while subscribed (+5s for config change). Fixes duplicate network/DB calls.",
      },
    ],
  },
];

export default qa;
