// Context, flowOn, stateIn/shareIn & callbackFlow — Content tab. Teaching-first.

const content = [
  {
    heading: "Context preservation — flows run where they're collected",
    blocks: [
      {
        t: "p",
        text: "By default, a flow's producer and operators run in **the coroutine context of the collector**. If you collect on `Dispatchers.Main`, the `flow { }` body and every `map`/`filter` also run on Main. This is called **context preservation**: the flow doesn't secretly hop threads. It's a deliberate safety property — you always know where your flow code executes, and emissions arrive on the collector's context (perfect for updating UI).",
      },
      {
        t: "p",
        text: "This is also why Flow **forbids changing context inside the builder** — you can't wrap `emit` in `withContext(IO)` inside `flow { }` (it throws 'Flow invariant is violated'). The framework enforces that context changes happen through the dedicated operator, `flowOn`, so the guarantees hold.",
      },
    ],
  },
  {
    heading: "flowOn — change the context of the UPSTREAM",
    blocks: [
      {
        t: "p",
        text: "`flowOn(dispatcher)` changes the context (usually the dispatcher/thread) of **everything upstream of it** — the operators and producer that come *before* it in the chain. Crucially it affects only upstream, not downstream, so you move heavy work off the main thread while the collector still receives values on its own context.",
      },
      {
        t: "code",
        title: "flowOn moves upstream work off the main thread",
        code: `flow {
    val data = expensiveBlockingRead()   // runs on IO (below is flowOn(IO))
    emit(data)
}
.map { heavyTransform(it) }              // also runs on IO (upstream of flowOn)
.flowOn(Dispatchers.IO)                  // <-- everything ABOVE runs on IO
.map { it.toUiModel() }                  // runs on the COLLECTOR's context (Main)
.collect { render(it) }                  // Main — safe to touch UI`,
      },
      {
        t: "list",
        items: [
          "**Upstream vs downstream**: `flowOn` changes the context for operators *above* it; operators *below* it stay on the collector's context. So you place `flowOn(IO)` right after the heavy work and before the UI-facing operators.",
          "**Multiple `flowOn`s** are allowed — each governs the segment above it up to the next `flowOn`, letting different stages run on different dispatchers.",
          "**It implicitly buffers**: to run upstream on a different thread, `flowOn` hands values across a channel — so it also decouples producer and collector (a throughput side effect, as covered in the backpressure topic).",
          "**Best practice**: in clean architecture the repository/data layer should already be main-safe (it does its own `withContext`), so you often don't need `flowOn` in the ViewModel — but it's the right tool when a flow's *producer* does blocking/CPU work and you want it off Main.",
        ],
      },
    ],
  },
  {
    heading: "stateIn — convert a cold flow into a hot StateFlow",
    blocks: [
      {
        t: "p",
        text: "`stateIn` turns a **cold** flow into a **hot `StateFlow`**. Why you'd want this: a cold flow re-runs per collector, so if two things observe it you get duplicate work (two DB queries, two network calls). `stateIn` collects the upstream *once* in a given scope and multicasts the latest value to all collectors as shared state.",
      },
      {
        t: "code",
        title: "The standard ViewModel derivation",
        code: `val uiState: StateFlow<UiState> = repository.observeData()   // cold Flow
    .map { data -> UiState.Content(data) }
    .stateIn(
        scope = viewModelScope,                                 // where collection runs
        started = SharingStarted.WhileSubscribed(5_000),        // when to start/stop upstream
        initialValue = UiState.Loading,                         // value before first emission
    )`,
      },
      {
        t: "list",
        items: [
          "**`scope`** — the coroutine scope that owns the single upstream collection (usually `viewModelScope`).",
          "**`initialValue`** — StateFlow needs a current value immediately; this is it, shown until the upstream emits.",
          "**`started`** — the sharing policy that controls when the upstream is actually collected (below).",
          "**Result**: one upstream execution shared by all collectors, exposed as a `StateFlow` with `.value` — the idiomatic way to expose repository data as UI state.",
        ],
      },
    ],
  },
  {
    heading: "SharingStarted — Eagerly, Lazily, WhileSubscribed",
    blocks: [
      {
        t: "table",
        headers: ["Policy", "Starts upstream", "Stops upstream"],
        rows: [
          ["`Eagerly`", "immediately when stateIn/shareIn is created", "only when the scope is cancelled"],
          ["`Lazily`", "when the first collector appears", "only when the scope is cancelled"],
          ["`WhileSubscribed(stopTimeout)`", "when the first collector appears", "stopTimeout ms after the LAST collector leaves"],
        ],
      },
      {
        t: "p",
        text: "**`WhileSubscribed(5000)` is the Android default, and the 5000ms is deliberate.** It stops the upstream flow 5 seconds after the last collector disappears. The magic number exists because a **configuration change** briefly drops all collectors (the UI is recreated) — the 5s timeout keeps the expensive upstream (DB observation, location) alive *through* a rotation, but shuts it down for a real backgrounding (where the collector is gone for longer than 5s). It's the sweet spot between 'restart the upstream on every rotation' (0ms) and 'never stop, waste resources' (Eagerly).",
      },
      {
        t: "list",
        items: [
          "**`Eagerly`** — upstream runs from creation, never stops until scope death. Fine for cheap, always-needed state; wasteful for expensive upstreams the UI isn't watching.",
          "**`Lazily`** — starts on the first collector, then never stops. Rarely the right choice for UI.",
          "**`WhileSubscribed(5000)`** — the recommended default for UI state: starts on demand, survives config changes, stops when genuinely backgrounded. Pairs with `collectAsStateWithLifecycle` / `repeatOnLifecycle(STARTED)` on the UI side so backgrounding stops collection → stops the upstream after 5s.",
        ],
      },
    ],
  },
  {
    heading: "shareIn — convert to a hot SharedFlow",
    blocks: [
      {
        t: "p",
        text: "`shareIn` is `stateIn`'s sibling for **events/streams** rather than state: it turns a cold flow into a hot **`SharedFlow`** with configurable `replay`. Use it when you want to share an upstream among many collectors but there's no single 'current value' (or you want more than one replayed value).",
      },
      {
        t: "code",
        title: "shareIn for a shared event/data stream",
        code: `val sharedLocationUpdates: SharedFlow<Location> = locationFlow   // cold callbackFlow
    .shareIn(
        scope = externalScope,
        started = SharingStarted.WhileSubscribed(5_000),
        replay = 1,   // new collectors get the last known location
    )`,
      },
      {
        t: "list",
        items: [
          "**`stateIn` vs `shareIn`**: `stateIn` → `StateFlow` (always a current value, conflated, `replay = 1` effectively, needs `initialValue`); `shareIn` → `SharedFlow` (configurable replay, no required initial value, no conflation). Choose by whether the thing is *state* or a *stream/events*.",
          "**Common use**: sharing one expensive upstream (a socket, a location listener wrapped in `callbackFlow`) among multiple consumers so it runs once — the 'single upstream, many collectors' optimization.",
        ],
      },
    ],
  },
  {
    heading: "callbackFlow — bridging callback APIs into flows",
    blocks: [
      {
        t: "p",
        text: "Many Android APIs are **callback-based**: you register a listener and get invoked on events (`LocationManager`, sensors, `addSnapshotListener`, `TextWatcher`). `callbackFlow` wraps such an API into a Flow — turning push-callbacks into a collectable stream.",
      },
      {
        t: "code",
        title: "The callbackFlow template — register, send, awaitClose",
        code: `fun locationUpdates(client: FusedLocationProviderClient): Flow<Location> = callbackFlow {
    val callback = object : LocationCallback() {
        override fun onLocationResult(result: LocationResult) {
            result.lastLocation?.let { trySend(it) }   // push into the flow (thread-safe)
        }
    }
    client.requestLocationUpdates(request, callback, Looper.getMainLooper())

    awaitClose {                                        // REQUIRED
        client.removeLocationUpdates(callback)          // unregister when collection stops
    }
}`,
      },
      {
        t: "list",
        items: [
          "**`trySend(value)`** — the thread-safe way to emit from inside a callback (which may fire on any thread). It's non-suspending and returns a result you can inspect (it can fail if the buffer is full).",
          "**`awaitClose { }` is mandatory** — it suspends `callbackFlow` open until the collector cancels, and its block runs the cleanup (unregister the listener). Forgetting it leaks the listener *and* throws at runtime (callbackFlow requires it). This is the #1 callbackFlow interview point.",
          "**Buffer/overflow**: `callbackFlow` uses a channel; you can set capacity and `onBufferOverflow` (e.g. `BufferOverflow.DROP_OLDEST` for high-frequency sensors where only the latest matters).",
          "**Cold by default**: like any flow, it registers the listener *per collector*. To share one registration among many collectors, convert to hot with `shareIn`.",
        ],
      },
      {
        t: "note",
        text: "The three things to always say about callbackFlow: use `trySend` (thread-safe emit), always `awaitClose` (cleanup + keeps it open), and remember it's cold (one registration per collector — `shareIn` to share). Those three points answer nearly every callbackFlow question.",
      },
    ],
  },
];

export default content;
