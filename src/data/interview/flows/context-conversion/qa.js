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
];

export default qa;
