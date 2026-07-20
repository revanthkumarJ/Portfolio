// Coroutine Cancellation — Content tab. Teaching-first.

const content = [
  {
    heading: "Cancellation is cooperative",
    blocks: [
      {
        t: "p",
        text: "The single most important fact about coroutine cancellation: it is **cooperative**, not forceful. Calling `job.cancel()` doesn't kill the coroutine dead — it *requests* cancellation by marking the Job as cancelling. The coroutine only actually stops when it reaches a point that **checks for cancellation** and responds by throwing a `CancellationException`. A coroutine that never checks will keep running despite being 'cancelled'.",
      },
      {
        t: "list",
        items: [
          "**Where cancellation is checked automatically**: every suspension point in the kotlinx.coroutines library — `delay`, `withContext`, `yield`, a Retrofit/Room suspend call, `Mutex.lock`, channel operations. When a cancelled coroutine hits one of these, it throws `CancellationException` and unwinds.",
          "**Where it is NOT checked**: your own tight loops and long computations that don't suspend. A `while (true) { computeStuff() }` with no suspension point ignores cancellation entirely.",
          "**Why cooperative and not forceful**: forcefully killing a thread mid-operation (like the old `Thread.stop()`) leaves resources in inconsistent states — half-written files, held locks. Cooperative cancellation lets the coroutine unwind cleanly through normal exception handling (`finally` blocks run), which is safe.",
        ],
      },
    ],
  },
  {
    heading: "Making CPU-bound work cancellable",
    blocks: [
      {
        t: "p",
        text: "If your coroutine does CPU work without natural suspension points, you must *cooperate* — periodically check whether you've been cancelled. Two idioms:",
      },
      {
        t: "code",
        title: "Cooperating with cancellation",
        code: `// Option A: ensureActive() — throws CancellationException if cancelled
suspend fun process(items: List<Item>) {
    for (item in items) {
        currentCoroutineContext().ensureActive()   // checkpoint
        heavyCompute(item)
    }
}

// Option B: isActive check — exit gracefully without throwing
suspend fun process2(items: List<Item>) {
    for (item in items) {
        if (!currentCoroutineContext().isActive) return   // bail out
        heavyCompute(item)
    }
}

// Option C: yield() — checks cancellation AND lets other coroutines run
suspend fun process3(items: List<Item>) {
    for (item in items) {
        yield()          // cooperative point
        heavyCompute(item)
    }
}`,
      },
      {
        t: "list",
        items: [
          "**`ensureActive()`** — throws `CancellationException` immediately if cancelled (the normal cancellation path). Preferred: it integrates with structured concurrency (the exception propagates correctly).",
          "**`isActive`** — a boolean you check to exit gracefully (e.g. `return`). Use when you want to stop *without* throwing.",
          "**`yield()`** — checks cancellation *and* gives other coroutines a chance to run (useful in long loops to avoid hogging a dispatcher thread).",
          "**The `.cancellable()` flow operator** does the equivalent for flows that emit rapidly without other suspension points.",
        ],
      },
    ],
  },
  {
    heading: "CancellationException — the special exception",
    blocks: [
      {
        t: "p",
        text: "Cancellation works by throwing a **`CancellationException`** inside the coroutine. This exception is *special*: the coroutine machinery treats it as a normal, expected signal (the coroutine was told to stop), **not** as a failure. That's why a cancelled coroutine doesn't crash the app or propagate a failure to its parent — it just quietly winds down.",
      },
      {
        t: "list",
        items: [
          "**Never swallow it**: the cardinal rule. A broad `try { } catch (e: Exception) { }` around a suspend call *catches* the `CancellationException` and, if you don't rethrow it, the coroutine thinks it recovered and keeps running — cancellation is broken. Always rethrow it, or catch specific exceptions only.",
          "**`try/finally` still runs on cancellation**: because cancellation is an exception, `finally` blocks execute during unwinding — the correct place for cleanup (close resources, release locks). This is why cooperative cancellation is safe: cleanup happens.",
          "**Suspending in a `finally`**: a coroutine is already cancelled when `finally` runs, so calling a *suspend* function there (e.g. to save state) will *immediately* throw `CancellationException` again. To run suspend cleanup during cancellation, wrap it in `withContext(NonCancellable) { }` (see below).",
        ],
      },
      {
        t: "code",
        title: "Cleanup during cancellation",
        code: `val job = launch {
    try {
        work()
    } finally {
        // non-suspend cleanup runs fine here
        closeResources()
        // suspend cleanup needs NonCancellable:
        withContext(NonCancellable) {
            saveProgressToDb()   // still runs even though we're cancelled
        }
    }
}`,
      },
    ],
  },
  {
    heading: "withTimeout and withTimeoutOrNull",
    blocks: [
      {
        t: "p",
        text: "Cancellation powers **timeouts**. `withTimeout(ms) { }` runs a block and **cancels it** (throwing `TimeoutCancellationException`) if it doesn't finish in time. `withTimeoutOrNull(ms) { }` does the same but returns `null` instead of throwing — cleaner when a timeout is an expected outcome.",
      },
      {
        t: "code",
        title: "Timeouts",
        code: `// Throws TimeoutCancellationException on timeout:
val result = withTimeout(5000) { api.fetch() }

// Returns null on timeout (no exception to catch):
val resultOrNull = withTimeoutOrNull(5000) { api.fetch() }
if (resultOrNull == null) showTimeoutMessage()`,
      },
      {
        t: "list",
        items: [
          "The block must be *cancellable* (cooperative) for the timeout to actually interrupt it — a tight non-suspending loop inside `withTimeout` won't be stopped at the deadline.",
          "`TimeoutCancellationException` is a subclass of `CancellationException`, so it's treated as cancellation — it cancels the block but (as a normal cancellation) doesn't propagate as a failure to the parent. Catch it explicitly if you want to react (or use `withTimeoutOrNull`).",
        ],
      },
    ],
  },
  {
    heading: "How scope cancellation ties it together",
    blocks: [
      {
        t: "list",
        items: [
          "**Cancelling a scope/parent cancels all descendants** — the tree cancellation from structured concurrency. `viewModelScope` cancelled in `onCleared()` → every ViewModel coroutine gets a `CancellationException` at its next suspension point.",
          "**Cancellation is one-directional (down) for cancel, and a normal outcome** — cancelling a child doesn't affect siblings or parent (unlike a failure).",
          "**A cancelled scope is dead** — you can't launch new coroutines in it (they cancel immediately). This is why you never cancel `viewModelScope` yourself.",
          "**Cooperation is the developer's responsibility for custom loops** — the framework cancels at suspension points for free, but your CPU loops need `ensureActive`/`isActive`/`yield`.",
        ],
      },
      {
        t: "note",
        text: "The three cancellation facts to state: (1) it's cooperative — checked at suspension points, so tight loops need manual `ensureActive()`; (2) it works via `CancellationException`, which must never be swallowed (rethrow it) and lets `finally` run for cleanup; (3) suspend cleanup during cancellation needs `withContext(NonCancellable)`. Timeouts (`withTimeout`) are cancellation with a deadline.",
      },
    ],
  },
];

export default content;
