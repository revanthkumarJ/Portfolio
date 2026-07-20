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
  {
    level: "junior",
    q: "What are the three core guarantees of structured concurrency?",
    a: [
      {
        t: "p",
        text: "Structured concurrency is captured by three guarantees that together make concurrent code predictable and leak-free: a parent waits for its children, cancellation propagates, and errors propagate. Every coroutine has a parent scope and can't outlive it.",
      },
      {
        t: "list",
        items: [
          "**Completion** — a scope/parent doesn't complete until *all* its child coroutines complete. No orphaned work escapes.",
          "**Cancellation** — cancelling a scope cancels all its coroutines (and their children), recursively.",
          "**Error propagation** — an unhandled failure in a child cancels its siblings and surfaces to the parent (unless a `SupervisorJob` isolates it).",
        ],
      },
      {
        t: "p",
        text: "The practical upshot: concurrency is *owned* by scopes, not free-floating. You can reason about a block of concurrent work as a single unit that starts, finishes, cancels, and fails as a whole — which is why coroutines don't leak the way raw threads/callbacks do.",
      },
      {
        t: "note",
        text: "Three guarantees: (1) completion — a parent waits for all children; (2) cancellation — cancelling a scope cancels all its coroutines; (3) error propagation — a child failure cancels siblings and reaches the parent (unless SupervisorJob). Result: concurrency is owned by scopes, so it's predictable and leak-free.",
      },
    ],
  },
  {
    level: "junior",
    q: "How is the coroutine parent-child Job tree formed?",
    a: [
      {
        t: "p",
        text: "When you `launch`/`async` inside a scope (or another coroutine), the new coroutine's `Job` becomes a *child* of the scope's Job (or the enclosing coroutine's Job). This happens automatically through context inheritance: the builder takes the parent context, and the child's new Job is linked to the parent Job. The result is a tree rooted at the scope's Job.",
      },
      {
        t: "code",
        title: "The tree",
        code: `val scope = CoroutineScope(Job())      // root Job
scope.launch {                          // child of root
    launch { }                          // grandchild
    async { }                           // grandchild
}`,
      },
      {
        t: "list",
        items: [
          "**Automatic linkage** — the builder reads the parent context and installs the new Job as a child of the parent Job.",
          "**Context inheritance** — the child inherits dispatcher/name/etc., but gets its *own* new Job (child of the parent's).",
          "**Rooted at the scope** — the scope's Job is the root; cancelling it cancels the whole tree.",
          "**Breaking the link** — passing a new `Job()` into a child builder detaches it from the tree (usually a bug).",
        ],
      },
      {
        t: "note",
        text: "launch/async inside a scope makes the new coroutine's Job a child of the scope's (or enclosing coroutine's) Job, via context inheritance — the child inherits dispatcher/name but gets its own new Job linked to the parent. The tree is rooted at the scope's Job. Passing a fresh Job() into a child detaches it (a bug).",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the 'Completing' state, and why does a parent wait for its children?",
    a: [
      {
        t: "p",
        text: "When a parent coroutine's own body finishes but it still has active children, its Job enters the *Completing* state — it's done with its own work but not yet Completed, because structured concurrency requires it to wait for all children first. Only when every child finishes does the parent transition to Completed.",
      },
      {
        t: "code",
        title: "Parent waits in Completing",
        code: `coroutineScope {
    launch { delay(1000); println("child done") }
    println("parent body done")   // parent now 'Completing', not finished
}   // coroutineScope returns only after the child completes (~1s)`,
      },
      {
        t: "list",
        items: [
          "**Completing** — body finished, awaiting children; not yet Completed.",
          "**Why** — guarantees no child outlives its parent scope (the completion guarantee).",
          "**Effect on `coroutineScope`/`launch`** — the enclosing scope doesn't return until children finish.",
          "**Failure during Completing** — if a child fails while the parent is Completing, the parent still fails/cancels accordingly.",
        ],
      },
      {
        t: "note",
        text: "'Completing' = the parent's own body finished but it has active children, so it waits (not yet Completed) — enforcing that no child outlives its parent. That's why a coroutineScope { } block returns only after all launched children finish, even if the block's last line already ran.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is the behavioral difference between Job() and SupervisorJob() in a scope?",
    a: [
      {
        t: "p",
        text: "With a regular `Job()`, failure propagates *bidirectionally* among the family: a child's failure cancels the parent and all siblings. With a `SupervisorJob()`, failure propagates *downward only*: a child failing doesn't cancel its siblings or the parent — each child fails independently. The choice depends on whether children are interdependent or independent.",
      },
      {
        t: "code",
        title: "Sibling isolation",
        code: `// Regular Job: child B failing cancels A and the scope
val scope = CoroutineScope(Job())
// SupervisorJob: child B failing leaves A running
val supervisor = CoroutineScope(SupervisorJob())
supervisor.launch { taskA() }   // keeps running
supervisor.launch { failB() }   // fails alone`,
      },
      {
        t: "list",
        items: [
          "**`Job()`** — one child's failure cancels siblings and the parent (all-or-nothing). Right when the tasks form one logical unit.",
          "**`SupervisorJob()`** — children fail independently; siblings continue. Right for independent tasks (UI screen sections, a pool of workers).",
          "**Still needs handling** — with `SupervisorJob`, each `launch`'s failure needs a local try/catch or a `CoroutineExceptionHandler`; it isn't swallowed automatically.",
          "**`supervisorScope { }`** — the scoped-function equivalent for a block.",
        ],
      },
      {
        t: "note",
        text: "Job(): a child failure cancels siblings + parent (all-or-nothing) — for interdependent tasks. SupervisorJob(): failures propagate down only, siblings survive — for independent tasks (screen sections, worker pools). SupervisorJob still needs per-child try/catch or a handler. supervisorScope{} is the block form.",
      },
    ],
  },
  {
    level: "senior",
    q: "Why is passing a new Job() into a child launch a structured-concurrency bug?",
    a: [
      {
        t: "p",
        text: "Passing `launch(Job()) { }` overrides the child's Job with a brand-new root Job that has *no parent link*. This detaches the coroutine from the scope's tree — the scope no longer waits for it, cancelling the scope no longer cancels it, and its failures no longer propagate. You've silently created an unstructured, leak-prone coroutine.",
      },
      {
        t: "code",
        title: "The detach bug",
        code: `// BUG: new Job() breaks the parent link — scope won't cancel this
scope.launch(Job()) { longWork() }
// Cancelling scope leaves longWork() running (leak)

// If you truly need independence within the scope, use SupervisorJob as the SCOPE's job,
// or a supervisorScope — not a detached Job on the child.`,
      },
      {
        t: "list",
        items: [
          "**New `Job()` = new root** — no parent, so structured guarantees don't apply to that child.",
          "**Symptoms** — scope cancellation doesn't stop it; it outlives the owner (leak); its exceptions don't reach the scope.",
          "**Intended alternative** — for isolating failures use `SupervisorJob` *as the scope's* Job or `supervisorScope { }`, which keep the parent link while changing failure propagation.",
          "**Rule** — don't override a child's Job unless you deliberately want to detach it (very rare).",
        ],
      },
      {
        t: "note",
        text: "launch(Job()) { } replaces the child's Job with a parentless root, detaching it from the tree: the scope won't wait for or cancel it and its failures don't propagate — an unstructured leak. To isolate failures, use SupervisorJob as the scope's Job or supervisorScope{} (which keep the parent link). Never override a child's Job unless you truly mean to detach.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does cancellation propagate down the tree, and when does cleanup run?",
    a: [
      {
        t: "p",
        text: "Cancelling a coroutine cancels *all* its descendants: the cancellation flows down the Job tree, and each coroutine's next suspension point throws `CancellationException`, unwinding it. `finally` blocks (and `try/finally` around resources) run during this unwinding, so cleanup happens — but any *suspending* cleanup must use `withContext(NonCancellable)` since the coroutine is already cancelled.",
      },
      {
        t: "code",
        title: "Cleanup during cancellation",
        code: `val job = scope.launch {
    try {
        useResource()      // cancelled here at a suspension point
    } finally {
        // runs during cancellation; suspend cleanup needs NonCancellable:
        withContext(NonCancellable) { saveProgress() }
        closeResource()
    }
}
job.cancel()   // cancels this coroutine AND its children`,
      },
      {
        t: "list",
        items: [
          "**Downward propagation** — cancelling a parent cancels every child/grandchild.",
          "**Thrown at suspension points** — a cancelled coroutine throws `CancellationException` at its next `delay`/suspend call.",
          "**`finally` runs** — resource cleanup executes during unwinding.",
          "**Suspending cleanup** — must be wrapped in `withContext(NonCancellable)` or it's immediately cancelled too.",
        ],
      },
      {
        t: "note",
        text: "Cancellation flows down the tree (parent cancel → all descendants); each coroutine throws CancellationException at its next suspension point and unwinds, running finally blocks. Suspending cleanup in finally must use withContext(NonCancellable) — otherwise it's cancelled immediately since the coroutine is already cancelled.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you run cleanup that must complete even during cancellation (NonCancellable)?",
    a: [
      {
        t: "p",
        text: "Wrap the suspending cleanup in `withContext(NonCancellable) { }`. A cancelled coroutine throws `CancellationException` at every suspension point, so a suspend call in a `finally` block would be cancelled before it runs. `NonCancellable` is a special Job that ignores cancellation, letting that critical cleanup finish.",
      },
      {
        t: "code",
        title: "Guaranteed cleanup",
        code: `try {
    stream()
} finally {
    withContext(NonCancellable) {
        flushBuffer()      // suspend cleanup that must complete
        db.saveState()
    }
}`,
      },
      {
        t: "list",
        items: [
          "**`withContext(NonCancellable)`** — makes the block immune to the ongoing cancellation so suspend cleanup runs.",
          "**Use sparingly** — only for genuinely must-finish cleanup (save progress, release a lock, flush). It defeats cancellation, so keep it short.",
          "**Non-suspending cleanup** — doesn't need it; plain `finally` code (closing a stream) runs fine.",
          "**Don't do long work in it** — it blocks timely cancellation; keep it minimal.",
        ],
      },
      {
        t: "note",
        text: "Wrap suspending finally-block cleanup in withContext(NonCancellable) { } — a cancelled coroutine throws at suspension points, so without it the cleanup is cancelled before running. Use it only for short, must-finish work (save progress, release lock, flush). Non-suspending cleanup runs in a normal finally without it.",
      },
    ],
  },
  {
    level: "junior",
    q: "Why is GlobalScope considered 'unstructured', and what breaks?",
    a: [
      {
        t: "p",
        text: "`GlobalScope` is a scope with no parent and no lifecycle — coroutines launched in it live for the entire process and aren't tied to any component. That breaks structured concurrency: nothing waits for them, nothing cancels them when a screen dies, and their failures don't propagate anywhere useful. The result is leaks and orphaned work.",
      },
      {
        t: "list",
        items: [
          "**No lifecycle** — `GlobalScope` coroutines run until they finish or the process dies; leaving a screen doesn't cancel them.",
          "**Leaks** — they hold references (the Activity/ViewModel), preventing garbage collection.",
          "**No propagation** — errors and cancellation don't flow to any owner.",
          "**Fix** — use a lifecycle-bound scope (`viewModelScope`/`lifecycleScope`) or a custom scope you cancel; reserve `GlobalScope` for truly app-lifetime work (very rare, and even then a purpose-built scope is clearer).",
        ],
      },
      {
        t: "note",
        text: "GlobalScope has no parent and no lifecycle, so its coroutines run for the whole process — nothing waits for, cancels, or receives failures from them. That's 'unstructured': leaks and orphaned work. Use viewModelScope/lifecycleScope or a cancellable custom scope instead; GlobalScope is almost never right.",
      },
    ],
  },
  {
    level: "senior",
    q: "What happens to sibling coroutines when one child throws (regular Job)?",
    a: [
      {
        t: "p",
        text: "With a regular `Job` (as in `coroutineScope`), one child throwing an unhandled exception cancels the *entire* scope: the exception propagates to the parent, which cancels all other children and then rethrows. This all-or-nothing behavior is correct when the children form one logical operation (if one part fails, the whole thing is invalid).",
      },
      {
        t: "code",
        title: "Sibling cancellation",
        code: `coroutineScope {
    val a = async { slowSuccess() }   // gets cancelled when b fails
    val b = async { throw IOException() }
    a.await(); b.await()              // coroutineScope rethrows the IOException
}`,
      },
      {
        t: "list",
        items: [
          "**One fails → all cancelled** — the parent cancels surviving siblings.",
          "**Exception rethrown** — `coroutineScope` propagates it to the caller, so a surrounding try/catch handles it.",
          "**Right for unit operations** — combining data where any failure invalidates the result.",
          "**Use `supervisorScope`** — if you want siblings to survive one child's failure.",
        ],
      },
      {
        t: "note",
        text: "With a regular Job (coroutineScope), one child's unhandled exception cancels all siblings and rethrows to the caller — all-or-nothing, correct when the children are one logical operation. If a failed part shouldn't invalidate the others, use supervisorScope to isolate failures.",
      },
    ],
  },
  {
    level: "senior",
    q: "When multiple children fail, which exception is reported?",
    a: [
      {
        t: "p",
        text: "The *first* exception to reach the parent is reported (thrown/handled); subsequent exceptions from other children are *suppressed* and attached to the first as suppressed exceptions (accessible via `Throwable.suppressed`). This avoids losing information while giving a single primary cause. `CancellationException`s from the cascade are ignored (they're the mechanism, not a failure).",
      },
      {
        t: "list",
        items: [
          "**First failure wins** — it becomes the reported cause and triggers cancellation of the rest.",
          "**Others suppressed** — additional real exceptions are added as `suppressed` on the first (not silently dropped).",
          "**`CancellationException` ignored** — the cancellations triggered in siblings aren't reported as failures.",
          "**Inspecting** — `exception.suppressed` lists the secondary failures if you need them.",
        ],
      },
      {
        t: "note",
        text: "The first exception to reach the parent is the reported cause; later failures from other children are attached to it as suppressed exceptions (Throwable.suppressed), not lost. The CancellationExceptions from the cascade are ignored. So you get one primary cause plus recoverable detail on the rest.",
      },
    ],
  },
  {
    level: "junior",
    q: "How does structured concurrency prevent memory leaks?",
    a: [
      {
        t: "p",
        text: "Because every coroutine is owned by a scope and cannot outlive it, cancelling the scope (which lifecycle-bound scopes do automatically) stops all its coroutines — releasing the references they hold. There's no way to accidentally start work that keeps running after its owner is gone, which is exactly how threads/callbacks/`AsyncTask` leaked.",
      },
      {
        t: "list",
        items: [
          "**Ownership** — coroutines belong to a scope; no free-floating work.",
          "**Automatic cancellation** — `viewModelScope`/`lifecycleScope` cancel on destroy, stopping coroutines and freeing captured references.",
          "**Contrast** — a raw `Thread` or callback can run forever holding an Activity reference; a scoped coroutine can't.",
          "**Caveat** — you *can* still leak by using `GlobalScope` or detaching with `Job()`; structured usage is what prevents leaks.",
        ],
      },
      {
        t: "note",
        text: "Every coroutine is owned by a scope and can't outlive it, so cancelling the scope (automatic for viewModelScope/lifecycleScope) stops all coroutines and releases their captured references — no orphaned work holding the Activity. You only reintroduce leaks by escaping structure (GlobalScope, detached Job()).",
      },
    ],
  },
  {
    level: "senior",
    q: "A coroutine starts background work that outlives the screen. Is that structured, and how do you fix it?",
    a: [
      {
        t: "p",
        text: "It depends on *which scope* launched it. If the work must finish regardless of the screen (an upload that should complete even if the user navigates away), a screen-scoped coroutine is the *wrong* owner — it'll be cancelled on navigation. The fix is to move that work to a longer-lived owner: WorkManager for guaranteed/deferrable work, or an application/repository-scoped coroutine — not to detach it with `GlobalScope`.",
      },
      {
        t: "list",
        items: [
          "**Diagnose the ownership** — should this work die with the screen or outlive it?",
          "**Should die with screen** — keep it in `viewModelScope`; cancellation on navigation is correct.",
          "**Must outlive the screen (must-complete)** — use `WorkManager` (guaranteed, survives process death) for real background tasks.",
          "**App-lifetime in-memory work** — an application-scoped `CoroutineScope` (owned by a singleton/DI, cancelled on app teardown) — deliberate and cancellable, unlike `GlobalScope`.",
          "**Anti-pattern** — `GlobalScope.launch` to 'keep it alive'; it's unstructured and unmanaged.",
        ],
      },
      {
        t: "note",
        text: "Ask who should own the work. If it should die with the screen, viewModelScope (cancel-on-navigate) is right. If it must complete regardless, that's the wrong scope: use WorkManager (guaranteed, survives process death) or a deliberate application-scoped CoroutineScope — not GlobalScope, which is unstructured and unmanaged.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is invokeOnCompletion, and how does it relate to the Job tree?",
    a: [
      {
        t: "p",
        text: "`Job.invokeOnCompletion { cause -> }` registers a callback that fires when the Job completes — normally (`cause == null`), by cancellation (`cause is CancellationException`), or by failure (`cause` is the exception). It's a low-level hook for cleanup or observing a coroutine's end without joining, and it fires only after the Job (and its children) are done.",
      },
      {
        t: "code",
        title: "Completion callback",
        code: `val job = scope.launch { work() }
job.invokeOnCompletion { cause ->
    when (cause) {
        null -> log("completed")
        is CancellationException -> log("cancelled")
        else -> log("failed: \${cause.message}")
    }
}`,
      },
      {
        t: "list",
        items: [
          "**Fires on any completion** — success, cancellation, or failure; the `cause` distinguishes them.",
          "**After children finish** — consistent with the Job completing only once its subtree does.",
          "**Non-suspending** — the handler runs synchronously and can't suspend; keep it light.",
          "**Uses** — resource cleanup, logging, decrementing counters, unregistering — without needing to `join`.",
        ],
      },
      {
        t: "note",
        text: "invokeOnCompletion { cause -> } fires when a Job completes: cause null (success), CancellationException (cancelled), or the exception (failed). It runs after the Job's subtree finishes, is non-suspending (keep it light), and is handy for cleanup/logging without joining.",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you inspect a Job's children, and when is that useful?",
    a: [
      {
        t: "p",
        text: "A `Job` exposes its `children` (a `Sequence<Job>`), letting you iterate active child coroutines. It's rarely needed in app code, but useful for diagnostics (how many children are running), for cancelling all children while keeping the scope alive (`cancelChildren()`), or for waiting on them collectively.",
      },
      {
        t: "code",
        title: "Working with children",
        code: `val parent = scope.coroutineContext[Job]!!
println("active children: \${parent.children.count()}")
parent.children.forEach { it.cancel() }         // cancel each child
parent.cancelChildren()                          // idiomatic: cancel all, keep scope usable`,
      },
      {
        t: "list",
        items: [
          "**`job.children`** — a sequence of the current child Jobs.",
          "**`cancelChildren()`** — cancels all children but leaves the parent/scope active (reusable), unlike `cancel()`.",
          "**Diagnostics** — count/inspect running coroutines when debugging leaks or hangs.",
          "**Rarely needed** — structured concurrency usually handles this; reach for it in tooling/edge cases.",
        ],
      },
      {
        t: "note",
        text: "Job.children is a Sequence<Job> of active children — useful for diagnostics or bulk operations. cancelChildren() cancels them all while keeping the scope usable (vs cancel(), which kills the scope). Rarely needed in app code; handy for debugging leaks/hangs or resetting a scope.",
      },
    ],
  },
  {
    level: "senior",
    q: "From the parent's perspective, how does a child completing normally differ from being cancelled?",
    a: [
      {
        t: "p",
        text: "A child that *completes normally* (or is cancelled) doesn't affect the parent — the parent just no longer waits on it. A child that *fails* (throws a non-cancellation exception) cancels the parent and siblings (with a regular Job). Cancellation is treated as a normal, expected end; failure is exceptional. This is why `CancellationException` is special-cased and never propagates as a failure.",
      },
      {
        t: "list",
        items: [
          "**Normal completion** — the child finishes; parent proceeds; no cascade.",
          "**Cancellation** — the child is cancelled (e.g. via `cancel()` or the cascade); treated like a controlled stop, not a failure; doesn't cancel the parent upward.",
          "**Failure** — a real exception; cancels parent and siblings (regular Job) and propagates.",
          "**Implication** — never wrap coroutine code in a broad `catch (e: Exception)` that swallows `CancellationException`, or you turn a controlled cancellation into a broken coroutine that thinks it's still active.",
        ],
      },
      {
        t: "note",
        text: "Normal completion and cancellation don't cascade to the parent (the parent just stops waiting); only a real failure cancels parent+siblings (regular Job). CancellationException is a controlled stop, not a failure — which is why you must rethrow it rather than swallow it in a broad catch.",
      },
    ],
  },
  {
    level: "junior",
    q: "Does withContext create a child coroutine in the tree?",
    a: [
      {
        t: "p",
        text: "`withContext` doesn't start a new *concurrent* coroutine — it runs its block in the *same* coroutine but with a modified context (typically a different dispatcher), suspending the caller until the block returns. It participates in the tree as the current coroutine (still cancellable, still a child of its parent); it just switches context for that section, then switches back.",
      },
      {
        t: "list",
        items: [
          "**Not concurrent** — `withContext` is sequential; the caller waits for it. Contrast `launch`/`async`, which run concurrently.",
          "**Context switch** — usually a dispatcher change (`withContext(IO)`), returning to the previous dispatcher after.",
          "**Same cancellation** — the block is part of the current coroutine, so cancelling the coroutine cancels it.",
          "**Returns a value** — `val x = withContext(IO) { load() }` — unlike `launch`.",
        ],
      },
      {
        t: "note",
        text: "withContext runs its block in the SAME coroutine with a changed context (usually a dispatcher), sequentially — the caller suspends until it returns, then switches back. It's not a new concurrent child (unlike launch/async); it shares the current coroutine's cancellation and returns a value.",
      },
    ],
  },
  {
    level: "senior",
    q: "How is a coroutine launched from viewModelScope rooted in the tree?",
    a: [
      {
        t: "p",
        text: "`viewModelScope`'s context contains a `SupervisorJob` (created for the ViewModel) plus `Dispatchers.Main.immediate`. A coroutine you `launch` becomes a child of that `SupervisorJob`. When the ViewModel is cleared, `viewModelScope` cancels that root Job, cancelling all children. The `SupervisorJob` root means one launched coroutine failing doesn't cancel the others.",
      },
      {
        t: "list",
        items: [
          "**Root = `SupervisorJob`** — so independent `viewModelScope.launch` calls don't cancel each other on failure.",
          "**Children of the root** — each `launch`/`async` you start is a child, cancelled when the ViewModel is cleared.",
          "**Cancelled in `onCleared()`** — automatic teardown of the whole subtree.",
          "**Failure handling still needed** — because it's a `SupervisorJob`, an unhandled `launch` exception isn't swallowed; handle it (try/catch or handler) or it crashes via the default handler.",
        ],
      },
      {
        t: "note",
        text: "viewModelScope = SupervisorJob + Main.immediate. Your launched coroutines are children of that SupervisorJob (so one failing doesn't cancel the others), and the whole subtree is cancelled in onCleared(). Because it's a SupervisorJob, unhandled launch exceptions still need local try/catch or a handler.",
      },
    ],
  },
  {
    level: "senior",
    q: "What is coroutineScope's rethrow behavior versus supervisorScope's?",
    a: [
      {
        t: "p",
        text: "`coroutineScope { }` rethrows the first child failure to its caller (after cancelling siblings), so a surrounding `try/catch` catches it. `supervisorScope { }` does *not* propagate child failures to the caller — each child's failure is that child's own concern (handle it locally or via a handler), and the scope completes normally even if a child failed.",
      },
      {
        t: "code",
        title: "Rethrow vs isolate",
        code: `// coroutineScope: rethrows -> caught here
try { coroutineScope { launch { throw E() } } } catch (e: Exception) { /* caught */ }

// supervisorScope: NOT rethrown to the caller
supervisorScope {
    launch { try { risky() } catch (e: Exception) { handleLocally(e) } }   // handle per child
}`,
      },
      {
        t: "list",
        items: [
          "**`coroutineScope`** — child failure cancels siblings and rethrows to the caller (all-or-nothing, catchable outside).",
          "**`supervisorScope`** — child failures are isolated; the scope doesn't rethrow them, so handle each child's error inside it.",
          "**Choosing** — `coroutineScope` for a combined operation; `supervisorScope` for independent children you handle individually.",
        ],
      },
      {
        t: "note",
        text: "coroutineScope rethrows the first child failure (after cancelling siblings) so an outer try/catch catches it. supervisorScope does NOT rethrow child failures — handle each child's error locally (try/catch or handler); the scope completes even if a child failed. Combined op → coroutineScope; independent children → supervisorScope.",
      },
    ],
  },
  {
    level: "junior",
    q: "What's the difference between the 'Cancelling' and 'Cancelled' Job states?",
    a: [
      {
        t: "p",
        text: "After you call `cancel()` (or a failure triggers it), the Job enters *Cancelling* — it's winding down: running `finally`/cleanup, cancelling children, but not yet fully stopped. Once all that completes, it becomes *Cancelled* (a terminal state). During Cancelling, `isActive` is false but `isCompleted` is also false; only in Cancelled is `isCompleted` true.",
      },
      {
        t: "list",
        items: [
          "**Cancelling** — cancellation requested; cleanup and child cancellation in progress; `isActive == false`, `isCompleted == false`, `isCancelled == true`.",
          "**Cancelled** — terminal; everything (including children and cleanup) finished; `isCompleted == true`.",
          "**Why it matters** — a coroutine can still run cleanup code during Cancelling; suspend calls there throw unless `NonCancellable`.",
          "**Observing** — `invokeOnCompletion` fires when it reaches the terminal Cancelled state.",
        ],
      },
      {
        t: "note",
        text: "Cancelling = cancellation requested, cleanup/child-cancellation in progress (isActive false, isCompleted false, isCancelled true). Cancelled = terminal, all done (isCompleted true). Cleanup runs during Cancelling; suspend cleanup there needs NonCancellable. invokeOnCompletion fires at the terminal state.",
      },
    ],
  },
  {
    level: "senior",
    q: "Trace what structured concurrency does when a user navigates away mid-load.",
    a: [
      {
        t: "p",
        text: "Say a ViewModel launched a data load with concurrent children, and the user leaves the screen. If the ViewModel is destroyed (e.g. the back stack entry is popped), `viewModelScope` is cancelled in `onCleared()`. That cancellation cascades down the tree: the load coroutine and all its `async` children get `CancellationException` at their next suspension point, in-flight network calls are cancelled (if the client supports it), `finally` cleanup runs, and everything terminates — no orphaned work, no updating a dead UI.",
      },
      {
        t: "list",
        items: [
          "**Trigger** — ViewModel cleared → `viewModelScope.cancel()` (its root SupervisorJob cancelled).",
          "**Cascade** — every child coroutine is cancelled; suspension points throw `CancellationException`.",
          "**Network** — Retrofit/OkHttp calls tied to the coroutine are cancelled (the request is abandoned).",
          "**Cleanup** — `finally` blocks run (close resources); suspend cleanup needs `NonCancellable`.",
          "**Result** — no leaked coroutines, no state update after teardown; the whole subtree is gone.",
          "**Config change caveat** — on rotation the ViewModel is *retained*, so `viewModelScope` is *not* cancelled and the load continues — the desired behavior.",
        ],
      },
      {
        t: "note",
        text: "Navigate-away that destroys the VM → viewModelScope cancelled in onCleared → cancellation cascades to all child coroutines (CancellationException at suspension points), in-flight network calls abandoned, finally cleanup runs, subtree terminates — no orphaned work or dead-UI updates. On mere rotation the VM is retained, so the load continues (correct).",
      },
    ],
  },
  {
    level: "senior",
    q: "How do you make two coroutines in one scope where cancelling one doesn't cancel the other?",
    a: [
      {
        t: "p",
        text: "Cancelling one child never cancels its *siblings* in the first place — `job.cancel()` only cancels that Job and its descendants, not others in the scope. The scenario people worry about is a *failure* cancelling siblings; to prevent that, use a `SupervisorJob`/`supervisorScope` so a sibling's failure is isolated. For explicit cancellation of one task, just cancel that task's Job.",
      },
      {
        t: "code",
        title: "Independent siblings",
        code: `val scope = CoroutineScope(SupervisorJob())   // failures isolated
val a = scope.launch { taskA() }
val b = scope.launch { taskB() }
a.cancel()   // cancels ONLY a; b keeps running (true even with a regular Job)
// SupervisorJob additionally ensures a *failure* in a won't cancel b`,
      },
      {
        t: "list",
        items: [
          "**Explicit cancel is already isolated** — `a.cancel()` doesn't touch `b`.",
          "**Failure isolation needs SupervisorJob** — otherwise `a` *failing* (not being cancelled) would cancel `b` and the scope.",
          "**Per-task handles** — keep each `Job` to cancel tasks individually.",
        ],
      },
      {
        t: "note",
        text: "Cancelling one child (a.cancel()) never cancels siblings — that's already isolated. What cancels siblings is a *failure* under a regular Job; use SupervisorJob/supervisorScope to isolate failures too. Keep per-task Job handles to cancel tasks individually.",
      },
    ],
  },
  {
    level: "junior",
    q: "What is a Job, in one clear picture, and what can it do?",
    a: [
      {
        t: "p",
        text: "A `Job` is the handle and lifecycle representation of a coroutine (or a scope). It doesn't hold a result (that's `Deferred`), but it tracks state, forms the parent-child tree, and gives you control: cancel it, wait for it, observe completion. Every `launch` returns one; every scope has one in its context.",
      },
      {
        t: "list",
        items: [
          "**Lifecycle** — tracks New/Active/Completing/Completed/Cancelling/Cancelled via `isActive`/`isCancelled`/`isCompleted`.",
          "**Control** — `cancel()`, `cancelAndJoin()`, `join()`, `start()` (for lazy), `invokeOnCompletion { }`.",
          "**Hierarchy** — links to a parent and has `children`; the basis of structured concurrency.",
          "**Not a result** — for a value use `Deferred` (from `async`), which *is* a Job plus a result.",
        ],
      },
      {
        t: "note",
        text: "A Job is a coroutine's (or scope's) lifecycle handle: it tracks state (isActive/isCancelled/isCompleted), gives control (cancel/join/start/invokeOnCompletion), and forms the parent-child tree that powers structured concurrency. It carries no result — Deferred (from async) is a Job that also has a value.",
      },
    ],
  },
  {
    level: "senior",
    q: "How does structured concurrency make coroutine code easier to test?",
    a: [
      {
        t: "p",
        text: "Because a scope waits for all its children, a test can run an operation and know that when it returns, *all* the concurrent work it spawned has completed — no dangling background coroutines to race against. Combined with `runTest`'s virtual clock and injected test dispatchers, this makes concurrent code deterministic: you advance the scheduler and everything the operation launched finishes predictably.",
      },
      {
        t: "list",
        items: [
          "**Deterministic completion** — `coroutineScope`/`viewModelScope` work is done when the operation completes; `advanceUntilIdle()` runs all scheduled coroutines.",
          "**No orphaned work** — you don't have to hunt for background coroutines the test didn't await; structure guarantees ownership.",
          "**Injected dispatchers** — replace `Main`/`IO` with test dispatchers sharing the `testScheduler` so children run on the virtual clock.",
          "**Clear boundaries** — testing an operation = testing a well-scoped unit, not a web of independent threads.",
        ],
      },
      {
        t: "note",
        text: "A scope waits for all children, so when an operation returns in a test, its spawned work is done — no dangling coroutines to race. With runTest's virtual clock + injected test dispatchers (shared testScheduler) and advanceUntilIdle(), concurrent code becomes deterministic and unit-testable as a scoped whole.",
      },
    ],
  },
  {
    level: "junior",
    q: "If you cancel a scope, can you still launch new coroutines in it?",
    a: [
      {
        t: "p",
        text: "No — once a scope is cancelled (`scope.cancel()`), its Job is in a cancelled state, and any `launch`/`async` on it produces an already-cancelled coroutine that never runs its body. The scope is effectively dead. If you need to stop current work but reuse the scope, cancel the *children* instead (`coroutineContext.cancelChildren()`), which leaves the scope's Job active.",
      },
      {
        t: "list",
        items: [
          "**After `scope.cancel()`** — the scope is unusable; new coroutines are born cancelled and don't execute.",
          "**Reuse instead** — `scope.coroutineContext.cancelChildren()` cancels running coroutines but keeps the scope alive for future launches.",
          "**Lifecycle scopes** — `viewModelScope`/`lifecycleScope` are cancelled at end-of-life and shouldn't be reused (their owner is gone).",
          "**Design implication** — create a fresh scope for a new lifecycle rather than reviving a cancelled one.",
        ],
      },
      {
        t: "note",
        text: "No — after scope.cancel() its Job is cancelled, so new launches are born cancelled and never run; the scope is dead. To stop work but keep the scope, use coroutineContext.cancelChildren() (children cancelled, scope stays active). Don't revive a cancelled scope — create a fresh one for a new lifecycle.",
      },
    ],
  },
];

export default qa;
