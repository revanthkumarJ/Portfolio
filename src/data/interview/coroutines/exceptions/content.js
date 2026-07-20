// Coroutine Exception Handling — Content tab. Teaching-first.

const content = [
  {
    heading: "Two exception models: launch propagates, async defers",
    blocks: [
      {
        t: "p",
        text: "Coroutine exception handling starts with one distinction: **`launch` and `async` handle exceptions differently.** In `launch`, an uncaught exception is *thrown immediately* and propagates up the Job hierarchy. In `async`, the exception is *stored in the `Deferred`* and only re-thrown when you call `await()`. Getting this right is the foundation for everything else.",
      },
      {
        t: "code",
        title: "The two behaviors",
        code: `// launch: exception propagates right away (up to parent / handler / crash)
scope.launch {
    throw IOException()   // propagates immediately
}

// async: exception is held, re-thrown at await()
val deferred = scope.async {
    throw IOException()   // stored, not thrown here
}
deferred.await()          // NOW it throws`,
      },
      {
        t: "list",
        items: [
          "**`launch` — 'pushed'**: handle with a try/catch inside the coroutine, or a `CoroutineExceptionHandler` at the scope. It behaves like an uncaught exception on a thread.",
          "**`async` — 'pulled'**: handle by wrapping `await()` in try/catch. If you never await, a standalone async's exception can sit unnoticed.",
          "**The structured-concurrency overlay**: when either is a *child* of a scope, an unhandled failure *also* propagates to the parent (cancelling siblings, per the Jobs topic) — this is separate from the 'when is it thrown' question and always applies.",
        ],
      },
    ],
  },
  {
    heading: "try/catch — the simplest tool, with a catch",
    blocks: [
      {
        t: "p",
        text: "You can wrap suspend calls in ordinary `try/catch`, and it works — but placement matters and there's a critical rule about `CancellationException`.",
      },
      {
        t: "code",
        title: "try/catch around suspend calls",
        code: `viewModelScope.launch {
    try {
        val data = repository.load()          // suspend call
        _state.value = UiState.Content(data)
    } catch (e: CancellationException) {
        throw e                               // NEVER swallow cancellation — rethrow
    } catch (e: IOException) {
        _state.value = UiState.Error("Network error")
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Rethrow `CancellationException`**: a broad `catch (e: Exception)` grabs the cancellation signal too. If you don't rethrow it, cancellation breaks. Catch it first and rethrow, or catch specific exception types only.",
          "**Placement**: try/catch only catches exceptions from code *inside* it that runs *synchronously in this coroutine*. It does **not** catch exceptions from a *child* coroutine you `launch` inside the try — that child's failure propagates through the Job hierarchy, not through your try/catch. This surprises people.",
          "**For a single operation**, try/catch is clean. For structuring error handling across a whole scope, a `CoroutineExceptionHandler` may fit better.",
        ],
      },
    ],
  },
  {
    heading: "Why try/catch doesn't catch child coroutine failures",
    blocks: [
      {
        t: "code",
        title: "The gotcha",
        code: `// WRONG: the try does NOT catch the child launch's exception
scope.launch {
    try {
        launch {                 // a CHILD coroutine
            throw IOException()  // propagates via Job hierarchy, NOT to the try below
        }
    } catch (e: Exception) {
        // never reached!
    }
}

// RIGHT: put the try/catch INSIDE the coroutine that does the risky work
scope.launch {
    launch {
        try { risky() } catch (e: Exception) { handle(e) }   // caught here
    }
}`,
      },
      {
        t: "p",
        text: "The rule: **a child coroutine's exception propagates up through the Job tree, not out through the parent's `try/catch`.** So to catch a child's failure, the try/catch must be *inside the child* (around its own work), or you use a `CoroutineExceptionHandler` in the context (which handles uncaught exceptions that reach the root). This is a direct consequence of structured concurrency — failures flow through Jobs, not call stacks.",
      },
    ],
  },
  {
    heading: "CoroutineExceptionHandler — the last-resort net",
    blocks: [
      {
        t: "p",
        text: "A **`CoroutineExceptionHandler`** is a context element that catches **uncaught** exceptions that reach the root of a coroutine tree — a global safety net for logging or graceful handling, not a control-flow mechanism.",
      },
      {
        t: "code",
        title: "Installing a handler",
        code: `val handler = CoroutineExceptionHandler { _, throwable ->
    Log.e("App", "Uncaught coroutine exception", throwable)
    crashReporter.report(throwable)
}

val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main + handler)

scope.launch { riskyWork() }   // uncaught exception -> goes to handler`,
      },
      {
        t: "list",
        items: [
          "**Only works for `launch`, not `async`**: `async` exceptions are meant to surface via `await()`, so the handler never sees them.",
          "**Only catches at the *root* coroutine**: it must be installed in the scope (or the root `launch`), not a nested child. An exception from a child propagates up to the root, and only there does the handler fire. Installing it on an inner `launch` does nothing.",
          "**It's a net, not a strategy**: by the time it fires, the coroutine has already failed and (with a regular Job) taken down its subtree. Use it for *logging/reporting* and last-resort graceful degradation, not for handling expected errors — handle those with try/catch where they occur.",
          "**With `SupervisorJob`**: since child failures don't propagate to the parent, each child that should be caught needs its own handling; a handler on the supervisor scope catches failures of its *direct* `launch` children.",
        ],
      },
    ],
  },
  {
    heading: "Errors as values — the recommended architecture",
    blocks: [
      {
        t: "p",
        text: "The most robust approach in app code is to *not rely on exceptions crossing coroutine boundaries* at all — instead, **model expected failures as values**. The data layer catches technical exceptions at the boundary and returns a typed result; the ViewModel handles that result as an expected branch.",
      },
      {
        t: "code",
        title: "Result types instead of thrown exceptions",
        code: `// Repository: catch at the boundary, return a typed result
suspend fun getUser(id: String): Result<User> = withContext(ioDispatcher) {
    runCatching { api.getUser(id).toUser() }
        // runCatching catches CancellationException too — rethrow it:
        .onFailure { if (it is CancellationException) throw it }
}

// ViewModel: no try/catch needed; handle the result
viewModelScope.launch {
    repository.getUser(id)
        .onSuccess { _state.value = UiState.Content(it) }
        .onFailure { _state.value = UiState.Error(it.message) }
}`,
      },
      {
        t: "list",
        items: [
          "**Why this is better**: expected failures (network down, 404) are *expected outcomes*, not exceptional control flow. Modeling them as `Result`/sealed types makes handling explicit and exhaustive, and keeps exceptions for genuine bugs.",
          "**`runCatching` caveat**: it catches *everything*, including `CancellationException` — so in a coroutine you must rethrow cancellation (as shown), or use a custom `runSuspendCatching` helper that does it for you.",
          "**Map to domain errors**: translate `HttpException`/`IOException` into a sealed `DataError` at the data-layer boundary, so upper layers never see library-specific exceptions (ties into the Clean Architecture error-handling topic).",
        ],
      },
      {
        t: "note",
        text: "The layered answer to 'how do you handle coroutine exceptions': (1) `launch` propagates immediately, `async` defers to `await()`; (2) try/catch for local handling, but rethrow `CancellationException` and know it won't catch *child* failures; (3) `CoroutineExceptionHandler` as a root-level net for logging (launch only); (4) architecturally, prefer *errors as values* (Result/sealed types) so failures are explicit and exceptions are reserved for bugs.",
      },
    ],
  },
];

export default content;
