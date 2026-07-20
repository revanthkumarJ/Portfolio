// Coroutine Exception Handling — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "How do you handle an exception from a coroutine started with launch?",
    a: [
      {
        t: "p",
        text: "**The concept**: in a `launch` coroutine, an uncaught exception propagates immediately (up to the parent scope, and ultimately to a handler or a crash). The simplest way to handle it is a `try/catch` *inside* the coroutine around the risky suspend calls.",
      },
      {
        t: "code",
        title: "try/catch inside launch",
        code: `viewModelScope.launch {
    try {
        val data = repository.load()
        _state.value = UiState.Content(data)
    } catch (e: CancellationException) {
        throw e                       // always rethrow cancellation
    } catch (e: Exception) {
        _state.value = UiState.Error(e.message)
    }
}`,
      },
      {
        t: "p",
        text: "The one rule you must not forget: rethrow `CancellationException`. Since it's a subclass of `Exception`, a broad catch grabs it, and swallowing it breaks cancellation. So catch it first and rethrow, or catch only the specific exceptions you expect. For a single operation like this, try/catch is clean and clear. For app architecture, many teams prefer returning errors as values (a `Result` type) from the repository so the ViewModel handles failure as an explicit branch rather than catching exceptions.",
      },
    ],
  },
  {
    level: "junior",
    q: "How is exception handling different between launch and async?",
    a: [
      {
        t: "p",
        text: "**The difference is *when* the exception surfaces.** In `launch`, an exception is thrown *immediately* when it occurs and propagates up right away. In `async`, the exception is *captured inside the returned `Deferred`* and only re-thrown when you call `await()` on it.",
      },
      {
        t: "code",
        title: "launch throws now, async throws at await",
        code: `launch { throw IOException() }          // propagates immediately

val d = async { throw IOException() }   // captured, not thrown yet
d.await()                                // throws here`,
      },
      {
        t: "list",
        items: [
          "**`launch`**: handle with try/catch inside, or a `CoroutineExceptionHandler` at the scope root.",
          "**`async`**: handle by wrapping `await()` in try/catch. If you never call `await()` on a standalone async, its exception can go unnoticed.",
          "**Both, as children of a scope**: an unhandled failure also propagates to the parent scope (cancelling siblings, with a regular Job) — that's structured concurrency and is separate from the 'when is it thrown' question.",
        ],
      },
      {
        t: "p",
        text: "So the practical guidance: for fire-and-forget work use `launch` and catch inside; for concurrent results use `async` and catch around `await()`. A common mistake is expecting a `CoroutineExceptionHandler` to catch an `async` exception — it won't, because async exceptions are meant to be surfaced through `await()`.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a CoroutineExceptionHandler and when does it work?",
    a: [
      {
        t: "p",
        text: "**The concept**: a `CoroutineExceptionHandler` is a coroutine context element that catches *uncaught* exceptions reaching the root of a coroutine tree. You install it in a scope's context, and it acts as a global net — typically for logging or crash reporting.",
      },
      {
        t: "code",
        title: "Installing one",
        code: `val handler = CoroutineExceptionHandler { _, e ->
    Log.e("App", "Uncaught", e)
}
val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main + handler)
scope.launch { risky() }   // uncaught exception -> handler`,
      },
      {
        t: "list",
        items: [
          "**Works only for `launch`**, not `async` (async exceptions surface via `await()`).",
          "**Works only at the *root* coroutine** — it must be in the scope or root launch; installing it on a nested child does nothing, because the exception propagates up to the root before the handler fires.",
          "**It's a net, not a control-flow tool**: by the time it runs, the coroutine has already failed. Use it for logging/reporting and last-resort handling, not for handling expected errors (use try/catch or Result types for those).",
        ],
      },
    ],
  },
  {
    level: "junior",
    q: "Why doesn't a try/catch around a launch block catch exceptions from coroutines launched inside it?",
    a: [
      {
        t: "p",
        text: "**Because a child coroutine's exception propagates through the *Job hierarchy*, not up the call stack through your try/catch.** When you `launch` a child coroutine, it runs independently as a node in the coroutine tree. If it throws, the exception travels up the *parent-child Job relationship* — it does not 'return' to the point where you called `launch`, so the surrounding try/catch never sees it.",
      },
      {
        t: "code",
        title: "The mistake and the fix",
        code: `// WRONG — try never catches the child's exception
launch {
    try {
        launch { throw IOException() }   // child; propagates via Job tree
    } catch (e: Exception) { /* never runs */ }
}

// RIGHT — catch inside the child
launch {
    launch {
        try { risky() } catch (e: Exception) { handle(e) }
    }
}`,
      },
      {
        t: "p",
        text: "The fix is to put the try/catch *inside the coroutine that does the risky work* (so it's on the same call stack), or use a `CoroutineExceptionHandler` for uncaught exceptions at the root. This is a direct consequence of structured concurrency: exceptions flow along Job parent-child edges, not along synchronous call stacks. Understanding this prevents the common bug of 'my try/catch isn't catching anything'.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does exception propagation interact with SupervisorJob and CoroutineExceptionHandler?",
    a: [
      {
        t: "p",
        text: "**The interaction is subtle and a favorite senior question.** With a *regular* Job, a child's uncaught exception propagates up to the parent, cancels the parent and siblings, and continues to the root where a `CoroutineExceptionHandler` (if present) handles it. With a `SupervisorJob`, the exception does **not** propagate to the parent — so the behavior changes:",
      },
      {
        t: "list",
        items: [
          "**Under a `SupervisorJob`, each direct child is treated as a 'root' for exception purposes.** A child's uncaught exception doesn't cancel siblings or the parent — but it still needs handling, and a `CoroutineExceptionHandler` installed on the *supervisor scope* WILL catch the uncaught exceptions of its direct `launch` children (because for a supervised child, the scope is effectively its root).",
          "**Placement of the handler matters**: with a regular Job, only a handler at the *root* matters (child handlers are ignored, since exceptions propagate to the root first). With a SupervisorJob, a handler on the supervisor catches direct children's failures. So `SupervisorJob() + handler` in the scope is a common pattern for 'isolate failures AND log them'.",
          "**Still only `launch`, never `async`**: regardless of Job type, `CoroutineExceptionHandler` never handles `async` exceptions — those must be caught at `await()`.",
          "**Depth caveat**: a SupervisorJob only supervises *direct* children. A grandchild (launched by a child with a regular Job) that fails will cancel *its* parent (the child), because that inner level uses a normal Job — the top supervisor doesn't reach down.",
        ],
      },
      {
        t: "code",
        title: "Isolate + log pattern",
        code: `val handler = CoroutineExceptionHandler { _, e -> log(e) }
val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main + handler)

scope.launch { widgetA() }   // if it fails: isolated (siblings survive) AND logged
scope.launch { widgetB() }   // unaffected by A's failure`,
      },
      {
        t: "p",
        text: "**The complete mental model**: `SupervisorJob` controls *whether* a failure propagates to siblings/parent (it doesn't); `CoroutineExceptionHandler` controls *what happens* to an exception once it becomes uncaught at a root. Together: supervisor isolates, handler logs. Knowing that the handler works on direct supervised children (but not on children under a regular Job, where only the root handler fires) is the depth signal.",
      },
    ],
  },
  {
    level: "senior",
    q: "Why is 'errors as values' often preferred over exceptions for coroutine error handling in app code?",
    a: [
      {
        t: "p",
        text: "**Because most failures in an app are *expected outcomes*, not exceptional bugs — and modeling them as values makes handling explicit, exhaustive, and decoupled from coroutine mechanics.** A network being down or a 404 isn't a programming error; it's a normal case the UI must handle. Throwing exceptions for these means every caller must remember to try/catch (easy to forget), the exception's type is untyped in the signature, and you're relying on exceptions crossing coroutine boundaries correctly (with all the launch/async/SupervisorJob subtleties).",
      },
      {
        t: "list",
        items: [
          "**Explicit and type-safe**: a repository returning `Result<User>` or a sealed `Either<DataError, User>` puts the failure *in the type signature*. Callers can't ignore it, and a `when` over a sealed error is exhaustive (the compiler ensures every case is handled).",
          "**Failures become normal control flow**: `repository.getUser().onSuccess { }.onFailure { }` handles the error as a branch, no try/catch, no reliance on exception propagation rules.",
          "**Separation of concerns**: exceptions are reserved for genuine *bugs* (a null where there shouldn't be one) which *should* crash in debug, while expected failures (offline, not-found) are data. This makes crash reports meaningful — a crash is a real bug, not 'the network was down'.",
          "**Boundary translation**: the data layer catches technical exceptions (`IOException`, `HttpException`) at its edge and maps them to a domain error vocabulary (`DataError.NoConnection`, `DataError.NotFound`), so upper layers never depend on library exception types.",
        ],
      },
      {
        t: "code",
        title: "The pattern (with the runCatching cancellation caveat)",
        code: `suspend fun getUser(id: String): Result<User> = withContext(io) {
    runCatching { api.getUser(id).toUser() }
        .onFailure { if (it is CancellationException) throw it }  // don't swallow cancellation
}`,
      },
      {
        t: "p",
        text: "**The important caveat**: `runCatching` catches *everything*, including `CancellationException` — so you must rethrow cancellation (or use a `runSuspendCatching` helper), or you'll break structured cancellation while trying to model errors as values. With that handled, errors-as-values gives you the cleanest, most testable error handling — and it's why modern Android architecture guidance leans on Result/sealed types rather than exceptions crossing coroutine boundaries.",
      },
    ],
  },
];

export default qa;
