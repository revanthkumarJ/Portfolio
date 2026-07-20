// Structured Concurrency & Jobs — Interview Prep tab. Teaching-first answers.

const qa = [
  {
    level: "junior",
    q: "What is structured concurrency?",
    a: [
      {
        t: "p",
        text: "**The concept**: structured concurrency means coroutines form a **parent-child tree**, and a parent coroutine (or scope) does not complete until all of its children have completed. Every coroutine you launch inside a scope becomes a child of that scope. This structure is what makes coroutines safe compared to raw threads or callbacks.",
      },
      {
        t: "list",
        items: [
          "**No leaked work**: because a scope waits for its children, you can't accidentally start a coroutine and forget about it — the scope tracks it and won't finish until it does.",
          "**Cancellation propagates down**: cancel a scope or parent, and all its children are cancelled automatically. Leave a screen → its scope cancels → all its coroutines stop.",
          "**Errors propagate up**: by default, an unhandled exception in a child cancels its parent and siblings, so failures aren't silently lost.",
        ],
      },
      {
        t: "p",
        text: "The practical payoff: you get automatic cleanup and error handling for free. Contrast the old callback world, where a started network request could keep running and call back into a destroyed screen because nothing tied its lifetime to anything. Structured concurrency ties every coroutine's lifetime to a scope, so 'this work belongs to this screen' is enforced by the framework.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a Job in coroutines?",
    a: [
      {
        t: "p",
        text: "**The concept**: a `Job` is the handle to a coroutine's lifecycle. `launch` returns one, and every coroutine has one in its context. It serves two roles: a *control handle* you can use to cancel or wait for the coroutine, and a *node in the parent-child tree* that connects a coroutine to its parent and children.",
      },
      {
        t: "code",
        title: "What you do with a Job",
        code: `val job = scope.launch { work() }
job.cancel()          // request cancellation
job.join()            // suspend until it completes
job.cancelAndJoin()   // cancel and wait for it to stop
job.isActive          // still running?`,
      },
      {
        t: "list",
        items: [
          "A Job has states: New → Active → Completing → Completed, or Cancelling → Cancelled, exposed via `isActive`/`isCancelled`/`isCompleted`.",
          "`cancel()` requests cooperative cancellation; `join()` waits for completion; `invokeOnCompletion { }` runs a callback when it finishes.",
          "A parent Job stays in a 'completing' state until all its child Jobs finish — this is the mechanism behind 'a scope waits for its children'.",
          "`Deferred<T>` (returned by `async`) is a Job that also carries a result via `await()`.",
        ],
      },
    ],
  },
  {
    level: "junior",
    q: "What is a SupervisorJob and where do you encounter it?",
    a: [
      {
        t: "p",
        text: "**The concept**: normally, if one child coroutine fails with an unhandled exception, it cancels its parent and all sibling coroutines. A `SupervisorJob` changes that rule so children fail **independently** — one child throwing does *not* cancel its siblings or the parent. It isolates failures.",
      },
      {
        t: "code",
        title: "Independent children",
        code: `val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
scope.launch { error("fails") }   // this one fails
scope.launch { keepsWorking() }   // NOT cancelled by the sibling's failure`,
      },
      {
        t: "p",
        text: "**Where you encounter it**: `viewModelScope` and `lifecycleScope` both use a `SupervisorJob` internally — that's deliberate, so that one failed coroutine (say a failed analytics call) doesn't tear down the entire ViewModel's scope and cancel all its other work. You also use it explicitly via `supervisorScope { }` when launching several independent operations where one failing shouldn't stop the others (e.g. loading independent dashboard widgets). The one caveat: because a SupervisorJob doesn't propagate a child's error to the parent, each child must handle its own exceptions — otherwise the error goes uncaught.",
      },
    ],
  },
  {
    level: "junior",
    q: "If you cancel a scope, what happens to the coroutines running in it?",
    a: [
      {
        t: "p",
        text: "**They're all cancelled.** Cancellation propagates *down* the Job tree: cancelling a scope cancels its Job, which cancels every child coroutine, and their children, all the way down. This is the mechanism that makes lifecycle scopes safe — when a ViewModel is cleared, `viewModelScope` is cancelled, and every coroutine launched in it stops.",
      },
      {
        t: "p",
        text: "Two important details: (1) cancellation is *cooperative* — a coroutine only actually stops at a suspension point (or where it checks `isActive`/`ensureActive`), so a tight non-suspending loop must check cancellation manually to respond. (2) Once a scope is cancelled, it's dead — you can't launch new coroutines in it (they'll be cancelled immediately). This is why you don't cancel `viewModelScope` yourself; the framework does it at the right time. The takeaway: scope cancellation is the single lever that cleans up all associated work, which is exactly why binding coroutines to the right scope matters so much.",
      },
    ],
  },
  {
    level: "senior",
    q: "Walk through exactly how a failure propagates in a coroutine tree, and how SupervisorJob changes it.",
    a: [
      {
        t: "p",
        text: "**With a regular `Job`, failure propagates bidirectionally to tear down the subtree.** When a child throws an *unhandled* exception: (1) the child fails; (2) it propagates the exception *up* to its parent; (3) the parent, on receiving a child failure, cancels *itself*, which (4) cancels *all its other children* (siblings of the failed one); (5) the exception continues propagating up until it reaches the root, where it's handled by a `CoroutineExceptionHandler` or crashes. Net effect: one unhandled failure cancels the entire scope's subtree.",
      },
      {
        t: "list",
        items: [
          "**`SupervisorJob` breaks step 3→4**: a child failure is *not* propagated to the parent, so the parent isn't cancelled and siblings survive. Failure is contained to the failing child. But this means the exception has nowhere to auto-propagate — so it must be handled *at that child* (try/catch or a `CoroutineExceptionHandler` on that launch), or it's unhandled.",
          "**Cancellation ≠ failure**: this whole propagation is for *failures* (unhandled exceptions). If you *cancel* a child yourself (`child.cancel()`), that's a normal `CancellationException` — it does **not** propagate up and does **not** cancel siblings. Cancellation is an expected outcome; failure is exceptional. Conflating them is a common mistake.",
          "**Parent cancellation always cascades down** regardless of Job type: cancel the parent and all children die. SupervisorJob only affects the *upward* (child→parent) direction of *failures*, never downward cancellation.",
          "**Depth matters**: a `SupervisorJob` only supervises its *direct* children. If a supervised child launches its own children with a regular Job (the default), a failure among *those* grandchildren cancels their parent (the supervised child) — the supervisor at the top doesn't reach down to isolate them. You'd need another `supervisorScope` at that level.",
        ],
      },
      {
        t: "code",
        title: "The two behaviors side by side",
        code: `// Regular Job: sibling cancelled by failure
coroutineScope {
    launch { throw IOException() }     // fails
    launch { delay(1000); log("A") }   // CANCELLED, never logs "A"
}

// SupervisorJob: sibling survives (but the failing child needs its own handler)
supervisorScope {
    launch(handler) { throw IOException() } // isolated, handled by 'handler'
    launch { delay(1000); log("A") }        // runs, logs "A"
}`,
      },
    ],
  },
  {
    level: "senior",
    q: "Why does viewModelScope use a SupervisorJob, and what would go wrong with a regular Job?",
    a: [
      {
        t: "p",
        text: "**Because a ViewModel typically runs multiple independent coroutines, and one failing shouldn't kill all the others — or the scope itself.** A ViewModel might have a coroutine observing the database, another handling a button-triggered refresh, another logging analytics. These are independent. With a `SupervisorJob`, if the analytics coroutine throws, it fails alone; the database observation and everything else keep working.",
      },
      {
        t: "p",
        text: "**What would go wrong with a regular Job**: a regular Job propagates any child failure up to the scope, cancelling the scope and *all* its other coroutines. So a single unhandled exception in *any* coroutine — even a trivial fire-and-forget analytics call — would cancel the entire `viewModelScope`. After that, the scope is dead: the screen's data observation stops, and any new `viewModelScope.launch` would be cancelled immediately. The user's screen would silently stop updating because one unrelated coroutine failed. That's a terrible failure mode, so the framework uses a `SupervisorJob` to contain failures to the individual coroutine that caused them.",
      },
      {
        t: "list",
        items: [
          "**The tradeoff you inherit**: because `viewModelScope` supervises, a failing coroutine's exception won't propagate anywhere useful — it becomes uncaught (and can still crash via the default handler for `launch`). So *you* are responsible for handling errors inside each `viewModelScope.launch` (try/catch, or mapping failures into UI error state). The scope protects the *other* coroutines, not the failing one.",
          "**Consistency**: `lifecycleScope` uses a `SupervisorJob` for the same reason — UI-layer coroutines are independent, and one failing shouldn't tear down the screen's whole coroutine scope.",
        ],
      },
    ],
  },
  {
    level: "senior",
    q: "What's the difference between cancelling a coroutine and a coroutine failing with an exception, in terms of the tree?",
    a: [
      {
        t: "p",
        text: "**They're treated fundamentally differently by structured concurrency, and this trips people up constantly.** *Cancellation* is a normal, expected outcome — a coroutine being told 'stop, you're no longer needed'. *Failure* is an exceptional outcome — a coroutine throwing an unexpected exception. The Job tree responds to each differently:",
      },
      {
        t: "list",
        items: [
          "**Cancelling a child** (`child.cancel()`): raises a `CancellationException` inside that child, which unwinds it. It does **not** propagate to the parent, and does **not** cancel siblings. The parent and other children carry on. This is why you can cancel one specific coroutine (e.g. an outdated search) without disturbing anything else.",
          "**A child failing** (throwing a non-cancellation exception): with a regular Job, this *does* propagate up and cancel the parent and siblings (as covered above). Failure is 'something went wrong, tear down the related work'.",
          "**Why `CancellationException` is special**: the coroutine framework treats it as the signal for normal cancellation, not an error. That's why you must **never swallow a `CancellationException`** in a catch block — catching `Exception` broadly and not rethrowing it makes the coroutine think it recovered from cancellation, breaking the whole cancellation mechanism (the coroutine keeps running when it should stop). Always rethrow `CancellationException` (or catch specific exceptions only).",
        ],
      },
      {
        t: "code",
        title: "The catch that breaks cancellation",
        code: `// BUG: swallows CancellationException -> coroutine won't cancel properly
try { doWork() } catch (e: Exception) { log(e) }

// CORRECT: let CancellationException propagate
try { doWork() }
catch (e: CancellationException) { throw e }   // rethrow!
catch (e: Exception) { log(e) }`,
      },
      {
        t: "p",
        text: "**The mental model**: cancellation flows *down* (parent cancels children) and is a normal outcome that doesn't disturb siblings; failure (with a regular Job) flows *up* and takes down the subtree. `CancellationException` is the plumbing for cancellation and must never be swallowed. Understanding this distinction is what separates 'I use coroutines' from 'I understand coroutines'.",
      },
    ],
  },
];

export default qa;
