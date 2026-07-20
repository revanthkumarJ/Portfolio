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
];

export default qa;
