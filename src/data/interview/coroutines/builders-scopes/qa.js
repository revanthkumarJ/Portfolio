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
];

export default qa;
