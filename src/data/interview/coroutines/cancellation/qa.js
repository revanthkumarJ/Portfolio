// Coroutine Cancellation — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What does it mean that coroutine cancellation is 'cooperative'?",
    a: [
      {
        t: "p",
        text: "**The concept**: calling `cancel()` on a coroutine doesn't forcibly kill it — it *requests* cancellation by marking the coroutine's Job as cancelling. The coroutine actually stops only when it reaches a point that **checks for cancellation** and responds. So cancellation requires cooperation from the coroutine's code: it must pass through cancellation checkpoints for the request to take effect.",
      },
      {
        t: "list",
        items: [
          "**Suspension points check automatically**: `delay`, `withContext`, `yield`, network/database suspend calls all check for cancellation — so a coroutine that regularly suspends responds to cancellation promptly and for free.",
          "**Tight non-suspending loops don't**: `while (true) { heavyCompute() }` with no suspension point will keep running even after cancellation, because it never hits a checkpoint. You'd need to add `ensureActive()` or `yield()` in the loop.",
          "**Why cooperative rather than forceful**: forcibly killing a coroutine mid-operation could leave things half-done (partial file writes, held locks). Cooperative cancellation throws an exception that unwinds cleanly, running `finally` blocks — so resources are released properly.",
        ],
      },
    ],
  },
  {
    level: "junior",
    q: "How do you make a long-running loop cancellable?",
    a: [
      {
        t: "p",
        text: "**The concept**: a CPU-bound loop with no suspension points won't respond to cancellation on its own, so you add a cancellation checkpoint inside it. There are three ways:",
      },
      {
        t: "code",
        title: "Three ways to cooperate",
        code: `for (item in items) {
    ensureActive()        // throws CancellationException if cancelled (preferred)
    // or: if (!isActive) return   // exit gracefully without throwing
    // or: yield()                 // check cancellation + let others run
    heavyCompute(item)
}`,
      },
      {
        t: "list",
        items: [
          "**`ensureActive()`** — throws `CancellationException` immediately if the coroutine was cancelled. This is the preferred option because it integrates correctly with structured concurrency (the exception propagates as a proper cancellation).",
          "**`isActive`** — a boolean; check it and `return`/`break` to stop gracefully without throwing, if that's what you want.",
          "**`yield()`** — checks for cancellation *and* yields the thread so other coroutines can run, which is polite in long loops that would otherwise monopolize a dispatcher thread.",
        ],
      },
      {
        t: "p",
        text: "The rule of thumb: if your coroutine does meaningful work without calling any suspend function for a while, sprinkle in one of these checkpoints — typically once per loop iteration. Without them, cancelling the coroutine (or its scope) has no effect until the whole computation finishes.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is withTimeout and how is it different from withTimeoutOrNull?",
    a: [
      {
        t: "p",
        text: "**Both run a block with a time limit and cancel it if it exceeds the deadline — they differ in what happens on timeout.** `withTimeout(ms) { }` **throws** a `TimeoutCancellationException` if the block doesn't finish in time. `withTimeoutOrNull(ms) { }` instead **returns null** on timeout, with no exception to catch.",
      },
      {
        t: "code",
        title: "Both forms",
        code: `// Throwing form — handle the exception
try {
    val data = withTimeout(5000) { api.fetch() }
} catch (e: TimeoutCancellationException) {
    showError("Timed out")
}

// Null form — cleaner when timeout is expected
val data = withTimeoutOrNull(5000) { api.fetch() }
if (data == null) showError("Timed out")`,
      },
      {
        t: "p",
        text: "Use `withTimeoutOrNull` when a timeout is a normal, expected branch you handle with a null check (usually cleaner). Use `withTimeout` when a timeout is genuinely exceptional and you want it to throw. One caveat for both: the block must be *cancellable* (cooperative) for the timeout to interrupt it — if the block is a tight non-suspending computation, it won't be stopped at the deadline because there's no checkpoint to cancel at.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why should you never catch and ignore a CancellationException?",
    a: [
      {
        t: "p",
        text: "**Because cancellation *is* a CancellationException — swallowing it breaks cancellation entirely.** When a coroutine is cancelled, the framework throws a `CancellationException` inside it to unwind it. If your code catches that exception broadly (`catch (e: Exception)`) and doesn't rethrow it, the coroutine 'recovers' from its own cancellation and keeps running — the exact opposite of what cancellation is supposed to do. The coroutine you thought you cancelled continues executing.",
      },
      {
        t: "code",
        title: "The bug and the fix",
        code: `// BUG: swallows cancellation
try { doWork() } catch (e: Exception) { log(e) }

// FIX: rethrow CancellationException
try {
    doWork()
} catch (e: CancellationException) {
    throw e                    // let cancellation proceed
} catch (e: Exception) {
    log(e)                     // handle real errors only
}`,
      },
      {
        t: "p",
        text: "This is a subtle, common bug because `CancellationException` is a subclass of `Exception`, so a broad catch grabs it unintentionally. The fix is to either catch `CancellationException` first and rethrow it, catch only the specific exceptions you actually expect, or use a helper like `runCatching`-with-rethrow. The principle: cancellation must be allowed to propagate; only *genuine errors* should be caught and handled.",
      },
    ],
  },
  {
    level: "senior",
    q: "You need to save progress to the database when a coroutine is cancelled, but the save is a suspend function. What's the problem and the fix?",
    a: [
      {
        t: "p",
        text: "**The problem**: cleanup goes in a `finally` block, but by the time `finally` runs during cancellation, the coroutine is *already in the cancelled state*. Any **suspend** function you call there — including your database save — will *immediately* throw `CancellationException` again, because a cancelled coroutine refuses to suspend. So your `saveProgress()` never actually runs; it's aborted the instant it suspends.",
      },
      {
        t: "code",
        title: "The fix: NonCancellable",
        code: `val job = launch {
    try {
        doWork()
    } finally {
        // Non-suspend cleanup is fine:
        releaseInMemoryResources()

        // Suspend cleanup during cancellation MUST be shielded:
        withContext(NonCancellable) {
            database.saveProgress(currentState)   // now allowed to suspend & complete
        }
    }
}`,
      },
      {
        t: "list",
        items: [
          "**`NonCancellable`** is a special `Job` that can't be cancelled. Wrapping suspend cleanup in `withContext(NonCancellable) { }` creates a context where the coroutine is temporarily *not* cancellable, so suspend calls inside it are allowed to run to completion even though the outer coroutine is being cancelled.",
          "**Use it sparingly and only for cleanup**: it deliberately ignores cancellation, so long or unbounded work inside `NonCancellable` defeats the point of cancellation (the coroutine can't be stopped until it finishes). Keep it to quick, essential cleanup (save state, flush a buffer, close a resource that needs a suspend call).",
          "**Non-suspend cleanup doesn't need it**: closing a file handle or clearing a reference in `finally` works fine without `NonCancellable` — only *suspend* cleanup hits the 'already cancelled, can't suspend' problem.",
        ],
      },
      {
        t: "p",
        text: "**The senior insight**: this reveals a precise understanding of the cancellation state machine — that `finally` runs during unwinding, that a cancelled coroutine can't suspend, and that `NonCancellable` is the escape hatch for the narrow case of *suspending cleanup during cancellation*. It's a favorite question because the naive 'just save it in finally' fails silently.",
      },
    ],
  },
  {
    level: "senior",
    q: "A user leaves a screen but a network request keeps running. Walk through why, and how cancellation should prevent it.",
    a: [
      {
        t: "p",
        text: "**Why it happens**: the request was launched in a scope not tied to the screen's lifetime — the usual culprits are `GlobalScope.launch`, a manually-created `CoroutineScope` that's never cancelled, or a callback-based API (Retrofit `Call`, an old listener) that isn't coroutine-managed at all. Because nothing cancels that work when the screen is destroyed, it runs to completion, wasting network/battery and possibly trying to update a destroyed UI (leak or crash).",
      },
      {
        t: "list",
        items: [
          "**The fix — launch in a lifecycle-bound scope**: run the request in `viewModelScope` (cancelled in `onCleared`) or `lifecycleScope` (cancelled on destroy). When the user leaves and the ViewModel is cleared / the lifecycle ends, the scope is cancelled, which — via structured concurrency — cancels the request coroutine. At its next suspension point (the network call is a suspension point), it throws `CancellationException` and stops.",
          "**Retrofit/OkHttp cooperation**: modern Retrofit suspend functions are cancellation-aware — cancelling the coroutine actually cancels the underlying HTTP call. So the request isn't just abandoned in code; the socket work is cancelled too. (Old `enqueue`-callback style wasn't tied to any scope, which is why it leaked.)",
          "**If the work must genuinely continue** (an upload that should finish regardless): that's a *different* requirement — it doesn't belong in the screen's scope at all. Put it in an application-scoped scope or WorkManager, so leaving the screen correctly does *not* cancel it.",
        ],
      },
      {
        t: "p",
        text: "**The principle to articulate**: 'a coroutine keeps running after the screen is gone' is almost always a *scope* bug — the work was bound to the wrong lifetime. Structured concurrency solves it by tying the coroutine to a lifecycle scope, so scope cancellation cascades down and cancels the request. The decision is simply: does this work belong to the screen (viewModelScope/lifecycleScope) or should it outlive the screen (app scope / WorkManager)? Bind it to the matching lifetime and cancellation takes care of itself.",
      },
    ],
  },
];

export default qa;
