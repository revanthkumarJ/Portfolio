// Builders & Scopes — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What is the difference between launch and async?",
    a: [
      {
        t: "p",
        text: "**Both start a coroutine, but for different purposes.** `launch` is for *fire-and-forget* work that doesn't return a result — it returns a `Job` (a handle to cancel or join). `async` is for *concurrent work that produces a result* — it returns a `Deferred<T>`, and you get the value by calling `await()`.",
      },
      {
        t: "code",
        title: "The distinction",
        code: `// launch — do something, no result
viewModelScope.launch { repository.sync() }

// async — compute something concurrently, get the result
val a = async { api.getA() }
val b = async { api.getB() }
val combined = a.await() + b.await()   // both ran in parallel`,
      },
      {
        t: "list",
        items: [
          "**Use `launch`** when you just want to perform an action — update state, trigger a save, start a collection. No value comes back.",
          "**Use `async`** when you need a *result* and want *concurrency* — typically several `async` calls started together, then `await`ed, so they run in parallel.",
          "**Don't misuse `async`** for a single call you immediately await — that's just sequential work dressed up; a plain suspend call is clearer. And don't use `async` for fire-and-forget, because its exception is held until you `await` (so it can go unnoticed).",
        ],
      },
    ],
  },
  {
    level: "junior",
    q: "What is runBlocking and when should (and shouldn't) you use it?",
    a: [
      {
        t: "p",
        text: "**The concept**: `runBlocking` is a bridge between the blocking world and the coroutine world. It starts a coroutine and **blocks the current thread** until that coroutine (and its children) complete, returning the result. It's the opposite of normal coroutine behavior — it deliberately blocks a thread — which is exactly why its use is narrow.",
      },
      {
        t: "list",
        items: [
          "**Use it for**: a `main()` function (to call suspend code from a plain entry point), unit tests that need to run suspend code (though `runTest` is preferred for its virtual time), and bridging suspend code into a genuinely blocking API you can't change.",
          "**Never use it on the Android main thread** — it blocks the UI thread until the coroutine finishes, freezing the app and risking an ANR. This is a serious bug, not a style issue.",
          "**Never use it to 'call a suspend function from normal code' in app logic** — that defeats the point of coroutines (you've reintroduced blocking). Instead, launch a coroutine in a proper scope (`viewModelScope.launch`).",
        ],
      },
      {
        t: "p",
        text: "The mental model: `launch`/`async` are *non-blocking* (the caller keeps going), while `runBlocking` is *blocking* (the caller's thread waits). In app code you almost always want the non-blocking builders in a lifecycle scope; `runBlocking` is a tool for tests and top-level entry points.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a CoroutineScope and why does it matter?",
    a: [
      {
        t: "p",
        text: "**The concept**: a `CoroutineScope` defines the *lifetime* of the coroutines started within it. Every coroutine belongs to a scope, and the builders (`launch`, `async`) are extension functions on `CoroutineScope`. The scope's crucial property: **when it's cancelled, all coroutines started in it are cancelled too.** That's how you avoid leaking coroutines that keep running after the thing that started them is gone.",
      },
      {
        t: "p",
        text: "**Why it matters on Android**: consider a network call launched from a screen. If the user leaves the screen, that call should stop — otherwise it wastes resources and might try to update a destroyed UI (crash). By launching in a scope tied to the screen's lifecycle (`viewModelScope`, `lifecycleScope`), cancellation is automatic: the scope is cancelled when the ViewModel is cleared or the screen destroyed, and every coroutine in it stops. The rule that follows: never use `GlobalScope`, which has *no* lifetime bound to anything — its coroutines live until the process dies and are the classic leak. Always launch in a scope that matches how long the work should live.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is viewModelScope and when is it cancelled?",
    a: [
      {
        t: "p",
        text: "**The concept**: `viewModelScope` is a `CoroutineScope` provided by the `androidx.lifecycle` library on every `ViewModel`. Coroutines launched in it are automatically **cancelled when the ViewModel is cleared** — i.e. in `onCleared()`, which happens when the ViewModel's owner (screen) is permanently gone (not on rotation — the ViewModel survives that).",
      },
      {
        t: "code",
        title: "The standard usage",
        code: `class FeedViewModel : ViewModel() {
    fun load() {
        viewModelScope.launch {          // auto-cancelled in onCleared()
            _state.value = repository.getFeed()
        }
    }
}`,
      },
      {
        t: "p",
        text: "It's built with `Dispatchers.Main.immediate` (so it starts on the main thread without an extra dispatch) and a `SupervisorJob` (so one failed child coroutine doesn't cancel its siblings). The benefit is you never manually manage cancellation for ViewModel work — leave the screen, and all in-flight loads stop. The only caveat: work that must *outlive* the screen (an upload that should finish after the user navigates away) should *not* go in `viewModelScope` — it belongs in an application-scoped scope or WorkManager, because `viewModelScope` is meant to die with the screen.",
      },
    ],
  },
  {
    level: "senior",
    q: "Explain coroutineScope vs supervisorScope. When would you use each?",
    a: [
      {
        t: "p",
        text: "**Both are suspend functions that create a new child scope, run a block, and suspend until all child coroutines complete — the difference is how they handle a child's failure.** `coroutineScope` uses a regular `Job`, so failure propagates: if any child throws, *all* other children are cancelled and the exception is rethrown from the scope. `supervisorScope` uses a `SupervisorJob`, so children fail *independently*: one child throwing does **not** cancel its siblings.",
      },
      {
        t: "list",
        items: [
          "**Use `coroutineScope` for all-or-nothing work** — when the results are interdependent and a partial result is useless. Loading a screen that needs *both* the user profile *and* the settings: if either fails, the whole load fails, and you don't want the other call wastefully continuing. This is the common case.",
          "**Use `supervisorScope` for independent work** — when children don't depend on each other and one failing shouldn't abort the others. A dashboard loading several independent widgets (weather, news, stocks): if the news call fails, you still want weather and stocks to load and show, with just the news widget showing an error.",
        ],
      },
      {
        t: "code",
        title: "The behavioral difference",
        code: `// coroutineScope: b failing cancels a, whole thing throws
coroutineScope {
    val a = async { fetchA() }
    val b = async { fetchB() }   // if this throws, a is cancelled too
    combine(a.await(), b.await())
}

// supervisorScope: widgets fail independently
supervisorScope {
    launch { loadWeather() }     // failure here doesn't stop the others
    launch { loadNews() }
    launch { loadStocks() }
}`,
      },
      {
        t: "p",
        text: "**A subtlety worth naming**: in `supervisorScope`, because failures don't propagate to the parent automatically, each child must handle its *own* exceptions (try/catch or a `CoroutineExceptionHandler` on the launch) — otherwise the exception is unhandled. In `coroutineScope`, the exception naturally surfaces at the scope's call site where you can catch it. So `supervisorScope` gives independence at the cost of you owning each child's error handling.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does exception handling differ between launch and async?",
    a: [
      {
        t: "p",
        text: "**The core difference is *when* and *where* the exception surfaces.** In `launch`, an uncaught exception **propagates immediately** to the coroutine's parent/scope as soon as it's thrown — it travels up the Job hierarchy and, if unhandled, reaches a `CoroutineExceptionHandler` or crashes. In `async`, the exception is **captured inside the `Deferred`** and only *thrown when you call `await()`** — the throwing is deferred to the point of consumption.",
      },
      {
        t: "list",
        items: [
          "**`launch` — exception is 'pushed'**: it fires up to the parent right away. You handle it with a try/catch *inside* the coroutine, or a `CoroutineExceptionHandler` installed in the context (which only works for `launch`, not `async`).",
          "**`async` — exception is 'pulled'**: `await()` re-throws it. So `try { deferred.await() } catch (e) { }` is the natural handling. If you *never* await a standalone async, the exception can sit unnoticed in the Deferred.",
          "**The structured-concurrency twist**: when `async` is a *child* of a scope (the normal case, e.g. inside `coroutineScope`), a failure *also* propagates to the parent scope and cancels siblings — the same as launch — *in addition to* being rethrown at `await()`. The 'exception waits for await()' behavior in isolation is most visible for a top-level `async` on a scope. So the precise statement is: async holds the exception for its `await()`, but as a child it still participates in structured cancellation.",
          "**`CoroutineExceptionHandler` caveat**: it catches uncaught exceptions from `launch` (root coroutines) only. It does nothing for `async` (whose exceptions are meant to be surfaced via `await`) and nothing for child coroutines (whose exceptions propagate to the parent). Knowing where the handler does and doesn't apply is a common senior discriminator.",
        ],
      },
      {
        t: "p",
        text: "**Practical guidance**: for fire-and-forget, use `launch` and handle errors with try/catch inside or a `CoroutineExceptionHandler` at the scope. For concurrent results, use `async` and wrap the `await()` in try/catch. Mixing them up — e.g. expecting a `CoroutineExceptionHandler` to catch an `async` failure — is a frequent bug.",
      },
    ],
  },
  {
    level: "senior",
    q: "Why is GlobalScope considered an anti-pattern, and what should you use instead?",
    a: [
      {
        t: "p",
        text: "**The problem**: `GlobalScope` is a scope whose lifetime is the *entire application process* — coroutines launched in it are bound to nothing and are cancelled only when the process dies. This breaks structured concurrency in every way that matters:",
      },
      {
        t: "list",
        items: [
          "**Leaks**: a `GlobalScope.launch` started from a screen keeps running after the screen is gone — wasting CPU/network/battery, and potentially trying to update a destroyed UI (crash or leak of the destroyed component it captured).",
          "**No automatic cancellation**: nothing cancels it when the relevant lifecycle ends, so you must remember to cancel manually (and usually don't).",
          "**Untestable**: tests can't control or wait for GlobalScope coroutines the way they control a provided scope; work escapes the test's timing.",
          "**Orphaned failures**: exceptions in GlobalScope coroutines don't propagate to any meaningful parent.",
        ],
      },
      {
        t: "list",
        items: [
          "**Instead, use a lifecycle-bound scope**: `viewModelScope` for ViewModel work, `lifecycleScope`/`viewLifecycleOwner.lifecycleScope` for UI work, `rememberCoroutineScope()` in Compose. These cancel automatically when their owner is gone.",
          "**For work that legitimately must outlive a screen** (an upload that should complete after the user navigates away, app-wide sync): inject an **application-scoped `CoroutineScope`** (created once, e.g. `CoroutineScope(SupervisorJob() + Dispatchers.Default)` provided by DI and tied to the Application) into the repository — it's still a *managed, injectable, testable* scope, unlike GlobalScope. For work that must survive process death, use **WorkManager**.",
        ],
      },
      {
        t: "p",
        text: "**The principle**: every coroutine should have an owner whose lifecycle bounds it. `GlobalScope` deliberately has no owner, so it's almost never correct. The rare legitimate 'outlive the caller' need is met by an *injected application scope* (managed, testable) — not by GlobalScope. Kotlin even requires an opt-in annotation to use GlobalScope now, signaling it's a code smell.",
      },
    ],
  },
  {
    level: "junior",
    q: "What does launch return, and what can you do with the Job?",
    a: [
      {
        t: "p",
        text: "`launch` returns a `Job` — a handle to the coroutine it started. Through it you can cancel the coroutine, wait for it (`join`), check its state, register completion callbacks, and access its place in the parent-child hierarchy. The `Job` is how you *control* a running coroutine after starting it.",
      },
      {
        t: "code",
        title: "Using the returned Job",
        code: `val job = scope.launch { longWork() }
job.cancel()                       // stop it
job.join()                         // suspend until it finishes
job.isActive / job.isCancelled     // inspect state
job.invokeOnCompletion { cause -> cleanup(cause) }   // run on completion/cancel
val current = scope.launch { … }   // keep the handle to cancel later (e.g. a search)`,
      },
      {
        t: "list",
        items: [
          "**`cancel()` / `cancelAndJoin()`** — stop the coroutine (cooperatively).",
          "**`join()`** — suspend until it completes.",
          "**`isActive`/`isCancelled`/`isCompleted`** — inspect state.",
          "**`invokeOnCompletion { }`** — a callback when it finishes or is cancelled (with the cause).",
          "**Keep the handle** — store the `Job` to cancel a previous operation before starting a new one (cancel-previous pattern).",
        ],
      },
      {
        t: "note",
        text: "launch returns a Job — the control handle: cancel()/cancelAndJoin() to stop, join() to wait, isActive/isCancelled to inspect, invokeOnCompletion{} for a finish callback. Keep the Job to implement cancel-previous (cancel the old search before launching a new one).",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you run several async operations concurrently and combine their results?",
    a: [
      {
        t: "p",
        text: "Start each independent operation with `async` (they begin immediately and run concurrently), then `await` them — or use `awaitAll` for a list. The total time is roughly the *longest* operation rather than the sum, because they overlap. Wrap them in a `coroutineScope` so a failure in one cancels the others.",
      },
      {
        t: "code",
        title: "Concurrent fan-out with awaitAll",
        code: `suspend fun loadDashboard(): Dashboard = coroutineScope {
    val user = async { api.getUser() }
    val feed = async { api.getFeed() }
    val ads  = async { api.getAds() }
    Dashboard(user.await(), feed.await(), ads.await())   // ~ max of the three
}
// For a dynamic list:
val results = ids.map { async { fetch(it) } }.awaitAll()`,
      },
      {
        t: "list",
        items: [
          "**Start all `async` first, then await** — awaiting each right after starting serializes them.",
          "**`awaitAll(list)`** — await a collection of `Deferred`s; throws if any fails.",
          "**`coroutineScope`** — structured: if one child fails, the others are cancelled and the exception propagates.",
          "**Time = max, not sum** — the win of concurrency for independent I/O.",
        ],
      },
      {
        t: "note",
        text: "Start each independent call with async (they run concurrently), then await/awaitAll — total time ≈ the longest, not the sum. Wrap in coroutineScope so one failure cancels the rest and propagates. Pitfall: awaiting each async immediately after starting it serializes the work.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you create a custom CoroutineScope, and what should its context contain?",
    a: [
      {
        t: "p",
        text: "Create one with the `CoroutineScope(context)` factory, giving it a `Job` (or `SupervisorJob`) plus a dispatcher. The `Job` makes it cancellable as a unit; the dispatcher sets the default thread. You must *cancel* the scope when its owner is destroyed, or its coroutines leak — this is exactly what `viewModelScope` does for you.",
      },
      {
        t: "code",
        title: "A managed custom scope",
        code: `class SyncManager {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    fun start() { scope.launch { sync() } }
    fun close() { scope.cancel() }   // MUST cancel to avoid leaks
}`,
      },
      {
        t: "list",
        items: [
          "**Include a `Job`/`SupervisorJob`** — enables cancellation; `SupervisorJob` keeps children independent (one failure doesn't cancel siblings).",
          "**Include a dispatcher** — the default thread for coroutines in the scope (`Main`, `IO`, `Default`).",
          "**Optionally a `CoroutineExceptionHandler`** — to handle uncaught exceptions from `launch`.",
          "**Cancel it** — in the owner's teardown (`close()`/`onCleared()`); forgetting this leaks running coroutines.",
        ],
      },
      {
        t: "note",
        text: "CoroutineScope(SupervisorJob() + Dispatchers.X [+ handler]) — the Job makes it cancellable (SupervisorJob keeps children independent), the dispatcher sets the default thread. You MUST scope.cancel() in the owner's teardown or coroutines leak. This is what viewModelScope/lifecycleScope automate.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is lifecycleScope, and how does it differ from viewModelScope?",
    a: [
      {
        t: "p",
        text: "`lifecycleScope` is a scope tied to an `Activity`/`Fragment`'s `Lifecycle` — its coroutines are cancelled when that lifecycle is destroyed. `viewModelScope` is tied to a `ViewModel` and cancelled in `onCleared()`. The key difference is lifetime: a ViewModel survives configuration changes (rotation), while a Fragment's lifecycle does not.",
      },
      {
        t: "table",
        headers: ["", "viewModelScope", "lifecycleScope"],
        rows: [
          ["Owner", "ViewModel", "Activity/Fragment"],
          ["Cancelled on", "onCleared()", "lifecycle DESTROYED"],
          ["Survives rotation", "yes", "no (recreated)"],
          ["Use for", "data/business work", "UI-lifecycle work (collecting to update views)"],
          ["Default dispatcher", "Main.immediate", "Main.immediate"],
        ],
      },
      {
        t: "list",
        items: [
          "**`viewModelScope`** — for work that should survive config change (loading data); cancelled when the ViewModel is truly gone.",
          "**`lifecycleScope`** — for UI-tied work; cancelled and restarted with the Activity/Fragment.",
          "**Both default to `Dispatchers.Main.immediate`** — so UI updates are safe without switching.",
          "**Prefer collecting flows in the VM** and exposing state; use `lifecycleScope` + `repeatOnLifecycle` when collecting directly in the UI.",
        ],
      },
      {
        t: "note",
        text: "lifecycleScope (Activity/Fragment, cancelled on DESTROY, doesn't survive rotation) vs viewModelScope (ViewModel, cancelled in onCleared, survives config change). Both default to Main.immediate. Put data work in viewModelScope; use lifecycleScope + repeatOnLifecycle for UI-side flow collection.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is repeatOnLifecycle, and why is it preferred over launchWhenStarted?",
    a: [
      {
        t: "p",
        text: "`repeatOnLifecycle(state)` runs a block whenever the lifecycle reaches `state` (e.g. STARTED) and *cancels* it when the lifecycle drops below that state — then restarts it on the next STARTED. This fully stops upstream work (like flow collection) when the UI is backgrounded. The older `launchWhenStarted`/`launchWhenX` only *paused* the coroutine, leaving upstream producers active (wasting resources).",
      },
      {
        t: "code",
        title: "Lifecycle-aware collection",
        code: `lifecycleScope.launch {
    repeatOnLifecycle(Lifecycle.State.STARTED) {
        viewModel.uiState.collect { render(it) }   // collection cancelled when STOPPED, restarted on START
    }
}`,
      },
      {
        t: "list",
        items: [
          "**`repeatOnLifecycle(STARTED)`** — cancels the block on STOP, restarts on START; upstream (flow) collection genuinely stops when backgrounded.",
          "**`launchWhenStarted` (deprecated)** — only suspends the coroutine; the flow keeps collecting/buffering upstream, wasting work and risking stale updates.",
          "**Pairs with `stateIn(WhileSubscribed)`** — the producer stops when there are no collectors.",
          "**Or use `collectAsStateWithLifecycle`** in Compose, which encapsulates this.",
        ],
      },
      {
        t: "note",
        text: "repeatOnLifecycle(STARTED) cancels its block when the UI stops and restarts it on start — so flow collection truly halts when backgrounded. The deprecated launchWhenStarted only paused the coroutine, leaving upstream producers running (wasteful/stale). Pair with stateIn(WhileSubscribed); in Compose use collectAsStateWithLifecycle.",
      },
    ],
  },
  {
    level: "senior",
    q: "When and how do you cancel a scope, and what leaks if you don't?",
    a: [
      {
        t: "p",
        text: "You cancel a scope in its owner's teardown so all its coroutines stop. `viewModelScope`/`lifecycleScope` do this automatically; a *custom* scope you must cancel yourself (`scope.cancel()`). If you don't, coroutines keep running after the screen/object is gone — leaking memory (they hold references to the owner), wasting CPU/network, and possibly updating dead UI.",
      },
      {
        t: "list",
        items: [
          "**Managed scopes auto-cancel** — `viewModelScope` in `onCleared`, `lifecycleScope` on DESTROY.",
          "**Custom scopes: cancel manually** — in `close()`/`onCleared()`/a lifecycle observer; call `scope.cancel()`.",
          "**Leak symptoms** — the Activity/ViewModel isn't garbage-collected (retained), background work continues, log lines after the screen is gone.",
          "**`cancel()` vs `coroutineContext.cancelChildren()`** — `cancel()` also makes the scope unusable (its Job is cancelled); use it for permanent teardown.",
        ],
      },
      {
        t: "code",
        title: "Cancel on teardown",
        code: `override fun onCleared() { super.onCleared(); customScope.cancel() }`,
      },
      {
        t: "note",
        text: "Cancel a scope in its owner's teardown; viewModelScope/lifecycleScope do it automatically, custom scopes need scope.cancel() (in close/onCleared/observer). Forgetting it leaks: retained owner, running background work, updates to dead UI. cancel() also makes the scope unusable — right for permanent teardown.",
      },
    ],
  },
  {
    level: "junior",
    q: "What's the difference between the coroutineScope{} builder and a CoroutineScope instance?",
    a: [
      {
        t: "p",
        text: "The names are confusingly similar. `coroutineScope { }` (lowercase, a suspend *function*) is a builder that creates a scope for its block, waits for all children, and returns when they finish — used *inside* a suspend function to run concurrent children structurally. `CoroutineScope` (the interface/factory) is a long-lived *object* you launch coroutines on, tied to a lifecycle.",
      },
      {
        t: "list",
        items: [
          "**`coroutineScope { }`** — a suspend function; scopes concurrent work within a larger operation; suspends until all children complete; if a child fails, it cancels siblings and rethrows.",
          "**`CoroutineScope(...)` / a scope object** — a durable entity (like `viewModelScope`) you call `launch`/`async` on; lives until cancelled.",
          "**`supervisorScope { }`** — like `coroutineScope` but child failures are isolated.",
          "**Rule of thumb** — use `coroutineScope { }` to structure a suspend function's internal concurrency; use a `CoroutineScope` object to own fire-and-forget work bound to a lifecycle.",
        ],
      },
      {
        t: "code",
        title: "Two different things",
        code: `// Builder: structure concurrency inside a suspend fun, wait for children
suspend fun load() = coroutineScope { val a = async{}; val b = async{}; a.await() + b.await() }

// Object: long-lived, launch onto it
val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
scope.launch { … }`,
      },
      {
        t: "note",
        text: "coroutineScope { } (suspend function) scopes concurrent children inside a suspend fun and waits for them (child failure cancels siblings + rethrows). CoroutineScope (object/factory) is a long-lived, lifecycle-bound entity you launch onto. Builder = internal structured concurrency; object = owned fire-and-forget work.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you load several independent screen sections where one failing shouldn't kill the others?",
    a: [
      {
        t: "p",
        text: "Use `supervisorScope { }` (or a scope with a `SupervisorJob`) so each child's failure is *isolated* — one section failing doesn't cancel its siblings. Inside, launch each section and handle its failure individually (try/catch around each, or per-`async` await with catch), so the screen shows the sections that succeeded and an error state only for the one that failed.",
      },
      {
        t: "code",
        title: "Independent sections with supervisorScope",
        code: `suspend fun loadScreen(): ScreenState = supervisorScope {
    val header = async { runCatching { api.header() } }
    val feed   = async { runCatching { api.feed() } }
    val promos = async { runCatching { api.promos() } }
    ScreenState(
        header = header.await().getOrNull(),   // one failing section = null, others still load
        feed   = feed.await().getOrDefault(emptyList()),
        promos = promos.await().getOrNull(),
    )
}`,
      },
      {
        t: "list",
        items: [
          "**`supervisorScope`** — child failures don't propagate to siblings (unlike `coroutineScope`, where one failure cancels all).",
          "**Handle each failure** — `runCatching`/try-catch per section so a failure becomes a local error state, not a thrown exception.",
          "**`coroutineScope` would be wrong here** — one section's exception would cancel the whole load.",
          "**UX** — partial content is better than an all-or-nothing screen for independent widgets.",
        ],
      },
      {
        t: "note",
        text: "Use supervisorScope so each section's failure is isolated (siblings keep loading), and wrap each in runCatching so a failure becomes a local error/empty state rather than throwing. coroutineScope would cancel everything on one failure. Result: partial content instead of an all-or-nothing screen.",
      },
    ],
  },
  {
    level: "junior",
    q: "What do the CoroutineScope() and MainScope() factory functions give you?",
    a: [
      {
        t: "p",
        text: "`CoroutineScope(context)` builds a scope from whatever context you pass (Job + dispatcher + extras). `MainScope()` is a convenience that returns a scope with a `SupervisorJob` and `Dispatchers.Main` — handy for UI-owning classes that manage their own coroutines. Both require you to cancel them when done.",
      },
      {
        t: "code",
        title: "Factory scopes",
        code: `val scope = CoroutineScope(Job() + Dispatchers.Default)   // fully custom
val ui = MainScope()   // == CoroutineScope(SupervisorJob() + Dispatchers.Main)
// remember to cancel:
ui.cancel()`,
      },
      {
        t: "list",
        items: [
          "**`CoroutineScope(context)`** — the general factory; you choose the Job type and dispatcher.",
          "**`MainScope()`** — preset `SupervisorJob() + Dispatchers.Main`; good default for a UI controller not covered by `lifecycleScope`.",
          "**Always cancel** — neither is lifecycle-aware on its own; tie cancellation to the owner's teardown.",
          "**Prefer built-ins when available** — `viewModelScope`/`lifecycleScope` handle cancellation for you; use factories only for custom-lifecycle owners.",
        ],
      },
      {
        t: "note",
        text: "CoroutineScope(context) builds a scope from a context you choose; MainScope() presets SupervisorJob() + Dispatchers.Main for UI owners. Both need manual cancellation tied to the owner's teardown. Prefer viewModelScope/lifecycleScope when they fit; use factories only for custom-lifecycle classes.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you tie a coroutine scope to a custom-lifecycle class and clean it up?",
    a: [
      {
        t: "p",
        text: "Create a scope the class owns, launch work on it, and cancel it in the class's teardown hook. If the class has an Android lifecycle, observe it; otherwise expose an explicit `close()`/`release()`. The pattern mirrors `viewModelScope`: own the scope, cancel it exactly once when the owner dies.",
      },
      {
        t: "code",
        title: "Scope owned by a manager",
        code: `class UploadManager : Closeable {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    fun enqueue(file: File) = scope.launch { upload(file) }
    override fun close() { scope.cancel() }   // called by the owner when done
}
// Lifecycle-bound variant:
class Widget(lifecycle: Lifecycle) {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    init { lifecycle.addObserver(LifecycleEventObserver { _, e ->
        if (e == Lifecycle.Event.ON_DESTROY) scope.cancel() }) }
}`,
      },
      {
        t: "list",
        items: [
          "**Own the scope** — a private field with `SupervisorJob` + the right dispatcher.",
          "**Cancel once, in teardown** — `close()`/`release()`, or an `ON_DESTROY` lifecycle observer.",
          "**Expose intent, not the scope** — methods like `enqueue()`; don't leak the raw scope.",
          "**Idempotent cleanup** — cancelling an already-cancelled scope is safe.",
        ],
      },
      {
        t: "note",
        text: "Give the class a private CoroutineScope(SupervisorJob() + dispatcher), launch work on it, and cancel it once in teardown (close()/release() or an ON_DESTROY observer). Expose methods, not the raw scope. It's the viewModelScope pattern for any custom-lifecycle owner; cancelling twice is harmless.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you launch a coroutine on a specific dispatcher?",
    a: [
      {
        t: "p",
        text: "Pass the dispatcher as the `context` argument to the builder: `launch(Dispatchers.IO) { }` or `async(Dispatchers.Default) { }`. The coroutine then starts on that dispatcher instead of inheriting the scope's default. You can also switch mid-coroutine with `withContext(dispatcher)`.",
      },
      {
        t: "code",
        title: "Builder with a dispatcher",
        code: `viewModelScope.launch(Dispatchers.IO) { writeToDisk() }    // starts on IO
viewModelScope.launch {                                     // starts on Main (default)
    val data = withContext(Dispatchers.Default) { compute() }  // switch for CPU work
    render(data)                                            // back on Main
}`,
      },
      {
        t: "list",
        items: [
          "**Builder context arg** — `launch(dispatcher)`/`async(dispatcher)` sets the starting dispatcher.",
          "**Prefer main-safe functions** — often better to keep `withContext` inside the repository than to launch on `IO` in the ViewModel.",
          "**Combine context elements** — `launch(Dispatchers.IO + CoroutineName(\"sync\"))`.",
          "**`withContext`** — switch dispatchers within a coroutine for a sub-block, returning to the previous one after.",
        ],
      },
      {
        t: "note",
        text: "Pass the dispatcher to the builder: launch(Dispatchers.IO){} / async(Dispatchers.Default){}; combine elements with + (Dispatchers.IO + CoroutineName). Or switch mid-coroutine with withContext(dispatcher). Prefer pushing withContext into main-safe repository functions over launching on IO in the ViewModel.",
      },
    ],
  },
  {
    level: "senior",
    q: "What's the difference between runBlocking in tests and runTest?",
    a: [
      {
        t: "p",
        text: "`runBlocking` actually blocks the thread and runs coroutines in *real time* (a `delay(1000)` waits a real second). `runTest` (from kotlinx-coroutines-test) uses a *virtual clock* that auto-advances, so delays are skipped and tests run instantly, while still giving deterministic control over scheduling. For testing coroutine code, prefer `runTest`.",
      },
      {
        t: "code",
        title: "runTest skips delays",
        code: `@Test fun example() = runTest {
    val vm = MyViewModel(repo, StandardTestDispatcher(testScheduler))
    vm.load()
    advanceUntilIdle()          // run all scheduled coroutines
    assertEquals(Content, vm.state.value)
}
// delay(10_000) inside completes instantly under the virtual clock`,
      },
      {
        t: "list",
        items: [
          "**`runBlocking`** — real time, blocks the thread; fine for `main()` or simple bridging, but slow for tests with delays.",
          "**`runTest`** — virtual time; `delay` is skipped, `advanceTimeBy`/`advanceUntilIdle` control scheduling; fast and deterministic.",
          "**Inject test dispatchers** — `StandardTestDispatcher`/`UnconfinedTestDispatcher` sharing the `testScheduler` so production coroutines use the virtual clock.",
          "**`Dispatchers.setMain`** — replace `Dispatchers.Main` with a test dispatcher for ViewModel tests.",
        ],
      },
      {
        t: "note",
        text: "runBlocking runs in real time and blocks the thread (a delay waits for real); runTest uses a virtual clock that skips delays and gives deterministic scheduling (advanceUntilIdle/advanceTimeBy). Use runTest for coroutine tests, inject Test dispatchers on the shared testScheduler, and Dispatchers.setMain for ViewModel tests.",
      },
    ],
  },
  {
    level: "senior",
    q: "Why doesn't launch throw its exception at the call site, and what are the implications?",
    a: [
      {
        t: "p",
        text: "`launch` is fire-and-forget: it returns a `Job` immediately and the coroutine runs independently, so an exception thrown *inside* it can't surface at the `launch` call site (that code has already moved on). Instead the exception propagates through the coroutine's parent `Job` — cancelling the parent and siblings, and reaching a `CoroutineExceptionHandler` if present.",
      },
      {
        t: "list",
        items: [
          "**Fire-and-forget** — `launch` returns before the body runs, so a `try/catch` *around* `launch` catches nothing.",
          "**Propagates via the job tree** — an uncaught exception cancels the parent scope (unless a `SupervisorJob` isolates it).",
          "**Handle inside** — put `try/catch` *inside* the `launch` block, or install a `CoroutineExceptionHandler` on the scope.",
          "**`async` differs** — it stores the exception and rethrows it at `await()`.",
        ],
      },
      {
        t: "code",
        title: "Catch inside, not around",
        code: `// WRONG: catches nothing
try { scope.launch { risky() } } catch (e: Exception) { }
// RIGHT: catch inside the coroutine
scope.launch { try { risky() } catch (e: Exception) { handle(e) } }`,
      },
      {
        t: "note",
        text: "launch returns immediately (fire-and-forget), so an exception in its body can't reach a try/catch around launch — it propagates through the parent Job (cancelling the scope unless SupervisorJob) and to a CoroutineExceptionHandler. Handle it INSIDE the launch block or via a handler. async instead defers the exception to await().",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you decide between launch and async?",
    a: [
      {
        t: "p",
        text: "Use `launch` when you *don't need a result* — fire-and-forget work like saving to a database, sending analytics, or updating state as a side effect. Use `async` when you *need a value back* and especially when you want *concurrency* — several independent computations you'll combine. Choosing `async` for fire-and-forget just to ignore the `Deferred` is a smell (and can swallow exceptions).",
      },
      {
        t: "table",
        headers: ["Need", "Use"],
        rows: [
          ["Side effect, no result", "`launch`"],
          ["A single result", "just call the suspend fun (sequential)"],
          ["Multiple results concurrently", "`async` + `await`/`awaitAll`"],
          ["Independent work you'll combine", "`async`"],
        ],
      },
      {
        t: "list",
        items: [
          "**`launch`** — no return value; returns a `Job`. Most ViewModel operations are `launch`.",
          "**`async`** — returns `Deferred<T>`; for concurrent results.",
          "**Don't `async` a single thing you immediately `await`** — that's just a sequential suspend call with extra steps.",
          "**Beware lost exceptions** — an `async` whose `Deferred` you never `await` can swallow its exception.",
        ],
      },
      {
        t: "note",
        text: "launch = fire-and-forget side effects (returns Job) — most ViewModel work. async = concurrent results you'll await/awaitAll. For a single result, just call the suspend function sequentially. Don't async-then-immediately-await (pointless), and don't leave an async's Deferred un-awaited (its exception can be swallowed).",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you name coroutines and improve debuggability?",
    a: [
      {
        t: "p",
        text: "Add a `CoroutineName(\"...\")` to the context so the coroutine has a readable name in stack traces and logs, and enable coroutine debug mode (`-Dkotlinx.coroutines.debug` or `DEBUG_PROPERTY_NAME`) which appends coroutine ids/names to thread names and improves stack traces with the async call chain.",
      },
      {
        t: "code",
        title: "Named coroutine + debug",
        code: `scope.launch(CoroutineName("sync-worker") + Dispatchers.IO) { sync() }
// Enable debug (adds coroutine name/id to thread names, better stacktraces):
// JVM flag: -Dkotlinx.coroutines.debug
// or System.setProperty(DEBUG_PROPERTY_NAME, DEBUG_PROPERTY_VALUE_ON)`,
      },
      {
        t: "list",
        items: [
          "**`CoroutineName`** — a context element giving the coroutine a label in logs/traces.",
          "**Debug mode** — adds coroutine id/name to thread names and reconstructs the async stack trace (the chain of suspend calls).",
          "**`kotlinx-coroutines-debug` (DebugProbes)** — dump all active coroutines and their states/stacks; great for finding stuck/leaked coroutines.",
          "**Structured names** — name long-lived scopes' coroutines so production logs are traceable.",
        ],
      },
      {
        t: "note",
        text: "Add CoroutineName(\"...\") to the context for readable labels, and enable coroutine debug mode (-Dkotlinx.coroutines.debug) for coroutine ids in thread names and reconstructed async stack traces. Use DebugProbes (kotlinx-coroutines-debug) to dump active coroutines and find stuck/leaked ones.",
      },
    ],
  },
  {
    level: "junior",
    q: "What dispatcher do viewModelScope and lifecycleScope use by default, and why does it matter?",
    a: [
      {
        t: "p",
        text: "Both default to `Dispatchers.Main.immediate`. That means coroutines launched on them start on the main thread — so you can update UI/state directly without switching — and `immediate` means if you're *already* on the main thread, execution isn't re-dispatched (no extra frame delay). Heavy work must still be moved off with `withContext(IO/Default)`.",
      },
      {
        t: "list",
        items: [
          "**`Main.immediate`** — runs on the main thread; safe for UI/state updates immediately after a suspend call returns.",
          "**`immediate` optimization** — skips re-dispatching when already on Main, avoiding a needless post to the message queue.",
          "**Still offload heavy work** — the default being Main means *you* must `withContext(IO/Default)` for I/O or CPU work.",
          "**Why it matters** — you can write `viewModelScope.launch { state = repo.load() }` and the state assignment is main-safe, provided `repo.load()` is main-safe internally.",
        ],
      },
      {
        t: "note",
        text: "Both default to Dispatchers.Main.immediate — coroutines start on the main thread (safe for UI/state updates) and 'immediate' skips re-dispatch when already on Main. But heavy work still needs withContext(IO/Default). This is why viewModelScope.launch { state = repo.load() } is main-safe when the repo is main-safe.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you structure parallel work and combine results in a ViewModel operation?",
    a: [
      {
        t: "p",
        text: "Launch one coroutine from `viewModelScope` for the operation, and inside it use `coroutineScope`/`async` to fan out independent calls, combine the results, and update state once. Keep the threading main-safe (repositories switch to IO), so the ViewModel code stays on Main and can set state directly.",
      },
      {
        t: "code",
        title: "Parallel fan-out in a ViewModel",
        code: `fun load() {
    viewModelScope.launch {
        _state.value = Loading
        try {
            val result = coroutineScope {
                val profile = async { repo.profile() }   // concurrent
                val orders  = async { repo.orders() }
                Screen(profile.await(), orders.await())
            }
            _state.value = Content(result)
        } catch (e: Exception) {
            _state.value = Error(e.message)
        }
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Outer `launch`** — one coroutine per user action, tied to `viewModelScope`.",
          "**Inner `coroutineScope` + `async`** — structured concurrency for the parallel calls; a failure cancels siblings and is caught by the outer try/catch.",
          "**Update state once** — set Loading, then Content/Error, avoiding intermediate flicker.",
          "**Main-safe repos** — no manual dispatcher juggling in the ViewModel.",
        ],
      },
      {
        t: "note",
        text: "One viewModelScope.launch per action; inside, coroutineScope { async … async … } for parallel independent calls, combine, then set state once (Loading→Content/Error). Structured concurrency means one failure cancels siblings and is caught by the outer try/catch. Keep repos main-safe so the VM stays on Main.",
      },
    ],
  },
  {
    level: "senior",
    q: "What does the '+' operator do when building a coroutine context (Job() + Dispatchers.IO)?",
    a: [
      {
        t: "p",
        text: "`CoroutineContext` is an indexed set of elements, and `+` *combines* two contexts into one — right-side elements override same-keyed left-side ones. So `Job() + Dispatchers.IO + CoroutineName(\"x\")` builds a context containing that Job, that dispatcher, and that name. It's how you assemble the configuration for a scope or a builder.",
      },
      {
        t: "code",
        title: "Combining context elements",
        code: `val ctx = SupervisorJob() + Dispatchers.IO + CoroutineName("sync") + handler
val scope = CoroutineScope(ctx)
// Override just the dispatcher for one launch:
scope.launch(Dispatchers.Default) { }   // Default replaces IO for this child`,
      },
      {
        t: "list",
        items: [
          "**`+` merges contexts** — combine Job, dispatcher, name, exception handler into one context.",
          "**Right overrides left** — for the same key (e.g. two dispatchers), the rightmost wins.",
          "**Inheritance + override** — children inherit the parent context; passing a context to a builder overrides those elements for that child.",
          "**Each element has a `Key`** — you retrieve elements with `context[Job]`, `context[CoroutineDispatcher]`, etc.",
        ],
      },
      {
        t: "note",
        text: "CoroutineContext is an indexed element set; + combines contexts with right-overrides-left for same-key elements (e.g. dispatcher). Assemble a scope's config as Job + Dispatcher + Name + Handler. Children inherit the parent context; a builder's context arg overrides specific elements for that child. Retrieve via context[Key].",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you implement a 'cancel the previous job when a new one starts' pattern?",
    a: [
      {
        t: "p",
        text: "Keep a reference to the current `Job`, and when starting a new operation, cancel the old one first. This is common for search-as-you-type, refresh buttons, or any action where a newer request should supersede an in-flight one. (For flows, `flatMapLatest`/`collectLatest` do this declaratively.)",
      },
      {
        t: "code",
        title: "Cancel-previous with a Job field",
        code: `private var searchJob: Job? = null
fun search(query: String) {
    searchJob?.cancel()                       // cancel the in-flight search
    searchJob = viewModelScope.launch {
        delay(300)                            // debounce
        _results.value = repo.search(query)
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Hold the `Job`** — cancel it before launching the replacement.",
          "**Debounce with `delay`** — a cancelled coroutine's `delay` throws immediately, so rapid input cancels before the network call fires.",
          "**Flow alternative** — model the query as a `StateFlow` and use `debounce` + `flatMapLatest`, which cancels the previous search automatically.",
          "**Avoid races** — cancelling ensures stale results can't overwrite newer ones.",
        ],
      },
      {
        t: "note",
        text: "Store the current Job; on a new action, oldJob.cancel() then relaunch — the cancel-previous pattern for search-as-you-type/refresh. delay-based debounce cancels cleanly before the network fires. The declarative Flow equivalent is a query StateFlow with debounce + flatMapLatest (auto-cancels the prior search).",
      },
    ],
  },
  {
    level: "junior",
    q: "What is the difference between cancelling a whole scope and cancelling one child Job?",
    a: [
      {
        t: "p",
        text: "Cancelling a single `Job` (returned by `launch`) stops just that coroutine (and its children). Cancelling the *scope* (`scope.cancel()`) cancels *all* coroutines in it and puts the scope's Job into a cancelled state — after which the scope can't launch new coroutines. Use the former to stop one operation; the latter for teardown.",
      },
      {
        t: "list",
        items: [
          "**`job.cancel()`** — stops that coroutine and its child coroutines; the scope stays usable for new launches.",
          "**`scope.cancel()`** — cancels every coroutine in the scope *and* the scope's own Job; the scope is now dead (further `launch` calls do nothing/throw).",
          "**`scope.coroutineContext.cancelChildren()`** — cancels all children but keeps the scope alive (usable again).",
          "**Choosing** — cancel a `Job` to abort one task; `cancelChildren()` to reset all tasks but reuse the scope; `cancel()` for permanent teardown.",
        ],
      },
      {
        t: "note",
        text: "job.cancel() stops one coroutine (and its children), scope stays usable. scope.cancel() cancels ALL its coroutines and kills the scope (no more launches). scope.coroutineContext.cancelChildren() cancels all children but keeps the scope alive. Use job.cancel for one task, cancelChildren to reset, cancel() for teardown.",
      },
    ],
  },
  {
    level: "senior",
    q: "Why is a manually-created scope in a ViewModel usually a mistake when viewModelScope exists?",
    a: [
      {
        t: "p",
        text: "`viewModelScope` is already lifecycle-aware — it's cancelled in `onCleared()` automatically and uses a `SupervisorJob` + `Dispatchers.Main.immediate`. Creating your own `CoroutineScope` in a ViewModel means you must remember to cancel it in `onCleared()` yourself; forgetting leaks coroutines past the ViewModel's death. There's rarely a reason to not just use `viewModelScope`.",
      },
      {
        t: "list",
        items: [
          "**`viewModelScope` auto-cancels** — no manual teardown, no leak risk.",
          "**Sensible defaults** — `SupervisorJob` (children independent) + `Main.immediate`.",
          "**A manual scope must be cancelled in `onCleared`** — easy to forget, causing leaks.",
          "**Legit exceptions** — you might create a *child* scope for a specific sub-lifecycle, but derive it from `viewModelScope` (e.g. `viewModelScope + Job()`) so it's still tied to the ViewModel, and cancel that child when its sub-task ends.",
        ],
      },
      {
        t: "note",
        text: "viewModelScope is already lifecycle-aware (auto-cancelled in onCleared, SupervisorJob + Main.immediate), so a hand-rolled scope in a ViewModel just adds a manual-cancel obligation you can forget → leaks. Rare valid case: a sub-scope derived from viewModelScope for a shorter-lived sub-task, cancelled when that task ends.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you wait for multiple launched Jobs to all finish?",
    a: [
      {
        t: "p",
        text: "Collect the `Job`s and `join()` each (or `joinAll(jobs)`). More idiomatically, wrap the launches in a `coroutineScope { }` — it doesn't return until all child coroutines complete, so you don't have to track and join each one manually.",
      },
      {
        t: "code",
        title: "Waiting for all children",
        code: `// Explicit joinAll
val jobs = items.map { scope.launch { process(it) } }
jobs.joinAll()

// Structured: coroutineScope waits for all children automatically
coroutineScope {
    items.forEach { launch { process(it) } }
}   // returns only after every child finishes`,
      },
      {
        t: "list",
        items: [
          "**`joinAll(jobs)`** — suspend until every listed Job completes.",
          "**`coroutineScope { }`** — implicitly waits for all children before returning (preferred; structured).",
          "**Failure behavior** — in `coroutineScope`, one child failing cancels the others and rethrows; use `supervisorScope` to isolate failures.",
        ],
      },
      {
        t: "note",
        text: "joinAll(jobs) waits for a list of Jobs; or just wrap the launches in coroutineScope { } which returns only after all children finish (preferred — structured). In coroutineScope one failure cancels siblings and rethrows; supervisorScope isolates failures.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is a CoroutineExceptionHandler, and where do you install it?",
    a: [
      {
        t: "p",
        text: "A `CoroutineExceptionHandler` is a context element that catches *uncaught* exceptions from coroutines — a last-resort handler for `launch` coroutines whose exceptions weren't handled inside. It's installed on a *scope* (or the root coroutine), and only works there — installing it on an inner child coroutine has no effect, because the exception propagates to the parent first.",
      },
      {
        t: "code",
        title: "Handler on the scope",
        code: `val handler = CoroutineExceptionHandler { _, e -> log("Uncaught: \${e.message}") }
val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main + handler)
scope.launch { risky() }   // if risky() throws uncaught, handler runs`,
      },
      {
        t: "list",
        items: [
          "**Catches uncaught `launch` exceptions** — a global safety net (log/report), not a replacement for local try/catch.",
          "**Install on the scope/root** — installing on an inner `launch` doesn't work; the exception has already propagated to the parent.",
          "**Doesn't work for `async`** — `async` exposes its exception via `await()`, so the handler isn't invoked for it (the `Deferred` holds it).",
          "**Pairs with `SupervisorJob`** — so one child's handled failure doesn't cancel siblings.",
        ],
      },
      {
        t: "note",
        text: "CoroutineExceptionHandler is a context element catching UNCAUGHT launch exceptions — a scope-level safety net (log/report). Install on the scope/root, not inner children (exceptions propagate to the parent first). It doesn't apply to async (use await's try/catch). Pair with SupervisorJob to isolate failures.",
      },
    ],
  },
  {
    level: "junior",
    q: "Can you nest coroutine builders, and what is the parent-child relationship?",
    a: [
      {
        t: "p",
        text: "Yes — launching a coroutine inside another creates a *child* coroutine. The child inherits the parent's context (dispatcher, etc.), the parent won't complete until all children do, cancelling the parent cancels the children, and (with a regular Job) a child's failure cancels the parent. This parent-child tree is the backbone of structured concurrency.",
      },
      {
        t: "code",
        title: "Nested builders form a tree",
        code: `scope.launch {                 // parent
    launch { taskA() }         // child 1
    launch { taskB() }         // child 2
    // parent 'completes' only after taskA and taskB finish
}`,
      },
      {
        t: "list",
        items: [
          "**Children inherit context** — dispatcher, name, etc., unless overridden in the builder.",
          "**Parent waits** — it reaches Completed only after all children do (the 'Completing' state).",
          "**Cancellation cascades down** — cancelling the parent cancels all descendants.",
          "**Failure cascades up** — with a normal Job, a child exception cancels the parent and siblings; a `SupervisorJob` breaks that upward cascade.",
        ],
      },
      {
        t: "note",
        text: "Nesting builders creates child coroutines: children inherit the parent's context, the parent completes only after all children finish, cancelling the parent cancels children (down), and a child failure cancels the parent+siblings (up) unless a SupervisorJob isolates it. This tree is structured concurrency's backbone.",
      },
    ],
  },
];

export default qa;
