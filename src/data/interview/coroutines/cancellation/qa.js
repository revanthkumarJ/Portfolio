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
  {
    level: "junior",
    q: "How do you actually cancel a coroutine?",
    a: [
      {
        t: "p",
        text: "You cancel through the handle: `job.cancel()` for a single coroutine, `job.cancelAndJoin()` to cancel and wait until it's fully stopped, or `scope.cancel()` to cancel every coroutine in a scope. Cancellation is *requested* — the coroutine actually stops at its next suspension point (cooperative cancellation).",
      },
      {
        t: "code",
        title: "Ways to cancel",
        code: `val job = scope.launch { work() }
job.cancel()                       // request cancellation (returns immediately)
job.cancelAndJoin()                // cancel AND suspend until it's done winding down
scope.cancel()                     // cancel all coroutines in the scope
job.cancel(CancellationException("user aborted"))   // with a custom cause`,
      },
      {
        t: "list",
        items: [
          "**`cancel()`** — requests cancellation; the coroutine stops at the next suspension point.",
          "**`cancelAndJoin()`** — cancel then wait for it to finish (including cleanup); use when you must ensure it's gone before proceeding.",
          "**`scope.cancel()`** — cancels the whole scope's tree (used for teardown).",
          "**Managed scopes** — `viewModelScope`/`lifecycleScope` cancel automatically; you rarely call these manually.",
        ],
      },
      {
        t: "note",
        text: "job.cancel() (request, returns immediately), job.cancelAndJoin() (cancel + wait until fully stopped), or scope.cancel() (whole tree). Cancellation is cooperative — it takes effect at the next suspension point. Lifecycle scopes cancel automatically, so manual cancel is mostly for custom scopes or cancel-previous patterns.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is CancellationException, and why is it treated specially?",
    a: [
      {
        t: "p",
        text: "`CancellationException` is the exception thrown at suspension points to unwind a cancelled coroutine. It's treated as a *normal, expected* signal rather than an error: it doesn't propagate up to cancel the parent (unlike other exceptions), and the machinery relies on it flowing freely. That's why you must never swallow it in a broad `catch`.",
      },
      {
        t: "code",
        title: "It flows through suspension points",
        code: `launch {
    try {
        delay(1000)   // throws CancellationException if cancelled here
    } catch (e: CancellationException) {
        // if you catch it, RETHROW it — don't swallow
        throw e
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Signals cancellation** — thrown at suspension points in a cancelled coroutine to unwind it.",
          "**Not a failure** — doesn't cancel the parent/siblings; it's the expected end of a cancelled coroutine.",
          "**Must not be swallowed** — catching and ignoring it makes the coroutine 'un-cancellable' and breaks structured concurrency.",
          "**`try/finally` still runs** — cleanup executes as it unwinds.",
        ],
      },
      {
        t: "note",
        text: "CancellationException is thrown at suspension points to unwind a cancelled coroutine — a normal, expected signal, not a failure (it doesn't cancel the parent). Never swallow it in a broad catch (that breaks cancellation); if you catch it, rethrow. finally blocks still run during the unwind.",
      },
    ],
  },
  {
    level: "senior",
    q: "Why can't coroutines be force-killed, and why is cooperative cancellation the design?",
    a: [
      {
        t: "p",
        text: "There's no safe way to forcibly stop a thread mid-execution (Java deprecated `Thread.stop()` for exactly this reason — it can leave locks held and state corrupted). So coroutines cancel *cooperatively*: cancellation sets a flag, and the coroutine notices at its next suspension point (or explicit check) and throws. This guarantees cleanup runs and state stays consistent.",
      },
      {
        t: "list",
        items: [
          "**Force-kill is unsafe** — abruptly stopping code can corrupt shared state and leak resources (held locks, open files).",
          "**Cooperative = safe** — the coroutine unwinds via `CancellationException`, running `finally`/cleanup properly.",
          "**Requires cooperation** — code that never suspends or checks `isActive` won't cancel; it's your job to make long loops cooperative.",
          "**Built-in suspend functions cooperate** — `delay`, `withContext`, `yield`, and library suspend calls all check cancellation.",
        ],
      },
      {
        t: "note",
        text: "Force-killing a thread mid-execution is unsafe (Thread.stop is deprecated — leaves locks held, state corrupt), so coroutines cancel cooperatively: a flag is set and the coroutine throws CancellationException at its next suspension point, unwinding cleanly with finally/cleanup. The cost: non-suspending loops must check isActive/yield to be cancellable.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do suspend functions detect cancellation?",
    a: [
      {
        t: "p",
        text: "All the built-in suspend functions (`delay`, `yield`, `withContext`, and library calls like Retrofit/Room) check the cancellation state and throw `CancellationException` if the coroutine was cancelled. So merely *having suspension points* usually makes a coroutine cancellable — the check happens automatically each time it suspends/resumes.",
      },
      {
        t: "list",
        items: [
          "**Automatic at suspension points** — every `suspend` call from the library is a cancellation check.",
          "**Throws `CancellationException`** — unwinding the coroutine when cancelled.",
          "**Most code is cancellable for free** — because it awaits I/O (`delay`, network, DB) frequently.",
          "**The exception** — a tight CPU loop with *no* suspension points never checks; you must add `ensureActive()`/`yield()`.",
        ],
      },
      {
        t: "code",
        title: "Suspension points = cancellation checks",
        code: `suspend fun loadAll(ids: List<String>) {
    for (id in ids) {
        val item = api.get(id)   // suspends -> checks cancellation each iteration
        cache.put(id, item)
    }
}`,
      },
      {
        t: "note",
        text: "Built-in suspend functions (delay/yield/withContext/Retrofit/Room) check cancellation and throw CancellationException when cancelled — so code with frequent suspension points (I/O) is cancellable for free. Only a tight CPU loop with no suspension points won't notice; add ensureActive()/yield() there.",
      },
    ],
  },
  {
    level: "senior",
    q: "What's the difference between ensureActive(), isActive, and yield() for cooperative cancellation?",
    a: [
      {
        t: "p",
        text: "All three help make non-suspending work cancellable, but differ. `isActive` is a boolean you check to break out of a loop; `ensureActive()` throws `CancellationException` immediately if cancelled (cleaner than checking `isActive` and returning); `yield()` both checks cancellation *and* gives other coroutines a turn (fairness).",
      },
      {
        t: "code",
        title: "Three cooperation tools",
        code: `// isActive: check and break
while (isActive) { computeStep() }

// ensureActive(): throw if cancelled (preferred for 'just check')
for (item in items) { ensureActive(); process(item) }

// yield(): check + let others run (for long fair loops)
for (item in items) { process(item); yield() }`,
      },
      {
        t: "list",
        items: [
          "**`isActive`** — a `Boolean`; use to exit a loop gracefully (returns partial work).",
          "**`ensureActive()`** — throws `CancellationException` if cancelled; the idiomatic 'check for cancellation' that unwinds properly.",
          "**`yield()`** — checks cancellation *and* suspends briefly so other coroutines progress; use in long loops that could starve the dispatcher.",
          "**Pick** — `ensureActive()` for a plain check, `yield()` when fairness matters, `isActive` when you want to stop without throwing.",
        ],
      },
      {
        t: "note",
        text: "isActive = boolean to break a loop (partial result). ensureActive() = throws CancellationException if cancelled (idiomatic check, unwinds cleanly). yield() = checks cancellation AND yields to other coroutines (fairness in long loops). Use ensureActive for a plain check, yield when starvation is a risk, isActive to stop without throwing.",
      },
    ],
  },
  {
    level: "senior",
    q: "What happens if a CPU-bound loop never checks for cancellation?",
    a: [
      {
        t: "p",
        text: "It becomes *uncancellable* — cancelling the coroutine sets the flag, but the loop, having no suspension points or checks, runs to completion anyway. Worse, it can keep a thread busy after the screen/scope is gone (wasting CPU and battery), and on a limited dispatcher it can starve other coroutines waiting for that thread.",
      },
      {
        t: "code",
        title: "Uncancellable vs cancellable",
        code: `// BAD: ignores cancellation, runs fully even if cancelled
launch { var x = 0L; while (x < 1_000_000_000) { x += compute() } }

// GOOD: cooperative
launch {
    var x = 0L
    while (x < 1_000_000_000) {
        ensureActive()     // or yield()
        x += compute()
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Runs to completion** — cancellation has no effect without a check.",
          "**Wastes resources** — CPU/battery spent on work whose result is discarded.",
          "**Can starve others** — on `Default` (core-sized pool), a busy uncancellable loop hogs a scarce thread.",
          "**Fix** — sprinkle `ensureActive()`/`yield()`/`isActive`, or break the work into suspending chunks.",
        ],
      },
      {
        t: "note",
        text: "A CPU loop with no suspension points or checks is uncancellable — cancellation sets a flag it never reads, so it runs fully, wasting CPU/battery on a discarded result and potentially starving a scarce Default thread. Fix with periodic ensureActive()/yield()/isActive checks or suspending chunks.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does withTimeout work, and how do you handle its exception?",
    a: [
      {
        t: "p",
        text: "`withTimeout(ms) { }` runs a block and *cancels* it if it doesn't finish within the time limit, throwing a `TimeoutCancellationException` (a subclass of `CancellationException`). `withTimeoutOrNull(ms)` does the same but returns `null` instead of throwing on timeout. Use them to bound how long an operation may take.",
      },
      {
        t: "code",
        title: "Timeouts",
        code: `try {
    val result = withTimeout(5000) { api.slowCall() }
} catch (e: TimeoutCancellationException) {
    showError("Request timed out")
}
// Or the non-throwing variant:
val result = withTimeoutOrNull(5000) { api.slowCall() } ?: fallback()`,
      },
      {
        t: "list",
        items: [
          "**`withTimeout`** — throws `TimeoutCancellationException` if the block exceeds the limit; the block is cancelled cooperatively.",
          "**`withTimeoutOrNull`** — returns `null` on timeout (cleaner when a timeout is a normal outcome).",
          "**Cooperative** — the block must be cancellable (suspension points) for the timeout to actually stop it.",
          "**Catch caution** — `TimeoutCancellationException` *is* a `CancellationException`; catch it *specifically* (not broad `CancellationException`) so you don't interfere with real cancellation.",
        ],
      },
      {
        t: "note",
        text: "withTimeout(ms){} cancels the block and throws TimeoutCancellationException (a CancellationException subclass) if it overruns; withTimeoutOrNull returns null instead. The block must be cancellable (suspension points) to actually stop. Catch TimeoutCancellationException specifically — not broad CancellationException — to avoid swallowing real cancellation.",
      },
    ],
  },
  {
    level: "junior",
    q: "What's the difference between cancel() and cancelAndJoin()?",
    a: [
      {
        t: "p",
        text: "`cancel()` only *requests* cancellation and returns immediately — the coroutine may still be winding down (running cleanup) afterward. `cancelAndJoin()` requests cancellation *and suspends until the coroutine has fully finished*, including its `finally` cleanup. Use `cancelAndJoin()` when you must be sure the old work is completely gone before starting new work.",
      },
      {
        t: "code",
        title: "Ensuring the old job is done",
        code: `// Restart a task, guaranteeing the old one is fully stopped first:
oldJob?.cancelAndJoin()      // wait until it's completely finished
oldJob = scope.launch { newWork() }`,
      },
      {
        t: "list",
        items: [
          "**`cancel()`** — fire-and-forget request; doesn't wait.",
          "**`cancelAndJoin()`** — cancel then `join`; suspends until fully cancelled (cleanup done).",
          "**Use `cancelAndJoin`** — when the new work must not overlap the old (shared resource, exclusive access).",
          "**`cancel()` is fine** — when you don't care exactly when it stops.",
        ],
      },
      {
        t: "note",
        text: "cancel() just requests cancellation and returns immediately (coroutine may still be winding down). cancelAndJoin() cancels AND suspends until it's fully finished (cleanup done). Use cancelAndJoin when new work must not overlap the old (shared/exclusive resource); cancel() when timing doesn't matter.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you make a blocking (non-suspending) call cancellable?",
    a: [
      {
        t: "p",
        text: "A blocking Java call (a synchronous read, a library that blocks a thread) doesn't respond to coroutine cancellation on its own. Wrap it in `runInterruptible { }`, which runs the block so that coroutine cancellation *interrupts the thread* (setting the interrupt flag / throwing `InterruptedException`) — bridging thread interruption to coroutine cancellation. Alternatively, use `suspendCancellableCoroutine` with `invokeOnCancellation` to abort the underlying operation.",
      },
      {
        t: "code",
        title: "runInterruptible bridges interruption",
        code: `suspend fun readBlocking(): ByteArray = withContext(Dispatchers.IO) {
    runInterruptible {
        blockingInputStream.readBytes()   // cancellation -> thread interrupt -> stops
    }
}`,
      },
      {
        t: "list",
        items: [
          "**`runInterruptible { }`** — maps coroutine cancellation to `Thread.interrupt()`, so interruptible blocking calls (many I/O APIs) abort.",
          "**`suspendCancellableCoroutine` + `invokeOnCancellation`** — for callback/handle-based APIs, cancel the underlying request explicitly.",
          "**Not all blocking is interruptible** — some native calls ignore interruption; then you can only abandon the coroutine (the thread stays busy until the call returns).",
          "**Run on `IO`** — blocking work belongs off the main thread regardless.",
        ],
      },
      {
        t: "note",
        text: "Wrap a blocking call in runInterruptible { } (inside withContext(IO)) — it maps coroutine cancellation to Thread.interrupt(), aborting interruptible blocking I/O. For handle/callback APIs, use suspendCancellableCoroutine + invokeOnCancellation to cancel the underlying op. Non-interruptible native calls can't be stopped — the thread stays busy until they return.",
      },
    ],
  },
  {
    level: "junior",
    q: "Does delay() respond to cancellation immediately?",
    a: [
      {
        t: "p",
        text: "Yes — `delay` is a suspension point, so if the coroutine is cancelled during a `delay`, it throws `CancellationException` *immediately*, without waiting for the delay to elapse. This is why `delay`-based debouncing and backoff cancel cleanly the moment the coroutine is cancelled.",
      },
      {
        t: "code",
        title: "delay cancels instantly",
        code: `val job = launch {
    delay(10_000)          // if cancelled at t=1s, throws now — doesn't wait to t=10s
    println("never prints if cancelled")
}
delay(1000)
job.cancel()               // delay above throws CancellationException immediately`,
      },
      {
        t: "list",
        items: [
          "**Immediate** — a cancelled coroutine's `delay` throws at once, not after the timeout.",
          "**Great for debounce** — rapid input cancels the pending `delay` before the action fires.",
          "**Contrast `Thread.sleep`** — blocks and ignores cancellation; never use it in coroutines.",
          "**All suspension points behave this way** — `delay` is just the common example.",
        ],
      },
      {
        t: "note",
        text: "Yes — delay is a suspension point, so a cancelled coroutine's delay throws CancellationException immediately (doesn't wait out the timeout). That's why delay-based debounce/backoff cancels cleanly. Thread.sleep, by contrast, blocks and ignores cancellation — never use it in coroutines.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you clean up or unregister resources when a coroutine is cancelled?",
    a: [
      {
        t: "p",
        text: "Use `try/finally` for general cleanup (the `finally` runs during cancellation unwinding), and for callback-bridging use `invokeOnCancellation` inside `suspendCancellableCoroutine` (or `awaitClose` in `callbackFlow`) to unregister listeners. Remember: *suspending* cleanup in `finally` needs `withContext(NonCancellable)` since the coroutine is already cancelled.",
      },
      {
        t: "code",
        title: "Cleanup patterns",
        code: `// try/finally for resources
try { useResource() } finally { resource.close() }

// invokeOnCancellation for callbacks
suspendCancellableCoroutine { cont ->
    val cb = register { cont.resume(it) }
    cont.invokeOnCancellation { unregister(cb) }   // cleanup if cancelled
}`,
      },
      {
        t: "list",
        items: [
          "**`try/finally`** — runs on normal completion *and* cancellation; close streams/resources here.",
          "**`invokeOnCancellation`** — unregister a callback / abort the underlying request when cancelled.",
          "**`awaitClose { }`** — the `callbackFlow` equivalent for stream cleanup.",
          "**Suspending cleanup** — wrap in `withContext(NonCancellable)` so it isn't cancelled before running.",
        ],
      },
      {
        t: "note",
        text: "General cleanup: try/finally (runs during cancellation unwind). Callback bridges: invokeOnCancellation in suspendCancellableCoroutine, or awaitClose in callbackFlow, to unregister/abort. Suspending cleanup in finally must use withContext(NonCancellable) or it's cancelled before it runs.",
      },
    ],
  },
  {
    level: "senior",
    q: "Why does a broad catch(Exception) break cancellation, and what's the fix?",
    a: [
      {
        t: "p",
        text: "`CancellationException` is an `Exception`, so a broad `catch (e: Exception)` *swallows* it — the coroutine thinks it recovered and keeps running instead of unwinding, defeating cancellation and breaking structured concurrency. The fix is to rethrow `CancellationException` (or catch more specific types), so cancellation propagates while you still handle real errors.",
      },
      {
        t: "code",
        title: "Preserve cancellation",
        code: `try {
    doWork()
} catch (e: CancellationException) {
    throw e                       // MUST rethrow — let cancellation propagate
} catch (e: Exception) {
    handleRealError(e)
}
// or catch specific types: catch (e: IOException) { ... }`,
      },
      {
        t: "list",
        items: [
          "**The trap** — `catch (Exception)` also catches `CancellationException`, keeping a cancelled coroutine alive.",
          "**Fix 1** — rethrow `CancellationException` first, before the broad catch.",
          "**Fix 2** — catch specific exceptions (`IOException`, etc.) instead of `Exception`.",
          "**`runCatching` caveat** — it also swallows `CancellationException`; avoid it in coroutine code (or rethrow inside).",
        ],
      },
      {
        t: "note",
        text: "CancellationException is an Exception, so catch(Exception) swallows it — the cancelled coroutine keeps running, breaking cancellation/structured concurrency. Fix: rethrow CancellationException first (or catch specific types like IOException). Note runCatching has the same problem — avoid it in coroutine code or rethrow inside.",
      },
    ],
  },
  {
    level: "junior",
    q: "Can a cancelled coroutine be restarted or resumed?",
    a: [
      {
        t: "p",
        text: "No — cancellation is terminal. Once a coroutine (its `Job`) is cancelled, it can't be resumed or restarted; the `Job` is in a final Cancelled state. To 'retry', you *launch a new coroutine*. Similarly, a cancelled scope can't launch new coroutines — you'd create a fresh scope.",
      },
      {
        t: "list",
        items: [
          "**Terminal state** — a cancelled `Job` stays cancelled; no resume/restart.",
          "**Retry = new coroutine** — `launch` again for a fresh attempt.",
          "**Cancelled scope is dead** — new launches on it are born cancelled; make a new scope.",
          "**Design** — model retries as new work, not reviving old coroutines.",
        ],
      },
      {
        t: "note",
        text: "No — cancellation is terminal; a cancelled Job can't resume/restart, and a cancelled scope can't launch new coroutines. To retry, launch a fresh coroutine (or create a new scope). Model retries as new work, never as reviving a cancelled coroutine.",
      },
    ],
  },
  {
    level: "junior",
    q: "How does cancellation propagate to child coroutines?",
    a: [
      {
        t: "p",
        text: "Cancelling a coroutine cancels *all* of its children (and their children), recursively down the tree. This is a structured-concurrency guarantee: you can't leave orphaned children when the parent is cancelled. Each child receives `CancellationException` at its next suspension point and unwinds.",
      },
      {
        t: "code",
        title: "Parent cancel → children cancel",
        code: `val parent = scope.launch {
    launch { childA() }   // cancelled when parent is
    launch { childB() }   // cancelled when parent is
}
parent.cancel()           // both children stop at their next suspension point`,
      },
      {
        t: "list",
        items: [
          "**Recursive** — the whole subtree is cancelled.",
          "**At suspension points** — each child throws `CancellationException` and runs its cleanup.",
          "**Guaranteed** — no child survives its parent's cancellation.",
          "**Scope cancel** — `scope.cancel()` cancels every coroutine in the scope the same way.",
        ],
      },
      {
        t: "note",
        text: "Cancelling a coroutine recursively cancels all descendants — a structured-concurrency guarantee (no orphaned children). Each child throws CancellationException at its next suspension point and runs cleanup. scope.cancel() does this for the whole scope's tree.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you implement retry with a per-attempt timeout?",
    a: [
      {
        t: "p",
        text: "Combine a retry loop with `withTimeout` per attempt and a backoff `delay`. Each attempt is bounded by `withTimeout`; on failure or timeout you wait (increasing delay) and retry up to a limit, then give up. Because `delay` and `withTimeout` are cancellable, the whole retry respects coroutine cancellation.",
      },
      {
        t: "code",
        title: "Retry with timeout and backoff",
        code: `suspend fun <T> retry(times: Int, timeoutMs: Long, block: suspend () -> T): T {
    var delayMs = 500L
    repeat(times - 1) { attempt ->
        try {
            return withTimeout(timeoutMs) { block() }
        } catch (e: CancellationException) {
            if (e is TimeoutCancellationException) { /* treat as retryable */ } else throw e
        } catch (e: Exception) { /* retryable */ }
        delay(delayMs); delayMs *= 2   // exponential backoff (cancellable)
    }
    return withTimeout(timeoutMs) { block() }   // last attempt, let it throw
}`,
      },
      {
        t: "list",
        items: [
          "**Per-attempt `withTimeout`** — bounds each try; a hung attempt times out and retries.",
          "**Backoff `delay`** — space out retries (exponential + optional jitter); cancellable.",
          "**Careful with `CancellationException`** — retry on `TimeoutCancellationException` but rethrow *real* cancellation, so navigation-away still stops the retry.",
          "**Cap attempts** — give up and surface the error after N tries.",
        ],
      },
      {
        t: "note",
        text: "Retry loop + withTimeout(per attempt) + exponential backoff delay. Bound each try; on failure/timeout, delay (cancellable) and retry up to a cap. Subtlety: retry on TimeoutCancellationException but rethrow genuine CancellationException so real cancellation (navigation) still stops the retries.",
      },
    ],
  },
  {
    level: "senior",
    q: "What's the difference between cancelling a coroutine and it timing out?",
    a: [
      {
        t: "p",
        text: "Both end the coroutine via `CancellationException`, but the *cause* and *intent* differ. Cancellation is external — someone called `cancel()` (or a parent/scope was cancelled). A timeout is `withTimeout` cancelling the block because it ran too long, throwing the more specific `TimeoutCancellationException`. A timeout is a *deliberate deadline*; cancellation is a *lifecycle/decision* stop.",
      },
      {
        t: "list",
        items: [
          "**Cancellation** — triggered by `cancel()`/scope teardown; throws `CancellationException`; usually you don't handle it (let it propagate).",
          "**Timeout** — triggered by `withTimeout` exceeding its limit; throws `TimeoutCancellationException` (a subclass); often you *do* handle it (show 'timed out', fall back).",
          "**Distinguish by type** — catch `TimeoutCancellationException` specifically to react to timeouts while letting real cancellation propagate.",
          "**`withTimeoutOrNull`** — turns a timeout into a `null` result instead of an exception.",
        ],
      },
      {
        t: "note",
        text: "Both throw CancellationException, but cancellation is external (cancel()/scope teardown — usually let it propagate) while a timeout is withTimeout hitting its deadline (throws the subclass TimeoutCancellationException — often handled: fallback/'timed out'). Catch TimeoutCancellationException specifically to react to timeouts without swallowing real cancellation.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you test that a coroutine cancels correctly?",
    a: [
      {
        t: "p",
        text: "In `runTest`, launch the coroutine, then cancel it and assert the observable effects: cleanup ran (`finally`/`invokeOnCancellation`), no further state changes happened, and downstream resources were released. The virtual clock and `advanceUntilIdle`/`advanceTimeBy` let you control exactly when cancellation happens relative to the work.",
      },
      {
        t: "code",
        title: "Testing cancellation",
        code: `@Test fun cancelsCleanly() = runTest {
    var cleanedUp = false
    val job = launch {
        try { delay(10_000) } finally { cleanedUp = true }
    }
    advanceTimeBy(1000)     // let it start and suspend on delay
    job.cancelAndJoin()     // cancel and wait
    assertTrue(cleanedUp)   // finally ran
}`,
      },
      {
        t: "list",
        items: [
          "**`cancelAndJoin()`** — cancel and wait so assertions run after cleanup.",
          "**Assert side effects** — `finally` cleanup flags, released resources, no post-cancel state updates.",
          "**Virtual time** — `advanceTimeBy` to position cancellation mid-work.",
          "**Verify unregistration** — for callback bridges, assert the listener was removed via a fake.",
        ],
      },
      {
        t: "note",
        text: "In runTest: launch, position with advanceTimeBy, then cancelAndJoin() and assert observable effects — finally/cleanup ran, resources released, no further state changes, callbacks unregistered (via a fake). The virtual clock lets you cancel at a precise point in the work deterministically.",
      },
    ],
  },
  {
    level: "junior",
    q: "What happens to a withContext block when the coroutine is cancelled?",
    a: [
      {
        t: "p",
        text: "The `withContext` block is part of the current coroutine, so cancelling the coroutine cancels the block too: at its next suspension point it throws `CancellationException` and unwinds (running any `finally`). Cancellation flows through `withContext` naturally — it doesn't shield the block from cancellation (that's what `NonCancellable` is for).",
      },
      {
        t: "list",
        items: [
          "**Cancellable** — a `withContext(IO)` block stops at its next suspension point when the coroutine is cancelled.",
          "**Cleanup runs** — `finally` inside executes during the unwind.",
          "**Not a shield** — regular `withContext(dispatcher)` doesn't prevent cancellation; only `withContext(NonCancellable)` does.",
          "**Return value discarded** — if cancelled mid-block, the coroutine unwinds; you don't get a partial result.",
        ],
      },
      {
        t: "note",
        text: "A withContext block is part of the current coroutine, so cancelling the coroutine cancels it — it throws CancellationException at the next suspension point and runs finally cleanup. withContext(dispatcher) doesn't shield the block; only withContext(NonCancellable) makes it ignore cancellation.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you race coroutines so the first result wins and the rest are cancelled?",
    a: [
      {
        t: "p",
        text: "Wrap the racers in a `coroutineScope` (or use `select`), take the first completed result, and cancel the scope — cancelling the losers. A common idiom: launch each source as an `async`, `select` over their `onAwait`, and let leaving the scope cancel the unfinished ones. This is how you implement 'fastest source wins' (e.g. cache vs network).",
      },
      {
        t: "code",
        title: "First-wins with select",
        code: `suspend fun fastest(): Data = coroutineScope {
    val cache = async { fromCache() }
    val net   = async { fromNetwork() }
    select {
        cache.onAwait { it }
        net.onAwait { it }
    }.also { coroutineContext.cancelChildren() }   // cancel the slower one
}`,
      },
      {
        t: "list",
        items: [
          "**`select { ... onAwait }`** — resumes with whichever `Deferred` completes first.",
          "**Cancel the rest** — `cancelChildren()` (or leaving the scope) cancels the losers so they don't waste resources.",
          "**Structured** — the `coroutineScope` ensures no racer outlives the call.",
          "**Uses** — cache-vs-network, multiple mirrors, fallback endpoints.",
        ],
      },
      {
        t: "note",
        text: "Race with coroutineScope + async per source + select { onAwait } to take the first result, then cancelChildren() (or scope exit) to cancel the losers. Structured concurrency guarantees no racer outlives the call. Classic use: cache-vs-network 'fastest wins' or fallback endpoints.",
      },
    ],
  },
  {
    level: "senior",
    q: "Why is it important that network clients and repositories propagate cancellation?",
    a: [
      {
        t: "p",
        text: "If a repository or HTTP client ignores cancellation, cancelling the coroutine (e.g. when the user leaves the screen) won't actually abort the in-flight request — the work continues, wasting bandwidth/battery and possibly delivering a result to dead UI. Cancellation propagation means the whole chain, down to the socket, stops when the coroutine is cancelled.",
      },
      {
        t: "list",
        items: [
          "**End-to-end cancellation** — the coroutine cancel should reach the actual network/DB call and abort it.",
          "**Retrofit/OkHttp suspend calls cooperate** — a cancelled coroutine cancels the underlying `Call` (aborts the request).",
          "**Custom/blocking clients** — must bridge cancellation (`suspendCancellableCoroutine` + `invokeOnCancellation`, or `runInterruptible`) or they leak work.",
          "**Payoff** — leaving a screen truly stops its network activity; no wasted requests or stale callbacks.",
        ],
      },
      {
        t: "note",
        text: "If the client/repo ignores cancellation, cancelling the coroutine won't abort the in-flight request — wasted bandwidth/battery and results delivered to dead UI. Retrofit/OkHttp suspend calls cancel the underlying Call automatically; custom/blocking clients must bridge cancellation (suspendCancellableCoroutine + invokeOnCancellation / runInterruptible). Then leaving a screen truly stops its work.",
      },
    ],
  },
  {
    level: "junior",
    q: "How do you cancel one specific coroutine while others keep running?",
    a: [
      {
        t: "p",
        text: "Keep the `Job` returned by that specific `launch`/`async` and call `cancel()` on it — this cancels only that coroutine and its children, leaving sibling coroutines in the same scope untouched. This is the basis of patterns like cancel-previous-search (cancel one operation, keep the rest of the screen working).",
      },
      {
        t: "code",
        title: "Targeted cancellation",
        code: `val searchJob = scope.launch { search() }
val syncJob = scope.launch { sync() }
searchJob.cancel()    // cancels ONLY the search; sync keeps running`,
      },
      {
        t: "list",
        items: [
          "**Hold the specific `Job`** — cancel it individually.",
          "**Siblings unaffected** — cancelling one child doesn't touch others (cancellation flows down, not sideways).",
          "**vs `scope.cancel()`** — that would cancel everything; use it only for teardown.",
          "**Cancel-previous** — store the job, cancel it before relaunching for search-as-you-type.",
        ],
      },
      {
        t: "note",
        text: "Keep that coroutine's Job and call job.cancel() — it cancels only that coroutine (and its children); siblings keep running (cancellation flows down, not sideways). Use scope.cancel() only for teardown. This underlies cancel-previous patterns (cancel the old search, keep the rest working).",
      },
    ],
  },
  {
    level: "senior",
    q: "How can you inspect why a coroutine was cancelled?",
    a: [
      {
        t: "p",
        text: "The cancellation *cause* is available via `invokeOnCompletion { cause -> }` or `job.getCancellationException()`. When you cancel with a custom message (`cancel(CancellationException(\"reason\"))`), that cause is preserved, so completion handlers can distinguish why — user abort vs timeout vs parent failure.",
      },
      {
        t: "code",
        title: "Reading the cancellation cause",
        code: `job.cancel(CancellationException("user navigated away"))
job.invokeOnCompletion { cause ->
    when (cause) {
        is TimeoutCancellationException -> log("timed out")
        is CancellationException -> log("cancelled: \${cause.message}")
        null -> log("completed normally")
        else -> log("failed: \$cause")
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Custom cause** — `cancel(CancellationException(\"...\"))` carries a reason.",
          "**`invokeOnCompletion { cause }`** — inspect the cause (null = success, `CancellationException` = cancelled, other = failure).",
          "**Type distinguishes** — `TimeoutCancellationException` vs a plain cancellation.",
          "**Debugging** — helpful in logs to understand why long-running work stopped.",
        ],
      },
      {
        t: "note",
        text: "Pass a cause: cancel(CancellationException(\"reason\")), then read it in invokeOnCompletion { cause } (null=success, CancellationException=cancelled with your message, TimeoutCancellationException=timeout, else=failure) or job.getCancellationException(). Useful for logging why long-running work stopped.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is NonCancellable, and when do you use it?",
    a: [
      {
        t: "p",
        text: "`NonCancellable` is a special `Job` you pass to `withContext(NonCancellable) { }` to make a block *immune* to the ongoing cancellation. Because a cancelled coroutine throws at every suspension point, any *suspending* cleanup in a `finally` would be cancelled before it runs — `NonCancellable` lets that critical cleanup complete.",
      },
      {
        t: "code",
        title: "Guaranteed suspending cleanup",
        code: `try {
    uploadChunks()
} finally {
    withContext(NonCancellable) {
        api.reportProgress(done)   // suspend cleanup that must finish even on cancel
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Immune to cancellation** — the block runs to completion even though the coroutine is cancelled.",
          "**Only for must-finish suspending cleanup** — saving progress, releasing a remote lock, flushing.",
          "**Keep it short** — it defeats cancellation, so long work here delays teardown.",
          "**Non-suspending cleanup doesn't need it** — plain `finally` code runs fine without `NonCancellable`.",
        ],
      },
      {
        t: "note",
        text: "withContext(NonCancellable){} makes a block immune to the ongoing cancellation — needed for SUSPENDING cleanup in finally (otherwise it's cancelled at the first suspension point). Use only for short must-finish work (save progress, release lock, flush). Non-suspending finally code doesn't need it.",
      },
    ],
  },
  {
    level: "senior",
    q: "Why does runCatching interfere with cancellation, and what should you use instead?",
    a: [
      {
        t: "p",
        text: "`runCatching { }` catches *all* `Throwable`s — including `CancellationException`. So inside a coroutine it swallows cancellation, turning a cancelled coroutine into one that appears to have 'failed gracefully' and keeps going, breaking structured concurrency. Prefer explicit `try/catch` that rethrows `CancellationException`, or a `runCatching` variant that rethrows it.",
      },
      {
        t: "code",
        title: "Cancellation-safe error handling",
        code: `// RISKY: swallows CancellationException
val result = runCatching { doWork() }

// SAFE: rethrow cancellation
suspend fun <T> coRunCatching(block: suspend () -> T): Result<T> = try {
    Result.success(block())
} catch (e: CancellationException) {
    throw e
} catch (e: Exception) {
    Result.failure(e)
}`,
      },
      {
        t: "list",
        items: [
          "**`runCatching` catches `Throwable`** — including `CancellationException`, breaking cancellation.",
          "**Symptom** — coroutines that don't stop when cancelled; leaked/continuing work.",
          "**Fix** — a coroutine-aware wrapper that rethrows `CancellationException`, or explicit `try/catch` with specific types.",
          "**Same care with broad `catch (Exception)`/`catch (Throwable)`.**",
        ],
      },
      {
        t: "note",
        text: "runCatching catches all Throwables including CancellationException, so it swallows cancellation — the coroutine keeps running, breaking structured concurrency. Use a coroutine-aware wrapper that rethrows CancellationException (catch it first, throw e; then catch Exception), or explicit try/catch with specific types.",
      },
    ],
  },
  {
    level: "junior",
    q: "A user leaves a screen but work continues — how does cancellation fix it, and when does it NOT trigger?",
    a: [
      {
        t: "p",
        text: "If the work runs in `viewModelScope`/`lifecycleScope`, leaving the screen (destroying the owner) cancels the scope, which cancels the work — provided the work is cooperative (has suspension points). It does *not* trigger on a mere configuration change if you used `viewModelScope`, because the ViewModel is retained across rotation (which is the desired behavior).",
      },
      {
        t: "list",
        items: [
          "**Fixes it** — scope cancellation on destroy stops cooperative coroutines, aborting network/DB work and preventing dead-UI updates.",
          "**Requires cooperation** — a non-suspending CPU loop won't stop; add `ensureActive()`/`yield()`.",
          "**Not on rotation (viewModelScope)** — the ViewModel survives config change, so the load continues (correct — you don't want to refetch on every rotation).",
          "**Wrong scope = wrong behavior** — `GlobalScope`/detached work ignores the screen's lifecycle and leaks; use lifecycle-bound scopes.",
        ],
      },
      {
        t: "note",
        text: "Work in viewModelScope/lifecycleScope is cancelled when the owner is destroyed (leaving the screen), aborting cooperative coroutines — no dead-UI updates. It won't fire on rotation with viewModelScope (VM retained — intended). Requires cooperation (suspension points/ensureActive), and only works if you used a lifecycle scope, not GlobalScope.",
      },
    ],
  },
];

export default qa;
