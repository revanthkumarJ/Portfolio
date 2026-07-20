// Context, flowOn, stateIn/shareIn & callbackFlow — Interview Prep tab. Teaching-first.

const qa = [
  {
    level: "junior",
    q: "What does flowOn do, and why can't you just use withContext inside a flow builder?",
    a: [
      {
        t: "p",
        text: "**The concept**: by default a flow runs where it's collected (context preservation) — if you collect on Main, the producer and operators run on Main too. `flowOn(dispatcher)` changes the context of everything **upstream** of it (the operators and producer *above* it in the chain), while everything downstream stays on the collector's context. So you place `flowOn(Dispatchers.IO)` after heavy work to run that work off the main thread, and the collector still receives values on Main to safely update UI.",
      },
      {
        t: "code",
        title: "flowOn affects only what's above it",
        code: `flow { emit(blockingRead()) }     // runs on IO
    .map { heavyParse(it) }        // runs on IO (above flowOn)
    .flowOn(Dispatchers.IO)
    .map { it.toUiModel() }        // runs on collector's context (Main)
    .collect { render(it) }        // Main`,
      },
      {
        t: "p",
        text: "**Why not `withContext(IO)` inside `flow { }`**: it's forbidden — the flow builder throws 'Flow invariant is violated' if you try to `emit` from a different context than the one the flow was collected in. Flow *guarantees* context preservation and sequential emission, and wrapping `emit` in a `withContext` would break that guarantee (emissions could arrive on a different thread than promised). `flowOn` is the sanctioned mechanism that changes upstream context *while keeping the invariant intact* (it does the thread handoff safely via an internal channel). So the rule is: never change context manually inside the builder; use `flowOn`.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is stateIn and why would you use it in a ViewModel?",
    a: [
      {
        t: "p",
        text: "**The concept**: `stateIn` converts a *cold* flow into a hot `StateFlow`. Remember cold flows re-run per collector — so if a ViewModel exposed a cold flow and two things observed it (the UI plus a logger, or after a config change), you'd trigger the upstream work (a DB query, network call) twice. `stateIn` collects the upstream **once** in a scope and shares the latest value with all collectors as state.",
      },
      {
        t: "code",
        title: "The idiomatic derivation",
        code: `val uiState: StateFlow<UiState> = repository.observeItems()
    .map { UiState.Content(it) }
    .stateIn(
        viewModelScope,
        SharingStarted.WhileSubscribed(5_000),
        UiState.Loading,
    )`,
      },
      {
        t: "list",
        items: [
          "It gives you a `StateFlow` — with a synchronous `.value`, a current value for new collectors, and conflated state semantics — which is exactly what a UI wants to observe.",
          "It collects the upstream once (in `viewModelScope`), so multiple UI collectors don't duplicate the expensive work.",
          "`initialValue` provides the state to show before the upstream emits (e.g. `Loading`).",
          "The `started` policy (`WhileSubscribed(5000)`) controls when the upstream actually runs — starting on demand and stopping when the UI is truly gone.",
        ],
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between stateIn and shareIn?",
    a: [
      {
        t: "p",
        text: "**Both convert a cold flow to a hot one and share a single upstream among collectors — the difference is the output type and semantics.** `stateIn` produces a **`StateFlow`**: it always has a current value, is conflated (only latest), and needs an `initialValue`. `shareIn` produces a **`SharedFlow`**: no required current value, configurable `replay` (0, 1, or more), and no conflation.",
      },
      {
        t: "p",
        text: "**Choose by whether the thing is *state* or a *stream/events***: use `stateIn` for state the UI observes (screen state, a value over time) — it needs a current value and 'latest wins' is correct. Use `shareIn` for sharing an event stream or a data source where there isn't a single 'current value', or where you want to control replay explicitly — e.g. broadcasting location updates from one shared listener to several consumers with `replay = 1` so new consumers get the last known location. In short: `stateIn` → StateFlow (state), `shareIn` → SharedFlow (streams/events).",
      },
    ],
  },
  {
    level: "junior",
    q: "What is callbackFlow and when do you use it?",
    a: [
      {
        t: "p",
        text: "**The concept**: many Android APIs are *callback-based* — you register a listener and they call you back on events: `LocationManager`, sensors, Firebase's `addSnapshotListener`, `TextWatcher`, connectivity callbacks. `callbackFlow` wraps such an API into a `Flow`, converting the push-callback model into a stream you can collect and use with operators.",
      },
      {
        t: "code",
        title: "The template",
        code: `fun connectivity(cm: ConnectivityManager): Flow<Boolean> = callbackFlow {
    val callback = object : ConnectivityManager.NetworkCallback() {
        override fun onAvailable(n: Network) { trySend(true) }
        override fun onLost(n: Network) { trySend(false) }
    }
    cm.registerDefaultNetworkCallback(callback)
    awaitClose { cm.unregisterNetworkCallback(callback) }   // cleanup — required
}`,
      },
      {
        t: "list",
        items: [
          "**`trySend(value)`** pushes a value into the flow from inside the callback — it's thread-safe (callbacks may fire on any thread) and non-suspending.",
          "**`awaitClose { }` is mandatory**: it keeps the flow open (waiting for events) and runs cleanup — unregistering the listener — when the collector cancels. Forgetting it both leaks the listener and causes a runtime error.",
          "Use it whenever you need to consume a callback API reactively — it lets you apply Flow operators (`debounce`, `map`, `distinctUntilChanged`) to callback events and integrates them with structured concurrency (collection stops → listener unregistered).",
        ],
      },
    ],
  },
  {
    level: "senior",
    q: "Explain SharingStarted.WhileSubscribed(5000). Why 5000, and how does it compare to Eagerly and Lazily?",
    a: [
      {
        t: "p",
        text: "**What it does**: `WhileSubscribed(stopTimeoutMillis)` is a sharing policy for `stateIn`/`shareIn` that starts the upstream when the first collector subscribes and **stops it `stopTimeoutMillis` after the last collector unsubscribes**, restarting it if a collector returns. It ties the expensive upstream's lifetime to whether anyone is actually watching.",
      },
      {
        t: "p",
        text: "**Why 5000ms specifically**: a **configuration change** (rotation) tears down the UI and recreates it, which briefly drops all collectors — for a few hundred milliseconds there are zero subscribers. Without a timeout (i.e. `WhileSubscribed(0)`), the upstream would be *cancelled and cold-restarted* on every rotation: the DB query re-runs, the network re-observes, the user sees a flash of loading state. The 5-second window comfortably outlasts a config change, so the upstream survives rotation seamlessly — but for a *real* backgrounding (the app goes to the background and the lifecycle-aware collector stops for more than 5s), the upstream does stop, freeing resources. 5000ms is the empirical sweet spot between those two.",
      },
      {
        t: "list",
        items: [
          "**`Eagerly`** — upstream starts immediately when `stateIn` is created and runs until the scope (e.g. `viewModelScope`) is cancelled, regardless of collectors. Use for cheap state that's always needed; wasteful for expensive upstreams the UI might not be observing.",
          "**`Lazily`** — starts on the first collector, then runs until scope cancellation (never stops on unsubscribe). Rarely ideal for UI — it doesn't free resources when backgrounded.",
          "**`WhileSubscribed(5000)`** — the recommended default for UI state, because it's the only policy that both survives config changes *and* releases resources on genuine backgrounding. It relies on the UI collecting with lifecycle awareness (`collectAsStateWithLifecycle` / `repeatOnLifecycle(STARTED)`), so that backgrounding actually removes the collector and, after 5s, stops the upstream.",
        ],
      },
      {
        t: "p",
        text: "**The complete picture to convey**: `WhileSubscribed(5000)` + `stateIn(viewModelScope)` + `collectAsStateWithLifecycle` is a coordinated system — the lifecycle-aware collector drops the subscription on background, the 5s timeout ignores the momentary drop of rotation, and the upstream (DB/network/location) runs exactly when the user can see the result and stops shortly after they can't.",
      },
    ],
  },
  {
    level: "senior",
    q: "Why is awaitClose required in callbackFlow, and what happens if you forget it?",
    a: [
      {
        t: "p",
        text: "**Two reasons, both essential.** First, `callbackFlow` (built on a channel) would otherwise **complete immediately** after the builder block returns — but a callback API keeps calling back *after* registration, over time. `awaitClose { }` **suspends the flow open**, keeping it alive to receive future callbacks until the collector cancels. Without it, the flow ends right after registering the listener and you'd receive nothing. Second, `awaitClose`'s block is where you **unregister the listener** — it runs precisely when collection is cancelled (scope death, `take`, the collector leaving).",
      },
      {
        t: "list",
        items: [
          "**What happens if you forget it**: `callbackFlow` actively checks for it and throws `IllegalStateException` ('Flow invariant is violated... awaitClose { } should be used') — so it's not silent, it fails fast. That's the framework forcing you to handle cleanup.",
          "**The bug it prevents**: without unregistering, the listener outlives the flow's collection — a leaked `LocationListener`/`NetworkCallback`/Firebase listener that keeps firing (draining battery, holding references, possibly crashing when it touches a dead component). `awaitClose` guarantees the registration and unregistration are balanced by the collection lifecycle.",
          "**Correct usage detail**: `awaitClose` must be the *last* thing in the builder, and everything before it is the setup; the cleanup lambda should undo exactly the setup (unregister the exact callback you registered).",
        ],
      },
      {
        t: "p",
        text: "**The senior framing**: `callbackFlow` bridges a *manually-managed resource* (a registered listener) into structured concurrency, and `awaitClose` is the seam that makes the resource's lifetime follow the flow's collection lifetime — register on collect, unregister on cancel. It's the flow-world equivalent of `DisposableEffect`'s `onDispose` in Compose: the mandatory cleanup hook that prevents leaks.",
      },
    ],
  },
  {
    level: "senior",
    q: "A cold flow from your repository is being collected by two parts of the UI and causing duplicate network calls. How do you fix it?",
    a: [
      {
        t: "p",
        text: "**The root cause**: cold flows execute their producer *independently per collector*. Two collectors of the same cold repository flow = two separate executions = two network calls (or two DB observations). This is correct cold-flow behavior, not a bug in the flow — the fix is to **share a single upstream execution** among collectors by making it hot.",
      },
      {
        t: "list",
        items: [
          "**Primary fix — `stateIn`/`shareIn`**: in the ViewModel, collect the cold flow once and expose a hot flow. `repository.observeData().stateIn(viewModelScope, WhileSubscribed(5000), initial)` collects the upstream a single time and multicasts to all UI collectors — one network call, shared results. Use `stateIn` if it's state, `shareIn` if it's a stream/events.",
          "**Make sure both collectors observe the SAME hot instance**: the `StateFlow` must be a single property on the ViewModel that both UI pieces read — not two calls that each create a new `stateIn`. A common mistake is calling `.stateIn(...)` in a getter or per-collection, which recreates the sharing each time and defeats it. Store it in a `val`.",
          "**If sharing must span ViewModels/screens** (two screens want the same live data): move the single-source-of-truth *down to the data layer*. Have the repository hold the shared hot flow (e.g. a cache `MutableStateFlow`, or the DB as SSOT that both observe) so any number of ViewModels observing it triggers just one network refresh. This is the more robust architectural fix.",
          "**For request de-duplication specifically**: the repository can also guard with a shared in-flight job/mutex so even concurrent *refresh* calls collapse into one network request.",
        ],
      },
      {
        t: "p",
        text: "**The principle**: cold = per-collector execution; when you want 'observe the same thing in many places, compute once', convert to hot at the appropriate layer — `stateIn`/`shareIn` in the ViewModel for one screen, or a shared hot source / SSOT in the repository for cross-screen sharing. Naming *both* levels (and why storing the `stateIn` result in a `val` matters) is the complete answer.",
      },
    ],
  },
  {
    level: "senior",
    q: "What does flowOn affect, what does it not affect, and can you chain multiple?",
    a: [
      {
        t: "p",
        text: "`flowOn(dispatcher)` changes the context of everything *upstream* of it (the producer and operators above), but *not* downstream (operators below and the collector stay on the collector's context). You can chain multiple `flowOn`s — each governs the segment above it up to the next `flowOn` — letting different stages run on different dispatchers.",
      },
      {
        t: "code",
        title: "Multiple flowOn segments",
        code: `flow { emit(readFile()) }        // runs on IO (nearest flowOn above collector chain)
    .map { parse(it) }           // runs on Default
    .flowOn(Dispatchers.Default) // ^ governs map + producer? No — see below
    .map { toUiModel(it) }       // runs on the collector's context (downstream)
    .flowOn(Dispatchers.IO)      // governs the producer + first map
    .collect { render(it) }      // collector's own context (e.g. Main)`,
      },
      {
        t: "list",
        items: [
          "**Affects upstream** — the producer and operators above the `flowOn`.",
          "**Not downstream** — operators below it and the collector keep the collector's context.",
          "**Chainable** — each `flowOn` controls the segment above it up to the next one.",
          "**Read bottom-up** — the nearest `flowOn` above an operator determines its context.",
        ],
      },
      {
        t: "note",
        text: "flowOn(dispatcher) changes the context of everything UPSTREAM of it (producer + operators above), never downstream (below it and the collector stay on the collector's context). Chain multiple flowOns — each governs the segment above it up to the next. The nearest flowOn above an operator sets its context.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are the SharingStarted strategies (Eagerly, Lazily, WhileSubscribed)?",
    a: [
      {
        t: "p",
        text: "`SharingStarted` controls *when* the shared upstream of `shareIn`/`stateIn` starts and stops. `Eagerly` starts immediately and never stops; `Lazily` starts on the first subscriber and never stops; `WhileSubscribed(stopTimeout)` starts on the first subscriber and stops after the last leaves (plus a timeout). `WhileSubscribed(5000)` is the standard for UI state.",
      },
      {
        t: "table",
        headers: ["Strategy", "Starts", "Stops"],
        rows: [
          ["Eagerly", "immediately", "never (until scope cancelled)"],
          ["Lazily", "first subscriber", "never"],
          ["WhileSubscribed(t)", "first subscriber", "t ms after last leaves"],
        ],
      },
      {
        t: "list",
        items: [
          "**`Eagerly`** — upstream runs even with no collectors; wastes work if unused; for always-needed data.",
          "**`Lazily`** — starts once someone subscribes, then stays on; for data that should keep running after first use.",
          "**`WhileSubscribed(5000)`** — starts/stops with subscribers (+5s to survive config change); the efficient default for UI state.",
          "**`replayExpirationMillis`** — WhileSubscribed can also clear the replay cache after stopping.",
        ],
      },
      {
        t: "note",
        text: "SharingStarted: Eagerly (start now, never stop — always-needed data), Lazily (start on first subscriber, never stop), WhileSubscribed(t) (start on first subscriber, stop t ms after the last leaves — the efficient UI default, 5000ms survives config change). Governs when shareIn/stateIn's upstream runs.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are shareIn's parameters, and how does replay behave?",
    a: [
      {
        t: "p",
        text: "`shareIn(scope, started, replay)` turns a cold flow into a hot `SharedFlow`. `scope` is where the upstream runs; `started` (a `SharingStarted`) controls start/stop; `replay` is how many recent values a *new* subscriber immediately receives. `replay = 0` gives late subscribers nothing (events); `replay = 1` caches the latest (like a StateFlow without the value accessor).",
      },
      {
        t: "code",
        title: "shareIn",
        code: `val shared: SharedFlow<Data> = repository.stream()
    .shareIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        replay = 1,      // new subscribers get the last value
    )`,
      },
      {
        t: "list",
        items: [
          "**`scope`** — where the single shared upstream collection runs.",
          "**`started`** — Eagerly/Lazily/WhileSubscribed(t).",
          "**`replay`** — recent values delivered to new subscribers on subscription.",
          "**Result** — a hot `SharedFlow`; one upstream execution multicast to all collectors.",
        ],
      },
      {
        t: "note",
        text: "shareIn(scope, started, replay) makes a cold flow hot (SharedFlow): scope runs the single upstream, started (Eagerly/Lazily/WhileSubscribed) controls start/stop, replay is how many recent values new subscribers get (0 for events, 1 to cache the latest). One upstream execution multicast to all collectors.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is channelFlow, and how does it differ from callbackFlow?",
    a: [
      {
        t: "p",
        text: "`channelFlow { }` is a flow builder with a `ProducerScope` where you `send`/`trySend` values, and can do so from *multiple coroutines/contexts* concurrently (it's channel-backed). `callbackFlow { }` is a specialized `channelFlow` designed for *callback bridging* — same `send`/`awaitClose`, but semantically intended to wrap a callback API and clean it up in `awaitClose`.",
      },
      {
        t: "code",
        title: "channelFlow and callbackFlow",
        code: `channelFlow {
    launch { send(sourceA()) }        // concurrent producers
    launch { send(sourceB()) }
    awaitClose { }
}
callbackFlow {                         // callback bridge
    val listener = Listener { trySend(it) }
    api.register(listener)
    awaitClose { api.unregister(listener) }   // cleanup
}`,
      },
      {
        t: "list",
        items: [
          "**`channelFlow`** — general; `send` from multiple coroutines/contexts concurrently.",
          "**`callbackFlow`** — same mechanics, intended for callback/listener bridging with `awaitClose` cleanup.",
          "**Both channel-backed** — slightly heavier than `flow { }`; use when you need concurrent emission.",
          "**`awaitClose`** — required to keep the flow open until the source is done and to clean up.",
        ],
      },
      {
        t: "note",
        text: "channelFlow { } gives a ProducerScope to send/trySend from multiple coroutines/contexts (channel-backed). callbackFlow { } is a channelFlow specialized for bridging callback APIs — same send/awaitClose, but semantically for wrapping a listener and unregistering it in awaitClose. Both need awaitClose to stay open and clean up.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the difference between send and trySend, and when does trySend fail?",
    a: [
      {
        t: "p",
        text: "In a `channelFlow`/`callbackFlow`, `send` is a *suspend* function that waits for buffer space (backpressure), while `trySend` is *non-suspending* — it returns a `ChannelResult` indicating success or failure. `trySend` fails when the buffer is full (and overflow is SUSPEND) or the channel is closed. From a *non-suspending callback*, you must use `trySend` (you can't call `send` there).",
      },
      {
        t: "code",
        title: "trySend in a callback",
        code: `callbackFlow {
    val listener = Listener { value ->
        trySend(value)   // non-suspend; may fail if buffer full — often fine to drop or use a buffer
    }
    api.register(listener)
    awaitClose { api.unregister(listener) }
}.buffer(Channel.CONFLATED)   // avoid trySend failures for latest-value sources`,
      },
      {
        t: "list",
        items: [
          "**`send`** — suspend; waits for space; use from a coroutine.",
          "**`trySend`** — non-suspend; returns success/failure; use from a synchronous callback.",
          "**`trySend` fails** — buffer full (SUSPEND overflow) or channel closed.",
          "**Mitigate** — add a buffer or use `Channel.CONFLATED`/DROP overflow so `trySend` succeeds for latest-value sources.",
        ],
      },
      {
        t: "note",
        text: "send is suspend (waits for buffer space); trySend is non-suspending (returns ChannelResult) and fails when the buffer is full (SUSPEND overflow) or the channel is closed. Use trySend from non-suspend callbacks. Add a buffer/CONFLATED/DROP overflow so trySend doesn't fail for latest-value sources.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you bridge a listener/observer API (like location or sensors) to a Flow?",
    a: [
      {
        t: "p",
        text: "Use `callbackFlow { }`: register the listener inside, emit each callback value with `trySend`, and unregister in `awaitClose { }` (which suspends until the flow is cancelled/closed). This turns an imperative callback API into a cold, cancellable Flow that cleans itself up — no leaks.",
      },
      {
        t: "code",
        title: "Location updates as a Flow",
        code: `fun locationUpdates(): Flow<Location> = callbackFlow {
    val callback = object : LocationCallback() {
        override fun onLocation(loc: Location) { trySend(loc) }
    }
    client.requestUpdates(callback)
    awaitClose { client.removeUpdates(callback) }   // cleanup on cancel/close
}.flowOn(Dispatchers.Default)`,
      },
      {
        t: "list",
        items: [
          "**Register inside** — set up the listener in the `callbackFlow` block.",
          "**`trySend`** — emit each callback value (non-suspend, from the callback).",
          "**`awaitClose`** — unregister when the collector cancels; without it, a leak (and the flow never completes).",
          "**Cold + cancellable** — each collector gets its own registration; cancellation cleans up.",
        ],
      },
      {
        t: "note",
        text: "Wrap a listener API in callbackFlow: register inside, emit via trySend from the callback, and unregister in awaitClose { } (suspends until cancelled). This makes an imperative callback into a cold, cancellable, leak-free Flow. Forgetting awaitClose leaks the listener and the flow never completes.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you interop between Flow and LiveData?",
    a: [
      {
        t: "p",
        text: "Convert a `Flow` to `LiveData` with `.asLiveData()` (from lifecycle-livedata-ktx), and a `LiveData` to a `Flow` with `.asFlow()`. This eases incremental migration — a repository can expose `Flow` while a legacy Fragment observes `LiveData`, or vice versa.",
      },
      {
        t: "code",
        title: "Flow ↔ LiveData",
        code: `val liveData: LiveData<UiState> = viewModel.uiStateFlow.asLiveData()     // Flow -> LiveData
val flow: Flow<User> = someLiveData.asFlow()                            // LiveData -> Flow
// asLiveData(context, timeout) lets you set the coroutine context/timeout`,
      },
      {
        t: "list",
        items: [
          "**`Flow.asLiveData()`** — collects the flow and exposes it as lifecycle-aware `LiveData`.",
          "**`LiveData.asFlow()`** — observe a `LiveData` as a `Flow`.",
          "**Migration aid** — bridge old and new observable types during a transition.",
          "**Prefer StateFlow** for new code, but interop keeps mixed codebases working.",
        ],
      },
      {
        t: "note",
        text: "Flow.asLiveData() (Flow → lifecycle-aware LiveData, optional context/timeout) and LiveData.asFlow() (LiveData → Flow) bridge the two — handy for incremental migration in a mixed codebase. Prefer StateFlow for new code, but interop keeps old observers working.",
      },
    ],
  },
  {
    level: "senior",
    q: "What are stateIn's three parameters, and how do you choose them?",
    a: [
      {
        t: "p",
        text: "`stateIn(scope, started, initialValue)`: `scope` runs the single upstream collection (usually `viewModelScope`); `started` (a `SharingStarted`) controls when the upstream is active; `initialValue` is the StateFlow's value before the upstream emits (typically a `Loading` state). Choosing `WhileSubscribed(5000)` for `started` is the standard for efficient, config-change-safe UI state.",
      },
      {
        t: "list",
        items: [
          "**`scope`** — `viewModelScope` so the upstream is cancelled with the ViewModel.",
          "**`started`** — `WhileSubscribed(5000)` (efficient), `Eagerly` (always on), or `Lazily`.",
          "**`initialValue`** — the value before the first upstream emission (e.g. `UiState.Loading`).",
          "**Why an initial value** — StateFlow must always have a current value.",
        ],
      },
      {
        t: "code",
        title: "stateIn",
        code: `repo.observe()
    .map { UiState.Content(it) }
    .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), UiState.Loading)`,
      },
      {
        t: "note",
        text: "stateIn(scope, started, initialValue): scope (viewModelScope — cancels with the VM), started (WhileSubscribed(5000) for efficient config-safe UI state, or Eagerly/Lazily), initialValue (value before the first emission, e.g. Loading — required since StateFlow always has a value).",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you build a repository flow that observes the database and refreshes from the network?",
    a: [
      {
        t: "p",
        text: "Make the *database* the single source of truth: expose the Room `Flow` as the observable stream, and trigger a network refresh separately that *writes into the DB* — the Room flow then re-emits automatically. This is the offline-first pattern: the UI observes the DB, the network updates the DB, and the flow propagates changes.",
      },
      {
        t: "code",
        title: "DB as source of truth",
        code: `fun observeUser(id: String): Flow<User> = flow {
    emitAll(dao.observeUser(id))          // Room Flow — single source of truth
}
suspend fun refreshUser(id: String) {
    val fresh = api.getUser(id)
    dao.upsert(fresh)                     // write to DB -> the flow above re-emits
}
// UI collects observeUser; a refresh() call updates the DB and the UI updates reactively`,
      },
      {
        t: "list",
        items: [
          "**DB is the source of truth** — the UI observes the Room `Flow`.",
          "**Network writes to DB** — refresh fetches and upserts; the flow re-emits.",
          "**Decoupled** — reading (flow) and refreshing (suspend) are separate concerns.",
          "**Offline-first** — cached data shows immediately; network updates flow through.",
        ],
      },
      {
        t: "note",
        text: "Make the DB the single source of truth: expose the Room Flow for reads, and have network refresh write into the DB (upsert) — the Room flow re-emits automatically. UI observes the DB flow; refresh() updates the DB and the UI updates reactively. The offline-first pattern.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you turn a one-shot suspend call into a refreshable StateFlow?",
    a: [
      {
        t: "p",
        text: "Drive it with a *trigger* flow: a `MutableStateFlow` (or `Channel`) whose changes cause a re-fetch via `flatMapLatest`/`mapLatest`, then `stateIn` the result. Emitting a new trigger value (on refresh) restarts the fetch, giving a StateFlow that re-loads on demand.",
      },
      {
        t: "code",
        title: "Trigger-driven refresh",
        code: `private val refreshTrigger = MutableStateFlow(0)
val state: StateFlow<UiState> = refreshTrigger
    .flatMapLatest {
        flow {
            emit(UiState.Loading)
            emit(runCatching { repo.load() }.fold({ UiState.Content(it) }, { UiState.Error }))
        }
    }
    .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), UiState.Loading)

fun refresh() { refreshTrigger.value++ }   // re-runs the fetch`,
      },
      {
        t: "list",
        items: [
          "**Trigger flow** — a `MutableStateFlow`/`Channel` whose changes drive fetches.",
          "**`flatMapLatest`** — each trigger cancels the prior fetch and starts a new one.",
          "**`stateIn`** — expose the result as UI state with an initial value.",
          "**`refresh()`** — bump the trigger to re-load.",
        ],
      },
      {
        t: "note",
        text: "Drive a one-shot suspend call with a trigger flow (MutableStateFlow/Channel): flatMapLatest maps each trigger to a fetch flow (Loading → Content/Error), then stateIn exposes it. refresh() bumps the trigger to re-run (flatMapLatest cancels the prior fetch). A refreshable StateFlow from a suspend function.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you share an expensive upstream (like a WebSocket) across the whole app?",
    a: [
      {
        t: "p",
        text: "Create the flow once (e.g. a `callbackFlow` wrapping the socket) and `shareIn` it in an *application-scoped* `CoroutineScope`, using `SharingStarted.WhileSubscribed` so the socket connects only while something is collecting and disconnects when nothing is. Provide this single shared flow via DI so all consumers share one connection.",
      },
      {
        t: "code",
        title: "App-wide shared socket flow",
        code: `class SocketRepository(appScope: CoroutineScope) {
    val messages: SharedFlow<Message> = socketFlow()   // callbackFlow wrapping the socket
        .shareIn(appScope, SharingStarted.WhileSubscribed(5000), replay = 0)
}`,
      },
      {
        t: "list",
        items: [
          "**Create once, share** — one `shareIn` in an app/singleton scope; inject the shared flow.",
          "**`WhileSubscribed`** — connect only while collected; disconnect when idle (saves battery/data).",
          "**`replay`** — 0 for live messages, or a small cache if late subscribers need recent history.",
          "**Single connection** — all consumers multicast off one socket, not one per screen.",
        ],
      },
      {
        t: "note",
        text: "Wrap the socket in a callbackFlow and shareIn it in an application-scoped CoroutineScope with WhileSubscribed — the socket connects only while collected and disconnects when idle (saves battery/data). Inject the shared flow via DI so all consumers multicast off ONE connection. replay 0 for live messages.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does the replay value in shareIn affect late subscribers?",
    a: [
      {
        t: "p",
        text: "`replay` is the number of most-recent emissions a *new* subscriber receives immediately upon subscribing. `replay = 0` means late subscribers get only *future* emissions (nothing from the past — right for events). `replay = 1` gives them the latest value (right for 'current state' sharing). Larger replay caches more history for late joiners, at a memory cost.",
      },
      {
        t: "list",
        items: [
          "**`replay = 0`** — late subscribers get only future values (events).",
          "**`replay = 1`** — late subscribers get the latest value (state-like).",
          "**`replay = n`** — the last n values are cached and replayed.",
          "**Memory** — larger replay holds more values; keep it minimal.",
        ],
      },
      {
        t: "note",
        text: "replay = how many recent emissions a NEW subscriber gets on subscribing: 0 (only future values — events), 1 (the latest — state-like sharing), n (last n cached, more memory). Choose by whether late joiners need past values, keeping it minimal for memory.",
      },
    ],
  },
  {
    level: "senior",
    q: "When do you use callbackFlow versus suspendCancellableCoroutine?",
    a: [
      {
        t: "p",
        text: "Use `suspendCancellableCoroutine` for a *one-shot* callback (a single result → a suspend function). Use `callbackFlow` for a callback that fires *multiple times* (a stream of values → a Flow). The distinction is single result vs ongoing stream — matching the callback's cardinality.",
      },
      {
        t: "list",
        items: [
          "**`suspendCancellableCoroutine`** — one callback invocation → one suspend result (`resume` once).",
          "**`callbackFlow`** — repeated callbacks → a stream of emissions (`trySend` many times).",
          "**Both support cleanup** — `invokeOnCancellation` vs `awaitClose`.",
          "**Choose by cardinality** — one value (suspend fn) vs many values (Flow).",
        ],
      },
      {
        t: "note",
        text: "suspendCancellableCoroutine for a ONE-shot callback → suspend function (resume once, invokeOnCancellation cleanup). callbackFlow for a callback that fires MANY times → Flow (trySend repeatedly, awaitClose cleanup). Match the callback's cardinality: one result vs ongoing stream.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you inject and switch dispatchers for a flow in a testable way?",
    a: [
      {
        t: "p",
        text: "Inject the dispatcher (a `CoroutineDispatcher` parameter with a `Dispatchers.IO` default) and use it in `flowOn(injectedDispatcher)`, rather than hardcoding `Dispatchers.IO`. Tests can then pass a `TestDispatcher` so the flow runs on the virtual clock deterministically.",
      },
      {
        t: "code",
        title: "Injectable flow dispatcher",
        code: `class Repo(
    private val io: CoroutineDispatcher = Dispatchers.IO,
) {
    fun stream(): Flow<Data> = flow { emitAll(dao.observe()) }.flowOn(io)
}
// Test: Repo(StandardTestDispatcher(testScheduler))`,
      },
      {
        t: "list",
        items: [
          "**Inject the dispatcher** — constructor param with a production default.",
          "**`flowOn(injected)`** — use it instead of a hardcoded `Dispatchers.IO`.",
          "**Test dispatcher** — pass a `TestDispatcher` sharing the `testScheduler`.",
          "**Deterministic** — the flow runs on the virtual clock in tests.",
        ],
      },
      {
        t: "note",
        text: "Inject the dispatcher (constructor param, default Dispatchers.IO) and use flowOn(injected) instead of hardcoding — tests pass a TestDispatcher on the shared testScheduler so the flow runs deterministically on the virtual clock. Same dispatcher-injection principle as suspend functions.",
      },
    ],
  },
  {
    level: "junior",
    q: "Should you put flowOn(IO) in the repository or collect the flow on IO?",
    a: [
      {
        t: "p",
        text: "Put `flowOn(Dispatchers.IO)` in the *repository* (near the producer) so the flow is *main-safe*: the upstream I/O runs on IO regardless of where it's collected, and the UI can collect on Main without wrapping. Collecting on IO from the UI is wrong — the collector (and any UI update) would be off the main thread.",
      },
      {
        t: "list",
        items: [
          "**`flowOn(IO)` in the repository** — the producer's I/O runs on IO; the flow is main-safe.",
          "**Collect on Main** — the UI collects and updates on the main thread.",
          "**Don't collect on IO** — UI updates must be on Main; `flowOn` handles upstream threading.",
          "**Separation** — the data layer owns threading; the UI stays declarative.",
        ],
      },
      {
        t: "note",
        text: "Put flowOn(Dispatchers.IO) in the repository (near the producer) so the flow is main-safe — upstream I/O runs on IO regardless of collection site, and the UI collects on Main without wrapping. Don't collect on IO (UI updates must be on Main). The data layer owns threading.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you implement a cache-then-network (NetworkBoundResource) flow?",
    a: [
      {
        t: "p",
        text: "Emit the cached data first, then fetch from the network, update the cache, and let the cache flow re-emit the fresh data — optionally wrapping emissions in a `Resource`/state type (Loading/Success/Error). The pattern gives instant cached content followed by a refresh, all as one flow.",
      },
      {
        t: "code",
        title: "Cache-then-network as a flow",
        code: `fun user(id: String): Flow<Resource<User>> = flow {
    emit(Resource.Loading)
    val cached = dao.get(id)
    if (cached != null) emit(Resource.Success(cached))   // show cache immediately
    try {
        val fresh = api.getUser(id)
        dao.upsert(fresh)
        emit(Resource.Success(fresh))                     // then fresh
    } catch (e: IOException) {
        emit(Resource.Error(e, cached))                   // error, keep cache
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Emit cache first** — instant content from the DB.",
          "**Fetch + update cache** — network writes to DB; emit fresh data.",
          "**Wrap in `Resource`** — Loading/Success/Error states the UI renders.",
          "**Robust** — on network error, keep showing cached data with an error indicator.",
        ],
      },
      {
        t: "note",
        text: "Cache-then-network: emit Loading, emit cached data immediately (instant content), fetch from network, update the DB, emit fresh data; on error emit Error while keeping the cache. Wrap in a Resource (Loading/Success/Error) type. Instant cached UI + background refresh as one flow (the NetworkBoundResource pattern).",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you create an interval/ticker flow shared across collectors?",
    a: [
      {
        t: "p",
        text: "Build a `flow` that emits on a `delay` loop, then `shareIn` it so all collectors share one timer instead of each starting their own. This is useful for a clock, a countdown, or periodic polling that multiple UI parts observe.",
      },
      {
        t: "code",
        title: "Shared ticker",
        code: `val tick: SharedFlow<Long> = flow {
    while (true) { emit(System.currentTimeMillis()); delay(1000) }
}.shareIn(appScope, SharingStarted.WhileSubscribed(), replay = 1)`,
      },
      {
        t: "list",
        items: [
          "**Interval flow** — `while (true) { emit(...); delay(t) }`.",
          "**`shareIn`** — one shared timer for all collectors (not one per collector).",
          "**`WhileSubscribed`** — the timer runs only while observed.",
          "**`replay = 1`** — new collectors get the latest tick immediately.",
        ],
      },
      {
        t: "note",
        text: "Build an interval flow (while(true){ emit; delay(t) }) and shareIn it so all collectors share ONE timer (not one each). WhileSubscribed runs it only while observed; replay=1 gives new collectors the latest tick. Good for a clock/countdown/polling observed by multiple UI parts.",
      },
    ],
  },
  {
    level: "junior",
    q: "What are common callbackFlow mistakes?",
    a: [
      {
        t: "p",
        text: "The frequent bugs are: forgetting `awaitClose` (the flow completes immediately or leaks the listener because it's never unregistered), using `send` from a non-suspend callback (won't compile — use `trySend`), and ignoring `trySend` failures when the buffer is full. Each breaks the bridge in a subtle way.",
      },
      {
        t: "list",
        items: [
          "**Missing `awaitClose`** — the builder ends right away (flow completes) or the listener leaks; always `awaitClose { unregister }`.",
          "**`send` in a callback** — callbacks are non-suspend; use `trySend`.",
          "**Ignoring `trySend` result** — under a full buffer, emissions silently fail; add a buffer/CONFLATED/DROP policy.",
          "**Heavy work in the callback** — keep it light; do processing downstream with operators.",
        ],
      },
      {
        t: "note",
        text: "callbackFlow pitfalls: forgetting awaitClose (flow ends immediately / listener leaks — always unregister there), using send instead of trySend in a non-suspend callback, and ignoring trySend failures on a full buffer (add buffer/CONFLATED/DROP). Keep callback work light; process downstream.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you share one flow across multiple ViewModels or app-wide?",
    a: [
      {
        t: "p",
        text: "Expose the shared flow from a *singleton* (a repository injected via DI) and `shareIn`/`stateIn` it in an application-scoped `CoroutineScope`, so every ViewModel collecting it observes the same hot upstream. This avoids each ViewModel starting its own cold collection (duplicate work) and keeps a single source of truth.",
      },
      {
        t: "code",
        title: "App-scoped shared flow via DI",
        code: `@Singleton
class SessionRepository @Inject constructor(
    @ApplicationScope private val appScope: CoroutineScope,
) {
    val currentUser: StateFlow<User?> = userSource()
        .stateIn(appScope, SharingStarted.WhileSubscribed(5000), null)
}
// Any ViewModel injects SessionRepository and collects currentUser`,
      },
      {
        t: "list",
        items: [
          "**Singleton repository** — owns and shares the flow via DI.",
          "**App-scoped `shareIn`/`stateIn`** — one hot upstream for all consumers.",
          "**No duplicate work** — ViewModels multicast off the shared flow.",
          "**Single source of truth** — e.g. current user/session across the app.",
        ],
      },
      {
        t: "note",
        text: "Expose the flow from a @Singleton repository and shareIn/stateIn it in an application-scoped CoroutineScope, injected via DI — every ViewModel collects the same hot upstream (no per-VM duplicate cold collection). One source of truth app-wide (e.g. current user/session).",
      },
    ],
  },
  {
    level: "senior",
    q: "How does WhileSubscribed compare to Eagerly for a hot upstream, in practice?",
    a: [
      {
        t: "p",
        text: "`WhileSubscribed(5000)` keeps the upstream active only while there are collectors (plus 5s to survive config changes), so it stops expensive work (network, DB observation) when the UI is gone — saving battery/data. `Eagerly` runs the upstream from creation forever (until the scope dies), so it wastes resources when nobody's watching, but guarantees the latest value is always ready.",
      },
      {
        t: "list",
        items: [
          "**`WhileSubscribed(5000)`** — start/stop with subscribers; efficient; the recommended default for UI state.",
          "**`Eagerly`** — always running; wasteful if unobserved, but data is always fresh/ready.",
          "**Config change** — the 5s timeout bridges rotation without restarting the upstream.",
          "**Choose Eagerly** — only when you truly need the upstream always active (rare for UI).",
        ],
      },
      {
        t: "note",
        text: "WhileSubscribed(5000) runs the upstream only while collected (+5s to survive rotation) — stops expensive work when the UI is gone (battery/data savings), the recommended UI-state default. Eagerly runs forever from creation (wasteful if unobserved, but always ready). Prefer WhileSubscribed for UI.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why can't you just use withContext inside a flow builder to change threads?",
    a: [
      {
        t: "p",
        text: "Flow enforces context preservation: emissions must come from the builder's own context. Wrapping `emit` in `withContext(IO)` emits from a different context and throws `IllegalStateException` ('Flow invariant is violated'). The correct tool is `flowOn(IO)`, which changes the *entire upstream's* context safely without you switching around `emit`.",
      },
      {
        t: "code",
        title: "Use flowOn, not withContext",
        code: `// WRONG
flow { withContext(Dispatchers.IO) { emit(load()) } }   // throws
// RIGHT
flow { emit(load()) }.flowOn(Dispatchers.IO)`,
      },
      {
        t: "list",
        items: [
          "**Context preservation** — `emit` must run in the builder's context.",
          "**`withContext` around `emit`** — violates the invariant, throws.",
          "**`flowOn`** — the sanctioned way to move the upstream's context.",
          "**Multiple contexts** — use `channelFlow` if you must emit from different contexts.",
        ],
      },
      {
        t: "note",
        text: "Flow's context-preservation invariant requires emit to run in the builder's context — withContext(IO) { emit } emits from a different context and throws IllegalStateException. Use flowOn(IO) (moves the whole upstream) instead; use channelFlow if you genuinely must emit from multiple contexts.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you keep a shared flow alive briefly across a configuration change?",
    a: [
      {
        t: "p",
        text: "Use `SharingStarted.WhileSubscribed(stopTimeoutMillis = 5000)`. When the last collector unsubscribes (e.g. the Activity is recreating during rotation), the upstream stays active for the timeout before stopping — so the new Activity re-subscribes within the window and the upstream *isn't* restarted, avoiding a redundant network/DB call on every rotation.",
      },
      {
        t: "list",
        items: [
          "**5s timeout** — spans the brief gap while the UI recreates.",
          "**No restart on rotation** — the upstream keeps running through the gap; the new collector reuses it.",
          "**Avoids refetch** — without it, rotation would restart the upstream (duplicate work).",
          "**Also `replayExpirationMillis`** — controls when the replay cache is cleared after stopping.",
        ],
      },
      {
        t: "note",
        text: "SharingStarted.WhileSubscribed(5000): when the last collector leaves, the upstream stays alive 5s before stopping — spanning the rotation gap so the recreated UI re-subscribes without restarting the upstream (no refetch per rotation). replayExpirationMillis controls replay-cache clearing after stop.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you convert a Flow<T> into a StateFlow for the UI, and what must you provide?",
    a: [
      {
        t: "p",
        text: "Call `.stateIn(scope, started, initialValue)`. You must provide an *initial value* because a `StateFlow` always has a current value (the UI needs something to render before the first emission — typically `Loading`). The scope and `SharingStarted` control the upstream's lifetime and sharing.",
      },
      {
        t: "code",
        title: "Flow to StateFlow",
        code: `val uiState: StateFlow<UiState> = repo.observe()
    .map(::toUiState)
    .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), UiState.Loading)`,
      },
      {
        t: "list",
        items: [
          "**`stateIn`** — collects the cold flow once and exposes a hot `StateFlow`.",
          "**Initial value required** — StateFlow always has a value; use `Loading`/`Empty`.",
          "**Scope + started** — `viewModelScope` + `WhileSubscribed(5000)` for UI state.",
          "**Shares upstream** — all collectors observe one execution.",
        ],
      },
      {
        t: "note",
        text: "Use .stateIn(scope, started, initialValue) — the initial value is required because a StateFlow always has a current value (render Loading before the first emission). viewModelScope + WhileSubscribed(5000) is the UI-state standard; it shares one upstream execution among collectors.",
      },
    ],
  },
];

export default qa;
