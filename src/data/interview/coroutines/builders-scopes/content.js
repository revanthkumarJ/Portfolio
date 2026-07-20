// Builders & Coroutine Scopes — Content tab. Teaching-first.

const content = [
  {
    heading: "Coroutine builders — how you start a coroutine",
    blocks: [
      {
        t: "p",
        text: "You can't just call a suspend function from normal code — you need a **coroutine builder** to launch a coroutine that provides the required context. The three builders, each for a different situation:",
      },
      {
        t: "table",
        headers: ["Builder", "Returns", "Blocks caller?", "Use for"],
        rows: [
          ["`launch`", "`Job`", "no", "fire-and-forget work (no result needed)"],
          ["`async`", "`Deferred<T>`", "no", "concurrent work that produces a result"],
          ["`runBlocking`", "`T`", "**yes** (blocks the thread)", "bridging blocking code / tests / main() only"],
        ],
      },
      {
        t: "code",
        title: "The three builders",
        code: `// launch — start work, don't wait for a result
scope.launch {
    repository.syncData()          // fire and forget
}

// async — start concurrent work, get a result via await()
val deferred = scope.async { api.fetch() }
val result = deferred.await()

// runBlocking — BLOCKS the current thread until the block completes
fun main() = runBlocking {          // bridges main() into the coroutine world
    launch { doWork() }
}`,
      },
      {
        t: "list",
        items: [
          "**`launch`** returns a `Job` — a handle to cancel or join the coroutine. Its block returns nothing useful; exceptions in it propagate to the parent (and can crash).",
          "**`async`** returns a `Deferred<T>` (a `Job` with a result). You get the value with `await()`, and — importantly — an exception is *held* in the Deferred and thrown when you `await()` it.",
          "**`runBlocking`** actually **blocks** the calling thread until its coroutine finishes — the opposite of the whole point of coroutines. It's a bridge for `main()` functions, unit tests (though `runTest` is preferred), and calling suspend code from a truly blocking context. **Never use it on the main thread in an app** — it freezes the UI.",
        ],
      },
    ],
  },
  {
    heading: "CoroutineScope — the lifetime of coroutines",
    blocks: [
      {
        t: "p",
        text: "Every coroutine runs inside a **`CoroutineScope`**, which defines its **lifetime** and holds its **context** (dispatcher, Job, etc.). Builders like `launch`/`async` are extension functions *on* `CoroutineScope` — that's why you write `scope.launch { }`. The scope's job: when the scope is cancelled, *all* coroutines started in it are cancelled. This is the foundation of not leaking coroutines.",
      },
      {
        t: "list",
        items: [
          "A scope is created from a `CoroutineContext` — typically a `Job` (or `SupervisorJob`) plus a `Dispatcher`: `CoroutineScope(SupervisorJob() + Dispatchers.Main)`.",
          "Coroutines launched in a scope are its **children** — cancelling the scope cancels the children; the scope isn't considered complete until its children finish (structured concurrency).",
          "**Never use `GlobalScope`**: it's a scope with no lifetime bound to anything — coroutines launched there live until the process dies and aren't cancelled when your screen/component goes away. It's the classic coroutine-leak source.",
        ],
      },
    ],
  },
  {
    heading: "The Android lifecycle scopes you get for free",
    blocks: [
      {
        t: "list",
        items: [
          "**`viewModelScope`** — a scope tied to a `ViewModel`; cancelled automatically in `onCleared()`. The home for ViewModel coroutines (data loading, driving state). Uses `Dispatchers.Main.immediate` + a `SupervisorJob`.",
          "**`lifecycleScope`** — tied to a `Lifecycle` (Activity/Fragment); cancelled when the lifecycle is destroyed. For UI-layer coroutines. Often paired with `repeatOnLifecycle` for lifecycle-aware flow collection.",
          "**`rememberCoroutineScope()`** — a Compose scope tied to the composable's presence in the composition; cancelled when it leaves. For launching from event handlers (covered in the Compose Side Effects topic).",
        ],
      },
      {
        t: "code",
        title: "Using the framework scopes",
        code: `class MyViewModel : ViewModel() {
    fun refresh() {
        viewModelScope.launch {            // cancelled in onCleared()
            _state.value = repository.load()
        }
    }
}

// In a Fragment:
viewLifecycleOwner.lifecycleScope.launch {
    repeatOnLifecycle(Lifecycle.State.STARTED) {
        viewModel.uiState.collect { render(it) }
    }
}`,
      },
      {
        t: "p",
        text: "The point of these scopes is **automatic cancellation**: when the ViewModel is cleared or the screen is destroyed, every coroutine you launched is cancelled — no leaks, no callbacks firing into dead UI. You almost never create your own scope in app code; you use the lifecycle-provided ones.",
      },
    ],
  },
  {
    heading: "coroutineScope vs supervisorScope — scoping functions",
    blocks: [
      {
        t: "p",
        text: "`coroutineScope { }` and `supervisorScope { }` are **suspend functions** that create a *new scope* as a child of the current one, run their block, and **don't return until all child coroutines complete**. They're how you do structured concurrency *within* a suspend function (e.g. run several things concurrently and wait for all).",
      },
      {
        t: "code",
        title: "coroutineScope waits for all children",
        code: `suspend fun loadAll(): Data = coroutineScope {
    val a = async { fetchA() }
    val b = async { fetchB() }
    Data(a.await(), b.await())
    // returns only after both children finish;
    // if one throws, the other is cancelled and the exception propagates
}`,
      },
      {
        t: "list",
        items: [
          "**`coroutineScope`** — if *any* child fails, it cancels *all* the other children and rethrows the exception. All-or-nothing: use when the results are interdependent (all needed, or the whole operation fails).",
          "**`supervisorScope`** — children fail *independently*: one child throwing does *not* cancel its siblings. Use when children are independent and one failing shouldn't abort the rest (e.g. loading several independent widgets — one can fail while others succeed).",
          "Both differ from `runBlocking` in that they **suspend** (don't block a thread) — they're the suspend-world way to establish a scope, whereas `runBlocking` blocks.",
        ],
      },
    ],
  },
  {
    heading: "launch vs async — and the exception subtlety",
    blocks: [
      {
        t: "list",
        items: [
          "**`launch`** is for side-effecting, resultless work. An uncaught exception in a `launch` coroutine **propagates immediately** to its parent/scope (and, without a handler, can crash or be routed to a `CoroutineExceptionHandler`).",
          "**`async`** is for producing a value. An exception in an `async` coroutine is **captured in the `Deferred`** and only *rethrown when you call `await()`** — so if you never await, or the async is a top-level coroutine, the exception can be silently deferred. (When `async` is a *child* of a scope, the exception still propagates to the parent on failure, per structured concurrency — the 'await to see it' rule is about the direct throwing site.)",
          "**Practical rule**: use `launch` for 'do this'; use `async` for 'compute this, I'll await it'. Don't use `async` for fire-and-forget (you lose the exception unless you await), and don't use `async` if you're just going to immediately `await` a single call (that's just sequential work — a plain suspend call is clearer).",
        ],
      },
      {
        t: "note",
        text: "Common interview question: \"launch vs async?\" → \"launch returns a Job for fire-and-forget work and throws exceptions to its parent; async returns a Deferred<T> for concurrent results and holds the exception until await(). Use async only when you actually need the result concurrently.\"",
      },
    ],
  },
];

export default content;
