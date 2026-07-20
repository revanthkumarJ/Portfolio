// Structured Concurrency & Jobs — Content tab. Teaching-first.

const content = [
  {
    heading: "What structured concurrency means",
    blocks: [
      {
        t: "p",
        text: "**Structured concurrency** is the principle that coroutines form a **parent-child tree**, and a parent doesn't complete until all its children complete. Every coroutine launched inside another (or inside a scope) becomes a *child* of that scope's Job. This tree gives three guarantees that make coroutines safe: **no leaks** (children are tracked and can't be forgotten), **cancellation propagates** (cancel a parent → all children cancelled), and **errors propagate** (a child failing can cancel the parent and siblings). It's the opposite of raw threads/callbacks, where started work can be silently orphaned.",
      },
      {
        t: "list",
        items: [
          "**No orphans**: because a scope waits for its children, you can't accidentally leave a coroutine running after the code that started it has 'finished' — the scope literally won't complete until they do.",
          "**Cancellation flows down**: cancelling a scope or parent Job cancels the entire subtree beneath it.",
          "**Errors flow up (by default)**: an unhandled exception in a child cancels its parent, which cancels the other children — failures don't get lost.",
          "**Where it comes from**: builders (`launch`/`async`) are extensions on `CoroutineScope`, and each creates a child Job of the scope's Job — so the tree is built automatically as you launch coroutines.",
        ],
      },
    ],
  },
  {
    heading: "The Job — a handle and a tree node",
    blocks: [
      {
        t: "p",
        text: "A **`Job`** is the handle to a coroutine's lifecycle. `launch` returns one; every coroutine *has* one in its context. A Job is both a *control handle* (cancel it, wait for it) and a *node in the parent-child tree* (it has a parent Job and child Jobs).",
      },
      {
        t: "code",
        title: "Using a Job",
        code: `val job = scope.launch {
    doLongWork()
}

job.cancel()                 // request cancellation
job.join()                   // suspend until it finishes (or is cancelled)
job.cancelAndJoin()          // cancel then wait for it to actually stop

if (job.isActive) { }        // still running
if (job.isCancelled) { }     // cancelled
if (job.isCompleted) { }     // finished (normally or cancelled)

job.invokeOnCompletion { cause -> /* cleanup */ }`,
      },
      {
        t: "list",
        items: [
          "**States**: a Job moves through *New → Active → Completing → Completed*, or *Cancelling → Cancelled*. `isActive`, `isCancelled`, `isCompleted` expose this.",
          "**`join()`** suspends until the Job completes — used to wait for a coroutine. **`cancel()`** requests cancellation (cooperative). **`cancelAndJoin()`** does both.",
          "**A parent Job doesn't complete until all children complete** — this is the mechanism behind 'the scope waits for its children'. Even after the parent's own code finishes, it's in *Completing* until children are done.",
          "**`Deferred<T>`** (from `async`) is a `Job` that also carries a result via `await()`.",
        ],
      },
    ],
  },
  {
    heading: "The Job hierarchy and how failure propagates",
    blocks: [
      {
        t: "p",
        text: "Jobs form a tree. When something goes wrong, the *type* of Job at each level decides what happens — and this is the crux of both this topic and the exception-handling topic:",
      },
      {
        t: "list",
        items: [
          "**With a regular `Job`**: a child's uncaught exception *cancels its parent*, which *cancels all the parent's other children*, and the failure propagates up. One failure tears down the whole subtree. This is the default and is right when the work is interdependent.",
          "**Cancellation is different from failure**: cancelling a *child* (via `child.cancel()`) does **not** cancel the parent or siblings — cancellation is a normal, expected outcome. Only an *unhandled exception* (a failure) propagates upward and takes down siblings.",
          "**Parent cancellation cascades down**: cancel the parent and every descendant is cancelled — regardless of Job type.",
        ],
      },
      {
        t: "code",
        title: "One child's failure cancels its siblings (regular Job)",
        code: `coroutineScope {                 // regular Job
    launch { delay(100); error("boom") }   // fails
    launch { delay(1000); doWork() }        // CANCELLED because sibling failed
}   // coroutineScope rethrows the exception`,
      },
    ],
  },
  {
    heading: "SupervisorJob — isolating child failures",
    blocks: [
      {
        t: "p",
        text: "A **`SupervisorJob`** changes the failure rule: children fail **independently** — one child's exception does **not** cancel the parent or the siblings. It only changes *downward* propagation of failure (child → parent); parent cancellation still cascades to all children.",
      },
      {
        t: "code",
        title: "SupervisorJob keeps siblings alive",
        code: `val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

scope.launch { error("boom") }    // fails alone
scope.launch { doOtherWork() }    // KEEPS RUNNING — not cancelled by the sibling

// Same idea in a suspend function:
supervisorScope {
    launch { mightFail() }        // failure isolated
    launch { alsoIndependent() }  // survives
}`,
      },
      {
        t: "list",
        items: [
          "**Where you meet it**: `viewModelScope` uses a `SupervisorJob` — so one failed coroutine in a ViewModel doesn't tear down the whole ViewModel's scope. Same for `lifecycleScope`.",
          "**The catch**: with a SupervisorJob, a child's exception is *not* propagated to a parent, so it becomes 'uncaught' unless *that child* handles it (try/catch inside, or a `CoroutineExceptionHandler`). Independence means each child owns its error handling.",
          "**`SupervisorJob()` (the scope) vs `supervisorScope { }` (the suspend function)**: the former builds a long-lived scope; the latter creates a temporary supervised scope within a suspend function. Same failure semantics, different lifetime.",
          "**Placement subtlety**: a `SupervisorJob` only supervises the coroutines that are its *direct* children. If you `launch` a coroutine that itself `launch`es more, those grandchildren are under a *regular* Job (the child's) unless you nest another supervisor — so a supervisor at the top doesn't magically isolate failures deep in the tree.",
        ],
      },
    ],
  },
  {
    heading: "Putting it together — the mental model",
    blocks: [
      {
        t: "table",
        headers: ["Event", "Regular Job", "SupervisorJob"],
        rows: [
          ["Child throws uncaught exception", "cancels parent + all siblings", "isolated — siblings unaffected"],
          ["Child is cancelled (not failed)", "siblings unaffected", "siblings unaffected"],
          ["Parent is cancelled", "all children cancelled", "all children cancelled"],
          ["Who handles a child's error", "propagates up to scope", "the child itself must"],
        ],
      },
      {
        t: "note",
        text: "Interview-ready summary: \"Coroutines form a parent-child Job tree. A regular Job means a child failure cancels the parent and siblings (all-or-nothing); a SupervisorJob isolates child failures (independent). Parent cancellation always cascades to all children. Cancelling a child (vs it failing) never affects siblings. viewModelScope uses a SupervisorJob so one failure doesn't kill the whole ViewModel scope.\"",
      },
    ],
  },
];

export default content;
